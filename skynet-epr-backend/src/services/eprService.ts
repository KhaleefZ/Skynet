import { db } from '../config/db.js';
import { eprRecords } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const fetchEprsByPerson = async (personId: string) => {
  return await db.select()
    .from(eprRecords)
    .where(eq(eprRecords.personId, personId))
    .orderBy(desc(eprRecords.periodStart));
};

export const getEprById = async (id: string) => {
  const result = await db.select().from(eprRecords).where(eq(eprRecords.id, id));
  return result[0];
};

export const createNewEpr = async (data: any) => {
  const result = await db.insert(eprRecords).values(data).returning();
  return result[0];
};

export const updateEprById = async (id: string, data: any) => {
  const result = await db.update(eprRecords)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(eprRecords.id, id))
    .returning();
  return result[0];
};