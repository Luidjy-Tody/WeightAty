# Weight’Aty

Plateforme universitaire de transport de colis entre expéditeurs et voyageurs.
Le même compte peut publier des trajets et envoyer des colis. Les administrateurs disposent d’un droit supplémentaire attribué localement.

## Technologies et organisation

- `frontend/` : HTML complet dans chaque page, CSS, JavaScript sans framework.
- `backend/` : PHP 8.2+, PDO, sessions et API JSON.
- `database/` : structure existante et migration additive `migrations/04_finalisation.sql`.
- `docs/FINALISATION.md` : audit, travaux, tests exécutés et limites.

Le frontend utilise maintenant les données MySQL. Les anciens fichiers mock sont conservés pour les tests historiques et ne constituent pas les données de l’application connectée.
Les paiements et remboursements sont uniquement simulés : aucune carte n’est demandée et aucun débit bancaire n’a lieu.

## Installation locale Ubuntu et Windows

1. Installer PHP 8.2+ avec PDO MySQL, mbstring, fileinfo et sessions. Installer MySQL 8.0.16+ ou une version MariaDB compatible. La validation effectuée utilise PHP 8.3.6 et MariaDB 10.11.14, pas MySQL.
2. Avec un compte SQL autorisé à créer la structure, exécuter dans l’ordre :

   ```sh
   mysql -u root -p < database/01_creation_weightaty_securisee.sql
   mysql -u root -p < database/migrations/04_finalisation.sql
   ```

   Sous Windows, utiliser phpMyAdmin ou l’import de MySQL Workbench si la redirection n’est pas disponible dans PowerShell. Les scripts ne suppriment pas les données existantes. Vérifier une sauvegarde et le schéma avant une migration sur une base déjà utilisée. `CREATE TABLE IF NOT EXISTS` ne corrige pas une ancienne structure différente.
3. Créer un compte SQL local pour l’application, avec SELECT, INSERT, UPDATE et DELETE sur `weightaty_db`. Garder le compte de migration séparé.
4. Copier `.env.example` vers `.env`. Renseigner `DB_DSN`, `DB_USER`, `DB_PASSWORD` et `APP_URL`.
5. Créer les dossiers privés des photos, des messages de réinitialisation et, si nécessaire, des sessions. Ils doivent être hors du dépôt, accessibles en écriture à PHP. Renseigner leurs chemins absolus : `UPLOAD_DIR`, `MAIL_OUTBOX`, `SESSION_DIR`. Sous Windows, les chemins `C:/weightaty-private/uploads` sont acceptés. `MAIL_OUTBOX` active une boîte locale de démonstration, sans envoi d’e-mail réel. En son absence, PHP utilise le service `mail()` du serveur, qui doit être configuré.
6. Depuis la racine du dépôt :

   ```sh
   php -S localhost:8000 backend/router.php
   ```

   Sous Windows avec XAMPP :

   ```powershell
   C:\xampp\php\php.exe -S localhost:8000 backend/router.php
   ```

7. Ouvrir `http://localhost:8000/`. Créer les comptes depuis Inscription puis se connecter. Live Server seul ne lance pas PHP. Le routeur fourni protège les fichiers privés ; une configuration Apache/Nginx de production devra reproduire ces restrictions et utiliser HTTPS.

## Accès administrateur

Après inscription du compte concerné, exécuter localement :

```sh
php backend/cli.php admin adresse@example.com
```

Il n’existe aucune route publique pour attribuer ce droit. Le lien Administration apparaît dans le tableau de bord du compte administrateur.

## Démonstration complète

Créer deux comptes. Avec le premier, publier un trajet. Avec le second, rechercher ce trajet, renseigner un colis puis envoyer la demande. Le voyageur accepte depuis Demandes reçues. Le lien « Messages, paiement et suivi » ouvre les échanges et la suite du parcours. L’expéditeur simule le paiement, le voyageur confirme la prise en charge, puis l’expéditeur confirme la livraison. Les deux participants peuvent déposer un avis. Les notifications sont enregistrées en base.

Pour « Mot de passe oublié », ouvrir le fichier JSON correspondant dans le dossier privé `MAIL_OUTBOX`, puis utiliser son lien temporaire. Ce dossier ne doit jamais être publié. Après changement du mot de passe, les anciennes sessions sont révoquées.

## Tests

Les tests frontend nécessitent Node 22.22.2+, 24.15.0+ ou 26+ selon la branche prise en charge par jsdom. Les tests créent leurs propres comptes et trajets dans une base dédiée ; ne pas les lancer sur une base de production.

```sh
cd frontend
npm install
npm test
```

Pour une base jetable locale sur Linux avec MariaDB installé :

```sh
python3 backend/tests/run_local.py
```

Ce lanceur initialise une nouvelle base dans un dossier temporaire, applique les scripts, démarre PHP et exécute les tests API, droits, concurrence, réinitialisation et photos. `PHP_BIN`, `MYSQL_BASEDIR` et `MYSQL_SERVER_BIN` permettent d’indiquer les exécutables. Pour les tests DOM connectés :

```sh
python3 backend/tests/run_local.py node frontend/tests/connected-dom.cjs
```

Installer les dépendances frontend et définir `NODE_PATH` vers `frontend/node_modules` si nécessaire. Pour tester un serveur de test déjà lancé : définir `WEIGHTATY_TEST_URL`, puis lancer `python3 backend/tests/integration.py` ou `npm run test:dom` depuis `frontend`. Sous PowerShell : `$env:WEIGHTATY_TEST_URL='http://localhost:8000'`.

Le script Playwright connecté est fourni : `npx playwright install chromium`, puis `npm run test:browser`. Il contrôle notamment 360, 390, 768 et 1440 px. Son exécution n’a pas été possible ici : le téléchargement de Chromium a échoué. Les tests DOM ne vérifient pas le rendu visuel.

Consulter le rapport pour les résultats réellement obtenus et les décisions restant à valider.
