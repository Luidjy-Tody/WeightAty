// VALIDER LE CONTACT SANS ENVOYER DE MESSAGE RÉEL
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const data = WAT.dom.values(contactForm);
  const errors = {};
  ['name', 'subject', 'message'].forEach(function (name) {
    if (!data[name].trim()) errors[name] = 'Ce champ est obligatoire.';
  });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) errors.email = 'Indiquez une adresse e-mail valide.';
  if (!WAT.dom.errors(contactForm, errors)) return;
  contactForm.reset();
  const result = document.getElementById('contact-result');
  result.hidden = false;
  result.textContent = 'Message simulé : aucun message n’a été envoyé.';
});
