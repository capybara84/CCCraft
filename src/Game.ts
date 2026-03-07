import * as THREE from 'three';
import { SKY_COLOR, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from './constants';

// ゲームのメインクラス。シーン・カメラ・レンダラーの管理とゲームループを担当する。
export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  constructor() {
    // レンダラー初期化
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    // シーン初期化
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SKY_COLOR);

    // カメラ初期化
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR);
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);

    // リサイズ対応
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ゲームループ開始
  start(): void {
    this.renderer.setAnimationLoop(this.update.bind(this));
  }

  private update(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
