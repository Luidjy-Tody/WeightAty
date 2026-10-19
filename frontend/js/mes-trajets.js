// GÉRER LES TRAJETS DU PROFIL FICTIF
WAT.dom.run(async function () {
  const d = WAT.dom;
  const trips = await WAT.services.getMyTrips();
  const body = document.querySelector('tbody');
  body.replaceChildren();
  trips.forEach(function (trip) {
    const row = WAT.page.row('my-trip-template');
    const cells = row.querySelectorAll('td');
    const values = [trip.from, trip.to, d.date(trip.date), d.number(trip.capacity) + ' kg'];
    values.forEach(function (value, index) { cells[index].textContent = value; });
    d.status(row.querySelector('.status'), trip.status);
    const links = row.querySelectorAll('a');
    links[0].href = 'mon-trajet.html?id=' + encodeURIComponent(trip.id);
    links[1].href = 'publier-trajet.html?edit=' + encodeURIComponent(trip.id);
    links[1].hidden = trip.status !== 'Publié';
    const cancel = row.querySelector('button');
    cancel.hidden = trip.status !== 'Publié';
    cancel.onclick = async function () {
      if (!await d.confirm('Annuler ce trajet et les demandes actives de la démonstration ?')) return;
      d.busy(cancel, async function () {
        await WAT.services.cancelTrip(trip.id);
        window.location.reload();
      });
    };
    body.append(row);
  });
  document.getElementById('list-empty').hidden = trips.length !== 0;
});
