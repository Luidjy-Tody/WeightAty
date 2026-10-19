// AFFICHER UN COLIS ET SON TRAJET
WAT.dom.run(async function () {
  const d = WAT.dom;
  const parcel = await WAT.services.getParcel(d.params.get('id') || 'WAT-1048');
  if (!parcel) return d.error('Ce colis est introuvable.');
  WAT.page.parcel(parcel);
  d.status(document.querySelector('[data-parcel-status]'), parcel.status);
  const trip = await WAT.services.getTrip(parcel.tripId);
  if (trip) await WAT.page.tripSummary(trip);
  const resume = document.querySelector('[data-resume-parcel]');
  resume.hidden = parcel.status !== 'Brouillon';
  resume.href = 'colis.html?parcel=' + encodeURIComponent(parcel.id);
  const requests = await WAT.services.getRequests();
  const request = requests.find(function (r) { return r.parcelId === parcel.id; });
  const link = document.querySelector('[data-parcel-request]');
  link.hidden = !request;
  if (request) link.href = 'demande-details.html?id=' + encodeURIComponent(request.id);
});
