// ACTUALISER LES LIGNES DU TABLEAU DES COLIS
WAT.dom.run(async function () {
  const d = WAT.dom;
  const parcels = await WAT.services.getParcels();
  const body = document.querySelector('tbody');
  body.replaceChildren();
  parcels.forEach(function (parcel) {
    const row = WAT.page.row('parcel-template');
    const cells = row.querySelectorAll('td');
    const values = [parcel.id, parcel.type, parcel.description, d.number(parcel.weight) + ' kg',
      [parcel.length, parcel.width, parcel.height].map(d.number).join(' × ') + ' cm', d.date(parcel.createdAt)];
    values.forEach(function (value, index) { cells[index].textContent = value; });
    d.status(row.querySelector('.status'), parcel.status);
    const links = row.querySelectorAll('a');
    links[0].href = 'colis-details.html?id=' + encodeURIComponent(parcel.id);
    links[1].href = 'colis.html?parcel=' + encodeURIComponent(parcel.id);
    if (parcel.status === 'Prêt') links[1].href = 'recherche.html?parcel=' + encodeURIComponent(parcel.id);
    links[1].hidden = !['Brouillon', 'Prêt'].includes(parcel.status);
    body.append(row);
  });
  document.getElementById('list-empty').hidden = parcels.length !== 0;
});
