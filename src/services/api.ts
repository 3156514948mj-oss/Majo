import type {
  AdminStats,
  Coupon,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductReview,
  Promotion,
  ShippingCarrier,
  UserProfile,
} from '../types/store';

const TOKEN_KEY = 'urban_style_token_v1';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Error HTTP ${res.status}`);
  }
  return data as T;
}

export const storeApi = {
  getCatalog: () => request<{ products: Product[]; reviews: ProductReview[] }>('/api/products'),

  getPromotions: () => request<{ coupons: Coupon[]; promotions: Promotion[] }>('/api/promotions'),

  getIntegrationsStatus: () =>
    request<{
      wompiConfigured: boolean;
      mercadoPagoConfigured: boolean;
      storageMode: string;
      paymentDemoMode: boolean;
    }>('/api/integrations/status'),

  validateCoupon: (code: string, subtotal: number) =>
    request<{ coupon: Coupon; discount: number }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),

  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    documentId?: string;
  }) =>
    request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  recoverPassword: (email: string) =>
    request<{ ok: boolean; message: string; demoResetCode?: string }>('/api/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ ok: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),

  getMe: () => request<{ user: UserProfile }>('/api/auth/me'),

  updateProfile: (payload: Partial<UserProfile>) =>
    request<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  toggleFavorite: (productId: string) =>
    request<{ favorites: string[] }>('/api/auth/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),

  createReview: (productId: string, payload: { rating: number; comment: string; city?: string }) =>
    request<{ review: ProductReview; product: Product }>(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createOrder: (payload: {
    items: Array<{ productId: string; size: string; color: string; quantity: number }>;
    customer: Order['customer'];
    shippingAddress: Order['shippingAddress'];
    carrier: ShippingCarrier;
    paymentMethod: PaymentMethod;
    couponCode?: string;
  }) =>
    request<{ order: Order; products: Product[] }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyOrders: () => request<{ orders: Order[] }>('/api/orders/my'),

  trackOrder: (orderNumber: string) =>
    request<{ order: Order }>(`/api/orders/track/${encodeURIComponent(orderNumber)}`),

  // Admin endpoints
  getAdminStats: () => request<{ stats: AdminStats }>('/api/admin/stats'),

  getAdminOrders: () => request<{ orders: Order[] }>('/api/admin/orders'),

  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) =>
    request<{ order: Order; products: Product[] }>(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  getAdminCustomers: () =>
    request<{
      customers: Array<UserProfile & { orderCount: number; totalSpent: number }>;
    }>('/api/admin/customers'),

  createProduct: (payload: Partial<Product>) =>
    request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: string, payload: Partial<Product>) =>
    request<{ product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  uploadImage: (dataUrl: string, filename: string) =>
    request<{ url: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename }),
    }),

  createCoupon: (payload: Partial<Coupon>) =>
    request<{ coupon: Coupon }>('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleCoupon: (id: string, active: boolean) =>
    request<{ coupon: Coupon }>(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),

  deleteCoupon: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
    }),
};
