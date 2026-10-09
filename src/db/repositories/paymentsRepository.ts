import { db } from '../database';
import { Payment } from '@/types/models';
import { createId, nowIso } from '@/utils/id';

export interface PaymentInput {
  projectId: string;
  amount: number;
  date?: Date;
  note?: string;
}

export function listPayments(): Payment[] {
  return db.getAllSync<Payment>('SELECT * FROM payments ORDER BY date DESC, createdAt DESC');
}

export function listPaymentsForProject(projectId: string) {
  return db.getAllSync<Payment>('SELECT * FROM payments WHERE projectId = ? ORDER BY date DESC, createdAt DESC', [projectId]);
}

export function createPayment(input: PaymentInput): Payment {
  const payment: Payment = {
    id: createId('payment'),
    projectId: input.projectId,
    amount: input.amount,
    date: (input.date ?? new Date()).toISOString(),
    note: input.note ?? null,
    createdAt: nowIso()
  };
  db.runSync('INSERT INTO payments (id, projectId, amount, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?)', [
    payment.id,
    payment.projectId,
    payment.amount,
    payment.date,
    payment.note,
    payment.createdAt
  ]);
  return payment;
}

export function deletePayment(id: string) {
  db.runSync('DELETE FROM payments WHERE id = ?', [id]);
}
