import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  RefreshCw,
  Ruler,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import type { Product, ProductReview, UserProfile } from '../types/store';
import { formatCOP, getFirstAvailableVariant, getVariantStock } from '../utils/format';
import { ProductGrid } from './ProductGrid';
import { SafeImage } from './SafeImage';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  reviews: ProductReview[];
  favorites: string[];
  user: UserProfile | null;
  onBack: () => void;
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
  onOpenSizeGuide: (dept?: 'Mujer' | 'Hombre' | 'Niños') => void;
  onSubmitReview: (productId: string, rating: number, comment: string) => Promise<void>;
}

export function ProductDetailView({
  product,
  allProducts,
  reviews,
  favorites,
  user,
  onBack,
  onToggleFavorite,
  onAddToCart,
  onOpenDetail,
  onOpenSizeGuide,
  onSubmitReview,
}: ProductDetailViewProps) {
  const initial = getFirstAvailableVariant(product);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(initial.size);
  const [selectedColor, setSelectedColor] = useState(initial.color);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const nextInit = getFirstAvailableVariant(product);
    setActiveImageIdx(0);
    setSelectedSize(nextInit.size);
    setSelectedColor(nextInit.color);
    setQuantity(1);
    setJustAdded(false);
  }, [product.id]);

  const variantStock = getVariantStock(product, selectedSize, selectedColor);

  useEffect(() => {
    if (variantStock > 0 && quantity > variantStock) {
      setQuantity(variantStock);
    }
    if (variantStock === 0) {
      setQuantity(1);
    }
  }, [variantStock, quantity]);

  const productReviews = useMemo(
    () => reviews.filter((r) => r.productId === product.id),
    [reviews, product.id],
  );

  const relatedProducts = useMemo(
    () =>
      allProducts
        .filter((p) => p.id !== product.id && (p.department === product.department || p.category === product.category))
        .slice(0, 4),
    [allProducts, product],
  );

  const isFavorite = favorites.includes(product.id);

  const handleAdd = () => {
    if (variantStock <= 0) return;
    onAddToCart(product, selectedSize, selectedColor, Math.min(quantity, variantStock));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      setReviewError('Escribe un comentario de al menos 5 caracteres.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await onSubmitReview(product.id, reviewRating, reviewComment.trim());
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'No se pudo enviar la reseña.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#5C5852] hover:text-[#111111] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al catálogo</span>
      </button>

      {/* Main PDP Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Photo Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[3/4] w-full bg-[#F2EDE4] border border-[#E2DDD5] overflow-hidden">
            <SafeImage
              src={product.images[activeImageIdx] || product.images[0]}
              alt={`${product.name} - vista ${activeImageIdx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`aspect-[3/4] bg-[#F2EDE4] border transition-all overflow-hidden cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-[#111111] ring-1 ring-[#111111]'
                      : 'border-[#E2DDD5] opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={imgUrl}
                    alt={`${product.name} miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-[#E2DDD5] p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-[#E2DDD5] pb-5">
            <div className="flex items-center justify-between text-xs text-[#5C5852]">
              <span>
                {product.brand} · {product.department} / {product.category}
              </span>
              <span className="font-mono">{product.sku}</span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111111] leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-[#C5A059]">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-xs font-semibold text-[#111111] tabular-nums">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-[#5C5852]">
                {productReviews.length} opiniones · {product.soldCount} vendidas
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#111111]">
                {formatCOP(product.price)}
              </span>
              {product.previousPrice && product.previousPrice > product.price && (
                <>
                  <span className="text-sm font-mono line-through text-[#5C5852] tabular-nums">
                    {formatCOP(product.previousPrice)}
                  </span>
                  <span className="text-xs font-semibold text-[#936F31]">
                    -{product.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#111111]">
                Color: <span className="font-normal text-[#5C5852]">{selectedColor}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c.name)}
                  className={`flex items-center gap-2 px-3 py-2 border text-xs transition-colors cursor-pointer ${
                    selectedColor === c.name
                      ? 'border-[#111111] bg-[#FAF8F5] font-semibold'
                      : 'border-[#E2DDD5] hover:border-[#111111]'
                  }`}
                >
                  <span
                    className="w-4 h-4 border border-[#D8D2C8]"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector + Size Guide */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#111111]">
                Talla: <span className="font-normal text-[#5C5852]">{selectedSize}</span>
              </span>
              {product.department !== 'Accesorios' && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenSizeGuide(
                      product.department === 'Hombre' || product.department === 'Niños'
                        ? product.department
                        : 'Mujer',
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#936F31] hover:underline cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Guía de tallas</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {product.sizes.map((size) => {
                const stockForSize = getVariantStock(product, size, selectedColor);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${
                      selectedSize === size
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : stockForSize === 0
                          ? 'bg-[#FAF8F5] text-[#5C5852]/50 border-[#E2DDD5] line-through'
                          : 'bg-white text-[#111111] border-[#E2DDD5] hover:border-[#111111]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Availability indicator per exact size + color */}
            <p
              className={`text-xs font-medium tabular-nums pt-1 ${
                variantStock > 0 ? 'text-[#111111]' : 'text-red-700'
              }`}
            >
              {variantStock > 0
                ? `Disponibilidad: ${variantStock} unidades en talla ${selectedSize} · ${selectedColor}`
                : `Agotado en talla ${selectedSize} · ${selectedColor}. Selecciona otra combinación.`}
            </p>
          </div>

          {/* Quantity + Add to Cart + Favorite */}
          <div className="space-y-3 pt-2">
            <div className="flex items-stretch gap-3">
              <div className="flex items-center border border-[#E2DDD5] bg-[#FAF8F5]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={variantStock <= 0 || quantity <= 1}
                  className="px-3 py-3 text-[#111111] disabled:opacity-40 cursor-pointer"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-mono font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(variantStock, q + 1))}
                  disabled={variantStock <= 0 || quantity >= variantStock}
                  className="px-3 py-3 text-[#111111] disabled:opacity-40 cursor-pointer"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={variantStock <= 0}
                className={`flex-1 py-3.5 px-6 text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  variantStock <= 0
                    ? 'bg-[#E5DDD0] text-[#5C5852] cursor-not-allowed'
                    : justAdded
                      ? 'bg-[#936F31] text-white'
                      : 'bg-[#111111] text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Agregado al carrito</span>
                  </>
                ) : variantStock <= 0 ? (
                  <span>Sin existencias</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Agregar al carrito</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => onToggleFavorite(product.id)}
              className={`w-full py-3 border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isFavorite
                  ? 'border-[#111111] bg-[#FAF8F5] text-[#111111]'
                  : 'border-[#E2DDD5] text-[#5C5852] hover:border-[#111111] hover:text-[#111111]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#C5A059] text-[#C5A059]' : ''}`} />
              <span>{isFavorite ? 'Guardado en favoritos' : 'Agregar a favoritos'}</span>
            </button>
          </div>

          {/* Description, Material, Shipping & Returns */}
          <div className="space-y-4 pt-4 border-t border-[#E2DDD5] text-xs text-[#5C5852] leading-relaxed">
            <div>
              <h2 className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1">
                Descripción y Confección
              </h2>
              <p>{product.description}</p>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1">
                Material y Cuidados
              </h2>
              <p className="text-[#111111] font-medium">{product.material}</p>
              <p className="mt-1">{product.careInstructions}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#FAF8F5] p-3 border border-[#E2DDD5] flex items-start gap-2">
                <Truck className="w-4 h-4 text-[#B38B45] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#111111]">Envío Nacional</p>
                  <p>Gratis desde $250.000 COP. Entrega 2–4 días hábiles.</p>
                </div>
              </div>
              <div className="bg-[#FAF8F5] p-3 border border-[#E2DDD5] flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-[#B38B45] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#111111]">Cambios y Devoluciones</p>
                  <p>30 días para cambio de talla o retracto con etiquetas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="border-t border-[#E2DDD5] pt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
            Opiniones de Compradores
          </h2>
          <p className="text-sm text-[#5C5852]">
            Calificación promedio de <span className="font-semibold text-[#111111]">{product.rating.toFixed(1)} / 5.0</span> basada en reseñas verificadas.
          </p>

          <form onSubmit={handleReviewSubmit} className="bg-white border border-[#E2DDD5] p-5 space-y-3">
            <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
              Escribe tu opinión
            </p>
            {!user ? (
              <p className="text-xs text-[#5C5852]">
                Inicia sesión en tu cuenta para compartir tu experiencia con esta prenda.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer"
                      aria-label={`${star} estrellas`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= reviewRating ? 'fill-[#C5A059] text-[#C5A059]' : 'text-[#D8D2C8]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Cuéntanos sobre el calce, la tela y la entrega..."
                  className="w-full border border-[#E2DDD5] p-2.5 text-xs focus:outline-none focus:border-[#111111]"
                />
                {reviewError && <p className="text-xs text-red-700">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full bg-[#111111] text-white py-2.5 text-xs font-semibold hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                >
                  {reviewSubmitting ? 'Publicando...' : 'Publicar opinión'}
                </button>
              </>
            )}
          </form>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {productReviews.length === 0 ? (
            <div className="bg-white border border-[#E2DDD5] p-8 text-sm text-[#5C5852]">
              Aún no hay comentarios publicados para esta referencia. Sé la primera persona en compartir su reseña.
            </div>
          ) : (
            productReviews.map((rev) => (
              <div key={rev.id} className="bg-white border border-[#E2DDD5] p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#111111]">{rev.userName}</span>
                    <span className="text-xs text-[#5C5852]">· {rev.city}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#C5A059]">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#111111]">{rev.comment}</p>
                <p className="text-[11px] text-[#5C5852]">
                  {rev.verifiedPurchase ? 'Compra verificada · ' : ''}
                  {new Date(rev.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[#E2DDD5] pt-12 space-y-6">
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111111]">
            Productos Relacionados
          </h2>
          <ProductGrid
            products={relatedProducts}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            onAddToCart={(p, s, c) => onAddToCart(p, s, c, 1)}
            columns={4}
          />
        </section>
      )}
    </div>
  );
}
