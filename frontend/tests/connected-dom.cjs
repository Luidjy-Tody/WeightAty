// TESTS DOM CONNECTÉS : aucune vérification visuelle ou responsive avec jsdom.
const { JSDOM, CookieJar, VirtualConsole } = require('jsdom');
const assert = require('node:assert/strict');
const base = process.env.WEIGHTATY_TEST_URL;
if (!base) throw new Error('WEIGHTATY_TEST_URL requis : serveur PHP et base de test dédiés.');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let checks = 0;
async function client() {
  const jar = new CookieJar();
  async function request(url, options = {}) {
    url = new URL(String(url), base).href;
    const response = await fetch(url, { ...options, headers: { ...options.headers, Cookie: jar.getCookieStringSync(url) } });
    for (const cookie of response.headers.getSetCookie()) jar.setCookieSync(cookie, url);
    return response;
  }
  let csrf;
  async function api(op, body) {
    if (!csrf) csrf = (await api('session')).csrf;
    const response = await request('/backend/api/index.php?op=' + op, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify(body) });
    const value = await response.json(); assert.equal(response.status, 200, JSON.stringify(value));
    if (value?.csrf) csrf = value.csrf;
    return value;
  }
  // Amorcer sans récursion.
  csrf = (await (await request('/backend/api/index.php?op=session')).json()).csrf;
  async function page(name, query = '') {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', error => { if (!error.message.includes('navigation')) errors.push(error.message); });
    const dom = await JSDOM.fromURL(base + '/frontend/' + name + query, {
      cookieJar: jar, resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(window) { window.fetch = request; window.HTMLDialogElement.prototype.showModal = function () {}; window.HTMLDialogElement.prototype.close = function () {}; }
    });
    await new Promise(resolve => dom.window.addEventListener('load', resolve));
    await wait(180);
    assert.deepEqual(errors, [], name);
    const toast = dom.window.document.querySelector('#toast.error:not([hidden])');
    assert.equal(toast, null, name + ': ' + toast?.textContent);
    checks++;
    return dom;
  }
  return { api, page };
}
(async () => {
  const traveler = await client(), sender = await client();
  const unique = Date.now();
  for (const [index, c] of [traveler, sender].entries()) {
    const email = `dom-${unique}-${index}@example.test`;
    await c.api('register', { email, password: 'Dom-tests-2026!', firstName: 'Test', lastName: String(index) });
    await c.api('login', { email, password: 'Dom-tests-2026!' });
  }
  let dom = await traveler.page('pages/publier-trajet.html');
  let form = dom.window.document.getElementById('trip-form');
  for (const [name, value] of Object.entries({ from: 'Paris', to: 'Montréal', date: '2099-05-01', capacity: 8, pickup: 'Paris gare', delivery: 'Montréal gare', notes: 'Test DOM' })) form.elements.namedItem(name).value = value;
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); await wait(250);dom.window.close();
  const trip = (await traveler.api('myTrips'))[0]; assert.equal(trip.from, 'Paris');checks++;
  dom = await sender.page('pages/recherche.html', '?from=Paris&to=Montréal');
  assert.ok(dom.window.document.querySelector('#results-list a').href.includes('trajet-details.html?id='));dom.window.close();
  dom = await sender.page('pages/colis.html', '?trip=' + trip.id);
  form = dom.window.document.getElementById('parcel-form');
  for (const [name, value] of Object.entries({ type: 'Documents', description: 'Dossier DOM', weight: 2, value: 100, length: 20, width: 15, height: 10 })) form.elements.namedItem(name).value = value;
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));await wait(250);assert.equal(dom.window.document.querySelector('[aria-invalid=true]'),null,dom.window.document.querySelector('.error:not(:empty)')?.textContent);assert.equal(dom.window.document.querySelector('#toast.error:not([hidden])'),null,dom.window.document.getElementById('toast').textContent);dom.window.close();
  const parcel = await sender.api('draft');assert.equal(parcel.description, 'Dossier DOM');checks++;
  dom = await sender.page('pages/demande-transport.html');
  dom.window.document.getElementById('send-request').click();await wait(250);
  assert.equal(dom.window.document.getElementById('send-success').hidden, false);dom.window.close();checks++;
  const request = (await sender.api('requests'))[0];
  const routes = ['index.html','pages/connexion.html','pages/inscription.html','pages/mot-de-passe-oublie.html','pages/reinitialisation.html','pages/dashboard.html','pages/mes-demandes.html','pages/mes-colis.html','pages/notifications.html','pages/profil.html','pages/modifier-profil.html','pages/colis-details.html?id='+parcel.id,'pages/demande-details.html?id='+request.id,'pages/transport.html?id='+request.id,'pages/trajet-details.html?id='+trip.id,'pages/voyageur.html?id='+trip.ownerId,'pages/a-propos.html','pages/aide.html','pages/conditions.html','pages/confidentialite.html','pages/contact.html','pages/introuvable.html'];
  for (const route of routes) { dom = await sender.page(route);dom.window.close(); }
  for (const route of ['mes-trajets.html','demandes-recues.html','mon-trajet.html?id='+trip.id]) { dom = await traveler.page('pages/'+route);dom.window.close(); }
  console.log(`${checks} contrôles DOM connectés réussis. Rendu visuel et mobile non testés.`);
})().catch(error => { console.error(error); process.exit(1); });
