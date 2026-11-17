import { useEffect, useState } from 'react';
import { Check, PackageSearch, Search, XCircle } from 'lucide-react';
import type { Order } from '../types/store';
import { ORDER_STATUS_FLOW } from '../types/store';
import { formatCOP } from '../utils/format';
import { SafeImage } from './SafeImage';

interface OrderTrackingViewProps {
  initialOrderNumber?: string;
  onTrack: (orderNumber: string) => Promise<Order>;
}

export function OrderTrackingView({ initialOrderNumber = '', onTrack }: OrderTrackingViewProps) {
  const [query, setQuery] = useState(initialOrderNumber || 'US-2026-1001');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (codeToFind: string) => {
    if (!codeToFind.trim()) return;
    setLoading(true);
    setError('');
    try {
      const found = await onTrack(codeToFind.trim());
      setOrder(found);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'No encontramos ese pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const startCode = initialOrderNumber || 'US-2026-1001';
    setQuery(startCode);
    handleLookup(startCode);
  }, [initialOrderNumber]);

  const currentFlowIndex = order ? ORDER_STATUS_FLOW.indexOf(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#E2DDD5] pb-5 space-y-2">
        <p className="text-xs font-medium text-[#936F31] uppercase tracking-[0.16em]">
          Centro de Entregas
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#111111]">
          Seguimiento de Pedidos
        </h1>
        <p className="text-sm text-[#5C5852]">
          Consulta en tiempo real el estado de tu envío ingresando tu número de pedido (ej: <span className="font-mono text-[#111111]">US-2026-1001</span>, <span className="font-mono text-[#111111]">US-2026-1002</span> o <span className="font-mono text-[#111111]">US-2026-1003</span>).
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLookup(query);
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 flex items-center bg-white border border-[#E2DDD5] px-4 py-3">
          <PackageSearch className="w-5 h-5 text-[#B38B45] mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Número de pedido (ej: US-2026-1001)"
            className="w-full text-sm font-mono uppercase bg-transparent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#111111] text-white px-7 py-3 text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Buscando...' : 'Consultar estado'}</span>
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {order && (
        <div className="bg-white border border-[#E2DDD5] p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD5] pb-5">
            <div>
              <p className="text-xs text-[#5C5852]">Número de pedido</p>
              <h2 className="font-mono text-2xl font-bold text-[#111111]">{order.orderNumber}</h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-[#5C5852]">Estado actual</p>
              <p className="text-base font-semibold text-[#936F31]">{order.status}</p>
            </div>
          </div>

          {/* 7-State Visual Progress */}
          {order.status === 'Cancelado' ? (
            <div className="bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-red-800 text-sm">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>Este pedido fue cancelado y las unidades regresaron al inventario.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {ORDER_STATUS_FLOW.map((stepStatus, idx) => {
                const done = idx <= currentFlowIndex;
                return (
                  <div
                    key={stepStatus}
                    className={`p-3 border text-xs ${
                      done
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#FAF8F5] text-[#5C5852] border-[#E2DDD5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px]">0{idx + 1}</span>
                      {done && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                    </div>
                    <p className="font-semibold leading-snug">{stepStatus}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chronological Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5C5852]">
              Historial de Movimientos
            </h3>
            <div className="border-t border-[#E2DDD5] divide-y divide-[#E2DDD5]/70">
              {[...order.timeline].reverse().map((ev, i) => (
                <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div>
                    <span className="font-semibold text-[#111111]">{ev.status}</span>
                    <span className="text-[#5C5852]"> — {ev.note}</span>
                  </div>
                  <span className="font-mono text-[#5C5852] tabular-nums shrink-0">
                    {new Date(ev.timestamp).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Items & Delivery Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E2DDD5]">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5C5852]">
                Prendas del Pedido
              </h3>
              <div className="space-y-2.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#FAF8F5] p-2.5 border border-[#E2DDD5]">
                    <div className="w-12 h-14 bg-[#F2EDE4] shrink-0 overflow-hidden">
                      <SafeImage src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-semibold text-[#111111] truncate">{item.productName}</p>
                      <p className="text-[#5C5852]">
                        Talla {item.size} · {item.color} · Cant: {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-semibold tabular-nums">
                      {formatCOP(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs bg-[#FAF8F5] p-4 border border-[#E2DDD5]">
              <h3 className="font-semibold uppercase tracking-wider text-[#5C5852]">
                Información de Entrega y Pago
              </h3>
              <p><strong className="text-[#111111]">Destinatario:</strong> {order.customer.name}</p>
              <p>
                <strong className="text-[#111111]">Dirección:</strong> {order.shippingAddress.street},{' '}
                {order.shippingAddress.neighborhood}
              </p>
              <p>
                <strong className="text-[#111111]">Ciudad:</strong> {order.shippingAddress.city},{' '}
                {order.shippingAddress.department}
              </p>
              <p><strong className="text-[#111111]">Transportadora:</strong> {order.carrier}</p>
              <p>
                <strong className="text-[#111111]">Pago:</strong> {order.paymentMethod} (Ref: {order.paymentGatewayRef})
              </p>
              <p className="text-sm font-bold font-mono tabular-nums pt-2 border-t border-[#E2DDD5]">
                Total del pedido: {formatCOP(order.total)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
