// PRÉPARER LE COLIS POUR LE TRAJET SÉLECTIONNÉ
WAT.dom.run(async function () {
  const d = WAT.dom;
  const form = document.getElementById('parcel-form');
  const resume = d.params.get('parcel');
  const draft = resume ? await WAT.services.getParcel(resume) : await WAT.services.getDraft();
  const tripId = d.params.get('trip') || draft?.tripId;
  const trip = tripId ? await WAT.services.getTrip(tripId) : null;
  if (!trip) return d.error('Choisissez un trajet avant de renseigner votre colis.');
  if (resume && (!draft || !['Brouillon', 'Prêt'].includes(draft.status))) return d.error('Ce brouillon ne peut plus être modifié.');
  const parcel = draft && (resume || draft.tripId === trip.id) && ['Brouillon', 'Prêt'].includes(draft.status) ? draft : {};
  d.fill(form, parcel);
  form.elements.weight.max = trip.capacity;
  d.text('#f-weight-hint', 'Maximum ' + d.number(trip.capacity) + ' kg');
  await WAT.page.tripSummary(trip);
  document.querySelector('[data-back-trip]').href = 'trajet-details.html?id=' + encodeURIComponent(trip.id);

  // PRÉVISUALISER LA PHOTO
  let photo = parcel.photo || '';
  let loading = false;
  const input = document.getElementById('photo');
  const image = document.getElementById('photo-preview');
  const remove = document.getElementById('remove-photo');
  function preview() {
    image.hidden = !photo;
    remove.hidden = !photo;
    if (photo) image.src = photo;
    else image.removeAttribute('src');
  }
  remove.onclick = function () {
    photo = '';
    input.value = '';
    document.getElementById('photo-error').textContent = '';
    preview();
  };
  input.onchange = async function () {
    const file = input.files[0];
    if (!file) return;
    const error = document.getElementById('photo-error');
    error.textContent = '';
    loading = true;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('La photo dépasse 5 Mo.');
      if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Choisissez une image JPG ou PNG.');
      const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!png && !jpg) throw new Error('Le fichier n’est pas une image JPG ou PNG valide.');
      const data = await new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = function () { reject(new Error('Impossible de lire cette image.')); };
        reader.readAsDataURL(file);
      });
      photo = await new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () {
          const ratio = Math.min(1, 1000 / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * ratio));
          canvas.height = Math.max(1, Math.round(img.height * ratio));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        };
        img.onerror = function () { reject(new Error('Cette image ne peut pas être affichée.')); };
        img.src = data;
      });
      preview();
    } catch (exception) {
      error.textContent = exception.message;
      input.value = '';
    } finally {
      loading = false;
    }
  };
  preview();

  // VALIDER LES INFORMATIONS
  form.onsubmit = function (event) {
    event.preventDefault();
    const values = d.values(form);
    delete values.photoFile;
    const data = { ...values, tripId: trip.id, photo: photo };
    if (parcel.id) data.id = parcel.id;
    const errors = WAT.validation.parcel(data, trip);
    if (loading) errors.form = 'Attendez la fin du chargement de la photo.';
    if (!d.errors(form, errors)) return;
    d.busy(form.querySelector('[type="submit"]'), async function () {
      await WAT.services.saveDraft(data);
      window.location.href = 'demande-transport.html';
    });
  };
});
