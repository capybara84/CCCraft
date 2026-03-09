# TODO - Phase 4: 飛行モード & 探索

## 完了済み

### Phase 0〜3
- [x] Phase 0〜3 全タスク
- [x] 破壊進捗バーの表示（対象ブロック上にオーバーレイ）
- [x] InventoryUI.ts（Eキーで開閉するバックパックUI）

### Phase 4: 飛行モード
- [x] constants.ts に飛行関連パラメータ追加（GLIDER_HORIZONTAL_SPEED, ABYSS_Y, RESPAWN_FADE_DURATION）
- [x] GliderController.ts 新規作成（飛行トグル、反重力浮遊、自然ジャンプ起動）
- [x] InputManager.ts にGキー（飛行トグル）+ タッチボタン入力追加
- [x] PlayerController.ts に飛行モード統合、接地ジャンプ制限
- [x] PlayerModel.ts に飛行アニメーション追加（updateFlying、腕リセットdecay）
- [x] CameraController.ts にgetPitchRad()追加、ピッチ範囲拡大（-60〜80度）
- [x] HUD.ts にFLY/JUMPボタン追加（タッチ対応）
- [x] RespawnOverlay.ts 新規作成（フェードアウト→リスポーン→フェードイン）
- [x] Game.ts に全システム統合（奈落判定、cameraPitch連携、ボタンUI）

## 次のフェーズ
- [ ] Phase 5: 戦闘システム
