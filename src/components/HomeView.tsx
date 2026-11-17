import { useState } from 'react';
import { ArrowRight, Check, Copy, MapPin, ShieldCheck, Star, Tag, Truck } from 'lucide-react';
import type { Coupon, Department, Product, ProductReview, Promotion } from '../types/store';
import { ProductGrid } from './ProductGrid';
import { SafeImage } from './SafeImage';

interface HomeViewProps {
  products: Product[];
  reviews: ProductReview[];
  coupons: Coupon[];
  promotions: Promotion[];
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  onExploreCatalog: (opts?: {
    department?: Department | 'Todos';
    onlyDiscounts?: boolean;
    brand?: string;
    collection?: string;
  }) => void;
  onApplyCouponDirect: (code: string) => void;
}

const FEATURED_COLLECTIONS: Array<{
  title: string;
  subtitle: string;
  department: Department;
  image: string;
}> = [
  {
    title: 'Mujer · Sastrería & Seda',
    subtitle: 'Blazers, vestidos midi y pantalones de pinzas',
    department: 'Mujer',
    image: '/src/assets/images/mujer_blazer_negro_1794878548961.jpg',
  },
  {
    title: 'Hombre · Urbano & Lino',
    subtitle: 'Camisas en lino lavado, bomber y cargo sastre',
    department: 'Hombre',
    image: '/src/assets/images/hombre_chaqueta_bomber_1794878551940.jpg',
  },
  {
    title: 'Niños · Algodón Orgánico',
    subtitle: 'Conjuntos suaves, chaquetas y tejidos hipoalergénicos',
    department: 'Niños',
    image: '/src/assets/images/ninos_conjunto_urbano_1794878552989.jpg',
  },
  {
    title: 'Accesorios · Cuero & Oro',
    subtitle: 'Bolsos en cuero colombiano, gafas y marroquinería',
    department: 'Accesorios',
    image: '/src/assets/images/acc_bolso_negro_oro_1794878554637.jpg',
  },
];

const BRANDS = [
  { name: 'Urban Style Atelier', origin: 'Sastrería Principal' },
  { name: 'Casa Aura', origin: 'Lino & Seda' },
  { name: 'Bogotá Street', origin: 'Urbano Técnico' },
  { name: 'Solis Denim', origin: 'Selvedge 13 oz' },
  { name: 'Studio 57', origin: 'Esenciales Diarios' },
  { name: 'Vértice Knit', origin: 'Punto & Deportivo' },
];

