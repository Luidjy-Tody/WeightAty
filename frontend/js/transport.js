// ACTIONS LIÉES À UNE DEMANDE, VÉRIFIÉES PAR LE SERVEUR
WAT.dom.run(async function () {
  const id = WAT.dom.params.get('id');
  document.getElementById('back-request').href = 'demande-details.html?id=' + encodeURIComponent(id);
  const me = await WAT.backend.getUser();
  let timer;
  let quote;
  async function refresh() {
    const result = await WAT.api('transport', { id });
    document.getElementById('loading').hidden = true;
    WAT.dom.text('#transport-status', 'Demande : ' + result.requestStatus + ' · Colis : ' + result.parcelStatus);
    WAT.dom.text('#transport-dates', 'Prise en charge : ' + (result.tracking?.date_prise_en_charge || 'En attente') + ' UTC · Livraison déclarée : ' + (result.tracking?.date_livraison_declaree || 'En attente') + ' UTC · Réception confirmée : ' + (result.tracking?.date_livraison || 'En attente') + ' UTC');
    WAT.dom.text('#transport-price', 'Transport : ' + result.quote.transport + ' MUR · Frais : ' + result.quote.fees + ' MUR · Total : ' + result.quote.total + ' MUR' + (result.refund ? ' · Remboursement simulé enregistré' : ''));
    quote = result.quote;
    const status = result.payment?.statut;
    const summary = document.getElementById('payment-summary');
    summary.hidden = !result.payment;
    if (result.payment) {
      const p = result.payment;
      const detail = 'transport ' + p.transport + ' MUR + frais ' + p.frais + ' MUR = ' + (Number(p.transport) + Number(p.frais)).toFixed(2) + ' MUR (simulation, aucun débit réel)' + (p.reference ? ', référence ' + p.reference : '');
      summary.className = 'notice' + (status === 'valide' ? '' : status === 'refuse' ? ' error' : ' warning');
      summary.textContent = status === 'valide' ? 'Paiement validé le ' + (p.date_validation || p.date_creation) + ' UTC : ' + detail + '.'
        : status === 'refuse' ? 'Paiement refusé : ' + p.motif_refus + (result.sender ? ' Vous pouvez payer à nouveau ou signaler un problème.' : '')
        : 'Paiement déclaré le ' + p.date_creation + ' UTC : ' + detail + '. En attente de la validation du voyageur.';
    }
    document.getElementById('card-form').hidden = !result.sender || result.requestStatus !== 'acceptee' || result.parcelStatus !== 'pret' || (!!result.payment && status !== 'refuse');
    const pending = !!result.traveler && result.requestStatus === 'acceptee' && status === 'en_attente';
    document.getElementById('validate-payment').hidden = !pending;
    document.getElementById('reject-form').hidden = !pending;
    document.getElementById('pickup').hidden = !result.traveler || result.requestStatus !== 'acceptee' || result.parcelStatus !== 'pret' || status !== 'valide';
    const declared = !!result.tracking?.date_livraison_declaree;
    document.getElementById('deliver').hidden = !result.traveler || result.parcelStatus !== 'pris_en_charge' || declared;
    document.getElementById('confirm-receipt').hidden = !result.sender || result.parcelStatus !== 'pris_en_charge' || !declared;
    const waiting = result.parcelStatus === 'pris_en_charge' && declared;
    if (waiting) { const note = document.createElement('p'); note.textContent = result.sender ? 'Le voyageur indique avoir livré le colis (' + result.tracking.date_livraison_declaree + ' UTC). Confirmez la réception, ou signalez un problème si vous ne l’avez pas reçu.' : 'Livraison déclarée le ' + result.tracking.date_livraison_declaree + ' UTC. En attente de la confirmation de l’expéditeur.'; note.className = 'notice warning'; document.getElementById('delivery-note').replaceChildren(note); }
    document.getElementById('delivery-note').hidden = !waiting;
    const list = document.getElementById('messages'); list.replaceChildren();
    result.messages.forEach(message => {
      const item = document.getElementById('message-row').content.firstElementChild.cloneNode(true);
      item.querySelector('strong').textContent = message.prenom;
      item.querySelector('p').textContent = message.contenu;
      item.querySelector('small').textContent = message.date_creation + ' UTC'; list.append(item);
    });
    document.getElementById('messages-empty').hidden = !!result.messages.length;
    const reviews = document.getElementById('reviews'); reviews.replaceChildren();
    result.reviews.forEach(review => { const item = document.createElement('li'); item.textContent = review.note + '/5 · ' + (review.commentaire || ''); reviews.append(item); });
    document.getElementById('review-form').hidden = result.parcelStatus !== 'livre' || result.reviews.some(r => String(r.auteur_id) === me.id);
  }
  for (const op of ['pickup', 'deliver']) {
    const button = document.getElementById(op);
    button.onclick = async () => {
      if (!await WAT.dom.confirm(button.textContent + ' ?')) return;
      WAT.dom.busy(button, async () => { await post(op, { id }); await refresh(); });
    };
  }
  // PAIEMENT PAR CARTE SIMULÉ : le numéro complet et le CVC ne quittent jamais le navigateur.
  const cardForm = document.getElementById('card-form');
  const cardField = name => document.getElementById('card-' + name);
  const luhn = digits => { let sum = 0; for (let i = 0; i < digits.length; i++) { let d = Number(digits[digits.length - 1 - i]); if (i % 2) { d *= 2; if (d > 9) d -= 9; } sum += d; } return sum % 10 === 0; };
  const brandOf = digits => /^4/.test(digits) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(digits) ? 'Mastercard' : 'Carte';
  const TEST_OK = '4242424242424242', TEST_DECLINED = '4000000000000002';
  cardField('number').oninput = event => { const d = event.target.value.replace(/\D/g, '').slice(0, 19); event.target.value = d.replace(/(.{4})/g, '$1 ').trim(); };
  cardField('expiry').oninput = event => { const d = event.target.value.replace(/\D/g, '').slice(0, 4); event.target.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };
  cardField('cvc').oninput = event => { event.target.value = event.target.value.replace(/\D/g, '').slice(0, 3); };
  function cardErrors() {
    const errors = {}, digits = cardField('number').value.replace(/\D/g, '');
    if (cardField('name').value.trim().length < 2) errors.name = 'Saisissez le nom du titulaire.';
    if (digits.length < 13 || !luhn(digits)) errors.number = 'Numéro de carte invalide.';
    else if (digits !== TEST_OK && digits !== TEST_DECLINED) errors.number = 'Simulation : utilisez une carte de test (4242 4242 4242 4242).';
    const match = /^(\d{2})\/(\d{2})$/.exec(cardField('expiry').value), now = new Date();
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 12 || (2000 + Number(match[2])) * 12 + Number(match[1]) < now.getFullYear() * 12 + now.getMonth() + 1) errors.expiry = 'Date d’expiration invalide ou passée.';
    if (!/^\d{3}$/.test(cardField('cvc').value)) errors.cvc = 'Le CVC contient 3 chiffres.';
    return { errors, digits };
  }
  cardForm.onsubmit = async event => {
    event.preventDefault();
    const { errors, digits } = cardErrors();
    for (const name of ['name', 'number', 'expiry', 'cvc']) {
      document.getElementById('card-' + name + '-error').textContent = errors[name] || '';
      cardField(name).setAttribute('aria-invalid', errors[name] ? 'true' : 'false');
    }
    if (Object.keys(errors).length) { cardForm.querySelector('[aria-invalid=true]')?.focus(); return; }
    if (!await WAT.dom.confirm('Payer ' + (quote ? quote.total + ' MUR ' : '') + '(simulation, aucun débit réel) ?')) return;
    WAT.dom.busy(document.getElementById('pay'), async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (digits === TEST_DECLINED) { WAT.dom.notify('Carte refusée par la banque (simulation). Essayez une autre carte de test.', true); return; }
      const reference = 'SIM-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase() + ' · ' + brandOf(digits) + ' ****' + digits.slice(-4);
      try { await post('pay', { id, reference }); cardForm.reset(); WAT.dom.notify('Paiement simulé accepté. Le voyageur doit maintenant le valider.'); }
      finally { await refresh(); }
    });
  };
  const receiptButton = document.getElementById('confirm-receipt');
  receiptButton.onclick = async () => {
    if (!await WAT.dom.confirm('Confirmer que vous avez bien reçu le colis ? Vous pourrez ensuite donner votre avis.')) return;
    WAT.dom.busy(receiptButton, async () => { try { await post('confirmReceipt', { id }); WAT.dom.notify('Réception confirmée. Vous pouvez donner votre avis.'); } finally { await refresh(); } });
  };
  const validateButton = document.getElementById('validate-payment');
  validateButton.onclick = async () => {
    if (!await WAT.dom.confirm('Confirmer que vous avez bien reçu le paiement ? Les kilos seront retirés de la capacité du trajet.')) return;
    WAT.dom.busy(validateButton, async () => {
      try { await post('validatePayment', { id }); WAT.dom.notify('Paiement validé : le transport est confirmé.'); }
      finally { await refresh(); }
    });
  };
  const rejectForm = document.getElementById('reject-form');
  rejectForm.onsubmit = event => {
    event.preventDefault();
    WAT.dom.busy(rejectForm.querySelector('button'), async () => {
      await post('rejectPayment', { id, ...WAT.dom.values(rejectForm) }); rejectForm.reset();
      WAT.dom.notify('Paiement refusé. L’expéditeur a été prévenu.'); await refresh();
    });
  };
  for (const op of ['message', 'review', 'report']) {
    const form = document.getElementById(op + '-form');
    form.onsubmit = event => {
      event.preventDefault();
      WAT.dom.busy(form.querySelector('button'), async () => {
        await post(op, { id, ...WAT.dom.values(form) }); form.reset();
        WAT.dom.notify(op === 'report' ? 'Signalement enregistré.' : 'Enregistré.'); await refresh();
      });
    };
  }
  await refresh();
  timer = setInterval(() => { if (!document.hidden) refresh().catch(error => { clearInterval(timer); WAT.dom.notify(error.message, true); }); }, 10000);
  window.addEventListener('pagehide', () => clearInterval(timer));
});
