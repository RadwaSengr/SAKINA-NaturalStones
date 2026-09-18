/** Dedicated SAKINA collection — a quiet website-owned stone cabinet, separate from the brand story home. */
import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { assetUrl, cabinetStoneImage, formatMoney, localizedProductDescription, localizedProductTitle, stonePassport } from "@/lib/sakina";
import { sakinaCatalog } from "@shared/commerce/catalog";
import type { Product } from "@shared/commerce/types";
import { ArrowLeft, ArrowRight, ArrowUpLeft, Gem, Sparkles } from "lucide-react";
import { Link } from "wouter";

const ar = {
  kicker: "خزانة سكينة", title: <>كل حجر<br /><em>له لحظته.</em></>, body: "اختاري قطعتك بهدوء. كل حجر هنا مختار بعناية ويصل إليك مع شهادة تعريفه وتعليمات الحفاظ عليه.",
  guide: "كيف نختار أحجارنا؟", loading: "نرتّب الأحجار المختارة لكِ…", empty: "تجري إضافة أول الأحجار إلى خزانة سكينة الآن.", add: "أضيفي للحقيبة", passport: "بطاقة تعريف الحجر",
};
const en: typeof ar = {
  kicker: "THE SAKINA CABINET", title: <>Every stone<br />has <em>its moment.</em></>, body: "Choose your piece quietly. Every stone is selected with care and arrives with its identity card and care guidance.",
  guide: "How we select our stones", loading: "Arranging the selected stones for you…", empty: "The first stones are being added to the SAKINA cabinet.", add: "Add to bag", passport: "Stone identity card",
};

function CabinetStoneCard({ product, index, language, copy }: { product: Product; index: number; language: Language; copy: typeof ar }) {
  const { addItem, loading } = useCart();
  const variant = product.variants[0];
  const passport = stonePassport(product, language);
  const image = cabinetStoneImage(product.handle);
  const Arrow = language === "ar" ? ArrowLeft : ArrowRight;
  return <article className="stone-card cabinet-stone-card" style={{ animationDelay: `${index * 70}ms` }}>
    <Link href={`/stone/${product.handle}`} className="stone-card__image" aria-label={localizedProductTitle(product.handle, product.title, language)}><img src={image} alt={localizedProductTitle(product.handle, product.title, language)} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" /><span className="cabinet-card-stamp">SAKINA<br />SELECTED</span></Link>
    <div className="stone-card__body"><span className="stone-card__type">{passport.kind}</span><h3>{localizedProductTitle(product.handle, product.title, language)}</h3><p>{localizedProductDescription(product, language)}</p><div className="cabinet-card-meta"><span>{copy.passport}</span><b>{passport.care}</b></div><div className="stone-card__bottom"><strong>{formatMoney(product.priceRange.min, language)}</strong><button className="quiet-add" disabled={!variant?.availableForSale || loading} onClick={() => variant && addItem(variant.id)}>{copy.add} <Arrow size={14} /></button></div></div>
  </article>;
}

export default function Collection() {
  const { language, isArabic } = useLanguage();
  const copy = isArabic ? ar : en;
  const { data: remoteProducts, isLoading } = trpc.commerce.products.list.useQuery(
    { first: 50 },
    { staleTime: 5 * 60_000, retry: false }
  );
  const products = (remoteProducts && remoteProducts.length > 0) ? remoteProducts : sakinaCatalog;
  const Arrow = isArabic ? ArrowLeft : ArrowRight;
  return <main className={`collection-page lang-${language}`} dir={isArabic ? "rtl" : "ltr"}>
    <div className="route-context"><span>{isArabic ? "أنتِ الآن في" : "You are in"}</span><strong>{copy.kicker}</strong><Link href="/">{isArabic ? "الرئيسية" : "Home"}</Link></div>
    <section className="collection-page__hero"><div><span className="eyebrow">{copy.kicker}</span><h1>{copy.title}</h1><p>{copy.body}</p></div><div className="collection-page__mark"><Gem size={23} /><span>01</span><i /></div><Link href="/certificate" className="collection-guide">{copy.guide} <ArrowUpLeft size={16} /></Link></section>
    <section className="collection-cabinet" aria-label={isArabic ? "مجموعة الأحجار" : "Stone collection"}>{isLoading && products.length === 0 ? <div className="stone-loading"><Sparkles size={19} /> {copy.loading}</div> : products.length === 0 ? <div className="catalog-empty"><img src={assetUrl("assets/sakina-mark_d9d397db.png")} alt="" /><p>{copy.empty}</p></div> : <div className="stone-grid">{products.map((product, index) => <CabinetStoneCard product={product} index={index} language={language} copy={copy} key={product.id} />)}</div>}</section>
    <section className="collection-page__footer"><p>{isArabic ? "كل قطعة تصل مع شهادة سكينة خاصة بها." : "Every piece arrives with its own SAKINA passport."}</p><Link href="/certificate">{isArabic ? "اكتشفي شهادة الحجر" : "Discover the stone passport"} <Arrow size={15} /></Link></section>
  </main>;
}
