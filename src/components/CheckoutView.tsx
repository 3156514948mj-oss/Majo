import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Info,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react';
import type {
  CartItem,
  Coupon,
  Order,
  PaymentMethod,
  Product,
  ShippingCarrier,
  UserProfile,
} from '../types/store';
import { COLOMBIA_DEPARTMENTS, SHIPPING_CARRIERS, formatCOP } from '../utils/format';
import { SafeImage } from './SafeImage';

interface CheckoutViewProps {
  items: CartItem[];
  products: Product[];
  user: UserProfile | null;
  appliedCoupon: { coupon: Coupon; discount: number } | null;
  onBackToStore: () => void;
  onPlaceOrder: (payload: {
    items: CartItem[];
    customer: Order['customer'];
    shippingAddress: Order['shippingAddress'];
    carrier: ShippingCarrier;
    paymentMethod: PaymentMethod;
    couponCode?: string;
  }) => Promise<Order>;
  onTrackOrder: (orderNumber: string) => void;
}

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  title: string;
  desc: string;
  gateway: string;
}> = [
  { id: 'Nequi', title: 'Nequi', desc: 'Notificación push o QR directo desde tu celular', gateway: 'Wompi / Nequi Ready' },
  { id: 'Daviplata', title: 'Daviplata', desc: 'Pago inmediato con número Daviplata y clave temporal', gateway: 'Wompi Ready' },
  { id: 'PSE', title: 'PSE (Débito Bancario)', desc: 'Transferencia segura desde Bancolombia, Davivienda, BBVA y más', gateway: 'Wompi / Mercado Pago' },
  { id: 'Tarjeta Débito', title: 'Tarjeta Débito', desc: 'Visa Débito / Mastercard Débito con código CVV', gateway: 'Wompi / Mercado Pago' },
  { id: 'Tarjeta Crédito', title: 'Tarjeta de Crédito', desc: 'Hasta 12 cuotas con Visa, Mastercard, Amex o Diners', gateway: 'Wompi / Mercado Pago' },
  { id: 'Transferencia Bancaria', title: 'Transferencia Bancaria', desc: 'Cuenta corriente / ahorros Bancolombia o Davivienda', gateway: 'Verificación manual' },
  { id: 'Pago Contra Entrega', title: 'Pago Contra Entrega', desc: 'Paga en efectivo o datáfono al recibir tu paquete', gateway: 'Cobertura nacional' },
];

