import fs from 'node:fs';
import path from 'node:path';
import type { InsertSakinaOrder, InsertUser, SakinaOrder, User } from '../drizzle/schema';
import { ENV } from './_core/env';

const dataDir = path.resolve(process.cwd(), '.local_data');
const dataFile = path.join(dataDir, 'sakina_store.json');

type LocalStoreData = {
  users: User[];
  orders: SakinaOrder[];
  nextUserId: number;
  nextOrderId: number;
};

function readStore(): LocalStoreData {
  try {
    if (!fs.existsSync(dataFile)) {
      const ownerId = ENV.ownerOpenId || 'sakina_owner_local';
      const initial: LocalStoreData = {
        users: [
          {
            id: 1,
            openId: ownerId,
            name: 'SAKINA owner',
            email: 'owner@sakina.example',
            loginMethod: 'local',
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignedIn: new Date(),
          },
        ],
        orders: [],
        nextUserId: 2,
        nextOrderId: 1,
      };
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(dataFile, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);
    parsed.users = (parsed.users || []).map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt),
      updatedAt: new Date(u.updatedAt),
      lastSignedIn: new Date(u.lastSignedIn),
    }));
    parsed.orders = (parsed.orders || []).map((o: any) => ({
      ...o,
      createdAt: new Date(o.createdAt),
      updatedAt: new Date(o.updatedAt),
    }));
    return parsed;
  } catch {
    return { users: [], orders: [], nextUserId: 1, nextOrderId: 1 };
  }
}

function writeStore(data: LocalStoreData): void {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[LocalStore] Failed to persist data:', err);
  }
}

export function localUpsertUser(user: InsertUser): void {
  const store = readStore();
  const existingIndex = store.users.findIndex(u => u.openId === user.openId);
  const now = new Date();

  if (existingIndex >= 0) {
    const existing = store.users[existingIndex];
    store.users[existingIndex] = {
      ...existing,
      name: user.name !== undefined ? (user.name ?? null) : existing.name,
      email: user.email !== undefined ? (user.email ?? null) : existing.email,
      loginMethod: user.loginMethod !== undefined ? (user.loginMethod ?? null) : existing.loginMethod,
      role: user.role !== undefined ? user.role : (user.openId === ENV.ownerOpenId ? 'admin' : existing.role),
      lastSignedIn: user.lastSignedIn ?? now,
      updatedAt: now,
    };
  } else {
    const newUser: User = {
      id: store.nextUserId++,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    store.users.push(newUser);
  }
  writeStore(store);
}

export function localGetUserByOpenId(openId: string): User | undefined {
  const store = readStore();
  return store.users.find(u => u.openId === openId);
}

export function localIsSakinaOwner(openId: string): boolean {
  const store = readStore();
  const adminAccounts = store.users.filter(u => u.role === 'admin');
  return adminAccounts.length === 1 && adminAccounts[0].openId === openId;
}

export function localCreateSakinaOrder(order: InsertSakinaOrder): void {
  const store = readStore();
  const now = new Date();
  const newOrder: SakinaOrder = {
    id: store.nextOrderId++,
    reference: order.reference,
    status: order.status ?? 'pending_cod',
    paymentMethod: order.paymentMethod ?? 'cash_on_delivery',
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2 ?? null,
    city: order.city,
    governorate: order.governorate,
    postalCode: order.postalCode ?? null,
    preparation: order.preparation ?? 'single',
    customerNote: order.customerNote ?? null,
    itemsJson: order.itemsJson,
    subtotalPiasters: order.subtotalPiasters,
    shippingPiasters: order.shippingPiasters,
    tasbihAssemblyPiasters: order.tasbihAssemblyPiasters ?? 0,
    totalPiasters: order.totalPiasters,
    createdAt: now,
    updatedAt: now,
  };
  store.orders.unshift(newOrder);
  writeStore(store);
}

export function localListSakinaOrders(): SakinaOrder[] {
  const store = readStore();
  return [...store.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function localUpdateSakinaOrderStatus(
  reference: string,
  status: 'pending_cod' | 'preparing' | 'in_transit' | 'delivered'
): SakinaOrder | null {
  const store = readStore();
  const order = store.orders.find(o => o.reference === reference);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date();
  writeStore(store);
  return order;
}
