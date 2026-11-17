import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  SEED_COUPONS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_PROMOTIONS,
  SEED_REVIEWS,
} from './server/seedData.ts';
import type {
  AdminStats,
  Coupon,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductReview,
  Promotion,
  ShippingCarrier,
  UserProfile,
} from './src/types/store.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'urban-style-bogota-atelier-2026-secret';

interface StoredUser extends UserProfile {
  passwordHash: string;
  resetCode?: string;
  resetExpiresAt?: number;
}

interface StoreDatabase {
  products: Product[];
  reviews: ProductReview[];
  users: StoredUser[];
  orders: Order[];
  coupons: Coupon[];
  promotions: Promotion[];
  orderSeq: number;
}

function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function signToken(payload: { uid: string; role: 'customer' | 'admin'; exp: number }): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): { uid: string; role: 'customer' | 'admin'; exp: number } | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      uid: string;
      role: 'customer' | 'admin';
      exp: number;
    };
    if (!data.uid || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _ph, resetCode: _rc, resetExpiresAt: _re, ...publicProfile } = user;
  return publicProfile;
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function createInitialDb(): StoreDatabase {
  const adminUser: StoredUser = {
    id: 'user-admin-1',
    name: 'Dirección Atelier Urban Style',
    email: 'admin@urbanstyle.co',
    phone: '3156514948',
    documentId: '900845123',
    role: 'admin',
    addresses: [
      {
        id: 'addr-admin-1',
        label: 'Atelier Principal',
        department: 'Bogotá D.C.',
        city: 'Bogotá',
        street: 'Carrera 13 # 82-45',
        neighborhood: 'Zona T',
        isDefault: true,
      },
    ],
    favorites: ['prod-005', 'prod-021'],
    createdAt: '2026-01-15T09:00:00.000Z',
    passwordHash: hashPassword('AdminUrban2026!'),
  };

  const demoCustomer: StoredUser = {
    id: 'user-cliente-1',
    name: 'Camila Martínez',
    email: 'cliente@urbanstyle.co',
    phone: '3156514948',
    documentId: '1020789456',
    role: 'customer',
    addresses: [
      {
        id: 'addr-cust-1',
        label: 'Casa Bogotá',
        department: 'Bogotá D.C.',
        city: 'Bogotá',
        street: 'Calle 85 # 14-28 Apto 402',
        neighborhood: 'El Virrey',
        notes: 'Dejar en portería',
        isDefault: true,
      },
      {
        id: 'addr-cust-2',
        label: 'Oficina Medellín',
        department: 'Antioquia',
        city: 'Medellín',
        street: 'Carrera 43A # 6 Sur-26',
        neighborhood: 'El Poblado',
        isDefault: false,
      },
    ],
    favorites: ['prod-001', 'prod-007', 'prod-037'],
    createdAt: '2026-06-10T12:00:00.000Z',
    passwordHash: hashPassword('Cliente2026!'),
  };

  return {
    products: structuredClone(SEED_PRODUCTS),
    reviews: structuredClone(SEED_REVIEWS),
    users: [adminUser, demoCustomer],
    orders: structuredClone(SEED_ORDERS),
    coupons: structuredClone(SEED_COUPONS),
    promotions: structuredClone(SEED_PROMOTIONS),
    orderSeq: 1004,
  };
}

function loadDatabase(): StoreDatabase {
  ensureDirectories();
  if (!fs.existsSync(STORE_PATH)) {
    const initial = createInitialDb();
    saveDatabase(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as StoreDatabase;
    if (!Array.isArray(parsed.products) || parsed.products.length === 0) {
      const initial = createInitialDb();
      saveDatabase(initial);
      return initial;
    }
    return parsed;
  } catch {
    const initial = createInitialDb();
    saveDatabase(initial);
    return initial;
  }
}

function saveDatabase(db: StoreDatabase) {
  ensureDirectories();
  const tmp = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, STORE_PATH);
}

const db = loadDatabase();

interface AuthRequest extends Request {
  authUser?: StoredUser;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

function attachOptionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = db.users.find((u) => u.id === decoded.uid);
      if (user) req.authUser = user;
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Debes iniciar sesión para continuar.' });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión nuevamente.' });
    return;
  }
  const user = db.users.find((u) => u.id === decoded.uid);
  if (!user) {
    res.status(401).json({ error: 'Usuario no encontrado.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.authUser?.role !== 'admin') {
      res.status(403).json({ error: 'Acceso restringido a administradores autorizados.' });
      return;
    }
    next();
  });
}