export function HomeView({
  products,
  reviews,
  coupons,
  promotions,
  favorites,
  onToggleFavorite,
  onOpenDetail,
  onAddToCart,
  onExploreCatalog,
  onApplyCouponDirect,
}: HomeViewProps) {
  const [showcaseTab, setShowcaseTab] = useState<'best' | 'new' | 'deals' | 'clearance'>('best');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showcaseProducts = (() => {
    switch (showcaseTab) {
      case 'new':
        return products.filter((p) => p.isNewArrival).slice(0, 8);
      case 'deals':
        return products.filter((p) => p.discountPercent > 0).slice(0, 8);
      case 'clearance':
        return products.filter((p) => p.isClearance).slice(0, 8);
      case 'best':
      default:
        return [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 8);
    }
  })();

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    onApplyCouponDirect(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="space-y-16 sm:space-y-20 pb-8">
      {/* 1. HERO BANNER */}
      <section className="relative w-full min-h-[540px] lg:min-h-[640px] bg-[#111111] overflow-hidden flex items-end lg:items-center">
        <img
          src="/src/assets/images/hero_urban_season_1794878545901.jpg"
          alt="Modelos vistiendo la colección de temporada URBAN STYLE"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20 lg:bg-gradient-to-r lg:from-black/85 lg:via-black/50 lg:to-transparent"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-xl space-y-5 text-white">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#C5A059]">
              Nueva Colección 2026 · Bogotá · Medellín · Cali
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] text-balance">
              Sastrería urbana en negro, arena y oro.
            </h1>
            <p className="text-sm sm:text-base text-[#E5DDD0] leading-relaxed max-w-md">
              Prendas confeccionadas en fibras orgánicas, lino europeo y cuero colombiano con envíos asegurados a todo el país.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onExploreCatalog({ department: 'Todos' })}
                className="inline-flex items-center gap-2.5 bg-[#C5A059] text-[#111111] px-7 py-3.5 text-xs sm:text-sm font-bold tracking-wider uppercase hover:bg-[#D4B26E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>COMPRAR AHORA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onExploreCatalog({ onlyDiscounts: true })}
                className="inline-flex items-center gap-2 border border-white/50 text-white px-6 py-3.5 text-xs sm:text-sm font-semibold hover:bg-white hover:text-[#111111] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver descuentos especiales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-[#E2DDD5] divide-y sm:divide-y-0 sm:divide-x divide-[#E2DDD5]">
          <div className="p-5 flex items-center gap-3.5">
            <Truck className="w-5 h-5 text-[#B38B45] shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#111111]">Envío gratis desde $250.000 COP</p>
              <p className="text-xs text-[#5C5852]">Cobertura nacional Servientrega e Inter Rapidísimo</p>
            </div>
          </div>
          <div className="p-5 flex items-center gap-3.5">
            <ShieldCheck className="w-5 h-5 text-[#B38B45] shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#111111]">Pagos colombianos y contra entrega</p>
              <p className="text-xs text-[#5C5852]">Nequi, Daviplata, PSE, tarjetas y pago en casa</p>
            </div>
          </div>
          <div className="p-5 flex items-center gap-3.5">
            <MapPin className="w-5 h-5 text-[#B38B45] shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#111111]">Cambios de talla sin costo (30 días)</p>
              <p className="text-xs text-[#5C5852]">Recogida directa o en Atelier Zona T Bogotá</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COLECCIONES DESTACADAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DDD5] pb-4">
          <div>
            <p className="text-xs font-medium text-[#936F31] uppercase tracking-[0.16em]">
              Departamentos
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111111] mt-1">
              Colecciones Destacadas
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onExploreCatalog({ department: 'Todos' })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] hover:text-[#B38B45] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Explorar las {products.length} prendas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_COLLECTIONS.map((col) => (
            <button
              key={col.department}
              type="button"
              onClick={() => onExploreCatalog({ department: col.department })}
              className="group text-left bg-white border border-[#E2DDD5] hover:border-[#C5A059] transition-all cursor-pointer overflow-hidden"
            >
              <div className="aspect-[3/4] w-full bg-[#F2EDE4] overflow-hidden relative">
                <SafeImage
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-editorial text-xl font-semibold">{col.title}</p>
                  <p className="text-xs text-[#E5DDD0] mt-0.5 line-clamp-1">{col.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. VITRINA: MÁS VENDIDOS, NUEVOS LANZAMIENTOS, DESCUENTOS Y LIQUIDACIÓN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E2DDD5] pb-4">
          <div>
            <p className="text-xs font-medium text-[#936F31] uppercase tracking-[0.16em]">
              Curaduría de Temporada
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111111] mt-1">
              Selección Urban Style
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F2EDE4] overflow-x-auto max-w-full">
            {[
              { id: 'best', label: 'Más Vendidos' },
              { id: 'new', label: 'Nuevos Lanzamientos' },
              { id: 'deals', label: 'Descuentos Especiales' },
              { id: 'clearance', label: 'Liquidación' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setShowcaseTab(tab.id as typeof showcaseTab)}
                className={`px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showcaseTab === tab.id
                    ? 'bg-[#111111] text-white'
                    : 'text-[#5C5852] hover:text-[#111111]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ProductGrid
          products={showcaseProducts}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onOpenDetail={onOpenDetail}
          onAddToCart={onAddToCart}
          columns={4}
        />

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() =>
              onExploreCatalog({
                department: 'Todos',
                onlyDiscounts: showcaseTab === 'deals' || showcaseTab === 'clearance',
              })
            }
            className="border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white px-8 py-3 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
          >
            Ver catálogo completo ({products.length} prendas)
          </button>
        </div>
      </section>

      {/* 4. PROMOCIONES, COMBOS Y CUPONES */}
      <section className="bg-[#111111] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2A2A2A] pb-5">
            <div>
              <p className="text-xs font-medium text-[#C5A059] uppercase tracking-[0.18em]">
                Beneficios Activos
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold mt-1">
                Promociones, Combos y Cupones
              </h2>
            </div>
            <p className="text-xs text-[#D8D2C8] max-w-md">
              Aplica tu cupón directamente al carrito o combina 3 o más prendas para recibir 10% de descuento automático por cantidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {promotions.filter((p) => p.active).map((promo) => (
              <div
                key={promo.id}
                className="border border-[#2A2A2A] bg-[#181818] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-[#C5A059] uppercase">
                    {promo.type === 'quantity'
                      ? 'Por Cantidad'
                      : promo.type === 'combo'
                        ? 'Combo Exclusivo'
                        : promo.type === 'clearance'
                          ? 'Liquidación'
                          : 'Temporada'}
                  </span>
                  <h3 className="text-base font-semibold text-white">{promo.title}</h3>
                  <p className="text-xs text-[#D8D2C8] leading-relaxed">{promo.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onExploreCatalog({
                      department: promo.department || 'Todos',
                      onlyDiscounts: promo.type === 'clearance' || promo.type === 'seasonal',
                    })
                  }
                  className="text-xs font-semibold text-[#C5A059] hover:text-white inline-flex items-center gap-1.5 transition-colors w-fit cursor-pointer"
                >
                  <span>Explorar prendas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Active Coupons Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {coupons.filter((c) => c.active).map((coupon) => (
              <div
                key={coupon.id}
                className="bg-[#FAF8F5] text-[#111111] p-5 border border-[#C5A059]/40 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#B38B45]" />
                    <span className="font-mono text-sm font-bold tracking-wider">{coupon.code}</span>
                  </div>
                  <p className="text-xs text-[#5C5852]">{coupon.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(coupon.code)}
                  className="px-3.5 py-2 bg-[#111111] text-white text-xs font-semibold hover:bg-[#2A2A2A] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Aplicado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Aplicar</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MARCAS DISPONIBLES & OPINIONES DE CLIENTES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Brands */}
        <div className="space-y-6">
          <div className="flex items-end justify-between border-b border-[#E2DDD5] pb-3">
            <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
              Marcas Disponibles
            </h2>
            <span className="text-xs text-[#5C5852]">Haz clic para filtrar por casa de diseño</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {BRANDS.map((brand) => (
              <button
                key={brand.name}
                type="button"
                onClick={() => onExploreCatalog({ brand: brand.name })}
                className="bg-white border border-[#E2DDD5] hover:border-[#111111] p-4 text-left transition-colors cursor-pointer"
              >
                <p className="font-editorial text-base font-semibold text-[#111111]">{brand.name}</p>
                <p className="text-[11px] text-[#5C5852] mt-1">{brand.origin}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E2DDD5] pb-3">
            <div>
              <p className="text-xs font-medium text-[#936F31] uppercase tracking-[0.16em]">
                Comunidad Verificada
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111111] mt-1">
                Opiniones de Clientes
              </h2>
            </div>
            <p className="text-xs text-[#5C5852] tabular-nums">
              4.9 / 5.0 calificación promedio en entregas nacionales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 6).map((rev) => {
              const prod = products.find((p) => p.id === rev.productId);
              return (
                <div key={rev.id} className="bg-white border border-[#E2DDD5] p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5 text-[#C5A059]">
                        {Array.from({ length: rev.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#5C5852]">
                        {rev.verifiedPurchase ? 'Compra verificada' : 'Cliente'}
                      </span>
                    </div>
                    <p className="text-sm text-[#111111] leading-relaxed">“{rev.comment}”</p>
                  </div>

                  <div className="pt-3 border-t border-[#E2DDD5]/70 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-[#111111]">{rev.userName}</p>
                      <p className="text-[#5C5852]">{rev.city}, Colombia</p>
                    </div>
                    {prod && (
                      <button
                        type="button"
                        onClick={() => onOpenDetail(prod)}
                        className="text-[11px] font-semibold text-[#936F31] hover:underline text-right max-w-[140px] truncate cursor-pointer"
                      >
                        {prod.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
