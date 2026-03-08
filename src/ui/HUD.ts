import { Inventory } from '../inventory/Inventory';
import { getBlockName } from '../blocks/BlockTypes';
import {
  HOTBAR_SLOTS,
  HOTBAR_SLOT_SIZE,
  HOTBAR_SLOT_GAP,
  HOTBAR_SELECTED_COLOR,
  HOTBAR_BG_COLOR,
} from '../constants';

// HUD表示を管理するクラス（ホットバー）
export class HUD {
  private container: HTMLDivElement;
  private hotbarElement: HTMLDivElement;
  private slotElements: HTMLDivElement[] = [];
  private inventory: Inventory;

  constructor(inventory: Inventory) {
    this.inventory = inventory;
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;user-select:none;';
    document.body.appendChild(this.container);

    // ホットバー
    this.hotbarElement = document.createElement('div');
    const totalWidth = HOTBAR_SLOTS * (HOTBAR_SLOT_SIZE + HOTBAR_SLOT_GAP) - HOTBAR_SLOT_GAP;
    this.hotbarElement.style.cssText = `
      position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
      display:flex;gap:${HOTBAR_SLOT_GAP}px;width:${totalWidth}px;
    `;
    this.container.appendChild(this.hotbarElement);

    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const slot = document.createElement('div');
      slot.style.cssText = `
        width:${HOTBAR_SLOT_SIZE}px;height:${HOTBAR_SLOT_SIZE}px;
        background:${HOTBAR_BG_COLOR};border:2px solid #555;
        display:flex;align-items:center;justify-content:center;
        position:relative;font-size:11px;color:white;
        font-family:monospace;border-radius:4px;cursor:pointer;
        pointer-events:auto;
      `;
      slot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.inventory.selectSlot(i);
      });
      this.hotbarElement.appendChild(slot);
      this.slotElements.push(slot);
    }

    this.update();
  }

  update(): void {
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const slot = this.slotElements[i]!;
      const item = this.inventory.hotbar[i];

      slot.style.borderColor = i === this.inventory.selectedSlot ? HOTBAR_SELECTED_COLOR : '#555';

      if (item && item.count > 0) {
        const name = getBlockName(item.blockId);
        slot.innerHTML = `
          <span style="font-size:9px;text-align:center;line-height:1.2;">${name}</span>
          <span style="position:absolute;bottom:2px;right:4px;font-size:10px;font-weight:bold;">${item.count}</span>
        `;
      } else {
        slot.innerHTML = '';
      }
    }
  }

  destroy(): void {
    this.container.remove();
  }
}
