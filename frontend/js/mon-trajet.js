// CONSULTER UN TRAJET PERSONNEL
WAT.dom.run(async function () {
  const d = WAT.dom;
  const trip = await WAT.services.getTrip(d.params.get('id') || 'MT-1');
  const user = await WAT.services.getUser();
  if (!trip || trip.ownerId !== user?.id) return d.error('Ce trajet ne vous appartient pas.');
  d.text('[data-trip-title]', trip.from + ' → ' + trip.to);
  d.text('[data-trip-date]', d.date(trip.date));
  d.text('[data-trip-from]', trip.from);
  d.text('[data-trip-to]', trip.to);
  d.text('[data-trip-capacity]', d.number(trip.capacity) + ' kg');
  d.text('[data-trip-pickup]', trip.pickup);
  d.text('[data-trip-delivery]', trip.delivery);
  d.text('[data-trip-notes]', trip.notes);
  d.text('[data-trip-status]', trip.status);
  const edit = document.querySelector('[data-edit-trip]');
  edit.href = 'publier-trajet.html?edit=' + encodeURIComponent(trip.id);
  edit.hidden = trip.status !== 'Publié';
  const cancel = document.querySelector('[data-cancel-trip]');
  cancel.hidden = trip.status !== 'Publié';
  cancel.onclick = async function () {
    if (!await d.confirm('Annuler ce trajet et ses demandes de démonstration ?')) return;
    d.busy(cancel, async function () {
      await WAT.services.cancelTrip(trip.id);
      window.location.reload();
    });
  };
  const requests = (await WAT.services.getRequests(true)).filter(function (r) { return r.tripId === trip.id; });
  d.text('[data-my-trip-count]', requests.length + ' demande(s) pour ce trajet.');
  const container = document.getElementById('my-trip-requests');
  container.replaceChildren();
  requests.forEach(function (request) {
    const item = WAT.page.row('my-trip-request-template');
    d.status(item.querySelector('.status'), request.status);
    item.querySelector('a').href = 'demande-details.html?id=' + encodeURIComponent(request.id);
    container.append(item);
  });
});
