// SERVICES RÉELS : API PHP UNIQUEMENT
WAT.services = WAT.backend;

// METTRE À JOUR LES VALEURS, SANS RECRÉER LA PAGE HTML
WAT.page = {
  async tripSummary(trip) {
    const d = WAT.dom;
    const owner = await WAT.services.getUser(trip.ownerId);
    d.text('[data-trip-from]', trip.from);
    d.text('[data-trip-to]', trip.to);
    d.text('[data-trip-date]', d.date(trip.date));
    d.text('[data-trip-capacity]', d.number(trip.capacity) + ' kg');
    d.text('[data-trip-id]', trip.id);
    d.text('[data-owner-name]', owner?.name);
    d.text('[data-owner-initials]', owner?.initials);
    d.text('[data-owner-rating]', owner?.rating ? '★ ' + d.number(owner.rating) : 'Aucune évaluation');
    d.text('[data-owner-completed]', d.number(owner?.completed) + ' trajets réalisés');
    d.text('[data-owner-description]', owner ? owner.name + ' : ' + d.number(owner.completed) + ' trajets réalisés.' : '');
    return owner;
  },

  parcel(parcel) {
    const d = WAT.dom;
    d.text('[data-parcel-type]', parcel.type);
    d.text('[data-parcel-id]', parcel.id);
    d.text('[data-parcel-weight]', d.number(parcel.weight) + ' kg');
    d.text('[data-parcel-dimensions]', [parcel.length, parcel.width, parcel.height].map(d.number).join(' × ') + ' cm');
    d.text('[data-parcel-value]', d.number(parcel.value) + ' MUR');
    d.text('[data-parcel-description]', parcel.description);
    const photo = document.querySelector('[data-parcel-photo]');
    if (photo) {
      photo.hidden = !parcel.photo;
      if (parcel.photo) photo.src = parcel.photo;
      else photo.removeAttribute('src');
    }
  },

  row(templateId) {
    return document.getElementById(templateId).content.firstElementChild.cloneNode(true);
  }
};

