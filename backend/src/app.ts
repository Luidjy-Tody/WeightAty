import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import airportRoutes from './modules/airports/airport.routes.js';
import trajetRoutes from './modules/trajets/trajet.routes.js';
import colisRoutes from './modules/colis/colis.routes.js';
import paiementRoutes from './modules/paiements/paiement.routes.js';
import signalementRoutes from './modules/signalements/signalement.routes.js';
import messageRoutes from './modules/messages/message.routes.js';
import { UPLOAD_ROOT } from './modules/users/photo.service.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

const app = express();

// CONFIGURATION
app.use(cors());

// Les photos de profil sont transmises en base64 : parseur dédié, plus large
// que le parseur global, monté avant lui (body-parser ignore un corps déjà lu).
app.use('/api/users/me/photo', express.json({ limit: '6mb' }));
app.use(express.json());

// FICHIERS STATIQUES (photos de profil — stockage local, hors dépôt Git).
// Servis sous le préfixe `/api` déjà relayé par le proxy du serveur de dev.
app.use('/api/uploads', express.static(UPLOAD_ROOT, { index: false }));

// ROUTE DE TEST
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    application: 'WeightAty',
    message: 'API opérationnelle'
  });
});

// RACINE DE L'API : rappel de l'adresse de l'application mobile.
// (Évite la confusion entre le port de l'API et celui du serveur de dev.)
app.get('/', (req, res) => {
  const host = (req.headers.host ?? '').split(':')[0] || 'localhost';

  res.json({
    application: 'WeightAty',
    message:
      "Ceci est l'API. L'application mobile est servie par le serveur de développement.",
    applicationUrl: `http://${host}:8100`,
    apiUrl: `http://${host}:3000/api`,
    health: `http://${host}:3000/api/health`
  });
});

// ROUTES MÉTIER
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/trajets', trajetRoutes);
app.use('/api/colis', colisRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/conversations', messageRoutes);

// GESTION DES ERREURS (toujours en dernier)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
