/**
 * Website-owned SAKINA commerce router.
 * All customer-visible catalog, pricing, cart inputs, and order totals stay
 * inside the website; prices are always recalculated from the internal catalog.
 */
import { z } from "zod";
import { getSakinaProduct, sakinaCatalog } from "../../shared/commerce/catalog";
import { calculateTasbihAssemblyPiasters, STANDARD_DELIVERY_PIASTERS } from "../../shared/commerce/pricing";
import { createSakinaOrder, listSakinaOrders, updateSakinaOrderStatus } from "../db";
import { notifyOwner } from "../_core/notification";
import { ownerProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const orderStatusSchema = z.enum(["pending_cod", "preparing", "in_transit", "delivered"]);

function moneyToPiasters(amount: string): number {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) throw new Error("Invalid catalog price");
  return Math.round(value * 100);
}

export { calculateTasbihAssemblyPiasters } from "../../shared/commerce/pricing";

function makeOrderReference() {
  return `SKN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const localOrderItemSchema = z.object({
  handle: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const commerceRouter = router({
  products: router({
    list: publicProcedure
      .input(z.object({ first: z.number().int().min(1).max(100).optional(), collectionHandle: z.string().min(1).optional() }).optional())
      .query(({ input }) => sakinaCatalog.slice(0, input?.first ?? sakinaCatalog.length)),
    byHandle: publicProcedure
      .input(z.object({ handle: z.string().min(1) }))
      .query(({ input }) => {
        const product = getSakinaProduct(input.handle);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Stone not found" });
        return product;
      }),
  }),
  orders: router({
    createCashOnDelivery: publicProcedure
      .input(z.object({
        items: z.array(localOrderItemSchema).min(1).max(50),
        customerName: z.string().trim().min(2).max(160),
        email: z.string().trim().email().max(320),
        phone: z.string().trim().min(7).max(32),
        addressLine1: z.string().trim().min(5).max(500),
        addressLine2: z.string().trim().max(500).optional(),
        city: z.string().trim().min(2).max(96),
        governorate: z.string().trim().min(2).max(96),
        postalCode: z.string().trim().max(24).optional(),
        preparation: z.enum(["single", "tasbih"]),
        customerNote: z.string().trim().max(420).optional(),
      }))
      .mutation(async ({ input }) => {
        const items = input.items.map(line => {
          const product = getSakinaProduct(line.handle);
          if (!product) throw new TRPCError({ code: "BAD_REQUEST", message: "A selected stone is no longer available" });
          const variant = product.variants[0];
          if (!variant?.availableForSale) throw new TRPCError({ code: "BAD_REQUEST", message: "A selected stone is not available" });
          const unitPiasters = moneyToPiasters(variant.price.amount);
          return { product, variant, quantity: line.quantity, unitPiasters, lineTotalPiasters: unitPiasters * line.quantity };
        });

        const subtotalPiasters = items.reduce((sum, item) => sum + item.lineTotalPiasters, 0);
        const stoneCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const tasbihAssemblyPiasters = input.preparation === "tasbih" ? calculateTasbihAssemblyPiasters(stoneCount) : 0;
        const reference = makeOrderReference();
        const totalPiasters = subtotalPiasters + STANDARD_DELIVERY_PIASTERS + tasbihAssemblyPiasters;

        await createSakinaOrder({
          reference,
          paymentMethod: "cash_on_delivery",
          customerName: input.customerName,
          email: input.email,
          phone: input.phone,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          city: input.city,
          governorate: input.governorate,
          postalCode: input.postalCode || null,
          preparation: input.preparation,
          customerNote: input.customerNote || null,
          itemsJson: JSON.stringify(items.map(item => ({
            title: item.product.title,
            handle: item.product.handle,
            variantId: item.variant.id,
            quantity: item.quantity,
            unitPrice: item.variant.price,
            lineTotal: { amount: (item.lineTotalPiasters / 100).toFixed(2), currencyCode: "EGP" },
          }))),
          subtotalPiasters,
          shippingPiasters: STANDARD_DELIVERY_PIASTERS,
          tasbihAssemblyPiasters,
          totalPiasters,
        });

        let ownerNotificationSent = false;
        try {
          ownerNotificationSent = await notifyOwner({
            title: "طلب جديد في SAKINA",
            content: [
              `رقم الطلب: ${reference}`,
              `الإجمالي: ${(totalPiasters / 100).toLocaleString("ar-EG")} ج.م.`,
              `عدد القطع: ${stoneCount}`,
              `التجهيز: ${input.preparation === "tasbih" ? "سبحة" : "قطعة فردية"}`,
              `المحافظة: ${input.governorate}`,
            ].join("\n"),
          });
        } catch (error) {
          // An alert must never prevent a completed COD order from reaching the owner dashboard.
          console.warn("[SAKINA] New-order notification could not be sent:", error);
        }

        return { reference, paymentMethod: "cash_on_delivery" as const, subtotalPiasters, shippingPiasters: STANDARD_DELIVERY_PIASTERS, tasbihAssemblyPiasters, totalPiasters, ownerNotificationSent };
      }),
    ownerList: ownerProcedure.query(async () => listSakinaOrders()),
    updateStatus: ownerProcedure
      .input(z.object({ reference: z.string().min(1), status: orderStatusSchema }))
      .mutation(async ({ input }) => {
        const order = await updateSakinaOrderStatus(input.reference, input.status);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        return order;
      }),
  }),
});

export type CommerceRouter = typeof commerceRouter;
