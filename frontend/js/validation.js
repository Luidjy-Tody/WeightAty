/* VALIDATION DES FORMULAIRES */
WAT.validation = (() => {
  const today = () => {const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);};
  const positive = value => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value)>0;
  const email = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  function parcel(p,trip) {
    const errors = {};
    if (!['Vêtements','Documents','Électronique','Autre'].includes(p.type)) errors.type = 'Sélectionnez le type de colis.';
    if (!String(p.description || '').trim()) errors.description = 'Décrivez le contenu du colis.';
    if (!positive(p.weight)) errors.weight = 'Indiquez un poids supérieur à 0.';
    else if (trip && Number(p.weight)>Number(trip.capacity)) errors.weight = `Le poids dépasse la capacité maximale de ${trip.capacity} kg.`;
    if (String(p.value ?? '').trim() === '' || !Number.isFinite(Number(p.value)) || Number(p.value) < 0) errors.value = 'Indiquez une valeur déclarée positive ou nulle.';
    for (const name of ['length','width','height']) if (!positive(p[name])) errors[name] = 'Indiquez une dimension supérieure à 0.';
    if (!trip || trip.status !== 'Publié' || trip.date<today()) errors.form = 'Ce trajet n’est plus disponible. Choisissez un autre trajet.';
    return errors;
  }
  function trip(t) {
    const errors = {};
    if (!String(t.from||'').trim()) errors.from='Indiquez le lieu de départ.';
    if (!String(t.to||'').trim()) errors.to='Indiquez la destination.';
    else if (String(t.from).trim().toLocaleLowerCase()===String(t.to).trim().toLocaleLowerCase()) errors.to='La destination doit être différente du départ.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date||'')) errors.date='Indiquez une date valide.';
    else if (t.date<today()) errors.date='Choisissez une date à partir d’aujourd’hui.';
    if (!positive(t.capacity)) errors.capacity='Indiquez un poids disponible supérieur à 0.';
    if (!String(t.pickup||'').trim()) errors.pickup='Indiquez le lieu de remise.';
    if (!String(t.delivery||'').trim()) errors.delivery='Indiquez le lieu de récupération.';
    return errors;
  }
  return {today,positive,email,parcel,trip};
})();
