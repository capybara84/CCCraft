# MEMORY

## プロジェクト概要
- ボクセル浮島探索ゲーム「CCCraft」のWebプロトタイプ
- Vite + TypeScript + Three.js + cannon-es
- GDD.mdが正の仕様書。Phase順に段階的開発

## 学習した知識・教訓

### cannon-es物理エンジン
- デフォルトの摩擦が水平移動を大幅に阻害する。プレイヤーの直接速度制御には`defaultContactMaterial.friction = 0`が必須
- ジャンプ（Y方向）は摩擦の影響を受けないため、水平移動だけ遅い場合は摩擦を疑う

### PlayerModel設計
- パーツサイズの合計（脚1.5+体1.5+頭1.0=4.0）とPLAYER_TOTAL_HEIGHT（2.0）が不一致になりやすい
- スケーリングで全高を合わせ、モデル原点を足元に置くのが扱いやすい
- 物理ボディの底面 = モデルの足元で位置同期する

### GDDからの変更点
- カメラ上下回転: GDDでは縦角度固定だが、ユーザー要望で上下も可動に変更（10〜80度）
- 移動加速度: GDD未定義、60/40（加速/減速）に設定
- カメラ回転速度: 0.01（初期値0.003は遅すぎた）

### Phase 1で作成したファイル構成
- src/blocks/BlockTextures.ts — プロシージャルテクスチャ（Canvas API）
- src/world/FlatIsland.ts — フラット浮島（Phase 2でチャンクシステムに置き換え予定）
- src/player/ — InputManager, PlayerModel, PlayerController, CameraController
- src/Game.ts — 全体統合、物理ワールド、ゲームループ
