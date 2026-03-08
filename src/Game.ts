import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { SKY_COLOR, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR, GRAVITY, PHYSICS_TIMESTEP } from './constants';
import { WorldManager } from './world/WorldManager';
import { PlayerController } from './player/PlayerController';
import { CameraController } from './player/CameraController';
import { InputManager } from './player/InputManager';

// ゲームのメインクラス。シーン・カメラ・レンダラー・物理ワールドの管理とゲームループを担当する。
export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private physicsWorld: CANNON.World;

  private inputManager: InputManager;
  private playerController: PlayerController;
  private cameraController: CameraController;
  private worldManager: WorldManager;
  private clock: THREE.Clock;

  constructor() {
    // レンダラー初期化
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    // シーン初期化
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SKY_COLOR);

    // フォグ（遠景をフェードアウト）
    this.scene.fog = new THREE.Fog(SKY_COLOR, 80, 160);

    // ライティング
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    this.scene.add(directionalLight);

    // カメラ初期化
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR);

    // 物理ワールド初期化
    this.physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -GRAVITY, 0),
    });

    // 入力管理
    this.inputManager = new InputManager(this.renderer.domElement);

    // ワールド管理（チャンクベース）
    this.worldManager = new WorldManager(this.scene, this.physicsWorld);

    // スポーン位置を取得
    const spawn = this.worldManager.getSpawnPosition();

    // プレイヤー生成（スポーン位置を渡す）
    this.playerController = new PlayerController(this.physicsWorld, this.scene, spawn);

    // 初回チャンクロード
    this.worldManager.update(spawn.x, spawn.z);

    // カメラコントローラー
    this.cameraController = new CameraController(this.camera);

    // 時間管理
    this.clock = new THREE.Clock();

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
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // 物理ステップ
    this.physicsWorld.step(PHYSICS_TIMESTEP, dt);

    // プレイヤー更新
    const cameraYaw = this.cameraController.getYaw();
    this.playerController.update(dt, this.inputManager, cameraYaw);

    // チャンク更新（プレイヤー位置に基づく）
    const playerPos = this.playerController.getPosition();
    this.worldManager.update(playerPos.x, playerPos.z);

    // カメラ更新
    this.cameraController.update(playerPos, this.inputManager);

    // 描画
    this.renderer.render(this.scene, this.camera);
  }
}
