import { RESPAWN_FADE_DURATION } from '../constants';

/**
 * 奈落落下時のフェード演出用オーバーレイ
 * フェードアウト（黒くなる）→ コールバック → フェードイン（元に戻る）
 */
export class RespawnOverlay {
  private overlay: HTMLDivElement;
  private fadeState: 'none' | 'fadeOut' | 'fadeIn' = 'none';
  private fadeTimer = 0;
  private fadeDuration: number;
  private onFadeOutComplete: (() => void) | null = null;

  constructor() {
    this.fadeDuration = RESPAWN_FADE_DURATION;

    // 画面全体を覆う黒いdiv、最初は透明
    this.overlay = document.createElement('div');
    this.overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:black;opacity:0;pointer-events:none;z-index:100;';
    document.body.appendChild(this.overlay);
  }

  /**
   * フェードアウト（黒くなる）→ onMidpointコールバック → フェードイン（元に戻る）
   */
  startRespawnFade(onMidpoint: () => void): void {
    if (this.fadeState !== 'none') return;
    this.fadeState = 'fadeOut';
    this.fadeTimer = 0;
    this.onFadeOutComplete = onMidpoint;
  }

  update(dt: number): void {
    if (this.fadeState === 'none') return;

    this.fadeTimer += dt;

    if (this.fadeState === 'fadeOut') {
      const progress = Math.min(1, this.fadeTimer / this.fadeDuration);
      this.overlay.style.opacity = String(progress);

      if (progress >= 1) {
        // フェードアウト完了 → コールバック実行 → フェードインに移行
        if (this.onFadeOutComplete) {
          this.onFadeOutComplete();
          this.onFadeOutComplete = null;
        }
        this.fadeState = 'fadeIn';
        this.fadeTimer = 0;
      }
    } else if (this.fadeState === 'fadeIn') {
      const progress = Math.min(1, this.fadeTimer / this.fadeDuration);
      this.overlay.style.opacity = String(1 - progress);

      if (progress >= 1) {
        this.overlay.style.opacity = '0';
        this.fadeState = 'none';
        this.fadeTimer = 0;
      }
    }
  }

  get isActive(): boolean {
    return this.fadeState !== 'none';
  }

  destroy(): void {
    this.overlay.remove();
  }
}
