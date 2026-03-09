# SPEC - Phase 4: 飛行モード & 探索

## 概要
Gキーで飛行モードをトグルし、カメラ方向に自由に3D飛行できるようにする。奈落リスポーンも実装する。

## 機能要件

### 1. 飛行モード（Gキートグル）
- Gキーで飛行モードのON/OFFをトグル
- 飛行ON時にジャンプ（通常ジャンプと同じ自然な放物線）→最高点から浮遊
- 飛行OFF時に通常の重力が復帰し落下する
- 飛行中はcannon-esの重力を反力で相殺（body.force.y = mass * GRAVITY）

### 2. 飛行中の移動
- WASD入力 + カメラyaw/pitchに基づく3D移動
- 水平速度: 12ブロック/秒（GLIDER_HORIZONTAL_SPEED）
- Space: 上昇（飛行中のジャンプは上昇動作）
- Shift: 減速（歩行速度）
- カメラの縦角度範囲を拡大（-60度〜80度）で急降下・急上昇が可能

### 3. 飛行アニメーション
- 腕を横に広げて羽ばたくモーション（updateFlying）
- 脚をだらんと垂らしてゆっくり揺れる
- 飛行解除時に腕が自然に元のポーズに戻る（rotation.z *= 0.8 decay）

### 4. 奈落落下 → リスポーン
- Y=-10以下に到達でリスポーン発動
- スポーン位置にリスポーン
- フェードアウト→リスポーン→フェードインの演出（0.5秒）

### 5. HUDボタン（タッチ対応）
- 右下に「FLY」「JUMP」の円形ボタン
- 飛行中は「FLY」→「LAND」に切り替わり、ボーダー色が青に変化
- マウス・タッチ両対応

### 6. ジャンプ制限
- 通常モード: 接地時のみジャンプ可能（velocity.y < 0.5で判定）
- 飛行モード: Spaceで上昇（ジャンプ制限なし）

## 非機能要件
- TypeScript strict mode
- マジックナンバーは全て constants.ts に定義

## 作成・変更したファイル

```
src/
├── constants.ts                ← GLIDER_HORIZONTAL_SPEED, ABYSS_Y, RESPAWN_FADE_DURATION追加
├── Game.ts                     ← RespawnOverlay統合、奈落判定、cameraPitch連携
├── player/
│   ├── GliderController.ts     ← 飛行制御（新規）
│   ├── PlayerController.ts     ← 飛行モード統合、接地ジャンプ
│   ├── PlayerModel.ts          ← updateFlying()追加、腕リセットdecay
│   ├── CameraController.ts     ← getPitchRad()追加、ピッチ範囲拡大
│   └── InputManager.ts         ← Gキー、タッチボタン入力追加
└── ui/
    ├── HUD.ts                  ← FLY/JUMPボタン追加
    └── RespawnOverlay.ts       ← リスポーンフェード演出（新規）
```

## 完了基準
- Gキーでジャンプ→浮遊に入り、カメラ方向に自由飛行できる
- 奈落に落ちるとフェード演出付きでリスポーンする
- HUDにFLY/JUMPボタンが表示され、タッチで操作できる
