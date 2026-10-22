// ACTIONS LIÉES À UNE DEMANDE, VÉRIFIÉES PAR LE SERVEUR
WAT.dom.run(async function () {
  const id = WAT.dom.params.get('id');
  document.getElementById('back-request').href = 'demande-details.html?id=' + encodeURIComponent(id);
  const me = await WAT.backend.getUser();
  let timer;
  async function refresh() {
    const result = await WAT.api('transport', { id });
    document.getElementById('loading').hidden = true;
    WAT.dom.text('#transport-status', 'Demande : ' + result.requestStatus + ' · Colis : ' + result.parcelStatus);
    WAT.dom.text('#transport-dates', 'Prise en charge : ' + (result.tracking?.date_prise_en_charge || 'En attente') + ' UTC · Livraison : ' + (result.tracking?.date_livraison || 'En attente') + ' UTC');
    WAT.dom.text('#transport-price', 'Transport : ' + result.quote.transport + ' MUR · Frais : ' + result.quote.fees + ' MUR · Total : ' + result.quote.total + ' MUR' + (result.refund ? ' · Remboursement simulé enregistré' : result.payment ? ' · Paiement simulé enregistré : ' + (Number(result.payment.transport) + Number(result.payment.frais)).toFixed(2) + ' MUR' : ''));
    document.getElementById('pay').hidden = !result.sender || result.requestStatus !== 'acceptee' || result.parcelStatus !== 'pret' || !!result.payment;
    document.getElementById('pickup').hidden = !result.traveler || result.requestStatus !== 'acceptee' || result.parcelStatus !== 'pret' || !result.payment;
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
      if (!await WAT.dom.confirm(button.textContent + ' ?')) return;
      WAT.dom.busy(button, async () => { await post(op, { id }); await refresh(); });
    };
  }
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
