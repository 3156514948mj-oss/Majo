import { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { AccountView } from './components/AccountView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { CartDrawer } from './components/CartDrawer';
import { CatalogView, type CatalogFilters } from './components/CatalogView';
import { CheckoutView } from './components/CheckoutView';
import { Footer } from './components/Footer';
import { Header, type ActiveView } from './components/Header';
import { HomeView } from './components/HomeView';
import { InfoPagesView } from './components/InfoPagesView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { ProductDetailView } from './components/ProductDetailView';
import { SizeGuideModal } from './components/SizeGuideModal';
import { getAuthToken, setAuthToken, storeApi } from './services/api';
import type {
  CartItem,
  Coupon,
  Department,
  Order,
  PaymentMethod,
  Product,
  ProductReview,
  Promotion,
  ShippingCarrier,
  StoreNotification,
  UserProfile,
} from './types/store';
import { getVariantStock } from './utils/format';

const CART_STORAGE_KEY = 'urban_style_cart_v1';
const FAV_STORAGE_KEY = 'urban_style_favs_v1';
const HISTORY_STORAGE_KEY = 'urban_style_history_v1';
const NOTIF_STORAGE_KEY = 'urban_style_notifs_v1';

const DEFAULT_FILTERS: CatalogFilters = {
  department: 'Todos',
  category: '',
  size: '',
  color: '',
  brand: '',
  minPrice: '',
  maxPrice: '',
  onlyAvailable: false,
  onlyDiscounts: false,
  sortBy: 'best',
};

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);

  const [cart, setCart] = useState<CartItem[]>(() => readJsonStorage(CART_STORAGE_KEY, []));
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon: Coupon; discount: number } | null>(null);

  const [guestFavorites, setGuestFavorites] = useState<string[]>(() =>
    readJsonStorage(FAV_STORAGE_KEY, []),
  );
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    readJsonStorage(HISTORY_STORAGE_KEY, []),
  );
  const [notifications, setNotifications] = useState<StoreNotification[]>(() =>
    readJsonStorage(NOTIF_STORAGE_KEY, [
      {
        id: 'notif-welcome',
        title: 'Envío gratis activo',
        message: 'En pedidos desde $250.000 COP a toda Colombia.',
        timestamp: new Date().toISOString(),
        read: false,
      },
    ]),
  );

  const [user, setUser] = useState<UserProfile | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideDept, setSizeGuideDept] = useState<'Mujer' | 'Hombre' | 'Niños'>('Mujer');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2600);
  }, []);

  const loadCatalog = useCallback(async (overrideProducts?: Product[]) => {
    if (overrideProducts) {
      setProducts(overrideProducts);
      return;
    }
    const res = await storeApi.getCatalog();
    setProducts(res.products);
    setReviews(res.reviews);
  }, []);

  const loadPromotions = useCallback(async () => {
    const res = await storeApi.getPromotions();
    setCoupons(res.coupons);
    setPromotions(res.promotions);
  }, []);

  useEffect(() => {
    Promise.all([loadCatalog(), loadPromotions()])
      .catch(() => {})
      .finally(() => setLoading(false));

    if (getAuthToken()) {
      storeApi
        .getMe()
        .then((res) => setUser(res.user))
        .catch(() => setAuthToken(null));
    }
  }, [loadCatalog, loadPromotions]);

  // Persist cart, guest favorites, browsing history & notifications
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(guestFavorites));
    } catch {
      // ignore
    }
  }, [guestFavorites]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(recentlyViewedIds));
    } catch {
      // ignore
    }
  }, [recentlyViewedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  const navigateTo = (view: ActiveView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const favorites = user ? user.favorites : guestFavorites;

  const handleToggleFavorite = async (productId: string) => {
    if (user) {
      try {
        const res = await storeApi.toggleFavorite(productId);
        setUser({ ...user, favorites: res.favorites });
        showToast(
          res.favorites.includes(productId)
            ? 'Guardado en tu lista de favoritos'
            : 'Eliminado de favoritos',
        );
      } catch {
        // ignore
      }
    } else {
      setGuestFavorites((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [productId, ...prev];
        showToast(exists ? 'Eliminado de favoritos' : 'Guardado en favoritos');
        return next;
      });
    }
  };

  const handleOpenDetail = (product: Product) => {
    setSelectedProductId(product.id);
    setRecentlyViewedIds((prev) => [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 8));
    navigateTo('product');
  };

  const handleAddToCart = (product: Product, size: string, color: string, qty = 1) => {
    const avail = getVariantStock(product, size, color);
    if (avail <= 0) {
      showToast('Esta combinación de talla y color está agotada');
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.size === size && item.color === color,
      );
      if (existingIdx !== -1) {
        const nextQty = Math.min(avail, prev[existingIdx].quantity + qty);
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], quantity: nextQty };
        return copy;
      }
      return [...prev, { productId: product.id, size, color, quantity: Math.min(avail, qty) }];
    });
    showToast(`${product.name} (${size}) agregado al carrito`);
  };

  const handleUpdateCartItem = (
    index: number,
    next: { size?: string; color?: string; quantity?: number },
  ) => {
    setCart((prev) => {
      const current = prev[index];
      if (!current) return prev;
      const product = products.find((p) => p.id === current.productId);
      if (!product) return prev;

      const targetSize = next.size ?? current.size;
      const targetColor = next.color ?? current.color;
      const avail = getVariantStock(product, targetSize, targetColor);
      if (avail <= 0) {
        showToast(`Sin stock en talla ${targetSize} · ${targetColor}`);
        return prev;
      }
      const targetQty = Math.min(avail, Math.max(1, next.quantity ?? current.quantity));
      const updated = [...prev];
      updated[index] = {
        ...current,
        size: targetSize,
        color: targetColor,
        quantity: targetQty,
      };
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyCoupon = async (code: string): Promise<string | null> => {
    const subtotal = cart.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return sum + (p ? p.price * item.quantity : 0);
    }, 0);
    try {
      const res = await storeApi.validateCoupon(code, subtotal);
      setAppliedCoupon(res);
      showToast(`Cupón ${res.coupon.code} aplicado`);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Cupón inválido';
    }
  };

  const handleApplyCouponDirect = async (code: string) => {
    if (cart.length === 0) {
      showToast(`Cupón ${code} copiado. Agrega prendas para aplicarlo en tu bolsa.`);
      navigator.clipboard?.writeText(code).catch(() => {});
      return;
    }
    const err = await handleApplyCoupon(code);
    if (err) {
      showToast(err);
    } else {
      setCartOpen(true);
    }
  };

  const handlePlaceOrder = async (payload: {
    items: CartItem[];
    customer: Order['customer'];
    shippingAddress: Order['shippingAddress'];
    carrier: ShippingCarrier;
    paymentMethod: PaymentMethod;
    couponCode?: string;
  }) => {
    const res = await storeApi.createOrder(payload);
    setProducts(res.products);
    setCart([]);
    setAppliedCoupon(null);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `Pedido ${res.order.orderNumber} confirmado`,
        message: `Tu orden por ${res.order.items.length} prenda(s) fue registrada (${res.order.paymentMethod}).`,
        orderNumber: res.order.orderNumber,
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
    return res.order;
  };

  const handleExploreCatalog = (opts?: {
    department?: Department | 'Todos';
    onlyDiscounts?: boolean;
    brand?: string;
  }) => {
    setFilters({
      ...DEFAULT_FILTERS,
      department: opts?.department ?? 'Todos',
      onlyDiscounts: Boolean(opts?.onlyDiscounts),
      brand: opts?.brand ?? '',
    });
    navigateTo('catalog');
  };

  const handleSubmitReview = async (productId: string, rating: number, comment: string) => {
    const res = await storeApi.createReview(productId, { rating, comment });
    setReviews((prev) => [res.review, ...prev]);
    setProducts((prev) => prev.map((p) => (p.id === productId ? res.product : p)));
    showToast('¡Gracias por publicar tu opinión!');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#111111]">
      <Header
        activeView={activeView}
        selectedDepartment={filters.department}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activeView !== 'catalog' && q.trim().length > 0) {
            setActiveView('catalog');
          }
        }}
        onSearchSubmit={() => navigateTo('catalog')}
        onNavigateHome={() => navigateTo('home')}
        onSelectDepartment={(dept, onlyDiscounts) =>
          handleExploreCatalog({ department: dept, onlyDiscounts })
        }
        onNavigate={(view) => navigateTo(view)}
        onOpenCart={() => setCartOpen(true)}
        cartCount={cartCount}
        favoritesCount={favorites.length}
        user={user}
        notifications={notifications}
        onMarkNotificationsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />

      <main className="flex-1">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
            <p className="font-editorial text-2xl text-[#111111]">Cargando colección URBAN STYLE...</p>
            <p className="text-xs text-[#5C5852]">Sincronizando inventario y tallas disponibles</p>
          </div>
        ) : (
          <>
            {activeView === 'home' && (
              <HomeView
                products={products}
                reviews={reviews}
                coupons={coupons}
                promotions={promotions}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetail={handleOpenDetail}
                onAddToCart={(p, s, c) => handleAddToCart(p, s, c, 1)}
                onExploreCatalog={handleExploreCatalog}
                onApplyCouponDirect={handleApplyCouponDirect}
              />
            )}

            {activeView === 'catalog' && (
              <CatalogView
                products={products}
                recentlyViewedIds={recentlyViewedIds}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={filters}
                onFiltersChange={setFilters}
                onResetFilters={() => {
                  setFilters(DEFAULT_FILTERS);
                  setSearchQuery('');
                }}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetail={handleOpenDetail}
                onAddToCart={(p, s, c) => handleAddToCart(p, s, c, 1)}
              />
            )}

            {activeView === 'product' && selectedProduct && (
              <ProductDetailView
                product={selectedProduct}
                allProducts={products}
                reviews={reviews}
                favorites={favorites}
                user={user}
                onBack={() => navigateTo('catalog')}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
                onOpenDetail={handleOpenDetail}
                onOpenSizeGuide={(dept) => {
                  if (dept) setSizeGuideDept(dept);
                  setSizeGuideOpen(true);
                }}
                onSubmitReview={handleSubmitReview}
              />
            )}

            {activeView === 'checkout' && (
              <CheckoutView
                items={cart}
                products={products}
                user={user}
                appliedCoupon={appliedCoupon}
                onBackToStore={() => navigateTo('catalog')}
                onPlaceOrder={handlePlaceOrder}
                onTrackOrder={(orderNumber) => {
                  setTrackingOrderNumber(orderNumber);
                  navigateTo('tracking');
                }}
              />
            )}

            {(activeView === 'account' || activeView === 'favorites') && (
              <AccountView
                user={user}
                products={products}
                favorites={favorites}
                initialTab={activeView === 'favorites' ? 'favorites' : 'profile'}
                onAuthSuccess={(token, nextUser) => {
                  setAuthToken(token);
                  setUser(nextUser);
                  showToast(`Bienvenido, ${nextUser.name}`);
                }}
                onUserUpdated={(nextUser) => setUser(nextUser)}
                onLogout={() => {
                  setAuthToken(null);
                  setUser(null);
                  showToast('Sesión cerrada');
                }}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetail={handleOpenDetail}
                onAddToCart={(p, s, c) => handleAddToCart(p, s, c, 1)}
                onTrackOrder={(orderNumber) => {
                  setTrackingOrderNumber(orderNumber);
                  navigateTo('tracking');
                }}
                onOpenAdmin={() => navigateTo('admin')}
              />
            )}

            {activeView === 'tracking' && (
              <OrderTrackingView
                initialOrderNumber={trackingOrderNumber}
                onTrack={async (num) => {
                  const res = await storeApi.trackOrder(num);
                  return res.order;
                }}
              />
            )}

            {activeView === 'admin' && (
              <AdminDashboardView
                user={user}
                products={products}
                coupons={coupons}
                onProductsChanged={loadCatalog}
                onCouponsChanged={loadPromotions}
                onGoToAccount={() => navigateTo('account')}
              />
            )}

            {(activeView === 'faq' || activeView === 'privacy' || activeView === 'terms') && (
              <InfoPagesView page={activeView} onBack={() => navigateTo('home')} />
            )}
          </>
        )}
      </main>

      <Footer
        onSelectDepartment={(dept, onlyDiscounts) =>
          handleExploreCatalog({ department: dept, onlyDiscounts })
        }
        onNavigate={navigateTo}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
      />

      {/* Slide-Over Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        products={products}
        appliedCoupon={appliedCoupon}
        onUpdateItemVariant={handleUpdateCartItem}
        onRemoveItem={handleRemoveCartItem}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={() => setAppliedCoupon(null)}
        onProceedToCheckout={() => {
          setCartOpen(false);
          navigateTo('checkout');
        }}
      />

      {/* Size Guide Modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        initialTab={sizeGuideDept}
      />

      {/* Floating WhatsApp Concierge Button (compact, respects mobile viewport) */}
      <a
        href="https://wa.me/573156514948?text=Hola%20URBAN%20STYLE,%20necesito%20ayuda%20con%20mi%20pedido"
        target="_blank"
        rel="noreferrer"
        aria-label="Asesoría por WhatsApp"
        title="Chatear por WhatsApp"
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 bg-[#111111] text-[#C5A059] border border-[#C5A059]/60 px-3.5 py-2.5 shadow-lg hover:bg-[#1E1E1E] transition-colors text-xs font-semibold"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      {/* Action Feedback Toast */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 left-5 z-50 bg-[#111111] text-white border border-[#C5A059] px-4 py-3 text-xs font-medium shadow-xl max-w-xs"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
