// CONTRÔLES D’ADMINISTRATION AVEC CONFIRMATION
WAT.dom.run(async function () {
  const data = await WAT.api('admin');
  document.getElementById('loading').hidden = true;
  const statLabels = [['utilisateurs', 'Utilisateurs'], ['trajets', 'Trajets'], ['demandes', 'Demandes'], ['signalements_ouverts', 'Signalements ouverts'], ['signalements_total', 'Signalements au total'], ['paiements_en_attente', 'Paiements en attente'], ['total_simule', 'Paiements simulés (MUR)']];
  statLabels.forEach(([key, label]) => {
    const card = document.getElementById('admin-stat-card').content.firstElementChild.cloneNode(true);
    card.querySelector('strong').textContent = WAT.dom.number(data.stats[key]);
    card.querySelector('span').textContent = label;
    document.getElementById('admin-stats').append(card);
  });
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
  function showReports() {
    const filter = document.getElementById('report-filter').value;
    const body = document.getElementById('admin-reports'); body.replaceChildren();
    const shown = data.reports.filter(r => filter === 'tous' || r.statut === filter);
    shown.forEach(r => {
      const item = document.getElementById('admin-report-row').content.firstElementChild.cloneNode(true);
      const cells = item.querySelectorAll('td');
      cells[0].textContent = '#' + r.demande_id + ' · ' + r.depart + ' → ' + r.destination;
      cells[1].textContent = r.prenom + ' ' + r.nom + ' (' + r.email + ')';
      cells[2].textContent = r.date_creation + ' UTC';
      cells[3].textContent = r.motif;
      const badge = item.querySelector('.status');
      badge.textContent = r.statut === 'ouvert' ? 'Ouvert' : 'Résolu';
      badge.classList.add(r.statut === 'ouvert' ? 'pending' : 'success');
      const button = item.querySelector('button');
      button.hidden = r.statut !== 'ouvert'; action(button, 'resolve', r.id);
      body.append(item);
    });
    WAT.dom.text('#reports-count', shown.length ? shown.length + ' signalement(s) affiché(s).' : 'Aucun signalement à afficher.');
  }
  document.getElementById('report-filter').onchange = showReports;
  showReports();
  data.requests.forEach(r => {
    const button = row('admin-request-row', [r.id, r.colis_id, r.trajet_id, r.statut], 'admin-requests');
    button.hidden = !['en_attente', 'acceptee'].includes(r.statut); action(button, 'cancelRequest', r.id);
  });
  for (const [list, values] of [['admin-payments', data.payments]]) {
    values.forEach(value => { const item = document.createElement('li'); item.textContent = Object.entries(value).map(([key, v]) => key + ' : ' + v).join(' · '); document.getElementById(list).append(item); });
    if (!values.length) { const item = document.createElement('li'); item.textContent = 'Aucun élément.'; document.getElementById(list).append(item); }
  }
});
