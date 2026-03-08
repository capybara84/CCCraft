import { CHUNK_SIZE } from '../constants';
import { BlockId } from '../blocks/BlockTypes';

// 16×16×16のボクセルデータを管理するクラス
export class Chunk {
  // チャンクのワールド座標（ブロック単位の原点）
  readonly worldX: number;
  readonly worldY: number;
  readonly worldZ: number;

  // ブロックデータ（1次元配列、インデックス = x + z*SIZE + y*SIZE*SIZE）
  private blocks: Uint8Array;

  // メッシュが最新かどうか
  dirty = true;

  constructor(
    public readonly cx: number, // チャンク座標X
    public readonly cy: number, // チャンク座標Y
    public readonly cz: number  // チャンク座標Z
  ) {
    this.worldX = cx * CHUNK_SIZE;
    this.worldY = cy * CHUNK_SIZE;
    this.worldZ = cz * CHUNK_SIZE;
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
  }

  // ローカル座標でブロックを取得
  getBlock(lx: number, ly: number, lz: number): BlockId {
    if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) {
      return BlockId.AIR;
    }
    return this.blocks[lx + lz * CHUNK_SIZE + ly * CHUNK_SIZE * CHUNK_SIZE] as BlockId;
  }

  // ローカル座標でブロックを設定
  setBlock(lx: number, ly: number, lz: number, id: BlockId): void {
    if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) {
      return;
    }
    this.blocks[lx + lz * CHUNK_SIZE + ly * CHUNK_SIZE * CHUNK_SIZE] = id;
    this.dirty = true;
  }

  // ワールド座標でブロックを取得
  getBlockWorld(wx: number, wy: number, wz: number): BlockId {
    return this.getBlock(wx - this.worldX, wy - this.worldY, wz - this.worldZ);
  }

  // チャンク内にブロックが1つでもあるか
  isEmpty(): boolean {
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i] !== BlockId.AIR) return false;
    }
    return true;
  }
}
