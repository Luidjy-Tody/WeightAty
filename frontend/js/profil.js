// CHARGER LE PROFIL DEPUIS LA BASE DE DONNÉES
WAT.dom.run(async function () {
  const d = WAT.dom;
  const user = await WAT.services.getUser();
  if (!user) return void (window.location.href = 'connexion.html');
  const publicForm = document.getElementById('public-profile');
  const privateForm = document.getElementById('private-profile');
  d.fill(publicForm, user);
  d.fill(privateForm, user);
  d.text('[data-profile-name]', user.name);
  d.text('.profile-card .avatar', user.initials);
  const facts = document.querySelectorAll('.profile-card dd');
  if (facts.length >= 3) {
    facts[0].textContent = user.since || '—';
    facts[1].textContent = Number(user.rating) > 0 ? '★ ' + d.number(user.rating) : 'Aucune évaluation';
    facts[2].textContent = d.number(user.completed);
  }
  // AFFICHER LE PROFIL UNIQUEMENT APRÈS CHARGEMENT DES DONNÉES
  const content = document.getElementById('page-content');
  if (content) content.style.removeProperty('display');

  // ENREGISTRER LES INFORMATIONS PUBLIQUES
  publicForm.onsubmit = function (event) {
    event.preventDefault();
    const data = d.values(publicForm);
    const errors = {};
    if (!data.firstName.trim()) errors.firstName = 'Indiquez votre prénom.';
    if (!data.lastName.trim()) errors.lastName = 'Indiquez votre nom.';
    if (!d.errors(publicForm, errors)) return;
    d.busy(publicForm.querySelector('button'), async function () {
      const updated = await WAT.services.updateProfile(data);
      d.text('[data-profile-name]', updated.name);
      d.text('.avatar', updated.initials);
      d.notify('Profil enregistré.');
    });
  };

  // ENREGISTRER LES COORDONNÉES DU COMPTE
  privateForm.onsubmit = function (event) {
    event.preventDefault();
    const data = d.values(privateForm);
    if (!d.errors(privateForm, WAT.validation.email(data.email) ? {} : { email: 'Indiquez une adresse e-mail valide.' })) return;
    d.busy(privateForm.querySelector('button'), async function () {
      await WAT.services.updateProfile(data);
      d.notify('Coordonnées enregistrées.');
    });
  };

  // DÉCONNEXION DU COMPTE
  const logoutButton = document.getElementById('logout');
  if (logoutButton) logoutButton.onclick = function () {
    d.busy(logoutButton, async function () {
      await WAT.services.logout();
      window.location.replace('connexion.html');
    });
  };
});
