import * as THREE from 'three';
import { BlockId } from './BlockTypes';
import { TEXTURE_SIZE } from '../constants';

// 面の方向
export enum FaceDir {
  PX = 0, // +x 右
  NX = 1, // -x 左
  PY = 2, // +y 上
  NY = 3, // -y 下
  PZ = 4, // +z 前
  NZ = 5, // -z 後
}

// テクスチャ生成関数の型
type TextureGenerator = (ctx: CanvasRenderingContext2D, size: number) => void;

// ブロックID・面方向ごとのテクスチャアトラスを管理するクラス
// 16x16のプロシージャルテクスチャを生成してアトラスに配置
export class BlockTextures {
  private colorMap = new Map<string, THREE.Color>();
  private atlas: THREE.Texture;
  private atlasSize: number; // アトラスの1辺のセル数
  private uvMap = new Map<string, { u: number; v: number }>(); // blockId_face → アトラスUV

  constructor() {
    this.atlasSize = 16; // 16x16 = 256セル（十分な余裕）
    this.atlas = this.buildAtlas();
    this.buildColorMap();
  }

  getAtlas(): THREE.Texture {
    return this.atlas;
  }

  // アトラス上のUVオフセットを取得（左下原点、1セル分の幅 = 1/atlasSize）
  getUV(blockId: BlockId, face: FaceDir): { u: number; v: number; size: number } {
    const key = `${blockId}_${face}`;
    const uv = this.uvMap.get(key) ?? this.uvMap.get(`${blockId}_default`);
    if (uv) {
      return { u: uv.u, v: uv.v, size: 1 / this.atlasSize };
    }
    // フォールバック（マゼンタ）
    return { u: 0, v: 0, size: 1 / this.atlasSize };
  }

  // 頂点カラー用（BreakParticles等で使用）
  getColor(blockId: BlockId, face: FaceDir): THREE.Color {
    return this.colorMap.get(`${blockId}_${face}`)
      ?? this.colorMap.get(`${blockId}_default`)
      ?? new THREE.Color(0xff00ff);
  }

