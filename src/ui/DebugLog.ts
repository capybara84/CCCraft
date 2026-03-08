// デバッグログ表示ウィンドウ（画面左上に半透明で表示）
export class DebugLog {
  private container: HTMLDivElement;
  private lines: string[] = [];
  private maxLines = 20;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position:fixed;top:8px;left:8px;
      width:360px;max-height:400px;overflow-y:auto;
      background:rgba(0,0,0,0.6);color:#0f0;
      font-family:monospace;font-size:12px;
      padding:8px;border-radius:4px;
      pointer-events:none;z-index:20;
      line-height:1.4;white-space:pre-wrap;
    `;
    document.body.appendChild(this.container);
  }

  // ログを追加
  log(message: string): void {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    this.lines.push(`[${time}] ${message}`);
    if (this.lines.length > this.maxLines) {
      this.lines.shift();
    }
    this.container.textContent = this.lines.join('\n');
    // 自動スクロール
    this.container.scrollTop = this.container.scrollHeight;
  }

  destroy(): void {
    this.container.remove();
  }
}

// グローバルインスタンス
let instance: DebugLog | null = null;

export function getDebugLog(): DebugLog {
  if (!instance) {
    instance = new DebugLog();
  }
  return instance;
}
