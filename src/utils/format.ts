import type { Product } from '../types/store';

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function getTotalProductStock(product: Product): number {
  let total = 0;
  for (const sizeKey of Object.keys(product.stockByVariant)) {
    const colorMap = product.stockByVariant[sizeKey];
    for (const colorKey of Object.keys(colorMap)) {
      total += Math.max(0, Number(colorMap[colorKey] || 0));
    }
  }
  return total;
}

export function getVariantStock(product: Product, size: string, color: string): number {
  return Math.max(0, Number(product.stockByVariant?.[size]?.[color] ?? 0));
}

export function getFirstAvailableVariant(product: Product): { size: string; color: string } {
  for (const size of product.sizes) {
    for (const color of product.colors) {
      if (getVariantStock(product, size, color.name) > 0) {
        return { size, color: color.name };
      }
    }
  }
  return {
    size: product.sizes[0] || 'Única',
    color: product.colors[0]?.name || 'Negro',
  };
}

export const SHIPPING_CARRIERS: Array<{
  name: 'Servientrega Estándar' | 'Coordinadora Express' | 'Inter Rapidísimo' | 'Recoger en Boutique Bogotá';
  eta: string;
  cost: number;
  freeThreshold: number;
}> = [
  {
    name: 'Servientrega Estándar',
    eta: '2 a 4 días hábiles en ciudades principales',
    cost: 14900,
    freeThreshold: 250000,
  },
  {
    name: 'Coordinadora Express',
    eta: '24 a 48 horas hábiles prioritario',
    cost: 22900,
    freeThreshold: 450000,
  },
  {
    name: 'Inter Rapidísimo',
    eta: '2 a 5 días hábiles cobertura nacional',
    cost: 15900,
    freeThreshold: 250000,
  },
  {
    name: 'Recoger en Boutique Bogotá',
    eta: 'Listo en 4 horas · Zona T Carrera 13 #82-45',
    cost: 0,
    freeThreshold: 0,
  },
];

export const COLOMBIA_DEPARTMENTS = [
  'Bogotá D.C.',
  'Antioquia',
  'Valle del Cauca',
  'Atlántico',
  'Bolívar',
  'Cundinamarca',
  'Santander',
  'Risaralda',
  'Caldas',
  'Quindío',
  'Tolima',
  'Norte de Santander',
  'Meta',
  'Boyacá',
  'Huila',
  'Magdalena',
  'Córdoba',
  'Cauca',
  'Nariño',
];
