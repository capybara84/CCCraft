import { createNoise2D, createNoise3D } from 'simplex-noise';
import { BlockId } from '../blocks/BlockTypes';
import { BiomeManager, BiomeType } from './BiomeManager';
import { Chunk } from './Chunk';
import {
  CHUNK_SIZE,
  ISLAND_CONFIGS,
  TERRAIN_NOISE_SCALE,
  TERRAIN_OCTAVES,
  TERRAIN_PERSISTENCE,
  TERRAIN_LACUNARITY,
  TERRAIN_HEIGHT_SCALE,
  ISLAND_SURFACE_DEPTH,
  BOTTOM_NOISE_SCALE,
  BOTTOM_CARVE_DEPTH,
  TREE_NOISE_THRESHOLD,
} from '../constants';

// 島の定義
interface IslandDef {
  x: number;
  z: number;
  y: number;
  radius: number;
  biome: BiomeType;
}

// Simplex Noiseを使った地形生成クラス
export class TerrainGenerator {
  private noise2D: ReturnType<typeof createNoise2D>;
  private noise3D: ReturnType<typeof createNoise3D>;
  private treeNoise: ReturnType<typeof createNoise2D>;
  private biomeManager: BiomeManager;
  private islands: IslandDef[];

  constructor(seed?: number) {
    // シード付きの擬似乱数生成器
    const rng = this.createSeededRng(seed ?? 12345);
    this.noise2D = createNoise2D(rng);
    this.noise3D = createNoise3D(rng);
    this.treeNoise = createNoise2D(rng);
    this.biomeManager = new BiomeManager();
    this.islands = [...ISLAND_CONFIGS];
  }

  // チャンクにブロックデータを書き込む
  generateChunk(chunk: Chunk): void {
    for (const island of this.islands) {
      this.generateIslandInChunk(chunk, island);
    }
  }

