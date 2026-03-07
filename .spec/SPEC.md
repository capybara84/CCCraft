# SPEC - Phase 0: プロジェクト基盤の構築

## 機能要件
- `npm run dev` でVite開発サーバーが起動する
- ブラウザで青い空（スカイブルーの背景）が描画される
- Three.jsのシーン・カメラ・レンダラーが正常に初期化される
- ウィンドウリサイズに対応する

## 非機能要件
- TypeScript strict mode
- マジックナンバーは全て `src/constants.ts` に定義
- コメントは日本語

## 技術構成
- **ビルドツール**: Vite
- **言語**: TypeScript (strict mode)
- **レンダリング**: Three.js (WebGLRenderer)
- **座標系**: Y-up（Three.jsデフォルト）
- **1ワールドユニット = 1ブロック**

## 作成するファイル（最小限）

```
CCCraft/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── GDD.md              ← 既存
├── CLAUDE.md            ← 既存（GDDへの参照を追加）
├── AGENTS.md            ← 既存
└── src/
    ├── main.ts          ← エントリーポイント
    ├── constants.ts     ← 全数値パラメータ
    └── Game.ts          ← シーン・カメラ・レンダラー初期化、ゲームループ
```

## constants.ts に定義するパラメータ（Phase 0分）
- `SKY_COLOR`: スカイブルーの色コード
- `CAMERA_FOV`: 60
- `CAMERA_NEAR`: 0.1
- `CAMERA_FAR`: 1000

## 完了基準
- `npm run dev` でブラウザに青い空が描画される
