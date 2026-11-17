/**
 * Configuración preparada para pasarelas de pago colombianas y servicios externos.
 * Las credenciales sensibles (llaves privadas y tokens) deben definirse en variables
 * de entorno del servidor (.env) y nunca exponerse en el código cliente.
 */
export const PAYMENT_GATEWAY_CONFIG = {
  wompi: {
    checkoutUrl: 'https://checkout.wompi.co/p/',
    currency: 'COP',
    supportedMethods: ['NEQUI', 'PSE', 'CARD', 'BANCOLOMBIA_TRANSFER'],
    envVarsRequired: ['WOMPI_PUBLIC_KEY', 'WOMPI_INTEGRITY_SECRET'],
  },
  mercadoPago: {
    sdkUrl: 'https://sdk.mercadopago.com/js/v2',
    country: 'CO',
    currency: 'COP',
    envVarsRequired: ['MERCADOPAGO_ACCESS_TOKEN'],
  },
} as const;