function computeShippingCost(carrier: ShippingCarrier, subtotalAfterDiscounts: number): number {
  switch (carrier) {
    case 'Recoger en Boutique Bogotá':
      return 0;
    case 'Coordinadora Express':
      return subtotalAfterDiscounts >= 450000 ? 0 : 22900;
    case 'Inter Rapidísimo':
      return subtotalAfterDiscounts >= 250000 ? 0 : 15900;
    case 'Servientrega Estándar':
    default:
      return subtotalAfterDiscounts >= 250000 ? 0 : 14900;
  }
}

function getTotalStock(product: Product): number {
  let total = 0;
  for (const s of Object.keys(product.stockByVariant || {})) {
    for (const c of Object.keys(product.stockByVariant[s] || {})) {
      total += Math.max(0, Number(product.stockByVariant[s][c] || 0));
    }
  }
  return total;
}

const app = express();
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// ==================== HEALTH & INTEGRATIONS ====================
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'urban-style-store', products: db.products.length });
});

app.get('/api/integrations/status', (_req, res) => {
  res.json({
    wompiConfigured: Boolean(process.env.WOMPI_PUBLIC_KEY && !process.env.WOMPI_PUBLIC_KEY.includes('your_wompi')),
    mercadoPagoConfigured: Boolean(
      process.env.MERCADOPAGO_ACCESS_TOKEN && !process.env.MERCADOPAGO_ACCESS_TOKEN.includes('your-mercadopago'),
    ),
    storageMode: 'local-persistent-json',
    paymentDemoMode: true,
  });
});

// ==================== PRODUCTS & REVIEWS ====================
app.get('/api/products', (_req, res) => {
  res.json({
    products: db.products,
    reviews: db.reviews,
  });
});

app.post('/api/products', requireAdmin, (req: AuthRequest, res: Response) => {
  const body = req.body as Partial<Product>;
  if (!body.name || !body.department || !body.category || !body.price) {
    res.status(400).json({ error: 'Nombre, departamento, categoría y precio son obligatorios.' });
    return;
  }
  const num = String(db.products.length + 1).padStart(3, '0');
  const id = `prod-${Date.now().toString(36)}`;
  const sizes = Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ['S', 'M', 'L'];
  const colors =
    Array.isArray(body.colors) && body.colors.length > 0
      ? body.colors
      : [{ name: 'Negro', hex: '#141414' }];

  const stockByVariant: Record<string, Record<string, number>> = body.stockByVariant || {};
  for (const s of sizes) {
    if (!stockByVariant[s]) stockByVariant[s] = {};
    for (const c of colors) {
      if (typeof stockByVariant[s][c.name] !== 'number') {
        stockByVariant[s][c.name] = 10;
      }
    }
  }

  const price = Math.max(1000, Math.round(Number(body.price)));
  const previousPrice = body.previousPrice ? Math.round(Number(body.previousPrice)) : undefined;
  const discountPercent =
    previousPrice && previousPrice > price
      ? Math.round(((previousPrice - price) / previousPrice) * 100)
      : Number(body.discountPercent || 0);

  const product: Product = {
    id,
    sku: body.sku || `US-26-${num}`,
    name: String(body.name).trim(),
    department: body.department,
    category: String(body.category),
    brand: String(body.brand || 'Urban Style Atelier'),
    collection: String(body.collection || 'Atelier Dorado'),
    description: String(body.description || 'Prenda exclusiva de colección Urban Style.'),
    material: String(body.material || 'Algodón orgánico premium'),
    careInstructions: String(
      body.careInstructions || 'Lavar en ciclo delicado con agua fría. Secar a la sombra.',
    ),
    price,
    previousPrice,
    discountPercent,
    images:
      Array.isArray(body.images) && body.images.length > 0
        ? body.images
        : ['/src/assets/images/mujer_blazer_negro_1794878548961.jpg'],
    sizes,
    colors,
    stockByVariant,
    rating: 5.0,
    reviewCount: 0,
    soldCount: 0,
    isBestSeller: Boolean(body.isBestSeller),
    isNewArrival: body.isNewArrival ?? true,
    isFeatured: Boolean(body.isFeatured),
    isClearance: Boolean(body.isClearance),
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(product);
  saveDatabase(db);
  res.status(201).json({ product });
});

app.put('/api/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }
  const existing = db.products[idx];
  const patch = req.body as Partial<Product>;
  const price = patch.price !== undefined ? Math.max(1000, Math.round(Number(patch.price))) : existing.price;
  const previousPrice =
    patch.previousPrice !== undefined
      ? patch.previousPrice
        ? Math.round(Number(patch.previousPrice))
        : undefined
      : existing.previousPrice;
  const discountPercent =
    previousPrice && previousPrice > price
      ? Math.round(((previousPrice - price) / previousPrice) * 100)
      : patch.discountPercent !== undefined
        ? Number(patch.discountPercent)
        : existing.discountPercent;

  const updated: Product = {
    ...existing,
    ...patch,
    id: existing.id,
    price,
    previousPrice,
    discountPercent,
  };

  db.products[idx] = updated;
  saveDatabase(db);
  res.json({ product: updated });
});

