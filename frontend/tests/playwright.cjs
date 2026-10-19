/* VÉRIFICATIONS NAVIGATEUR OPTIONNELLES */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const entry=process.env.WAT_TEST_URL||'http://127.0.0.1:8080/index.html';
  const pageUrl=file=>new URL(file,entry).href;
  try {
    await page.goto(entry);
    await page.getByRole('heading',{name:'Envoyez vos colis grâce aux voyageurs'}).waitFor();
    await page.evaluate(()=>{localStorage.removeItem('weight-aty-demo-v1');});
    await page.reload();
    await page.getByRole('textbox',{name:'Lieu de départ',exact:true}).fill('Paris');
    await page.getByRole('textbox',{name:'Destination',exact:true}).fill('Montréal');
    await page.getByRole('button',{name:'Rechercher',exact:true}).click();
    await page.getByText('1 trajet(s) trouvé(s)',{exact:true}).waitFor();
    await page.getByRole('link',{name:'Voir les détails',exact:true}).click();
    await page.getByRole('heading',{name:'Paris vers Montréal',exact:true}).waitFor();
    await page.getByRole('link',{name:'Envoyer un colis',exact:true}).click();
    await page.getByRole('heading',{name:'Informations de votre colis'}).waitFor();
    await page.getByLabel('Type de colis').selectOption({label:'Documents'});
    await page.getByLabel('Description').fill('Documents de test navigateur.');
    await page.getByLabel('Poids',{exact:false}).fill('6');
    await page.getByLabel('Valeur déclarée').fill('100');
    await page.getByLabel('Longueur').fill('20');
    await page.getByLabel('Largeur').fill('15');
    await page.getByLabel('Hauteur').fill('10');
    await page.getByRole('button',{name:'Valider les informations'}).click();
    await page.getByText('Le poids dépasse la capacité maximale de 5 kg.',{exact:true}).waitFor();
    await page.getByLabel('Poids',{exact:false}).fill('2');
    await page.locator('#photo').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=','base64')});
    await page.locator('#photo-zone img').waitFor();
    await page.getByRole('button',{name:'Supprimer la photo'}).click();
    await page.getByRole('button',{name:'Valider les informations'}).click();
    await page.getByRole('heading',{name:'Envoyer une demande',exact:true}).waitFor();
    assert.ok((await page.locator('main').innerText()).includes('Sarah L.'));
    await page.getByRole('link',{name:'Modifier',exact:true}).click();
    await page.getByRole('heading',{name:'Informations de votre colis'}).waitFor();
    assert.equal(await page.getByLabel('Description').inputValue(),'Documents de test navigateur.');
    assert.equal(await page.getByLabel('Poids',{exact:false}).inputValue(),'2');
    await page.getByRole('button',{name:'Valider les informations'}).click();
    await page.getByRole('button',{name:'Simuler l’envoi de la demande'}).click();
    await page.locator('#send-success').waitFor({state:'visible'});
    await page.getByRole('link',{name:'Voir mes demandes',exact:true}).click();
    await page.getByRole('heading',{name:'Mes demandes',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>WAT.store.read().requests.filter(r=>r.senderId==='marie').length),2);
    for(const width of [390,768,1440]){
      await page.setViewportSize({width,height:1000});
      for(const route of ['index.html','pages/recherche.html','pages/profil.html','pages/notifications.html','pages/connexion.html']){
        await page.goto(pageUrl(route));
        await page.locator('main h1').waitFor();
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
        assert.equal(overflow,false,`Débordement à ${width}px : ${route}`);
      }
    }
    await page.goto(entry);
    await page.setViewportSize({width:390,height:844});
    const menu=page.getByRole('button',{name:'Ouvrir le menu'});
    await menu.click();
    assert.equal(await menu.getAttribute('aria-expanded'),'true');
    await page.locator('#main-nav').getByRole('link',{name:'Mes trajets',exact:true}).click();
    await page.getByRole('heading',{name:'Mes trajets',exact:true}).waitFor();
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
    assert.deepEqual(errors,[],'Erreurs JavaScript détectées');
    console.log('Vérifications navigateur réussies : parcours, photo, mobile, navigation et erreurs JS.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
