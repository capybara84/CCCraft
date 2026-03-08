import * as THREE from 'three';
import { CHUNK_SIZE } from '../constants';
import { BlockId, isOpaque } from '../blocks/BlockTypes';
import { BlockTextures, FaceDir } from '../blocks/BlockTextures';
import { Chunk } from './Chunk';

// 面の方向ごとの法線
const FACE_NORMALS: readonly (readonly [number, number, number])[] = [
  [1, 0, 0],  // PX
  [-1, 0, 0], // NX
  [0, 1, 0],  // PY
  [0, -1, 0], // NY
  [0, 0, 1],  // PZ
  [0, 0, -1], // NZ
] as const;

// 各面の4頂点オフセット
const FACE_VERTICES: readonly (readonly (readonly [number, number, number])[])[] = [
  [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], // PX
  [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], // NX
  [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], // PY
  [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], // NY
  [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], // PZ
  [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], // NZ
] as const;

// チャンクのメッシュを生成するクラス
// 頂点カラーベースで1マテリアルにまとめ、描画コール数を削減する
export class ChunkMesher {
  private textures: BlockTextures;

  constructor(textures: BlockTextures) {
    this.textures = textures;
  }

  // チャンクからメッシュを生成
  buildMesh(chunk: Chunk, getNeighborBlock: (wx: number, wy: number, wz: number) => BlockId): THREE.Mesh | null {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let vertexCount = 0;

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const blockId = chunk.getBlock(lx, ly, lz);
          if (blockId === BlockId.AIR) continue;

          const wx = chunk.worldX + lx;
          const wy = chunk.worldY + ly;
          const wz = chunk.worldZ + lz;

          for (let face = 0; face < 6; face++) {
            const normal = FACE_NORMALS[face]!;
            const [nx, ny, nz] = normal;
            const neighborId = this.getBlockAt(
              lx + nx, ly + ny, lz + nz, chunk, getNeighborBlock,
              wx + nx, wy + ny, wz + nz
            );

            if (isOpaque(neighborId)) continue;

            // ブロック・面の色を取得
            const color = this.textures.getColor(blockId, face as FaceDir);

            const verts = FACE_VERTICES[face]!;
            for (const [vx, vy, vz] of verts) {
              positions.push(wx + vx, wy + vy, wz + vz);
              normals.push(nx, ny, nz);
              colors.push(color.r, color.g, color.b);
            }

            const base = vertexCount;
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
            vertexCount += 4;
          }
        }
      }
    }

    if (positions.length === 0) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);

    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    return new THREE.Mesh(geometry, material);
  }

  // ローカル座標でブロック取得（チャンク外は隣接チャンク参照）
  private getBlockAt(
    lx: number, ly: number, lz: number,
    chunk: Chunk,
    getNeighborBlock: (wx: number, wy: number, wz: number) => BlockId,
    wx: number, wy: number, wz: number
  ): BlockId {
    if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
      return chunk.getBlock(lx, ly, lz);
    }
    return getNeighborBlock(wx, wy, wz);
  }
}
