// CONTRÔLES D’ADMINISTRATION AVEC CONFIRMATION
WAT.dom.run(async function () {
  const data = await WAT.api('admin');
  document.getElementById('loading').hidden = true;
  WAT.dom.text('#admin-stats', Object.entries(data.stats).map(([key, value]) => key + ' : ' + value).join(' · '));
  function action(button, op, id) {
    button.onclick = async function () {
      if (!await WAT.dom.confirm(button.textContent + ' ?')) return;
      WAT.dom.busy(button, async () => { await post('adminAction', { action: op, id }); window.location.reload(); });
    };
  }
  function row(template, values, list) {
    const item = document.getElementById(template).content.firstElementChild.cloneNode(true);
    values.forEach((value, index) => { item.querySelectorAll('td')[index].textContent = value; });
    document.getElementById(list).append(item); return item.querySelector('button');
  }
  data.users.forEach(u => {
    const button = row('admin-user-row', [u.prenom + ' ' + u.nom, u.email, u.statut], 'admin-users');
    button.textContent = u.statut === 'actif' ? 'Suspendre' : 'Réactiver'; action(button, u.statut === 'actif' ? 'suspend' : 'activate', u.id);
  });
  data.trips.forEach(t => {
    const button = row('admin-trip-row', [t.depart + ' → ' + t.destination, t.statut], 'admin-trips');
    button.hidden = t.statut !== 'publie'; action(button, 'cancelTrip', t.id);
  });
  data.reports.forEach(r => {
    const button = row('admin-report-row', [r.demande_id, r.motif, r.statut], 'admin-reports');
    button.hidden = r.statut !== 'ouvert'; action(button, 'resolve', r.id);
  });
  data.requests.forEach(r => {
    const button = row('admin-request-row', [r.id, r.colis_id, r.trajet_id, r.statut], 'admin-requests');
    button.hidden = !['en_attente', 'acceptee'].includes(r.statut); action(button, 'cancelRequest', r.id);
  });
  for (const [list, values] of [['admin-payments', data.payments]]) {
    values.forEach(value => { const item = document.createElement('li'); item.textContent = Object.entries(value).map(([key, v]) => key + ' : ' + v).join(' · '); document.getElementById(list).append(item); });
    if (!values.length) { const item = document.createElement('li'); item.textContent = 'Aucun élément.'; document.getElementById(list).append(item); }
  }
});