  // 指定の島のデータをチャンクに書き込む
  private generateIslandInChunk(chunk: Chunk, island: IslandDef): void {
    const config = this.biomeManager.getConfig(island.biome);

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const wx = chunk.worldX + lx;
          const wy = chunk.worldY + ly;
          const wz = chunk.worldZ + lz;

          // 島の中心からの水平距離
          const dx = wx - island.x;
          const dz = wz - island.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          // 島の範囲外ならスキップ
          if (dist > island.radius + 2) continue;

          // 島の高さマップ（2Dノイズ）
          const heightOffset = this.fbm2D(
            wx * TERRAIN_NOISE_SCALE,
            wz * TERRAIN_NOISE_SCALE
          ) * TERRAIN_HEIGHT_SCALE;

          // 島の端に向かってフォールオフ
          const falloff = this.smoothFalloff(dist, island.radius);
          if (falloff <= 0) continue;

          const surfaceY = Math.floor(island.y + heightOffset * falloff);

          // 底面削り（3Dノイズ）
          const bottomCarve = Math.abs(
            this.noise3D(wx * BOTTOM_NOISE_SCALE, wy * BOTTOM_NOISE_SCALE, wz * BOTTOM_NOISE_SCALE)
          ) * BOTTOM_CARVE_DEPTH;
          const bottomY = Math.floor(surfaceY - ISLAND_SURFACE_DEPTH * falloff + bottomCarve);

          // このブロックが島の範囲内かチェック
          if (wy > surfaceY || wy < bottomY) continue;

          // 既に他の島のブロックがある場合はスキップ
          if (chunk.getBlock(lx, ly, lz) !== BlockId.AIR) continue;

          // ブロック種の決定
          if (wy === surfaceY) {
            chunk.setBlock(lx, ly, lz, config.surfaceBlock);
          } else if (wy >= surfaceY - 2) {
            chunk.setBlock(lx, ly, lz, config.subSurfaceBlock);
          } else {
            chunk.setBlock(lx, ly, lz, BlockId.STONE);
          }
        }
      }
    }

    // 植生を生成（地表の上に配置するため2パス目）
    this.generateVegetation(chunk, island);
  }

  // 植生の生成
  private generateVegetation(chunk: Chunk, island: IslandDef): void {
    const config = this.biomeManager.getConfig(island.biome);

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = chunk.worldX + lx;
        const wz = chunk.worldZ + lz;

        // 島の範囲チェック
        const dx = wx - island.x;
        const dz = wz - island.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > island.radius * 0.8) continue; // 端には木を生やさない

        // ノイズで木の配置を決定
        const treeVal = this.treeNoise(wx * 0.1, wz * 0.1);
        if (treeVal < TREE_NOISE_THRESHOLD) continue;

        // 密度チェック（さらにランダム性を追加）
        const densityCheck = Math.abs(this.treeNoise(wx * 0.5, wz * 0.5));
        if (densityCheck > config.treeDensity * 20) continue;

        // 地表のYを探す
        const surfaceY = this.findSurfaceY(chunk, lx, lz);
        if (surfaceY < 0) continue;

        // 木/サボテンを生成
        const trunkHeight = config.trunkHeightMin +
          Math.floor(Math.abs(this.treeNoise(wx * 0.3, wz * 0.3)) *
            (config.trunkHeightMax - config.trunkHeightMin + 1));

        if (island.biome === 'desert') {
          this.placeCactus(chunk, lx, surfaceY + 1, lz, trunkHeight, config.trunkBlock);
        } else {
          this.placeTree(chunk, lx, surfaceY + 1, lz, trunkHeight, config);
        }
      }
    }
  }

  // チャンク内で地表のY座標を見つける
  private findSurfaceY(chunk: Chunk, lx: number, lz: number): number {
    for (let ly = CHUNK_SIZE - 1; ly >= 0; ly--) {
      const block = chunk.getBlock(lx, ly, lz);
      if (block !== BlockId.AIR) {
        return ly;
      }
    }
    return -1;
  }

  // 木を配置
  private placeTree(
    chunk: Chunk, lx: number, baseY: number, lz: number,
    trunkHeight: number, config: ReturnType<BiomeManager['getConfig']>
  ): void {
    // 幹
    for (let y = 0; y < trunkHeight; y++) {
      const ly = baseY + y;
      if (ly < CHUNK_SIZE) {
        chunk.setBlock(lx, ly, lz, config.trunkBlock);
      }
    }

    // 葉（球体状）
    const leafCenter = baseY + trunkHeight;
    const r = config.leafRadius;
    for (let dy = -1; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx * dx + dy * dy + dz * dz > r * r + 1) continue;
          const bx = lx + dx;
          const by = leafCenter + dy;
          const bz = lz + dz;
          if (bx >= 0 && bx < CHUNK_SIZE && by >= 0 && by < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE) {
            if (chunk.getBlock(bx, by, bz) === BlockId.AIR) {
              chunk.setBlock(bx, by, bz, config.leavesBlock);
            }
          }
        }
      }
    }
  }

  // サボテンを配置
  private placeCactus(
    chunk: Chunk, lx: number, baseY: number, lz: number,
    height: number, blockId: BlockId
  ): void {
    for (let y = 0; y < height; y++) {
      const ly = baseY + y;
      if (ly < CHUNK_SIZE) {
        chunk.setBlock(lx, ly, lz, blockId);
      }
    }
  }

  // 2D fBm（Fractional Brownian Motion）
  private fbm2D(x: number, z: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < TERRAIN_OCTAVES; i++) {
      value += this.noise2D(x * frequency, z * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= TERRAIN_PERSISTENCE;
      frequency *= TERRAIN_LACUNARITY;
    }

    return value / maxAmplitude;
  }

  // 島の端に向かってスムーズに減衰するフォールオフ
  private smoothFalloff(dist: number, radius: number): number {
    if (dist >= radius) return 0;
    if (dist <= radius * 0.6) return 1;
    // 60%〜100%の範囲でスムーズに減衰
    const t = (dist - radius * 0.6) / (radius * 0.4);
    return 1 - t * t * (3 - 2 * t); // smoothstep
  }

  // スポーン位置（最初の島の地表）を取得
  getSpawnPosition(): { x: number; y: number; z: number } {
    const firstIsland = this.islands[0] ?? { x: 0, z: 0, y: 40 };
    const heightOffset = this.fbm2D(
      firstIsland.x * TERRAIN_NOISE_SCALE,
      firstIsland.z * TERRAIN_NOISE_SCALE
    ) * TERRAIN_HEIGHT_SCALE;
    return {
      x: firstIsland.x,
      y: Math.floor(firstIsland.y + heightOffset) + 3,
      z: firstIsland.z,
    };
  }

  // シード付き擬似乱数生成器
  private createSeededRng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
}
