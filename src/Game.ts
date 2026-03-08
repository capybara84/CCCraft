import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { SKY_COLOR, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR, GRAVITY, PHYSICS_TIMESTEP } from './constants';
import { WorldManager } from './world/WorldManager';
import { occlusionUniforms } from './world/ChunkMesher';
import { PlayerController } from './player/PlayerController';
import { CameraController } from './player/CameraController';
import { InputManager } from './player/InputManager';
import { BlockInteraction } from './blocks/BlockInteraction';
import { Inventory } from './inventory/Inventory';
import { HUD } from './ui/HUD';
import { InventoryUI } from './ui/InventoryUI';
import { getDebugLog } from './ui/DebugLog';

// ゲームのメインクラス
export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private physicsWorld: CANNON.World;

  private inputManager: InputManager;
  private playerController: PlayerController;
  private cameraController: CameraController;
  private worldManager: WorldManager;
  private blockInteraction: BlockInteraction;
  private inventory: Inventory;
  private hud: HUD;
  private inventoryUI: InventoryUI;
  private clock: THREE.Clock;
  private debugVisible = true;


  constructor() {
    // レンダラー初期化
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    // シーン初期化
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SKY_COLOR);
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

    // ワールド管理
    this.worldManager = new WorldManager(this.scene, this.physicsWorld);
    const spawn = this.worldManager.getSpawnPosition();

    // プレイヤー生成
    this.playerController = new PlayerController(this.physicsWorld, this.scene, spawn);

    // 初回チャンクロード
    this.worldManager.update(spawn.x, spawn.z);

    // カメラコントローラー
    this.cameraController = new CameraController(this.camera);

    // インベントリ
    this.inventory = new Inventory();

    // ブロック操作
    this.blockInteraction = new BlockInteraction(
      this.scene, this.camera, this.worldManager, this.inventory
    );
    this.blockInteraction.setPlayerController(this.playerController);

    // HUD
    this.hud = new HUD(this.inventory);

    // インベントリUI
    this.inventoryUI = new InventoryUI(this.inventory);

    // 時間管理
    this.clock = new THREE.Clock();

    // リサイズ対応
    window.addEventListener('resize', this.onResize.bind(this));

    // デバッグログ
    const debug = getDebugLog();
    debug.log('CCCraft 起動');
    debug.log(`スポーン位置: (${spawn.x}, ${spawn.y}, ${spawn.z})`);
    debug.log('操作: WASD移動 / Space飛行 / 左クリック破壊 / 右クリック設置');
    debug.log('操作: 右ドラッグ カメラ回転 / 1-8 ホットバー / E インベントリ');
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

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

    // チャンク更新
    const playerPos = this.playerController.getPosition();
    this.worldManager.update(playerPos.x, playerPos.z);

    // カメラ更新
    this.cameraController.update(playerPos, this.inputManager);

    // デバッグ表示トグル（Pキー）
    if (this.inputManager.consumeDebugToggle()) {
      this.debugVisible = !this.debugVisible;
      getDebugLog().setVisible(this.debugVisible);
      this.blockInteraction.setHighlightEnabled(this.debugVisible);
    }

    // インベントリ開閉
    if (this.inputManager.consumeInventoryToggle()) {
      this.inventoryUI.toggle();
    }

    // ブロック操作更新（インベントリ開いてる間は無効）
    if (!this.inventoryUI.isOpen) {
      this.blockInteraction.update(dt, this.inputManager, playerPos);
    }

    // HUD更新
    this.hud.update();

    // 入力フレーム終了
    this.inputManager.endFrame();

    // 遮蔽フェード用uniform更新
    occlusionUniforms.uCameraPos.value.copy(this.camera.position);
    occlusionUniforms.uPlayerPos.value.copy(playerPos);

    // 描画
    this.renderer.render(this.scene, this.camera);
  }
}