app.delete('/api/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }
  db.products.splice(idx, 1);
  saveDatabase(db);
  res.json({ ok: true });
});

app.post('/api/products/:id/reviews', requireAuth, (req: AuthRequest, res: Response) => {
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }
  const { rating, comment, city } = req.body as { rating?: number; comment?: string; city?: string };
  if (!comment || comment.trim().length < 5) {
    res.status(400).json({ error: 'Escribe una opinión de al menos 5 caracteres.' });
    return;
  }
  const safeRating = Math.min(5, Math.max(1, Math.round(Number(rating || 5))));
  const review: ProductReview = {
    id: `rev-${Date.now().toString(36)}`,
    productId: product.id,
    userName: req.authUser!.name,
    city: String(city || req.authUser!.addresses?.[0]?.city || 'Colombia'),
    rating: safeRating,
    comment: comment.trim().slice(0, 500),
    createdAt: new Date().toISOString(),
    verifiedPurchase: db.orders.some(
      (o) => o.userId === req.authUser!.id && o.items.some((i) => i.productId === product.id),
    ),
  };
  db.reviews.unshift(review);
  const prodReviews = db.reviews.filter((r) => r.productId === product.id);
  const avg = prodReviews.reduce((acc, r) => acc + r.rating, 0) / prodReviews.length;
  product.rating = Number(avg.toFixed(1));
  product.reviewCount = prodReviews.length;
  saveDatabase(db);
  res.status(201).json({ review, product });
});

app.post('/api/upload', requireAdmin, (req: AuthRequest, res: Response) => {
  const { dataUrl, filename } = req.body as { dataUrl?: string; filename?: string };
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    res.status(400).json({ error: 'Formato de imagen inválido.' });
    return;
  }
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    res.status(400).json({ error: 'Solo se admiten imágenes PNG, JPG o WEBP.' });
    return;
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const safeBase = String(filename || 'prenda')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32) || 'prenda';
  const finalName = `${safeBase}_${Date.now()}.${ext}`;
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    res.status(400).json({ error: 'La imagen supera el límite de 5 MB.' });
    return;
  }
  ensureDirectories();
  fs.writeFileSync(path.join(UPLOADS_DIR, finalName), buffer);
  res.status(201).json({ url: `/uploads/${finalName}` });
});

