// PUBLIER OU MODIFIER UN TRAJET DE DÉMONSTRATION
WAT.dom.run(async function () {
  const d = WAT.dom;
  const id = d.params.get('edit');
  const form = document.getElementById('trip-form');
  if (id) {
    const trip = await WAT.services.getTrip(id);
    const user = await WAT.services.getUser();
    if (!trip || trip.ownerId !== user?.id) return d.error('Ce trajet ne vous appartient pas.');
    d.fill(form, trip);
    d.text('h1', 'Modifier le trajet');
    d.text('#trip-form [type="submit"]', 'Enregistrer les modifications');
  }
  form.onsubmit = function (event) {
    event.preventDefault();
    const values = d.values(form);
    if (!d.errors(form, WAT.validation.trip(values))) return;
    d.busy(form.querySelector('[type="submit"]'), async function () {
      try {
        await WAT.services.saveTrip(values, id);
        window.location.href = 'mes-trajets.html';
      } catch (error) {
        d.errors(form, { form: error.message });
      }
    });
  };
});
