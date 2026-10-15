# API Weight'Aty — Endpoints

Base : `http://localhost:3000/api`

Toutes les réponses sont au format JSON. Les erreurs renvoient :

```json
{ "message": "Message en français", "details": { "email": "Message par champ (optionnel)" } }
```

Codes utilisés : `400` requête invalide, `401` non authentifié, `404` introuvable,
`409` conflit (unicité), `422` données invalides (`details` contient les erreurs par champ),
`500` erreur interne.

Les routes protégées attendent l'en-tête `Authorization: Bearer <token>`.
L'identité de l'utilisateur est **toujours** déduite du jeton : aucun identifiant
n'est accepté depuis le client.

## Santé

| Méthode | Chemin | Description |
| --- | --- | --- |
| GET | `/api/health` | Vérifie que l'API répond. |

## Authentification

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | non | Crée un compte et renvoie `{ token, user }`. |
| POST | `/api/auth/login` | non | Connexion ; renvoie `{ token, user }`. |
| POST | `/api/auth/logout` | oui | Révoque le jeton courant (déconnexion). Renvoie `204`. |
| GET | `/api/auth/me` | oui | Utilisateur de la session courante (restauration au démarrage). |
| GET | `/api/auth/demo-accounts` | non | Rôles de démonstration disponibles. |
| POST | `/api/auth/demo-login` | non | Connexion immédiate avec un compte de démonstration. |

### POST /api/auth/register

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+33 6 12 34 56 78",
  "password": "motdepasse123"
}
```

`phone` est facultatif. Règles : prénom/nom obligatoires (max 100 caractères),
e-mail obligatoire et unique (max 255), mot de passe 8 à 128 caractères.

### POST /api/auth/login

```json
{ "email": "jean.dupont@example.com", "password": "motdepasse123" }
```

Réponses possibles :

| Statut | Cas |
| --- | --- |
| `200` | Identifiants valides → `{ token, user }`. |
| `401` | E-mail inconnu **ou** mot de passe incorrect (`E-mail ou mot de passe incorrect.`) — message volontairement générique. |
| `403` | Identifiants valides mais compte désactivé (`is_active = false`). |
| `422` | Champs manquants ou mal formés (`details` par champ). |
| `429` | Trop de tentatives (voir *Anti force brute*). |

### GET /api/auth/me

Restaure la session : renvoie `{ user }` si le jeton est valide.
`401` si le jeton est absent, expiré ou révoqué.

### Accès démonstration

Ces deux routes ne fonctionnent que si l'accès démo est autorisé
(`DEMO_MODE`, activé par défaut hors production, désactivé en production).

`GET /api/auth/demo-accounts` :

```json
{
  "enabled": true,
  "accounts": [
    { "role": "expediteur", "label": "Expéditeur" },
    { "role": "voyageur", "label": "Voyageur" },
    { "role": "admin", "label": "Admin" }
  ]
}
```

Les rôles proviennent de la colonne `users.demo_role` : aucun identifiant
n'est exposé au client. Si l'accès est désactivé, la réponse est
`{ "enabled": false, "accounts": [] }`.

`POST /api/auth/demo-login` — le client envoie uniquement le rôle :

```json
{ "role": "voyageur" }
```

Réponses : `200` → `{ token, user }` ; `404` si l'accès démo est désactivé ou
si aucun compte n'existe pour ce rôle ; `422` si le rôle est inconnu.

### Anti force brute

Les routes `POST /api/auth/login` et `POST /api/auth/demo-login` sont
limitées : au-delà de **5 échecs** (401/403) pour un même couple
« IP + e-mail » dans une fenêtre de 15 minutes, la source est bloquée
15 minutes et l'API répond `429` avec un en-tête `Retry-After`.
Le compteur est réinitialisé après une connexion réussie.

> Le compteur est en mémoire : un déploiement multi-instances devra utiliser
> un stockage partagé (Redis) — point à prévoir avant la production.

### Comptes de démonstration (seed)

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Expéditeur | `jean.dupont@example.com` | `motdepasse123` |
| Voyageur | `marie.lambert@example.com` | `motdepasse123` |
| Admin | `admin@weightaty.example` | `motdepasse123` |

## Profil utilisateur

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/users/me` | oui | Profil + statistiques + 2 dernières évaluations. |
| PUT | `/api/users/me` | oui | Met à jour nom complet, e-mail, téléphone et adresse. |
| POST | `/api/users/me/photo` | oui | Enregistre la photo de profil (contenu base64). |
| DELETE | `/api/users/me/photo` | oui | Supprime la photo de profil (retour aux initiales). |
| GET | `/api/users/me/reviews` | oui | Évaluations reçues (paginées : `limit`, `offset`). |

