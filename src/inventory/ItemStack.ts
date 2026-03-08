import { BlockId } from '../blocks/BlockTypes';
import { MAX_STACK_SIZE } from '../constants';

// アイテムスタック（1スロット分のデータ）
export class ItemStack {
  constructor(
    public blockId: BlockId,
    public count: number = 1
  ) {}

  // スタックに追加可能な数を返す
  canAdd(amount: number): number {
    return Math.min(amount, MAX_STACK_SIZE - this.count);
  }

  // スタックに追加して、追加できなかった余りを返す
  add(amount: number): number {
    const addable = this.canAdd(amount);
    this.count += addable;
    return amount - addable;
  }

  // スタックが空かどうか
  isEmpty(): boolean {
    return this.count <= 0;
  }

  // コピーを作成
  clone(): ItemStack {
    return new ItemStack(this.blockId, this.count);
  }
}
