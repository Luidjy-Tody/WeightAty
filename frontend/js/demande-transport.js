// VÉRIFIER LE COLIS AVANT L’ENVOI SIMULÉ
WAT.dom.run(async function () {
  const d = WAT.dom;
  const parcel = await WAT.services.getDraft();
  const user = await WAT.services.getUser();
  if (!parcel || parcel.ownerId !== user?.id) return d.error('Préparez un colis avant de vérifier votre demande.');
  const trip = await WAT.services.getTrip(parcel.tripId);
  if (!trip) return d.error('Le trajet n’est plus disponible.');
  const owner = await WAT.page.tripSummary(trip);
  WAT.page.parcel(parcel);
  d.text('[data-request-intro]', 'Vérifiez les informations avant de simuler votre demande pour ' + owner.name + '.');
  d.text('[data-request-summary]', 'La démonstration associera ce colis au trajet ' + trip.from + ' → ' + trip.to + ' de ' + owner.name + ', prévu le ' + d.date(trip.date) + '.');
  document.querySelector('[data-edit-parcel]').href = 'colis.html?trip=' + encodeURIComponent(trip.id) + '&parcel=' + encodeURIComponent(parcel.id);
  const send = document.getElementById('send-request');
  const errors = WAT.validation.parcel(parcel, trip);
  if (Object.keys(errors).length) {
    d.text('[data-send-error]', Object.values(errors).join(' '));
    document.querySelector('[data-send-error]').hidden = false;
    send.disabled = true;
  }
  send.onclick = function () {
    d.busy(send, async function () {
      const request = await WAT.services.sendRequest(parcel.id);
      document.getElementById('send-result').hidden = true;
      document.getElementById('send-success').hidden = false;
      document.querySelector('[data-created-request]').href = 'demande-details.html?id=' + encodeURIComponent(request.id);
    });
  };
});
