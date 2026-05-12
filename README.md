# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## infomation

概要
「料理版Tinder」コンセプトの献立決定Webアプリ（MVP）を新規構築しました。

技術スタック
項目	技術
フレームワーク	React + TypeScript (Vite)
スタイリング	Tailwind CSS
アニメーション	Framer Motion
ルーティング	React Router v6
データ永続化	localStorage（バックエンドなし）
画面構成
ルート	画面
/	スワイプ画面（メイン）
/match	気になったレシピ一覧
/recipe/:id	レシピ詳細
/shopping/:id	買い物リスト
/settings	設定
実装内容
スワイプUI: Framer Motion のドラッグジェスチャーで右スワイプ（❤️ 食べたい）/ 左スワイプ（✕ いらない）。ボタン操作でも代替可能
レシピデータ: 22種類の日本料理をローカルTSファイルで管理（肉じゃが、唐揚げ、親子丼など）
フィルタリング: 設定画面の好み・NG食材・調理時間でレシピを絞り込み
設定画面: 食材の好み（肉/魚/野菜/卵/麺/ご飯）、NG食材、調理時間上限
買い物リスト: 材料のチェックリスト（チェック状態をlocalStorageに保存）
localStorage永続化: 設定・セッションいいね・買い物チェック状態を保存
ビルド確認
✓ built in 616ms (0 TypeScript errors)
ローカル起動方法
npm install
npm run dev

バックエンドAPI（Web検索プロキシ）

- 別ターミナルで `npm run dev:api` を起動
- フロントの `/api/*` は Vite Proxy で `http://localhost:8787` に転送

環境変数（バックエンド側）

- `SEARCH_PROVIDER`（推奨: `serpapi`）
- `SERPAPI_KEY`

旧Google CSE互換（既存利用者向け）

- `SEARCH_PROVIDER=google`
- `GOOGLE_SEARCH_API_KEY`
- `GOOGLE_SEARCH_CX`

※ キーをブラウザへ露出させないため、`VITE_` プレフィックスではなくバックエンド環境変数として管理

補足: Custom Search JSON API は新規利用が停止されているため、デフォルト実装は SerpAPI を利用する構成にしています。

## AI推薦アーキテクチャ（新フロー）

1. 日次入力（`/plan`）
  - 今日の要望（自然文）
  - 冷蔵庫の中身（食材リスト）
2. コンテキスト統合
  - 日次入力
  - 既存の恒久設定（好みカテゴリ / NG食材 / 調理時間）
3. AI整備 + 検索
  - `src/services/recommendationEngine.ts` でクエリを正規化
  - `SearchProvider` 抽象で「検索層」を分離
  - 現在は `LocalWebSearchProvider`（ローカル疑似検索）を実装
  - 将来はこの層を外部Web検索APIへ差し替え
4. 推薦表示（`/match`）
  - スコア上位レシピを数件表示
  - 推薦理由と検索インサイトを表示

### 主要データ保存（localStorage）

- `km_settings`: 恒久設定
- `km_daily_input`: その日の入力
- `km_ai_recommendations`: 推薦結果セッション

## 画面設計（更新）

トップページ（`/`）をダッシュボード化。

- レシピ検索機能
- 家の食材ストック管理
- 直近のレシピ履歴

タブ切り替えで以下を表示。

- ストック
- お気に入り
- 履歴

追加の保存キー。

- `km_stock_items`: 家の食材ストック
- `km_favorite_recipe_ids`: お気に入り
- `km_recipe_history`: 閲覧履歴