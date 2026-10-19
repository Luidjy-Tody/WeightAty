// VALIDER LE FORMULAIRE D’ACCÈS SANS AUTHENTIFICATION RÉELLE
const accessForm = document.getElementById('auth-form');
const accessPage = document.body.dataset.page;
const registration = accessPage === 'inscription';
const forgotten = accessPage === 'mot-de-passe-oublie';

accessForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const data = WAT.dom.values(accessForm);
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) errors.email = 'Saisissez une adresse e-mail valide.';
  if (registration) {
    if (!data.firstName.trim()) errors.firstName = 'Indiquez votre prénom.';
    if (!data.lastName.trim()) errors.lastName = 'Indiquez votre nom.';
  }
  if (!forgotten && (data.password || '').length < 8) errors.password = 'Utilisez au moins 8 caractères.';
  if (registration && data.password !== data.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
  if (!WAT.dom.errors(accessForm, errors)) return;
  accessForm.querySelectorAll('#f-password, #f-confirmPassword').forEach(function (input) { input.value = ''; });
  const result = document.getElementById('auth-result');
  result.hidden = false;
  result.textContent = forgotten
    ? 'Envoi simulé : aucun e-mail réel n’a été envoyé.'
    : 'Formulaire valide. Aucun compte réel ni authentification réelle. Utilisez le bouton de démonstration.';
});

// AFFICHER LE MOT DE PASSE FICTIF
 document.getElementById('show-password')?.addEventListener('change', function (event) {
  document.getElementById('f-password').type = event.target.checked ? 'text' : 'password';
});

// OUVRIR LE PROFIL DE DÉMONSTRATION
 document.getElementById('open-demo').addEventListener('click', function () {
  try {
    const key = 'weight-aty-demo-v1';
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) {
      saved.currentUserId = 'marie';
      localStorage.setItem(key, JSON.stringify(saved));
    }
    window.location.href = 'dashboard.html';
  } catch {
    WAT.dom.notify('Le stockage local est indisponible. Autorisez-le pour ouvrir la démonstration.', true);
  }
});
