import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PlayerModel } from './PlayerModel';
import { InputManager } from './InputManager';
import {
  PLAYER_WALK_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_DECELERATION,
  PLAYER_JUMP_HEIGHT,
  GRAVITY,
  PLAYER_TOTAL_HEIGHT,
  ISLAND_HEIGHT_Y,
  GROUND_CONTACT_THRESHOLD,
} from '../constants';

// プレイヤーの物理ボディと移動制御を管理するクラス
export class PlayerController {
  readonly body: CANNON.Body;
  readonly model: PlayerModel;

  private currentVelocity = new THREE.Vector2(0, 0); // 水平速度(x, z)
  private isGrounded = false;

  constructor(physicsWorld: CANNON.World, scene: THREE.Scene) {
    this.model = new PlayerModel();

    // 物理ボディ（摩擦なしのマテリアルで地面に引っかからないようにする）
    const radius = 0.4;
    const playerMaterial = new CANNON.Material('player');
    this.body = new CANNON.Body({
      mass: 70,
      fixedRotation: true, // 回転を固定
      linearDamping: 0.0,
      material: playerMaterial,
    });

    // シリンダー形状で近似
    this.body.addShape(
      new CANNON.Cylinder(radius, radius, PLAYER_TOTAL_HEIGHT, 8)
    );

    // プレイヤーと全ての物体の摩擦を0に設定
    const frictionless = new CANNON.ContactMaterial(
      playerMaterial,
      new CANNON.Material('default'),
      { friction: 0, restitution: 0 }
    );
    physicsWorld.addContactMaterial(frictionless);
    physicsWorld.defaultContactMaterial.friction = 0;

    // 初期位置: 島の上
    this.body.position.set(0, ISLAND_HEIGHT_Y + PLAYER_TOTAL_HEIGHT / 2 + 1, 0);
    physicsWorld.addBody(this.body);

    // シーンにモデルを追加
    scene.add(this.model.group);

    // 接地判定用のコンタクトイベント
    this.body.addEventListener('collide', () => {
      // 衝突したら接地とみなす（簡易判定）
      this.checkGrounded();
    });
  }

  private checkGrounded(): void {
    // 垂直速度がほぼ0以下なら接地
    this.isGrounded = Math.abs(this.body.velocity.y) < GROUND_CONTACT_THRESHOLD;
  }

  update(dt: number, input: InputManager, cameraYaw: number): void {
    // === 移動入力 ===
    const movement = input.getMovement();
    const isRunning = input.isRunning();
    const targetSpeed = isRunning ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    const isMoving = movement.x !== 0 || movement.z !== 0;

    // カメラの向きに対して相対的に移動方向を計算
    const cosYaw = Math.cos(cameraYaw);
    const sinYaw = Math.sin(cameraYaw);
    const worldDirX = movement.x * cosYaw + movement.z * sinYaw;
    const worldDirZ = -movement.x * sinYaw + movement.z * cosYaw;

    // === 加速/減速 ===
    if (isMoving) {
      const targetVelX = worldDirX * targetSpeed;
      const targetVelZ = worldDirZ * targetSpeed;

      // 目標速度に向かって加速
      this.currentVelocity.x = this.approach(
        this.currentVelocity.x,
        targetVelX,
        PLAYER_ACCELERATION * dt
      );
      this.currentVelocity.y = this.approach(
        this.currentVelocity.y,
        targetVelZ,
        PLAYER_ACCELERATION * dt
      );
    } else {
      // 減速
      this.currentVelocity.x = this.approach(
        this.currentVelocity.x,
        0,
        PLAYER_DECELERATION * dt
      );
      this.currentVelocity.y = this.approach(
        this.currentVelocity.y,
        0,
        PLAYER_DECELERATION * dt
      );
    }

    // 物理ボディの速度に反映（Y速度は物理エンジンに任せる）
    this.body.velocity.x = this.currentVelocity.x;
    this.body.velocity.z = this.currentVelocity.y;

    // === ジャンプ ===
    // 接地判定を毎フレーム更新
    this.isGrounded =
      Math.abs(this.body.velocity.y) < GROUND_CONTACT_THRESHOLD;

    if (input.isJumping() && this.isGrounded) {
      // v = sqrt(2 * g * h) でジャンプ初速を計算
      const jumpVelocity = Math.sqrt(2 * GRAVITY * PLAYER_JUMP_HEIGHT);
      this.body.velocity.y = jumpVelocity;
      this.isGrounded = false;
    }

    // === モデルの位置・回転を物理ボディに同期 ===
    // モデルの原点は足元なので、物理ボディの底面に合わせる
    const pos = this.body.position;
    const feetY = pos.y - PLAYER_TOTAL_HEIGHT / 2;
    this.model.group.position.set(pos.x, feetY, pos.z);

    // 移動方向にキャラクターを向ける
    if (isMoving) {
      const angle = Math.atan2(worldDirX, worldDirZ);
      this.model.group.rotation.y = angle;
    }

    // アニメーション更新
    this.model.update(dt, isMoving, isRunning);
  }

  // 値を目標に向けて一定量近づけるヘルパー
  private approach(current: number, target: number, maxDelta: number): number {
    if (current < target) {
      return Math.min(current + maxDelta, target);
    } else {
      return Math.max(current - maxDelta, target);
    }
  }

  getPosition(): THREE.Vector3 {
    const p = this.body.position;
    return new THREE.Vector3(p.x, p.y, p.z);
  }
}
