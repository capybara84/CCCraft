import {
  TEXTURE_SIZE,
  BLOCK_GRASS_TOP_COLOR,
  BLOCK_GRASS_SIDE_COLOR,
  BLOCK_GRASS_SIDE_STRIPE_COLOR,
  BLOCK_DIRT_COLOR,
} from '../constants';
import * as THREE from 'three';

// Canvas APIでプロシージャルテクスチャを生成するクラス
export class BlockTextures {
  readonly grassTop: THREE.Texture;
  readonly grassSide: THREE.Texture;
  readonly dirt: THREE.Texture;

  constructor() {
    this.grassTop = this.createTexture(this.drawGrassTop.bind(this));
    this.grassSide = this.createTexture(this.drawGrassSide.bind(this));
    this.dirt = this.createTexture(this.drawDirt.bind(this));
  }

  private createTexture(
    drawFn: (ctx: CanvasRenderingContext2D) => void
  ): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;
    const ctx = canvas.getContext('2d')!;
    drawFn(ctx);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  }

  // 草ブロック上面: 緑にランダムなドット
  private drawGrassTop(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = BLOCK_GRASS_TOP_COLOR;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    // ランダムなドットで質感を出す
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * TEXTURE_SIZE);
      const y = Math.floor(Math.random() * TEXTURE_SIZE);
      const brightness = Math.random() > 0.5 ? 20 : -20;
      ctx.fillStyle = this.adjustBrightness(BLOCK_GRASS_TOP_COLOR, brightness);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // 草ブロック側面: 茶色ベースで上部に緑ライン
  private drawGrassSide(ctx: CanvasRenderingContext2D): void {
    // 茶色ベース
    ctx.fillStyle = BLOCK_GRASS_SIDE_COLOR;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    // 上部2pxに緑ライン
    ctx.fillStyle = BLOCK_GRASS_SIDE_STRIPE_COLOR;
    ctx.fillRect(0, 0, TEXTURE_SIZE, 2);

    // ランダムなドットで質感
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(Math.random() * TEXTURE_SIZE);
      const y = Math.floor(Math.random() * TEXTURE_SIZE);
      ctx.fillStyle = this.adjustBrightness(BLOCK_GRASS_SIDE_COLOR, Math.random() > 0.5 ? 10 : -10);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // 土ブロック: 茶色にランダムなドット
  private drawDirt(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = BLOCK_DIRT_COLOR;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * TEXTURE_SIZE);
      const y = Math.floor(Math.random() * TEXTURE_SIZE);
      ctx.fillStyle = this.adjustBrightness(BLOCK_DIRT_COLOR, Math.random() > 0.5 ? 15 : -15);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // ヘルパー: 色の明度調整
  private adjustBrightness(hex: string, amount: number): string {
    const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
    const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
    const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
    return `rgb(${r},${g},${b})`;
  }

  // 草ブロック用マテリアル配列（6面: +x, -x, +y, -y, +z, -z）
  createGrassMaterials(): THREE.MeshLambertMaterial[] {
    return [
      new THREE.MeshLambertMaterial({ map: this.grassSide }), // +x 右
      new THREE.MeshLambertMaterial({ map: this.grassSide }), // -x 左
      new THREE.MeshLambertMaterial({ map: this.grassTop }),  // +y 上
      new THREE.MeshLambertMaterial({ map: this.dirt }),       // -y 下
      new THREE.MeshLambertMaterial({ map: this.grassSide }), // +z 前
      new THREE.MeshLambertMaterial({ map: this.grassSide }), // -z 後
    ];
  }

  // 土ブロック用マテリアル
  createDirtMaterial(): THREE.MeshLambertMaterial {
    return new THREE.MeshLambertMaterial({ map: this.dirt });
  }
}
