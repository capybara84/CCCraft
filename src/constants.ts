// === レンダリング ===
export const SKY_COLOR = 0x87ceeb;
export const CAMERA_FOV = 60;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;

// === カメラ ===
export const CAMERA_PITCH_ANGLE = 50; // 俯角（度）
export const CAMERA_DISTANCE = 15; // プレイヤーからの距離（ブロック）
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
// 各パーツのサイズ（ブロック単位）
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
export const PLAYER_WALK_ANIM_SPEED = 8; // 振りの速さ
export const PLAYER_WALK_ANIM_AMPLITUDE = 0.6; // 振りの角度（ラジアン）
export const PLAYER_RUN_ANIM_SPEED = 12; // 走行時の振りの速さ
export const PLAYER_RUN_ANIM_AMPLITUDE = 0.8; // 走行時の振りの角度

// === 浮島 ===
export const ISLAND_RADIUS = 30; // 半径（ブロック）
export const ISLAND_HEIGHT_Y = 40; // 島のY座標
export const ISLAND_THICKNESS = 5; // 島の厚さ（ブロック）

// === ブロックテクスチャ ===
export const TEXTURE_SIZE = 16; // テクスチャ解像度（px）

// ブロックカラー
export const BLOCK_GRASS_TOP_COLOR = '#4a8c3f'; // 草の上面
export const BLOCK_GRASS_SIDE_COLOR = '#6b4226'; // 草の側面（茶色）
export const BLOCK_GRASS_SIDE_STRIPE_COLOR = '#4a8c3f'; // 草の側面上部（緑ライン）
export const BLOCK_DIRT_COLOR = '#6b4226'; // 土

// === 物理 ===
export const PHYSICS_TIMESTEP = 1 / 60;
export const GROUND_CONTACT_THRESHOLD = 0.1; // 接地判定閾値
