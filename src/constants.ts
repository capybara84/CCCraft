// === レンダリング ===
export const SKY_COLOR = 0x87ceeb;
export const CAMERA_FOV = 60;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;

// === カメラ ===
export const CAMERA_PITCH_ANGLE = 35; // 俯角（度）
export const CAMERA_DISTANCE = 10; // プレイヤーからの距離（ブロック）
export const CAMERA_LERP_FACTOR = 0.1; // スムーズ追従の補間係数
export const CAMERA_ROTATE_SPEED = 0.01; // マウスドラッグ回転速度
export const CAMERA_PITCH_MIN = 10; // ピッチ最小角度（度）
export const CAMERA_PITCH_MAX = 80; // ピッチ最大角度（度）

// === プレイヤー移動 ===
export const PLAYER_WALK_SPEED = 4; // 歩行速度（ブロック/秒）
export const PLAYER_RUN_SPEED = 7; // 走行速度（ブロック/秒）
export const PLAYER_ACCELERATION = 60; // 水平加速度（ブロック/秒²）
export const PLAYER_DECELERATION = 40; // 水平減速度（ブロック/秒²）
export const PLAYER_JUMP_HEIGHT = 1.25; // ジャンプ高さ（ブロック）
export const GRAVITY = 20; // 重力加速度（ブロック/秒²）

// === プレイヤーモデル ===
export const PLAYER_HEAD_SIZE = { w: 1, h: 1, d: 1 };
export const PLAYER_BODY_SIZE = { w: 1, h: 1.5, d: 0.5 };
export const PLAYER_ARM_SIZE = { w: 0.5, h: 1.5, d: 0.5 };
export const PLAYER_LEG_SIZE = { w: 0.5, h: 1.5, d: 0.5 };
export const PLAYER_TOTAL_HEIGHT = 2; // 全高（ブロック）

// プレイヤーカラー
export const PLAYER_COLOR_HEAD = 0xffcc99; // 肌色
export const PLAYER_COLOR_BODY = 0x3366cc; // 青
export const PLAYER_COLOR_ARM = 0xffcc99; // 肌色
export const PLAYER_COLOR_LEG = 0x1a1a4e; // 濃紺

// 歩行アニメーション
export const PLAYER_WALK_ANIM_SPEED = 8;
export const PLAYER_WALK_ANIM_AMPLITUDE = 0.6;
export const PLAYER_RUN_ANIM_SPEED = 12;
export const PLAYER_RUN_ANIM_AMPLITUDE = 0.8;

// === チャンクシステム ===
export const CHUNK_SIZE = 16; // チャンクの1辺（ブロック）
export const RENDER_DISTANCE = 4; // 描画距離（チャンク数）※パフォーマンス調整後に増やす

// === 浮島生成 ===
export const ISLAND_MIN_Y = 20; // 島の生成最低Y
export const ISLAND_MAX_Y = 100; // 島の生成最高Y

// 島の定義（位置、半径、バイオーム）
export const ISLAND_CONFIGS = [
  { x: 0, z: 0, y: 40, radius: 30, biome: 'grassland' as const },
  { x: 80, z: 40, y: 55, radius: 20, biome: 'forest' as const },
  { x: -60, z: 70, y: 35, radius: 25, biome: 'desert' as const },
  { x: 50, z: -60, y: 65, radius: 12, biome: 'grassland' as const },
  { x: -40, z: -50, y: 45, radius: 15, biome: 'forest' as const },
] as const;

// 地形ノイズパラメータ
export const TERRAIN_NOISE_SCALE = 0.02; // 地形ノイズのスケール
export const TERRAIN_OCTAVES = 4; // オクターブ数
export const TERRAIN_PERSISTENCE = 0.5; // パーシスタンス
export const TERRAIN_LACUNARITY = 2.0; // ラクナリティ
export const TERRAIN_HEIGHT_SCALE = 8; // 地形の高低差（ブロック）
export const ISLAND_SURFACE_DEPTH = 5; // 地表からの深さ（ブロック）

// 底面削りノイズ
export const BOTTOM_NOISE_SCALE = 0.08; // 底面ノイズのスケール
export const BOTTOM_CARVE_DEPTH = 4; // 底面削りの最大深さ

// 植生
export const TREE_DENSITY = 0.02; // 木の密度（0〜1）
export const TREE_NOISE_THRESHOLD = 0.7; // 木を生やすノイズ閾値
export const OAK_TRUNK_HEIGHT_MIN = 3;
export const OAK_TRUNK_HEIGHT_MAX = 5;
export const GIANT_TREE_TRUNK_HEIGHT_MIN = 5;
export const GIANT_TREE_TRUNK_HEIGHT_MAX = 8;
export const CACTUS_HEIGHT_MIN = 3;
export const CACTUS_HEIGHT_MAX = 4;

// === ブロックテクスチャ ===
export const TEXTURE_SIZE = 16;

// ブロックカラー
export const BLOCK_GRASS_TOP_COLOR = '#4a8c3f';
export const BLOCK_GRASS_SIDE_COLOR = '#6b4226';
export const BLOCK_GRASS_SIDE_STRIPE_COLOR = '#4a8c3f';
export const BLOCK_DIRT_COLOR = '#6b4226';
export const BLOCK_DARK_GRASS_TOP_COLOR = '#2d6b2e'; // 森の暗い草
export const BLOCK_DARK_GRASS_SIDE_COLOR = '#5a3720'; // 森の暗い草側面
export const BLOCK_SAND_COLOR = '#d4b96e'; // 砂
export const BLOCK_WOOD_COLOR = '#8b6914'; // 木の幹
export const BLOCK_WOOD_RING_COLOR = '#a07828'; // 木の幹の年輪
export const BLOCK_LEAVES_COLOR = '#2d8c2d'; // 葉
export const BLOCK_DARK_LEAVES_COLOR = '#1a6b1a'; // 森の暗い葉
export const BLOCK_CACTUS_COLOR = '#2d7a2d'; // サボテン
export const BLOCK_DEAD_WOOD_COLOR = '#8b7355'; // 枯れ木

// === ブロック操作 ===
export const BLOCK_INTERACT_RANGE = 5; // 操作範囲（プレイヤーからの距離、ブロック）
export const BLOCK_HIGHLIGHT_COLOR = 0xffffff; // ハイライト色
export const BLOCK_HIGHLIGHT_OPACITY = 0.3; // ハイライト透明度

// === インベントリ ===
export const HOTBAR_SLOTS = 8; // ホットバースロット数
export const BACKPACK_SLOTS = 24; // バックパックスロット数
export const MAX_STACK_SIZE = 64; // 最大スタック数

// === HUD ===
export const HOTBAR_SLOT_SIZE = 48; // ホットバースロットサイズ（px）
export const HOTBAR_SLOT_GAP = 4; // スロット間隔（px）
export const HOTBAR_SELECTED_COLOR = '#ffcc00'; // 選択中スロットの枠色
export const HOTBAR_BG_COLOR = 'rgba(0, 0, 0, 0.6)'; // スロット背景色

// === 物理 ===
export const PHYSICS_TIMESTEP = 1 / 60;
export const GROUND_CONTACT_THRESHOLD = 0.1;
