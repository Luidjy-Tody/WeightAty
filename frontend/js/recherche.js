// FILTRER LES TRAJETS FICTIFS
WAT.dom.run(async function () {
  const d = WAT.dom;
  const form = document.getElementById('filters');
  const sort = document.getElementById('sort');
  const results = document.getElementById('results-list');
  let saved = await WAT.services.getSearch();
  ['from', 'to', 'date'].forEach(function (key) {
    if (d.params.has(key)) saved[key] = d.params.get(key);
  });
  d.fill(form, saved);
  sort.value = saved.sort || 'date';

  async function search() {
    const values = d.values(form);
    values.sort = sort.value;
    const errors = {};
    if (values.minWeight && Number(values.minWeight) < 0) errors.minWeight = 'Indiquez un poids positif ou nul.';
    if (!d.errors(form, errors)) return;
    await WAT.services.saveSearch(values);
    const trips = await WAT.services.getTrips(values);
    results.replaceChildren();
    trips.forEach(function (trip) {
      const card = WAT.page.row('trip-template');
      d.text('[data-from]', trip.from, card);
      d.text('[data-to]', trip.to, card);
      d.text('[data-date]', d.date(trip.date), card);
      d.text('[data-capacity]', d.number(trip.capacity) + ' kg', card);
      card.querySelector('a').href = 'trajet-details.html?id=' + encodeURIComponent(trip.id);
      results.append(card);
    });
    d.text('[data-result-count]', trips.length + ' trajet(s) trouvé(s)');
    d.text('#sort-description', sort.value === 'weight' ? 'Triés par capacité disponible décroissante' : 'Triés par départs les plus proches');
    document.getElementById('search-empty').hidden = trips.length !== 0;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    d.run(search);
  });
  sort.addEventListener('change', function () { d.run(search); });
  function reset() {
    form.reset();
    form.querySelectorAll('input').forEach(function (input) { input.value = ''; });
    sort.value = 'date';
    d.run(search);
  }
  document.getElementById('reset-search').onclick = reset;
  document.getElementById('empty-reset').onclick = reset;
  await search();
});
