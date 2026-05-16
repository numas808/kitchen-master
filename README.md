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
レシピ提案アプリ ホーム画面 要件定義
1. 目的

ユーザーが「今日何を作るか」を迷わず決められることを目的とする。
入力負荷を最小化し、直感的な操作でレシピ選択まで到達できるUIを提供する。

2. 画面構成（モバイル想定）
2.1 ヘッダーエリア
アプリ名（例：Recipe AI）
右上にユーザーアイコン（マイページ導線）
2.2 メインタイトル
テキスト：「今日どうする？」
サブテキスト：「あなたにぴったりのレシピを提案します」
2.3 条件テキスト入力エリア（最重要）
プレースホルダ例：
「例：10分以内で作れるヘルシーなレシピ」
自由入力形式（自然言語OK）
右側に生成アイコン（AI提案トリガー）

目的：

フィルタでは表現できない曖昧な要望を受け取る
2.4 クイックフィルタ（チップ形式）
横並び（スクロール可）
初期表示：
おすすめ（デフォルト選択）
時短
ヘルシー
がっつり

仕様：

単一選択 or 複数選択（実装時に決定）
視覚的に軽いUI（アウトラインベース）
2.5 おすすめレシピセクション
セクションヘッダー
「おすすめレシピ」
右側に「別のレシピを見る（再生成）」導線
レシピカード（最重要UI）

表示内容：

大きな料理画像（最優先）
レシピ名（例：鶏の照り焼き）
簡単な説明（1行）
メタ情報：
調理時間（例：15分）
難易度（例：かんたん）
人数（例：2人分）
食材タグ（チップ形式）：
例：鶏もも肉、しょうゆ、みりん +2
CTAボタン：
「このレシピを見る」
プライマリボタン（色あり・最も目立つ）

仕様：

カードは1件大きく表示（迷わせない）
スワイプ or ボタンで次のレシピへ
2.6 冷蔵庫導線（最下部）
コンポーネント
カード形式（横長）
アイコン（冷蔵庫）
タイトル：「冷蔵庫をのぞく」
サブテキスト：「ある食材からレシピを提案します」

目的：

食材ベースの探索導線
ホームの補助機能として配置
3. デザイン方針
3.1 全体
背景：白（#FFFFFF）
スタイル：海外プロダクト風のミニマルUI
余白重視（情報密度を下げる）
3.2 カラー
メインカラー：オレンジ系（CTA用）
サブカラー：グレー（テキスト・境界）
アクセント最小限

### パレット
- メイン: `#F28A1D`
- サブ: `#F0F21D`
- サブのサブ: `#F2201D`

このプロジェクトでは現在、緑色だったUI要素をメインカラーのオレンジ系で統一しています。
3.3 タイポグラフィ
見出し：大きめ・太め
本文：可読性重視
情報の階層を明確に
3.4 コンポーネント設計
角丸（やや大きめ）
シャドウは最小限
フラット寄り
4. UX方針
入力しなくても使える（デフォルトでレシピ表示）
1画面で完結（スクロールのみ）
「選択肢を減らす」設計
思考させない（直感操作）
