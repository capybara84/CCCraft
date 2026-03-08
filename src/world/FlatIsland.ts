import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ISLAND_RADIUS, ISLAND_HEIGHT_Y, ISLAND_THICKNESS } from '../constants';
import { BlockTextures } from '../blocks/BlockTextures';

// フラットな浮島を生成するクラス
export class FlatIsland {
  readonly mesh: THREE.Group;
  readonly bodies: CANNON.Body[] = [];

  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    this.mesh = new THREE.Group();
    const textures = new BlockTextures();

    // 円形の浮島を生成
    for (let x = -ISLAND_RADIUS; x <= ISLAND_RADIUS; x++) {
      for (let z = -ISLAND_RADIUS; z <= ISLAND_RADIUS; z++) {
        // 円形判定
        const dist = Math.sqrt(x * x + z * z);
        if (dist > ISLAND_RADIUS) continue;

        for (let layer = 0; layer < ISLAND_THICKNESS; layer++) {
          const y = ISLAND_HEIGHT_Y - layer;
          const isTop = layer === 0;

          // メッシュ作成
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const blockMesh = isTop
            ? new THREE.Mesh(geometry, textures.createGrassMaterials())
            : new THREE.Mesh(geometry, textures.createDirtMaterial());
          blockMesh.position.set(x, y, z);
          this.mesh.add(blockMesh);
        }
      }
    }

    scene.add(this.mesh);

    // 物理ボディ: 島全体を1つの静的ボディとして作成
    // パフォーマンスのため、薄い大きなボックスで近似
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(
        new CANNON.Vec3(ISLAND_RADIUS + 0.5, ISLAND_THICKNESS / 2, ISLAND_RADIUS + 0.5)
      ),
      position: new CANNON.Vec3(
        0,
        ISLAND_HEIGHT_Y - ISLAND_THICKNESS / 2 + 0.5,
        0
      ),
    });
    physicsWorld.addBody(groundBody);
    this.bodies.push(groundBody);
  }
}
