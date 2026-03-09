# HANDOFF - 2026-03-09 19:25

## 使用ツール
Claude Code (Opus 4.6)

## 現在のタスクと進捗
- [x] Phase 0: プロジェクト基盤の構築（コミット済み）
- [x] Phase 1: ワールドとキャラクター（コミット済み: efa4ecf）
- [x] Phase 2: 地形生成（コミット済み: d409c8a）
- [x] Phase 3: ブロック操作（コミット済み: 3350a02, 7da1a24）
- [x] Phase 4: 飛行モード & 探索（実装完了・ドキュメント更新済み・**未コミット**）
- [ ] Phase 5: 戦闘システム（未着手）

## 試したこと・結果

### Phase 4: 飛行モード（グライダーからの方針転換）
- **当初のグライダー実装**: GDD通りに滑空+上昇気流+スタミナで実装 → ユーザーが「空飛べてよくない？」と方針転換
- **自由飛行モードに変更**: Gキートグルで反重力浮遊、カメラ方向に3D移動。スタミナ・上昇気流は削除
- **飛行起動ジャンプ**: toggle()内の速度設定がupdate()で即上書きされる → `_needsLaunch`フラグパターンで解決
- **重力相殺**: `body.force.y = body.mass * GRAVITY`で毎フレーム反力（body.type変更より安全）
- **腕アニメーション方向**: rotation.zの正負を複数回調整（左腕=負、右腕=正が正解）
- **腕羽ばたき速度**: 2.5→4→8と段階的に高速化（ユーザー「もっとバタバタ速く」）
- **腕リセット**: 飛行→通常遷移で`rotation.z *= 0.8`のdecayで滑らかに戻す

### ドキュメント更新（本セッション最後の作業）
- `.spec/SPEC.md` — Phase 4仕様を「グライダー」→「飛行モード」に全面改訂
- `.spec/TODO.md` — Phase 4全タスク完了済みに更新
- `.spec/KNOWLEDGE.md` — 飛行モード実装の技術知見を追加
- `GDD.md` — グライダー→飛行モード、カメラピッチ範囲(-60〜80度)、接地ジャンプに更新
- `.agent/memory/MEMORY.md` — Phase 4完了時点に更新

## 次のセッションで最初にやること
1. Phase 4の全変更をコミットする（多数ファイル変更+新規ファイルあり、未コミット状態）
2. ユーザーにPhase 5（戦闘システム）に進むか確認
3. Phase 5に進む場合はPLAN→SPEC→TODOのSDD手順に従う

## 注意点・ブロッカー
- **Phase 4は未コミット**: 変更ファイル多数（constants.ts, Game.ts, PlayerController.ts, PlayerModel.ts, InputManager.ts, CameraController.ts, HUD.ts, SPEC.md, TODO.md）+ 新規ファイル（GliderController.ts, RespawnOverlay.ts）
- **削除済みファイル**: src/world/UpdraftSystem.ts, src/effects/UpdraftParticles.ts（グライダー方式廃止に伴い削除）
- **GliderController.ts**: 名前は「Glider」だが実質は飛行モードコントローラー（リネームは未実施）
- **HUD.tsの破壊的変更**: コンストラクタが`InputManager`を第2引数に受け取るようになった
- **GDD.mdの残存矛盾**: クラフトレシピにグライダーが取り消し線で残っている。将来整理が必要
