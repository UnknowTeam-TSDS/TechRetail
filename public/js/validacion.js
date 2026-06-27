/*
  Validación de formularios — mensajes en español.
  Traduce los mensajes nativos del navegador (que salen en inglés) usando
  los eventos `invalid` e `input`. Los campos de contraseña con su propia
  política (data-password-policy / data-password-confirm) los maneja password.js.
*/
(function () {
  function mensajeDeError(campo) {
    var v = campo.validity;

    if (v.valueMissing) {
      if (campo.tagName === 'SELECT') return 'Elegí una opción.';
      if (campo.type === 'checkbox' || campo.type === 'radio') return 'Marcá esta opción para continuar.';
      return 'Completá este campo.';
    }
    if (v.typeMismatch) {
      if (campo.type === 'email') return 'Ingresá un email válido (ejemplo: nombre@dominio.com).';
      if (campo.type === 'url') return 'Ingresá una dirección web válida.';
      return 'El formato ingresado no es válido.';
    }
    if (v.tooShort) {
      return 'Debe tener al menos ' + campo.minLength + ' caracteres (ingresaste ' + campo.value.length + ').';
    }
    if (v.tooLong) {
      return 'No puede superar los ' + campo.maxLength + ' caracteres.';
    }
    if (v.rangeUnderflow) return 'El valor mínimo es ' + campo.min + '.';
    if (v.rangeOverflow) return 'El valor máximo es ' + campo.max + '.';
    if (v.stepMismatch) return 'Ingresá un valor válido.';
    if (v.patternMismatch) return campo.title || 'El formato ingresado no es válido.';
    if (v.badInput) return 'Ingresá un valor válido.';
    return 'Revisá este campo.';
  }

  function conectar(campo) {
    campo.addEventListener('invalid', function () {
      campo.setCustomValidity(mensajeDeError(campo));
    });
    campo.addEventListener('input', function () {
      campo.setCustomValidity('');
    });
    campo.addEventListener('change', function () {
      campo.setCustomValidity('');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var campos = document.querySelectorAll(
      'input:not([data-password-policy]):not([data-password-confirm]), select, textarea'
    );
    campos.forEach(conectar);
  });
})();
