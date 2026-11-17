import { ArrowLeft } from 'lucide-react';

interface InfoPagesViewProps {
  page: 'faq' | 'privacy' | 'terms';
  onBack: () => void;
}

export function InfoPagesView({ page, onBack }: InfoPagesViewProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#5C5852] hover:text-[#111111] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la tienda</span>
      </button>

      {page === 'faq' && (
        <div className="bg-white border border-[#E2DDD5] p-8 space-y-6">
          <h1 className="font-editorial text-3xl font-semibold text-[#111111]">
            Preguntas Frecuentes (FAQ)
          </h1>
          <div className="divide-y divide-[#E2DDD5] space-y-4">
            <div className="pt-2 space-y-1.5">
              <h2 className="text-sm font-semibold text-[#111111]">
                ¿Cuánto tarda el envío en Colombia?
              </h2>
              <p className="text-sm text-[#5C5852] leading-relaxed">
                Bogotá y ciudades principales (Medellín, Cali, Barranquilla, Bucaramanga) entre 2 y 4 días hábiles con Servientrega o Inter Rapidísimo, y 24 a 48 horas con Coordinadora Express.
              </p>
            </div>
            <div className="pt-4 space-y-1.5">
              <h2 className="text-sm font-semibold text-[#111111]">
                ¿Cómo funcionan los cambios de talla o devoluciones?
              </h2>
              <p className="text-sm text-[#5C5852] leading-relaxed">
                Tienes hasta 30 días calendario tras recibir tu pedido para solicitar cambio de talla sin costo adicional o derecho de retracto dentro de los primeros 5 días hábiles, conservando las etiquetas originales.
              </p>
            </div>
            <div className="pt-4 space-y-1.5">
              <h2 className="text-sm font-semibold text-[#111111]">
                ¿Qué métodos de pago aceptan?
              </h2>
              <p className="text-sm text-[#5C5852] leading-relaxed">
                Aceptamos Nequi, Daviplata, PSE, tarjetas débito y crédito, transferencia bancaria y Pago Contra Entrega en toda la red urbana nacional.
              </p>
            </div>
            <div className="pt-4 space-y-1.5">
              <h2 className="text-sm font-semibold text-[#111111]">
                ¿Cómo aplico un cupón o el descuento por cantidad?
              </h2>
              <p className="text-sm text-[#5C5852] leading-relaxed">
                Al agregar 3 o más prendas al carrito se aplica automáticamente un 10% de descuento adicional. Adicionalmente puedes ingresar códigos promocionales como URBAN15 en tu bolsa de compras.
              </p>
            </div>
          </div>
        </div>
      )}

      {page === 'privacy' && (
        <div className="bg-white border border-[#E2DDD5] p-8 space-y-4 text-sm text-[#5C5852] leading-relaxed">
          <h1 className="font-editorial text-3xl font-semibold text-[#111111]">
            Política de Privacidad y Protección de Datos
          </h1>
          <p>
            En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia, URBAN STYLE – FASHION STORE protege la confidencialidad de los datos personales suministrados por sus clientes.
          </p>
          <p>
            La información de contacto, identificación y direcciones de entrega se utiliza exclusivamente para gestionar pedidos, coordinar entregas con transportadoras aliadas, emitir facturación y brindar soporte posventa.
          </p>
          <p>
            Puedes actualizar, rectificar o solicitar la supresión de tu información en cualquier momento desde la sección Mi Cuenta o escribiendo a atencion@urbanstyle.co.
          </p>
        </div>
      )}

      {page === 'terms' && (
        <div className="bg-white border border-[#E2DDD5] p-8 space-y-4 text-sm text-[#5C5852] leading-relaxed">
          <h1 className="font-editorial text-3xl font-semibold text-[#111111]">
            Términos y Condiciones de Compra
          </h1>
          <p>
            Todos los precios publicados en URBAN STYLE – FASHION STORE están expresados en Pesos Colombianos (COP) e incluyen el IVA aplicable según la normativa vigente.
          </p>
          <p>
            La disponibilidad de inventario se valida por combinación exacta de talla y color al momento de confirmar el pedido. Las promociones, combos y cupones de descuento están sujetos a vigencia y monto mínimo indicado.
          </p>
          <p>
            En el entorno actual de demostración, las pasarelas Wompi y Mercado Pago operan en modo de prueba sin efectuar débitos reales hasta conectar las llaves productivas en la configuración del servidor.
          </p>
        </div>
      )}
    </div>
  );
}
