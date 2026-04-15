document.addEventListener('DOMContentLoaded', function(){
  function getUser(){
    try{ if(window.getAuth && typeof window.getAuth === 'function'){ const a = window.getAuth(); if(a && a.user) return a.user; } }catch(e){}
    try{ const raw = localStorage.getItem('authUser'); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
  }

  const user = getUser();
  const container = document.getElementById('topbarUser');
  if(!container) return;

  const name = user ? (user.nom || user.name || user.username || user.numeroWhatsapp || user.phone || 'Utilisateur') : 'Utilisateur';

  // Always rebuild the container with dropdown
  container.innerHTML = `
    <div class="user-dropdown">
      <button id="userBtn">
        <span>${name}</span>
        <i class="fa fa-user" aria-hidden="true"></i>
      </button>
      <div class="dropdown-menu" id="dropdownMenu">
        <a href="#" id="logoutBtn">
          <i class="fa fa-sign-out" aria-hidden="true"></i> Déconnexion
        </a>
      </div>
    </div>
  `;

  const userBtn = document.getElementById('userBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');

  userBtn.addEventListener('click', function(e){
    e.stopPropagation();
    dropdownMenu.classList.toggle('open');
  });

  document.addEventListener('click', function(){
    dropdownMenu.classList.remove('open');
  });

  logoutBtn.addEventListener('click', function(e){
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html'; // 👈 change if needed
  });
});