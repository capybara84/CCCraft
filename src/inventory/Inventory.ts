import { BlockId } from '../blocks/BlockTypes';
import { HOTBAR_SLOTS, BACKPACK_SLOTS } from '../constants';
import { ItemStack } from './ItemStack';

// インベントリ管理クラス（ホットバー + バックパック）
export class Inventory {
  readonly hotbar: (ItemStack | null)[];
  readonly backpack: (ItemStack | null)[];
  selectedSlot = 0; // 現在選択中のホットバースロット

  constructor() {
    this.hotbar = new Array(HOTBAR_SLOTS).fill(null);
    this.backpack = new Array(BACKPACK_SLOTS).fill(null);

    // デバッグ用: 初期アイテムを配置
    this.hotbar[0] = new ItemStack(BlockId.DIRT, 64);
    this.hotbar[1] = new ItemStack(BlockId.STONE, 64);
    this.hotbar[2] = new ItemStack(BlockId.PLANKS, 64);
    this.hotbar[3] = new ItemStack(BlockId.SAND, 64);
  }

  // ホットバーの選択スロットを設定
  selectSlot(index: number): void {
    if (index >= 0 && index < HOTBAR_SLOTS) {
      this.selectedSlot = index;
    }
  }

  // 選択中のアイテムを取得
  getSelectedItem(): ItemStack | null {
    return this.hotbar[this.selectedSlot] ?? null;
  }

  // 選択中のアイテムを1つ消費
  consumeSelected(): boolean {
    const item = this.hotbar[this.selectedSlot];
    if (!item) return false;
    item.count--;
    if (item.isEmpty()) {
      this.hotbar[this.selectedSlot] = null;
    }
    return true;
  }

  // アイテムを追加（ホットバー→バックパックの順に空きを探す）
  addItem(blockId: BlockId, count: number = 1): number {
    if (blockId === BlockId.AIR) return count;

    let remaining = count;

    // まず既存スタックに追加を試みる
    remaining = this.addToExisting(this.hotbar, blockId, remaining);
    if (remaining <= 0) return 0;
    remaining = this.addToExisting(this.backpack, blockId, remaining);
    if (remaining <= 0) return 0;

    // 空きスロットに新規スタック作成
    remaining = this.addToEmpty(this.hotbar, blockId, remaining);
    if (remaining <= 0) return 0;
    remaining = this.addToEmpty(this.backpack, blockId, remaining);

    return remaining; // 入りきらなかった数
  }

  // 既存スタックに追加
  private addToExisting(slots: (ItemStack | null)[], blockId: BlockId, count: number): number {
    let remaining = count;
    for (const slot of slots) {
      if (slot && slot.blockId === blockId) {
        remaining = slot.add(remaining);
        if (remaining <= 0) return 0;
      }
    }
    return remaining;
  }

  // 空スロットに新規作成
  private addToEmpty(slots: (ItemStack | null)[], blockId: BlockId, count: number): number {
    let remaining = count;
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i]) {
        const stack = new ItemStack(blockId, 0);
        remaining = stack.add(remaining);
        slots[i] = stack;
        if (remaining <= 0) return 0;
      }
    }
    return remaining;
  }
}
