/* Simple auth manager: store token + user in localStorage and render navbar auth UI */
(function (){
  const TOKEN_KEY = 'authToken';
  const USER_KEY = 'authUser';

  function setAuth(token, user){
    if(token) localStorage.setItem(TOKEN_KEY, token);
    if(user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    renderAuth();
  }

  function clearAuth(){
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    renderAuth();
  }

  function getAuth(){
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    let user = null;
    try{ user = userJson ? JSON.parse(userJson) : null; }catch(e){ user = null; }
    return { token, user };
  }

  function createUserButton(user){
    const name = (user && (user.nom || user.name || user.username || user.numeroWhatsapp)) || 'Utilisateur';
    const avatar = (user && (user.avatar || user.avatarUrl)) || null;

    const wrapper = document.createElement('div');
    wrapper.className = 'user-menu';
    wrapper.style.position = 'relative';

    const btn = document.createElement('button');
    btn.className = 'user-btn';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '8px';
    btn.style.background = 'transparent';
    btn.style.border = '0';
    btn.style.cursor = 'pointer';

    if(avatar){
      const img = document.createElement('img');
      img.src = avatar;
      img.alt = name;
      img.style.width = '36px';
      img.style.height = '36px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      btn.appendChild(img);
    } else {
      const ico = document.createElement('i');
      ico.className = 'fas fa-user-circle';
      ico.style.fontSize = '28px';
      btn.appendChild(ico);
    }

    const span = document.createElement('span');
    span.textContent = name;
    span.style.marginLeft = '4px';
    span.style.fontWeight = '600';
    btn.appendChild(span);

    // dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.top = 'calc(100% + 6px)';
    dropdown.style.right = '0';
    dropdown.style.minWidth = '160px';
    dropdown.style.background = '#fff';
    dropdown.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
    dropdown.style.borderRadius = '8px';
    dropdown.style.padding = '8px 0';
    dropdown.style.display = 'none';
    dropdown.style.zIndex = '9999';

    const dash = document.createElement('a');
    dash.href = 'dashboard.html';
    dash.textContent = 'Dashboard';
    dash.style.display = 'block';
    dash.style.padding = '8px 12px';
    dash.style.color = '#222';
    dash.style.textDecoration = 'none';
    dash.addEventListener('click', (e)=>{ e.preventDefault(); window.location.href = 'dashboard.html'; });

    const logout = document.createElement('a');
    logout.href = '#';
    logout.textContent = 'Se déconnecter';
    logout.style.display = 'block';
    logout.style.padding = '8px 12px';
    logout.style.color = '#b00';
    logout.style.textDecoration = 'none';
    logout.addEventListener('click', (e)=>{ e.preventDefault(); clearAuth(); });

    dropdown.appendChild(dash);
    dropdown.appendChild(logout);

    btn.addEventListener('click', function(e){
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // close on outside click
    document.addEventListener('click', ()=>{ dropdown.style.display = 'none'; });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    return wrapper;
  }

  function renderAuth(){
    const container = document.getElementById('authContainer');
    if(!container) return;
    const { token, user } = getAuth();
    container.innerHTML = '';
    // consider user present as authenticated even if tokenless APIs are used
    if(token || user){
      const node = createUserButton(user || {});
      container.appendChild(node);
    } else {
      // show signin/signup buttons
      const signin = document.createElement('button');
      signin.className = 'btn btn-outline signin-btn';
      signin.textContent = 'Sign in';
      signin.addEventListener('click', function(){ if(typeof openSignin === 'function') openSignin(); });

      const signup = document.createElement('button');
      signup.className = 'btn btn-primary';
      signup.style.marginLeft = '10px';
      signup.textContent = 'Signup';
      signup.addEventListener('click', function(){ if(typeof openSignup === 'function') openSignup(); });

      container.appendChild(signin);
      container.appendChild(signup);
    }
  }

  // expose functions globally for other scripts
  window.setAuth = setAuth;
  window.clearAuth = clearAuth;
  window.getAuth = getAuth;
  window.renderAuth = renderAuth;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAuth);
  } else {
    // DOM already ready
    renderAuth();
  }
})();
