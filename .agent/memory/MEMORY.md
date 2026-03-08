# MEMORY

## プロジェクト概要
- ボクセル浮島探索ゲーム「CCCraft」のWebプロトタイプ
- Vite + TypeScript + Three.js + cannon-es
- GDD.mdが正の仕様書。Phase順に段階的開発
- Phase 0〜3完了、Phase 4以降未着手

## 学習した知識・教訓

### cannon-es物理エンジン
- デフォルトの摩擦が水平移動を大幅に阻害する。プレイヤーの直接速度制御には`defaultContactMaterial.friction = 0`が必須
- ジャンプ（Y方向）は摩擦の影響を受けないため、水平移動だけ遅い場合は摩擦を疑う

### PlayerModel設計
- パーツサイズの合計（脚1.5+体1.5+頭1.0=4.0）とPLAYER_TOTAL_HEIGHT（2.0）が不一致になりやすい
- スケーリングで全高を合わせ、モデル原点を足元に置くのが扱いやすい
- 物理ボディの底面 = モデルの足元で位置同期する
- 6面マテリアルで各パーツの面ごとにテクスチャを変えられる（正面ボタン、背面シンプル等）

### テクスチャシステム
- Phase 3で頂点カラー → テクスチャアトラス+UVマッピングに移行
- BlockTextures.tsがアトラス生成(getUV)とパーティクル用色(getColor)の両方を提供
- NearestFilterでドット感を演出
- ChunkMesherは共有マテリアル1つ（アトラステクスチャ）で全チャンク描画

### 遮蔽フェード（カメラ→プレイヤー間）
- チャンクメッシュ単位の半透明は粗すぎる（床まで透ける）
- **シェーダーベース**が正解: onBeforeCompileでフラグメントシェーダーに視線距離判定を注入
- 視線からの距離でフェード（カメラ側radius=1.6、プレイヤー側radius=0.8、線形補間）

### 入力システム（iPad互換）
- 画面左右分割はNG（右半分のブロックを操作できない）
- クリックvsドラッグ判別方式: mousedown→mousemoveの移動量でDRAG_THRESHOLD(5px)判定
- ドラッグ=カメラ回転、クリック=ブロック操作（短押し=設置、長押し300ms=破壊）

### GDDからの変更点
- カメラ俯角: デフォルト35度（GDD当初は50度）
- カメラ距離: 10（GDD当初は15）
- 通常=走り(7)、Shift=歩き(4)（GDD当初は逆）
- 空中ジャンプ有効（飛行可能）
- ブロック操作: クリックvsドラッグ方式（GDD当初は左クリック/右クリック）
- 操作範囲: 5ブロック（一時10に拡大したが戻した）

### ファイル構成（Phase 3完了時点）
- src/blocks/BlockTextures.ts — テクスチャアトラス生成+UV管理+パーティクル用色
- src/blocks/BlockInteraction.ts — DDAレイキャスト、破壊/設置、パーティクル連携
- src/effects/BreakParticles.ts — 破壊エフェクト（進捗連動+バースト）
- src/inventory/ — Inventory, ItemStack
- src/ui/ — HUD, InventoryUI, DebugLog
- src/world/ChunkMesher.ts — テクスチャアトラス+UV+遮蔽シェーダー
- src/player/PlayerModel.ts — 6面テクスチャ付きキャラモデル
