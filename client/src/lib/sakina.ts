/** SAKINA storefront helpers for the website-owned catalog and order experience. */
import type { Money, Product } from "@shared/commerce/types";
import type { Language } from "@/contexts/LanguageContext";

export function formatMoney(
  money: Money | undefined | null,
  language: Language = "ar"
) {
  if (!money) return "—";
  const amount = Number(money.amount || 0);
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: money.currencyCode || "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type StonePassport = {
  origin: string;
  kind: string;
  care: string;
};

export function stonePassport(
  product: Product,
  language: Language = "ar"
): StonePassport {
  const tags = product.tags.join(" ");
  if (tags.includes("عقيق يماني")) {
    return {
      origin:
        language === "ar" ? "خان الخليلي، القاهرة" : "Khan el-Khalili, Cairo",
      kind: language === "ar" ? "عقيق يماني طبيعي" : "Natural Yemeni agate",
      care:
        language === "ar"
          ? "يُحفظ بعيداً عن العطور والماء المباشر."
          : "Keep away from fragrance and direct water.",
    };
  }
  if (tags.includes("شارع المعز")) {
    return {
      origin:
        language === "ar" ? "شارع المعز، القاهرة" : "Al-Muizz Street, Cairo",
      kind:
        language === "ar"
          ? "تكوين أحجار طبيعية مختارة"
          : "Curated natural-stone composition",
      care:
        language === "ar"
          ? "يُمسح بقطعة قطن جافة ويُحفظ في الكيس المرفق."
          : "Wipe with dry cotton and store in its pouch.",
    };
  }
  return {
    origin:
      language === "ar"
        ? "مصر — اختيار يدوي من أسواق موثوقة"
        : "Egypt — hand-selected from trusted markets",
    kind:
      language === "ar"
        ? "حجر طبيعي مختار"
        : product.productType || "Selected natural stone",
    care:
      language === "ar"
        ? "نرفق تعليمات العناية الخاصة بقطعتك داخل الشهادة."
        : "Care guidance comes with your stone certificate.",
  };
}

export function localizedProductTitle(
  handle: string,
  fallback: string,
  language: Language
) {
  if (language === "ar") return fallback;
  if (
    handle === "royal-yemeni-agate" ||
    handle === "royal-yemeni-agate-misbaha"
  )
    return "Royal Yemeni Agate";
  if (
    handle === "earth-essence-stone" ||
    handle === "earth-essence-natural-stone-misbaha"
  )
    return "Earth Essence Stone";
  if (handle === "amethyst-stone") return "Quiet Amethyst";
  if (handle === "tigers-eye-stone") return "Golden Tiger’s Eye";
  if (handle === "rose-quartz-stone") return "Soft Rose Quartz";
  if (handle === "clear-quartz-stone") return "Clear Quartz";
  return fallback;
}

export function localizedProductDescription(
  product: Product,
  language: Language
) {
  if (language === "ar")
    return (
      product.description ||
      "قطعة مختارة يدوياً، تصل مع شهادة سكينة الخاصة بها."
    );
  if (
    product.handle === "royal-yemeni-agate" ||
    product.handle === "royal-yemeni-agate-misbaha"
  )
    return "A hand-selected Yemeni agate stone, chosen for its warm mineral bands and a calm, tactile presence.";
  if (
    product.handle === "earth-essence-stone" ||
    product.handle === "earth-essence-natural-stone-misbaha"
  )
    return "A naturally formed earth stone with a soft mineral vein, selected for a grounded daily ritual.";
  if (product.handle === "amethyst-stone")
    return "A quietly luminous amethyst stone selected for its violet mineral depth and natural detail.";
  if (product.handle === "tigers-eye-stone")
    return "A single tiger’s eye stone with a warm golden band and a tactile, grounded finish.";
  if (product.handle === "rose-quartz-stone")
    return "A soft rose quartz stone with milky natural translucency and a calm blush tone.";
  if (product.handle === "clear-quartz-stone")
    return "A naturally formed clear quartz stone with quiet transparency and an organic shape.";
  return (
    product.description ||
    "A hand-selected stone, delivered with its own SAKINA certificate."
  );
}

export function assetUrl(path: string): string {
  const base = (import.meta.env?.BASE_URL || "/").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
}

/** Curated product photography for the website-owned cabinet. */
export function cabinetStoneImage(handle: string) {
  if (
    handle === "royal-yemeni-agate" ||
    handle === "royal-yemeni-agate-misbaha"
  )
    return assetUrl("assets/Royal-Yemeni-Agate.PNG");
  if (
    handle === "earth-essence-stone" ||
    handle === "earth-essence-natural-stone-misbaha"
  )
    return assetUrl("assets/Earth-Essence-Stone.PNG");
  if (handle === "amethyst-stone") return assetUrl("assets/Quiet-Amethyst.PNG");
  if (handle === "tigers-eye-stone") return assetUrl("assets/Golden-Tiger's-Eye.PNG");
  if (handle === "rose-quartz-stone") return assetUrl("assets/Soft-Rose-Quartz.PNG");
  if (handle === "clear-quartz-stone") return assetUrl("assets/Clear-Quartz.PNG");
  return assetUrl("assets/stone-fallback.jpg");
}