### GET /api/users/me — réponse

```json
{
  "id": "…",
  "email": "jean.dupont@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+33 6 12 34 56 78",
  "role": "utilisateur",
  "isVerified": true,
  "address": "Curepipe, Maurice",
  "photoUrl": "/uploads/avatars/2f699cbe-….png",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "stats": {
    "envois": 4,
    "trajets": 3,
    "colisEnCours": 2,
    "avis": 3,
    "noteMoyenne": 4.7,
    "fiabilite": 75
  },
  "derniersAvis": [
    {
      "id": "…",
      "note": 5,
      "commentaire": "Personne très sérieuse…",
      "auteur": { "firstName": "Marie", "lastName": "Lambert" },
      "createdAt": "2026-01-10T09:00:00.000Z"
    }
  ]
}
```

### PUT /api/users/me — corps

```json
{
  "fullName": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+230 5 123 4567",
  "address": "Curepipe, Maurice"
}
```

- `fullName` est **obligatoire** (2 à 100 caractères). La base stocke prénom et
  nom séparément : le **premier mot devient le prénom**, le reste le nom
  (règle appliquée côté serveur, `splitFullName`).
- `phone` est facultatif. Il est **normalisé** avant enregistrement
  (`+230 5 123 4567` → `+23051234567`) puis validé (6 à 15 chiffres, `+` initial
  accepté).
- `address` est facultative (≤ 200 caractères).
- Les champs sensibles (`role`, `isVerified`, mot de passe) **ne sont pas
  modifiables** par cet endpoint.
