// ブロックIDの定義
export enum BlockId {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  SAND = 6,
  PLANKS = 7,
  STONE_BRICK = 8,
  CRAFTING_TABLE = 9,
  DARK_GRASS = 10, // 森バイオーム用
  DARK_LEAVES = 11, // 森バイオーム用
  CACTUS = 12,
  DEAD_WOOD = 13, // 枯れ木
}

// ブロックが不透明かどうか
export function isOpaque(id: BlockId): boolean {
  return id !== BlockId.AIR;
}

// ブロックが固体かどうか（衝突判定用）
export function isSolid(id: BlockId): boolean {
  return id !== BlockId.AIR;
}
