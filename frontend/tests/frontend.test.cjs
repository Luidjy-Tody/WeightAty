// TESTS LOGIQUES ET VÉRIFICATIONS DES FICHIERS HTML
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function demo() {
  const storage = new Map();
  const context = vm.createContext({
    console, Date, Math, JSON, Number, String, Object, Array, RegExp,
    Promise, Set, Map, URLSearchParams, Intl,
    globalThis: {crypto: require('node:crypto').webcrypto},
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    }
  });
  context.window = context;
  for (const file of ['js/mock/data.js', 'js/validation.js', 'js/services/demo.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
  }
  return context.WAT;
}

const sample = {
  tripId: 'TRA-2', type: 'Documents', description: 'Documents fictifs',
  weight: 2, value: 100, length: 20, width: 15, height: 10, photo: ''
};

test('Les 30 fichiers HTML et leurs ressources existent', () => {
  const files = [path.join(root, 'index.html'), ...fs.readdirSync(path.join(root, 'pages'))
    .filter(name => name.endsWith('.html')).map(name => path.join(root, 'pages', name))];
  assert.equal(files.length, 30);
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /js\/views|WAT\.render|href="#\//);
    for (const match of source.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const target = match[1].split(/[?#]/)[0];
      if (!target || /^(?:https?:|data:)/.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(path.dirname(file), target)), file + ' → ' + target);
    }
  }
});

test('L’accueil contient ses textes, ses cartes, son formulaire et trois scripts dont le client API', () => {
  const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(source, /Envoyez vos colis/);
  assert.match(source, /class="hero"/);
  assert.match(source, /id="home-search"/);
  assert.match(source, /id="steps-traveler"/);
  assert.equal((source.match(/class="card trip-preview"/g) || []).length, 3);
  assert.equal((source.match(/<script /g) || []).length, 3);
});

test('Les formulaires sont écrits dans leurs fichiers HTML', () => {
  for (const name of ['connexion', 'inscription', 'mot-de-passe-oublie']) {
    const source = fs.readFileSync(path.join(root, 'pages', name + '.html'), 'utf8');
    assert.match(source, /<form[^>]+id="auth-form"/);
    assert.match(source, /name="email"/);
  }
  assert.match(fs.readFileSync(path.join(root, 'pages/colis.html'), 'utf8'), /id="parcel-form"/);
  assert.match(fs.readFileSync(path.join(root, 'pages/publier-trajet.html'), 'utf8'), /id="trip-form"/);
});

test('Le JavaScript ne remplace pas le contenu des pages par du HTML généré', () => {
  function inspect(folder) {
    for (const entry of fs.readdirSync(folder, {withFileTypes: true})) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (file.endsWith('.js')) {
        const source = fs.readFileSync(file, 'utf8');
        assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|<section|<form|<header/, file);
      }
    }
  }
  inspect(path.join(root, 'js'));
  assert.equal(fs.existsSync(path.join(root, 'js/views')), false);
  assert.equal(fs.existsSync(path.join(root, 'scripts/build-pages.cjs')), false);
});

test('Recherche, filtres et tri des données fictives', async () => {
  const w = demo();
  const found = await w.services.getTrips({from: 'paris', to: 'montreal'});
  assert.equal(found.length, 1);
  assert.equal(found[0].id, 'TRA-2');
  assert.equal((await w.services.getTrips({minWeight: 10})).length, 1);
  assert.equal((await w.services.getTrips({sort: 'weight'}))[0].capacity, 12);
  assert.equal((await w.services.getTrips({to: 'Tokyo'})).length, 0);
});

test('Les champs vides et le poids excessif sont refusés', async () => {
  const w = demo();
  const trip = await w.services.getTrip('TRA-2');
  assert.ok(Object.keys(w.validation.parcel({}, trip)).length >= 7);
  assert.match(w.validation.parcel({...sample, weight: 6}, trip).weight, /5 kg/);
  await assert.rejects(w.services.saveDraft({...sample, weight: 6}));
});

test('Le brouillon conserve les informations et le trajet choisi', async () => {
  const w = demo();
  const saved = await w.services.saveDraft(sample);
  const draft = await w.services.getDraft();
  assert.equal(draft.id, saved.id);
  assert.equal(draft.tripId, 'TRA-2');
  assert.equal(draft.description, sample.description);
  assert.equal(draft.weight, 2);
});

test('L’envoi est idempotent et synchronise demandes et colis', async () => {
  const w = demo();
  const parcel = await w.services.saveDraft(sample);
  const a = await w.services.sendRequest(parcel.id);
  const b = await w.services.sendRequest(parcel.id);
  assert.equal(a.id, b.id);
  assert.equal((await w.services.getRequests()).length, 2);
  assert.equal((await w.services.getParcel(parcel.id)).status, 'En attente');
  assert.equal(await w.services.getDraft(), null);
});

test('Accepter une demande réserve une seule fois la capacité', async () => {
  const w = demo();
  await w.services.updateRequest('DEM-205', 'Acceptée');
  assert.equal((await w.services.getTrip('MT-1')).capacity, 7);
  await assert.rejects(w.services.updateRequest('DEM-205', 'Acceptée'));
});

test('La capacité est contrôlée lors de l’acceptation', async () => {
  const w = demo();
  w.store.update(s => {s.trips.find(t => t.id === 'MT-1').capacity = 0.5;});
  await assert.rejects(w.services.updateRequest('DEM-205', 'Acceptée'));
  assert.equal((await w.services.getRequest('DEM-205')).status, 'En attente');
});

test('Annuler un trajet annule ses demandes actives', async () => {
  const w = demo();
  await w.services.cancelTrip('MT-1');
  assert.equal((await w.services.getTrip('MT-1')).status, 'Annulé');
  assert.equal((await w.services.getRequest('DEM-205')).status, 'Annulée');
});

test('Date passée, villes identiques et poids négatif sont refusés', () => {
  const w = demo();
  const errors = w.validation.trip({from: 'Paris', to: 'paris', date: '2020-01-01', capacity: -1});
  assert.ok(errors.to && errors.date && errors.capacity);
});

test('Une demande sur son propre trajet est refusée', async () => {
  const w = demo();
  const parcel = await w.services.saveDraft({...sample, tripId: 'MT-1'});
  await assert.rejects(w.services.sendRequest(parcel.id));
});

test('Un trajet publié localement apparaît dans les listes', async () => {
  const w = demo();
  const trip = await w.services.saveTrip({from: 'Nice', to: 'Rome', date: w.seed.trips[0].date, capacity: 4, pickup: 'Nice', delivery: 'Rome'});
  assert.ok((await w.services.getMyTrips()).some(t => t.id === trip.id));
  assert.ok((await w.services.getTrips({to: 'Rome'})).some(t => t.id === trip.id));
});

test('Les notifications peuvent être marquées comme lues', async () => {
  const w = demo();
  await w.services.markNotificationsRead();
  assert.equal((await w.services.getNotifications()).filter(n => !n.read).length, 0);
});

test('Aucun mot de passe n’est enregistré dans la démo', async () => {
  const w = demo();
  assert.doesNotMatch(JSON.stringify(w.store.read()), /password|motDePasse/);
  await w.services.logout();
  assert.equal(await w.services.getUser(), null);
  await w.services.openDemo();
  assert.equal((await w.services.getUser()).id, 'marie');
});
