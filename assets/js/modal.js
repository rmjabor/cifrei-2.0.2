// Modal Frase Segredo - apaga o input texto cada vez que o modal fecha
document.addEventListener('DOMContentLoaded', function () {

  const modalElement = document.getElementById('fraseSegredo');
  const campo        = document.getElementById('inputFraseSegredo');

  // Se não estamos numa página que tenha esse modal, não faz nada
  if (!modalElement || !campo) return;

  modalElement.addEventListener('hidden.bs.modal', function () {
    campo.value = "";
  });

});

