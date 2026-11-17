import { useState } from 'react';
import { Check, Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../types/store';
import {
  formatCOP,
  getFirstAvailableVariant,
  getTotalProductStock,
  getVariantStock,
} from '../utils/format';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
}

export function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onOpenDetail,
  onAddToCart,
}: ProductCardProps) {
  const initial = getFirstAvailableVariant(product);
  const [selectedSize, setSelectedSize] = useState(initial.size);
  const [selectedColor, setSelectedColor] = useState(initial.color);
  const [justAdded, setJustAdded] = useState(false);

  const totalStock = getTotalProductStock(product);
  const variantStock = getVariantStock(product, selectedSize, selectedColor);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (variantStock <= 0) return;
    onAddToCart(product, selectedSize, selectedColor);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article className="group flex flex-col bg-white border border-[#E2DDD5] hover:border-[#C5A059] transition-all duration-200 hover:-translate-y-0.5">
      {/* Media Container (3:4 studio frame) */}
      <div
        onClick={() => onOpenDetail(product)}
        className="relative aspect-[3/4] w-full bg-[#F2EDE4] overflow-hidden cursor-pointer"
      >
        <SafeImage
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Single clean editorial corner indicator (no pill spam) */}
        {(product.discountPercent > 0 || totalStock === 0) && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
              totalStock === 0
                ? 'bg-[#111111] text-white'
                : 'bg-white/95 text-[#111111] border border-[#E2DDD5]'
            }`}
          >
            {totalStock === 0 ? 'Agotado' : `-${product.discountPercent}%`}
          </span>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center transition-colors cursor-pointer ${
            isFavorite
              ? 'bg-[#111111] text-[#C5A059]'
              : 'bg-white/90 text-[#111111] hover:bg-[#111111] hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Info Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Clean unboxed metadata */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#5C5852]">
            <span className="truncate">
              {product.brand} · {product.category}
            </span>
            <span className="flex items-center gap-1 shrink-0 tabular-nums text-[#111111] font-medium">
              <Star className="w-3 h-3 fill-[#C5A059] text-[#C5A059]" />
              {product.rating.toFixed(1)}
            </span>
          </div>

          <h3
            onClick={() => onOpenDetail(product)}
            className="text-sm font-semibold text-[#111111] leading-snug line-clamp-2 cursor-pointer hover:text-[#936F31] transition-colors"
          >
            {product.name}
          </h3>

          <p className="text-xs text-[#5C5852] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {/* Price & Stock */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-bold text-[#111111] font-mono tabular-nums">
                {formatCOP(product.price)}
              </span>
              {product.previousPrice && product.previousPrice > product.price && (
                <span className="text-xs text-[#5C5852] line-through font-mono tabular-nums">
                  {formatCOP(product.previousPrice)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#5C5852] tabular-nums shrink-0">
              {totalStock > 0 ? `${totalStock} disp.` : 'Sin stock'}
            </span>
          </div>

          {/* Color & Size Quick Selector */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E2DDD5]/70">
            <div className="flex items-center gap-1.5" role="group" aria-label="Colores disponibles">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(c.name);
                  }}
                  title={c.name}
                  aria-label={`Color ${c.name}`}
                  className={`w-4 h-4 border transition-transform cursor-pointer ${
                    selectedColor === c.name
                      ? 'ring-1 ring-offset-1 ring-[#111111] scale-110'
                      : 'border-[#D8D2C8]'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 flex-wrap justify-end" role="group" aria-label="Tallas">
              {product.sizes.slice(0, 4).map((size) => {
                const avail = getVariantStock(product, size, selectedColor);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(size);
                    }}
                    className={`px-1.5 py-0.5 text-[11px] font-medium border transition-colors cursor-pointer ${
                      selectedSize === size
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : avail === 0
                          ? 'text-[#5C5852]/40 border-[#E2DDD5] line-through'
                          : 'text-[#5C5852] border-[#E2DDD5] hover:border-[#111111]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={variantStock <= 0}
            className={`w-full py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              variantStock <= 0
                ? 'bg-[#E5DDD0] text-[#5C5852] cursor-not-allowed'
                : justAdded
                  ? 'bg-[#936F31] text-white'
                  : 'bg-[#111111] text-white hover:bg-[#2A2A2A]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Agregado al carrito</span>
              </>
            ) : variantStock <= 0 ? (
              <span>Combinación agotada</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Agregar al carrito</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
