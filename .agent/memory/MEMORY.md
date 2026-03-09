# MEMORY

## プロジェクト概要
- ボクセル浮島探索ゲーム「CCCraft」のWebプロトタイプ
- Vite + TypeScript + Three.js + cannon-es
- GDD.mdが正の仕様書。Phase順に段階的開発
- Phase 0〜4完了、Phase 5以降未着手

## 学習した知識・教訓

### cannon-es物理エンジン
- デフォルトの摩擦が水平移動を大幅に阻害する。プレイヤーの直接速度制御には`defaultContactMaterial.friction = 0`が必須
- 飛行中の重力相殺: `body.force.y = body.mass * GRAVITY` で反力を毎フレーム加える（body.typeやgravity変更より安全）
- 飛行解除時に `body.force.y = 0` で即座に重力復帰

### PlayerModel設計
- パーツサイズの合計とPLAYER_TOTAL_HEIGHTが不一致になりやすい → スケーリングで全高を合わせる
- 6面マテリアルで各パーツの面ごとにテクスチャを変えられる
- 腕rotation.z: 負=左広がり、正=右広がり。0.8程度が自然な広がり
- 飛行→通常遷移: `rotation.z *= 0.8` のdecayで滑らかリセット

### 飛行モード実装パターン
- toggle()で速度設定 → update()が同フレームで上書きする問題 → `_needsLaunch`フラグで解決
- `_rising`状態で自然な放物線ジャンプ → 最高点到達後に浮遊へ移行
- 移動方向: 通常モードと同じyaw回転式を使わないとズレる

### テクスチャシステム
- Phase 3で頂点カラー → テクスチャアトラス+UVマッピングに移行
- NearestFilterでドット感を演出
- ChunkMesherは共有マテリアル1つで全チャンク描画

### 遮蔽フェード（カメラ→プレイヤー間）
- シェーダーベースが正解: onBeforeCompileでフラグメントシェーダーに注入
- カメラ側radius=1.6、プレイヤー側radius=0.8、線形補間

### 入力システム（iPad互換）
- クリックvsドラッグ判別方式（5px閾値）
- ドラッグ=カメラ回転、短押し=設置、長押し300ms=破壊

### GDDからの変更点
- カメラ俯角35度、距離10
- 通常=走り(7)、Shift=歩き(4)
- 接地ジャンプのみ（飛行モードで自由飛行できるため空中ジャンプ不要）
- グライダー → 飛行モード（Gトグル、カメラ方向3D移動、スタミナ/上昇気流なし）
- カメラピッチ範囲: -60〜80度

### ファイル構成（Phase 4完了時点）
- src/player/GliderController.ts — 飛行制御（反重力浮遊、自然ジャンプ起動）
- src/player/PlayerModel.ts — 6面テクスチャ + updateFlying()飛行アニメ
- src/ui/RespawnOverlay.ts — フェードアウト→リスポーン→フェードイン
- src/ui/HUD.ts — ホットバー + FLY/JUMPボタン（タッチ対応）
- src/blocks/BlockInteraction.ts — DDAレイキャスト + 8段階クラックオーバーレイ
- src/blocks/BlockTextures.ts — テクスチャアトラス + パーティクル色
- src/effects/BreakParticles.ts — 破壊エフェクト
