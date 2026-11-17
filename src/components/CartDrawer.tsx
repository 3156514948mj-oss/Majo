import { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import type { CartItem, Coupon, Product } from '../types/store';
import { formatCOP, getVariantStock } from '../utils/format';
import { SafeImage } from './SafeImage';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  products: Product[];
  appliedCoupon: { coupon: Coupon; discount: number } | null;
  onUpdateItemVariant: (
    index: number,
    next: { size?: string; color?: string; quantity?: number },
  ) => void;
  onRemoveItem: (index: number) => void;
  onApplyCoupon: (code: string) => Promise<string | null>;
  onRemoveCoupon: () => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  onClose,
  items,
  products,
  appliedCoupon,
  onUpdateItemVariant,
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon,
  onProceedToCheckout,
}: CartDrawerProps) {
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  if (!open) return null;

  const enriched = items
    .map((item, index) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const avail = getVariantStock(product, item.size, item.color);
      return { item, index, product, avail };
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
  const netTotal = Math.max(0, baseAfterQty - couponDiscount);
  const shippingCost = enriched.length === 0 ? 0 : netTotal >= 250000 ? 0 : 14900;
  const finalTotal = netTotal + shippingCost;

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    const err = await onApplyCoupon(couponInput.trim());
    setCouponLoading(false);
    if (err) {
      setCouponMsg(err);
    } else {
      setCouponInput('');
      setCouponMsg(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs">
      <aside
        className="w-full max-w-md bg-[#FAF8F5] h-full flex flex-col border-l border-[#E2DDD5] shadow-2xl"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E2DDD5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#111111]" />
            <h2 className="font-editorial text-xl font-semibold text-[#111111]">
              Tu Bolsa ({totalUnits})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5C5852] hover:text-[#111111] cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress */}
        {enriched.length > 0 && (
          <div className="px-6 py-2.5 bg-[#F2EDE4] border-b border-[#E2DDD5] text-xs text-[#111111]">
            {netTotal >= 250000 ? (
              <span>Envío nacional estándar incluido sin costo.</span>
            ) : (
              <span>
                Te faltan{' '}
                <strong className="font-mono tabular-nums">{formatCOP(250000 - netTotal)}</strong>{' '}
                para obtener envío gratis.
              </span>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {enriched.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <ShoppingBag className="w-10 h-10 text-[#C5A059] stroke-[1.4]" />
              <p className="font-editorial text-xl text-[#111111]">Tu carrito está vacío</p>
              <p className="text-xs text-[#5C5852] max-w-xs">
                Explora nuestras colecciones para mujer, hombre, niños y accesorios para comenzar tu pedido.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#111111] text-white px-6 py-2.5 text-xs font-semibold cursor-pointer"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            enriched.map(({ item, index, product, avail }) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}-${index}`}
                className="bg-white border border-[#E2DDD5] p-3.5 flex gap-3.5"
              >
                <div className="w-20 h-24 bg-[#F2EDE4] shrink-0 overflow-hidden">
                  <SafeImage
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#111111] truncate">{product.name}</p>
                      <p className="text-xs font-mono font-semibold text-[#111111] tabular-nums mt-0.5">
                        {formatCOP(product.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      className="p-1 text-[#5C5852] hover:text-red-700 cursor-pointer"
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Direct Size & Color Switchers inside Cart */}
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      aria-label="Cambiar talla"
                      value={item.size}
                      onChange={(e) => onUpdateItemVariant(index, { size: e.target.value })}
                      className="bg-[#FAF8F5] border border-[#E2DDD5] px-2 py-1 text-[11px] font-medium focus:outline-none focus:border-[#111111]"
                    >
                      {product.sizes.map((sz) => {
                        const szStock = getVariantStock(product, sz, item.color);
                        return (
                          <option key={sz} value={sz} disabled={szStock === 0}>
                            Talla {sz} {szStock === 0 ? '(Agotado)' : ''}
                          </option>
                        );
                      })}
                    </select>

                    <select
                      aria-label="Cambiar color"
                      value={item.color}
                      onChange={(e) => onUpdateItemVariant(index, { color: e.target.value })}
                      className="bg-[#FAF8F5] border border-[#E2DDD5] px-2 py-1 text-[11px] font-medium focus:outline-none focus:border-[#111111]"
                    >
                      {product.colors.map((c) => {
                        const colStock = getVariantStock(product, item.size, c.name);
                        return (
                          <option key={c.name} value={c.name} disabled={colStock === 0}>
                            {c.name} {colStock === 0 ? '(Agotado)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center border border-[#E2DDD5]">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateItemVariant(index, { quantity: Math.max(1, item.quantity - 1) })
                        }
                        className="px-2 py-1 text-[#111111] cursor-pointer"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-mono tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateItemVariant(index, {
                            quantity: Math.min(avail, item.quantity + 1),
                          })
                        }
                        disabled={item.quantity >= avail}
                        className="px-2 py-1 text-[#111111] disabled:opacity-40 cursor-pointer"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-mono font-bold tabular-nums text-[#111111]">
                      {formatCOP(product.price * item.quantity)}
                    </span>
                  </div>

                  {avail < item.quantity && (
                    <p className="text-[11px] text-red-700">
                      Solo quedan {avail} unidades disponibles en esta combinación.
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Coupon Footer */}
        {enriched.length > 0 && (
          <div className="bg-white border-t border-[#E2DDD5] p-6 space-y-4">
            {/* Coupon Box */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-[#FAF8F5] border border-[#C5A059] px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-[#111111]">
                  <Tag className="w-3.5 h-3.5 text-[#B38B45]" />
                  Cupón {appliedCoupon.coupon.code} aplicado
                </span>
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  className="text-xs text-[#5C5852] hover:text-red-700 underline cursor-pointer"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCouponSubmit} className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Código de cupón (ej: URBAN15)"
                    className="flex-1 border border-[#E2DDD5] px-3 py-2 text-xs uppercase font-mono focus:outline-none focus:border-[#111111]"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="px-4 py-2 bg-[#F2EDE4] border border-[#E2DDD5] text-xs font-semibold text-[#111111] hover:bg-[#E5DDD0] transition-colors cursor-pointer"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponMsg && <p className="text-[11px] text-red-700">{couponMsg}</p>}
              </form>
            )}

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs border-t border-[#E2DDD5] pt-3">
              <div className="flex justify-between text-[#5C5852]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatCOP(subtotal)}</span>
              </div>
              {quantityDiscount > 0 && (
                <div className="flex justify-between text-[#936F31] font-medium">
                  <span>Descuento por cantidad (3+ prendas · 10%)</span>
                  <span className="font-mono tabular-nums">-{formatCOP(quantityDiscount)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-[#936F31] font-medium">
                  <span>Cupón ({appliedCoupon?.coupon.code})</span>
                  <span className="font-mono tabular-nums">-{formatCOP(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5C5852]">
                <span>Envío estimado</span>
                <span className="font-mono tabular-nums">
                  {shippingCost === 0 ? 'Gratis' : formatCOP(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#111111] pt-2 border-t border-[#E2DDD5]">
                <span>Total estimado</span>
                <span className="font-mono tabular-nums">{formatCOP(finalTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full bg-[#111111] text-white py-3.5 px-5 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            >
              <span>Finalizar compra</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
