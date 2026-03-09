import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PlayerModel } from './PlayerModel';
import { InputManager } from './InputManager';
import { GliderController } from './GliderController';
import {
  PLAYER_WALK_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_DECELERATION,
  PLAYER_JUMP_HEIGHT,
  GRAVITY,
  PLAYER_TOTAL_HEIGHT,
} from '../constants';

// プレイヤーの物理ボディと移動制御を管理するクラス
export class PlayerController {
  readonly body: CANNON.Body;
  readonly model: PlayerModel;
  readonly glider: GliderController;

  private currentVelocity = new THREE.Vector2(0, 0);
  private cameraPitch = 0; // カメラのピッチ（ラジアン）

  constructor(physicsWorld: CANNON.World, scene: THREE.Scene, spawnPos?: { x: number; y: number; z: number }) {
    this.model = new PlayerModel();
    this.glider = new GliderController();

    const radius = 0.4;
    const playerMaterial = new CANNON.Material('player');
    this.body = new CANNON.Body({
      mass: 70,
      fixedRotation: true,
      linearDamping: 0.0,
      material: playerMaterial,
    });

    this.body.addShape(
      new CANNON.Cylinder(radius, radius, PLAYER_TOTAL_HEIGHT, 8)
    );

    const frictionless = new CANNON.ContactMaterial(
      playerMaterial,
      new CANNON.Material('default'),
      { friction: 0, restitution: 0 }
    );
    physicsWorld.addContactMaterial(frictionless);
    physicsWorld.defaultContactMaterial.friction = 0;

    const sx = spawnPos?.x ?? 0;
    const sy = spawnPos?.y ?? 50;
    const sz = spawnPos?.z ?? 0;
    this.body.position.set(sx, sy + PLAYER_TOTAL_HEIGHT / 2, sz);
    physicsWorld.addBody(this.body);

    scene.add(this.model.group);
  }

  setCameraPitch(pitchRad: number): void {
    this.cameraPitch = pitchRad;
  }

  update(dt: number, input: InputManager, cameraYaw: number): void {
    const movement = input.getMovement();

    if (input.consumeGliderToggle()) {
      this.glider.toggle();
    }

    if (this.glider.isGliding) {
      // === 飛行モード: カメラ方向に3D移動 ===
      this.glider.update(
        dt, this.body, cameraYaw, this.cameraPitch, movement,
        input.isJumping(), input.isRunning()
      );
      this.currentVelocity.x = this.body.velocity.x;
      this.currentVelocity.y = this.body.velocity.z;
    } else {
      // 飛行解除時に反重力forceをリセット
      this.body.force.y = 0;
      // === 通常移動 ===
      const isWalking = input.isRunning();
      const targetSpeed = isWalking ? PLAYER_WALK_SPEED : PLAYER_RUN_SPEED;
      const isMoving = movement.x !== 0 || movement.z !== 0;

      const cosYaw = Math.cos(cameraYaw);
      const sinYaw = Math.sin(cameraYaw);
      const worldDirX = movement.x * cosYaw + movement.z * sinYaw;
      const worldDirZ = -movement.x * sinYaw + movement.z * cosYaw;

      if (isMoving) {
        this.currentVelocity.x = this.approach(this.currentVelocity.x, worldDirX * targetSpeed, PLAYER_ACCELERATION * dt);
        this.currentVelocity.y = this.approach(this.currentVelocity.y, worldDirZ * targetSpeed, PLAYER_ACCELERATION * dt);
      } else {
        this.currentVelocity.x = this.approach(this.currentVelocity.x, 0, PLAYER_DECELERATION * dt);
        this.currentVelocity.y = this.approach(this.currentVelocity.y, 0, PLAYER_DECELERATION * dt);
      }

      this.body.velocity.x = this.currentVelocity.x;
      this.body.velocity.z = this.currentVelocity.y;

      // ジャンプ（接地時のみ）
      const isOnGround = Math.abs(this.body.velocity.y) < 0.5;
      if (input.isJumping() && isOnGround) {
        this.body.velocity.y = Math.sqrt(2 * GRAVITY * PLAYER_JUMP_HEIGHT);
      }
    }

    // === モデル同期 ===
    const pos = this.body.position;
    this.model.group.position.set(pos.x, pos.y - PLAYER_TOTAL_HEIGHT / 2, pos.z);

    // 向き
    const isMoving = movement.x !== 0 || movement.z !== 0;
    if (isMoving) {
      const cosYaw = Math.cos(cameraYaw);
      const sinYaw = Math.sin(cameraYaw);
      const dx = movement.x * cosYaw + movement.z * sinYaw;
      const dz = -movement.x * sinYaw + movement.z * cosYaw;
      this.model.group.rotation.y = Math.atan2(dx, dz);
    }

    // アニメーション
    if (this.glider.isGliding) {
      this.model.updateFlying(dt, this.glider.floatTime);
    } else {
      this.model.update(dt, isMoving, !input.isRunning());
    }
  }

  private approach(current: number, target: number, maxDelta: number): number {
    return current < target
      ? Math.min(current + maxDelta, target)
      : Math.max(current - maxDelta, target);
  }

  lookAt(targetX: number, targetZ: number): void {
    const pos = this.body.position;
    this.model.group.rotation.y = Math.atan2(targetX - pos.x, targetZ - pos.z);
  }

  getPosition(): THREE.Vector3 {
    const p = this.body.position;
    return new THREE.Vector3(p.x, p.y, p.z);
  }

  isGliding(): boolean {
    return this.glider.isGliding;
  }

  respawn(x: number, y: number, z: number): void {
    this.body.position.set(x, y + PLAYER_TOTAL_HEIGHT / 2, z);
    this.body.velocity.set(0, 0, 0);
    this.currentVelocity.set(0, 0);
    if (this.glider.isGliding) this.glider.toggle();
  }
}
