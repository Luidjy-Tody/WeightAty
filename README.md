# Weight’Aty

Weight’Aty est une application mobile qui met en relation des expéditeurs et des voyageurs pour faciliter le transport de colis.

## Technologies

- Frontend : Ionic 8, Angular, TypeScript
- Backend : Node.js, Express, TypeScript
- Base de données : PostgreSQL
- Application Android : Capacitor
- Gestion du projet : Jira et GitHub

## Structure

- `mobile/` : application Ionic Angular
- `backend/` : API REST
- `database/` : scripts SQL
- `docs/` : documentation
- `tests/` : tests automatisés

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/Luidjy-Tody/WeightAty.git
cd WeightAty
```

### 2. Installer le frontend

```bash
cd mobile
npm install
ionic serve
```

Application accessible sur http://localhost:8100

### 3. Installer le backend

Dans un autre terminal :

```bash
cd backend
npm install
cp .env.example .env
```

Configurer les identifiants PostgreSQL dans `.env`.

Créer la base de données `weightaty` dans PostgreSQL.

Démarrer le serveur :

```bash
npm run dev
```

API accessible sur http://localhost:3000/api/health

## Organisation Git

- `main` : version stable
- `develop` : branche de développement
- `feature/WAT-XX-description` : développement des User Stories

Chaque fonctionnalité est développée sur une branche créée depuis `develop`.

Une Pull Request est nécessaire avant de fusionner les modifications.

## Maquette

https://many-factor-45762435.figma.site
