// Fill topbar username from auth or localStorage
  document.addEventListener('DOMContentLoaded', function(){
    function getUser(){
      try{ if(window.getAuth && typeof window.getAuth === 'function'){ const a = window.getAuth(); if(a && a.user) return a.user; } }catch(e){}
      try{ const raw = localStorage.getItem('authUser'); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
    }
    const user = getUser();
    const container = document.getElementById('topbarUser');
    if(!container) return;
    if(user){
      const name = user.nom || user.name || user.username || user.numeroWhatsapp || user.phone || 'Utilisateur';
      container.innerHTML = '<button><span>' + name + '</span><i class="fa fa-user" aria-hidden="true"></i></button>';
    }
  });