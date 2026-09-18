import React, { useEffect, useMemo, useReducer, useState } from "react";
import { CircleAlert, ClipboardList, Download, House, LogOut, MapPin, PackageCheck, Phone, RefreshCw, ShieldCheck, Truck, UserRound } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { assetUrl } from "@/lib/sakina";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { Link, useLocation } from "wouter";

const statuses = ["pending_cod", "preparing", "in_transit", "delivered"] as const;
type OrderStatus = (typeof statuses)[number];

type StoredItem = {
  title?: string;
  quantity?: number;
  lineTotal?: { amount?: string; currencyCode?: string };
};

type OrderForExport = {
  reference: string;
  status: OrderStatus;
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  governorate: string;
  postalCode: string | null;
  preparation: "single" | "tasbih";
  itemsJson: string;
  subtotalPiasters: number;
  shippingPiasters: number;
  tasbihAssemblyPiasters: number;
  totalPiasters: number;
  createdAt: Date;
  updatedAt?: Date;
  customerNote?: string | null;
};

function parseItems(serialized: string): StoredItem[] {
  try {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "object" && item !== null) as StoredItem[] : [];
  } catch {
    return [];
  }
}

function moneyFromPiasters(value: number, language: "ar" | "en") {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value / 100);
}

const orderStatusLabels: Record<OrderStatus, { ar: string; en: string }> = {
  pending_cod: { ar: "طلب جديد", en: "New order" },
  preparing: { ar: "قيد التجهيز", en: "Preparing" },
  in_transit: { ar: "في الطريق", en: "In transit" },
  delivered: { ar: "تم التسليم", en: "Delivered" },
};

/** Produces rows for the exact orders currently visible to the verified owner. */
export function buildOrderExportRows(orders: readonly OrderForExport[], language: "ar" | "en") {
  return orders.map(order => {
    const items = parseItems(order.itemsJson).map(item => `${item.title || "SAKINA stone"} × ${item.quantity ?? 1}`).join(" | ");
    const address = [order.addressLine1, order.addressLine2, order.city, order.governorate, order.postalCode].filter(Boolean).join(" · ");
    const amount = (value: number) => value / 100;
    return language === "ar"
      ? {
          "رقم الطلب": order.reference,
          "تاريخ الطلب": new Date(order.createdAt).toLocaleString("ar-EG"),
          "حالة الطلب": orderStatusLabels[order.status].ar,
          "اسم العميل": order.customerName,
          "الهاتف": order.phone,
          "البريد الإلكتروني": order.email,
          "العنوان": address,
          "القطع": items,
          "التجهيز": order.preparation === "tasbih" ? "سبحة" : "قطعة فردية",
          "قيمة الأحجار (ج.م.)": amount(order.subtotalPiasters),
          "تجهيز السبحة (ج.م.)": amount(order.tasbihAssemblyPiasters),
          "التوصيل (ج.م.)": amount(order.shippingPiasters),
          "إجمالي الطلب (ج.م.)": amount(order.totalPiasters),
        }
      : {
          "Order reference": order.reference,
          "Order date": new Date(order.createdAt).toLocaleString("en-GB"),
          Status: orderStatusLabels[order.status].en,
          Customer: order.customerName,
          Phone: order.phone,
          Email: order.email,
          Address: address,
          Items: items,
          Preparation: order.preparation === "tasbih" ? "Tasbih" : "Single stone",
          "Stone value (EGP)": amount(order.subtotalPiasters),
          "Tasbih assembly (EGP)": amount(order.tasbihAssemblyPiasters),
          "Delivery (EGP)": amount(order.shippingPiasters),
          "Order total (EGP)": amount(order.totalPiasters),
        };
  });
}

function dateBoundary(dateValue: string, endOfDay: boolean): number | null {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0).getTime();
}

/** Filters by calendar days inclusively in the owner's current local timezone. */
export function filterOrdersByDateRange<T extends { createdAt: Date }>(orders: readonly T[], startDate: string, endDate: string): T[] {
  const start = dateBoundary(startDate, false);
  const end = dateBoundary(endDate, true);
  if (start !== null && end !== null && start > end) return [];
  return orders.filter(order => {
    const timestamp = new Date(order.createdAt).getTime();
    return (start === null || timestamp >= start) && (end === null || timestamp <= end);
  });
}

