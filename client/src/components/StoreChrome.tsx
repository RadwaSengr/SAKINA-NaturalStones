/** SAKINA store chrome — language-aware navigation and a local shopping-bag drawer. */
import React, { useRef, useState } from "react";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { cabinetStoneImage, formatMoney, localizedProductTitle } from "@/lib/sakina";
import { ArrowLeft, ArrowRight, Gem, House, LayoutDashboard, Minus, Plus, ScrollText, ShoppingBag, X } from "lucide-react";
import { Link, useLocation } from "wouter";

export function StoreHeader() {
  const { itemCount, isOpen, openCart } = useCart();
  const { language, toggleLanguage, isArabic } = useLanguage();
  const { user } = useAuth();
  const [location] = useLocation();
  const mobilePreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mobile") === "1";
  const activePath = location.startsWith("/stone/") ? "/collection" : location.startsWith("/order-confirmed/") ? "/checkout" : location;
  const nav = isArabic
    ? [{ href: "/", label: "الرئيسية" }, { href: "/collection", label: "الخزانة" }, { href: "/certificate", label: "الشهادة" }]
    : [{ href: "/", label: "Home" }, { href: "/collection", label: "Cabinet" }, { href: "/certificate", label: "Passport" }];

  return (
    <header className={`store-header lang-${language}${mobilePreview ? " store-header--mobile-preview" : ""}`}>
      <div className="store-header__inner">
        <Link href="/" className="brand-lockup" aria-label="SAKINA home">
          <img className="brand-mark" src="/assets/sakina-mark_d9d397db.png" alt="" />
          <span>SAKINA</span>
          <small>{isArabic ? "أحجار مختارة بعناية" : "Hand-selected natural stones"}</small>
        </Link>
        <nav className="store-nav" aria-label={isArabic ? "التنقل الرئيسي" : "Primary navigation"}>
          {nav.map(item => <Link key={item.href} href={item.href} className={activePath === item.href ? "is-active" : undefined}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="header-collection-link" href="/collection">{isArabic ? "تسوّقي" : "Shop"}</Link>
          {user?.isOwner && <Link className="owner-dashboard-link owner-orders-link" href="/owner" aria-label={isArabic ? "طلبات المالك" : "Owner orders"} title={isArabic ? "طلبات المالك" : "Owner orders"}><LayoutDashboard size={17} /><span className="owner-orders-link__desktop">{isArabic ? "إدارة" : "Manage"}</span><span className="owner-orders-link__mobile">{isArabic ? "الطلبات" : "Orders"}</span></Link>}
          <button className="language-switch" onClick={toggleLanguage} aria-label={isArabic ? "Switch to English" : "التحويل للعربية"}>{language === "ar" ? "EN" : "ع"}</button>
          <button className={`bag-trigger ${isOpen || location === "/checkout" || location.startsWith("/order-confirmed/") ? "is-active" : ""}`} onClick={openCart} aria-label={isArabic ? "فتح حقيبة المشتريات" : "Open shopping bag"}><ShoppingBag size={21} strokeWidth={1.7} />{itemCount > 0 && <span className="bag-count">{itemCount}</span>}</button>
        </div>
      </div>
    </header>
  );
}

/** Bottom navigation is mobile-only and gives the storefront an app-native navigation model. */
export function MobileTabBar() {
  const { itemCount, isOpen, openCart } = useCart();
  const { language, isArabic } = useLanguage();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [ownerPanelOpen, setOwnerPanelOpen] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const copy = isArabic
    ? { home: "الرئيسية", cabinet: "الخزانة", passport: "الشهادة", bag: "الحقيبة", manage: "إدارة", privateAccess: "وصول خاص", signIn: "دخول المالكة", privateBody: "سجّلي الدخول بحساب المالكة لفتح إدارة الطلبات." }
    : { home: "Home", cabinet: "Cabinet", passport: "Passport", bag: "Bag", manage: "Manage", privateAccess: "PRIVATE ACCESS", signIn: "Owner sign-in", privateBody: "Sign in with the owner account to open order management." };
  const isHome = location === "/";
  const isCabinet = location === "/collection" || location.startsWith("/stone/");
  const handleSwipeStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };
  const handleSwipeEnd = (event: React.TouchEvent<HTMLElement>) => {
    const startY = touchStartY.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartY.current = null;
    if (startY === null || endY === undefined) return;
    if (startY - endY > 34) setOwnerPanelOpen(true);
    if (endY - startY > 34) setOwnerPanelOpen(false);
  };
  const openPrivateAccess = () => {
    setOwnerPanelOpen(false);
    if (user?.isOwner) setLocation("/owner");
    else startLogin("/owner");
  };

  return <>
    <section className={`owner-swipe-panel lang-${language}${ownerPanelOpen ? " is-open" : ""}`} aria-hidden={!ownerPanelOpen} dir={isArabic ? "rtl" : "ltr"}>
      <span className="owner-swipe-panel__handle" aria-hidden="true" />
      <div><span className="eyebrow">{copy.privateAccess}</span><strong>{user?.isOwner ? copy.manage : copy.signIn}</strong><p>{copy.privateBody}</p></div>
      <button type="button" className="owner-swipe-panel__action" onClick={openPrivateAccess}><LayoutDashboard size={18} /><span>{user?.isOwner ? copy.manage : copy.signIn}</span></button>
    </section>
    <nav className={`mobile-tabbar lang-${language}`} aria-label={isArabic ? "تنقل التطبيق" : "App navigation"} dir={isArabic ? "rtl" : "ltr"} onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
      <button type="button" className={isHome ? "is-active" : ""} onClick={() => setLocation("/")} aria-current={isHome ? "page" : undefined}><House size={19} /><span>{copy.home}</span></button>
      <button type="button" className={isCabinet ? "is-active" : ""} onClick={() => setLocation("/collection")} aria-current={isCabinet ? "page" : undefined}><Gem size={19} /><span>{copy.cabinet}</span></button>
      <button type="button" className={location === "/certificate" ? "is-active" : ""} onClick={() => setLocation("/certificate")} aria-current={location === "/certificate" ? "page" : undefined}><ScrollText size={19} /><span>{copy.passport}</span></button>
      <button type="button" className={isOpen || location === "/checkout" || location.startsWith("/order-confirmed/") ? "is-active" : ""} onClick={openCart} aria-current={isOpen || location === "/checkout" || location.startsWith("/order-confirmed/") ? "page" : undefined}><span className="mobile-bag-icon"><ShoppingBag size={19} />{itemCount > 0 && <i>{itemCount}</i>}</span><span>{copy.bag}</span></button>
    </nav>
  </>;
}

export function ShoppingBagDrawer() {
  const { cart, isOpen, closeCart, itemCount, loading, removeItem, updateQuantity } = useCart();
  const { language, isArabic } = useLanguage();
  const [, setLocation] = useLocation();
  const items = cart?.items ?? [];
  const BackArrow = isArabic ? ArrowLeft : ArrowRight;
  return <>
    <button className={`bag-scrim ${isOpen ? "is-visible" : ""}`} onClick={closeCart} aria-label={isArabic ? "إغلاق الحقيبة" : "Close bag"} tabIndex={isOpen ? 0 : -1} />
    <aside className={`bag-drawer lang-${language} ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen} dir={isArabic ? "rtl" : "ltr"}>
      <div className="bag-drawer__top"><div><span className="eyebrow">{isArabic ? "اختياراتك الهادئة" : "YOUR QUIET CHOICES"}</span><h2>{isArabic ? "حقيبة سكينة" : "Your SAKINA Bag"}</h2></div><button className="drawer-close" onClick={closeCart} aria-label={isArabic ? "إغلاق" : "Close"}><X size={22} /></button></div>
      <div className="bag-lines">
          {items.length === 0 ? <div className="bag-empty"><img src="/assets/sakina-mark_d9d397db.png" alt="" /><p>{isArabic ? "كل قطعة تبدأ بحجرٍ له قصة. اختاري ما يناسب لحظتك." : "Every piece begins with a stone and a story. Choose one for your moment."}</p><button className="text-button" onClick={() => { closeCart(); setLocation("/collection"); }}>{isArabic ? "اكتشفي المجموعة" : "Explore the collection"} <BackArrow size={14} /></button></div> : items.map(item => <div className="bag-line" key={item.lineId}>
          <img className="bag-line__image" src={cabinetStoneImage(item.productHandle)} alt={localizedProductTitle(item.productHandle, item.productTitle, language)} loading="lazy" decoding="async" /><div className="bag-line__copy"><p>{localizedProductTitle(item.productHandle, item.productTitle, language)}</p>{item.variantTitle !== "Default Title" && <span>{item.variantTitle}</span>}<div className="quantity-stepper"><button disabled={loading} onClick={() => updateQuantity(item.lineId, item.quantity - 1)} aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"}><Minus size={12} /></button><strong>{item.quantity}</strong><button disabled={loading} onClick={() => updateQuantity(item.lineId, item.quantity + 1)} aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"}><Plus size={12} /></button></div></div><div className="bag-line__end"><strong>{formatMoney(item.lineTotal, language)}</strong><button disabled={loading} onClick={() => removeItem(item.lineId)}>{isArabic ? "إزالة" : "Remove"}</button></div>
        </div>)}
      </div>
      <div className="bag-total"><div><span>{isArabic ? "إجمالي المنتجات" : "Items subtotal"}</span><strong>{formatMoney(cart?.subtotal, language)}</strong></div><button className="action-button" disabled={itemCount === 0 || loading} onClick={() => { closeCart(); setLocation("/checkout"); }}>{isArabic ? "مراجعة الطلب" : "Review order"} <BackArrow size={17} /></button><p>{isArabic ? "بيانات التوصيل وتأكيد الطلب يتمان داخل سكينة." : "Delivery details and order confirmation stay inside SAKINA."}</p></div>
    </aside>
  </>;
}