// ==================== AUTH & PROFILE ====================
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, documentId } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    documentId?: string;
  };
  if (!name || !email || !password || password.length < 6) {
    res.status(400).json({ error: 'Nombre, correo válido y contraseña (mínimo 6 caracteres) son obligatorios.' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    return;
  }
  const newUser: StoredUser = {
    id: `user-${Date.now().toString(36)}`,
    name: name.trim(),
    email: normalizedEmail,
    phone: String(phone || '').trim(),
    documentId: String(documentId || '').trim(),
    role: 'customer',
    addresses: [],
    favorites: [],
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };
  db.users.push(newUser);
  saveDatabase(db);
  const token = signToken({ uid: newUser.id, role: newUser.role, exp: Date.now() + 7 * 86400 * 1000 });
  res.status(201).json({ token, user: sanitizeUser(newUser) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
    return;
  }
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
    return;
  }
  const token = signToken({ uid: user.id, role: user.role, exp: Date.now() + 7 * 86400 * 1000 });
  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/recover', (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: 'Ingresa tu correo electrónico.' });
    return;
  }
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    res.status(404).json({ error: 'No encontramos una cuenta asociada a ese correo.' });
    return;
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  user.resetCode = code;
  user.resetExpiresAt = Date.now() + 15 * 60 * 1000;
  saveDatabase(db);
  res.json({
    ok: true,
    message: 'Código de recuperación generado (válido por 15 minutos).',
    demoResetCode: code,
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body as {
    email?: string;
    code?: string;
    newPassword?: string;
  };
  if (!email || !code || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Correo, código y nueva contraseña (mín. 6 caracteres) son requeridos.' });
    return;
  }
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.resetCode !== code.trim() || !user.resetExpiresAt || user.resetExpiresAt < Date.now()) {
    res.status(400).json({ error: 'El código de verificación es inválido o expiró.' });
    return;
  }
  user.passwordHash = hashPassword(newPassword);
  delete user.resetCode;
  delete user.resetExpiresAt;
  saveDatabase(db);
  res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: sanitizeUser(req.authUser!) });
});

app.put('/api/auth/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.authUser!;
  const { name, phone, documentId, addresses, favorites } = req.body as Partial<UserProfile>;
  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (typeof phone === 'string') user.phone = phone.trim();
  if (typeof documentId === 'string') user.documentId = documentId.trim();
  if (Array.isArray(addresses)) user.addresses = addresses;
  if (Array.isArray(favorites)) user.favorites = favorites;
  saveDatabase(db);
  res.json({ user: sanitizeUser(user) });
});

app.post('/api/auth/favorites/toggle', requireAuth, (req: AuthRequest, res: Response) => {
  const { productId } = req.body as { productId?: string };
  if (!productId) {
    res.status(400).json({ error: 'ID de producto requerido.' });
    return;
  }
  const user = req.authUser!;
  if (user.favorites.includes(productId)) {
    user.favorites = user.favorites.filter((id) => id !== productId);
  } else {
    user.favorites.push(productId);
  }
  saveDatabase(db);
  res.json({ favorites: user.favorites });
});

// ==================== PROMOTIONS & COUPONS ====================
app.get('/api/promotions', (_req, res) => {
  res.json({
    coupons: db.coupons,
    promotions: db.promotions,
  });
});

app.post('/api/coupons/validate', (req, res) => {
  const { code, subtotal } = req.body as { code?: string; subtotal?: number };
  if (!code) {
    res.status(400).json({ error: 'Ingresa un código de cupón.' });
    return;
  }
  const coupon = db.coupons.find(
    (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.active,
  );
  if (!coupon) {
    res.status(404).json({ error: 'El cupón ingresado no existe o no está activo.' });
    return;
  }
  const amount = Number(subtotal || 0);
  if (amount < coupon.minOrderCop) {
    res.status(400).json({
      error: `Este cupón aplica para compras desde $${coupon.minOrderCop.toLocaleString('es-CO')} COP.`,
    });
    return;
  }
  const discount =
    coupon.type === 'percentage' ? Math.round((amount * coupon.value) / 100) : Math.min(amount, coupon.value);
  res.json({ coupon, discount });
});

app.post('/api/admin/coupons', requireAdmin, (req: AuthRequest, res: Response) => {
  const body = req.body as Partial<Coupon>;
  if (!body.code || !body.value) {
    res.status(400).json({ error: 'Código y valor de descuento son obligatorios.' });
    return;
  }
  const coupon: Coupon = {
    id: `cup-${Date.now().toString(36)}`,
    code: body.code.trim().toUpperCase(),
    description: String(body.description || 'Cupón promocional Urban Style'),
    type: body.type === 'fixed' ? 'fixed' : 'percentage',
    value: Math.max(1, Number(body.value)),
    minOrderCop: Math.max(0, Number(body.minOrderCop || 0)),
    active: body.active ?? true,
    expiresAt: body.expiresAt || '2026-12-31T23:59:59.000Z',
  };
  db.coupons.unshift(coupon);
  saveDatabase(db);
  res.status(201).json({ coupon });
});

app.patch('/api/admin/coupons/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const coupon = db.coupons.find((c) => c.id === req.params.id);
  if (!coupon) {
    res.status(404).json({ error: 'Cupón no encontrado.' });
    return;
  }
  Object.assign(coupon, req.body);
  saveDatabase(db);
  res.json({ coupon });
});

