import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** OAuth provider identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Guest-capable storefront orders. Monetary amounts are stored in piasters. */
export const sakinaOrders = mysqlTable("sakina_orders", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", [
    "pending_cod",
    "preparing",
    "in_transit",
    "delivered",
  ])
    .notNull()
    .default("pending_cod"),
  paymentMethod: mysqlEnum("paymentMethod", ["cash_on_delivery"])
    .notNull()
    .default("cash_on_delivery"),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  addressLine1: text("addressLine1").notNull(),
  addressLine2: text("addressLine2"),
  city: varchar("city", { length: 96 }).notNull(),
  governorate: varchar("governorate", { length: 96 }).notNull(),
  postalCode: varchar("postalCode", { length: 24 }),
  preparation: mysqlEnum("preparation", ["single", "tasbih"])
    .notNull()
    .default("single"),
  customerNote: text("customerNote"),
  itemsJson: text("itemsJson").notNull(),
  subtotalPiasters: int("subtotalPiasters").notNull(),
  shippingPiasters: int("shippingPiasters").notNull(),
  tasbihAssemblyPiasters: int("tasbihAssemblyPiasters").notNull().default(0),
  totalPiasters: int("totalPiasters").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SakinaOrder = typeof sakinaOrders.$inferSelect;
export type InsertSakinaOrder = typeof sakinaOrders.$inferInsert;
