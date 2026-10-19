// ACTUALISER LES COMPTEURS DU TABLEAU DE BORD
WAT.dom.run(async function () {
  const d = WAT.dom;
  const user = await WAT.services.getUser();
  if (!user) return void (window.location.href = 'connexion.html');
  const parcels = await WAT.services.getParcels();
  const requests = await WAT.services.getRequests();
  const trips = await WAT.services.getMyTrips();
  const notifications = await WAT.services.getNotifications();
  const active = requests.filter(function (r) { return ['En attente', 'Acceptée'].includes(r.status); }).length;
  const upcoming = trips.filter(function (t) { return t.status === 'Publié' && t.date >= WAT.validation.today(); });
  const unread = notifications.filter(function (n) { return !n.read; }).length;
  d.text('[data-greeting]', 'Bonjour ' + user.firstName);
  const counts = [parcels.length, active, trips.filter(function (t) { return t.status === 'Publié'; }).length, unread];
  document.querySelectorAll('.stat strong').forEach(function (element, index) { element.textContent = counts[index]; });
  const labels = [parcels.length + ' colis', active + ' en cours', upcoming.length + ' à venir', 'Profil de démonstration', 'Espace voyageur', unread + ' non lues'];
  document.querySelectorAll('.account-links small').forEach(function (element, index) { element.textContent = labels[index]; });
  document.getElementById('next-trip').hidden = upcoming.length === 0;
  document.getElementById('no-next-trip').hidden = upcoming.length !== 0;
  if (upcoming.length) {
    const trip = upcoming[0];
    d.text('[data-next-route]', trip.from + ' → ' + trip.to);
    d.text('[data-next-date]', d.date(trip.date));
    d.text('[data-next-capacity]', d.number(trip.capacity) + ' kg');
  }
});
