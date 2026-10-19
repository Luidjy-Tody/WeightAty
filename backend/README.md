# Backend — Weight’Aty

## 1. Technologies

- **Langage :** PHP 8.2 ou supérieur
- **Base de données :** MySQL
- **Connexion à la base :** PDO
- **Administration :** phpMyAdmin ou MySQL Workbench
- **Environnement local :** XAMPP

Le frontend utilise HTML, CSS et JavaScript. Il communiquera avec le backend PHP grâce à des requêtes HTTP. Les API retourneront principalement des réponses JSON.

## 2. Architecture

| Dossier | Responsabilité |
|---|---|
| `config/` | Connexion MySQL et configuration CORS |
| `middleware/` | Authentification et autorisations |
| `api/auth/` | Inscription, connexion et déconnexion |
| `api/utilisateurs/` | Consultation et modification des profils |
| `api/colis/` | Création, consultation et modification des colis |
| `api/trajets/` | Publication et recherche des trajets |
| `api/demandes/` | Création et suivi des demandes de transport |
| `api/notifications/` | Consultation des notifications |

Les fichiers PHP existants sont des emplacements préparés pour le développement. Ils ne constituent pas encore des API fonctionnelles.

## 3. Installation locale

1. Installer XAMPP avec PHP et un serveur de base de données compatible.
2. Démarrer Apache et MySQL/MariaDB.
3. Ouvrir phpMyAdmin.
4. Exécuter les scripts SQL du dossier `database/` dans l'ordre indiqué dans son README.
5. Configurer les identifiants de connexion MySQL localement, sans les publier sur GitHub.
6. Tester les API PHP depuis un serveur local.

**Attention :** XAMPP peut fournir MariaDB. Il faut vérifier la compatibilité des scripts avec la version utilisée.

## 4. Règles de développement

- Respecter les tâches attribuées dans Jira.
- Créer une branche Git pour chaque tâche.
- Utiliser PDO et des requêtes préparées pour les accès SQL.
- Valider les données reçues avant leur enregistrement.
- Retourner des réponses JSON avec les codes HTTP adaptés.
- Vérifier l'authentification et les autorisations côté serveur.
- Ne jamais publier les mots de passe ou fichiers de configuration contenant des secrets.
- Tester les fonctionnalités avant de créer une Pull Request vers `develop`.

## 5. Organisation du travail

Chaque développeur est responsable des fichiers associés à sa tâche Jira.

Les fichiers communs, comme `config/database.php`, doivent être coordonnés entre les membres pour éviter les conflits Git.

Le développement du backend peut commencer après la fusion de la branche de migration dans `develop`.