import { BlockId } from '../blocks/BlockTypes';

// バイオームの種類
export type BiomeType = 'grassland' | 'forest' | 'desert';

// バイオームの特性定義
export interface BiomeConfig {
  surfaceBlock: BlockId; // 地表ブロック
  subSurfaceBlock: BlockId; // 地表下ブロック
  trunkBlock: BlockId; // 幹ブロック
  leavesBlock: BlockId; // 葉ブロック
  treeDensity: number; // 木の密度
  trunkHeightMin: number;
  trunkHeightMax: number;
  leafRadius: number; // 葉の半径
  hasDecorations: boolean; // サボテンや枯れ木など
}

import {
  OAK_TRUNK_HEIGHT_MIN,
  OAK_TRUNK_HEIGHT_MAX,
  GIANT_TREE_TRUNK_HEIGHT_MIN,
  GIANT_TREE_TRUNK_HEIGHT_MAX,
  CACTUS_HEIGHT_MIN,
  CACTUS_HEIGHT_MAX,
} from '../constants';

// バイオームの特性を管理するクラス
export class BiomeManager {
  private configs: Record<BiomeType, BiomeConfig> = {
    grassland: {
      surfaceBlock: BlockId.GRASS,
      subSurfaceBlock: BlockId.DIRT,
      trunkBlock: BlockId.WOOD,
      leavesBlock: BlockId.LEAVES,
      treeDensity: 0.015,
      trunkHeightMin: OAK_TRUNK_HEIGHT_MIN,
      trunkHeightMax: OAK_TRUNK_HEIGHT_MAX,
      leafRadius: 2,
      hasDecorations: false,
    },
    forest: {
      surfaceBlock: BlockId.DARK_GRASS,
      subSurfaceBlock: BlockId.DIRT,
      trunkBlock: BlockId.WOOD,
      leavesBlock: BlockId.DARK_LEAVES,
      treeDensity: 0.05,
      trunkHeightMin: GIANT_TREE_TRUNK_HEIGHT_MIN,
      trunkHeightMax: GIANT_TREE_TRUNK_HEIGHT_MAX,
      leafRadius: 3,
      hasDecorations: false,
    },
    desert: {
      surfaceBlock: BlockId.SAND,
      subSurfaceBlock: BlockId.SAND,
      trunkBlock: BlockId.CACTUS,
      leavesBlock: BlockId.AIR, // サボテンには葉がない
      treeDensity: 0.008,
      trunkHeightMin: CACTUS_HEIGHT_MIN,
      trunkHeightMax: CACTUS_HEIGHT_MAX,
      leafRadius: 0,
      hasDecorations: true,
    },
  };

  getConfig(biome: BiomeType): BiomeConfig {
    return this.configs[biome];
  }
}
