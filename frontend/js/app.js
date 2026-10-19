// OUTILS COMMUNS AUX PAGES
window.WAT = window.WAT || {};

WAT.dom = {
  params: new URLSearchParams(window.location.search),

  text(selector, value, root = document) {
    root.querySelectorAll(selector).forEach(function (element) {
      element.textContent = value ?? '';
    });
  },

  date(value) {
    if (!value) return 'Non renseignée';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(value + 'T12:00:00'));
  },

  number(value) {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  },

  values(form) {
    return Object.fromEntries(new FormData(form));
  },

  fill(form, values) {
    Object.entries(values || {}).forEach(function ([name, value]) {
      const field = form.elements.namedItem(name);
      if (field && field.type !== 'file') field.value = value ?? '';
    });
  },

  errors(form, errors) {
    form.querySelectorAll('[aria-invalid]').forEach(function (field) {
      field.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.error').forEach(function (element) {
      element.textContent = '';
    });
    Object.entries(errors).forEach(function ([name, message]) {
      const field = form.elements.namedItem(name);
      const messageElement = form.querySelector('#f-' + name + '-error');
      if (field) field.setAttribute('aria-invalid', 'true');
      if (messageElement) messageElement.textContent = message;
    });
    const summary = form.querySelector('[data-form-error]');
    if (summary) {
      summary.textContent = errors.form || '';
      summary.hidden = !errors.form;
    }
    form.querySelector('[aria-invalid="true"]')?.focus();
    return Object.keys(errors).length === 0;
  },

  status(element, value) {
    if (!element) return;
    element.textContent = value;
    element.className = 'status';
    if (['En attente', 'Brouillon'].includes(value)) element.classList.add('pending');
    if (['Publié', 'Accepté', 'Acceptée', 'Livré', 'En transport'].includes(value)) element.classList.add('success');
    if (['Annulé', 'Annulée', 'Refusé', 'Refusée'].includes(value)) element.classList.add('danger');
  },

  notify(message, error = false) {
    const element = document.getElementById('toast');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('error', error);
    element.hidden = false;
    clearTimeout(WAT.toastTimer);
    WAT.toastTimer = setTimeout(function () { element.hidden = true; }, 6000);
  },

  async run(action) {
    try {
      await action();
    } catch (error) {
      WAT.dom.notify(error.message, true);
    }
  },

  async busy(button, action) {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await action();
    } catch (error) {
      WAT.dom.notify(error.message, true);
    } finally {
      button.disabled = false;
    }
  },

  error(message) {
    const box = document.getElementById('page-error');
    if (box) {
      box.hidden = false;
      WAT.dom.text('[data-error-message]', message, box);
    }
    document.getElementById('page-content')?.setAttribute('hidden', '');
  },

  confirm(message) {
    return new Promise(function (resolve) {
      const dialog = document.getElementById('confirmation');
      document.getElementById('dialog-message').textContent = message;
      function finish(result) {
        dialog.close();
        resolve(result);
      }
      document.getElementById('dialog-cancel').onclick = function () { finish(false); };
      document.getElementById('dialog-confirm').onclick = function () { finish(true); };
      dialog.oncancel = function (event) {
        event.preventDefault();
        finish(false);
      };
      dialog.showModal();
      document.getElementById('dialog-cancel').focus();
    });
  }
};

// MENU MOBILE
const menuButton = document.querySelector('.menu-toggle');
const menu = document.getElementById('main-nav');
if (menuButton && menu) {
  menuButton.addEventListener('click', function () {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('open', open);
  });
  menu.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      menu.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.focus();
    }
  });
}

// ACCÈS CLAVIER AU CONTENU
 document.querySelector('.skip-link')?.addEventListener('click', function (event) {
  event.preventDefault();
  document.getElementById('main').focus();
});

// REFLÉTER LE PROFIL FICTIF DANS LA NAVIGATION EXISTANTE
try {
  const saved = JSON.parse(localStorage.getItem('weight-aty-demo-v1') || 'null');
  if (saved) {
    const user = saved.users?.find(function (item) { return item.id === saved.currentUserId; });
    const count = (saved.notifications || []).filter(function (item) {
      return item.userId === saved.currentUserId && !item.read;
    }).length;
    document.querySelectorAll('.badge-count').forEach(function (badge) {
      badge.textContent = count;
      badge.hidden = count === 0;
      badge.parentElement.setAttribute('aria-label', count + ' notifications non lues');
    });
    if (user) WAT.dom.text('.account-nav .avatar', user.initials);
  }
} catch {
  // LE CONTENU HTML RESTE DISPONIBLE SANS STOCKAGE LOCAL
}
