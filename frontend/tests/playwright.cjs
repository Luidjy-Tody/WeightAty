// PARCOURS CONNECTÉ ET CONTRÔLES RESPONSIVE À EXÉCUTER SUR UNE BASE DE TEST.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.WEIGHTATY_TEST_URL;
if (!base) throw new Error('WEIGHTATY_TEST_URL requis, par exemple http://localhost:8000');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const traveler = await browser.newContext();
    const sender = await browser.newContext();
    async function fixture(context, role) {
      let csrf = (await (await context.request.get(base + '/backend/api/index.php?op=session')).json()).csrf;
      async function post(op, data) {
        const response = await context.request.post(base + '/backend/api/index.php?op=' + op, { data, headers: { 'X-CSRF-Token': csrf } });
        const result = await response.json(); assert.equal(response.status(), 200, JSON.stringify(result));
        if (result.csrf) csrf = result.csrf; return result;
      }
      const email = 'pw-' + Date.now() + '-' + role + '@example.test';
      await post('register', { firstName: 'Playwright', lastName: role, email, password: 'Playwright-tests-2026!' });
      await post('login', { email, password: 'Playwright-tests-2026!' }); return post;
    }
    const publish = await fixture(traveler, 'voyageur');
    await fixture(sender, 'expediteur');
    const trip = await publish('saveTrip', { from: 'Paris PW ' + Date.now(), to: 'Montréal', date: '2099-05-01', capacity: 8, pickup: 'Paris gare', delivery: 'Montréal gare', notes: 'Test navigateur' });
    const page = await sender.newPage();page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/frontend/pages/colis.html?trip=' + trip.id);
    await page.locator('#f-weight-hint').filter({ hasText: '8' }).waitFor();
    await page.locator('#f-type').selectOption('Documents');
    for (const [name, value] of Object.entries({ description: 'Documents navigateur', weight: '9', value: '100', length: '20', width: '15', height: '10' })) await page.locator('[name="' + name + '"]').fill(value);
    await page.locator('#parcel-form [type=submit]').click();
    await page.locator('#f-weight-error').filter({ hasText: '8 kg' }).waitFor();
    await page.locator('#f-weight').fill('2');await page.locator('#parcel-form [type=submit]').click();
    await page.waitForURL('**/demande-transport.html');await page.locator('#send-request').click();
    await page.locator('#send-success').waitFor({ state: 'visible' });
    const href = await page.locator('[data-created-request]').getAttribute('href');
    await page.goto(new URL(href, base + '/frontend/pages/').href);
    const requestId = new URL(page.url()).searchParams.get('id');
    const travelPage = await traveler.newPage();travelPage.on('pageerror', e => errors.push(e.message));
    await travelPage.goto(base + '/frontend/pages/demande-details.html?id=' + requestId);
    await travelPage.locator('[data-status="Acceptée"]').click();await travelPage.locator('#dialog-confirm').click();
    await travelPage.locator('[data-request-status]').filter({ hasText: 'Acceptée' }).waitFor();
    await page.goto(base + '/frontend/pages/transport.html?id=' + requestId);
    await page.locator('#pay').waitFor({ state: 'visible' });await page.locator('#pay').click();await page.locator('#dialog-confirm').click();
    await page.locator('#transport-price').filter({ hasText: 'Paiement simulé enregistré' }).waitFor();
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const file of ['index.html', 'pages/recherche.html', 'pages/mes-demandes.html', 'pages/colis.html?trip=' + trip.id, 'pages/transport.html?id=' + requestId]) {
        await page.goto(base + '/frontend/' + file);
        await page.waitForLoadState('networkidle');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), file + ' à ' + width + 'px');
      }
    }
    assert.deepEqual(errors, []);
    console.log('Parcours connecté et 20 contrôles de largeur réussis.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
