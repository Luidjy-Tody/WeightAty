/* POINTEUR VERS LE BACKEND PHP */
window.WAT = window.WAT || {};

/* Adresse de base de l'API PHP.
   En local (XAMPP) : http://localhost/weight-dev/WeightAty/backend
   Adapter si le dossier du projet porte un autre nom. */
WAT.config = window.WAT.config || {
  mode: 'api',
  apiBaseUrl: 'http://localhost/weight-dev/WeightAty/backend'
};

WAT.api = async function (path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(WAT.config.apiBaseUrl + path, {
    method,
    credentials: 'include',
    signal,
    headers: body === undefined
      ? { Accept: 'application/json' }
      : { Accept: 'application/json', 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  let donnees = null;
  try {
    donnees = await response.json();
  } catch {
    donnees = null;
  }

  if (!response.ok) {
    const erreur = new Error((donnees && donnees.message) || `La requête a échoué (${response.status}).`);
    erreur.status = response.status;
    erreur.errors = (donnees && donnees.errors) || null;
    throw erreur;
  }

  return donnees;
};
