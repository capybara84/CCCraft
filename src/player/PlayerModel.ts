import * as THREE from 'three';
import {
  PLAYER_HEAD_SIZE,
  PLAYER_BODY_SIZE,
  PLAYER_ARM_SIZE,
  PLAYER_LEG_SIZE,
  PLAYER_COLOR_HEAD,
  PLAYER_COLOR_BODY,
  PLAYER_COLOR_ARM,
  PLAYER_COLOR_LEG,
  PLAYER_TOTAL_HEIGHT,
  PLAYER_WALK_ANIM_SPEED,
  PLAYER_WALK_ANIM_AMPLITUDE,
  PLAYER_RUN_ANIM_SPEED,
  PLAYER_RUN_ANIM_AMPLITUDE,
} from '../constants';

// ボクセルキャラクターのモデルとアニメーションを管理するクラス
// グループの原点は足元（Y=0が地面接地点）
export class PlayerModel {
  readonly group: THREE.Group;

  // アニメーション用ピボット（腕・脚の回転軸）
  private leftArmPivot: THREE.Group;
  private rightArmPivot: THREE.Group;
  private leftLegPivot: THREE.Group;
  private rightLegPivot: THREE.Group;

  private animTime = 0;

  constructor() {
    this.group = new THREE.Group();

    // パーツの生サイズ合計（頭+体+脚）からスケールを計算
    const rawHeight = PLAYER_LEG_SIZE.h + PLAYER_BODY_SIZE.h + PLAYER_HEAD_SIZE.h;
    const scale = PLAYER_TOTAL_HEIGHT / rawHeight;

    // 内部グループにパーツを配置し、スケールで全高を合わせる
    const inner = new THREE.Group();
    inner.scale.set(scale, scale, scale);

    // 足元を原点にするため、脚の長さ分だけ上にオフセット
    const legH = PLAYER_LEG_SIZE.h;
    const bodyH = PLAYER_BODY_SIZE.h;

    // === 左脚 ===
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-PLAYER_LEG_SIZE.w / 2, legH, 0);
    const leftLeg = this.createPart(
      PLAYER_LEG_SIZE.w, PLAYER_LEG_SIZE.h, PLAYER_LEG_SIZE.d, PLAYER_COLOR_LEG
    );
    leftLeg.position.set(0, -PLAYER_LEG_SIZE.h / 2, 0);
    this.leftLegPivot.add(leftLeg);
    inner.add(this.leftLegPivot);

    // === 右脚 ===
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(PLAYER_LEG_SIZE.w / 2, legH, 0);
    const rightLeg = this.createPart(
      PLAYER_LEG_SIZE.w, PLAYER_LEG_SIZE.h, PLAYER_LEG_SIZE.d, PLAYER_COLOR_LEG
    );
    rightLeg.position.set(0, -PLAYER_LEG_SIZE.h / 2, 0);
    this.rightLegPivot.add(rightLeg);
    inner.add(this.rightLegPivot);

    // === 体 ===
    const body = this.createPart(
      PLAYER_BODY_SIZE.w, PLAYER_BODY_SIZE.h, PLAYER_BODY_SIZE.d, PLAYER_COLOR_BODY
    );
    body.position.set(0, legH + bodyH / 2, 0);
    inner.add(body);

    // === 左腕 ===
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(
      -(PLAYER_BODY_SIZE.w / 2 + PLAYER_ARM_SIZE.w / 2),
      legH + bodyH,
      0
    );
    const leftArm = this.createPart(
      PLAYER_ARM_SIZE.w, PLAYER_ARM_SIZE.h, PLAYER_ARM_SIZE.d, PLAYER_COLOR_ARM
    );
    leftArm.position.set(0, -PLAYER_ARM_SIZE.h / 2, 0);
    this.leftArmPivot.add(leftArm);
    inner.add(this.leftArmPivot);

    // === 右腕 ===
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(
      PLAYER_BODY_SIZE.w / 2 + PLAYER_ARM_SIZE.w / 2,
      legH + bodyH,
      0
    );
    const rightArm = this.createPart(
      PLAYER_ARM_SIZE.w, PLAYER_ARM_SIZE.h, PLAYER_ARM_SIZE.d, PLAYER_COLOR_ARM
    );
    rightArm.position.set(0, -PLAYER_ARM_SIZE.h / 2, 0);
    this.rightArmPivot.add(rightArm);
    inner.add(this.rightArmPivot);

    // === 頭 ===
    const head = this.createPart(
      PLAYER_HEAD_SIZE.w, PLAYER_HEAD_SIZE.h, PLAYER_HEAD_SIZE.d, PLAYER_COLOR_HEAD
    );
    const headY = legH + bodyH + PLAYER_HEAD_SIZE.h / 2;
    head.position.set(0, headY, 0);
    inner.add(head);

    // === 目 ===
    const eyeSize = PLAYER_HEAD_SIZE.w * 0.15;
    const eyeGeo = new THREE.BoxGeometry(eyeSize, eyeSize, eyeSize * 0.5);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const eyeOffsetX = PLAYER_HEAD_SIZE.w * 0.2;
    const eyeY = headY + PLAYER_HEAD_SIZE.h * 0.05;
    const eyeZ = PLAYER_HEAD_SIZE.d / 2 + eyeSize * 0.2; // 顔の前面に少し出す
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-eyeOffsetX, eyeY, eyeZ);
    inner.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(eyeOffsetX, eyeY, eyeZ);
    inner.add(rightEye);

    this.group.add(inner);
  }

  private createPart(w: number, h: number, d: number, color: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshLambertMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  // 歩行アニメーション更新
  update(dt: number, isMoving: boolean, isRunning: boolean): void {
    if (isMoving) {
      const speed = isRunning ? PLAYER_RUN_ANIM_SPEED : PLAYER_WALK_ANIM_SPEED;
      const amplitude = isRunning ? PLAYER_RUN_ANIM_AMPLITUDE : PLAYER_WALK_ANIM_AMPLITUDE;

      this.animTime += dt * speed;
      const swing = Math.sin(this.animTime) * amplitude;

      // 腕と脚を逆位相で振る
      this.leftArmPivot.rotation.x = swing;
      this.rightArmPivot.rotation.x = -swing;
      this.leftLegPivot.rotation.x = -swing;
      this.rightLegPivot.rotation.x = swing;
    } else {
      // 停止時はアニメーションをスムーズにリセット
      this.animTime = 0;
      this.leftArmPivot.rotation.x *= 0.8;
      this.rightArmPivot.rotation.x *= 0.8;
      this.leftLegPivot.rotation.x *= 0.8;
      this.rightLegPivot.rotation.x *= 0.8;
    }
  }
}
