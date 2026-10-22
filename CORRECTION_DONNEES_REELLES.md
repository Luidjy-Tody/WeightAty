# Weight’Aty — données réelles uniquement

- Les pages utilisent exclusivement `WAT.backend` via `frontend/js/services/page-utils.js`.
- Le service mock et ses données locales fictives ne sont plus utilisés.
- Les avatars et compteurs de notifications sont vides avant récupération de la session.
- Le profil ne contient plus de valeurs fictives : nom, coordonnées, note, ancienneté et trajets sont fournis par l’API.
- Les données d’autres pages peuvent contenir des textes d’exemple statiques ; cette correction ne constitue pas un audit complet de chaque écran.
- Aucun changement SQL et aucun changement au fichier `.env`.
- Vérifier avec une session PHP et la base MySQL locale : inscription, profil, édition, déconnexion et pages de trajet.
