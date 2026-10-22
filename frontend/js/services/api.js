// CLIENT PHP : SESSION ET PROTECTION CSRF
window.WAT = window.WAT || {};
WAT.config = { mode: 'api', apiBaseUrl: '/backend/api/index.php' };
WAT.session = null;
WAT.api = async function (op, values = {}, method = 'GET') {
  if (!WAT.session && op !== 'session') await WAT.refreshSession();
  const url = new URL(WAT.config.apiBaseUrl, window.location.origin);
  url.searchParams.set('op', op);
  if (method === 'GET') Object.entries(values).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    method, credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(method === 'POST' ? { 'Content-Type': 'application/json', 'X-CSRF-Token': WAT.session.csrf } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify(values) } : {})
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('Réponse serveur invalide.'); }
  if (!response.ok) throw new Error(result.message || 'Requête impossible.');
  return result;
};
let sessionPromise;
WAT.refreshSession = function () {
  if (!sessionPromise) sessionPromise = WAT.api('session').then(result => { WAT.session = result; return result; }).finally(() => { sessionPromise = null; });
  return sessionPromise;
};
const post = (op, data) => WAT.api(op, data, 'POST');
WAT.backend = {
  getUser: id => WAT.api('user', id ? { id } : {}),
  getTrips: (filters = {}) => WAT.api('trips', filters),
  getTrip: id => WAT.api('trip', { id }),
  getMyTrips: () => WAT.api('myTrips'),
  saveTrip: (data, id) => post('saveTrip', { ...data, ...(id ? { id } : {}) }),
  cancelTrip: id => post('cancelTrip', { id }),
  getParcels: () => WAT.api('parcels'),
  getParcel: id => WAT.api('parcel', { id }),
  getDraft: () => WAT.api('draft'),
  saveDraft: data => post('saveDraft', data),
  getRequests: (incoming = false) => WAT.api('requests', { incoming: incoming ? '1' : '0' }),
  getRequest: id => WAT.api('request', { id }),
  getRequestParcel: id => WAT.api('requestParcel', { id }),
  sendRequest: parcelId => post('sendRequest', { parcelId }),
  updateRequest: (id, status) => post('updateRequest', { id, status }),
  getNotifications: () => WAT.api('notifications'),
  markNotificationsRead: () => post('readNotifications', {}),
  updateProfile: data => post('profile', data),
  logout: async () => { await post('logout', {}); WAT.session = null; },
  getSearch: async () => { try { return JSON.parse(sessionStorage.getItem('weightaty-search') || '{}'); } catch { return {}; } },
  saveSearch: async filters => { try { sessionStorage.setItem('weightaty-search', JSON.stringify(filters)); } catch {} }
};
// ÉTAT CONNECTÉ ET PROTECTION DES PAGES PRIVÉES
WAT.dom.run(async function () {
  const { user } = await WAT.refreshSession();
  const privatePages = ['dashboard', 'profil', 'modifier-profil', 'mes-trajets', 'mon-trajet', 'publier-trajet', 'mes-colis', 'colis', 'colis-details', 'demande-transport', 'mes-demandes', 'demandes-recues', 'demande-details', 'notifications', 'transport', 'administration'];
  if (!user && privatePages.includes(document.body.dataset.page)) {
    window.location.replace('connexion.html'); return;
  }
  const account = document.querySelector('.account-nav');
  if (account && !user) {
    account.querySelectorAll('a').forEach(a => { a.hidden = true; });
    const link = document.createElement('a');
    link.href = document.body.dataset.page === 'index' ? 'pages/connexion.html' : 'connexion.html';
    link.textContent = 'Connexion'; account.append(link);
  }
  if (user && user.admin) {
    // ACCÈS ADMINISTRATEUR VISIBLE SUR TOUTES LES PAGES
    const nav = document.querySelector('#main-nav');
    if (nav && !nav.querySelector('[data-admin-navigation]')) {
      const onHome = document.body.dataset.page === 'index';
      const adminLink = document.createElement('a');
      adminLink.href = onHome ? 'pages/administration.html' : 'administration.html';
      adminLink.textContent = 'Administration';
      adminLink.dataset.adminNavigation = 'true';
      if (document.body.dataset.page === 'administration') adminLink.setAttribute('aria-current', 'page');
      nav.append(adminLink);
      const dashboardLink = document.createElement('a');
      dashboardLink.href = onHome ? 'pages/dashboard.html' : 'dashboard.html';
      dashboardLink.textContent = 'Tableau de bord';
      dashboardLink.dataset.adminNavigation = 'true';
      if (document.body.dataset.page === 'dashboard') dashboardLink.setAttribute('aria-current', 'page');
      nav.append(dashboardLink);
    }
  }
  if (user) {
    WAT.dom.text('.account-nav .avatar', user.initials);
    const count = (await WAT.backend.getNotifications()).filter(n => !n.read).length;
    document.querySelectorAll('.badge-count').forEach(el => { el.textContent = count; el.hidden = !count; });
  }
});
