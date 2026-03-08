import { Inventory } from '../inventory/Inventory';
import { getBlockName } from '../blocks/BlockTypes';
import {
  HOTBAR_SLOTS,
  BACKPACK_SLOTS,
  HOTBAR_SLOT_SIZE,
  HOTBAR_SLOT_GAP,
  HOTBAR_SELECTED_COLOR,
  HOTBAR_BG_COLOR,
} from '../constants';

// インベントリUI（Eキーで開閉するバックパック画面）
export class InventoryUI {
  private overlay: HTMLDivElement;
  private panel: HTMLDivElement;
  private hotbarSlots: HTMLDivElement[] = [];
  private backpackSlots: HTMLDivElement[] = [];
  private inventory: Inventory;
  private _isOpen = false;

  get isOpen(): boolean {
    return this._isOpen;
  }

  constructor(inventory: Inventory) {
    this.inventory = inventory;

    // 半透明オーバーレイ
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.5);z-index:50;display:none;
      justify-content:center;align-items:center;
      user-select:none;
    `;
    this.overlay.addEventListener('mousedown', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.body.appendChild(this.overlay);

    // パネル
    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      background:rgba(30,30,30,0.95);border:2px solid #666;border-radius:8px;
      padding:16px;pointer-events:auto;
    `;
    this.overlay.appendChild(this.panel);

    // タイトル
    const title = document.createElement('div');
    title.style.cssText = 'color:#ccc;font-family:monospace;font-size:14px;margin-bottom:12px;text-align:center;';
    title.textContent = 'インベントリ';
    this.panel.appendChild(title);

    // バックパック
    const bpLabel = document.createElement('div');
    bpLabel.style.cssText = 'color:#888;font-family:monospace;font-size:11px;margin-bottom:4px;';
    bpLabel.textContent = 'バックパック';
    this.panel.appendChild(bpLabel);

    const bpCols = 8;
    const bpContainer = document.createElement('div');
    bpContainer.style.cssText = `
      display:grid;grid-template-columns:repeat(${bpCols}, ${HOTBAR_SLOT_SIZE}px);
      gap:${HOTBAR_SLOT_GAP}px;margin-bottom:12px;
    `;
    this.panel.appendChild(bpContainer);

    for (let i = 0; i < BACKPACK_SLOTS; i++) {
      const slot = this.createSlot();
      slot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.onBackpackSlotClick(i);
      });
      bpContainer.appendChild(slot);
      this.backpackSlots.push(slot);
    }

    // 区切り線
    const divider = document.createElement('div');
    divider.style.cssText = 'border-top:1px solid #555;margin:8px 0;';
    this.panel.appendChild(divider);

    // ホットバー
    const hbLabel = document.createElement('div');
    hbLabel.style.cssText = 'color:#888;font-family:monospace;font-size:11px;margin-bottom:4px;';
    hbLabel.textContent = 'ホットバー';
    this.panel.appendChild(hbLabel);

    const hbContainer = document.createElement('div');
    hbContainer.style.cssText = `
      display:grid;grid-template-columns:repeat(${HOTBAR_SLOTS}, ${HOTBAR_SLOT_SIZE}px);
      gap:${HOTBAR_SLOT_GAP}px;
    `;
    this.panel.appendChild(hbContainer);

    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const slot = this.createSlot();
      slot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.onHotbarSlotClick(i);
      });
      hbContainer.appendChild(slot);
      this.hotbarSlots.push(slot);
    }
  }

  private createSlot(): HTMLDivElement {
    const slot = document.createElement('div');
    slot.style.cssText = `
      width:${HOTBAR_SLOT_SIZE}px;height:${HOTBAR_SLOT_SIZE}px;
      background:${HOTBAR_BG_COLOR};border:2px solid #555;
      display:flex;align-items:center;justify-content:center;
      position:relative;font-size:11px;color:white;
      font-family:monospace;border-radius:4px;cursor:pointer;
    `;
    return slot;
  }

  // ホットバースロットクリック → バックパックの選択アイテムと入れ替え
  private selectedBackpackSlot: number | null = null;

  private onBackpackSlotClick(index: number): void {
    if (this.selectedBackpackSlot === index) {
      this.selectedBackpackSlot = null;
    } else if (this.selectedBackpackSlot !== null) {
      // バックパック内スワップ
      const tmp = this.inventory.backpack[this.selectedBackpackSlot] ?? null;
      this.inventory.backpack[this.selectedBackpackSlot] = this.inventory.backpack[index] ?? null;
      this.inventory.backpack[index] = tmp;
      this.selectedBackpackSlot = null;
    } else {
      this.selectedBackpackSlot = index;
    }
    this.updateSlots();
  }

  private onHotbarSlotClick(index: number): void {
    if (this.selectedBackpackSlot !== null) {
      // バックパック→ホットバーへスワップ
      const tmp = this.inventory.hotbar[index] ?? null;
      this.inventory.hotbar[index] = this.inventory.backpack[this.selectedBackpackSlot] ?? null;
      this.inventory.backpack[this.selectedBackpackSlot] = tmp;
      this.selectedBackpackSlot = null;
    } else {
      // ホットバー内スワップ用に選択
      this.inventory.selectSlot(index);
    }
    this.updateSlots();
  }

  toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this._isOpen = true;
    this.selectedBackpackSlot = null;
    this.overlay.style.display = 'flex';
    this.updateSlots();
  }

  close(): void {
    this._isOpen = false;
    this.selectedBackpackSlot = null;
    this.overlay.style.display = 'none';
  }

  private updateSlots(): void {
    // ホットバー
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const slot = this.hotbarSlots[i]!;
      const item = this.inventory.hotbar[i] ?? null;
      slot.style.borderColor = i === this.inventory.selectedSlot ? HOTBAR_SELECTED_COLOR : '#555';
      this.renderSlotContent(slot, item);
    }

    // バックパック
    for (let i = 0; i < BACKPACK_SLOTS; i++) {
      const slot = this.backpackSlots[i]!;
      const item = this.inventory.backpack[i] ?? null;
      slot.style.borderColor = i === this.selectedBackpackSlot ? '#ff6600' : '#555';
      this.renderSlotContent(slot, item);
    }
  }

  private renderSlotContent(slot: HTMLDivElement, item: import('../inventory/ItemStack').ItemStack | null): void {
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

  destroy(): void {
    this.overlay.remove();
  }
}
