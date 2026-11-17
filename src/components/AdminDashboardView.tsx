import { useEffect, useState } from 'react';
import {
  BarChart3,
  Edit3,
  PackageCheck,
  Plus,
  ShieldAlert,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { storeApi } from '../services/api';
import type {
  AdminStats,
  Coupon,
  Department,
  Order,
  OrderStatus,
  Product,
  UserProfile,
} from '../types/store';
import { DEPARTMENT_CATEGORIES } from '../types/store';
import { formatCOP, getTotalProductStock } from '../utils/format';
import { SafeImage } from './SafeImage';

interface AdminDashboardViewProps {
  user: UserProfile | null;
  products: Product[];
  coupons: Coupon[];
  onProductsChanged: (nextProducts?: Product[]) => Promise<void>;
  onCouponsChanged: () => Promise<void>;
  onGoToAccount: () => void;
}

const ALL_ORDER_STATUSES: OrderStatus[] = [
  'Pedido recibido',
  'Pago confirmado',
  'En preparación',
  'Enviado',
  'En camino',
  'Entregado',
  'Cancelado',
];

export function AdminDashboardView({
  user,
  products,
  coupons,
  onProductsChanged,
  onCouponsChanged,
  onGoToAccount,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'promos' | 'customers'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Array<UserProfile & { orderCount: number; totalSpent: number }>>([]);
  const [integrations, setIntegrations] = useState<{
    wompiConfigured: boolean;
    mercadoPagoConfigured: boolean;
  } | null>(null);

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pDept, setPDept] = useState<Department>('Mujer');
  const [pCat, setPCat] = useState('Camisetas');
  const [pBrand, setPBrand] = useState('Urban Style Atelier');
  const [pPrice, setPPrice] = useState('189900');
  const [pPrevPrice, setPPrevPrice] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pMaterial, setPMaterial] = useState('100% Algodón Orgánico');
  const [pSizesText, setPSizesText] = useState('XS,S,M,L');
  const [pColorsText, setPColorsText] = useState('Negro:#141414,Beige:#D6C6B2');
  const [pImages, setPImages] = useState<string[]>(['/src/assets/images/mujer_camiseta_beige_1794878546016.jpg']);
  const [pStockMatrix, setPStockMatrix] = useState<Record<string, Record<string, number>>>({});
  const [uploading, setUploading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Coupon create state
  const [cCode, setCCode] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cType, setCType] = useState<'percentage' | 'fixed'>('percentage');
  const [cValue, setCValue] = useState('15');
  const [cMin, setCMin] = useState('150000');

  const refreshAdminData = async () => {
    if (user?.role !== 'admin') return;
    try {
      const [sRes, oRes, cRes, iRes] = await Promise.all([
        storeApi.getAdminStats(),
        storeApi.getAdminOrders(),
        storeApi.getAdminCustomers(),
        storeApi.getIntegrationsStatus(),
      ]);
      setStats(sRes.stats);
      setOrders(oRes.orders);
      setCustomers(cRes.customers);
      setIntegrations(iRes);
    } catch {
      // handled gracefully
    }
  };

  useEffect(() => {
    refreshAdminData();
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <ShieldAlert className="w-12 h-12 text-[#B38B45] mx-auto" />
        <h1 className="font-editorial text-3xl font-semibold text-[#111111]">
          Panel Privado de Administración
        </h1>
        <p className="text-sm text-[#5C5852]">
          Esta sección requiere credenciales de administrador verificadas para gestionar catálogo, precios, inventario, pedidos y clientes.
        </p>
        <button
          type="button"
          onClick={onGoToAccount}
          className="bg-[#111111] text-white px-7 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Iniciar sesión como administrador
        </button>
      </div>
    );
  }

  const openNewProductModal = () => {
    setEditingProduct(null);
    setPName('');
    setPDept('Mujer');
    setPCat(DEPARTMENT_CATEGORIES.Mujer[0]);
    setPBrand('Urban Style Atelier');
    setPPrice('189900');
    setPPrevPrice('');
    setPDesc('');
    setPMaterial('100% Algodón Orgánico');
    setPSizesText('XS,S,M,L');
    setPColorsText('Negro:#141414,Beige:#D6C6B2');
    setPImages(['/src/assets/images/mujer_camiseta_beige_1794878546016.jpg']);
    setPStockMatrix({
      XS: { Negro: 6, Beige: 6 },
      S: { Negro: 8, Beige: 8 },
      M: { Negro: 10, Beige: 10 },
      L: { Negro: 6, Beige: 6 },
    });
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPDept(prod.department);
    setPCat(prod.category);
    setPBrand(prod.brand);
    setPPrice(String(prod.price));
    setPPrevPrice(prod.previousPrice ? String(prod.previousPrice) : '');
    setPDesc(prod.description);
    setPMaterial(prod.material);
    setPSizesText(prod.sizes.join(','));
    setPColorsText(prod.colors.map((c) => `${c.name}:${c.hex}`).join(','));
    setPImages(prod.images);
    setPStockMatrix(structuredClone(prod.stockByVariant));
    setProductModalOpen(true);
  };

  const parsedSizes = pSizesText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedColors = pColorsText
    .split(',')
    .map((entry) => {
      const [name, hex] = entry.split(':').map((x) => x.trim());
      return name ? { name, hex: hex || '#141414' } : null;
    })
    .filter((x): x is { name: string; hex: string } => Boolean(x));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await storeApi.uploadImage(String(reader.result), file.name.split('.')[0]);
        setPImages((prev) => [res.url, ...prev]);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const nextStock: Record<string, Record<string, number>> = {};
      for (const sz of parsedSizes) {
        nextStock[sz] = {};
        for (const col of parsedColors) {
          nextStock[sz][col.name] = Number(pStockMatrix?.[sz]?.[col.name] ?? 5);
        }
      }

      const payload: Partial<Product> = {
        name: pName,
        department: pDept,
        category: pCat,
        brand: pBrand,
        price: Number(pPrice),
        previousPrice: pPrevPrice ? Number(pPrevPrice) : undefined,
        description: pDesc,
        material: pMaterial,
        sizes: parsedSizes,
        colors: parsedColors,
        images: pImages,
        stockByVariant: nextStock,
      };

      if (editingProduct) {
        await storeApi.updateProduct(editingProduct.id, payload);
      } else {
        await storeApi.createProduct(payload);
      }
      await onProductsChanged();
      await refreshAdminData();
      setProductModalOpen(false);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await storeApi.deleteProduct(id);
    await onProductsChanged();
    await refreshAdminData();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await storeApi.updateOrderStatus(orderId, status);
    await onProductsChanged(res.products);
    await refreshAdminData();
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCode.trim()) return;
    await storeApi.createCoupon({
      code: cCode.trim().toUpperCase(),
      description: cDesc.trim() || `Descuento especial ${cCode.trim().toUpperCase()}`,
      type: cType,
      value: Number(cValue),
      minOrderCop: Number(cMin),
      active: true,
    });
    setCCode('');
    setCDesc('');
    await onCouponsChanged();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2DDD5] pb-5">
        <div>
          <p className="text-xs font-medium text-[#936F31] uppercase tracking-[0.16em]">
            Administración Central
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#111111] mt-1">
            Panel de Control · URBAN STYLE
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F2EDE4] overflow-x-auto max-w-full">
          {[
            { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
            { id: 'products', label: `Catálogo (${products.length})`, icon: Plus },
            { id: 'orders', label: `Pedidos (${orders.length})`, icon: PackageCheck },
            { id: 'promos', label: `Cupones (${coupons.length})`, icon: Tag },
            { id: 'customers', label: `Clientes (${customers.length})`, icon: Users },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === t.id ? 'bg-[#111111] text-white' : 'text-[#5C5852] hover:text-[#111111]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. DASHBOARD ESTADÍSTICAS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2DDD5] p-5 space-y-1">
              <p className="text-xs text-[#5C5852]">Ventas Totales</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111111]">
                {formatCOP(stats.totalSales)}
              </p>
            </div>
            <div className="bg-white border border-[#E2DDD5] p-5 space-y-1">
              <p className="text-xs text-[#5C5852]">Ingresos del Día</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#936F31]">
                {formatCOP(stats.todayRevenue)}
              </p>
            </div>
            <div className="bg-white border border-[#E2DDD5] p-5 space-y-1">
              <p className="text-xs text-[#5C5852]">Cantidad de Pedidos</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111111]">
                {stats.orderCount}
              </p>
            </div>
            <div className="bg-white border border-[#E2DDD5] p-5 space-y-1">
              <p className="text-xs text-[#5C5852]">Productos Vendidos</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111111]">
                {stats.productsSold} uds.
              </p>
            </div>
            <div className="bg-white border border-[#E2DDD5] p-5 space-y-1">
              <p className="text-xs text-[#5C5852]">Productos Agotados</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111111]">
                {stats.outOfStockProducts}
              </p>
            </div>
            <div className="bg-white border border-[#E2DDD5] p-5 space-y-1">
              <p className="text-xs text-[#5C5852]">Clientes Registrados</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#111111]">
                {stats.registeredCustomers}
              </p>
            </div>
            <div className="sm:col-span-2 bg-[#FAF8F5] border border-[#E2DDD5] p-5 space-y-1">
              <p className="text-xs font-semibold text-[#111111]">Estado de Pasarelas de Pago Colombia</p>
              <p className="text-xs text-[#5C5852]">
                Wompi: {integrations?.wompiConfigured ? 'Conectado' : 'Modo Demostración (Configurar WOMPI_PUBLIC_KEY en .env)'} · Mercado Pago:{' '}
                {integrations?.mercadoPagoConfigured ? 'Conectado' : 'Modo Demostración (Configurar MERCADOPAGO_ACCESS_TOKEN en .env)'}
              </p>
            </div>
          </div>

          {/* Top Selling Table */}
          <div className="bg-white border border-[#E2DDD5] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2DDD5] bg-[#FAF8F5]">
              <h2 className="font-editorial text-xl font-semibold text-[#111111]">
                Productos Más Vendidos
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E2DDD5] text-[#5C5852]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">SKU</th>
                    <th className="py-3 px-4 font-semibold">Prenda</th>
                    <th className="py-3 px-4 font-semibold">Depto.</th>
                    <th className="py-3 px-4 font-semibold text-right">Vendidas</th>
                    <th className="py-3 px-4 font-semibold text-right">Ingresos</th>
                    <th className="py-3 px-4 font-semibold text-right">Inventario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]/70 tabular-nums">
                  {stats.topSellingProducts.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4 font-mono">{row.sku}</td>
                      <td className="py-3 px-4 font-semibold text-[#111111]">{row.name}</td>
                      <td className="py-3 px-4 text-[#5C5852]">{row.department}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.soldCount}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCOP(row.revenue)}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.stock} uds.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. GESTIÓN DE PRODUCTOS E INVENTARIO */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#5C5852]">
              Administra precios, tallas, colores, fotografías e inventario por variante.
            </p>
            <button
              type="button"
              onClick={openNewProductModal}
              className="bg-[#111111] text-white px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#2A2A2A] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear producto</span>
            </button>
          </div>

          <div className="bg-white border border-[#E2DDD5] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2DDD5] bg-[#FAF8F5] text-[#5C5852]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Prenda</th>
                  <th className="py-3 px-4 font-semibold">Categoría</th>
                  <th className="py-3 px-4 font-semibold text-right">Precio COP</th>
                  <th className="py-3 px-4 font-semibold text-right">Stock Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5]/70 tabular-nums">
                {products.map((p) => {
                  const total = getTotalProductStock(p);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-[#F2EDE4] shrink-0 overflow-hidden">
                            <SafeImage src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#111111]">{p.name}</p>
                            <p className="text-[11px] font-mono text-[#5C5852]">{p.sku} · {p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#5C5852]">
                        {p.department} / {p.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#111111]">
                        {formatCOP(p.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={total === 0 ? 'text-red-700 font-bold' : ''}>{total} uds.</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 border border-[#E2DDD5] hover:border-[#111111] cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 border border-[#E2DDD5] hover:border-red-700 hover:text-red-700 cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. GESTIÓN DE PEDIDOS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-white border border-[#E2DDD5] p-5 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-[#111111]">{ord.orderNumber}</span>
                    <span className="text-xs font-semibold text-[#936F31]">{ord.status}</span>
                  </div>
                  <p className="text-xs text-[#5C5852] mt-0.5">
                    {ord.customer.name} ({ord.customer.email}) · {ord.shippingAddress.city},{' '}
                    {ord.shippingAddress.department} · {ord.paymentMethod}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold tabular-nums">{formatCOP(ord.total)}</span>
                  <select
                    aria-label={`Cambiar estado del pedido ${ord.orderNumber}`}
                    value={ord.status}
                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                    className="border border-[#111111] bg-[#FAF8F5] px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    {ALL_ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-xs text-[#5C5852] border-t border-[#E2DDD5]/70 pt-2">
                {ord.items.map((it) => `${it.quantity}x ${it.productName} (${it.size}/${it.color})`).join(' · ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. PROMOCIONES Y CUPONES */}
      {activeTab === 'promos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-[#E2DDD5] p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-mono text-sm font-bold text-[#111111]">
                    {c.code} · {c.type === 'percentage' ? `${c.value}%` : formatCOP(c.value)}
                  </p>
                  <p className="text-xs text-[#5C5852]">{c.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await storeApi.toggleCoupon(c.id, !c.active);
                      await onCouponsChanged();
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                      c.active
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#FAF8F5] text-[#5C5852] border-[#E2DDD5]'
                    }`}
                  >
                    {c.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await storeApi.deleteCoupon(c.id);
                      await onCouponsChanged();
                    }}
                    className="p-1.5 text-[#5C5852] hover:text-red-700 cursor-pointer"
                    aria-label="Eliminar cupón"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateCoupon} className="lg:col-span-5 bg-white border border-[#E2DDD5] p-5 space-y-3">
            <h3 className="font-semibold text-sm text-[#111111]">Crear Cupón Promocional</h3>
            <input
              type="text"
              required
              value={cCode}
              onChange={(e) => setCCode(e.target.value)}
              placeholder="Código (ej: MODA20)"
              className="w-full border border-[#E2DDD5] px-3 py-2 text-xs uppercase font-mono"
            />
            <input
              type="text"
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              placeholder="Descripción breve"
              className="w-full border border-[#E2DDD5] px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={cType}
                onChange={(e) => setCType(e.target.value as 'percentage' | 'fixed')}
                className="border border-[#E2DDD5] px-3 py-2 text-xs bg-white"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo (COP)</option>
              </select>
              <input
                type="number"
                required
                value={cValue}
                onChange={(e) => setCValue(e.target.value)}
                placeholder="Valor"
                className="border border-[#E2DDD5] px-3 py-2 text-xs font-mono"
              />
            </div>
            <input
              type="number"
              value={cMin}
              onChange={(e) => setCMin(e.target.value)}
              placeholder="Compra mínima (COP)"
              className="w-full border border-[#E2DDD5] px-3 py-2 text-xs font-mono"
            />
            <button
              type="submit"
              className="w-full bg-[#111111] text-white py-2.5 text-xs font-semibold cursor-pointer"
            >
              Crear cupón
            </button>
          </form>
        </div>
      )}

      {/* 5. CLIENTES REGISTRADOS */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-[#E2DDD5] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2DDD5] bg-[#FAF8F5] text-[#5C5852]">
              <tr>
                <th className="py-3 px-4 font-semibold">Cliente</th>
                <th className="py-3 px-4 font-semibold">Correo</th>
                <th className="py-3 px-4 font-semibold">Teléfono</th>
                <th className="py-3 px-4 font-semibold text-right">Pedidos</th>
                <th className="py-3 px-4 font-semibold text-right">Total Comprado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD5]/70 tabular-nums">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4 font-semibold text-[#111111]">{c.name}</td>
                  <td className="py-3 px-4 text-[#5C5852]">{c.email}</td>
                  <td className="py-3 px-4 font-mono">{c.phone || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono">{c.orderCount}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">{formatCOP(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PRODUCT CREATE / EDIT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD5] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
              <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
                {editingProduct ? `Editar: ${editingProduct.name}` : 'Nueva Prenda en Catálogo'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 text-[#5C5852] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-[#111111]">Nombre de la prenda *</label>
                  <input
                    type="text"
                    required
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#111111]">Departamento</label>
                  <select
                    value={pDept}
                    onChange={(e) => {
                      const d = e.target.value as Department;
                      setPDept(d);
                      setPCat(DEPARTMENT_CATEGORIES[d][0]);
                    }}
                    className="w-full border border-[#E2DDD5] px-3 py-2 bg-white"
                  >
                    {(['Mujer', 'Hombre', 'Niños', 'Accesorios'] as const).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#111111]">Categoría</label>
                  <select
                    value={pCat}
                    onChange={(e) => setPCat(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2 bg-white"
                  >
                    {DEPARTMENT_CATEGORIES[pDept].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#111111]">Precio actual (COP) *</label>
                  <input
                    type="number"
                    required
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#111111]">Precio anterior (opcional)</label>
                  <input
                    type="number"
                    value={pPrevPrice}
                    onChange={(e) => setPPrevPrice(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#111111]">Marca</label>
                  <input
                    type="text"
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#111111]">Material</label>
                  <input
                    type="text"
                    value={pMaterial}
                    onChange={(e) => setPMaterial(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-[#111111]">Descripción</label>
                  <textarea
                    rows={2}
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#111111]">Tallas (separadas por coma)</label>
                  <input
                    type="text"
                    value={pSizesText}
                    onChange={(e) => setPSizesText(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#111111]">Colores (Nombre:#HEX)</label>
                  <input
                    type="text"
                    value={pColorsText}
                    onChange={(e) => setPColorsText(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2 font-mono"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2 border-t border-[#E2DDD5] pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#111111]">Fotografías de la prenda</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2EDE4] border border-[#E2DDD5] font-semibold cursor-pointer hover:bg-[#E5DDD0]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Subiendo...' : 'Subir fotografía'}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pImages.map((img, i) => (
                    <div key={i} className="relative w-16 h-20 bg-[#F2EDE4] border border-[#E2DDD5]">
                      <SafeImage src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Variant Inventory Matrix */}
              <div className="space-y-2 border-t border-[#E2DDD5] pt-3">
                <span className="font-semibold text-[#111111]">Inventario por Talla y Color</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-[#E2DDD5]">
                    <thead className="bg-[#FAF8F5] border-b border-[#E2DDD5]">
                      <tr>
                        <th className="p-2">Talla</th>
                        {parsedColors.map((c) => (
                          <th key={c.name} className="p-2">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedSizes.map((sz) => (
                        <tr key={sz} className="border-b border-[#E2DDD5]/60">
                          <td className="p-2 font-semibold">{sz}</td>
                          {parsedColors.map((c) => (
                            <td key={c.name} className="p-2">
                              <input
                                type="number"
                                min={0}
                                value={pStockMatrix?.[sz]?.[c.name] ?? 5}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  setPStockMatrix((prev) => ({
                                    ...prev,
                                    [sz]: { ...(prev[sz] || {}), [c.name]: val },
                                  }));
                                }}
                                className="w-16 border border-[#E2DDD5] px-2 py-1 font-mono"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-5 py-2.5 border border-[#E2DDD5] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 py-2.5 bg-[#111111] text-white font-semibold cursor-pointer"
                >
                  {savingProduct ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