- Le statut « vérifié » n'est pas réinitialisé en cas de changement d'e-mail ou
  de téléphone (aucun parcours de vérification n'existe encore — point à valider).
- Réponses : `200` → profil complet ; `409` si l'e-mail est déjà utilisé
  (`details.email`) ; `422` avec `details` par champ.

### Photo de profil

`POST /api/users/me/photo`

```json
{ "data": "<contenu base64>", "mimeType": "image/jpeg" }
```

- Types acceptés : `image/jpeg`, `image/png`. La **signature binaire** du fichier
  est vérifiée (anti-usurpation de type MIME).
- Taille maximale : **2 Mo** (constante `MAX_PHOTO_BYTES`). Le client
  redimensionne et compresse l'image avant l'envoi.
- Les fichiers sont stockés hors dépôt Git (`backend/uploads/`, configurable via
  `UPLOAD_ROOT`) et servis sous `/api/uploads/…` ; seule l'URL est enregistrée
  dans `users.photo_url`. L'ancienne photo est supprimée automatiquement.
- Réponses : `200` → profil complet (avec `photoUrl`) ; `422` (`details.photo`)
  si le format ou la taille sont invalides.

`DELETE /api/users/me/photo` → `200` avec `photoUrl: null` (fichier supprimé).

### GET /api/users/me/reviews

Paramètres de requête : `limit` (1–50, défaut 20), `offset` (défaut 0).

```json
{ "items": [ /* avis */ ], "total": 3, "limit": 20, "offset": 0 }
```

## Aéroports / villes

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/airports?q=<texte>&limit=<n>` | oui | Recherche d'aéroports (code IATA, ville, nom, pays). |

`limit` : 1 à 25 (défaut 10). Une recherche vide renvoie les premières entrées
(utilisé à l'ouverture du champ Départ / Destination). Chaque résultat contient
un `label` au format « Ville (CODE) ».

```json
{
  "items": [
    {
      "iata": "CDG",
      "city": "Paris",
      "country": "France",
      "name": "Charles de Gaulle",
      "label": "Paris (CDG)"
    }
  ]
}
```

## Trajets

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/trajets` | oui | Publie un trajet pour l'utilisateur connecté. |
| GET | `/api/trajets/me` | oui | Trajets publiés par l'utilisateur connecté. |

### POST /api/trajets — corps

```json
{
  "departIata": "MRU",
  "arriveeIata": "CDG",
  "dateDepart": "2026-11-12",
  "dateArrivee": "2026-11-12",
  "poidsDisponibleKg": 20,
  "prixParKg": 160,
  "compagnieAerienne": "Air Mauritius",
  "numeroVol": "mk014",
  "informationsSupplementaires": "Colis fragiles acceptés."
}
```

- L'identité du voyageur provient **du jeton** (aucun `voyageurId` accepté).
- `departIata` / `arriveeIata` doivent exister dans la table `airports` : les
  libellés « Ville (CODE) » et les pays sont déduits côté serveur.
- `numeroVol` est normalisé (« mk014 » → « MK 014 »).
- Statut initial : `publie`. Devise : `MUR` (symbole « Rs »).
- Réponses : `201` → trajet créé ; `401` sans jeton ; `403` compte désactivé ;
  `422` avec `details` par champ.

### Règles de validation

| Champ | Règle |
| --- | --- |
| `departIata` / `arriveeIata` | obligatoires, codes IATA connus, différents l'un de l'autre |
| `dateDepart` | obligatoire, AAAA-MM-JJ, aujourd'hui ou future |
| `dateArrivee` | obligatoire, égale ou postérieure à `dateDepart` |
| `poidsDisponibleKg` | obligatoire, > 0, ≤ 50 kg, 2 décimales maximum |
| `prixParKg` | obligatoire, > 0, ≤ 50000, 2 décimales maximum |
| `compagnieAerienne` | obligatoire, ≤ 120 caractères |
| `numeroVol` | obligatoire, format `AA 123` (2-3 lettres + espace + 1-4 chiffres) |
| `informationsSupplementaires` | facultatif, ≤ 500 caractères |

### GET /api/trajets/me — réponse

```json
{
  "items": [
    {
      "id": "…",
      "villeDepart": "Paris (CDG)",
      "villeArrivee": "Maurice (MRU)",
      "paysDepart": "France",
      "paysArrivee": "Maurice",
      "dateDepart": "2026-11-12",
      "dateArrivee": "2026-11-12",
      "poidsDisponibleKg": 25,
      "prixParKg": 180.5,
      "devise": "MUR",
      "compagnieAerienne": "Air Mauritius",
      "numeroVol": "MK 014",
      "informationsSupplementaires": null,
      "statut": "publie",
      "createdAt": "…"
    }
  ],
  "total": 1
}
```

### Règle métier de publication

Seuls les comptes **actifs** peuvent publier un trajet (`403` sinon). Aucun rôle
« voyageur » n'existe encore en base : tout utilisateur actif peut proposer son
espace bagage. Le drapeau `REQUIRE_VERIFIED_TO_PUBLISH`
(`backend/src/modules/trajets/trajet.service.ts`) permettra d'exiger un profil
vérifié dès qu'un parcours de vérification existera.

## Suivi des colis

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/colis/me?limit&offset` | oui | Colis de l'utilisateur connecté (expéditeur), paginés. |
| GET | `/api/colis/:id` | oui | Détail + suivi (expéditeur **ou** voyageur du colis). |
| POST | `/api/colis/:id/etapes` | oui | Enregistre l'étape suivante (voyageur). |
| POST | `/api/colis/:id/livraison` | oui | Confirme la remise au destinataire (expéditeur) et libère la rémunération. |
| GET | `/api/colis/:id/remuneration` | oui | Rémunération libérée (voyageur du colis uniquement). |
| POST | `/api/colis/:id/evaluation` | oui | Évalue le voyageur (expéditeur, colis livré, une seule fois). |

### Étapes de suivi

Ordre imposé : `demande_envoyee`, `demande_acceptee`, `remis_voyageur`,
`en_transit`, `arrive_destination`, `remis_destinataire`.

- `POST /api/colis/:id/etapes` accepte uniquement `remis_voyageur`,
  `en_transit` et `arrive_destination` (réservés au **voyageur**).
- Les sauts d'étapes et les retours en arrière sont refusés (`409`), chaque
  transition est consignée dans `colis_etapes` (horodatage UTC).
- `POST /api/colis/:id/livraison` (expéditeur) exige que toutes les étapes
  précédentes soient enregistrées.

### Rémunération

La livraison crédite le portefeuille du voyageur de façon **atomique** et
**idempotente** (transaction PostgreSQL + contrôle d'un paiement `valide`
existant sous verrou) :

```
montant libéré = demandes.prix
```

Un seul paiement par colis ; le solde est stocké dans `users.wallet_balance`.

### Évaluation

```json
{ "note": 5, "commentaire": "Très bien", "tags": ["Ponctuel", "Bonne communication"] }
```

Règles : expéditeur uniquement, colis `livre`, une évaluation par colis
(`evaluations.colis_id` unique), note 1 à 5. La note moyenne et le nombre
d'avis du voyageur sont recalculés à la lecture.

## Détail d'un trajet

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/trajets/:id` | oui | Détail + informations publiques du voyageur. |
| GET | `/api/users/:id/reviews` | oui | Avis publics d'un membre (auteur abrégé). |

Réponse de `GET /api/trajets/:id` : trajet + `voyageur`
(`displayName`, `photoUrl`, `isVerified`, `noteMoyenne`, `nombreAvis`,
`nombreVoyages`), `estProprietaire` et `peutFaireDemande`.
`404` si le trajet n'existe pas. Aucune donnée sensible (e-mail, téléphone,
adresse) n'est exposée.

