import * as THREE from 'three';
import {
  PLAYER_HEAD_SIZE,
  PLAYER_BODY_SIZE,
  PLAYER_ARM_SIZE,
  PLAYER_LEG_SIZE,
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

    const legH = PLAYER_LEG_SIZE.h;
    const bodyH = PLAYER_BODY_SIZE.h;

    // === 左脚 ===
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-PLAYER_LEG_SIZE.w / 2, legH, 0);
    const leftLeg = this.createPart(
      PLAYER_LEG_SIZE.w, PLAYER_LEG_SIZE.h, PLAYER_LEG_SIZE.d,
      this.genLegTexture()
    );
    leftLeg.position.set(0, -PLAYER_LEG_SIZE.h / 2, 0);
    this.leftLegPivot.add(leftLeg);
    inner.add(this.leftLegPivot);

    // === 右脚 ===
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(PLAYER_LEG_SIZE.w / 2, legH, 0);
    const rightLeg = this.createPart(
      PLAYER_LEG_SIZE.w, PLAYER_LEG_SIZE.h, PLAYER_LEG_SIZE.d,
      this.genLegTexture(1)
    );
    rightLeg.position.set(0, -PLAYER_LEG_SIZE.h / 2, 0);
    this.rightLegPivot.add(rightLeg);
    inner.add(this.rightLegPivot);

    // === 体 ===
    const body = this.createPart(
      PLAYER_BODY_SIZE.w, PLAYER_BODY_SIZE.h, PLAYER_BODY_SIZE.d,
      this.genBodyTexture()
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
      PLAYER_ARM_SIZE.w, PLAYER_ARM_SIZE.h, PLAYER_ARM_SIZE.d,
      this.genArmTexture()
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
      PLAYER_ARM_SIZE.w, PLAYER_ARM_SIZE.h, PLAYER_ARM_SIZE.d,
      this.genArmTexture(1)
    );
    rightArm.position.set(0, -PLAYER_ARM_SIZE.h / 2, 0);
    this.rightArmPivot.add(rightArm);
    inner.add(this.rightArmPivot);

    // === 頭 ===
    const head = this.createPart(
      PLAYER_HEAD_SIZE.w, PLAYER_HEAD_SIZE.h, PLAYER_HEAD_SIZE.d,
      this.genHeadTexture()
    );
    const headY = legH + bodyH + PLAYER_HEAD_SIZE.h / 2;
    head.position.set(0, headY, 0);
    inner.add(head);

    this.group.add(inner);
  }

  private createPart(w: number, h: number, d: number, material: THREE.Material | THREE.Material[]): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geometry, material);
  }

  // === テクスチャ生成ユーティリティ ===

  private seededRandom(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 113.3) * 43758.5453;
    return n - Math.floor(n);
  }

  private createCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  private canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private addNoise(ctx: CanvasRenderingContext2D, s: number, seed: number, darkColor: string, lightColor: string, darkRate = 0.12, lightRate = 0.88): void {
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = this.seededRandom(x, y, seed);
        if (r < darkRate) {
          ctx.fillStyle = darkColor;
          ctx.fillRect(x, y, 1, 1);
        } else if (r > lightRate) {
          ctx.fillStyle = lightColor;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  // === 頭テクスチャ（6面展開） ===
  private genHeadTexture(): THREE.Material[] {
    const s = 16;

    const makeFace = (seed: number, isFront: boolean) => {
      const { canvas, ctx } = this.createCanvas(s);
      // 肌色ベース
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(0, 0, s, s);
      this.addNoise(ctx, s, seed, '#eebb88', '#ffdda8');

      if (isFront) {
        // 目
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, 5, 4, 3);
        ctx.fillRect(9, 5, 4, 3);
        // 瞳
        ctx.fillStyle = '#2244aa';
        ctx.fillRect(5, 5, 2, 3);
        ctx.fillRect(11, 5, 2, 3);
        // 瞳孔
        ctx.fillStyle = '#111111';
        ctx.fillRect(5, 6, 1, 2);
        ctx.fillRect(11, 6, 1, 2);
        // 口
        ctx.fillStyle = '#cc8866';
        ctx.fillRect(6, 11, 4, 1);
        // 鼻
        ctx.fillStyle = '#eebb88';
        ctx.fillRect(7, 8, 2, 2);
      }

      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    const makeTop = () => {
      const { canvas, ctx } = this.createCanvas(s);
      // 髪色
      ctx.fillStyle = '#4a3020';
      ctx.fillRect(0, 0, s, s);
      this.addNoise(ctx, s, 30, '#3a2010', '#5a4030');
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    const makeBottom = () => {
      const { canvas, ctx } = this.createCanvas(s);
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(0, 0, s, s);
      this.addNoise(ctx, s, 31, '#eebb88', '#ffdda8');
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    const makeSideHead = (seed: number) => {
      const { canvas, ctx } = this.createCanvas(s);
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(0, 0, s, s);
      // 上部に髪
      ctx.fillStyle = '#4a3020';
      ctx.fillRect(0, 0, s, 4);
      this.addNoise(ctx, s, seed, '#eebb88', '#ffdda8');
      // 耳
      ctx.fillStyle = '#f0bb88';
      ctx.fillRect(1, 6, 2, 3);
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    const makeBack = () => {
      const { canvas, ctx } = this.createCanvas(s);
      // 後頭部は髪
      ctx.fillStyle = '#4a3020';
      ctx.fillRect(0, 0, s, s);
      this.addNoise(ctx, s, 33, '#3a2010', '#5a4030');
      // 下部に少し肌
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(3, 13, 10, 3);
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    // BoxGeometry面順: +X, -X, +Y, -Y, +Z, -Z
    return [
      makeSideHead(34),  // +X（右側面）
      makeSideHead(35),  // -X（左側面）
      makeTop(),         // +Y（頭頂）
      makeBottom(),      // -Y（顎下）
      makeFace(36, true),// +Z（正面）
      makeBack(),        // -Z（後頭部）
    ];
  }

  // === 体テクスチャ（6面） ===
  private genBodyTexture(): THREE.Material[] {
    const s = 16;

    const makeShirtBase = (seed: number) => {
      const { canvas, ctx } = this.createCanvas(s);
      ctx.fillStyle = '#3366cc';
      ctx.fillRect(0, 0, s, s);
      this.addNoise(ctx, s, seed, '#2255bb', '#4477dd');
      ctx.fillStyle = '#2855aa';
      ctx.fillRect(0, 14, s, 2);
      return { canvas, ctx };
    };

    // 正面（+Z）: ボタン・襟・ポケット
    const makeFront = () => {
      const { canvas, ctx } = makeShirtBase(40);
      ctx.fillStyle = '#2855aa';
      ctx.fillRect(5, 0, 6, 2);
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(7, 3, 2, 1);
      ctx.fillRect(7, 6, 2, 1);
      ctx.fillRect(7, 9, 2, 1);
      ctx.fillStyle = '#2855aa';
      ctx.fillRect(2, 8, 4, 3);
      ctx.fillRect(2, 8, 4, 1);
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    // 背面（-Z）: シンプル
    const makeBack = () => {
      const { canvas, ctx } = makeShirtBase(41);
      ctx.fillStyle = '#2855aa';
      ctx.fillRect(5, 0, 6, 2);
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    // 側面（+X, -X）
    const makeSide = (seed: number) => {
      const { canvas } = makeShirtBase(seed);
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    // 上面・下面
    const makeTopBottom = (seed: number) => {
      const { canvas, ctx: c } = this.createCanvas(s);
      c.fillStyle = '#3366cc';
      c.fillRect(0, 0, s, s);
      this.addNoise(c, s, seed, '#2255bb', '#4477dd');
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    // BoxGeometry面順: +X, -X, +Y, -Y, +Z, -Z
    return [
      makeSide(42),       // +X（右側面）
      makeSide(43),       // -X（左側面）
      makeTopBottom(44),  // +Y（肩上面）
      makeTopBottom(45),  // -Y（腰下面）
      makeFront(),        // +Z（正面）
      makeBack(),         // -Z（背面）
    ];
  }

  // === 腕テクスチャ ===
  private genArmTexture(seed = 0): THREE.Material[] {
    const s = 16;

    // 肌面（下半分）
    const makeSkin = (sd: number) => {
      const { canvas, ctx } = this.createCanvas(s);
      // 上半分：袖（青）
      ctx.fillStyle = '#3366cc';
      ctx.fillRect(0, 0, s, 8);
      this.addNoise(ctx, s, 50 + sd, '#2255bb', '#4477dd');
      // 袖口
      ctx.fillStyle = '#2855aa';
      ctx.fillRect(0, 6, s, 2);
      // 下半分：肌
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(0, 8, s, 8);
      for (let y = 8; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = this.seededRandom(x, y, 51 + sd);
          if (r < 0.1) {
            ctx.fillStyle = '#eebb88';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    // 袖のみ面（上面）
    const makeSleeve = (sd: number) => {
      const { canvas, ctx } = this.createCanvas(s);
      ctx.fillStyle = '#3366cc';
      ctx.fillRect(0, 0, s, s);
      this.addNoise(ctx, s, 52 + sd, '#2255bb', '#4477dd');
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    // 手のひら面（底面）
    const makeHand = (sd: number) => {
      const { canvas, ctx } = this.createCanvas(s);
      ctx.fillStyle = '#f0bb88';
      ctx.fillRect(0, 0, s, s);
      this.addNoise(ctx, s, 53 + sd, '#e0aa78', '#ffc898');
      return new THREE.MeshLambertMaterial({ map: this.canvasToTexture(canvas) });
    };

    return [
      makeSkin(seed),     // +X
      makeSkin(seed + 10),// -X
      makeSleeve(seed),   // +Y（肩上面）
      makeHand(seed),     // -Y（手のひら）
      makeSkin(seed + 20),// +Z
      makeSkin(seed + 30),// -Z
    ];
  }

  // === 脚テクスチャ ===
  private genLegTexture(seed = 0): THREE.Material {
    const s = 16;
    const { canvas, ctx } = this.createCanvas(s);

    // 濃紺のズボン
    ctx.fillStyle = '#1a1a4e';
    ctx.fillRect(0, 0, s, s);
    this.addNoise(ctx, s, 60 + seed, '#121240', '#22225a');

    // 裾の折り返し
    ctx.fillStyle = '#151548';
    ctx.fillRect(0, 13, s, 3);

    // 靴
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(0, 14, s, 2);
    this.addNoise(ctx, s, 61 + seed, '#2a1a0a', '#4a3a2a');

    // 膝のしわ
    ctx.fillStyle = '#22225a';
    ctx.fillRect(2, 6, s - 4, 1);

    const tex = this.canvasToTexture(canvas);
    return new THREE.MeshLambertMaterial({ map: tex });
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
