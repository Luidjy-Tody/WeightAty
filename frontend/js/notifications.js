// AFFICHER LES NOTIFICATIONS DE DÉMONSTRATION
WAT.dom.run(async function () {
  const d = WAT.dom;
  const list = await WAT.services.getNotifications();
  const container = document.getElementById('notification-list');
  container.replaceChildren();
  list.forEach(function (notification) {
    const row = WAT.page.row('notification-template');
    d.text('strong', notification.text, row);
    d.text('p', d.date(notification.date) + (notification.read ? '' : ' · Non lue'), row);
    if (notification.route === '/demandes-recues') row.href = 'demandes-recues.html';
    else row.href = 'demande-details.html?id=' + encodeURIComponent(notification.route.split('/').pop());
    container.append(row);
  });
  const button = document.getElementById('read-all');
  button.hidden = !list.some(function (n) { return !n.read; });
  button.onclick = function () {
    d.busy(button, async function () {
      await WAT.services.markNotificationsRead();
      window.location.reload();
    });
  };
  document.getElementById('list-empty').hidden = list.length !== 0;
});
