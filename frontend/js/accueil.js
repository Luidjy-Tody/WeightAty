// RECHERCHE DEPUIS L’ACCUEIL
const rechercheAccueil = document.getElementById('home-search');
rechercheAccueil.addEventListener('submit', function (event) {
  event.preventDefault();
  const parametres = new URLSearchParams(new FormData(rechercheAccueil));
  window.location.href = 'pages/recherche.html?' + parametres.toString();
});

// CHANGER LES ÉTAPES AFFICHÉES
const onglets = document.querySelectorAll('[role="tab"]');
onglets.forEach(function (bouton, index) {
  bouton.addEventListener('click', function () {
    onglets.forEach(function (onglet) {
      onglet.setAttribute('aria-selected', String(onglet === bouton));
    });
    document.getElementById('steps').hidden = index !== 0;
    document.getElementById('steps-traveler').hidden = index !== 1;
  });
  bouton.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const suivant = onglets[index === 0 ? 1 : 0];
      suivant.click();
      suivant.focus();
    }
  });
});
