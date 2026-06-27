/*
  Política de contraseña segura — validación en vivo.
  - input[data-password-policy]: contraseña principal. Marca el checklist y
    bloquea el envío hasta cumplir mínimo 8 caracteres con mayúscula,
    minúscula, número y símbolo.
  - input[data-password-confirm]: campo de confirmación (debe coincidir).
*/
(function () {
  var reglas = [
    { id: 'longitud',  test: function (v) { return v.length >= 8; } },
    { id: 'mayuscula', test: function (v) { return /[A-Z]/.test(v); } },
    { id: 'minuscula', test: function (v) { return /[a-z]/.test(v); } },
    { id: 'numero',    test: function (v) { return /\d/.test(v); } },
    { id: 'simbolo',   test: function (v) { return /[^A-Za-z0-9]/.test(v); } },
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.querySelector('input[data-password-policy]');
    if (!input) return;

    function evaluar() {
      var v = input.value;
      var todas = true;

      reglas.forEach(function (r) {
        var ok = r.test(v);
        if (!ok) todas = false;
        var el = document.getElementById('regla-' + r.id);
        if (el) {
          el.classList.toggle('text-green-600', ok);
          el.classList.toggle('text-gray-400', !ok);
          var icono = el.querySelector('[data-icono]');
          if (icono) icono.textContent = ok ? '✓' : '○';
        }
      });

      if (v.length === 0) {
        input.setCustomValidity('Completá este campo.');
      } else if (!todas) {
        input.setCustomValidity('La contraseña no cumple todos los requisitos de seguridad.');
      } else {
        input.setCustomValidity('');
      }
    }

    input.addEventListener('input', evaluar);
    input.addEventListener('invalid', evaluar);
    evaluar();

    // Confirmación de contraseña (opcional)
    var confirmar = document.querySelector('input[data-password-confirm]');
    if (confirmar) {
      function evaluarConfirmar() {
        if (confirmar.value.length === 0) {
          confirmar.setCustomValidity('Completá este campo.');
        } else if (confirmar.value !== input.value) {
          confirmar.setCustomValidity('Las contraseñas no coinciden.');
        } else {
          confirmar.setCustomValidity('');
        }
      }
      confirmar.addEventListener('input', evaluarConfirmar);
      confirmar.addEventListener('invalid', evaluarConfirmar);
      input.addEventListener('input', evaluarConfirmar);
      evaluarConfirmar();
    }
  });
})();
