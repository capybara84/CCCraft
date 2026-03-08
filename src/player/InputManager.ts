// キーボード・マウス入力を一元管理するクラス
export class InputManager {
  // キー入力状態
  readonly keys: Set<string> = new Set();

  // マウスドラッグ状態
  private _mouseDeltaX = 0;
  private _mouseDeltaY = 0;
  private isDragging = false;

  constructor(canvas: HTMLCanvasElement) {
    // キーボードイベント
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // マウスイベント（canvas上でのドラッグ）
    canvas.addEventListener('mousedown', () => {
      this.isDragging = true;
    });
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this._mouseDeltaX += e.movementX;
        this._mouseDeltaY += e.movementY;
      }
    });
  }

  // 移動方向を取得（-1〜1の範囲）
  getMovement(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

    // 斜め移動の正規化
    const len = Math.sqrt(x * x + z * z);
    if (len > 0) {
      x /= len;
      z /= len;
    }
    return { x, z };
  }

  isJumping(): boolean {
    return this.keys.has('Space');
  }

  isRunning(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }

  // マウスデルタを取得してリセット
  consumeMouseDelta(): { x: number; y: number } {
    const delta = { x: this._mouseDeltaX, y: this._mouseDeltaY };
    this._mouseDeltaX = 0;
    this._mouseDeltaY = 0;
    return delta;
  }
}
