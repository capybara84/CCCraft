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

// ブロック属性の定義
export interface BlockInfo {
  name: string;
  hardness: number; // 破壊時間（秒）。0は破壊不可
  drop: BlockId; // 破壊時のドロップブロックID
  stackable: boolean; // スタック可能か
}

// ブロック情報テーブル
const BLOCK_INFO: Record<number, BlockInfo> = {
  [BlockId.DIRT]: { name: '土', hardness: 0.5, drop: BlockId.DIRT, stackable: true },
  [BlockId.GRASS]: { name: '草', hardness: 0.5, drop: BlockId.DIRT, stackable: true },
  [BlockId.STONE]: { name: '石', hardness: 1.5, drop: BlockId.STONE, stackable: true },
  [BlockId.WOOD]: { name: '木の幹', hardness: 1.0, drop: BlockId.PLANKS, stackable: true },
  [BlockId.LEAVES]: { name: '葉', hardness: 0.3, drop: BlockId.AIR, stackable: true }, // ドロップなし（苗木は後で）
  [BlockId.SAND]: { name: '砂', hardness: 0.5, drop: BlockId.SAND, stackable: true },
  [BlockId.PLANKS]: { name: '木材', hardness: 1.0, drop: BlockId.PLANKS, stackable: true },
  [BlockId.STONE_BRICK]: { name: '石レンガ', hardness: 2.0, drop: BlockId.STONE_BRICK, stackable: true },
  [BlockId.CRAFTING_TABLE]: { name: 'クラフト台', hardness: 1.0, drop: BlockId.CRAFTING_TABLE, stackable: true },
  [BlockId.DARK_GRASS]: { name: '暗い草', hardness: 0.5, drop: BlockId.DIRT, stackable: true },
  [BlockId.DARK_LEAVES]: { name: '暗い葉', hardness: 0.3, drop: BlockId.AIR, stackable: true },
  [BlockId.CACTUS]: { name: 'サボテン', hardness: 0.5, drop: BlockId.CACTUS, stackable: true },
  [BlockId.DEAD_WOOD]: { name: '枯れ木', hardness: 0.5, drop: BlockId.DEAD_WOOD, stackable: true },
};

// ブロック情報を取得
export function getBlockInfo(id: BlockId): BlockInfo | undefined {
  return BLOCK_INFO[id];
}

// ブロックが不透明かどうか
export function isOpaque(id: BlockId): boolean {
  return id !== BlockId.AIR;
}

// ブロックが固体かどうか（衝突判定用）
export function isSolid(id: BlockId): boolean {
  return id !== BlockId.AIR;
}

// ブロック名を取得
export function getBlockName(id: BlockId): string {
  return BLOCK_INFO[id]?.name ?? '不明';
}
