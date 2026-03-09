import * as CANNON from 'cannon-es';
import {
  GLIDER_HORIZONTAL_SPEED,
  PLAYER_JUMP_HEIGHT,
  GRAVITY,
} from '../constants';

/**
 * 飛行コントローラー。Gキーで飛行モード切替。
 */
export class GliderController {
  private _isGliding = false;
  private _floatTime = 0;
  private _rising = false;
  private _needsLaunch = false; // 初回フレームでジャンプ速度をセットするフラグ

  get isGliding(): boolean {
    return this._isGliding;
  }

  get floatTime(): number {
    return this._floatTime;
  }

  toggle(): void {
    this._isGliding = !this._isGliding;
    this._floatTime = 0;
    if (this._isGliding) {
      this._rising = true;
      this._needsLaunch = true;
    }
  }

  update(
    dt: number,
    body: CANNON.Body,
    cameraYaw: number,
    cameraPitch: number,
    movementInput: { x: number; z: number },
    isJumping: boolean,
    isDescending: boolean,
  ): void {
    if (!this._isGliding) return;

    this._floatTime += dt;

    // 上昇中: 重力で自然に減速、頂点に達したらホバーに移行
    if (this._rising) {
      if (this._needsLaunch) {
        this._needsLaunch = false;
        body.velocity.y = Math.sqrt(2 * GRAVITY * PLAYER_JUMP_HEIGHT);
      }
      // 頂点到達（上昇速度がなくなった）
      if (this._floatTime > 0.1 && body.velocity.y <= 0) {
        this._rising = false;
        body.velocity.y = 0;
      }
      // 上昇中は重力に任せて自然減速、他の入力は無視
      return;
    }

    // ホバー中: 重力を打ち消す
    body.force.y = body.mass * GRAVITY;

    // 通常移動と同じ水平方向計算
    const cosYaw = Math.cos(cameraYaw);
    const sinYaw = Math.sin(cameraYaw);
    const cosPitch = Math.cos(cameraPitch);
    const sinPitch = Math.sin(cameraPitch);

    const hDirX = movementInput.x * cosYaw + movementInput.z * sinYaw;
    const hDirZ = -movementInput.x * sinYaw + movementInput.z * cosYaw;

    body.velocity.x = hDirX * cosPitch * GLIDER_HORIZONTAL_SPEED;
    body.velocity.z = hDirZ * cosPitch * GLIDER_HORIZONTAL_SPEED;

    // 前後入力からピッチに応じた上下移動
    let vy = movementInput.z * sinPitch * GLIDER_HORIZONTAL_SPEED;

    if (isJumping) vy += GLIDER_HORIZONTAL_SPEED;
    if (isDescending) vy -= GLIDER_HORIZONTAL_SPEED;

    body.velocity.y = vy;
  }
}
