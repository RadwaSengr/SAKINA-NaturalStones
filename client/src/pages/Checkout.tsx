/** SAKINA in-site order review — delivery details, COD, and no-card-data payment preview. */
import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cabinetStoneImage, formatMoney, localizedProductTitle } from "@/lib/sakina";
import { calculateTasbihAssemblyPiasters, piastersToMoney } from "@shared/commerce/pricing";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, BadgeCheck, CreditCard, LockKeyhole, MapPin, Minus, PackageCheck, Plus, ShieldCheck, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";

type Preparation = "single" | "tasbih";

export default function Checkout() {
  const { cart, itemCount, loading, updateQuantity, clearCart } = useCart();
  const { language, isArabic } = useLanguage();
  const [, setLocation] = useLocation();
  const [preparation, setPreparation] = useState<Preparation>("single");
  const [customerNote, setCustomerNote] = useState("");
  const [delivery, setDelivery] = useState({ customerName: "", email: "", phone: "", addressLine1: "", addressLine2: "", city: "", governorate: "", postalCode: "" });
  const createOrder = trpc.commerce.orders.createCashOnDelivery.useMutation();
  const items = cart?.items ?? [];
  const isPreviewRequested = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "filled";
  const previewItems = isPreviewRequested ? [{
    lineId: "preview-line", variantId: "preview-variant", productHandle: "earth-essence-stone", productTitle: "حجر أثر الأرض", variantTitle: "Default Title", quantity: 1,
    unitPrice: { amount: "680", currencyCode: "EGP" }, lineTotal: { amount: "680", currencyCode: "EGP" }, image: null,
  }] : [];
  const displayItems = isPreviewRequested ? previewItems : items;
  const isPreviewing = isPreviewRequested;
  const displayItemCount = isPreviewing ? previewItems.length : itemCount;
  const orderSubtotal = isPreviewing ? previewItems[0]?.lineTotal : cart?.subtotal;
  const Arrow = isArabic ? ArrowLeft : ArrowRight;
  const shipping = { amount: "118", currencyCode: "EGP" };
  const tasbihAssembly = preparation === "tasbih" && displayItemCount > 0 ? piastersToMoney(calculateTasbihAssemblyPiasters(displayItemCount)) : null;
  const total = { amount: (Number(orderSubtotal?.amount ?? 0) + Number(shipping.amount) + Number(tasbihAssembly?.amount ?? 0)).toFixed(2), currencyCode: orderSubtotal?.currencyCode ?? "EGP" };
  const copy = isArabic
    ? {
        kicker: "خطوتك الأخيرة", title: <>اختياراتك<br />في <em>أمان.</em></>, body: "أكملي بيانات التوصيل واختاري الدفع عند الاستلام. يتم كل شيء داخل سكينة.",
        trust: ["الدفع عند الاستلام متاح", "توصيل لجميع المحافظات", "شهادة خاصة مع كل قطعة"], bag: "حقيبة سكينة", summary: "ملخص الطلب", pieces: "قطعة", empty: "لم تضيفي حجراً بعد. ابدئي من المجموعة، وخذي وقتك.",
        explore: "اكتشفي المجموعة", qty: "الكمية", subtotal: "إجمالي المنتجات", shipping: "رسوم التوصيل", tasbihFee: "تجهيز السبحة والخرز", tasbihFormula: "٥٠٠ ج للتجهيز + ٥٠ ج لكل حجر إضافي، حتى ١٬٠٠٠ ج.", total: "إجمالي الطلب", submit: "تأكيد طلب الدفع عند الاستلام", submitting: "جارٍ تأكيد الطلب…", note: "لن تنتقلي إلى أي موقع خارجي، ولا نطلب أو نخزن بيانات بطاقتك.", preview: "معاينة تصميمية فقط — لا يمكن تأكيد طلب من هذه الشاشة.",
        preparationTitle: "كيف تريدين الحجر؟", single: "قطعة فردية", tasbih: "تجهيز كسبحة", noteLabel: "NOTE — ملاحظة للطلب", notePlaceholder: "مثال: أريد تجهيز الحجر كسبحة 33 حبة، أو أريده كقطعة فردية…", deliveryTitle: "بيانات التوصيل", deliveryHint: "سنستخدمها لتأكيد الطلب وإيصاله فقط.", name: "الاسم بالكامل", email: "البريد الإلكتروني", phone: "رقم الهاتف", address: "العنوان بالتفصيل", apartment: "شقة / علامة مميزة (اختياري)", city: "المدينة", governorate: "المحافظة", postal: "الرمز البريدي (اختياري)", deliveryMethod: "توصيل قياسي", deliveryTime: "من 3 إلى 5 أيام عمل", paymentTitle: "طريقة الدفع", cod: "الدفع عند الاستلام", codHint: "ادفعي قيمة الطلب عند استلامه.", card: "بطاقة Visa / MasterCard", cardHint: "متاح قريبًا — هذا خيار تجريبي فقط.", noCard: "لا توجد حقول بطاقة هنا، لذلك لا تدخلي أي بيانات دفع.", orderError: "تعذر تسجيل طلبك الآن. تأكدي من البيانات وحاولي مرة أخرى.",
      }
    : {
        kicker: "YOUR FINAL STEP", title: <>Your choices<br />are <em>safe.</em></>, body: "Add delivery details and choose cash on delivery. Everything stays inside SAKINA.",
        trust: ["Cash on delivery available", "Delivery across Egypt", "A passport with every piece"], bag: "YOUR SAKINA BAG", summary: "Order summary", pieces: "pieces", empty: "You have not added a stone yet. Start with the collection and take your time.",
        explore: "Explore the collection", qty: "Quantity", subtotal: "Items total", shipping: "Delivery", tasbihFee: "Tasbih assembly & beads", tasbihFormula: "EGP 500 to assemble + EGP 50 per additional stone, capped at EGP 1,000.", total: "Order total", submit: "Confirm cash-on-delivery order", submitting: "Confirming your order…", note: "You will not leave SAKINA, and we do not request or store card details.", preview: "Design preview only — an order cannot be confirmed from this screen.",
        preparationTitle: "How would you like your stone?", single: "A single stone", tasbih: "Prepared as a tasbih", noteLabel: "NOTE — order preference", notePlaceholder: "For example: prepare it as a 33-bead tasbih, or keep it as a single stone…", deliveryTitle: "Delivery details", deliveryHint: "Used only to confirm and deliver your order.", name: "Full name", email: "Email address", phone: "Phone number", address: "Address", apartment: "Apartment / landmark (optional)", city: "City", governorate: "Governorate", postal: "Postal code (optional)", deliveryMethod: "Standard delivery", deliveryTime: "3–5 business days", paymentTitle: "Payment method", cod: "Cash on delivery", codHint: "Pay the order total when it arrives.", card: "Visa / MasterCard", cardHint: "Coming soon — preview only.", noCard: "There are no card fields here. Please do not enter payment details.", orderError: "We could not place your order. Check the details and try again.",
      };
  const trustIcons = [LockKeyhole, Truck, BadgeCheck];
  function updateDelivery(field: keyof typeof delivery, value: string) {
    setDelivery(current => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || isPreviewing) return;
    const order = await createOrder.mutateAsync({ items: items.map(item => ({ handle: item.productHandle, quantity: item.quantity })), ...delivery, preparation, customerNote: customerNote.trim() || undefined });
    clearCart();
    setLocation(`/order-confirmed/${order.reference}`);
  }

  return <main className={`checkout-page checkout-page--new lang-${language}`} dir={isArabic ? "rtl" : "ltr"}>
    <div className="route-context"><span>{isArabic ? "أنتِ الآن في" : "You are in"}</span><strong>{isArabic ? "مراجعة الطلب" : "Order review"}</strong><Link href="/collection">{isArabic ? "الخزانة" : "Cabinet"}</Link></div>
    <div className="checkout-review">
      <section className="review-copy">
        <span className="eyebrow">{copy.kicker}</span><h1>{copy.title}</h1><p>{copy.body}</p>
        <div className="checkout-trust-list">{copy.trust.map((item, index) => { const Icon = trustIcons[index]; return <span key={item}><Icon size={16} /> {item}</span>; })}</div>
      </section>
      <aside className="checkout-review__panel">
        <div className="review-panel__head"><div><span className="eyebrow">{copy.bag}</span><h2>{copy.summary}</h2></div><span>{displayItemCount} {copy.pieces}</span></div>
        {displayItems.length === 0 ? <div className="review-empty"><img src="/assets/sakina-mark_d9d397db.png" alt="" /><p>{copy.empty}</p><Link href="/collection">{copy.explore} <Arrow size={15} /></Link></div> : <form className="in-site-checkout" onSubmit={handleSubmit}>
          {isPreviewing && <p className="checkout-preview-notice">{copy.preview}</p>}
          <div className="review-lines">{displayItems.map(item => <div className="review-line" key={item.lineId}>
            <img src={cabinetStoneImage(item.productHandle)} alt={localizedProductTitle(item.productHandle, item.productTitle, language)} loading="lazy" decoding="async" />
            <div><strong>{localizedProductTitle(item.productHandle, item.productTitle, language)}</strong><span>{copy.qty}</span><div className="checkout-quantity"><button type="button" disabled={isPreviewing || loading || item.quantity <= 1} onClick={() => updateQuantity(item.lineId, item.quantity - 1)} aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"}><Minus size={12} /></button><b>{item.quantity}</b><button type="button" disabled={isPreviewing || loading} onClick={() => updateQuantity(item.lineId, item.quantity + 1)} aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"}><Plus size={12} /></button></div></div>
            <b>{formatMoney(item.lineTotal, language)}</b>
          </div>)}</div>
          <section className="review-preference" aria-labelledby="preference-title">
            <span className="eyebrow" id="preference-title">{copy.preparationTitle}</span>
            <div className="preference-options"><label><input type="radio" name="preparation" checked={preparation === "single"} onChange={() => setPreparation("single")} /><span>{copy.single}</span></label><label><input type="radio" name="preparation" checked={preparation === "tasbih"} onChange={() => setPreparation("tasbih")} /><span>{copy.tasbih}</span><small>{copy.tasbihFormula}</small></label></div>
            {tasbihAssembly && <div className="tasbih-price-note"><div><span>{copy.tasbihFee}</span><small>{copy.tasbihFormula}</small></div><strong>{formatMoney(tasbihAssembly, language)}</strong></div>}
            <label className="order-note"><span>{copy.noteLabel}</span><textarea value={customerNote} onChange={event => setCustomerNote(event.target.value)} maxLength={420} placeholder={copy.notePlaceholder} /></label>
          </section>
          <section className="checkout-form-section" aria-labelledby="delivery-details-title">
            <div className="checkout-form-section__heading"><h3 id="delivery-details-title">{copy.deliveryTitle}</h3><p>{copy.deliveryHint}</p></div>
            <div className="checkout-form-grid">
              <label className="checkout-field is-wide"><span>{copy.name}</span><input required value={delivery.customerName} onChange={event => updateDelivery("customerName", event.target.value)} /></label>
              <label className="checkout-field"><span>{copy.email}</span><input required type="email" value={delivery.email} onChange={event => updateDelivery("email", event.target.value)} /></label>
              <label className="checkout-field"><span>{copy.phone}</span><input required type="tel" inputMode="tel" value={delivery.phone} onChange={event => updateDelivery("phone", event.target.value)} /></label>
              <label className="checkout-field is-wide"><span>{copy.address}</span><input required value={delivery.addressLine1} onChange={event => updateDelivery("addressLine1", event.target.value)} /></label>
              <label className="checkout-field is-wide"><span>{copy.apartment}</span><input value={delivery.addressLine2} onChange={event => updateDelivery("addressLine2", event.target.value)} /></label>
              <label className="checkout-field"><span>{copy.city}</span><input required value={delivery.city} onChange={event => updateDelivery("city", event.target.value)} /></label>
              <label className="checkout-field"><span>{copy.governorate}</span><input required value={delivery.governorate} onChange={event => updateDelivery("governorate", event.target.value)} /></label>
              <label className="checkout-field"><span>{copy.postal}</span><input inputMode="numeric" value={delivery.postalCode} onChange={event => updateDelivery("postalCode", event.target.value)} /></label>
            </div>
          </section>
          <section className="checkout-form-section" aria-labelledby="delivery-method-title">
            <div className="checkout-form-section__heading"><h3 id="delivery-method-title">{copy.deliveryMethod}</h3><p>{copy.deliveryTime}</p></div>
            <div className="delivery-method"><span className="delivery-method__copy"><strong>{copy.deliveryMethod}</strong><span>{copy.deliveryTime}</span></span><b>{formatMoney(shipping, language)}</b></div>
          </section>
          <section className="checkout-form-section" aria-labelledby="payment-method-title">
            <div className="checkout-form-section__heading"><h3 id="payment-method-title">{copy.paymentTitle}</h3><p>{isArabic ? "اختاري الطريقة المتاحة" : "Choose an available method"}</p></div>
            <div className="payment-options">
              <label className="payment-option"><input type="radio" name="payment" checked readOnly /><span className="payment-option__copy"><strong>{copy.cod}</strong><span>{copy.codHint}</span></span></label>
              <label className="payment-option is-disabled" aria-disabled="true"><input type="radio" name="payment" disabled /><span className="payment-option__copy"><strong><CreditCard size={14} /> {copy.card}</strong><span>{copy.cardHint}</span></span></label>
            </div>
            <p className="no-card-data-note"><ShieldCheck size={14} /> {copy.noCard}</p>
          </section>
          <div className="checkout-totals"><div><span>{copy.subtotal}</span><b>{formatMoney(orderSubtotal, language)}</b></div><div><span>{copy.shipping}</span><b>{formatMoney(shipping, language)}</b></div>{tasbihAssembly && <div><span>{copy.tasbihFee}</span><b>{formatMoney(tasbihAssembly, language)}</b></div>}<div className="checkout-totals__total"><span>{copy.total}</span><strong>{formatMoney(total, language)}</strong></div></div>
          {createOrder.isError && <p className="checkout-submit-error">{copy.orderError}</p>}
          <button type="submit" className="action-button review-submit order-submit" disabled={isPreviewing || loading || createOrder.isPending}>{createOrder.isPending ? copy.submitting : copy.submit} <PackageCheck size={17} /></button>
        </form>}
        <p className="review-note">{copy.note}</p>
      </aside>
    </div>
  </main>;
}