app.delete('/api/admin/coupons/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const idx = db.coupons.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Cupón no encontrado.' });
    return;
  }
  db.coupons.splice(idx, 1);
  saveDatabase(db);
  res.json({ ok: true });
});

// ==================== ORDERS & CHECKOUT ====================
app.post('/api/orders', attachOptionalAuth, (req: AuthRequest, res: Response) => {
  const {
    items,
    customer,
    shippingAddress,
    carrier,
    paymentMethod,
    couponCode,
  } = req.body as {
    items: Array<{ productId: string; size: string; color: string; quantity: number }>;
    customer: Order['customer'];
    shippingAddress: Order['shippingAddress'];
    carrier: ShippingCarrier;
    paymentMethod: PaymentMethod;
    couponCode?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Tu carrito está vacío.' });
    return;
  }
  if (!customer?.name || !customer?.email || !customer?.phone || !shippingAddress?.street || !shippingAddress?.city) {
    res.status(400).json({ error: 'Completa todos los datos del comprador y dirección de entrega.' });
    return;
  }

  // Validate stock across all line items before mutating anything
  const orderItems: OrderItem[] = [];
  let subtotal = 0;
  let totalQty = 0;

  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) {
      res.status(404).json({ error: `Producto no encontrado (${item.productId}).` });
      return;
    }
    const qty = Math.max(1, Math.floor(Number(item.quantity)));
    const avail = Number(product.stockByVariant?.[item.size]?.[item.color] ?? 0);
    if (avail < qty) {
      res.status(409).json({
        error: `Stock insuficiente para "${product.name}" (${item.size} / ${item.color}). Disponibles: ${avail}.`,
      });
      return;
    }
    const lineTotal = product.price * qty;
    subtotal += lineTotal;
    totalQty += qty;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      image: product.images[0],
      size: item.size,
      color: item.color,
      quantity: qty,
      unitPrice: product.price,
      lineTotal,
    });
  }

  // Quantity discount rule (3+ items -> 10% automatic promo if active)
  const qtyPromo = db.promotions.find((p) => p.type === 'quantity' && p.active);
  const quantityDiscount =
    qtyPromo && totalQty >= (qtyPromo.minQuantity || 3)
      ? Math.round((subtotal * qtyPromo.discountPercent) / 100)
      : 0;

  // Coupon discount
  let couponDiscount = 0;
  let appliedCouponCode: string | undefined;
  if (couponCode && couponCode.trim()) {
    const coupon = db.coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active,
    );
    if (coupon && subtotal >= coupon.minOrderCop) {
      appliedCouponCode = coupon.code;
      const baseForCoupon = Math.max(0, subtotal - quantityDiscount);
      couponDiscount =
        coupon.type === 'percentage'
          ? Math.round((baseForCoupon * coupon.value) / 100)
          : Math.min(baseForCoupon, coupon.value);
    }
  }

  const netMerchandise = Math.max(0, subtotal - quantityDiscount - couponDiscount);
  const shippingCost = computeShippingCost(carrier || 'Servientrega Estándar', netMerchandise);
  const total = netMerchandise + shippingCost;

  // Atomically decrement variant inventory & increment soldCount
  for (const line of orderItems) {
    const product = db.products.find((p) => p.id === line.productId)!;
    product.stockByVariant[line.size][line.color] = Math.max(
      0,
      product.stockByVariant[line.size][line.color] - line.quantity,
    );
    product.soldCount += line.quantity;
  }

  const orderNumber = `US-2026-${db.orderSeq++}`;
  const now = new Date().toISOString();
  const initialStatus: OrderStatus = 'Pedido recibido';
  const gatewayRef = `DEMO-${paymentMethod.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6)}-${Math.floor(
    100000 + Math.random() * 899999,
  )}`;

  const order: Order = {
    id: `ord-${Date.now().toString(36)}`,
    orderNumber,
    userId: req.authUser?.id ?? null,
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim().toLowerCase(),
      phone: customer.phone.trim(),
      documentId: String(customer.documentId || '').trim(),
    },
    shippingAddress: {
      department: shippingAddress.department,
      city: shippingAddress.city.trim(),
      street: shippingAddress.street.trim(),
      neighborhood: String(shippingAddress.neighborhood || '').trim(),
      notes: shippingAddress.notes?.trim(),
    },
    carrier: carrier || 'Servientrega Estándar',
    shippingCost,
    paymentMethod,
    paymentMode: 'demo',
    paymentGatewayRef: gatewayRef,
    couponCode: appliedCouponCode,
    subtotal,
    quantityDiscount,
    couponDiscount,
    total,
    items: orderItems,
    status: initialStatus,
    timeline: [
      {
        status: initialStatus,
        timestamp: now,
        note: `Pedido registrado en modo demostración (${paymentMethod}). Ref: ${gatewayRef}`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.orders.unshift(order);
  saveDatabase(db);
  res.status(201).json({ order, products: db.products });
});

