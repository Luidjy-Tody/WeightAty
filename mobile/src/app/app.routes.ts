import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'auth/connexion',
    loadComponent: () =>
      import('./features/auth/connexion/connexion.page').then((m) => m.ConnexionPage),
  },
  {
    path: 'auth/inscription',
    loadComponent: () => import('./shared/pages/a-venir/a-venir.page').then((m) => m.AVenirPage),
    data: {
      titre: 'Inscription',
      sousTitre: 'La création de compte arrive très bientôt.',
      retour: '/auth/connexion',
    },
  },
  {
    path: 'auth/mot-de-passe-oublie',
    loadComponent: () => import('./shared/pages/a-venir/a-venir.page').then((m) => m.AVenirPage),
    data: {
      titre: 'Mot de passe oublié',
      sousTitre: 'La réinitialisation du mot de passe arrive très bientôt.',
      retour: '/auth/connexion',
    },
  },

  // --- Espace administrateur ------------------------------------------------
  {
    path: 'administration',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/pages/a-venir/a-venir.page').then((m) => m.AVenirPage),
    data: { titre: 'Administration', sousTitre: 'Tableau de bord de l’équipe Weight’Aty.' },
  },

  // --- Profil ---------------------------------------------------------------
  {
    path: 'profil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profil/profil.page').then((m) => m.ProfilPage),
  },
  {
    path: 'profil/mes-informations',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./features/profil/mes-informations/mes-informations.page').then(
        (m) => m.MesInformationsPage
      ),
  },
  {
    path: 'profil/avis',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profil/avis/avis.page').then((m) => m.AvisPage),
  },

  // --- Trajets ---------------------------------------------------------------
  {
    path: 'trajets/nouveau',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./features/trajets/creer-trajet/creer-trajet.page').then((m) => m.CreerTrajetPage),
  },
  {
    path: 'trajets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/trajets/trajets.page').then((m) => m.TrajetsPage),
  },
  {
    path: 'trajets/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trajets/detail-trajet/detail-trajet.page').then(
        (m) => m.DetailTrajetPage
      ),
  },

  // --- Colis -----------------------------------------------------------------
  {
    path: 'colis',
    canActivate: [authGuard],
    loadComponent: () => import('./features/colis/colis.page').then((m) => m.ColisPage),
  },
  {
    path: 'colis/:id/livraison',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/colis/livraison/livraison.page').then((m) => m.LivraisonTermineePage),
  },
  {
    path: 'colis/:id/remuneration',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/colis/remuneration/remuneration.page').then((m) => m.RemunerationPage),
  },
  {
    path: 'colis/:id/evaluation',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/colis/evaluation/evaluation.page').then((m) => m.EvaluationPage),
  },
  {
    path: 'colis/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/colis/suivi/suivi.page').then((m) => m.SuiviColisPage),
  },

  // --- Avis d'un membre ------------------------------------------------------
  {
    path: 'avis/:userId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/avis/avis-membre.page').then((m) => m.AvisMembrePage),
  },

  // --- Signalement -----------------------------------------------------------
  {
    path: 'signaler/:type/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/signalements/signaler/signaler.page').then((m) => m.SignalerPage),
  },

  // --- Paiements -------------------------------------------------------------
  {
    path: 'paiement',
    canActivate: [authGuard],
    loadComponent: () => import('./features/paiement/paiement.page').then((m) => m.PaiementPage),
  },

  // --- Messagerie ------------------------------------------------------------
  {
    path: 'messages',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/messagerie/messages.page').then((m) => m.MessagesPage),
  },
  {
    path: 'messages/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/messagerie/conversation/conversation.page').then(
        (m) => m.ConversationPage
      ),
  },

  // --- Paramètres ------------------------------------------------------------
  {
    path: 'parametres',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parametres/parametres.page').then((m) => m.ParametresPage),
  },
  {
    path: 'parametres/notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parametres/notifications/notifications.page').then(
        (m) => m.NotificationsPage
      ),
  },
  {
    path: 'parametres/confidentialite',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parametres/confidentialite/confidentialite.page').then(
        (m) => m.ConfidentialitePage
      ),
  },
  {
    path: 'parametres/securite',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parametres/securite/securite.page').then((m) => m.SecuritePage),
  },
  {
    path: 'parametres/langue',
    canActivate: [authGuard],
    loadComponent: () => import('./features/parametres/langue/langue.page').then((m) => m.LanguePage),
  },
  {
    path: 'parametres/politique',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parametres/politique/politique.page').then((m) => m.PolitiquePage),
  },

  // --- Rubriques pas encore développées (écran « à venir ») ------------------
  {
    path: 'recherche',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/pages/a-venir/a-venir.page').then((m) => m.AVenirPage),
    data: { titre: 'Recherches', sousTitre: 'Recherchez des trajets et des colis.' },
  },
  {
    path: 'demandes',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/pages/a-venir/a-venir.page').then((m) => m.AVenirPage),
    data: { titre: 'Demandes', sousTitre: 'Gérez vos demandes de transport.' },
  },

  // --- Redirections ----------------------------------------------------------
  {
    path: '',
    redirectTo: 'profil',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'profil',
  },
];
