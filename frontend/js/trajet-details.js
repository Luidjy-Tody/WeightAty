// AFFICHER LES DONNÉES DU TRAJET CHOISI
WAT.dom.run(async function () {
  const d = WAT.dom;
  const trip = await WAT.services.getTrip(d.params.get('id'));
  if (!trip) return d.error('Ce trajet est introuvable.');
  const owner = await WAT.page.tripSummary(trip);
  d.text('[data-trip-title]', trip.from + ' vers ' + trip.to);
  d.text('[data-trip-subtitle]', 'Départ prévu le ' + d.date(trip.date));
  d.text('[data-trip-pickup]', trip.pickup || 'À convenir');
  d.text('[data-trip-delivery]', trip.delivery || 'À convenir');
  d.text('[data-trip-notes]', trip.notes);
  d.text('[data-owner-since]', 'Membre depuis ' + owner.since);
  document.querySelector('[data-owner-link]').href = 'voyageur.html?id=' + encodeURIComponent(owner.id);
  const send = document.querySelector('[data-send-parcel]');
  send.href = 'colis.html?trip=' + encodeURIComponent(trip.id) + (d.params.get('parcel') ? '&parcel=' + encodeURIComponent(d.params.get('parcel')) : '');
  const mine = trip.ownerId === (await WAT.services.getUser())?.id;
  if (mine) {
    send.href = 'mon-trajet.html?id=' + encodeURIComponent(trip.id);
    send.textContent = 'Gérer mon trajet';
  }
  if (trip.status !== 'Publié' || trip.date < WAT.validation.today()) {
    send.hidden = true;
    document.getElementById('trip-unavailable').hidden = false;
  }
});
