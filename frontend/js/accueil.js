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

// TRAJETS PUBLIÉS EN BASE
WAT.dom.run(async function () {
  const trips = await WAT.backend.getTrips();
  const cards = document.querySelectorAll('.trip-preview');
  await Promise.all(Array.from(cards, async function (card, index) {
    const trip = trips[index]; card.hidden = !trip;
    if (!trip) return;
    const user = await WAT.backend.getUser(trip.ownerId);
    card.href = 'pages/trajet-details.html?id=' + encodeURIComponent(trip.id);
    card.setAttribute('aria-label', 'Voir le trajet ' + trip.from + ' vers ' + trip.to);
    WAT.dom.text('.date-chip', WAT.dom.date(trip.date), card);
    WAT.dom.text('.text-green', WAT.dom.number(trip.capacity) + ' kg', card);
    card.querySelectorAll('.preview-route strong').forEach((el, i) => { el.textContent = i ? trip.to : trip.from; });
    WAT.dom.text('.traveler strong', user?.name || 'Voyageur', card);
    WAT.dom.text('.traveler .avatar', user?.initials || '', card);
    WAT.dom.text('.traveler small', '★ ' + WAT.dom.number(user?.rating) + ' · ' + (user?.completed || 0) + ' trajets', card);
    card.hidden = false;
  }));
  document.getElementById('home-empty').hidden = trips.length !== 0;
});
