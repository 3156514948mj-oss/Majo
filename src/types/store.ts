export type Department = 'Mujer' | 'Hombre' | 'Niños' | 'Accesorios';

export const DEPARTMENT_CATEGORIES: Record<Department, string[]> = {
  Mujer: [
    'Camisetas',
    'Blusas',
    'Pantalones',
    'Jeans',
    'Vestidos',
    'Faldas',
    'Chaquetas',
    'Sudaderas',
    'Ropa deportiva',
    'Conjuntos',
  ],
  Hombre: [
    'Camisetas',
    'Camisas',
    'Pantalones',
    'Jeans',
    'Bermudas',
    'Chaquetas',
    'Sudaderas',
    'Ropa deportiva',
  ],
  Niños: [
    'Camisetas',
    'Pantalones',
    'Conjuntos',
    'Vestidos',
    'Chaquetas',
  ],
  Accesorios: [
    'Gorras',
    'Bolsos',
    'Carteras',
    'Correas',
    'Gafas',
    'Accesorios de moda',
  ],
};

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  city: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  department: Department;
  category: string;
  brand: string;
  collection: string;
  description: string;
  material: string;
  careInstructions: string;
  price: number;
  previousPrice?: number;
  discountPercent: number;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  stockByVariant: Record<string, Record<string, number>>;
  rating: number;
  reviewCount: number;
  soldCount: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isClearance?: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface UserAddress {
  id: string;
  label: string;
  department: string;
  city: string;
  street: string;
  neighborhood: string;
  notes?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  documentId: string;
  role: 'customer' | 'admin';
  addresses: UserAddress[];
  favorites: string[];
  createdAt: string;
}

export type OrderStatus =
  | 'Pedido recibido'
  | 'Pago confirmado'
  | 'En preparación'
  | 'Enviado'
  | 'En camino'
  | 'Entregado'
  | 'Cancelado';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Pedido recibido',
  'Pago confirmado',
  'En preparación',
  'Enviado',
  'En camino',
  'Entregado',
];

export type PaymentMethod =
  | 'Nequi'
  | 'Daviplata'
  | 'PSE'
  | 'Tarjeta Débito'
  | 'Tarjeta Crédito'
  | 'Transferencia Bancaria'
  | 'Pago Contra Entrega';

export type ShippingCarrier =
  | 'Servientrega Estándar'
  | 'Coordinadora Express'
  | 'Inter Rapidísimo'
  | 'Recoger en Boutique Bogotá';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    documentId: string;
  };
  shippingAddress: {
    department: string;
    city: string;
    street: string;
    neighborhood: string;
    notes?: string;
  };
  carrier: ShippingCarrier;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  paymentMode: 'demo' | 'wompi_ready' | 'mercadopago_ready';
  paymentGatewayRef: string;
  couponCode?: string;
  subtotal: number;
  quantityDiscount: number;
  couponDiscount: number;
  total: number;
  items: OrderItem[];
  status: OrderStatus;
  timeline: OrderStatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderCop: number;
  active: boolean;
  expiresAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  type: 'seasonal' | 'quantity' | 'combo' | 'clearance';
  discountPercent: number;
  minQuantity?: number;
  department?: Department;
  active: boolean;
}

export interface AdminStats {
  totalSales: number;
  todayRevenue: number;
  orderCount: number;
  productsSold: number;
  outOfStockProducts: number;
  registeredCustomers: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sku: string;
    department: string;
    soldCount: number;
    revenue: number;
    stock: number;
  }>;
}

export interface StoreNotification {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
  timestamp: string;
  read: boolean;
}
