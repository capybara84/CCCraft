# TODO - Phase 1: ワールドとキャラクター

## 優先度：高
（全て完了）

## 優先度：中
（全て完了）

## 優先度：低

## 完了済み
- [x] 初期セットアップ（make_projectによるプロジェクト構造作成）
- [x] Phase 0: プロジェクト基盤の構築
- [x] cannon-es インストール
- [x] constants.ts にPhase 1パラメータ追加（移動速度、重力、カメラ設定、島サイズ等）
- [x] InputManager.ts 作成（キーボード・マウス入力の一元管理）
- [x] BlockTextures.ts 作成（草・土ブロックのプロシージャルテクスチャ生成）
- [x] FlatIsland.ts 作成（半径30のフラット浮島メッシュ + cannon-es衝突体）
- [x] PlayerModel.ts 作成（ボクセルキャラクターモデル + 歩行アニメーション）
- [x] PlayerController.ts 作成（cannon-es物理ボディ、移動・ジャンプ制御）
- [x] CameraController.ts 作成（3rdパーソンカメラ、マウスドラッグ回転、スムーズ追従）
- [x] Game.ts 改修（cannon-es物理ワールド初期化、各コンポーネント統合、updateループ）
- [x] 走行（Shift長押し）対応
- [x] 水平方向の加速/減速（即座に最高速にならない）
