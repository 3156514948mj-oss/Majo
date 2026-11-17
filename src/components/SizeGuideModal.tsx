import { useState } from 'react';
import { Ruler, X } from 'lucide-react';

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'Mujer' | 'Hombre' | 'Niños';
}

export function SizeGuideModal({ open, onClose, initialTab = 'Mujer' }: SizeGuideModalProps) {
  const [tab, setTab] = useState<'Mujer' | 'Hombre' | 'Niños'>(initialTab);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Guía de tallas Urban Style"
    >
      <div className="w-full max-w-2xl bg-white border border-[#E2DDD5] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <Ruler className="w-5 h-5 text-[#B38B45]" />
            <h2 className="text-lg font-semibold text-[#111111]">Guía de Tallas (Medidas en cm)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5C5852] hover:text-[#111111] transition-colors cursor-pointer"
            aria-label="Cerrar guía de tallas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-1 p-1 bg-[#F2EDE4] w-fit">
            {(['Mujer', 'Hombre', 'Niños'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === item
                    ? 'bg-[#111111] text-white'
                    : 'text-[#5C5852] hover:text-[#111111]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === 'Mujer' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E2DDD5] text-[#5C5852] text-xs">
                    <th className="py-2.5 pr-4 font-semibold">Talla</th>
                    <th className="py-2.5 px-4 font-semibold">Busto (cm)</th>
                    <th className="py-2.5 px-4 font-semibold">Cintura (cm)</th>
                    <th className="py-2.5 px-4 font-semibold">Cadera (cm)</th>
                    <th className="py-2.5 pl-4 font-semibold">Jean COL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]/70 tabular-nums">
                  <tr><td className="py-2.5 pr-4 font-semibold">XS</td><td className="py-2.5 px-4">82 - 86</td><td className="py-2.5 px-4">62 - 66</td><td className="py-2.5 px-4">88 - 92</td><td className="py-2.5 pl-4">26 - 28</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">S</td><td className="py-2.5 px-4">87 - 91</td><td className="py-2.5 px-4">67 - 71</td><td className="py-2.5 px-4">93 - 97</td><td className="py-2.5 pl-4">28 - 30</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">M</td><td className="py-2.5 px-4">92 - 97</td><td className="py-2.5 px-4">72 - 77</td><td className="py-2.5 px-4">98 - 103</td><td className="py-2.5 pl-4">30 - 32</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">L</td><td className="py-2.5 px-4">98 - 104</td><td className="py-2.5 px-4">78 - 84</td><td className="py-2.5 px-4">104 - 110</td><td className="py-2.5 pl-4">32 - 34</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">XL</td><td className="py-2.5 px-4">105 - 112</td><td className="py-2.5 px-4">85 - 92</td><td className="py-2.5 px-4">111 - 118</td><td className="py-2.5 pl-4">34 - 36</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Hombre' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E2DDD5] text-[#5C5852] text-xs">
                    <th className="py-2.5 pr-4 font-semibold">Talla</th>
                    <th className="py-2.5 px-4 font-semibold">Pecho (cm)</th>
                    <th className="py-2.5 px-4 font-semibold">Cintura (cm)</th>
                    <th className="py-2.5 px-4 font-semibold">Cadera (cm)</th>
                    <th className="py-2.5 pl-4 font-semibold">Pantalón / Jean</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]/70 tabular-nums">
                  <tr><td className="py-2.5 pr-4 font-semibold">S</td><td className="py-2.5 px-4">90 - 95</td><td className="py-2.5 px-4">76 - 81</td><td className="py-2.5 px-4">92 - 96</td><td className="py-2.5 pl-4">28 - 30</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">M</td><td className="py-2.5 px-4">96 - 102</td><td className="py-2.5 px-4">82 - 87</td><td className="py-2.5 px-4">97 - 102</td><td className="py-2.5 pl-4">30 - 32</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">L</td><td className="py-2.5 px-4">103 - 109</td><td className="py-2.5 px-4">88 - 94</td><td className="py-2.5 px-4">103 - 108</td><td className="py-2.5 pl-4">32 - 34</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">XL</td><td className="py-2.5 px-4">110 - 117</td><td className="py-2.5 px-4">95 - 102</td><td className="py-2.5 px-4">109 - 115</td><td className="py-2.5 pl-4">34 - 36</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Niños' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E2DDD5] text-[#5C5852] text-xs">
                    <th className="py-2.5 pr-4 font-semibold">Talla</th>
                    <th className="py-2.5 px-4 font-semibold">Edad aprox.</th>
                    <th className="py-2.5 px-4 font-semibold">Estatura (cm)</th>
                    <th className="py-2.5 pl-4 font-semibold">Pecho (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]/70 tabular-nums">
                  <tr><td className="py-2.5 pr-4 font-semibold">4-6</td><td className="py-2.5 px-4">4 a 6 años</td><td className="py-2.5 px-4">104 - 118</td><td className="py-2.5 pl-4">56 - 61</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">8-10</td><td className="py-2.5 px-4">8 a 10 años</td><td className="py-2.5 px-4">126 - 140</td><td className="py-2.5 pl-4">64 - 71</td></tr>
                  <tr><td className="py-2.5 pr-4 font-semibold">12-14</td><td className="py-2.5 px-4">12 a 14 años</td><td className="py-2.5 px-4">148 - 162</td><td className="py-2.5 pl-4">74 - 82</td></tr>
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-[#5C5852] bg-[#FAF8F5] p-3 border border-[#E2DDD5]">
            Consejo Atelier: Si prefieres un calce relajado u oversize en camisetas y chaquetas, elige tu talla habitual; nuestras siluetas boxy ya incorporan holgura arquitectónica. Cambios de talla gratis durante 30 días.
          </p>
        </div>
      </div>
    </div>
  );
}