function downloadOrdersExcel(orders: readonly OrderForExport[], language: "ar" | "en", XLSX: typeof import("xlsx")) {
  const sheet = XLSX.utils.json_to_sheet(buildOrderExportRows(orders, language));
  sheet["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 24 }, { wch: 18 }, { wch: 34 }, { wch: 50 }, { wch: 50 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 17 }, { wch: 20 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, language === "ar" ? "طلبات سكينة" : "SAKINA Orders");
  const contents = XLSX.write(workbook, { bookType: "xlsx", type: "array", compression: true });
  const blob = new Blob([contents], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `sakina-orders-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

export function OwnerStatusUpdateError({ message }: { message: string }) {
  return <div className="owner-update-error" role="alert"><CircleAlert size={15} /> {message}</div>;
}

export function ownerStatusFeedbackReducer(_hasError: boolean, action: "failed" | "retry" | "succeeded") {
  return action === "failed";
}

export default function OwnerOrders() {
  const { user, loading: authLoading, logout } = useAuth();
  const { language, isArabic } = useLanguage();
  const [, setLocation] = useLocation();
  const isOwner = Boolean(user?.isOwner);
  useEffect(() => {
    if (!authLoading && user && !isOwner) setLocation("/");
  }, [authLoading, isOwner, setLocation]);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusError, setStatusFeedback] = useReducer(ownerStatusFeedbackReducer, false);
  const [excelModule, setExcelModule] = useState<typeof import("xlsx") | null>(null);
  const [exportError, setExportError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  useEffect(() => {
    let mounted = true;
    void import("xlsx").then(module => {
      if (mounted) setExcelModule(module);
    }).catch(() => {
      if (mounted) setExportError(true);
    });
    return () => { mounted = false; };
  }, []);
  const mobilePreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mobile") === "1";
  const utils = trpc.useUtils();
  const orderQuery = trpc.commerce.orders.ownerList.useQuery(undefined, { enabled: isOwner, staleTime: 30_000 });
  const statusMutation = trpc.commerce.orders.updateStatus.useMutation({
    onSuccess: () => {
      setStatusFeedback("succeeded");
      utils.commerce.orders.ownerList.invalidate();
    },
    onError: () => setStatusFeedback("failed"),
  });

  const copy = isArabic ? {
    eyebrow: "إدارة سكينة", title: "طلبات المتجر", body: "تابعي كل طلب من لحظة تأكيده وحتى وصوله للعميل.", deniedTitle: "هذه الصفحة للمالك فقط", deniedBody: "لا تملكين صلاحية الوصول إلى بيانات الطلبات.", loginTitle: "دخول المالكة", loginBody: "سجّلي الدخول بحساب المالكة لفتح إدارة الطلبات. لا تظهر بيانات الطلبات قبل التحقق من الحساب.", login: "تسجيل الدخول", export: "تصدير Excel", exporting: "جارٍ تجهيز الملف…", exportError: "تعذر تجهيز ملف Excel. حاولي مرة أخرى.",
    all: "الكل", pending_cod: "طلبات جديدة", preparing: "قيد التجهيز", in_transit: "في الطريق", delivered: "تم التسليم", total: "إجمالي الطلب", delivery: "بيانات التوصيل", items: "قطع الطلب", preference: "التجهيز", tasbihFee: "تجهيز السبحة والخرز", note: "ملاحظة العميل", status: "حالة الطلب", updated: "آخر تحديث", noOrders: "لا توجد طلبات ضمن هذه الحالة الآن.", noOrdersInRange: "لا توجد طلبات ضمن الفترة المحددة.", loading: "نرتّب سجل الطلبات…", error: "تعذر فتح سجل الطلبات الآن.", updateError: "لم يتم حفظ التغيير. جرّبي اختيار الحالة مرة أخرى.", retry: "إعادة المحاولة", guest: "عميل", address: "العنوان", phone: "الهاتف", details: "تفاصيل الطلب", updating: "جارٍ الحفظ…", access: "وصول خاص بالمالك", home: "العودة للرئيسية", dateFilter: "تصفية بالتاريخ", fromDate: "من تاريخ", toDate: "إلى تاريخ", resetDates: "مسح الفترة", invalidRange: "تاريخ البداية يجب أن يسبق أو يساوي تاريخ النهاية.", visibleOrders: "طلباً مطابقاً",
  } : {
    eyebrow: "SAKINA MANAGEMENT", title: "Store orders", body: "Follow each order from confirmation through delivery.", deniedTitle: "This page is for the owner only", deniedBody: "You do not have permission to access order data.", loginTitle: "Owner sign-in", loginBody: "Sign in with the owner account to open order management. No order data is shown before the account is verified.", login: "Sign in", export: "Export Excel", exporting: "Preparing file…", exportError: "We could not prepare the Excel file. Please try again.",
    all: "All", pending_cod: "New orders", preparing: "Preparing", in_transit: "In transit", delivered: "Delivered", total: "Order total", delivery: "Delivery details", items: "Order items", preference: "Preparation", tasbihFee: "Tasbih assembly & beads", note: "Customer note", status: "Order status", updated: "Last updated", noOrders: "There are no orders in this status yet.", noOrdersInRange: "There are no orders in the selected date range.", loading: "Arranging the order register…", error: "We could not open the order register.", updateError: "The change was not saved. Choose the status again to retry.", retry: "Try again", guest: "Customer", address: "Address", phone: "Phone", details: "Order details", updating: "Saving…", access: "Owner-only access", home: "Back to home", dateFilter: "Filter by date", fromDate: "From", toDate: "To", resetDates: "Clear dates", invalidRange: "The start date must be on or before the end date.", visibleOrders: "matching orders",
  };

  const localOrders = useMemo<OrderForExport[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("sakina:local-orders");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            updatedAt: new Date(o.updatedAt || o.createdAt),
          }))
        : [];
    } catch {
      return [];
    }
  }, []);

  const orders = (orderQuery.data && orderQuery.data.length > 0) ? orderQuery.data : localOrders;
  const isDateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const dateFilteredOrders = useMemo(() => isDateRangeInvalid ? [] : filterOrdersByDateRange(orders, startDate, endDate), [orders, startDate, endDate, isDateRangeInvalid]);
  const counts = useMemo(() => Object.fromEntries(statuses.map(status => [status, dateFilteredOrders.filter(order => order.status === status).length])) as Record<OrderStatus, number>, [dateFilteredOrders]);
  const visibleOrders = activeFilter === "all" ? dateFilteredOrders : dateFilteredOrders.filter(order => order.status === activeFilter);
  const formatDate = (date: Date) => new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
  const exportVisibleOrders = async () => {
    if (!excelModule) return;
    setExportError(false);
    setIsExporting(true);
    try {
      downloadOrdersExcel(visibleOrders, language, excelModule);
    } catch {
      setExportError(true);
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading) return <main className="owner-gate owner-gate--loading"><RefreshCw size={20} /> {isArabic ? "جارٍ التحقق من الوصول…" : "Checking access…"}</main>;
  if (!isOwner && !user) return (
    <main className={`owner-gate lang-${language}`} dir={isArabic ? "rtl" : "ltr"}>
      <img
        src={assetUrl("assets/sakina-mark_d9d397db.png")}
        alt="SAKINA"
        style={{ width: 68, height: 68, borderRadius: "50%", padding: 6, background: "rgba(7,60,52,0.06)", border: "1px solid rgba(7,60,52,0.15)", marginBottom: 8 }}
      />
      <div className="confirmation-mark" style={{ marginBottom: 4 }}>
        <ShieldCheck size={28} />
      </div>
      <span className="eyebrow">{copy.eyebrow}</span>
      <h1>{copy.loginTitle}</h1>
      <p>{copy.loginBody}</p>
      <button type="button" className="owner-login-button" onClick={() => startLogin("/owner")}>
        <ShieldCheck size={16} />{copy.login}
      </button>
      <Link href="/" className="back-link" style={{ marginTop: 14 }}>
        <House size={14} /> {copy.home}
      </Link>
    </main>
  );
  if (!isOwner) return null;

  return <DashboardLayout><main className={`owner-dashboard lang-${language}${mobilePreview ? " owner-dashboard--mobile-preview" : ""}`} dir={isArabic ? "rtl" : "ltr"}>
    <section className="owner-dashboard__hero"><div><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.body}</p></div><div className="owner-dashboard__hero-actions"><Link href="/owner" className="owner-orders-mobile-shortcut"><ClipboardList size={16} /><span>{isArabic ? "الطلبات" : "Orders"}</span></Link><button type="button" className="owner-export-button" onClick={exportVisibleOrders} disabled={!excelModule || isExporting || isDateRangeInvalid || visibleOrders.length === 0}><Download size={16} /><span>{isExporting ? copy.exporting : copy.export}</span></button><div className="owner-dashboard__access"><ShieldCheck size={18} /><span>{copy.access}</span></div><Link href="/" className="owner-home-link"><House size={16} /><span>{copy.home}</span></Link><button type="button" className="owner-home-link" onClick={() => logout()} title={isArabic ? "تسجيل الخروج" : "Sign out"} style={{ cursor: "pointer", border: "1px solid rgba(7,60,52,0.15)", background: "transparent" }}><LogOut size={16} /><span>{isArabic ? "خروج" : "Exit"}</span></button></div></section>
    <section className="owner-date-filter" aria-label={copy.dateFilter}><div className="owner-date-filter__heading"><span className="eyebrow">{copy.dateFilter}</span><b>{visibleOrders.length} {copy.visibleOrders}</b></div><div className="owner-date-filter__fields"><label><span>{copy.fromDate}</span><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label><span>{copy.toDate}</span><input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></label><button type="button" onClick={() => { setStartDate(""); setEndDate(""); }} disabled={!startDate && !endDate}>{copy.resetDates}</button></div></section>
    <section className="owner-status-grid" aria-label={copy.status}>
      <button className={activeFilter === "all" ? "is-active" : ""} onClick={() => setActiveFilter("all")}><ClipboardList size={18} /><span>{copy.all}</span><b>{orders.length}</b></button>
      {statuses.map(status => <button key={status} className={activeFilter === status ? `is-active status-${status}` : `status-${status}`} onClick={() => setActiveFilter(status)}><span className="owner-status-dot" /><span>{copy[status]}</span><b>{counts[status]}</b></button>)}
    </section>
    {statusError && <OwnerStatusUpdateError message={copy.updateError} />}{exportError && <OwnerStatusUpdateError message={copy.exportError} />}{isDateRangeInvalid && <OwnerStatusUpdateError message={copy.invalidRange} />}
    {isDateRangeInvalid ? null : orderQuery.isLoading ? <div className="owner-loading"><RefreshCw size={19} /> {copy.loading}</div> : orderQuery.isError ? <div className="owner-empty"><CircleAlert size={22} /><p>{copy.error}</p><button onClick={() => orderQuery.refetch()}>{copy.retry}</button></div> : visibleOrders.length === 0 ? <div className="owner-empty"><PackageCheck size={24} /><p>{startDate || endDate ? copy.noOrdersInRange : copy.noOrders}</p></div> : <section className="owner-order-list">
      {visibleOrders.map(order => {
        const items = parseItems(order.itemsJson);
        const address = [order.addressLine1, order.addressLine2, order.city, order.governorate, order.postalCode].filter(Boolean).join(" · ");
        return <article className="owner-order-card" key={order.reference}>
          <header><div><span className="owner-order-card__reference">{order.reference}</span><time>{formatDate(order.createdAt)}</time></div><strong>{moneyFromPiasters(order.totalPiasters, language)}</strong></header>
          <div className="owner-order-card__body">
            <section><span className="owner-section-label"><UserRound size={14} /> {copy.delivery}</span><strong>{order.customerName || copy.guest}</strong><a href={`mailto:${order.email}`}>{order.email}</a><a href={`tel:${order.phone}`}><Phone size={13} /> {order.phone}</a><p><MapPin size={13} /> {address}</p></section>
            <section><span className="owner-section-label"><ClipboardList size={14} /> {copy.items}</span>{items.length ? <ul>{items.map((item, index) => <li key={`${item.title}-${index}`}><span>{item.title || "SAKINA stone"} × {item.quantity ?? 1}</span><b>{item.lineTotal?.amount ? `${item.lineTotal.amount} ${item.lineTotal.currencyCode ?? "EGP"}` : ""}</b></li>)}</ul> : <p>—</p>}<small>{copy.preference}: {order.preparation === "tasbih" ? (isArabic ? "تجهيز كسبحة" : "Prepared as a tasbih") : (isArabic ? "قطعة فردية" : "Single stone")}</small>{order.tasbihAssemblyPiasters > 0 && <small>{copy.tasbihFee}: {moneyFromPiasters(order.tasbihAssemblyPiasters, language)}</small>}{order.customerNote && <small className="owner-note">{copy.note}: {order.customerNote}</small>}</section>
          </div>
          <footer><label><span>{copy.status}</span><select value={order.status} disabled={statusMutation.isPending} onChange={event => { setStatusFeedback("retry"); statusMutation.mutate({ reference: order.reference, status: event.target.value as OrderStatus }); }}>{statuses.map(status => <option value={status} key={status}>{copy[status]}</option>)}</select></label><span className="owner-updated"><Truck size={14} /> {statusMutation.isPending ? copy.updating : `${copy.updated}: ${formatDate(order.updatedAt || order.createdAt)}`}</span></footer>
        </article>;
      })}
    </section>}
  </main></DashboardLayout>;
}
