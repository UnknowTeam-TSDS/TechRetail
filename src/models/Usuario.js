/**
 * Clase Usuario - Modelo de datos para clientes/tiendas registradas
 * TechRetail Solutions S.R.L.
 */

const PLANES_VALIDOS = ['Starter', 'Growth', 'Pro'];
  const usuarios = require('../storage/usuariosStorage');
  
class Usuario {
  constructor({ id = null, nombre, email, plan = 'Starter', empresa = '' }) {
  
    this.id = id ?? (usuarios.leerUsuarios().length + 1);
    this.nombre = nombre;
    this.email = email;
    this.plan = plan;
    this.empresa = empresa;
    this.activo = true;
    this.fechaRegistro = new Date().toISOString();
  }

  // Valida que el usuario tenga los datos mínimos requeridos
  esValido() {
    return (
      this.nombre &&
      this.email &&
      this.email.includes('@') &&
      PLANES_VALIDOS.includes(this.plan)
    );
  }

  // Retorna el precio mensual según el plan contratado
  getPrecioMensual() {
    const precios = {
      Starter: 12000,
      Growth: 28000,
      Pro: 55000,
    };
    return precios[this.plan] ?? 0;
  }

  // Retorna representación resumida del usuario
  resumen() {
    return `[${this.id}] ${this.nombre} (${this.empresa}) - Plan: ${this.plan}`;
  }
}

module.exports = Usuario;
