import type { Product } from "./types";

type StoneDefinition = {
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  image: string;
  price: string;
};

const stones: StoneDefinition[] = [
  {
    handle: "clear-quartz-stone",
    title: "حجر كوارتز صافي",
    description:
      "قطعة كوارتز صافي مختارة بهدوء، تصل مع شهادة سكينة الخاصة بها.",
    productType: "كوارتز صافي",
    tags: ["كوارتز صافي", "اختيار يدوي"],
    image: "/assets/Clear-Quartz.PNG",
    price: "300",
  },
  {
    handle: "rose-quartz-stone",
    title: "حجر كوارتز وردي ناعم",
    description: "كوارتز وردي طبيعي بملمس هادئ وتدرج وردي خفيف.",
    productType: "كوارتز وردي",
    tags: ["كوارتز وردي", "اختيار يدوي"],
    image: "/assets/Soft-Rose-Quartz.PNG",
    price: "380",
  },
  {
    handle: "tigers-eye-stone",
    title: "حجر عين النمر الذهبي",
    description: "قطعة عين نمر بخطوط ذهبية دافئة ولمعة طبيعية مميزة.",
    productType: "عين النمر",
    tags: ["عين النمر", "اختيار يدوي"],
    image: "/assets/Golden-Tiger's-Eye.PNG",
    price: "460",
  },
  {
    handle: "amethyst-stone",
    title: "حجر جمشت هادئ",
    description: "جمشت طبيعي بلون بنفسجي هادئ وعمق معدني واضح.",
    productType: "جمشت",
    tags: ["جمشت", "اختيار يدوي"],
    image: "/assets/Quiet-Amethyst.PNG",
    price: "560",
  },
  {
    handle: "earth-essence-stone",
    title: "حجر أثر الأرض",
    description: "حجر طبيعي بتكوينات أرضية ناعمة مختار لطقس يومي هادئ.",
    productType: "حجر طبيعي",
    tags: ["شارع المعز", "اختيار يدوي"],
    image: "/assets/Earth-Essence-Stone.PNG",
    price: "680",
  },
  {
    handle: "royal-yemeni-agate",
    title: "حجر عقيق يماني ملكي",
    description: "عقيق يماني طبيعي بتدرجات دافئة ولمسات معدنية مميزة.",
    productType: "عقيق يماني",
    tags: ["عقيق يماني", "اختيار يدوي"],
    image: "/assets/Royal-Yemeni-Agate.PNG",
    price: "800",
  },
];

export const sakinaCatalog: Product[] = stones.map(stone => {
  const money = { amount: stone.price, currencyCode: "EGP" };
  return {
    id: `sakina:${stone.handle}`,
    handle: stone.handle,
    title: stone.title,
    description: stone.description,
    descriptionHtml: `<p>${stone.description}</p>`,
    productType: stone.productType,
    vendor: "SAKINA",
    tags: stone.tags,
    images: [
      { url: stone.image, altText: stone.title, width: 1200, height: 1200 },
    ],
    priceRange: { min: money, max: money },
    options: [{ name: "Title", values: ["Default Title"] }],
    variants: [
      {
        id: `sakina:${stone.handle}:default`,
        title: "Default Title",
        price: money,
        compareAtPrice: null,
        availableForSale: true,
        selectedOptions: [{ name: "Title", value: "Default Title" }],
      },
    ],
  };
});

export function getSakinaProduct(handle: string) {
  return sakinaCatalog.find(product => product.handle === handle) ?? null;
}

export function getSakinaProductByVariant(variantId: string) {
  return (
    sakinaCatalog.find(product =>
      product.variants.some(variant => variant.id === variantId)
    ) ?? null
  );
}
