// キーボード・マウス入力を一元管理するクラス
// 操作モデル: クリック=ブロック操作、ドラッグ=カメラ回転（iPad互換）
export class InputManager {
  readonly keys: Set<string> = new Set();
  private _keysJustPressed: Set<string> = new Set();

  // マウス位置（正規化デバイス座標 -1〜1）
  private _mouseNdcX = 0;
  private _mouseNdcY = 0;

  // カメラ回転（ドラッグ）
  private _cameraDeltaX = 0;
  private _cameraDeltaY = 0;

  // マウス操作の統合管理（クリックvsドラッグで判別）
  private _mouseDown = false;
  private _mouseDownTime = 0;
  private _mouseDownX = 0; // mousedown時のスクリーン座標
  private _mouseDownY = 0;
  private _mouseMoved = false; // ドラッグ判定用（移動量が閾値超えたか）
  private _blockClicked = false; // 短押し（設置用）
  private _blockHolding = false; // 長押し中（破壊用）

  // ホイール
  private _wheelDelta = 0;

  // インベントリトグル
  private _inventoryToggled = false;

  // デバッグ表示トグル
  private _debugToggled = false;

  // グライダートグル
  private _gliderToggled = false;

  // タッチボタン入力
  private _touchJumping = false;
  private _touchGliderToggled = false;

  // 閾値
  private readonly HOLD_THRESHOLD = 300; // 長押し判定（ミリ秒）
  private readonly DRAG_THRESHOLD = 5; // ドラッグ判定（ピクセル）

  constructor(canvas: HTMLCanvasElement) {

    // キーボード
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this._keysJustPressed.add(e.code);
      }
      this.keys.add(e.code);
      if (e.code === 'KeyE') {
        this._inventoryToggled = true;
      }
      if (e.code === 'KeyP') {
        this._debugToggled = true;
      }
      if (e.code === 'KeyG') {
        this._gliderToggled = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // マウス移動（常にカーソル位置を更新）
    window.addEventListener('mousemove', (e) => {
      // NDC座標に変換
      this._mouseNdcX = (e.clientX / window.innerWidth) * 2 - 1;
      this._mouseNdcY = -(e.clientY / window.innerHeight) * 2 + 1;

      // マウスダウン中: ドラッグ判定
      if (this._mouseDown) {
        const dx = e.clientX - this._mouseDownX;
        const dy = e.clientY - this._mouseDownY;
        if (Math.sqrt(dx * dx + dy * dy) > this.DRAG_THRESHOLD) {
          this._mouseMoved = true;
        }

        // ドラッグ中はカメラ回転
        if (this._mouseMoved) {
          this._cameraDeltaX += e.movementX;
          this._cameraDeltaY += e.movementY;
        }
      }
    });

    // マウスダウン
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // 左ボタンのみ

      this._mouseDown = true;
      this._mouseDownTime = performance.now();
      this._mouseDownX = e.clientX;
      this._mouseDownY = e.clientY;
      this._mouseMoved = false;
      this._blockHolding = false;
      this._blockClicked = false;
    });

    // マウスアップ
    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;

      if (this._mouseDown && !this._mouseMoved) {
        // ドラッグしていない → ブロック操作
        const elapsed = performance.now() - this._mouseDownTime;
        if (elapsed < this.HOLD_THRESHOLD) {
          // 短押し → 設置
          this._blockClicked = true;
        }
      }

      this._mouseDown = false;
      this._mouseMoved = false;
      this._blockHolding = false;
    });

    // コンテキストメニュー無効化
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ホイール
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this._wheelDelta += Math.sign(e.deltaY);
    }, { passive: false });

  }

  // === 移動系 ===
  getMovement(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    const len = Math.sqrt(x * x + z * z);
    if (len > 0) { x /= len; z /= len; }
    return { x, z };
  }

  isJumping(): boolean {
    return this.keys.has('Space') || this._touchJumping;
  }

  isRunning(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }

  // === カメラ回転 ===
  consumeMouseDelta(): { x: number; y: number } {
    const delta = { x: this._cameraDeltaX, y: this._cameraDeltaY };
    this._cameraDeltaX = 0;
    this._cameraDeltaY = 0;
    return delta;
  }

  // === ブロック操作 ===
  // マウスカーソルのNDC座標（レイキャスト用）
  getMouseNdc(): { x: number; y: number } {
    return { x: this._mouseNdcX, y: this._mouseNdcY };
  }

  // 長押し中か（破壊用）。ドラッグ中は無効
  isBlockHolding(): boolean {
    if (this._mouseDown && !this._mouseMoved) {
      const elapsed = performance.now() - this._mouseDownTime;
      if (elapsed >= this.HOLD_THRESHOLD) {
        this._blockHolding = true;
      }
    }
    return this._blockHolding;
  }

  // 短押しクリックが発生したか（設置用、消費型）
  consumeBlockClick(): boolean {
    const clicked = this._blockClicked;
    this._blockClicked = false;
    return clicked;
  }

  // === ホットバー ===
  consumeWheelDelta(): number {
    const delta = this._wheelDelta;
    this._wheelDelta = 0;
    return delta;
  }

  consumeHotbarKey(): number {
    for (let i = 1; i <= 8; i++) {
      const code = `Digit${i}`;
      if (this._keysJustPressed.has(code)) {
        this._keysJustPressed.delete(code);
        return i - 1;
      }
    }
    return -1;
  }

  consumeInventoryToggle(): boolean {
    const toggled = this._inventoryToggled;
    this._inventoryToggled = false;
    return toggled;
  }

  consumeDebugToggle(): boolean {
    const toggled = this._debugToggled;
    this._debugToggled = false;
    return toggled;
  }

  consumeGliderToggle(): boolean {
    const toggled = this._gliderToggled || this._touchGliderToggled;
    this._gliderToggled = false;
    this._touchGliderToggled = false;
    return toggled;
  }

  // タッチボタンからの入力
  setTouchJumping(value: boolean): void {
    this._touchJumping = value;
  }

  triggerGliderToggle(): void {
    this._touchGliderToggled = true;
  }

  endFrame(): void {
    this._keysJustPressed.clear();
  }
}
