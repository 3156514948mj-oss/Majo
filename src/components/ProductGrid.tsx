import type { ReactNode } from 'react';
import type { Product } from '../types/store';
import { ProductCard } from './ProductCard';

export interface ProductGridProps {
  products: Product[];
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  columns?: 2 | 3 | 4;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
}

const COLUMN_CLASSES: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function ProductGrid({
  products,
  favorites,
  onToggleFavorite,
  onOpenDetail,
  onAddToCart,
  columns = 4,
  emptyTitle = 'No se encontraron prendas',
  emptyDescription = 'Prueba ajustando los filtros o explorando otra colección.',
  emptyAction,
  className = '',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white border border-[#E2DDD5] p-10 sm:p-12 text-center space-y-4">
        <p className="font-editorial text-2xl text-[#111111]">{emptyTitle}</p>
        <p className="text-sm text-[#5C5852] max-w-md mx-auto">{emptyDescription}</p>
        {emptyAction && <div className="pt-1">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className={`grid ${COLUMN_CLASSES[columns]} gap-6 ${className}`.trim()}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={favorites.includes(product.id)}
          onToggleFavorite={onToggleFavorite}
          onOpenDetail={onOpenDetail}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
