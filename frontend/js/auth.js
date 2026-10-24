// INSCRIPTION, CONNEXION ET RÉINITIALISATION
const accessForm = document.getElementById('auth-form');
const accessPage = document.body.dataset.page;
accessForm.addEventListener('submit', function (event) {
  event.preventDefault();
  WAT.dom.busy(accessForm.querySelector('[type="submit"]'), async function () {
    const data = WAT.dom.values(accessForm);
    const errors = {};
    if (accessPage !== 'reinitialisation' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) errors.email = 'Saisissez une adresse e-mail valide.';
    if (accessPage !== 'mot-de-passe-oublie' && (data.password || '').length < 8) errors.password = 'Utilisez au moins 8 caractères.';
    else if (accessPage === 'inscription' && !(/\p{L}/u.test(data.password) && /\d/.test(data.password))) errors.password = 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
    if (accessPage === 'inscription') {
      if (!data.firstName.trim()) errors.firstName = 'Indiquez votre prénom.';
      if (!data.lastName.trim()) errors.lastName = 'Indiquez votre nom.';
      if (data.password !== data.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }
    if (!WAT.dom.errors(accessForm, errors)) return;
    if (accessPage === 'inscription' && data.password !== data.confirmPassword) throw new Error('Les mots de passe ne correspondent pas.');
    const op = { connexion: 'login', inscription: 'register', 'mot-de-passe-oublie': 'forgot', reinitialisation: 'reset' }[accessPage];
    if (op === 'reset') data.token = new URLSearchParams(window.location.search).get('token');
    let result;
    try { result = await post(op, data); }
    catch (error) {
      if (op === 'register' && /déjà utilisée/.test(error.message)) { WAT.dom.errors(accessForm, { email: error.message }); return; }
      throw error;
    }
    accessForm.querySelectorAll('[type="password"]').forEach(input => { input.value = ''; });
    if (op === 'login') { WAT.session = result; window.location.href = 'dashboard.html'; }
    else {
      const box = document.getElementById('auth-result'); box.hidden = false;
      box.textContent = result.message || (op === 'register' ? 'Compte créé. Redirection vers la connexion…' : 'Mot de passe modifié. Vous pouvez vous connecter.');
      if (op === 'register') setTimeout(() => { window.location.href = 'connexion.html'; }, 2000);
    }
  });
});
document.getElementById('show-password')?.addEventListener('change', function (event) {
  document.getElementById('f-password').type = event.target.checked ? 'text' : 'password';
});
document.getElementById('open-demo')?.remove();
