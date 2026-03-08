# TODO - Phase 2: 地形生成

## 優先度：高
（全て完了）

## 優先度：中
- [ ] 島の底面の浮遊感調整（3Dノイズパラメータのチューニング）
- [ ] 描画距離によるパフォーマンス調整

## 優先度：低

## 完了済み
- [x] 初期セットアップ（make_projectによるプロジェクト構造作成）
- [x] Phase 0: プロジェクト基盤の構築
- [x] Phase 1: ワールドとキャラクター
- [x] simplex-noise インストール
- [x] constants.ts にPhase 2パラメータ追加
- [x] BlockTypes.ts 作成（ブロックID定義、ブロック属性管理）
- [x] BlockTextures.ts 変更（頂点カラーベースに切替、全ブロック色定義）
- [x] Chunk.ts 作成（16×16×16のボクセルデータ構造）
- [x] ChunkMesher.ts 作成（頂点カラーベースメッシュ生成、隣接面カリング）
- [x] BiomeManager.ts 作成（草原・森・砂漠の3バイオーム定義）
- [x] TerrainGenerator.ts 作成（Simplex Noise地形生成、植生配置）
- [x] WorldManager.ts 作成（チャンク管理、ロード/アンロード、cannon-es衝突体）
- [x] FlatIsland.ts 削除、Game.ts をWorldManager統合に変更
- [x] PlayerController.ts 変更（スポーン位置を動的設定）
