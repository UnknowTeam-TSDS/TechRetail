/**
 * Clase Plan - Modelo de datos para planes de suscripción y add-ons
 * TechRetail Solutions S.R.L.
 */

class Plan {
  constructor({ id = null, nombre, descripcion, precio, tipo }) {
    // Genera un ID autoincremental basado en el máximo ID existente en el JSON
    this.id = id ?? (() => {
      const l = require('../storage/planesStorage').leerPlanes();
      return l.length === 0 ? 1 : Math.max(...l.map(p => p.id)) + 1;
    })();
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = parseFloat(precio); // Asegura que el precio sea un número decimal
    this.tipo = tipo;                 // Valores posibles: 'plan' o 'addon'
    this.fechaCreacion = new Date().toISOString();
  }

  // Valida que los campos obligatorios estén presentes y sean correctos
  esValido() {
    return this.nombre && this.precio > 0 && this.tipo;
  }

  // Retorna representación resumida del plan
  resumen() {
    return `[${this.id}] ${this.nombre} - $${this.precio}`;
  }
}

module.exports = Plan;