export function CheckoutView({
  items,
  products,
  user,
  appliedCoupon,
  onBackToStore,
  onPlaceOrder,
  onTrackOrder,
}: CheckoutViewProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const defaultAddr = user?.addresses.find((a) => a.isDefault) || user?.addresses[0];

  const [customer, setCustomer] = useState<Order['customer']>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    documentId: user?.documentId || '',
  });

  const [address, setAddress] = useState<Order['shippingAddress']>({
    department: defaultAddr?.department || 'Bogotá D.C.',
    city: defaultAddr?.city || 'Bogotá',
    street: defaultAddr?.street || '',
    neighborhood: defaultAddr?.neighborhood || '',
    notes: defaultAddr?.notes || '',
  });

  const [carrier, setCarrier] = useState<ShippingCarrier>('Servientrega Estándar');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Nequi');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const enriched = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { item, product } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const totalUnits = enriched.reduce((sum, x) => sum + x.item.quantity, 0);
  const subtotal = enriched.reduce((sum, x) => sum + x.product.price * x.item.quantity, 0);
  const quantityDiscount = totalUnits >= 3 ? Math.round(subtotal * 0.1) : 0;
  const baseAfterQty = Math.max(0, subtotal - quantityDiscount);
  const couponDiscount = appliedCoupon
    ? appliedCoupon.coupon.type === 'percentage'
      ? Math.round((baseAfterQty * appliedCoupon.coupon.value) / 100)
      : Math.min(baseAfterQty, appliedCoupon.coupon.value)
    : 0;
  const netMerchandise = Math.max(0, baseAfterQty - couponDiscount);
  const selectedCarrierObj = SHIPPING_CARRIERS.find((c) => c.name === carrier) || SHIPPING_CARRIERS[0];
  const shippingCost =
    selectedCarrierObj.cost === 0 || netMerchandise >= selectedCarrierObj.freeThreshold
      ? 0
      : selectedCarrierObj.cost;
  const total = netMerchandise + shippingCost;

  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-[#E2DDD5] p-8 sm:p-10 space-y-6">
          <div className="flex items-start gap-4 border-b border-[#E2DDD5] pb-6">
            <CheckCircle2 className="w-10 h-10 text-[#B38B45] shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#936F31]">
                Pedido Registrado Exitosamente
              </p>
              <h1 className="font-editorial text-3xl font-semibold text-[#111111]">
                Orden {confirmedOrder.orderNumber}
              </h1>
              <p className="text-sm text-[#5C5852]">
                Hemos guardado tu pedido y actualizado el inventario en tiempo real.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E2DDD5] p-4 text-xs text-[#5C5852] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#B38B45] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#111111]">
                Registro en Modo Demostración ({confirmedOrder.paymentMethod})
              </p>
              <p className="mt-0.5">
                Referencia de pasarela: <span className="font-mono">{confirmedOrder.paymentGatewayRef}</span>. No se realizó ningún cobro bancario real; la arquitectura está preparada para conectar Wompi o Mercado Pago en producción.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-[#E2DDD5] p-4 space-y-1">
              <p className="font-semibold text-[#111111]">Envío y Transportadora</p>
              <p className="text-[#5C5852]">{confirmedOrder.carrier}</p>
              <p className="text-[#5C5852]">
                {confirmedOrder.shippingAddress.street}, {confirmedOrder.shippingAddress.neighborhood}
              </p>
              <p className="text-[#5C5852]">
                {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.department}
              </p>
            </div>
            <div className="border border-[#E2DDD5] p-4 space-y-1">
              <p className="font-semibold text-[#111111]">Resumen de Pago</p>
              <p className="text-[#5C5852]">Método: {confirmedOrder.paymentMethod}</p>
              <p className="text-[#5C5852]">Estado: {confirmedOrder.status}</p>
              <p className="text-sm font-bold font-mono tabular-nums text-[#111111] pt-1">
                Total: {formatCOP(confirmedOrder.total)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onTrackOrder(confirmedOrder.orderNumber)}
              className="bg-[#111111] text-white px-6 py-3 text-xs font-semibold hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            >
              Seguir estado del pedido
            </button>
            <button
              type="button"
              onClick={onBackToStore}
              className="border border-[#111111] text-[#111111] px-6 py-3 text-xs font-semibold hover:bg-[#F2EDE4] transition-colors cursor-pointer"
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (enriched.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-editorial text-3xl text-[#111111]">No hay productos para finalizar compra</h1>
        <button
          type="button"
          onClick={onBackToStore}
          className="bg-[#111111] text-white px-6 py-3 text-xs font-semibold cursor-pointer"
        >
          Explorar catálogo
        </button>
      </div>
    );
  }

  const stepsMeta = [
    { num: 1, label: 'Carrito', icon: Package },
    { num: 2, label: 'Comprador', icon: User },
    { num: 3, label: 'Dirección', icon: MapPin },
    { num: 4, label: 'Envío', icon: Truck },
    { num: 5, label: 'Pago', icon: CreditCard },
    { num: 6, label: 'Confirmar', icon: ShieldCheck },
  ] as const;

  const validateAndNext = () => {
    setErrorMsg('');
    if (step === 2) {
      if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim()) {
        setErrorMsg('Completa tu nombre, correo electrónico y celular de contacto.');
        return;
      }
    }
    if (step === 3) {
      if (!address.city.trim() || !address.street.trim()) {
        setErrorMsg('Ingresa la ciudad y dirección exacta de entrega.');
        return;
      }
    }
    setStep((s) => (s < 6 ? ((s + 1) as typeof step) : s));
  };

  const handleConfirmOrder = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const order = await onPlaceOrder({
        items,
        customer,
        shippingAddress: address,
        carrier,
        paymentMethod,
        couponCode: appliedCoupon?.coupon.code,
      });
      setConfirmedOrder(order);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-4">
        <div>
          <p className="text-xs text-[#936F31] uppercase tracking-[0.16em]">Proceso de Compra</p>
          <h1 className="font-editorial text-3xl font-semibold text-[#111111] mt-1">
            Finalizar Pedido
          </h1>
        </div>
        <button
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C5852] hover:text-[#111111] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Seguir comprando</span>
        </button>
      </div>

      {/* 6-Step Progress Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {stepsMeta.map((s) => {
          const Icon = s.icon;
          const active = step === s.num;
          const completed = step > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < step) setStep(s.num);
              }}
              className={`p-3 border text-left transition-colors ${
                active
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : completed
                    ? 'bg-[#F2EDE4] text-[#111111] border-[#C5A059] cursor-pointer'
                    : 'bg-white text-[#5C5852] border-[#E2DDD5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tabular-nums">0{s.num}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-semibold mt-1 truncate">{s.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step Content Left */}
        <div className="lg:col-span-8 bg-white border border-[#E2DDD5] p-6 sm:p-8 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
                1. Revisar Carrito
              </h2>
              <div className="divide-y divide-[#E2DDD5]">
                {enriched.map(({ item, product }) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="py-3.5 flex items-center gap-4">
                    <div className="w-16 h-20 bg-[#F2EDE4] shrink-0 overflow-hidden">
                      <SafeImage src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111111] truncate">{product.name}</p>
                      <p className="text-xs text-[#5C5852]">
                        Talla {item.size} · Color {item.color} · Cantidad {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-mono font-semibold tabular-nums text-[#111111]">
                      {formatCOP(product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
                2. Datos del Comprador
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Nombre completo *</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="Ej: Camila Martínez"
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Correo electrónico *</label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Celular / WhatsApp *</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="3156514948"
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Cédula o NIT</label>
                  <input
                    type="text"
                    value={customer.documentId}
                    onChange={(e) => setCustomer({ ...customer, documentId: e.target.value })}
                    placeholder="1020304050"
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
                3. Dirección de Entrega
              </h2>

              {user && user.addresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#5C5852]">Direcciones guardadas en tu cuenta:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {user.addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() =>
                          setAddress({
                            department: addr.department,
                            city: addr.city,
                            street: addr.street,
                            neighborhood: addr.neighborhood,
                            notes: addr.notes || '',
                          })
                        }
                        className="p-3 border border-[#E2DDD5] hover:border-[#111111] text-left text-xs bg-[#FAF8F5] cursor-pointer"
                      >
                        <p className="font-semibold text-[#111111]">{addr.label}</p>
                        <p className="text-[#5C5852] mt-0.5">{addr.street}</p>
                        <p className="text-[#5C5852]">
                          {addr.city}, {addr.department}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Departamento *</label>
                  <select
                    value={address.department}
                    onChange={(e) => setAddress({ ...address, department: e.target.value })}
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#111111]"
                  >
                    {COLOMBIA_DEPARTMENTS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Ciudad / Municipio *</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="Bogotá / Medellín / Cali"
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#111111]">Dirección completa *</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="Calle / Carrera / Apto / Casa"
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Barrio</label>
                  <input
                    type="text"
                    value={address.neighborhood}
                    onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                    placeholder="Ej: El Poblado / Chapinero"
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Indicaciones de entrega</label>
                  <input
                    type="text"
                    value={address.notes || ''}
                    onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                    placeholder="Dejar en portería, timbre 302..."
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
                4. Seleccionar Transportadora o Envío
              </h2>
              <div className="space-y-3">
                {SHIPPING_CARRIERS.map((c) => {
                  const isFree = c.cost === 0 || netMerchandise >= c.freeThreshold;
                  return (
                    <label
                      key={c.name}
                      className={`flex items-center justify-between gap-4 p-4 border cursor-pointer transition-colors ${
                        carrier === c.name
                          ? 'border-[#111111] bg-[#FAF8F5]'
                          : 'border-[#E2DDD5] hover:border-[#111111]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="carrier"
                          checked={carrier === c.name}
                          onChange={() => setCarrier(c.name)}
                          className="mt-1 accent-[#111111]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#111111]">{c.name}</p>
                          <p className="text-xs text-[#5C5852]">{c.eta}</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-semibold tabular-nums text-[#111111]">
                        {isFree ? 'Gratis' : formatCOP(c.cost)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
                5. Método de Pago en Colombia
              </h2>

              <div className="bg-[#FAF8F5] border border-[#C5A059]/60 p-3.5 text-xs text-[#5C5852] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#B38B45] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#111111]">Modo Demostración Activo:</strong> Al confirmar tu pedido se registrará la orden con el método seleccionado sin realizar cargos bancarios reales. La tienda cuenta con adaptadores listos para credenciales de <strong>Wompi</strong> y <strong>Mercado Pago</strong>.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`p-4 border cursor-pointer transition-colors flex items-start gap-3 ${
                      paymentMethod === opt.id
                        ? 'border-[#111111] bg-[#FAF8F5]'
                        : 'border-[#E2DDD5] hover:border-[#111111]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === opt.id}
                      onChange={() => setPaymentMethod(opt.id)}
                      className="mt-1 accent-[#111111]"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#111111]">{opt.title}</p>
                      <p className="text-xs text-[#5C5852] leading-snug">{opt.desc}</p>
                      <p className="text-[11px] font-mono text-[#936F31]">{opt.gateway}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
                6. Confirmar Pedido
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="border border-[#E2DDD5] p-4 space-y-1 bg-[#FAF8F5]">
                  <p className="font-semibold text-[#111111]">Comprador</p>
                  <p>{customer.name}</p>
                  <p>{customer.email}</p>
                  <p>Tel: {customer.phone}</p>
                  {customer.documentId && <p>Doc: {customer.documentId}</p>}
                </div>
                <div className="border border-[#E2DDD5] p-4 space-y-1 bg-[#FAF8F5]">
                  <p className="font-semibold text-[#111111]">Entrega y Pago</p>
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.department}
                  </p>
                  <p>Transportadora: {carrier}</p>
                  <p>Método de pago: {paymentMethod} (Modo Demostración)</p>
                </div>
              </div>

              <div className="border-t border-[#E2DDD5] pt-4 space-y-2 text-xs">
                {enriched.map(({ item, product }) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between">
                    <span>
                      {item.quantity}x {product.name} ({item.size} · {item.color})
                    </span>
                    <span className="font-mono tabular-nums">{formatCOP(product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 p-3">
              {errorMsg}
            </p>
          )}

          {/* Step Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2DDD5]">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep((s) => (s - 1) as typeof step) : onBackToStore())}
              className="px-5 py-2.5 border border-[#E2DDD5] text-xs font-semibold text-[#111111] hover:border-[#111111] transition-colors cursor-pointer"
            >
              {step === 1 ? 'Volver' : 'Paso anterior'}
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={validateAndNext}
                className="bg-[#111111] text-white px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmOrder}
                className="bg-[#C5A059] text-[#111111] px-7 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#B38B45] transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Confirmando pedido...' : 'Confirmar pedido ahora'}
              </button>
            )}
          </div>
        </div>

        {/* Sticky Order Summary Right */}
        <aside className="lg:col-span-4 bg-white border border-[#E2DDD5] p-6 space-y-4 lg:sticky lg:top-24">
          <h3 className="font-editorial text-xl font-semibold text-[#111111] border-b border-[#E2DDD5] pb-3">
            Resumen de Compra
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#5C5852]">
              <span>Productos ({totalUnits})</span>
              <span className="font-mono tabular-nums">{formatCOP(subtotal)}</span>
            </div>
            {quantityDiscount > 0 && (
              <div className="flex justify-between text-[#936F31]">
                <span>Descuento 3+ prendas (10%)</span>
                <span className="font-mono tabular-nums">-{formatCOP(quantityDiscount)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-[#936F31]">
                <span>Cupón {appliedCoupon?.coupon.code}</span>
                <span className="font-mono tabular-nums">-{formatCOP(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#5C5852]">
              <span>Envío ({carrier})</span>
              <span className="font-mono tabular-nums">
                {shippingCost === 0 ? 'Gratis' : formatCOP(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#111111] pt-3 border-t border-[#E2DDD5]">
              <span>Total a pagar</span>
              <span className="font-mono tabular-nums">{formatCOP(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
