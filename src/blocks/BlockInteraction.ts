import * as THREE from 'three';
import { BLOCK_INTERACT_RANGE, BLOCK_HIGHLIGHT_COLOR, BLOCK_HIGHLIGHT_OPACITY, CAMERA_DISTANCE } from '../constants';
import { BlockId, getBlockInfo, getBlockName } from './BlockTypes';
import { Inventory } from '../inventory/Inventory';
import { InputManager } from '../player/InputManager';
import { WorldManager } from '../world/WorldManager';
import { getDebugLog } from '../ui/DebugLog';
import { BreakParticles } from '../effects/BreakParticles';
import { PlayerController } from '../player/PlayerController';

// マウスカーソル位置からレイキャストし、ブロックの破壊/設置を行うクラス
// 操作: クリック短押し=設置、長押し=破壊（iPad互換）
export class BlockInteraction {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private worldManager: WorldManager;
  private inventory: Inventory;
  private playerController: PlayerController | null = null;

  // ハイライト用メッシュ
  private highlightMesh: THREE.Mesh;

  // 現在ターゲット中のブロック
  private targetBlock: { x: number; y: number; z: number } | null = null;
  private targetNormal: { x: number; y: number; z: number } | null = null;

  // 破壊進捗
  private breakProgress = 0;
  private breakTarget: { x: number; y: number; z: number } | null = null;

  // 破壊パーティクル
  private breakParticles: BreakParticles;

  // ハイライト表示ON/OFF
  private highlightEnabled = true;

