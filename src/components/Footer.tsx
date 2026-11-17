import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Department } from '../types/store';
import type { ActiveView } from './Header';

interface FooterProps {
  onSelectDepartment: (dept: Department | 'Todos', onlyDiscounts?: boolean) => void;
  onNavigate: (view: ActiveView) => void;
  onOpenSizeGuide: () => void;
}

export function Footer({ onSelectDepartment, onNavigate, onOpenSizeGuide }: FooterProps) {
  return (
    <footer className="bg-[#111111] text-[#FAF8F5] border-t border-[#2A2A2A] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand & Contact */}
        <div className="space-y-4">
          <h2 className="font-editorial text-2xl font-semibold tracking-[0.12em] text-white">
            URBAN STYLE
          </h2>
          <p className="text-sm text-[#D8D2C8] leading-relaxed">
            Moda contemporánea diseñada en Colombia. Sastrería urbana, fibras orgánicas y accesorios de cuero legítimo con envíos nacionales.
          </p>
          <div className="space-y-2 text-xs text-[#D8D2C8] pt-2">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>Atelier Zona T · Carrera 13 # 82-45, Bogotá D.C.</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>+57 315 651 4948 · Lun–Sáb 9:00 a.m. – 7:00 p.m.</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>atencion@urbanstyle.co</span>
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#C5A059]">
            Colecciones
          </h3>
          <ul className="space-y-2.5 text-sm text-[#D8D2C8]">
            <li>
              <button
                type="button"
                onClick={() => onSelectDepartment('Mujer')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Moda Mujer
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectDepartment('Hombre')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Moda Hombre
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectDepartment('Niños')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Colección Niños
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectDepartment('Accesorios')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Accesorios y Cuero
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectDepartment('Todos', true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Descuentos y Liquidación
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Service */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#C5A059]">
            Servicio al Cliente
          </h3>
          <ul className="space-y-2.5 text-sm text-[#D8D2C8]">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('tracking')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Seguimiento de pedidos
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onOpenSizeGuide}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Guía de tallas
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('faq')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Preguntas frecuentes (FAQ)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('account')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Mi cuenta y favoritos
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Acceso administrativo
              </button>
            </li>
          </ul>
        </div>

        {/* Legal & Direct Contact */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#C5A059]">
            Garantía y Legal
          </h3>
          <ul className="space-y-2.5 text-sm text-[#D8D2C8]">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Política de privacidad y datos
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Términos y condiciones de compra
              </button>
            </li>
          </ul>

          <div className="pt-2">
            <a
              href="https://wa.me/573156514948?text=Hola%20Urban%20Style,%20quisiera%20asesor%C3%ADa%20sobre%20una%20prenda"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#C5A059] text-[#111111] px-4 py-2.5 text-xs font-semibold hover:bg-[#B38B45] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Asesoría por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2A2A2A] py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A39E96]">
          <p>© {new Date().getFullYear()} URBAN STYLE – FASHION STORE. Todos los derechos reservados.</p>
          <p>Pagos protegidos · Nequi · Daviplata · PSE · Tarjetas · Contra Entrega en Colombia</p>
        </div>
      </div>
    </footer>
  );
}
