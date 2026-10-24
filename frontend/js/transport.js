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
    WAT.dom.text('#transport-dates', 'Prise en charge : ' + (result.tracking?.date_prise_en_charge || 'En attente') + ' UTC · Livraison : ' + (result.tracking?.date_livraison || 'En attente') + ' UTC');
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
    document.getElementById('pay').hidden = !result.sender || result.requestStatus !== 'acceptee' || result.parcelStatus !== 'pret' || (!!result.payment && status !== 'refuse');
    document.getElementById('reference-field').hidden = document.getElementById('pay').hidden;
    const pending = !!result.traveler && result.requestStatus === 'acceptee' && status === 'en_attente';
    document.getElementById('validate-payment').hidden = !pending;
    document.getElementById('reject-form').hidden = !pending;
    document.getElementById('pickup').hidden = !result.traveler || result.requestStatus !== 'acceptee' || result.parcelStatus !== 'pret' || status !== 'valide';
    document.getElementById('deliver').hidden = !result.sender || result.parcelStatus !== 'pris_en_charge';
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
  for (const op of ['pay', 'pickup', 'deliver']) {
    const button = document.getElementById(op);
    button.onclick = async () => {
      const question = op === 'pay' && quote ? 'Déclarer le paiement de ' + quote.total + ' MUR (simulation, aucun débit réel) ?' : button.textContent + ' ?';
      if (!await WAT.dom.confirm(question)) return;
      WAT.dom.busy(button, async () => {
        await post(op, op === 'pay' ? { id, reference: document.getElementById('payment-reference').value } : { id });
        if (op === 'pay') WAT.dom.notify('Paiement déclaré. Le voyageur doit maintenant le valider.');
        await refresh();
      });
    };
  }
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
