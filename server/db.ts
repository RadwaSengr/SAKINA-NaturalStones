import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertSakinaOrder, InsertUser, sakinaOrders, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import {
  localCreateSakinaOrder,
  localGetUserByOpenId,
  localIsSakinaOwner,
  localListSakinaOrders,
  localUpdateSakinaOrderStatus,
  localUpsertUser,
} from "./localStore";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    localUpsertUser(user);
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return localGetUserByOpenId(openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * The SAKINA owner is the one server-registered admin account. Returning false
 * when the database is unavailable or more than one admin exists fails closed
 * so orders never become visible to an ambiguous account.
 */
export async function isSakinaOwner(openId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return localIsSakinaOwner(openId);
  }

  const adminAccounts = await db
    .select({ openId: users.openId })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(2);

  return adminAccounts.length === 1 && adminAccounts[0]?.openId === openId;
}

export async function createSakinaOrder(order: InsertSakinaOrder): Promise<void> {
  const db = await getDb();
  if (!db) {
    localCreateSakinaOrder(order);
    return;
  }
  await db.insert(sakinaOrders).values(order);
}

export async function listSakinaOrders() {
  const db = await getDb();
  if (!db) {
    return localListSakinaOrders();
  }
  return db.select().from(sakinaOrders).orderBy(desc(sakinaOrders.createdAt));
}

export async function updateSakinaOrderStatus(
  reference: string,
  status: "pending_cod" | "preparing" | "in_transit" | "delivered"
) {
  const db = await getDb();
  if (!db) {
    return localUpdateSakinaOrderStatus(reference, status);
  }
  await db.update(sakinaOrders).set({ status }).where(eq(sakinaOrders.reference, reference));
  const rows = await db.select().from(sakinaOrders).where(eq(sakinaOrders.reference, reference)).limit(1);
  return rows[0] ?? null;
}
