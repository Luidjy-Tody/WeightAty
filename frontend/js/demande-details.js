// AFFICHER UNE DEMANDE ET SES ACTIONS AUTORISÉES
WAT.dom.run(async function () {
  const d = WAT.dom;
  const request = await WAT.services.getRequest(d.params.get('id'));
  if (!request) return d.error('Cette demande est introuvable.');
  const trip = await WAT.services.getTrip(request.tripId);
  const parcel = await WAT.services.getRequestParcel(request.id);
  const sender = await WAT.services.getUser(request.senderId);
  const user = await WAT.services.getUser();
  if (!trip || !parcel || !user) return d.error('Les informations de cette demande sont indisponibles.');
  await WAT.page.tripSummary(trip);
  WAT.page.parcel(parcel);
  d.status(document.querySelector('[data-request-status]'), request.status);
  d.text('[data-sender-name]', sender.name);
  d.text('[data-request-reference]', 'Référence : ' + request.id);
  d.text('[data-request-created]', 'Créée le ' + d.date(request.createdAt));
  document.querySelector('[data-transport-link]').href = 'transport.html?id=' + encodeURIComponent(request.id);
  const incoming = trip.ownerId === user.id;
  document.querySelector('[data-request-back]').href = incoming ? 'demandes-recues.html' : 'mes-demandes.html';
  document.querySelectorAll('[data-status]').forEach(function (button) {
    const status = button.dataset.status;
    button.hidden = status === 'Annulée'
      ? incoming || !['En attente', 'Acceptée'].includes(request.status)
      : !incoming || request.status !== 'En attente';
    button.onclick = async function () {
      if (!await d.confirm('Confirmer cette action : ' + status.toLowerCase() + ' ?')) return;
      d.busy(button, async function () {
        await WAT.services.updateRequest(request.id, status);
        window.location.reload();
      });
    };
  });
});
