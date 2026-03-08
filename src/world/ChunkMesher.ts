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

// 各面の4頂点のUV（テクスチャ座標、セル内相対）
const FACE_UVS: readonly (readonly [number, number])[] = [
  [0, 0], [0, 1], [1, 1], [1, 0],
];

// チャンクのメッシュを生成するクラス
// テクスチャアトラス + UVマッピングで描画
export class ChunkMesher {
  private textures: BlockTextures;
  private material: THREE.MeshLambertMaterial;

  constructor(textures: BlockTextures) {
    this.textures = textures;
    this.material = new THREE.MeshLambertMaterial({
      map: textures.getAtlas(),
    });
  }

  // チャンクからメッシュを生成
  buildMesh(chunk: Chunk, getNeighborBlock: (wx: number, wy: number, wz: number) => BlockId): THREE.Mesh | null {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
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

            // アトラスUVを取得
            const { u, v, size } = this.textures.getUV(blockId, face as FaceDir);

            const verts = FACE_VERTICES[face]!;
            for (let i = 0; i < 4; i++) {
              const [vx, vy, vz] = verts[i]!;
              positions.push(wx + vx, wy + vy, wz + vz);
              normals.push(nx, ny, nz);
              // アトラス上のUV
              const [fu, fv] = FACE_UVS[i]!;
              uvs.push(u + fu * size, v + fv * size);
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
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return new THREE.Mesh(geometry, this.material);
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
