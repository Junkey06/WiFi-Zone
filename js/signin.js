// ─── Helpers (scope global pour être accessibles partout) ────────────────────

/**
 * Extrait TOUS les rôles depuis la réponse API.
 * Gère : data.role, data.roles, data.user.role, data.user.roles (string ou tableau)
 * Retourne toujours un tableau de strings en minuscules.
 */
function _extractRoles(data) {
  if (!data) return [];
  const raw =
    data.role ||
    data.roles ||
    (data.user && (data.user.role || data.user.roles)) ||
    null;
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .filter(r => typeof r === 'string')
    .map(r => r.trim().toLowerCase());
}

/**
 * Redirige vers le bon dashboard selon les rôles.
 * Si le tableau contient "agent" → dashboard.html  (priorité)
 * Sinon                          → dashboardp.html (défaut particulier)
 */
function _redirectByRole(roles) {
  console.log('[signin] Redirection pour rôles:', roles);
  if (Array.isArray(roles) && roles.includes('agent')) {
    window.location.replace('dashboard.html');
  } else {
    window.location.replace('dashboardp.html');
  }
}

// ─── Formulaire signin ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('signinForm');
  const msg  = document.getElementById('signinMessage');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }

    const numero   = (form.querySelector('[name="numeroWhatsapp"]') || {}).value || '';
    const password = (form.querySelector('[name="password"]')       || {}).value || '';

    if (!numero.trim() || !password) {
      if (msg) { msg.style.color = '#b00'; msg.textContent = 'Veuillez remplir tous les champs.'; msg.style.display = 'block'; }
      return;
    }

    try {
      const res = await fetch('http://185.213.27.226:7071/api/wifi/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroWhatsapp: numero.trim(), password: password })
      });

      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (err) { data = null; }

      if (!res.ok) {
        const errMsg = (data && (data.message || data.error)) || text || 'Erreur de connexion';
        if (msg) { msg.style.color = '#b00'; msg.textContent = errMsg; msg.style.display = 'block'; }
        return;
      }

      // ── Afficher le message de succès ──────────────────────────────────────
      if (msg) { msg.style.color = 'green'; msg.textContent = 'Connexion réussie !'; msg.style.display = 'block'; }

      // ── Stocker les infos utilisateur ──────────────────────────────────────
      if (data) {
        if (data.token) {
          try { localStorage.setItem('authToken', data.token); } catch (e) {}
        }

        // Construire l'objet user
        let userObj = null;
        if (data.user && typeof data.user === 'object') {
          userObj = data.user;
        } else {
          const candidate = {};
          if (data.nom)            candidate.nom            = data.nom;
          if (data.name)           candidate.nom            = candidate.nom || data.name;
          if (data.numeroWhatsapp) candidate.numeroWhatsapp = data.numeroWhatsapp;
          const idKeys = ['id','_id','idUser','userId','user_id','id_user'];
          for (const k of idKeys) { if (data[k]) { candidate.id = data[k]; break; } }
          userObj = Object.keys(candidate).length ? candidate : null;
        }

        if (userObj) {
          try { localStorage.setItem('authUser', JSON.stringify(userObj)); } catch(e) {}
        }

        // ── Extraire les rôles (tableau) et rediriger ──────────────────────
        const roles = _extractRoles(data);
        console.log('[signin] Rôles reçus de l\'API:', roles);

        // Sauvegarde le tableau complet des rôles
        try { localStorage.setItem('roles', JSON.stringify(roles)); } catch(e) {}

        // Fermer le modal proprement puis rediriger
        setTimeout(function () {
          try { if (typeof closeSignin === 'function') closeSignin(); } catch(e) {}
          form.reset();
          _redirectByRole(roles);
        }, 900);
      }

    } catch (err) {
      console.error('[signin] Erreur réseau:', err);
      if (msg) { msg.style.color = '#b00'; msg.textContent = 'Erreur réseau — vérifiez la connexion'; msg.style.display = 'block'; }
    }
  });
});