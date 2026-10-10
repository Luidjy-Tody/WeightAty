# Architecture Weight’Aty

## Technologies

- Frontend : Ionic 8 + Angular + TypeScript
- Backend : Node.js + Express + TypeScript
- Base de données : PostgreSQL
- API : REST

## Architecture

Application mobile (Ionic + Angular)
        |
        | HTTP / JSON
        v
Backend (Node.js + Express)
        |
        v
PostgreSQL

## Organisation

- mobile/ : application mobile
- backend/ : API REST et logique métier
- database/ : scripts SQL
- docs/ : documentation
- tests/ : tests automatisés
