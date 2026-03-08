import * as THREE from 'three';
import { InputManager } from './InputManager';
import {
  CAMERA_PITCH_ANGLE,
  CAMERA_DISTANCE,
  CAMERA_LERP_FACTOR,
  CAMERA_ROTATE_SPEED,
  CAMERA_PITCH_MIN,
  CAMERA_PITCH_MAX,
} from '../constants';

// 3rdパーソンカメラ（見下ろし、水平・上下回転可能）を管理するクラス
export class CameraController {
  private yaw = 0; // 水平回転角（ラジアン）
  private pitchDeg: number; // 俯角（度、可変）
  private currentPosition = new THREE.Vector3();

  constructor(private camera: THREE.PerspectiveCamera) {
    this.pitchDeg = CAMERA_PITCH_ANGLE;
  }

  update(targetPosition: THREE.Vector3, input: InputManager): void {
    // マウスドラッグでyaw（水平）とpitch（上下）を回転
    const mouseDelta = input.consumeMouseDelta();
    this.yaw -= mouseDelta.x * CAMERA_ROTATE_SPEED;

    // 上下方向: ドラッグ上→俯角を小さく（水平に近づく）、ドラッグ下→俯角を大きく（真上に近づく）
    this.pitchDeg += mouseDelta.y * CAMERA_ROTATE_SPEED * (180 / Math.PI);
    this.pitchDeg = Math.max(CAMERA_PITCH_MIN, Math.min(CAMERA_PITCH_MAX, this.pitchDeg));

    const pitchRad = (this.pitchDeg * Math.PI) / 180;

    // カメラの目標位置を計算
    const horizontalDist = CAMERA_DISTANCE * Math.cos(pitchRad);
    const verticalDist = CAMERA_DISTANCE * Math.sin(pitchRad);

    const targetCamPos = new THREE.Vector3(
      targetPosition.x + horizontalDist * Math.sin(this.yaw),
      targetPosition.y + verticalDist,
      targetPosition.z + horizontalDist * Math.cos(this.yaw)
    );

    // スムーズ補間で追従
    this.currentPosition.lerp(targetCamPos, CAMERA_LERP_FACTOR);
    this.camera.position.copy(this.currentPosition);

    // カメラをプレイヤーに向ける
    this.camera.lookAt(targetPosition);
  }

  // PlayerControllerが移動方向の計算に使うyaw角を返す
  getYaw(): number {
    return this.yaw;
  }
}
