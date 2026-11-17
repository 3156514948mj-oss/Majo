import { useState } from 'react';
import {
  Bell,
  Heart,
  Menu,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import type { Department, StoreNotification, UserProfile } from '../types/store';

export type ActiveView =
  | 'home'
  | 'catalog'
  | 'product'
  | 'checkout'
  | 'account'
  | 'favorites'
  | 'tracking'
  | 'admin'
  | 'faq'
  | 'privacy'
  | 'terms';

interface HeaderProps {
  activeView: ActiveView;
  selectedDepartment: Department | 'Todos';
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onNavigateHome: () => void;
  onSelectDepartment: (dept: Department | 'Todos', onlyDiscounts?: boolean) => void;
  onNavigate: (view: ActiveView) => void;
  onOpenCart: () => void;
  cartCount: number;
  favoritesCount: number;
  user: UserProfile | null;
  notifications: StoreNotification[];
  onMarkNotificationsRead: () => void;
}

export function Header({
  activeView,
  selectedDepartment,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onNavigateHome,
  onSelectDepartment,
  onNavigate,
  onOpenCart,
  cartCount,
  favoritesCount,
  user,
  notifications,
  onMarkNotificationsRead,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: Array<{ label: string; dept: Department | 'Ofertas' }> = [
    { label: 'Mujer', dept: 'Mujer' },
    { label: 'Hombre', dept: 'Hombre' },
    { label: 'Niños', dept: 'Niños' },
    { label: 'Accesorios', dept: 'Accesorios' },
    { label: 'Ofertas', dept: 'Ofertas' },
  ];

  const handleDeptClick = (dept: Department | 'Ofertas') => {
    setMobileMenuOpen(false);
    if (dept === 'Ofertas') {
      onSelectDepartment('Todos', true);
    } else {
      onSelectDepartment(dept, false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E2DDD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 text-[#111111] hover:text-[#B38B45] transition-colors cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="font-editorial text-xl sm:text-2xl font-semibold tracking-[0.12em] text-[#111111] whitespace-nowrap shrink-0 cursor-pointer"
          >
            URBAN STYLE
          </button>
        </div>

        {/* Zone 2: Primary Category Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#5C5852]" aria-label="Categorías principales">
          {navItems.map((item) => {
            const isActive =
              activeView === 'catalog' &&
              ((item.dept !== 'Ofertas' && selectedDepartment === item.dept) ||
                (item.dept === 'Ofertas' && selectedDepartment === 'Todos'));
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleDeptClick(item.dept)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive ? 'text-[#111111] font-semibold' : 'hover:text-[#111111]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#B38B45]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search, Account, Favorites, Notifications, Bag */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Desktop Inline Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
            className="hidden md:flex items-center bg-white border border-[#E2DDD5] focus-within:border-[#111111] px-3 py-1.5 w-48 xl:w-64 transition-colors"
          >
            <Search className="w-4 h-4 text-[#5C5852] shrink-0 mr-2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar prendas..."
              aria-label="Buscar prendas en Urban Style"
              className="w-full text-xs bg-transparent text-[#111111] placeholder:text-[#5C5852]/70 focus:outline-none"
            />
          </form>

          {/* Mobile Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="md:hidden p-2 text-[#111111] hover:text-[#B38B45] transition-colors cursor-pointer"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5 stroke-[1.75]" />
          </button>

          {/* Order Tracking Icon */}
          <button
            type="button"
            onClick={() => onNavigate('tracking')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'tracking' ? 'text-[#B38B45]' : 'text-[#5C5852] hover:text-[#111111]'
            }`}
            title="Seguimiento de pedidos"
          >
            <PackageSearch className="w-4 h-4 stroke-[1.75]" />
            <span className="hidden xl:inline">Pedidos</span>
          </button>

          {/* Admin shortcut if admin */}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'border-[#B38B45] text-[#936F31] hover:bg-[#B38B45] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                if (!notifOpen && unreadCount > 0) onMarkNotificationsRead();
              }}
              className="relative p-2 text-[#111111] hover:text-[#B38B45] transition-colors cursor-pointer"
              aria-label="Notificaciones de pedidos"
            >
              <Bell className="w-5 h-5 stroke-[1.75]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#B38B45] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2DDD5] shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2DDD5] bg-[#FAF8F5]">
                  <span className="text-xs font-semibold text-[#111111]">Notificaciones</span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-[#5C5852] hover:text-[#111111] cursor-pointer"
                    aria-label="Cerrar notificaciones"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#E2DDD5]/60">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-[#5C5852]">No tienes notificaciones recientes.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3.5 hover:bg-[#FAF8F5] transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[#111111]">{n.title}</p>
                          <span className="text-[11px] text-[#5C5852] font-mono tabular-nums">
                            {new Date(n.timestamp).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C5852] mt-1">{n.message}</p>
                        {n.orderNumber && (
                          <button
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              onNavigate('tracking');
                            }}
                            className="mt-1.5 text-[11px] font-semibold text-[#B38B45] hover:underline cursor-pointer"
                          >
                            Rastrear {n.orderNumber}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Icon */}
          <button
            type="button"
            onClick={() => onNavigate('account')}
            className={`relative p-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeView === 'account' ? 'text-[#B38B45]' : 'text-[#111111] hover:text-[#B38B45]'
            }`}
            aria-label="Mi Cuenta"
            title={user ? `Cuenta de ${user.name}` : 'Iniciar sesión o registrarse'}
          >
            <User className="w-5 h-5 stroke-[1.75]" />
            {user && (
              <span className="hidden xl:inline text-xs font-medium max-w-[90px] truncate">
                {user.name.split(' ')[0]}
              </span>
            )}
          </button>

          {/* Favorites Icon */}
          <button
            type="button"
            onClick={() => onNavigate('favorites')}
            className={`relative p-2 transition-colors cursor-pointer ${
              activeView === 'favorites' ? 'text-[#B38B45]' : 'text-[#111111] hover:text-[#B38B45]'
            }`}
            aria-label="Lista de favoritos"
          >
            <Heart className="w-5 h-5 stroke-[1.75]" />
            {favoritesCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#111111] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Shopping Bag Icon */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#111111] text-white px-3.5 py-2 text-xs font-semibold hover:bg-[#2A2A2A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Abrir carrito de compras"
          >
            <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
            <span className="tabular-nums">{cartCount}</span>
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 bg-[#FAF8F5] border-t border-[#E2DDD5]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchOpen(false);
              onSearchSubmit();
            }}
            className="flex items-center bg-white border border-[#E2DDD5] px-3 py-2"
          >
            <Search className="w-4 h-4 text-[#5C5852] mr-2 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar camisetas, blazers, jeans..."
              className="w-full text-sm bg-transparent focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="text-xs font-semibold text-[#111111] pl-2 whitespace-nowrap shrink-0"
            >
              Buscar
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E2DDD5] px-4 py-4 space-y-2 shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleDeptClick(item.dept)}
              className="block w-full text-left py-2.5 px-2 text-sm font-medium text-[#111111] hover:bg-[#FAF8F5] border-b border-[#E2DDD5]/50 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('tracking');
              }}
              className="text-xs font-semibold text-[#5C5852] hover:text-[#111111] py-1.5 cursor-pointer"
            >
              Seguimiento de pedidos
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('faq');
              }}
              className="text-xs font-semibold text-[#5C5852] hover:text-[#111111] py-1.5 cursor-pointer"
            >
              Preguntas frecuentes
            </button>
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('admin');
                }}
                className="text-xs font-semibold text-[#B38B45] py-1.5 cursor-pointer"
              >
                Panel Administrador
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
