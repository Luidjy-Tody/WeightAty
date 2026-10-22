// CONSULTER LE PROFIL PUBLIC DU VOYAGEUR
WAT.dom.run(async function () {
  const d = WAT.dom;
  const user = await WAT.services.getUser(d.params.get('id'));
  if (!user) return d.error('Ce profil est introuvable.');
  d.text('[data-profile-name]', user.name);
  d.text('.profile-card .avatar', user.initials);
  d.text('[data-profile-about]', user.about);
  d.text('[data-profile-location]', user.location);
  const facts = document.querySelectorAll('.profile-card dd');
  [ '★ ' + d.number(user.rating), user.completed, user.since ].forEach(function (value, index) { facts[index].textContent = value; });
  const trips = (await WAT.services.getTrips()).filter(function (trip) { return trip.ownerId === user.id; });
  const container = document.getElementById('traveler-trips');
  container.replaceChildren();
  trips.forEach(function (trip) {
    const card = WAT.page.row('traveler-trip-template');
    d.text('strong', trip.from + ' → ' + trip.to, card);
    d.text('p', d.date(trip.date), card);
    card.querySelector('a').href = 'trajet-details.html?id=' + encodeURIComponent(trip.id);
    container.append(card);
  });
  document.getElementById('list-empty').hidden = trips.length !== 0;
});
