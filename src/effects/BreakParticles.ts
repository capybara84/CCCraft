import * as THREE from 'three';
import { BlockId } from '../blocks/BlockTypes';
import { BlockTextures, FaceDir } from '../blocks/BlockTextures';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

const MAX_PARTICLES = 200;
const blockTextures = new BlockTextures();

// ブロック破壊時のパーティクルエフェクト
export class BreakParticles {
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private particles: Particle[] = [];
  private positionAttr: THREE.Float32BufferAttribute;
  private colorAttr: THREE.Float32BufferAttribute;
  private sizeAttr: THREE.Float32BufferAttribute;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();

    this.positionAttr = new THREE.Float32BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
    this.colorAttr = new THREE.Float32BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
    this.sizeAttr = new THREE.Float32BufferAttribute(new Float32Array(MAX_PARTICLES), 1);

    this.geometry.setAttribute('position', this.positionAttr);
    this.geometry.setAttribute('color', this.colorAttr);
    this.geometry.setAttribute('size', this.sizeAttr);

    this.material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  // 破壊進行中に少しずつパーティクルを出す
  emitBreaking(blockX: number, blockY: number, blockZ: number, blockId: BlockId, intensity: number): void {
    const count = Math.ceil(intensity * 3); // 進捗に応じて1〜3個
    const color = blockTextures.getColor(blockId, FaceDir.PY);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;

      const cx = blockX + 0.5;
      const cy = blockY + 0.5;
      const cz = blockZ + 0.5;

      // ブロック表面付近からランダムに出す
      const face = Math.floor(Math.random() * 6);
      let px = cx, py = cy, pz = cz;
      const offset = 0.5 + Math.random() * 0.1;
      switch (face) {
        case 0: px += offset; py += (Math.random() - 0.5); pz += (Math.random() - 0.5); break;
        case 1: px -= offset; py += (Math.random() - 0.5); pz += (Math.random() - 0.5); break;
        case 2: py += offset; px += (Math.random() - 0.5); pz += (Math.random() - 0.5); break;
        case 3: py -= offset; px += (Math.random() - 0.5); pz += (Math.random() - 0.5); break;
        case 4: pz += offset; px += (Math.random() - 0.5); py += (Math.random() - 0.5); break;
        case 5: pz -= offset; px += (Math.random() - 0.5); py += (Math.random() - 0.5); break;
      }

      // 表面から外向きに飛ぶ速度
      const speed = 1.5 + Math.random() * 2;
      const vx = (px - cx) * speed + (Math.random() - 0.5) * 0.5;
      const vy = (py - cy) * speed + Math.random() * 2; // やや上向き
      const vz = (pz - cz) * speed + (Math.random() - 0.5) * 0.5;

      // 色に少しばらつきを加える
      const variation = 0.8 + Math.random() * 0.4;

      this.particles.push({
        position: new THREE.Vector3(px, py, pz),
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0,
        maxLife: 0.4 + Math.random() * 0.4,
        size: 0.1 + Math.random() * 0.15,
      });

      const idx = this.particles.length - 1;
      this.colorAttr.setXYZ(idx,
        color.r * variation,
        color.g * variation,
        color.b * variation
      );
    }
  }

  // 破壊完了時にバースト
  emitBurst(blockX: number, blockY: number, blockZ: number, blockId: BlockId): void {
    const count = 30;
    const color = blockTextures.getColor(blockId, FaceDir.PY);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;

      const cx = blockX + 0.5;
      const cy = blockY + 0.5;
      const cz = blockZ + 0.5;

      // ブロック内部のランダム位置から
      const px = cx + (Math.random() - 0.5) * 0.8;
      const py = cy + (Math.random() - 0.5) * 0.8;
      const pz = cz + (Math.random() - 0.5) * 0.8;

      // 全方向に弾ける
      const speed = 2 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.cos(phi) * speed * 0.5 + Math.random() * 3; // 上方向バイアス
      const vz = Math.sin(phi) * Math.sin(theta) * speed;

      const variation = 0.7 + Math.random() * 0.6;

      this.particles.push({
        position: new THREE.Vector3(px, py, pz),
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 0.1 + Math.random() * 0.2,
      });

      const idx = this.particles.length - 1;
      this.colorAttr.setXYZ(idx,
        color.r * variation,
        color.g * variation,
        color.b * variation
      );
    }
  }

  update(dt: number): void {
    const gravity = 8;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life += dt;

      if (p.life >= p.maxLife) {
        // 死んだパーティクルを除去（末尾と入れ替え）
        const last = this.particles.length - 1;
        if (i < last) {
          this.particles[i] = this.particles[last]!;
          // カラーもコピー
          this.colorAttr.setXYZ(i,
            this.colorAttr.getX(last),
            this.colorAttr.getY(last),
            this.colorAttr.getZ(last)
          );
        }
        this.particles.pop();
        continue;
      }

      // 物理更新
      p.velocity.y -= gravity * dt;
      p.position.addScaledVector(p.velocity, dt);

      // 減衰
      p.velocity.multiplyScalar(0.98);
    }

    // バッファ更新
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;
      this.positionAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);

      // ライフに応じてサイズを縮小
      const t = p.life / p.maxLife;
      this.sizeAttr.setX(i, p.size * (1 - t * t));
    }

    // 残りを非表示
    for (let i = this.particles.length; i < MAX_PARTICLES; i++) {
      this.sizeAttr.setX(i, 0);
      this.positionAttr.setXYZ(i, 0, -1000, 0);
    }

    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, MAX_PARTICLES);
  }
}
