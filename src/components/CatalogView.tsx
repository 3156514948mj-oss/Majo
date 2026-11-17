import { useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Department, Product } from '../types/store';
import { DEPARTMENT_CATEGORIES } from '../types/store';
import { formatCOP, getTotalProductStock } from '../utils/format';
import { ProductGrid } from './ProductGrid';

export interface CatalogFilters {
  department: Department | 'Todos';
  category: string;
  size: string;
  color: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  onlyAvailable: boolean;
  onlyDiscounts: boolean;
  sortBy: 'best' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
}

interface CatalogViewProps {
  products: Product[];
  recentlyViewedIds: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filters: CatalogFilters;
  onFiltersChange: (next: CatalogFilters) => void;
  onResetFilters: () => void;
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
}

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '28', '30', '32', '34', '4-6', '8-10', '12-14', 'Única'];

export function CatalogView({
  products,
  recentlyViewedIds,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onResetFilters,
  favorites,
  onToggleFavorite,
  onOpenDetail,
  onAddToCart,
}: CatalogViewProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const availableCategories = useMemo(() => {
    if (filters.department !== 'Todos') {
      return DEPARTMENT_CATEGORIES[filters.department];
    }
    return Array.from(
      new Set([
        ...DEPARTMENT_CATEGORIES.Mujer,
        ...DEPARTMENT_CATEGORIES.Hombre,
        ...DEPARTMENT_CATEGORIES.Niños,
        ...DEPARTMENT_CATEGORIES.Accesorios,
      ]),
    );
  }, [filters.department]);

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products],
  );

  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => p.colors.forEach((c) => map.set(c.name, c.hex)));
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const min = filters.minPrice ? Number(filters.minPrice) : null;
    const max = filters.maxPrice ? Number(filters.maxPrice) : null;

    const list = products.filter((p) => {
      if (filters.department !== 'Todos' && p.department !== filters.department) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.size && !p.sizes.includes(filters.size)) return false;
      if (filters.color && !p.colors.some((c) => c.name === filters.color)) return false;
      if (min !== null && p.price < min) return false;
      if (max !== null && p.price > max) return false;
      if (filters.onlyAvailable && getTotalProductStock(p) <= 0) return false;
      if (filters.onlyDiscounts && p.discountPercent <= 0) return false;

      if (q) {
        const haystack = `${p.name} ${p.description} ${p.category} ${p.department} ${p.brand} ${p.material} ${p.sku}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    switch (filters.sortBy) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...list].sort((a, b) => b.rating - a.rating);
      case 'newest':
        return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case 'best':
      default:
        return [...list].sort((a, b) => b.soldCount - a.soldCount);
    }
  }, [products, searchQuery, filters]);

  const recentProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 4),
    [recentlyViewedIds, products],
  );

  const recommendedProducts = useMemo(() => {
    const dept = filters.department !== 'Todos' ? filters.department : 'Mujer';
    return products
      .filter((p) => p.department === dept && !filteredProducts.slice(0, 4).some((f) => f.id === p.id))
      .slice(0, 4);
  }, [products, filters.department, filteredProducts]);

  const filterPanel = (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
        <span className="font-semibold text-[#111111] flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#B38B45]" />
          Filtros
        </span>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs text-[#5C5852] hover:text-[#111111] inline-flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Limpiar
        </button>
      </div>

      {/* Departamento */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C5852]">Departamento</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(['Todos', 'Mujer', 'Hombre', 'Niños', 'Accesorios'] as const).map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  department: dept,
                  category: '',
                })
              }
              className={`px-3 py-2 text-xs font-medium text-left border transition-colors cursor-pointer ${
                filters.department === dept
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#111111] border-[#E2DDD5] hover:border-[#111111]'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategoría */}
      <div className="space-y-2">
        <label htmlFor="cat-select" className="block text-xs font-semibold uppercase tracking-wider text-[#5C5852]">
          Categoría
        </label>
        <select
          id="cat-select"
          value={filters.category}
          onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
          className="w-full bg-white border border-[#E2DDD5] px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
        >
          <option value="">Todas las categorías</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Talla */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C5852]">Talla</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  size: filters.size === sz ? '' : sz,
                })
              }
              className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
                filters.size === sz
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#111111] border-[#E2DDD5] hover:border-[#111111]'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C5852]">Color</p>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((col) => (
            <button
              key={col.name}
              type="button"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  color: filters.color === col.name ? '' : col.name,
                })
              }
              title={col.name}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs border transition-colors cursor-pointer ${
                filters.color === col.name
                  ? 'border-[#111111] bg-[#F2EDE4] font-semibold'
                  : 'border-[#E2DDD5] bg-white hover:border-[#111111]'
              }`}
            >
              <span
                className="w-3 h-3 border border-[#D8D2C8]"
                style={{ backgroundColor: col.hex }}
              />
              <span>{col.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Marca */}
      <div className="space-y-2">
        <label htmlFor="brand-select" className="block text-xs font-semibold uppercase tracking-wider text-[#5C5852]">
          Marca
        </label>
        <select
          id="brand-select"
          value={filters.brand}
          onChange={(e) => onFiltersChange({ ...filters, brand: e.target.value })}
          className="w-full bg-white border border-[#E2DDD5] px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
        >
          <option value="">Todas las marcas</option>
          {availableBrands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Rango de Precio */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C5852]">Precio (COP)</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step={10000}
            value={filters.minPrice}
            onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
            placeholder="Mínimo"
            className="w-full bg-white border border-[#E2DDD5] px-2.5 py-2 text-xs font-mono tabular-nums focus:outline-none focus:border-[#111111]"
          />
          <input
            type="number"
            min={0}
            step={10000}
            value={filters.maxPrice}
            onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
            placeholder="Máximo"
            className="w-full bg-white border border-[#E2DDD5] px-2.5 py-2 text-xs font-mono tabular-nums focus:outline-none focus:border-[#111111]"
          />
        </div>
        {(filters.minPrice || filters.maxPrice) && (
          <p className="text-[11px] text-[#5C5852] tabular-nums">
            {filters.minPrice ? formatCOP(Number(filters.minPrice)) : '$0'} —{' '}
            {filters.maxPrice ? formatCOP(Number(filters.maxPrice)) : 'Sin límite'}
          </p>
        )}
      </div>

      {/* Disponibilidad & Descuentos */}
      <div className="space-y-2.5 pt-2 border-t border-[#E2DDD5]">
        <label className="flex items-center gap-2.5 text-xs text-[#111111] cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyAvailable}
            onChange={(e) => onFiltersChange({ ...filters, onlyAvailable: e.target.checked })}
            className="w-4 h-4 accent-[#111111]"
          />
          <span>Solo con inventario disponible</span>
        </label>
        <label className="flex items-center gap-2.5 text-xs text-[#111111] cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyDiscounts}
            onChange={(e) => onFiltersChange({ ...filters, onlyDiscounts: e.target.checked })}
            className="w-4 h-4 accent-[#111111]"
          />
          <span>Solo prendas con descuento</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header + Search + Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2DDD5] pb-5">
        <div>
          <p className="text-xs text-[#936F31] uppercase tracking-[0.16em]">Catálogo Oficial</p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#111111] mt-1">
            {filters.department === 'Todos' ? 'Todas las Colecciones' : `Colección ${filters.department}`}
            {filters.category ? ` · ${filters.category}` : ''}
          </h1>
          <p className="text-xs text-[#5C5852] mt-1 tabular-nums">
            Mostrando {filteredProducts.length} de {products.length} prendas disponibles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-[#E2DDD5] px-3 py-2 w-full sm:w-64">
            <Search className="w-4 h-4 text-[#5C5852] mr-2 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar nombre, tela, SKU..."
              className="w-full text-xs bg-transparent focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 bg-white border border-[#E2DDD5] px-4 py-2 text-xs font-semibold text-[#111111] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
          </button>

          <select
            aria-label="Ordenar catálogo"
            value={filters.sortBy}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                sortBy: e.target.value as CatalogFilters['sortBy'],
              })
            }
            className="bg-white border border-[#E2DDD5] px-3 py-2 text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
          >
            <option value="best">Ordenar: Más vendidos</option>
            <option value="newest">Ordenar: Más recientes</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="rating">Mejor calificados</option>
          </select>
        </div>
      </div>

      {/* Main Split: Sidebar Filters + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#E2DDD5] p-5 sticky top-20">
          {filterPanel}
        </aside>

        <div className="lg:col-span-9">
          <ProductGrid
            products={filteredProducts}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            onAddToCart={onAddToCart}
            columns={3}
            emptyTitle="No encontramos prendas con estos filtros"
            emptyDescription="Intenta ampliar el rango de precio o restablecer los filtros activos para explorar todo el catálogo."
            emptyAction={
              <button
                type="button"
                onClick={onResetFilters}
                className="bg-[#111111] text-white px-6 py-2.5 text-xs font-semibold hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                Restablecer filtros
              </button>
            }
          />
        </div>
      </div>

      {/* Recently Viewed History */}
      {recentProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-[#E2DDD5]">
          <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
            Historial de Navegación Reciente
          </h2>
          <ProductGrid
            products={recentProducts}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            onAddToCart={onAddToCart}
            columns={4}
          />
        </section>
      )}

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-[#E2DDD5]">
          <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
            Recomendaciones para tu Estilo
          </h2>
          <ProductGrid
            products={recommendedProducts}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onOpenDetail={onOpenDetail}
            onAddToCart={onAddToCart}
            columns={4}
          />
        </section>
      )}

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-xs bg-[#FAF8F5] h-full overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111111]">Filtrar catálogo</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-[#111111] cursor-pointer"
                aria-label="Cerrar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full bg-[#111111] text-white py-3 text-xs font-semibold cursor-pointer"
            >
              Ver {filteredProducts.length} resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
