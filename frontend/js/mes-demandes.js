// ACTUALISER LES DEMANDES ENVOYÉES OU REÇUES
WAT.dom.run(async function () {
  const d = WAT.dom;
  const incoming = document.body.dataset.page === 'demandes-recues';
  const requests = await WAT.services.getRequests(incoming);
  const body = document.querySelector('tbody');
  body.replaceChildren();
  for (const request of requests) {
    const trip = await WAT.services.getTrip(request.tripId);
    const person = await WAT.services.getUser(incoming ? request.senderId : trip.ownerId);
    const row = WAT.page.row('request-template');
    const cells = row.querySelectorAll('td');
    const values = [trip.from + ' → ' + trip.to, request.parcelId, person.name, d.date(request.createdAt)];
    values.forEach(function (value, index) { cells[index].textContent = value; });
    d.status(row.querySelector('.status'), request.status);
    row.querySelector('a').href = 'demande-details.html?id=' + encodeURIComponent(request.id);
    body.append(row);
  }
  document.getElementById('list-empty').hidden = requests.length !== 0;
});
