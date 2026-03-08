import * as THREE from 'three';
import { BlockId } from './BlockTypes';

// 面の方向
export enum FaceDir {
  PX = 0, // +x 右
  NX = 1, // -x 左
  PY = 2, // +y 上
  NY = 3, // -y 下
  PZ = 4, // +z 前
  NZ = 5, // -z 後
}

// ブロックID・面方向ごとの色を管理するクラス
// 頂点カラーベースで描画するため、テクスチャではなくRGB値を返す
export class BlockTextures {
  private colorMap = new Map<string, THREE.Color>();

  constructor() {
    this.buildAll();
  }

  // ブロックID・面方向からカラーを取得
  getColor(blockId: BlockId, face: FaceDir): THREE.Color {
    return this.colorMap.get(`${blockId}_${face}`)
      ?? this.colorMap.get(`${blockId}_default`)
      ?? new THREE.Color(0xff00ff); // フォールバック（マゼンタ）
  }

  private buildAll(): void {
    // 草ブロック
    this.setColor(BlockId.GRASS, FaceDir.PY, '#4a8c3f');
    this.setColor(BlockId.GRASS, FaceDir.NY, '#6b4226');
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.setColor(BlockId.GRASS, f, '#5a6b32');
    }

    // 暗い草（森）
    this.setColor(BlockId.DARK_GRASS, FaceDir.PY, '#2d6b2e');
    this.setColor(BlockId.DARK_GRASS, FaceDir.NY, '#5a3720');
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.setColor(BlockId.DARK_GRASS, f, '#3d5a28');
    }

    // 土
    this.setDefault(BlockId.DIRT, '#6b4226');

    // 石
    this.setDefault(BlockId.STONE, '#808080');

    // 砂
    this.setDefault(BlockId.SAND, '#d4b96e');

    // 木の幹
    this.setColor(BlockId.WOOD, FaceDir.PY, '#a07828');
    this.setColor(BlockId.WOOD, FaceDir.NY, '#a07828');
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.setColor(BlockId.WOOD, f, '#8b6914');
    }

    // 葉
    this.setDefault(BlockId.LEAVES, '#2d8c2d');

    // 暗い葉（森）
    this.setDefault(BlockId.DARK_LEAVES, '#1a6b1a');

    // サボテン
    this.setDefault(BlockId.CACTUS, '#2d7a2d');

    // 枯れ木
    this.setDefault(BlockId.DEAD_WOOD, '#8b7355');

    // 木材（クラフト）
    this.setDefault(BlockId.PLANKS, '#b8860b');

    // 石レンガ（クラフト）
    this.setDefault(BlockId.STONE_BRICK, '#a0a0a0');

    // クラフト台
    this.setDefault(BlockId.CRAFTING_TABLE, '#c48432');
  }

  private setColor(blockId: BlockId, face: FaceDir, hex: string): void {
    this.colorMap.set(`${blockId}_${face}`, new THREE.Color(hex));
  }

  private setDefault(blockId: BlockId, hex: string): void {
    const color = new THREE.Color(hex);
    this.colorMap.set(`${blockId}_default`, color);
    for (let f = 0; f <= 5; f++) {
      this.colorMap.set(`${blockId}_${f}`, color);
    }
  }
}
