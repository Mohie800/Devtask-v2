import { db } from '../database';
import { Owner } from '@/types/models';
import { createId, nowIso } from '@/utils/id';

export interface OwnerInput {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export function listOwners(): Owner[] {
  return db.getAllSync<Owner>('SELECT * FROM owners ORDER BY name COLLATE NOCASE ASC');
}

export function createOwner(input: OwnerInput): Owner {
  const now = nowIso();
  const owner: Owner = {
    id: createId('owner'),
    name: input.name.trim(),
    company: input.company ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now
  };
  db.runSync(
    'INSERT INTO owners (id, name, company, phone, email, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [owner.id, owner.name, owner.company, owner.phone, owner.email, owner.notes, owner.createdAt, owner.updatedAt]
  );
  return owner;
}

export function updateOwner(id: string, patch: Partial<OwnerInput>) {
  const current = db.getFirstSync<Owner>('SELECT * FROM owners WHERE id = ?', [id]);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: nowIso() };
  db.runSync(
    'UPDATE owners SET name = ?, company = ?, phone = ?, email = ?, notes = ?, updatedAt = ? WHERE id = ?',
    [next.name, next.company ?? null, next.phone ?? null, next.email ?? null, next.notes ?? null, next.updatedAt, id]
  );
  return db.getFirstSync<Owner>('SELECT * FROM owners WHERE id = ?', [id]);
}

export function deleteOwner(id: string) {
  db.runSync('UPDATE projects SET ownerId = NULL WHERE ownerId = ?', [id]);
  db.runSync('DELETE FROM owners WHERE id = ?', [id]);
}
