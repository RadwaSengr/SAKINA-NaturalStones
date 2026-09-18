/** SAKINA application shell — live product catalog with persistent language, cart, and in-site order state. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { MobileTabBar, ShoppingBagDrawer, StoreHeader } from "./components/StoreChrome";
import { Route, Switch, useLocation } from "wouter";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Collection from "./pages/Collection";
import StoneDetail from "./pages/StoneDetail";
import CertificateGuide from "./pages/CertificateGuide";
import OrderConfirmed from "./pages/OrderConfirmed";
import OwnerOrders from "./pages/OwnerOrders";
import NotFound from "./pages/NotFound";

function Router() { return <Switch><Route path="/" component={Home} /><Route path="/collection" component={Collection} /><Route path="/stone/:handle" component={StoneDetail} /><Route path="/checkout" component={Checkout} /><Route path="/order-confirmed/:reference" component={OrderConfirmed} /><Route path="/certificate" component={CertificateGuide} /><Route path="/owner" component={OwnerOrders} /><Route path="/admin" component={OwnerOrders} /><Route path="/analytics" component={OwnerOrders} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
function StorefrontChrome() { const [location] = useLocation(); if (location.startsWith("/owner") || location.startsWith("/admin") || location.startsWith("/analytics")) return null; return <><StoreHeader /><ShoppingBagDrawer /><MobileTabBar /></>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><LanguageProvider><CartProvider><StorefrontChrome /><Router /><Toaster /></CartProvider></LanguageProvider></TooltipProvider></ThemeProvider></ErrorBoundary>; }