  private buildColorMap(): void {
    // パーティクル用の色マップ（従来互換）
    this.setColor(BlockId.GRASS, FaceDir.PY, '#4a8c3f');
    this.setColor(BlockId.GRASS, FaceDir.NY, '#6b4226');
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.setColor(BlockId.GRASS, f, '#5a6b32');
    }
    this.setColor(BlockId.DARK_GRASS, FaceDir.PY, '#2d6b2e');
    this.setColor(BlockId.DARK_GRASS, FaceDir.NY, '#5a3720');
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.setColor(BlockId.DARK_GRASS, f, '#3d5a28');
    }
    this.setColorDefault(BlockId.DIRT, '#6b4226');
    this.setColorDefault(BlockId.STONE, '#808080');
    this.setColorDefault(BlockId.SAND, '#d4b96e');
    this.setColor(BlockId.WOOD, FaceDir.PY, '#a07828');
    this.setColor(BlockId.WOOD, FaceDir.NY, '#a07828');
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.setColor(BlockId.WOOD, f, '#8b6914');
    }
    this.setColorDefault(BlockId.LEAVES, '#2d8c2d');
    this.setColorDefault(BlockId.DARK_LEAVES, '#1a6b1a');
    this.setColorDefault(BlockId.CACTUS, '#2d7a2d');
    this.setColorDefault(BlockId.DEAD_WOOD, '#8b7355');
    this.setColorDefault(BlockId.PLANKS, '#b8860b');
    this.setColorDefault(BlockId.STONE_BRICK, '#a0a0a0');
    this.setColorDefault(BlockId.CRAFTING_TABLE, '#c48432');
  }

  private setColor(blockId: BlockId, face: FaceDir, hex: string): void {
    this.colorMap.set(`${blockId}_${face}`, new THREE.Color(hex));
  }

  private setColorDefault(blockId: BlockId, hex: string): void {
    const color = new THREE.Color(hex);
    this.colorMap.set(`${blockId}_default`, color);
    for (let f = 0; f <= 5; f++) {
      this.colorMap.set(`${blockId}_${f}`, color);
    }
  }

  // ===== テクスチャアトラス生成 =====

  private buildAtlas(): THREE.Texture {
    const cellSize = TEXTURE_SIZE; // 16px
    const totalSize = this.atlasSize * cellSize; // 256px
    const canvas = document.createElement('canvas');
    canvas.width = totalSize;
    canvas.height = totalSize;
    const ctx = canvas.getContext('2d')!;

    // 背景をマゼンタ（フォールバック確認用）
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, totalSize, totalSize);

    let slotIndex = 0;

    const registerFace = (blockId: BlockId, face: FaceDir | 'default', gen: TextureGenerator) => {
      const col = slotIndex % this.atlasSize;
      const row = Math.floor(slotIndex / this.atlasSize);
      const x = col * cellSize;
      const y = row * cellSize;

      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.rect(0, 0, cellSize, cellSize);
      ctx.clip();
      gen(ctx, cellSize);
      ctx.restore();

      // UV（Three.jsはY上向き、canvasはY下向き）
      const u = col / this.atlasSize;
      const v = 1 - (row + 1) / this.atlasSize;
      const key = `${blockId}_${face}`;
      this.uvMap.set(key, { u, v });
      slotIndex++;
    };

    const registerAllFaces = (blockId: BlockId, gen: TextureGenerator) => {
      registerFace(blockId, 'default', gen);
      for (let f = 0; f <= 5; f++) {
        this.uvMap.set(`${blockId}_${f}`, this.uvMap.get(`${blockId}_default`)!);
      }
    };

    const registerPerFace = (blockId: BlockId, faces: { face: FaceDir | 'default'; gen: TextureGenerator }[]) => {
      for (const { face, gen } of faces) {
        registerFace(blockId, face, gen);
      }
      // 個別に登録された面以外はdefaultを使う
      const def = this.uvMap.get(`${blockId}_default`);
      if (def) {
        for (let f = 0; f <= 5; f++) {
          if (!this.uvMap.has(`${blockId}_${f}`)) {
            this.uvMap.set(`${blockId}_${f}`, def);
          }
        }
      }
    };

    // === 各ブロックのテクスチャ生成 ===

    // 草ブロック
    registerPerFace(BlockId.GRASS, [
      { face: FaceDir.PY, gen: (ctx, s) => this.genGrassTop(ctx, s) },
      { face: FaceDir.NY, gen: (ctx, s) => this.genDirt(ctx, s) },
      { face: 'default', gen: (ctx, s) => this.genGrassSide(ctx, s) },
    ]);
    // 側面を全てdefaultに
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.uvMap.set(`${BlockId.GRASS}_${f}`, this.uvMap.get(`${BlockId.GRASS}_default`)!);
    }

    // 暗い草
    registerPerFace(BlockId.DARK_GRASS, [
      { face: FaceDir.PY, gen: (ctx, s) => this.genGrassTop(ctx, s, '#2d6b2e', '#1f5a20') },
      { face: FaceDir.NY, gen: (ctx, s) => this.genDirt(ctx, s, '#5a3720') },
      { face: 'default', gen: (ctx, s) => this.genGrassSide(ctx, s, '#3d5a28', '#5a3720', '#2d6b2e') },
    ]);
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.uvMap.set(`${BlockId.DARK_GRASS}_${f}`, this.uvMap.get(`${BlockId.DARK_GRASS}_default`)!);
    }

    // 土
    registerAllFaces(BlockId.DIRT, (ctx, s) => this.genDirt(ctx, s));

    // 石
    registerAllFaces(BlockId.STONE, (ctx, s) => this.genStone(ctx, s));

    // 砂
    registerAllFaces(BlockId.SAND, (ctx, s) => this.genSand(ctx, s));

    // 木の幹
    registerPerFace(BlockId.WOOD, [
      { face: FaceDir.PY, gen: (ctx, s) => this.genWoodTop(ctx, s) },
      { face: FaceDir.NY, gen: (ctx, s) => this.genWoodTop(ctx, s) },
      { face: 'default', gen: (ctx, s) => this.genWoodSide(ctx, s) },
    ]);
    for (const f of [FaceDir.PX, FaceDir.NX, FaceDir.PZ, FaceDir.NZ]) {
      this.uvMap.set(`${BlockId.WOOD}_${f}`, this.uvMap.get(`${BlockId.WOOD}_default`)!);
    }

    // 葉
    registerAllFaces(BlockId.LEAVES, (ctx, s) => this.genLeaves(ctx, s, '#2d8c2d', '#1a6b1a'));

    // 暗い葉
    registerAllFaces(BlockId.DARK_LEAVES, (ctx, s) => this.genLeaves(ctx, s, '#1a6b1a', '#0f4f0f'));

    // サボテン
    registerAllFaces(BlockId.CACTUS, (ctx, s) => this.genCactus(ctx, s));

    // 枯れ木
    registerAllFaces(BlockId.DEAD_WOOD, (ctx, s) => this.genNoise(ctx, s, '#8b7355', '#7a6345', '#9b8365'));

    // 木材（板）
    registerAllFaces(BlockId.PLANKS, (ctx, s) => this.genPlanks(ctx, s));

    // 石レンガ
    registerAllFaces(BlockId.STONE_BRICK, (ctx, s) => this.genStoneBrick(ctx, s));

    // クラフト台
    registerPerFace(BlockId.CRAFTING_TABLE, [
      { face: FaceDir.PY, gen: (ctx, s) => this.genCraftingTableTop(ctx, s) },
      { face: 'default', gen: (ctx, s) => this.genCraftingTableSide(ctx, s) },
    ]);
    for (const f of [FaceDir.NX, FaceDir.PX, FaceDir.PZ, FaceDir.NZ, FaceDir.NY]) {
      if (!this.uvMap.has(`${BlockId.CRAFTING_TABLE}_${f}`)) {
        this.uvMap.set(`${BlockId.CRAFTING_TABLE}_${f}`, this.uvMap.get(`${BlockId.CRAFTING_TABLE}_default`)!);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // === テクスチャ生成ヘルパー ===

  private seededRandom(x: number, y: number, seed: number = 0): number {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 113.3) * 43758.5453;
    return n - Math.floor(n);
  }

  private genNoise(ctx: CanvasRenderingContext2D, s: number, base: string, dark: string, light: string): void {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 42);
        if (r < 0.2) {
          ctx.fillStyle = dark;
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.85) {
          ctx.fillStyle = light;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genGrassTop(ctx: CanvasRenderingContext2D, s: number, base = '#4a8c3f', dark = '#3a7a2f'): void {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 1);
        if (r < 0.15) {
          ctx.fillStyle = dark;
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.88) {
          ctx.fillStyle = '#5a9c4f';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.82) {
          ctx.fillStyle = '#428735';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genGrassSide(ctx: CanvasRenderingContext2D, s: number, sideBase = '#5a6b32', dirtBase = '#6b4226', grassStripe = '#4a8c3f'): void {
    // 上部は草、下部は土
    const grassHeight = Math.floor(s * 0.25);
    // 土部分
    ctx.fillStyle = dirtBase;
    ctx.fillRect(0, 0, s, s);
    for (let y = grassHeight; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 2);
        if (r < 0.15) {
          ctx.fillStyle = '#5a3518';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.88) {
          ctx.fillStyle = '#7b5236';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // 草帯
    ctx.fillStyle = sideBase;
    ctx.fillRect(0, 0, s, grassHeight);
    for (let x = 0; x < s; x++) {
      const r = this.seededRandom(x, 0, 3);
      const extra = r > 0.5 ? 1 : 0;
      ctx.fillStyle = grassStripe;
      ctx.fillRect(x, 0, 1, grassHeight + extra);
    }
    // 草の垂れ下がり
    for (let x = 0; x < s; x++) {
      const r = this.seededRandom(x, 100, 4);
      if (r > 0.6) {
        const hang = Math.floor(r * 3) + 1;
        ctx.fillStyle = sideBase;
        ctx.fillRect(x, grassHeight, 1, hang);
      }
    }
  }

  private genDirt(ctx: CanvasRenderingContext2D, s: number, base = '#6b4226'): void {
    this.genNoise(ctx, s, base, '#5a3518', '#7b5236');
  }

  private genStone(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 5);
        if (r < 0.12) {
          ctx.fillStyle = '#696969';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.85) {
          ctx.fillStyle = '#909090';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.75) {
          ctx.fillStyle = '#787878';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // ひび割れ風のライン
    for (let i = 0; i < 3; i++) {
      const startX = Math.floor(this.seededRandom(i, 0, 50) * s);
      const startY = Math.floor(this.seededRandom(0, i, 51) * s);
      ctx.fillStyle = '#686868';
      for (let j = 0; j < 4; j++) {
        const dx = Math.floor(this.seededRandom(i, j, 52) * 3) - 1;
        ctx.fillRect((startX + j + dx) % s, (startY + j) % s, 1, 1);
      }
    }
  }

  private genSand(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#d4b96e';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 6);
        if (r < 0.15) {
          ctx.fillStyle = '#c4a95e';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.85) {
          ctx.fillStyle = '#e4c97e';
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.78) {
          ctx.fillStyle = '#dcc070';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genWoodTop(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#a07828';
    ctx.fillRect(0, 0, s, s);
    // 年輪
    const cx = s / 2, cy = s / 2;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const ring = Math.floor(dist) % 3;
        if (ring === 0) {
          ctx.fillStyle = '#8b6914';
          ctx.fillRect(x, y, 1, 1);
        }
        const r = this.seededRandom(x, y, 7);
        if (r > 0.9) {
          ctx.fillStyle = '#b08838';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genWoodSide(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(0, 0, s, s);
    // 縦線（樹皮）
    for (let x = 0; x < s; x++) {
      const r = this.seededRandom(x, 0, 8);
      if (r < 0.3) {
        ctx.fillStyle = '#7a5a0c';
        for (let y = 0; y < s; y++) {
          ctx.fillRect(x, y, 1, 1);
        }
      } else if (r > 0.8) {
        ctx.fillStyle = '#9b7924';
        for (let y = 0; y < s; y++) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // ノイズ
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 9);
        if (r > 0.92) {
          ctx.fillStyle = '#a07828';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genLeaves(ctx: CanvasRenderingContext2D, s: number, base: string, dark: string): void {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 10);
        if (r < 0.2) {
          ctx.fillStyle = dark;
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.8) {
          // 明るい葉のスポット
          const c = new THREE.Color(base);
          ctx.fillStyle = `rgb(${Math.min(255, Math.floor(c.r * 255 + 40))},${Math.min(255, Math.floor(c.g * 255 + 30))},${Math.min(255, Math.floor(c.b * 255 + 20))})`;
          ctx.fillRect(x, y, 1, 1);
        } else if (r > 0.65) {
          // 透け感
          const c = new THREE.Color(base);
          ctx.fillStyle = `rgb(${Math.floor(c.r * 255 * 0.85)},${Math.floor(c.g * 255 * 1.1)},${Math.floor(c.b * 255 * 0.85)})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genCactus(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#2d7a2d';
    ctx.fillRect(0, 0, s, s);
    // 縦ライン
    for (let x = 0; x < s; x += 4) {
      ctx.fillStyle = '#237023';
      ctx.fillRect(x, 0, 1, s);
    }
    // ノイズ
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 11);
        if (r > 0.9) {
          ctx.fillStyle = '#3d8a3d';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // トゲ
    for (let i = 0; i < 4; i++) {
      const tx = Math.floor(this.seededRandom(i, 0, 12) * s);
      const ty = Math.floor(this.seededRandom(0, i, 13) * s);
      ctx.fillStyle = '#c8c878';
      ctx.fillRect(tx, ty, 1, 1);
    }
  }

  private genPlanks(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(0, 0, s, s);
    // 横板
    const plankHeight = 4;
    for (let row = 0; row < s; row += plankHeight) {
      // 板の区切り線
      ctx.fillStyle = '#a07608';
      ctx.fillRect(0, row, s, 1);
      // 板ごとにわずかに色変え
      const shade = this.seededRandom(0, row, 14) * 0.15 - 0.075;
      const r = Math.floor(0xb8 * (1 + shade));
      const g = Math.floor(0x86 * (1 + shade));
      const b = Math.floor(0x0b * (1 + shade));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, row + 1, s, plankHeight - 1);
    }
    // 木目ノイズ
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 15);
        if (r > 0.88) {
          ctx.fillStyle = '#c89618';
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.08) {
          ctx.fillStyle = '#a07608';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genStoneBrick(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(0, 0, s, s);
    // レンガの目地
    ctx.fillStyle = '#808080';
    const brickH = 4;
    for (let row = 0; row < s; row += brickH) {
      ctx.fillRect(0, row, s, 1); // 横目地
      const offset = (Math.floor(row / brickH) % 2) * (s / 2);
      for (let col = 0; col < s; col += s / 2) {
        ctx.fillRect((col + offset) % s, row, 1, brickH); // 縦目地
      }
    }
    // ノイズ
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 16);
        if (r > 0.9) {
          ctx.fillStyle = '#b0b0b0';
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.08) {
          ctx.fillStyle = '#909090';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genCraftingTableTop(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#c48432';
    ctx.fillRect(0, 0, s, s);
    // 格子模様
    const half = s / 2;
    ctx.fillStyle = '#b07428';
    ctx.fillRect(0, 0, half, half);
    ctx.fillRect(half, half, half, half);
    // ノイズ
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 17);
        if (r > 0.9) {
          ctx.fillStyle = '#d49442';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private genCraftingTableSide(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.fillStyle = '#b07428';
    ctx.fillRect(0, 0, s, s);
    // 横板
    for (let row = 0; row < s; row += 4) {
      ctx.fillStyle = '#a06418';
      ctx.fillRect(0, row, s, 1);
    }
    // ツール模様（簡易）
    ctx.fillStyle = '#808080';
    ctx.fillRect(3, 3, 1, 5); // ハンマー柄
    ctx.fillRect(2, 2, 3, 1); // ハンマー頭
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(s - 5, 4, 1, 5); // ノコギリ柄
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(s - 6, 3, 3, 1); // ノコギリ刃
    // ノイズ
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, 18);
        if (r > 0.92) {
          ctx.fillStyle = '#c08438';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
}
