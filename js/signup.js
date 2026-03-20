// Signup form handler - posts JSON to API and shows a success overlay
(function(){
  'use strict';
  const form = document.getElementById('signupForm');
  if(!form) return;
  const msg = document.getElementById('signupMessage');
  const submitBtn = document.getElementById('signupSubmit');
  const signupModal = document.getElementById('signupModal');
  const signupInner = signupModal ? signupModal.querySelector('.signup-modal') : null;
  const API_URL = 'http://10.0.10.8:7071/api/wifi/create-user';

  function createSuccessOverlay(text){
    const overlay = document.createElement('div');
    overlay.id = 'signupSuccessOverlay';
    overlay.setAttribute('role','status');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(255,255,255,0.98)';
    overlay.style.zIndex = '9999';
    overlay.style.padding = '20px';
    overlay.style.boxSizing = 'border-box';

    overlay.innerHTML = `
      <div style="max-width:420px;width:100%;text-align:center;padding:24px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.12);background:linear-gradient(180deg,#fff,#f7fff7);">
        <div style="font-size:48px;color:#0a8f3f;margin-bottom:8px;">✓</div>
        <h3 style="margin:6px 0 8px;color:#073;">Compte créé</h3>
        <p style="margin:0 0 12px;color:#245;">${text}</p>
        <button id="signupSuccessClose" style="padding:8px 14px;border-radius:8px;border:0;background:#0a8f3f;color:#fff;cursor:pointer;">Fermer</button>
      </div>
    `;

    // click close
    overlay.addEventListener('click', (e)=>{
      if(e.target === overlay || e.target.id === 'signupSuccessClose') removeOverlay();
    });

    function removeOverlay(){
      if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    return { overlay, removeOverlay };
  }

  function showSuccess(text){
    if(!signupInner) return;
    // ensure signup modal is visible
    try{ signupModal.style.display = 'flex'; }catch(e){}
    const { overlay, removeOverlay } = createSuccessOverlay(text);
    // position relative to allow absolute overlay
    const prevPos = signupInner.style.position;
    if(!prevPos) signupInner.style.position = 'relative';
    signupInner.appendChild(overlay);

    // auto close after 1800ms
    const t = setTimeout(()=>{
      try{ removeOverlay(); }catch(e){}
      try{ closeSignup(); }catch(e){}
      try{ form.reset(); }catch(e){}
    }, 1800);
    // return function to cancel
    return ()=>{ clearTimeout(t); removeOverlay(); };
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    if(!msg || !submitBtn) return;
    // reset message visuals
    msg.style.display = 'none';
    msg.style.color = '#b00';
    const nom = document.getElementById('nom').value.trim();
    const numeroWhatsapp = document.getElementById('numeroWhatsapp').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;

    if(!nom || !numeroWhatsapp || !password){
      msg.textContent = 'Veuillez remplir tous les champs.';
      msg.style.display = 'block';
      return;
    }
    if(password !== confirm){
      msg.textContent = 'Les mots de passe ne correspondent pas.';
      msg.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '...Envoi';

    // detect Njoh flow (opened by second Njoh click)
    const isNjohFlow = localStorage.getItem('njoh_flow') === '1';
    const typeVal = isNjohFlow ? 'freeData' : '';

    try{
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nom, numeroWhatsapp, password, type: typeVal })
      });

      const respText = await res.text().catch(()=>null);
      let respData = null;
      try{ respData = respText ? JSON.parse(respText) : null; }catch(e){ respData = null; }

      if(!res.ok){
        let message = 'Erreur lors de la création du compte.';
        if(respData && (respData.message || respData.error)) message = respData.message || respData.error;
        else if(respText) message = respText;
        msg.textContent = message;
        msg.style.display = 'block';
      } else {
        // success — do NOT persist the second click here yet; persist only after
        // we confirm the account produced usable credentials or the user is logged in.

        // success — special handling for Njoh freeData flow: if backend returned WiFi credentials, auto-login the hotspot
        if(isNjohFlow && respData && (respData.usernameWifi || respData.passwordWifi || respData.username || respData.password)){
          try{
            const u = respData.usernameWifi || respData.username || '';
            const p = respData.passwordWifi || respData.password || '';
            const inlineForm = document.forms['inlineLogin'];
            if(inlineForm){
              if(inlineForm.username) inlineForm.username.value = u;
              if(inlineForm.password) inlineForm.password.value = p;
              const submitBtn2 = inlineForm.querySelector('input[type=submit], button[type=submit]');
              if(submitBtn2) submitBtn2.click();
              else if(typeof inlineForm.requestSubmit === 'function') inlineForm.requestSubmit();
              else inlineForm.submit();
            } else {
              const loginForm = document.forms['login'];
              if(loginForm){
                if(loginForm.username) loginForm.username.value = u;
                if(loginForm.password) loginForm.password.value = p;
                const submitBtn3 = loginForm.querySelector('input[type=submit], button[type=submit]');
                if(submitBtn3) submitBtn3.click(); else loginForm.submit();
              }
            }
          }catch(e){ console.warn('Njoh post-signup auto-login failed', e); }
          if(isNjohFlow){
            try{ localStorage.setItem('njoh_clicks','2'); }catch(e){}
            try{ localStorage.removeItem('njoh_flow'); }catch(e){}
          }
          showSuccess('Votre compte a été créé — connexion en cours.');
          return;
        }

        // success — attempt to set auth if token returned, otherwise try to login automatically
        try{
          if(respData && respData.token){
            try{ localStorage.setItem('authToken', respData.token); }catch(e){}
            // persist user (prefer respData.user), ensure id is preserved if present
            let createdUser = null;
            if(respData.user && typeof respData.user === 'object') createdUser = respData.user;
            else {
              createdUser = {};
              if(respData.nom) createdUser.nom = respData.nom;
              if(respData.name) createdUser.nom = createdUser.nom || respData.name;
              if(respData.numeroWhatsapp) createdUser.numeroWhatsapp = respData.numeroWhatsapp;
              const idKeys = ['id','_id','idUser','userId','user_id','id_user','numeroWhatsapp','numero','phone','phoneNumber'];
              for(const k of idKeys) if(respData[k]) { createdUser.id = respData[k]; break; }
            }
            try{ if(createdUser) localStorage.setItem('authUser', JSON.stringify(createdUser)); }catch(e){}
            try{ if(typeof window.setAuth === 'function') window.setAuth(respData.token, createdUser || { nom }); }catch(e){}
            if(isNjohFlow){ try{ localStorage.setItem('njoh_clicks','2'); }catch(e){} try{ localStorage.removeItem('njoh_flow'); }catch(e){} }
            showSuccess('Votre compte a bien été créé et vous êtes connecté.');
          } else {
            // attempt to login with same credentials
            try{
              const loginRes = await fetch('http://10.0.10.8:7071/api/wifi/login-user', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numeroWhatsapp, password, type: typeVal })
              });
              const loginText = await loginRes.text().catch(()=>null);
              let loginData = null;
              try{ loginData = loginText ? JSON.parse(loginText) : null; }catch(e){ loginData = null; }
              if(loginRes.ok){
                // if loginData has a token or user info, persist and set auth
                if(loginData && loginData.token){
                  try{ localStorage.setItem('authToken', loginData.token); }catch(e){}
                }
                // build login user object robustly and include id when present
                let loginUser = null;
                if(loginData && loginData.user && typeof loginData.user === 'object') loginUser = loginData.user;
                else if (loginData) {
                  const cand = {};
                  if(loginData.nom) cand.nom = loginData.nom;
                  if(loginData.name) cand.nom = cand.nom || loginData.name;
                  if(loginData.numeroWhatsapp) cand.numeroWhatsapp = loginData.numeroWhatsapp;
                  const idKeys = ['id','_id','idUser','userId','user_id','id_user','numeroWhatsapp','numero','phone','phoneNumber'];
                  for(const k of idKeys) if(loginData[k]) { cand.id = loginData[k]; break; }
                  loginUser = Object.keys(cand).length ? cand : null;
                }
                if(loginUser){
                  try{ localStorage.setItem('authUser', JSON.stringify(loginUser)); }catch(e){}
                  try{ if(typeof window.setAuth === 'function') window.setAuth(loginData && loginData.token ? loginData.token : null, loginUser); }catch(e){}
                  if(isNjohFlow){ try{ localStorage.setItem('njoh_clicks','2'); }catch(e){} try{ localStorage.removeItem('njoh_flow'); }catch(e){} }
                  showSuccess('Votre compte a bien été créé et vous êtes connecté.');
                } else {
                  showSuccess('Votre compte a bien été créé. Vous pouvez vous connecter.');
                }
              } else {
                showSuccess('Votre compte a bien été créé. Vous pouvez vous connecter.');
              }
            }catch(e){
              showSuccess('Votre compte a bien été créé. Vous pouvez vous connecter.');
            }
          }
        }catch(e){
          showSuccess('Votre compte a bien été créé. Vous pouvez vous connecter.');
        }
      }
    }catch(err){
      msg.style.color = '#b00';
      msg.textContent = 'Impossible de joindre le serveur. Vérifiez la connexion.';
      msg.style.display = 'block';
    } finally{
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();
