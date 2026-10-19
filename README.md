# Weight’Aty — Projet collaboratif

Plateforme web reliant les voyageurs qui disposent de capacité de bagage aux expéditeurs de colis.

## Organisation

- `frontend/` : application de démonstration HTML5, CSS3 et JavaScript (sans backend). Le code d’origine est conservé.
- `database/` : scripts MySQL officiels et guide d’installation.
- `backend/` : espace réservé au développement en équipe ; aucun backend n’est encore créé.

## Lancer le frontend

Dans VS Code, ouvrir `frontend/index.html` avec Live Server. Ou exécuter à la racine du dépôt :

**Windows** : `py -m http.server 8080 --directory frontend`

**Ubuntu** : `python3 -m http.server 8080 --directory frontend`

Puis ouvrir http://localhost:8080/ .

Le frontend utilise actuellement des données fictives et `localStorage`, **pas MySQL**. La base ne sera accessible au navigateur qu’après développement des API backend.

## Installer MySQL pour l’équipe

1. Installer MySQL **8.0.16+** et ouvrir MySQL Workbench.
2. Sur une base locale de développement, exécuter `database/01_creation_weightaty_securisee.sql`. Le nom commun est `weightaty_db`.
3. Facultatif, **sur base de démonstration uniquement** : exécuter `database/02_donnees_test.sql` une seule fois.
4. Exécuter `database/03_requetes_verification.sql`.

Le script de création ne supprime pas les tables existantes, mais **ne migre pas** leur structure. Ne pas réexécuter les données de test. Les comptes fictifs n’ont pas de mots de passe utilisables.

Lire `database/README.md` pour les limites et règles de sécurité.

## Collaboration Git

Chaque membre travaille sur une branche de fonctionnalité et ouvre une Pull Request vers la branche d’intégration choisie par l’équipe. Ne pas committer les fichiers `.env` ou les identifiants personnels.

## Documentation

- `frontend/README.md` : structure du frontend, lancement, simulations et tests.
- `frontend/docs/API.md` : besoins d’API à implémenter.
- `database/README.md` : installation SQL et limites connues.
- `backend/README.md` : préparation du futur backend.

## Tests du frontend

Avec Node.js, depuis `frontend/` : `node --test tests/frontend.test.cjs`. Les tests navigateur Playwright sont facultatifs.