  // プレイヤー位置
  private playerPosition = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    worldManager: WorldManager,
    inventory: Inventory
  ) {
    this.scene = scene;
    this.camera = camera;
    this.worldManager = worldManager;
    this.inventory = inventory;

    // ハイライトメッシュ
    const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const mat = new THREE.MeshBasicMaterial({
      color: BLOCK_HIGHLIGHT_COLOR,
      transparent: true,
      opacity: BLOCK_HIGHLIGHT_OPACITY,
      depthTest: true,
    });
    this.highlightMesh = new THREE.Mesh(geo, mat);
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);

    // ワイヤーフレーム
    const wireGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    this.highlightMesh.add(new THREE.Mesh(wireGeo, wireMat));

    // 破壊パーティクル
    this.breakParticles = new BreakParticles(scene);
  }

  setPlayerController(pc: PlayerController): void {
    this.playerController = pc;
  }

  setHighlightEnabled(enabled: boolean): void {
    this.highlightEnabled = enabled;
    if (!enabled) {
      this.highlightMesh.visible = false;
    }
  }

  update(dt: number, input: InputManager, playerPos: THREE.Vector3): void {
    this.playerPosition.copy(playerPos);
    const debug = getDebugLog();

    // マウスカーソル位置からレイキャスト
    const mouseNdc = input.getMouseNdc();
    this.castRay(mouseNdc.x, mouseNdc.y);

    // ホットバー選択
    const hotbarKey = input.consumeHotbarKey();
    if (hotbarKey >= 0) {
      this.inventory.selectSlot(hotbarKey);
      const item = this.inventory.getSelectedItem();
      debug.log(`ホットバー ${hotbarKey + 1} 選択: ${item ? getBlockName(item.blockId) + ' x' + item.count : '空'}`);
    }
    const wheelDelta = input.consumeWheelDelta();
    if (wheelDelta !== 0) {
      let newSlot = this.inventory.selectedSlot + wheelDelta;
      if (newSlot < 0) newSlot = 7;
      if (newSlot > 7) newSlot = 0;
      this.inventory.selectSlot(newSlot);
      const item = this.inventory.getSelectedItem();
      debug.log(`ホットバー ${newSlot + 1} 選択: ${item ? getBlockName(item.blockId) + ' x' + item.count : '空'}`);
    }

    // 長押し → ブロック破壊
    if (input.isBlockHolding() && this.targetBlock) {
      this.handleBreak(dt);
    } else {
      if (this.breakProgress > 0) {
        debug.log('破壊中断');
      }
      this.breakProgress = 0;
      this.breakTarget = null;
    }

    // パーティクル更新
    this.breakParticles.update(dt);

    // 短押しクリック → ブロック設置
    const clicked = input.consumeBlockClick();
    if (clicked) {
      if (!this.targetBlock) {
        debug.log('設置: ターゲットなし（カーソルがブロックに当たっていない）');
      } else if (!this.targetNormal) {
        debug.log('設置: 法線なし');
      } else {
        this.handlePlace();
      }
    }
  }

  // マウスカーソル位置からレイキャスト
  private castRay(ndcX: number, ndcY: number): void {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    const origin = raycaster.ray.origin;
    const dir = raycaster.ray.direction;

    const result = this.rayMarch(origin, dir, CAMERA_DISTANCE + BLOCK_INTERACT_RANGE);

    if (result) {
      if (!this.targetBlock ||
          this.targetBlock.x !== result.block.x ||
          this.targetBlock.y !== result.block.y ||
          this.targetBlock.z !== result.block.z) {
        const blockId = this.worldManager.getBlockWorld(result.block.x, result.block.y, result.block.z);
        const pdist = Math.sqrt(
          (result.block.x + 0.5 - this.playerPosition.x) ** 2 +
          (result.block.y + 0.5 - this.playerPosition.y) ** 2 +
          (result.block.z + 0.5 - this.playerPosition.z) ** 2
        ).toFixed(1);
        getDebugLog().log(`カーソル: ${getBlockName(blockId)} (${result.block.x},${result.block.y},${result.block.z}) 距離${pdist}`);
      }
      this.targetBlock = result.block;
      this.targetNormal = result.normal;
      this.highlightMesh.position.set(
        result.block.x + 0.5,
        result.block.y + 0.5,
        result.block.z + 0.5
      );
      this.highlightMesh.visible = this.highlightEnabled;
    } else {
      this.targetBlock = null;
      this.targetNormal = null;
      this.highlightMesh.visible = false;
    }
  }

  // ボクセルレイマーチング（DDA法）
  private rayMarch(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    maxDist: number
  ): { block: { x: number; y: number; z: number }; normal: { x: number; y: number; z: number } } | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dir.x >= 0 ? 1 : -1;
    const stepY = dir.y >= 0 ? 1 : -1;
    const stepZ = dir.z >= 0 ? 1 : -1;

    const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

    let tMaxX = dir.x !== 0
      ? ((dir.x > 0 ? (x + 1 - origin.x) : (origin.x - x)) * tDeltaX)
      : Infinity;
    let tMaxY = dir.y !== 0
      ? ((dir.y > 0 ? (y + 1 - origin.y) : (origin.y - y)) * tDeltaY)
      : Infinity;
    let tMaxZ = dir.z !== 0
      ? ((dir.z > 0 ? (z + 1 - origin.z) : (origin.z - z)) * tDeltaZ)
      : Infinity;

    let nx = 0, ny = 0, nz = 0;
    let dist = 0;

    while (dist < maxDist) {
      const blockId = this.worldManager.getBlockWorld(x, y, z);

      if (blockId !== BlockId.AIR) {
        // プレイヤーからの距離チェック
        const dx = x + 0.5 - this.playerPosition.x;
        const dy = y + 0.5 - this.playerPosition.y;
        const dz = z + 0.5 - this.playerPosition.z;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) <= BLOCK_INTERACT_RANGE) {
          return { block: { x, y, z }, normal: { x: nx, y: ny, z: nz } };
        }
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          dist = tMaxX; x += stepX; tMaxX += tDeltaX;
          nx = -stepX; ny = 0; nz = 0;
        } else {
          dist = tMaxZ; z += stepZ; tMaxZ += tDeltaZ;
          nx = 0; ny = 0; nz = -stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          dist = tMaxY; y += stepY; tMaxY += tDeltaY;
          nx = 0; ny = -stepY; nz = 0;
        } else {
          dist = tMaxZ; z += stepZ; tMaxZ += tDeltaZ;
          nx = 0; ny = 0; nz = -stepZ;
        }
      }
    }

    return null;
  }

  // ブロック破壊
  private handleBreak(dt: number): void {
    if (!this.targetBlock) return;

    if (
      !this.breakTarget ||
      this.breakTarget.x !== this.targetBlock.x ||
      this.breakTarget.y !== this.targetBlock.y ||
      this.breakTarget.z !== this.targetBlock.z
    ) {
      this.breakProgress = 0;
      this.breakTarget = { ...this.targetBlock };
      this.playerController?.lookAt(this.targetBlock.x + 0.5, this.targetBlock.z + 0.5);
      const blockId = this.worldManager.getBlockWorld(this.targetBlock.x, this.targetBlock.y, this.targetBlock.z);
      getDebugLog().log(`破壊開始: ${getBlockName(blockId)} (${this.targetBlock.x},${this.targetBlock.y},${this.targetBlock.z})`);
    }

    const blockId = this.worldManager.getBlockWorld(
      this.targetBlock.x, this.targetBlock.y, this.targetBlock.z
    );
    const info = getBlockInfo(blockId);
    if (!info) return;

    this.breakProgress += dt;

    // 破壊中パーティクル（進捗に応じて激しく）
    const progress = this.breakProgress / info.hardness;
    this.breakParticles.emitBreaking(
      this.targetBlock.x, this.targetBlock.y, this.targetBlock.z,
      blockId, progress
    );

    if (this.breakProgress >= info.hardness) {
      const dropName = info.drop !== BlockId.AIR ? getBlockName(info.drop) : 'なし';
      getDebugLog().log(`破壊完了: ${info.name} → ドロップ: ${dropName}`);

      // 破壊完了バースト
      this.breakParticles.emitBurst(
        this.targetBlock.x, this.targetBlock.y, this.targetBlock.z,
        blockId
      );

      this.worldManager.setBlock(
        this.targetBlock.x, this.targetBlock.y, this.targetBlock.z,
        BlockId.AIR
      );

      if (info.drop !== BlockId.AIR) {
        this.inventory.addItem(info.drop, 1);
      }

      this.breakProgress = 0;
      this.breakTarget = null;
    }
  }

  // ブロック設置
  private handlePlace(): void {
    if (!this.targetBlock || !this.targetNormal) return;

    const selectedItem = this.inventory.getSelectedItem();
    if (!selectedItem) return;

    const px = this.targetBlock.x + this.targetNormal.x;
    const py = this.targetBlock.y + this.targetNormal.y;
    const pz = this.targetBlock.z + this.targetNormal.z;

    // プレイヤーと重なるか
    const playerBlockX = Math.floor(this.playerPosition.x);
    const playerBlockY = Math.floor(this.playerPosition.y);
    const playerBlockZ = Math.floor(this.playerPosition.z);
    if (px === playerBlockX && (py === playerBlockY || py === playerBlockY - 1) && pz === playerBlockZ) {
      getDebugLog().log('設置失敗: プレイヤー位置と重なる');
      return;
    }

    if (this.worldManager.getBlockWorld(px, py, pz) !== BlockId.AIR) {
      getDebugLog().log('設置失敗: 設置先が空気でない');
      return;
    }

    getDebugLog().log(`ブロック設置: ${getBlockName(selectedItem.blockId)} → (${px},${py},${pz})`);
    this.playerController?.lookAt(px + 0.5, pz + 0.5);
    this.worldManager.setBlock(px, py, pz, selectedItem.blockId);
    this.inventory.consumeSelected();
  }
}
