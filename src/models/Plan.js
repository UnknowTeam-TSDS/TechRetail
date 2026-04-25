class Plan {
  constructor({ id = null, nombre, descripcion, precio, tipo }) {
    this.id = id ?? (() => { const l = require('../storage/planesStorage').leerPlanes(); return l.length === 0 ? 1 : Math.max(...l.map(p => p.id)) + 1; })();
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = parseFloat(precio);
    this.tipo = tipo;
    this.fechaCreacion = new Date().toISOString();
  }

  esValido() {
    return this.nombre && this.precio > 0 && this.tipo;
  }

  resumen() {
    return `[${this.id}] ${this.nombre} - $${this.precio}`;
  }
}

module.exports = Plan;