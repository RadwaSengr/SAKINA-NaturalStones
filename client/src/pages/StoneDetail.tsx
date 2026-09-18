/** SAKINA product page — bilingual stone documentation with source, care and an in-site add-to-bag action. */
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cabinetStoneImage, formatMoney, localizedProductDescription, localizedProductTitle, stonePassport } from "@/lib/sakina";
import { getSakinaProduct } from "@shared/commerce/catalog";
import { ArrowLeft, ArrowRight, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

export default function StoneDetail() {
  const [, params] = useRoute("/stone/:handle");
  const [location] = useLocation();
  const pathHandle = location.split("?")[0].split("/").filter(Boolean).at(-1) || "";
  const handle = params?.handle || pathHandle;
  const { language, isArabic } = useLanguage();
  const { data: products = [], isLoading } = trpc.commerce.products.list.useQuery(
    { first: 50 },
    { staleTime: 5 * 60_000, retry: false }
  );
  const fallbackProduct = getSakinaProduct(handle);
  const product = products.find(item => item.handle === handle) || fallbackProduct;
  const { addItem, loading } = useCart();
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  if (isLoading) return <main className={`page-state page-state--stone-loading lang-${language}`} dir={isArabic ? "rtl" : "ltr"}><div className="detail-skeleton" aria-label={isArabic ? "جارٍ تحميل تفاصيل الحجر" : "Loading stone details"}><div className="detail-skeleton__photo">{pathHandle && <img src={cabinetStoneImage(pathHandle)} alt="" fetchPriority="high" decoding="async" />}</div><div className="detail-skeleton__copy"><span>{isArabic ? "نفتح بطاقة الحجر…" : "Opening this stone’s record…"}</span><i /><i /><i className="detail-skeleton__short" /><button disabled /></div></div></main>;
  if (!product) return <main className="page-state">{isArabic ? "لم نعثر على هذه القطعة." : "We could not find this piece."} <Link href="/collection">{isArabic ? "عودة للمجموعة" : "Back to collection"}</Link></main>;
  const passport = stonePassport(product, language); const variant = product.variants[0]; const image = cabinetStoneImage(product.handle);
  const facts = isArabic ? [["المصدر", passport.origin, MapPin], ["النوع", passport.kind, BadgeCheck], ["العناية", passport.care, ShieldCheck]] : [["SOURCE", passport.origin, MapPin], ["STONE TYPE", passport.kind, BadgeCheck], ["CARE", passport.care, ShieldCheck]];
  return <main className={`stone-detail lang-${language}`} dir={isArabic ? "rtl" : "ltr"}><div className="route-context route-context--inline"><span>{isArabic ? "أنتِ الآن في" : "You are viewing"}</span><strong>{localizedProductTitle(product.handle, product.title, language)}</strong><Link href="/collection"><Arrow size={14} /> {isArabic ? "الخزانة" : "Cabinet"}</Link></div><div className="stone-detail__grid"><div className="detail-photo"><img src={image} alt={localizedProductTitle(product.handle, product.title, language)} fetchPriority="high" decoding="async" /><span>{isArabic ? "اختيار يدوي من سكينة" : "Hand-selected by SAKINA"}</span></div><div className="detail-info"><span className="eyebrow">{isArabic ? "بطاقة حجر موثّقة" : "DOCUMENTED STONE"}</span><h1>{localizedProductTitle(product.handle, product.title, language)}</h1><p className="detail-description">{localizedProductDescription(product, language)}</p><strong className="detail-price">{formatMoney(product.priceRange.min, language)}</strong><div className="passport-facts">{facts.map(([label, value, Icon]) => <div key={String(label)}><Icon size={17} /><span><small>{String(label)}</small>{String(value)}</span></div>)}</div><button className="action-button detail-add" disabled={!variant?.availableForSale || loading} onClick={() => variant && addItem(variant.id)}>{isArabic ? "أضيفي للحقيبة" : "Add to bag"} <Arrow size={17} /></button><p className="detail-assurance">{isArabic ? "تصل هذه القطعة مع شهادة سكينة الخاصة بها، في تغليف يليق بها، إلى أي محافظة داخل مصر." : "This piece arrives with its SAKINA passport in careful packaging, delivered anywhere across Egypt."}</p></div></div></main>;
}
