// Catálogo de medios de pago y envío que ofrece la plataforma.
// Todo es simulado: no hay integración real con pasarelas ni con couriers.
// Centralizar las opciones acá permite usar la misma fuente de verdad
// en el panel guiado del dueño y en el checkout público de la tienda.

const MEDIOS_PAGO = [
  { id: 'mercadopago', nombre: 'MercadoPago', detalle: 'Pago online con tarjeta, dinero en cuenta o QR.' },
  { id: 'transferencia', nombre: 'Transferencia bancaria', detalle: 'El cliente transfiere a tu CBU o alias.' },
  { id: 'tarjeta', nombre: 'Tarjeta de crédito/débito', detalle: 'Cobro con tarjeta a coordinar con el cliente.' },
  { id: 'efectivo', nombre: 'Efectivo', detalle: 'Pago en efectivo al retirar o recibir el pedido.' },
];

const MEDIOS_ENVIO = [
  { id: 'correo_argentino', nombre: 'Correo Argentino', detalle: 'Envío a domicilio a todo el país.' },
  { id: 'oca', nombre: 'OCA', detalle: 'Envío a domicilio o retiro en sucursal.' },
  { id: 'retiro_local', nombre: 'Retiro en el local', detalle: 'El cliente retira por tu dirección.' },
  { id: 'envio_gratis', nombre: 'Envío gratis', detalle: 'Bonificás el envío desde un monto mínimo de compra.' },
];

const idsDe = (catalogo) => catalogo.map((opcion) => opcion.id);

// Resuelve un arreglo de ids guardados a los objetos completos del catálogo,
// respetando el orden del catálogo (no el de selección del usuario).
const resolver = (catalogo, ids = []) =>
  catalogo.filter((opcion) => (ids || []).includes(opcion.id));

module.exports = {
  MEDIOS_PAGO,
  MEDIOS_ENVIO,
  PAGO_IDS: idsDe(MEDIOS_PAGO),
  ENVIO_IDS: idsDe(MEDIOS_ENVIO),
  resolver,
};
