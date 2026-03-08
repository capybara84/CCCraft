import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CHUNK_SIZE, RENDER_DISTANCE } from '../constants';
import { BlockId } from '../blocks/BlockTypes';
import { BlockTextures } from '../blocks/BlockTextures';
import { Chunk } from './Chunk';
import { ChunkMesher } from './ChunkMesher';
import { TerrainGenerator } from './TerrainGenerator';

// チャンクキーの生成
function chunkKey(cx: number, cy: number, cz: number): string {
  return `${cx},${cy},${cz}`;
}

// ワールド全体のチャンク管理、ロード/アンロード、物理衝突体を担当するクラス
export class WorldManager {
  private chunks = new Map<string, Chunk>();
  private chunkMeshes = new Map<string, THREE.Mesh>();
  private chunkBodies = new Map<string, CANNON.Body>();
  private mesher: ChunkMesher;
  private generator: TerrainGenerator;
  private scene: THREE.Scene;
  private physicsWorld: CANNON.World;
  private textures: BlockTextures;

  // 前回の更新時のプレイヤーチャンク座標
  private lastPlayerCx = Infinity;
  private lastPlayerCz = Infinity;

  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.textures = new BlockTextures();
    this.mesher = new ChunkMesher(this.textures);
    this.generator = new TerrainGenerator();
  }

  // スポーン位置を取得
  getSpawnPosition(): { x: number; y: number; z: number } {
    return this.generator.getSpawnPosition();
  }

  // プレイヤー位置に基づいてチャンクを更新
  update(playerX: number, playerZ: number): void {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);

    // プレイヤーが同じチャンクにいる場合はスキップ
    if (pcx === this.lastPlayerCx && pcz === this.lastPlayerCz) return;
    this.lastPlayerCx = pcx;
    this.lastPlayerCz = pcz;

    // ロードすべきチャンクのセット
    const needed = new Set<string>();

    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        // 円形の描画距離
        if (dx * dx + dz * dz > RENDER_DISTANCE * RENDER_DISTANCE) continue;

        const cx = pcx + dx;
        const cz = pcz + dz;

        // Y方向は島の生成範囲をカバー（Y=0〜Y=112 → チャンクY=0〜7）
        for (let cy = 0; cy <= 7; cy++) {
          const key = chunkKey(cx, cy, cz);
          needed.add(key);

          if (!this.chunks.has(key)) {
            this.loadChunk(cx, cy, cz);
          }
        }
      }
    }

    // 範囲外のチャンクをアンロード
    for (const [key] of this.chunks) {
      if (!needed.has(key)) {
        this.unloadChunk(key);
      }
    }
  }

  // チャンクをロード（生成 + メッシュ + 物理）
  private loadChunk(cx: number, cy: number, cz: number): void {
    const key = chunkKey(cx, cy, cz);
    const chunk = new Chunk(cx, cy, cz);

    // 地形生成
    this.generator.generateChunk(chunk);
    this.chunks.set(key, chunk);

    // 空チャンクはメッシュ不要
    if (chunk.isEmpty()) return;

    // メッシュ生成
    const mesh = this.mesher.buildMesh(chunk, this.getBlockWorld.bind(this));
    if (mesh) {
      this.scene.add(mesh);
      this.chunkMeshes.set(key, mesh);
    }

    // 物理ボディ生成（固体ブロックごとにシェイプを追加）
    this.buildPhysicsBody(chunk, key);
  }

  // チャンクをアンロード
  private unloadChunk(key: string): void {
    // メッシュ除去
    const mesh = this.chunkMeshes.get(key);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      this.chunkMeshes.delete(key);
    }

    // 物理ボディ除去
    const body = this.chunkBodies.get(key);
    if (body) {
      this.physicsWorld.removeBody(body);
      this.chunkBodies.delete(key);
    }

    this.chunks.delete(key);
  }

  // チャンクの物理衝突体を構築
  private buildPhysicsBody(chunk: Chunk, key: string): void {
    const body = new CANNON.Body({ type: CANNON.Body.STATIC });
    const halfBlock = new CANNON.Vec3(0.5, 0.5, 0.5);
    let hasShapes = false;

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          if (chunk.getBlock(lx, ly, lz) === BlockId.AIR) continue;

          // 完全に囲まれたブロックはスキップ（最適化）
          if (this.isFullySurrounded(chunk, lx, ly, lz)) continue;

          const wx = chunk.worldX + lx + 0.5;
          const wy = chunk.worldY + ly + 0.5;
          const wz = chunk.worldZ + lz + 0.5;

          body.addShape(new CANNON.Box(halfBlock), new CANNON.Vec3(wx, wy, wz));
          hasShapes = true;
        }
      }
    }

    if (hasShapes) {
      this.physicsWorld.addBody(body);
      this.chunkBodies.set(key, body);
    }
  }

  // ブロックが全6方向で囲まれているかチェック
  private isFullySurrounded(chunk: Chunk, lx: number, ly: number, lz: number): boolean {
    return (
      chunk.getBlock(lx + 1, ly, lz) !== BlockId.AIR &&
      chunk.getBlock(lx - 1, ly, lz) !== BlockId.AIR &&
      chunk.getBlock(lx, ly + 1, lz) !== BlockId.AIR &&
      chunk.getBlock(lx, ly - 1, lz) !== BlockId.AIR &&
      chunk.getBlock(lx, ly, lz + 1) !== BlockId.AIR &&
      chunk.getBlock(lx, ly, lz - 1) !== BlockId.AIR
    );
  }

  // ワールド座標でブロックを取得
  getBlockWorld(wx: number, wy: number, wz: number): BlockId {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cy = Math.floor(wy / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.chunks.get(chunkKey(cx, cy, cz));
    if (!chunk) return BlockId.AIR;
    return chunk.getBlockWorld(wx, wy, wz);
  }

  // ワールド座標でブロックを設定し、チャンクのメッシュと物理を再構築
  setBlock(wx: number, wy: number, wz: number, blockId: BlockId): void {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cy = Math.floor(wy / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const key = chunkKey(cx, cy, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    const lx = wx - chunk.worldX;
    const ly = wy - chunk.worldY;
    const lz = wz - chunk.worldZ;
    chunk.setBlock(lx, ly, lz, blockId);

    // メッシュ再構築
    this.rebuildChunkMesh(key, chunk);

    // 物理再構築
    this.rebuildChunkPhysics(key, chunk);

    // 隣接チャンクも再構築（ブロックがチャンク境界にある場合）
    if (lx === 0) this.rebuildNeighbor(cx - 1, cy, cz);
    if (lx === CHUNK_SIZE - 1) this.rebuildNeighbor(cx + 1, cy, cz);
    if (ly === 0) this.rebuildNeighbor(cx, cy - 1, cz);
    if (ly === CHUNK_SIZE - 1) this.rebuildNeighbor(cx, cy + 1, cz);
    if (lz === 0) this.rebuildNeighbor(cx, cy, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.rebuildNeighbor(cx, cy, cz + 1);
  }

  // 隣接チャンクのメッシュを再構築
  private rebuildNeighbor(cx: number, cy: number, cz: number): void {
    const key = chunkKey(cx, cy, cz);
    const chunk = this.chunks.get(key);
    if (chunk) {
      this.rebuildChunkMesh(key, chunk);
    }
  }

  // チャンクのメッシュを再構築
  private rebuildChunkMesh(key: string, chunk: Chunk): void {
    // 既存メッシュを除去
    const oldMesh = this.chunkMeshes.get(key);
    if (oldMesh) {
      this.scene.remove(oldMesh);
      oldMesh.geometry.dispose();
      this.chunkMeshes.delete(key);
    }

    // 新しいメッシュを生成
    if (!chunk.isEmpty()) {
      const mesh = this.mesher.buildMesh(chunk, this.getBlockWorld.bind(this));
      if (mesh) {
        this.scene.add(mesh);
        this.chunkMeshes.set(key, mesh);
      }
    }
  }

  // チャンクの物理ボディを再構築
  private rebuildChunkPhysics(key: string, chunk: Chunk): void {
    // 既存ボディを除去
    const oldBody = this.chunkBodies.get(key);
    if (oldBody) {
      this.physicsWorld.removeBody(oldBody);
      this.chunkBodies.delete(key);
    }

    // 新しいボディを構築
    if (!chunk.isEmpty()) {
      this.buildPhysicsBody(chunk, key);
    }
  }
}