## Paiements, signalements, messagerie

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/paiements/me` | oui | Paiements reçus et envoyés par l'utilisateur. |
| POST | `/api/signalements` | oui | Signale un trajet ou un colis (`motif` + `message`). |
| GET | `/api/conversations` | oui | Conversations de l'utilisateur. |
| POST | `/api/conversations` | oui | Retrouve ou crée la conversation (`{ userId }`). |
| GET | `/api/conversations/:id` | oui | Interlocuteur de la conversation. |
| GET | `/api/conversations/:id/messages` | oui | Messages de la conversation. |
| POST | `/api/conversations/:id/messages` | oui | Envoie un message (`{ contenu }`). |

Motifs de signalement acceptés : `retard`, `comportement`, `colis_endommage`,
`non_conforme`, `autre`.

## Paramètres du compte

| Méthode | Chemin | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/users/me/preferences` | oui | Préférences (notifications, confidentialité, langue). |
| PUT | `/api/users/me/preferences` | oui | Mise à jour **partielle** des préférences. |
| PUT | `/api/users/me/password` | oui | Changement de mot de passe. |
| DELETE | `/api/users/me` | oui | Suppression (anonymisation) du compte. |

### GET /api/users/me/preferences — réponse

```json
{
  "notifications": { "messages": true, "trajets": true, "paiements": true },
  "privacy": { "fullName": false, "photo": true, "trips": true },
  "language": "fr"
}
```

- `notifications` : activées par défaut.
- `privacy.fullName` : `false` = nom affiché sous la forme « Prénom N. ».
- `language` : seul `fr` est accepté (`SUPPORTED_LANGUAGES`), l'i18n n'existe pas
  encore ; la colonne accepte aussi `en` pour l'avenir.

### Effet des préférences de confidentialité

Elles sont appliquées dans `getPublicUserSummary` (source unique des données
publiques : détail d'un trajet, colis, paiements, conversations) et dans la
liste des avis :

- `fullName` → `displayName` complet ou abrégé ;
- `photo` → `photoUrl` masqué (`null`) si désactivé ;
- `trips` → `nombreVoyages` mis à 0 et `voyagesVisibles: false`.

### PUT /api/users/me/password

```json
{ "currentPassword": "…", "newPassword": "…" }
```

- Vérifie le mot de passe actuel (`422` + `details.currentPassword` sinon),
  refuse un mot de passe identique (`422` + `details.newPassword`), longueur 8 à
  128 caractères (règle de l'inscription).
- Invalide **les autres sessions** (`users.tokens_valid_after`) et renvoie un
  **nouveau jeton** pour prolonger la session courante : `{ "token": "…" }`.
- Limité en tentatives (`sensitiveActionRateLimiter`).

### DELETE /api/users/me

Corps : `{ "password": "…" }` (double confirmation côté client).

- `422` si le mot de passe est absent ou incorrect ;
- `409` si un colis ou un trajet est **en cours** (message en français) ;
- `204` sinon : l'identité est anonymisée (nom, e-mail, téléphone, adresse,
  photo), le compte est désactivé et toutes les sessions sont invalidées. Les
  paiements et évaluations sont conservés (anonymes).

## Définition des statistiques

| Statistique | Définition |
| --- | --- |
| `envois` | Nombre total de colis publiés par l'utilisateur (`colis.expediteur_id`). |
| `trajets` | Nombre de trajets publiés par l'utilisateur (`trajets.voyageur_id`). |
| `colisEnCours` | Colis encore `en_attente` ou `en_transit`. |
| `avis` | Nombre d'évaluations reçues (`evaluations.cible_id`). |
| `noteMoyenne` | Moyenne des notes reçues, arrondie à 1 décimale. |
| `fiabilite` | Part des transactions terminées sans litige ni annulation (voir ci-dessous). |

**Formule de fiabilité** (à valider) :

```
fiabilite = terminees_sans_litige / (terminees_sans_litige + annulees_ou_litigeuses) * 100
```

Les demandes encore en cours ne sont pas comptées. Un utilisateur sans transaction
terminée ni annulée obtient 100 %.
