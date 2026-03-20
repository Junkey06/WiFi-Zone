document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('signinForm');
  const msg = document.getElementById('signinMessage');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }

    const numero = (form.querySelector('[name="numeroWhatsapp"]') || {}).value || '';
    const password = (form.querySelector('[name="password"]') || {}).value || '';

    if (!numero.trim() || !password) {
      if (msg) { msg.style.color = '#b00'; msg.textContent = 'Veuillez remplir tous les champs.'; msg.style.display = 'block'; }
      return;
    }

    try {
      const res = await fetch('http://10.0.10.8:7071/api/wifi/login-user', {
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

      const successText = (data && (data.message || 'Connexion réussie')) || 'Connexion réussie';
      if (msg) { msg.style.color = 'green'; msg.textContent = successText; msg.style.display = 'block'; }

      // If API returned a token, store it. If not, still capture any user info returned.
      if (data) {
        if (data.token) {
          try { localStorage.setItem('authToken', data.token); } catch (e) { /* ignore */ }
        }
        // build a robust user object: prefer data.user, otherwise collect common fields and include any id-like keys
        let userObj = null;
        if (data.user && typeof data.user === 'object') {
          userObj = data.user;
        } else {
          const candidate = {};
          if (data.nom) candidate.nom = data.nom;
          if (data.name) candidate.nom = candidate.nom || data.name;
          if (data.numeroWhatsapp) candidate.numeroWhatsapp = data.numeroWhatsapp;
          // detect id-like fields on root
          const idKeys = ['id','_id','idUser','userId','user_id','id_user','numeroWhatsapp','numero','phone','phoneNumber'];
          for (const k of idKeys) { if (data[k]) { candidate.id = data[k]; break; } }
          userObj = Object.keys(candidate).length ? candidate : null;
        }

        if (userObj) {
          try { localStorage.setItem('authUser', JSON.stringify(userObj)); } catch(e){}
          try { if (typeof window.setAuth === 'function') window.setAuth(data.token || null, userObj); }catch(e){}
        }
        // Persist roles if provided by login response
        try {
          const rolesFromData = (data && (data.roles || (data.user && data.user.roles) || data.role || (data.user && data.user.role))) || null;
          if (rolesFromData) {
            try { localStorage.setItem('roles', JSON.stringify(rolesFromData)); } catch(e){}
          } else if (data && data.token) {
            // try to fetch profile to obtain roles when not present in login response
            (async function(){
              try {
                const pRes = await fetch('http://10.0.10.8:7071/api/wifi/profile', {
                  method: 'GET',
                  headers: { 'Authorization': 'Bearer ' + (data.token || ''), 'Accept': 'application/json' }
                });
                if (pRes && pRes.ok) {
                  const pText = await pRes.text();
                  let pData = null; try { pData = JSON.parse(pText); } catch(e){ pData = null; }
                  const rolesFromProfile = (pData && (pData.roles || (pData.user && pData.user.roles) || pData.role || (pData.user && pData.user.role))) || null;
                  if (rolesFromProfile) {
                    try { localStorage.setItem('roles', JSON.stringify(rolesFromProfile)); } catch(e){}
                  }
                }
              } catch(e) { /* ignore profile fetch errors */ }
            })();
          }
        } catch(e){}
      } else {
        // no JSON body, but still sign in visually using the submitted phone
        try { if (typeof window.setAuth === 'function') window.setAuth(null, { numeroWhatsapp: numero }); } catch(e){}
      }

      setTimeout(() => {
        if (typeof closeSignin === 'function') closeSignin();
        form.reset();
        if (msg) msg.style.display = 'none';
      }, 900);

    } catch (err) {
      if (msg) { msg.style.color = '#b00'; msg.textContent = 'Erreur réseau — vérifiez la connexion'; msg.style.display = 'block'; }
    }
  });
});
