import { BadgeCheck, Home, PackageCheck } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function OrderConfirmed() {
  const [, params] = useRoute("/order-confirmed/:reference");
  const { language, isArabic } = useLanguage();
  const reference = params?.reference ?? "SKN";
  const copy = isArabic
    ? {
        place: "تأكيد الطلب", kicker: "تم استلام طلبك", title: <>طلبك في<br /><em>طريقه للهدوء.</em></>, body: "سنتواصل معك لتأكيد تفاصيل التسليم، ويكون الدفع عند الاستلام.", ref: "رقم طلبك", cod: "الدفع عند الاستلام", home: "العودة للرئيسية", cabinet: "استكشفي الخزانة",
      }
    : {
        place: "Order confirmed", kicker: "ORDER RECEIVED", title: <>Your stone is<br /><em>on its way to calm.</em></>, body: "We will contact you to confirm delivery details. Payment is due on delivery.", ref: "Your order reference", cod: "Cash on delivery", home: "Back home", cabinet: "Explore the cabinet",
      };

  return <main className={`order-confirmed-page lang-${language}`} dir={isArabic ? "rtl" : "ltr"}>
    <div className="route-context"><span>{isArabic ? "أنتِ الآن في" : "You are in"}</span><strong>{copy.place}</strong><Link href="/collection">{isArabic ? "الخزانة" : "Cabinet"}</Link></div>
    <section className="order-confirmed-card">
      <div className="confirmation-mark"><BadgeCheck size={28} /></div>
      <span className="eyebrow">{copy.kicker}</span>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <div className="confirmation-reference"><span>{copy.ref}</span><strong>{reference}</strong></div>
      <div className="confirmation-method"><PackageCheck size={18} /><span>{copy.cod}</span></div>
      <div className="confirmation-actions"><Link href="/" className="action-button"><Home size={16} /> {copy.home}</Link><Link href="/collection" className="confirmation-text-link">{copy.cabinet}</Link></div>
    </section>
  </main>;
}
