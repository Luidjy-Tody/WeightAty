// GÈRE LES FORMULAIRES D’ACCÈS (CONNEXION RÉELLE, INSCRIPTION/MOT DE PASSE SIMULÉS)
const accessForm = document.getElementById('auth-form');
const accessPage = document.body.dataset.page;
const registration = accessPage === 'inscription';
const forgotten = accessPage === 'mot-de-passe-oublie';
const login = !registration && !forgotten;

accessForm.addEventListener('submit', function (event) {
  event.preventDefault();
  if (login) return handleLogin();
  return handleSimulation();
});

// CONNEXION : VÉRIFIER LES IDENTIFIANTS DANS MYSQL VIA L’API PHP
async function handleLogin() {
  const data = WAT.dom.values(accessForm);
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) errors.email = 'Saisissez une adresse e-mail valide.';
  if ((data.password || '').length < 8) errors.password = 'Utilisez au moins 8 caractères.';
  if (!WAT.dom.errors(accessForm, errors)) return;

  const button = accessForm.querySelector('button[type="submit"]');
  const result = document.getElementById('auth-result');

  await WAT.dom.busy(button, async function () {
    try {
      const reponse = await WAT.api('/api/auth/connexion.php', {
        method: 'POST',
        body: { email: data.email.trim(), password: data.password }
      });
      accessForm.querySelector('#f-password').value = '';
      result.hidden = false;
      result.textContent = 'Connexion réussie. Redirection en cours…';
      window.location.href = pageSuivante();
    } catch (error) {
      WAT.dom.errors(accessForm, error.errors || {});
      result.hidden = false;
      result.textContent = error.message;
    }
  });
}

// PAGE DE DESTINATION APRÈS CONNEXION
// SEULEMENT UNE PAGE INTERNE EST AUTORISÉE (PAS DE REDIRECTION EXTERNE)
function pageSuivante() {
  const cible = WAT.dom.params.get('suivant') || '';
  if (!cible) return 'dashboard.html';
  if (/^[a-z][a-z0-9+.-]*:/i.test(cible) || cible.startsWith('//') || cible.startsWith('/')) {
    return 'dashboard.html';
  }
  return cible;
}

// INSCRIPTION / MOT DE PASSE OUBLIÉ : ENCORE SIMULÉS (BACKENDS NON DÉVELOPPÉS)
function handleSimulation() {
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
    : 'Formulaire valide. Aucun compte réel n’a encore été créé côté serveur.';
}

// AFFICHER LE MOT DE PASSE FICTIF
 document.getElementById('show-password')?.addEventListener('change', function (event) {
  document.getElementById('f-password').type = event.target.checked ? 'text' : 'password';
});

// OUVRIR LE PROFIL DE DÉMONSTRATION
// L’ACCUEIL EST CONSULTABLE SANS CONNEXION : LE TABLEAU DE BORD, LUI,
// EXIGE UN COMPTE RÉEL (LA GARDE REDIRIGE VERS LA CONNEXION)
document.getElementById('open-demo')?.addEventListener('click', function () {
  try {
    const key = 'weight-aty-demo-v1';
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) {
      saved.currentUserId = 'marie';
      localStorage.setItem(key, JSON.stringify(saved));
    }
    window.location.href = '../index.html';
  } catch {
    WAT.dom.notify('Le stockage local est indisponible. Autorisez-le pour ouvrir la démonstration.', true);
  }
});
