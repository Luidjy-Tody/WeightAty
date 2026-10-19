// RENSEIGNER LES FORMULAIRES DU PROFIL FICTIF
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
      d.notify('Profil de démonstration enregistré.');
    });
  };

  // ENREGISTRER LES COORDONNÉES FICTIVES
  privateForm.onsubmit = function (event) {
    event.preventDefault();
    const data = d.values(privateForm);
    if (!d.errors(privateForm, WAT.validation.email(data.email) ? {} : { email: 'Indiquez une adresse e-mail valide.' })) return;
    d.busy(privateForm.querySelector('button'), async function () {
      await WAT.services.updateProfile(data);
      d.notify('Coordonnées fictives enregistrées localement.');
    });
  };

  // QUITTER OU RÉINITIALISER LA DÉMONSTRATION
  document.getElementById('logout').onclick = function () {
    d.run(async function () {
      await WAT.services.logout();
      window.location.href = 'connexion.html';
    });
  };
  document.getElementById('reset-demo').onclick = async function () {
    if (!await d.confirm('Rétablir les données initiales de la démonstration ?')) return;
    WAT.store.reset();
    window.location.href = 'dashboard.html';
  };
});
