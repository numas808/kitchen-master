import { useEffect, useState } from 'react';
import type { StockCategory, StockItem, StockLocation } from '../types';
import { fetchSharedData, updateSharedData } from '../services/sharedData';

const STORAGE_KEY = 'km_stock_items';

function createLegacyStockItem(name: string, index: number): StockItem {
  const now = new Date().toISOString();

  return {
    id: `legacy-${index}-${name}`,
    name,
    location: 'fridge',
    category: 'food',
    purchaseDate: '',
    expiryDate: '',
    note: '',
    createdAt: now,
    stockLevel: 100,
  };
}

function isStockLocation(value: unknown): value is StockLocation {
  return value === 'fridge' || value === 'freezer';
}

function isStockCategory(value: unknown): value is StockCategory {
  return value === 'drink' || value === 'food' || value === 'vegetable';
}

function normalizeStockItem(value: unknown, index: number): StockItem | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? createLegacyStockItem(trimmed, index) : null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<StockItem>;
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) {
    return null;
  }

  return {
    id: typeof item.id === 'string' && item.id ? item.id : `stock-${index}-${name}`,
    name,
    location: isStockLocation(item.location) ? item.location : 'fridge',
    category: isStockCategory(item.category) ? item.category : 'food',
    purchaseDate: typeof item.purchaseDate === 'string' ? item.purchaseDate : '',
    expiryDate: typeof item.expiryDate === 'string' ? item.expiryDate : '',
    note: typeof item.note === 'string' ? item.note : '',
    createdAt: typeof item.createdAt === 'string' && item.createdAt ? item.createdAt : new Date().toISOString(),
    stockLevel: typeof item.stockLevel === 'number' && item.stockLevel >= 0 && item.stockLevel <= 100 ? item.stockLevel : 100,
  };
}

function readInitialStock(): StockItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item, index) => normalizeStockItem(item, index))
      .filter((item): item is StockItem => item !== null);
  } catch {
    return [];
  }
}

export function useStock() {
  const [stockItems, setStockItems] = useState<StockItem[]>(readInitialStock);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const shared = await fetchSharedData();
        if (!active) {
          return;
        }

        if (Array.isArray(shared.stockItems)) {
          setStockItems(shared.stockItems);
        }
      } catch {
        // keep local cache fallback
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    updateSharedData({ stockItems }).catch(() => {
      // keep local cache even if server sync fails
    });
  }, [isHydrated, stockItems]);

  return [stockItems, setStockItems] as const;
}
