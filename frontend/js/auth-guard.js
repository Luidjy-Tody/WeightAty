// GARDE D’AUTHENTIFICATION PARTAGÉE
// - Vérifie la session serveur (api/auth/session.php)
// - Reflète l’utilisateur connecté dans le stockage de démonstration,
//   afin que les pages encore basées sur le mock le reconnaissent
// - Adapte l’en-tête (bouton Connexion ou profil + déconnexion)
// - Protège les actions concrètes et les pages réservées
WAT.auth = (() => {
  let sessionPromise = null;

  // REFLETER LA SESSION RÉELLE DANS LE MOCK DE DÉMONSTRATION
  // Le compte connecté reprend les données de démonstration du profil précédent
  function synchroniserMock(utilisateur) {
    if (!WAT.store) return;

    const id = String(utilisateur.id);

    WAT.store.update(function (state) {
      const precedent = state.currentUserId;

      if (precedent && String(precedent) !== id) {
        state.trips.forEach(function (trajet) {
          if (trajet.ownerId === precedent) trajet.ownerId = id;
        });
        state.parcels.forEach(function (colis) {
          if (colis.ownerId === precedent) colis.ownerId = id;
        });
        state.requests.forEach(function (demande) {
          if (demande.senderId === precedent) demande.senderId = id;
        });
        state.notifications.forEach(function (notification) {
          if (notification.userId === precedent) notification.userId = id;
        });
      }

      const base = state.users.find(function (item) { return String(item.id) === id; })
        || (precedent ? state.users.find(function (item) { return String(item.id) === String(precedent); }) : null)
        || {};

      const profil = Object.assign({}, base, {
        id: id,
        firstName: utilisateur.prenom || '',
        lastName: utilisateur.nom || '',
        name: ((utilisateur.prenom || '') + ' ' + (utilisateur.nom || '')).trim(),
        initials: initiales(utilisateur),
        email: utilisateur.email || '',
        location: utilisateur.localisation || base.location || ''
      });

      const existant = state.users.find(function (item) { return String(item.id) === id; });
      if (existant) Object.assign(existant, profil);
      else state.users.push(profil);

      state.currentUserId = id;
    });
  }

  // DÉCONNECTER LE MOCK LORSQUE LE COMPTE N’EST PLUS CONNECTÉ
  function viderMock() {
    if (!WAT.store) return;
    WAT.store.update(function (state) {
      state.currentUserId = null;
    });
  }

  function chargerSession() {
    if (!sessionPromise) {
      sessionPromise = WAT.api('/api/auth/session.php')
        .then(function (session) {
          if (session && session.connecte && session.utilisateur) {
            synchroniserMock(session.utilisateur);
          }
          return session;
        })
        .catch(function () {
          return { success: false, connecte: false, utilisateur: null };
        });
    }
    return sessionPromise;
  }

  // BARRIÈRE : ATTENDRE LA session AVANT QUE LES PAGES LISENT LE MOCK
  function attendreSession() {
    return chargerSession();
  }

  function refresh() {
    sessionPromise = null;
    return chargerSession();
  }

  function initiales(utilisateur) {
    if (!utilisateur) return '';
    const prenom = utilisateur.prenom || '';
    const nom = utilisateur.nom || '';
    return (prenom[0] || '') + (nom[0] || '');
  }

  function majEntete(utilisateur) {
    document.querySelectorAll('[data-auth="guest"]').forEach(function (element) {
      element.hidden = Boolean(utilisateur);
    });
    document.querySelectorAll('[data-auth="user"]').forEach(function (element) {
      element.hidden = !utilisateur;
    });
    if (utilisateur) {
      document.querySelectorAll('[data-auth-avatar]').forEach(function (element) {
        element.textContent = initiales(utilisateur) || '?';
      });
      document.querySelectorAll('[data-auth-name]').forEach(function (element) {
        element.textContent = ((utilisateur.prenom || '') + ' ' + (utilisateur.nom || '')).trim();
      });
    }
  }

  async function deconnecter() {
    try {
      await WAT.api('/api/auth/deconnexion.php', { method: 'POST' });
    } catch {
      // La session est considérée fermée côté client même en cas d’erreur réseau
    }
    viderMock();
    refresh();
    window.location.href = document.body.dataset.page === 'index' ? 'index.html' : '../index.html';
  }

  // PROTÉGER UNE ACTION : APPELER WAT.auth.require() AVANT L’ACTION
  // CIBLE : PAGE DE REDIRECTION APRÈS CONNEXION (DÉFAUT : PAGE COURANTE)
  async function require(cible) {
    const session = await chargerSession();
    if (!session.connecte) {
      const destination = cible || (window.location.pathname.split('/').pop() + window.location.search);
      window.location.href = 'connexion.html?suivant=' + encodeURIComponent(destination);
      return false;
    }
    return true;
  }

  // PROTÉGER UNE PAGE ENTIÈRE (body data-requires-auth="true")
  async function protegerPage() {
    if (document.body.dataset.requiresAuth !== 'true') return;
    const session = await chargerSession();
    if (!session.connecte) {
      const cible = encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
      window.location.href = 'connexion.html?suivant=' + cible;
    }
  }

  WAT.dom.run(async function () {
    const session = await chargerSession();
    majEntete(session.utilisateur);
    await protegerPage();

    document.querySelectorAll('[data-logout]').forEach(function (bouton) {
      bouton.addEventListener('click', function (event) {
        event.preventDefault();
        deconnecter();
      });
    });
  });

  return { chargerSession, attendreSession, refresh, require, majEntete, deconnecter, synchroniserMock };
})();
