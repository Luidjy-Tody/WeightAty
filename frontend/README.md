# Weight’Aty — Frontend HTML / CSS / JavaScript

## Lire et modifier le code

**Le contenu de chaque page est écrit directement dans son fichier HTML.**

- L’accueil complet est dans `index.html` : navigation, présentation, formulaire de recherche, cartes, deux panneaux « Comment ça marche » et pied de page.
- La connexion est dans `pages/connexion.html`.
- L’inscription est dans `pages/inscription.html`.
- Le formulaire colis est dans `pages/colis.html`.
- Les autres fichiers du dossier `pages/` suivent le même principe.

Pour changer un titre, un paragraphe, un champ ou la structure d’une carte, modifier directement le HTML correspondant. Aucune commande de génération n’est nécessaire et aucun script ne remplace le contenu principal de la page.

Le JavaScript sert uniquement aux interactions : menu, onglets, filtres, saisies, aperçu de photo et simulations locales. Il n’y a pas de React, Angular, Vue, TypeScript, Bootstrap ou Tailwind.

## Scripts de l’accueil

`index.html` charge seulement :

- `js/app.js` : menu mobile, messages et outils communs.
- `js/accueil.js` : recherche depuis l’accueil et changement d’onglet.

Ces balises `<script src="...">` relient simplement un fichier JavaScript à la page. Elles n’importent pas du HTML.

Les pages avec données fictives chargent aussi `js/validation.js`, `js/mock/data.js` et `js/services/demo.js`, puis leur script dédié. Par exemple `pages/colis.html` utilise `js/colis.js` pour valider les champs du formulaire déjà écrit dans cette page.

## Architecture

```text
weight-aty/
├── index.html
├── pages/
│   ├── connexion.html
│   ├── inscription.html
│   ├── mot-de-passe-oublie.html
│   ├── recherche.html
│   ├── trajet-details.html
│   ├── publier-trajet.html
│   ├── colis.html
│   ├── demande-transport.html
│   ├── mes-colis.html
│   ├── mes-demandes.html
│   ├── mes-trajets.html
│   ├── dashboard.html
│   ├── profil.html
│   └── autres pages de détail et d’information
├── css/
│   ├── global.css
│   ├── components.css
│   └── pages.css
├── js/
│   ├── app.js
│   ├── accueil.js
│   ├── auth.js
│   ├── recherche.js
│   ├── colis.js
│   ├── autres scripts d’interaction par page
│   ├── validation.js
│   ├── services/
│   └── mock/
├── assets/
│   ├── images/
│   └── icons/
├── docs/
├── tests/
└── README.md
```

Les modèles `<template>` sont écrits dans les fichiers HTML des listes. Ils servent à répéter une ligne ou une carte lors d’un filtre ou d’une mise à jour. Pour modifier l’apparence de ces éléments, modifier aussi ce modèle HTML. Aucun modèle HTML n’est caché dans un fichier JavaScript.

Les valeurs de démonstration peuvent être actualisées par les scripts : noms, dates, poids, statuts et lignes des tableaux. Leur structure reste définie dans le HTML. Pour changer les données fictives globales, modifier `js/mock/data.js`, puis réinitialiser la démo depuis le profil.

## Lancer le projet sur Ubuntu ou Windows

Ouvrir le dossier dans VS Code et lancer `index.html` avec Live Server.

Autre possibilité, si Python est déjà installé, depuis le dossier `weight-aty` :

```bash
# Ubuntu
python3 -m http.server 8080 --bind 127.0.0.1
```

```powershell
# Windows
py -m http.server 8080 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:8080`. Ce serveur sert uniquement les fichiers statiques ; il ne constitue pas un backend applicatif.

Les fichiers HTML peuvent aussi s’ouvrir directement, mais le partage de localStorage entre fichiers `file://` dépend du navigateur. Utiliser HTTP pour tester le parcours complet.

Aucune installation de framework, compilation ni génération de pages n’est nécessaire.

## Design

La référence est https://gong-otter-29734236.figma.site. Ce projet reprend les couleurs vertes, le fond clair, les cartes et la disposition de la maquette. C’est une réimplémentation à partir des pages publiques, pas un export de son code.

La police Manrope est utilisée si elle est installée, sinon Segoe UI / Arial. Les icônes sont des fichiers SVG locaux dans `assets/icons/`. Les styles et media queries se trouvent dans `css/`.

## Démonstration

- Le profil fictif de Marie est utilisé par défaut.
- Les données sont enregistrées localement sous `weight-aty-demo-v1`.
- Connexion, inscription, récupération et contact sont explicitement simulés.
- Aucun mot de passe n’est enregistré et aucun e-mail n’est envoyé.
- Les photos JPG/PNG jusqu’à 5 Mo sont prévisualisées, redimensionnées et compressées localement.
- Aucun serveur applicatif, paiement ou base de données n’est fourni.
- Ne pas saisir de données réelles ou sensibles dans cette démo.
- Réinitialisation : profil → « Réinitialiser la démonstration ».
- Les dates fictives sont relatives au premier chargement, puis conservées avec les données.

## Préparer le backend en équipe

Les scripts de page appellent `WAT.services`. Dans la démo, cette interface utilise `js/services/demo.js` et les exemples de `js/mock/data.js`.

Pour brancher le backend : conserver les noms des fonctions utiles, implémenter les appels HTTP dans `js/services/`, puis remplacer l’affectation `WAT.services = WAT.mock` par le service API réel. `js/services/api.js` fournit un exemple de client HTTP, mais n’est pas chargé par défaut. Aucun basculement automatique vers de fausses réponses en cas d’erreur serveur.

Relier aussi les formulaires d’authentification, le contact, le téléversement des photos et les brouillons au serveur. Le backend doit vérifier les droits, les champs et la capacité des trajets, même si le navigateur le fait déjà pour la démo.

Voir `docs/API.md`, `docs/DEMO.md` et `pages.md`.

## Tests

Avec Node.js installé :

```bash
node --test tests/frontend.test.cjs
```

Le rapport exact est dans `docs/TESTS.md`. Pour les tests navigateur optionnels, démarrer le serveur statique sur le port 8080 puis, dans un autre terminal :

```bash
npm install
npx playwright install chromium
npm run test:browser
```

Le script Playwright est fourni mais n’a pas été exécuté dans l’environnement de livraison. Node/npm ne sont pas nécessaires pour consulter le frontend avec Live Server.
