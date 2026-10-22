# Frontend Weight’Aty

Le contenu des pages reste directement écrit en HTML : titres, formulaires, navigation, pied de page et templates des lignes de données. JavaScript remplit les données et gère les interactions.

Lancer le projet avec PHP depuis la racine, selon le README principal. Le mode connecté ne fonctionne pas en ouvrant simplement le fichier HTML ou avec Live Server seul.

`js/services/api.js` fournit les services PHP et la session. `js/services/demo.js` conserve les anciens mocks pour les tests historiques et les fonctions de présentation `WAT.page` ; les pages utilisent `WAT.backend`. Les données fictives ne sont plus chargées par les pages HTML.

Pages ajoutées lors de la finalisation :

- `pages/reinitialisation.html` : changement de mot de passe depuis un lien temporaire.
- `pages/transport.html` : messages, paiement simulé, prise en charge, livraison, avis et signalement.
- `pages/administration.html` : comptes, trajets, demandes, transactions et signalements.

Les autres pages existantes sont conservées et reliées aux API. Les pages informatives et le formulaire Contact restent des contenus de démonstration ; Contact ne prétend pas envoyer un message réel.

`npm test` vérifie les fichiers et la logique mock historique. `npm run test:dom` vérifie le DOM avec un serveur PHP de test. `npm run test:browser` nécessite Chromium et vérifie le parcours connecté et les largeurs mobiles. Voir `docs/TESTS.md` pour les limites réelles.
