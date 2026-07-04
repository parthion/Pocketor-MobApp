import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExpenseInput } from '@/service/expense.service';

const QUEUE_KEY = 'pocketor_expense_queue';

export interface QueuedExpense extends ExpenseInput {
  _tempId: string;
  _queuedAt: string;
}

const expenseQueue = {
  async enqueue(data: ExpenseInput): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item: QueuedExpense = {
      ...data,
      _tempId: tempId,
      _queuedAt: new Date().toISOString(),
    };
    const current = await expenseQueue.getAll();
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...current, item]));
    return tempId;
  },

  async getAll(): Promise<QueuedExpense[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async remove(tempId: string): Promise<void> {
    const current = await expenseQueue.getAll();
    await AsyncStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(current.filter(e => e._tempId !== tempId))
    );
  },

  async flush(
    onCreate: (data: ExpenseInput) => Promise<any>
  ): Promise<{ synced: number; failed: number }> {
    const pending = await expenseQueue.getAll();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const item of pending) {
      const { _tempId, _queuedAt, ...data } = item;
      try {
        await onCreate(data);
        await expenseQueue.remove(_tempId);
        synced++;
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  },
};

// A TypeError with "Network request failed" means no connectivity.
// Any other error (4xx, 5xx) means the server responded — not a network issue.
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError &&
    (err.message.includes('Network request failed') ||
     err.message.includes('Failed to fetch'));
}

export default expenseQueue;
