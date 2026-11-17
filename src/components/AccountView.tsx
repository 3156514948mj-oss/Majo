import { useEffect, useState } from 'react';
import {
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { storeApi } from '../services/api';
import type { Order, Product, UserAddress, UserProfile } from '../types/store';
import { COLOMBIA_DEPARTMENTS, formatCOP } from '../utils/format';
import { ProductGrid } from './ProductGrid';

interface AccountViewProps {
  user: UserProfile | null;
  products: Product[];
  favorites: string[];
  initialTab?: 'profile' | 'favorites' | 'orders' | 'addresses';
  onAuthSuccess: (token: string, user: UserProfile) => void;
  onUserUpdated: (user: UserProfile) => void;
  onLogout: () => void;
  onToggleFavorite: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  onTrackOrder: (orderNumber: string) => void;
  onOpenAdmin: () => void;
}

export function AccountView({
  user,
  products,
  favorites,
  initialTab = 'profile',
  onAuthSuccess,
  onUserUpdated,
  onLogout,
  onToggleFavorite,
  onOpenDetail,
  onAddToCart,
  onTrackOrder,
  onOpenAdmin,
}: AccountViewProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');

  // Recovery flow
  const [recoverStep, setRecoverStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoCodeNotice, setDemoCodeNotice] = useState('');

  const [authError, setAuthError] = useState('');
  const [authMsg, setAuthMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Authenticated tabs
  const [tab, setTab] = useState<'profile' | 'addresses' | 'orders' | 'favorites'>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editDoc, setEditDoc] = useState(user?.documentId || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // New address state
  const [addrForm, setAddrForm] = useState<Omit<UserAddress, 'id'>>({
    label: 'Casa',
    department: 'Bogotá D.C.',
    city: 'Bogotá',
    street: '',
    neighborhood: '',
    notes: '',
    isDefault: false,
  });

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditDoc(user.documentId);
      setOrdersLoading(true);
      storeApi
        .getMyOrders()
        .then((res) => setOrders(res.orders))
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [user]);

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const res = await storeApi.login(email, password);
      onAuthSuccess(res.token, res.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'No pudimos iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await storeApi.login(demoEmail, demoPass);
      onAuthSuccess(res.token, res.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error de acceso demo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const res = await storeApi.register({ name, email, password, phone, documentId });
      onAuthSuccess(res.token, res.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'No pudimos crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMsg('');
    setLoading(true);
    try {
      const res = await storeApi.recoverPassword(email);
      setRecoverStep(2);
      setAuthMsg(res.message);
      if (res.demoResetCode) {
        setDemoCodeNotice(res.demoResetCode);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al solicitar recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const res = await storeApi.resetPassword(email, resetCode, newPassword);
      setAuthMsg(res.message);
      setAuthMode('login');
      setRecoverStep(1);
      setDemoCodeNotice('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al cambiar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await storeApi.updateProfile({
      name: editName,
      phone: editPhone,
      documentId: editDoc,
    });
    onUserUpdated(res.user);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1800);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addrForm.street.trim() || !addrForm.city.trim()) return;
    const newAddr: UserAddress = {
      ...addrForm,
      id: `addr-${Date.now().toString(36)}`,
      isDefault: user.addresses.length === 0 ? true : addrForm.isDefault,
    };
    const nextList = newAddr.isDefault
      ? [...user.addresses.map((a) => ({ ...a, isDefault: false })), newAddr]
      : [...user.addresses, newAddr];
    const res = await storeApi.updateProfile({ addresses: nextList });
    onUserUpdated(res.user);
    setAddrForm({
      label: 'Oficina',
      department: 'Bogotá D.C.',
      city: 'Bogotá',
      street: '',
      neighborhood: '',
      notes: '',
      isDefault: false,
    });
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!user) return;
    const nextList = user.addresses.filter((a) => a.id !== addrId);
    const res = await storeApi.updateProfile({ addresses: nextList });
    onUserUpdated(res.user);
  };

  // ================= UNAUTHENTICATED VIEW =================
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="max-w-lg mx-auto bg-white border border-[#E2DDD5] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-1 p-1 bg-[#F2EDE4]">
            {[
              { id: 'login', label: 'Iniciar sesión' },
              { id: 'register', label: 'Crear cuenta' },
              { id: 'recover', label: 'Recuperar clave' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setAuthMode(m.id as typeof authMode);
                  setAuthError('');
                  setAuthMsg('');
                }}
                className={`flex-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  authMode === m.id ? 'bg-[#111111] text-white' : 'text-[#5C5852] hover:text-[#111111]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <h1 className="font-editorial text-2xl font-semibold text-[#111111]">
                  Bienvenido a URBAN STYLE
                </h1>
                <p className="text-xs text-[#5C5852]">
                  Accede a tus direcciones guardadas, favoritos y pedidos anteriores.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111111]">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111111]">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              {authError && <p className="text-xs text-red-700">{authError}</p>}
              {authMsg && <p className="text-xs text-[#936F31] font-medium">{authMsg}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111111] text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>

              <div className="pt-4 border-t border-[#E2DDD5] space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5852]">
                  Acceso rápido de prueba
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('cliente@urbanstyle.co', 'Cliente2026!')}
                    className="border border-[#E2DDD5] bg-[#FAF8F5] hover:border-[#111111] py-2 px-3 text-xs font-medium text-left cursor-pointer"
                  >
                    <span className="block font-semibold text-[#111111]">Cliente Demo</span>
                    <span className="text-[11px] text-[#5C5852] font-mono">cliente@urbanstyle.co</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin@urbanstyle.co', 'AdminUrban2026!')}
                    className="border border-[#C5A059] bg-[#FAF8F5] hover:bg-[#F2EDE4] py-2 px-3 text-xs font-medium text-left cursor-pointer"
                  >
                    <span className="block font-semibold text-[#111111]">Administrador Demo</span>
                    <span className="text-[11px] text-[#936F31] font-mono">admin@urbanstyle.co</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <h1 className="font-editorial text-2xl font-semibold text-[#111111]">
                  Crear Cuenta Personal
                </h1>
                <p className="text-xs text-[#5C5852]">
                  Guarda tus tallas favoritas, direcciones en Colombia e historial de compras.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111111]">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111111]">Correo electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Celular</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">Cédula / NIT</label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111111]">Contraseña (mín. 6 caracteres) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              {authError && <p className="text-xs text-red-700">{authError}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111111] text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                {loading ? 'Creando cuenta...' : 'Registrarme'}
              </button>
            </form>
          )}

          {authMode === 'recover' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="font-editorial text-2xl font-semibold text-[#111111] flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#B38B45]" />
                  Recuperar Contraseña
                </h1>
                <p className="text-xs text-[#5C5852]">
                  Genera un código temporal de verificación para restablecer tu clave.
                </p>
              </div>

              {recoverStep === 1 ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">Correo registrado</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cliente@urbanstyle.co"
                      className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                  {authError && <p className="text-xs text-red-700">{authError}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111111] text-white py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Enviar código de recuperación
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  {demoCodeNotice && (
                    <div className="bg-[#FAF8F5] border border-[#C5A059] p-3 text-xs">
                      Código generado (entorno local):{' '}
                      <strong className="font-mono text-sm">{demoCodeNotice}</strong>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">Código de 6 dígitos</label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">Nueva contraseña</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                  {authError && <p className="text-xs text-red-700">{authError}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111111] text-white py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Guardar nueva contraseña
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Guest Favorites Preview if any */}
        {favorites.length > 0 && (
          <div className="space-y-5 border-t border-[#E2DDD5] pt-8">
            <h2 className="font-editorial text-2xl font-semibold text-[#111111]">
              Tus Favoritos Guardados ({favoriteProducts.length})
            </h2>
            <ProductGrid
              products={favoriteProducts}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onAddToCart={onAddToCart}
              columns={4}
            />
          </div>
        )}
      </div>
    );
  }

  // ================= AUTHENTICATED ACCOUNT DASHBOARD =================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD5] pb-5">
        <div>
          <p className="text-xs text-[#936F31] uppercase tracking-[0.16em]">
            {user.role === 'admin' ? 'Cuenta Administrativa' : 'Mi Cuenta Urban Style'}
          </p>
          <h1 className="font-editorial text-3xl font-semibold text-[#111111] mt-1">
            Hola, {user.name}
          </h1>
          <p className="text-xs text-[#5C5852] mt-0.5">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="bg-[#C5A059] text-[#111111] px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2 hover:bg-[#B38B45] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Abrir Panel de Administración</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="border border-[#E2DDD5] bg-white text-[#111111] px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-2 hover:border-[#111111] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F2EDE4] w-fit overflow-x-auto max-w-full">
        {[
          { id: 'profile', label: 'Datos Personales', icon: UserIcon },
          { id: 'addresses', label: `Direcciones (${user.addresses.length})`, icon: MapPin },
          { id: 'orders', label: `Mis Pedidos (${orders.length})`, icon: Package },
          { id: 'favorites', label: `Favoritos (${favoriteProducts.length})`, icon: Heart },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                tab === item.id ? 'bg-[#111111] text-white' : 'text-[#5C5852] hover:text-[#111111]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="max-w-xl bg-white border border-[#E2DDD5] p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-[#111111]">Información Personal</h2>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#111111]">Nombre completo</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111111]">Celular</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111111]">Cédula / NIT</label>
              <input
                type="text"
                value={editDoc}
                onChange={(e) => setEditDoc(e.target.value)}
                className="w-full border border-[#E2DDD5] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#111111] text-white px-6 py-2.5 text-xs font-semibold hover:bg-[#2A2A2A] cursor-pointer"
            >
              Guardar cambios
            </button>
            {profileSaved && <span className="text-xs font-semibold text-[#936F31]">Perfil actualizado</span>}
          </div>
        </form>
      )}

      {tab === 'addresses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3">
            {user.addresses.length === 0 ? (
              <div className="bg-white border border-[#E2DDD5] p-6 text-sm text-[#5C5852]">
                Aún no tienes direcciones guardadas. Agrega una para agilizar tus compras.
              </div>
            ) : (
              user.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white border border-[#E2DDD5] p-4 flex items-start justify-between gap-4"
                >
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-[#111111]">
                      {addr.label} {addr.isDefault ? '· Predeterminada' : ''}
                    </p>
                    <p className="text-[#5C5852]">{addr.street}</p>
                    <p className="text-[#5C5852]">
                      {addr.neighborhood ? `${addr.neighborhood}, ` : ''}
                      {addr.city}, {addr.department}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-2 text-[#5C5852] hover:text-red-700 cursor-pointer"
                    aria-label="Eliminar dirección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddAddress} className="lg:col-span-5 bg-white border border-[#E2DDD5] p-5 space-y-3">
            <h3 className="font-semibold text-sm text-[#111111] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#B38B45]" />
              Nueva Dirección
            </h3>
            <input
              type="text"
              required
              value={addrForm.label}
              onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
              placeholder="Alias (Casa, Oficina)"
              className="w-full border border-[#E2DDD5] px-3 py-2 text-xs"
            />
            <select
              value={addrForm.department}
              onChange={(e) => setAddrForm({ ...addrForm, department: e.target.value })}
              className="w-full border border-[#E2DDD5] px-3 py-2 text-xs bg-white"
            >
              {COLOMBIA_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input
              type="text"
              required
              value={addrForm.city}
              onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
              placeholder="Ciudad"
              className="w-full border border-[#E2DDD5] px-3 py-2 text-xs"
            />
            <input
              type="text"
              required
              value={addrForm.street}
              onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
              placeholder="Dirección completa"
              className="w-full border border-[#E2DDD5] px-3 py-2 text-xs"
            />
            <input
              type="text"
              value={addrForm.neighborhood}
              onChange={(e) => setAddrForm({ ...addrForm, neighborhood: e.target.value })}
              placeholder="Barrio"
              className="w-full border border-[#E2DDD5] px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="w-full bg-[#111111] text-white py-2.5 text-xs font-semibold cursor-pointer"
            >
              Guardar dirección
            </button>
          </form>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          {ordersLoading ? (
            <p className="text-sm text-[#5C5852]">Cargando historial de pedidos...</p>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-[#E2DDD5] p-8 text-sm text-[#5C5852]">
              Todavía no has realizado pedidos con esta cuenta.
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-[#E2DDD5] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#111111]">{ord.orderNumber}</span>
                    <span className="text-xs font-semibold text-[#936F31]">{ord.status}</span>
                  </div>
                  <p className="text-xs text-[#5C5852]">
                    {new Date(ord.createdAt).toLocaleDateString('es-CO')} · {ord.items.length} prenda(s) · {ord.paymentMethod}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-bold tabular-nums text-[#111111]">
                    {formatCOP(ord.total)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onTrackOrder(ord.orderNumber)}
                    className="border border-[#111111] px-4 py-2 text-xs font-semibold hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
                  >
                    Rastrear pedido
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'favorites' && (
        <ProductGrid
          products={favoriteProducts}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onOpenDetail={onOpenDetail}
          onAddToCart={onAddToCart}
          columns={4}
          emptyTitle="Tu lista de favoritos está vacía"
          emptyDescription="Haz clic en el corazón de cualquier prenda para guardarla aquí."
        />
      )}
    </div>
  );
}