app.get('/api/orders/my', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.authUser!;
  const myOrders = db.orders.filter(
    (o) => o.userId === user.id || o.customer.email.toLowerCase() === user.email.toLowerCase(),
  );
  res.json({ orders: myOrders });
});

app.get('/api/orders/track/:orderNumber', (req, res) => {
  const target = req.params.orderNumber.trim().toUpperCase();
  const order = db.orders.find((o) => o.orderNumber.toUpperCase() === target);
  if (!order) {
    res.status(404).json({ error: `No encontramos ningún pedido con el número ${target}.` });
    return;
  }
  res.json({ order });
});

// ==================== ADMIN DASHBOARD & MANAGEMENT ====================
app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  res.json({ orders: db.orders });
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, note } = req.body as { status?: OrderStatus; note?: string };
  const validStatuses: OrderStatus[] = [
    'Pedido recibido',
    'Pago confirmado',
    'En preparación',
    'Enviado',
    'En camino',
    'Entregado',
    'Cancelado',
  ];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Estado de pedido inválido.' });
    return;
  }
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Pedido no encontrado.' });
    return;
  }

  // Restore inventory if transitioning to Cancelado from active state
  if (status === 'Cancelado' && order.status !== 'Cancelado') {
    for (const item of order.items) {
      const p = db.products.find((prod) => prod.id === item.productId);
      if (p) {
        if (!p.stockByVariant[item.size]) p.stockByVariant[item.size] = {};
        p.stockByVariant[item.size][item.color] =
          (p.stockByVariant[item.size][item.color] || 0) + item.quantity;
        p.soldCount = Math.max(0, p.soldCount - item.quantity);
      }
    }
  }

  const now = new Date().toISOString();
  order.status = status;
  order.updatedAt = now;
  order.timeline.push({
    status,
    timestamp: now,
    note: note?.trim() || `Estado actualizado a "${status}" por administración.`,
  });

  saveDatabase(db);
  res.json({ order, products: db.products });
});

app.get('/api/admin/customers', requireAdmin, (_req, res) => {
  const customers = db.users
    .filter((u) => u.role === 'customer')
    .map((u) => {
      const custOrders = db.orders.filter(
        (o) => o.userId === u.id || o.customer.email.toLowerCase() === u.email.toLowerCase(),
      );
      const totalSpent = custOrders
        .filter((o) => o.status !== 'Cancelado')
        .reduce((sum, o) => sum + o.total, 0);
      return {
        ...sanitizeUser(u),
        orderCount: custOrders.length,
        totalSpent,
      };
    });
  res.json({ customers });
});

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const activeOrders = db.orders.filter((o) => o.status !== 'Cancelado');
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const totalSales = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const todayRevenue = activeOrders
    .filter((o) => o.createdAt.startsWith(todayPrefix))
    .reduce((sum, o) => sum + o.total, 0);
  const productsSold = db.products.reduce((sum, p) => sum + p.soldCount, 0);
  const outOfStockProducts = db.products.filter((p) => getTotalStock(p) === 0).length;
  const registeredCustomers = db.users.filter((u) => u.role === 'customer').length;

  const topSellingProducts = [...db.products]
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      department: p.department,
      soldCount: p.soldCount,
      revenue: p.soldCount * p.price,
      stock: getTotalStock(p),
    }));

  const stats: AdminStats = {
    totalSales,
    todayRevenue,
    orderCount: db.orders.length,
    productsSold,
    outOfStockProducts,
    registeredCustomers,
    topSellingProducts,
  };

  res.json({ stats });
});

// ==================== VITE / STATIC SERVING ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`URBAN STYLE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start URBAN STYLE server:', err);
  process.exit(1);
});
