/* dashboard.js — fetch and render dashboard stats for signed-in user */
(function(){
  'use strict';

  const API_BASE = 'http://10.0.10.8:7071/api/wifi/dashboard{idUser}'.replace('{idUser}', '');

  function formatAmount(n){
    if (n === null || n === undefined) return '0';
    try{ return Number(n).toLocaleString('fr-FR'); }catch(e){ return String(n); }
  }

  async function loadStatsFor(userId){
    const soldeEl = document.getElementById('soldeTotal');
    const venteEl = document.getElementById('venteTotal');
    const gainEl = document.getElementById('gainTotal');
    if(soldeEl) soldeEl.textContent = '…';
    if(venteEl) venteEl.textContent = '…';
    if(gainEl) gainEl.textContent = '…';

    try{
      const url = userId ? (API_BASE + '/' + encodeURIComponent(userId)) : API_BASE;
      const res = await fetch(url, { method: 'GET' });
      if(!res.ok){
        console.warn('Dashboard fetch failed', res.status);
        if(soldeEl) soldeEl.textContent = 'N/A';
        if(venteEl) venteEl.textContent = 'N/A';
        if(gainEl) gainEl.textContent = 'N/A';
        return;
      }
      const data = await res.json();

      if (soldeEl) {
        const v = data.soldeTotal;
        if (typeof v === 'string') soldeEl.textContent = v;
        else soldeEl.textContent = formatAmount(v);
      }

      if (venteEl) {
        const v = data.venteTotal;
        if (typeof v === 'string') venteEl.textContent = v;
        else venteEl.textContent = formatAmount(v) + ' Fcfa';
      }

      if (gainEl) {
        const v = data.gainTotal;
        if (typeof v === 'string') gainEl.textContent = v;
        else gainEl.textContent = formatAmount(v) + ' Fcfa';
      }
    }catch(err){
      console.error('Dashboard fetch error', err);
      if(soldeEl) soldeEl.textContent = 'N/A';
      if(venteEl) venteEl.textContent = 'N/A';
      if(gainEl) gainEl.textContent = 'N/A';
    }
  }

  function getUserFromAuth(){
    try{
      if(window.getAuth && typeof window.getAuth === 'function'){
        const a = window.getAuth(); if(a && a.user) return a.user;
      }
    }catch(e){}
    try{
      const raw = localStorage.getItem('authUser'); return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function findUserId(user){
    if(!user) return null;
    if(typeof user === 'string') return user;
    const tryKeys = ['id','_id','idUser','userId','numeroWhatsapp','numero','phone','phoneNumber','user_id','id_user','identifier','identifiant','name'];
    for(const k of tryKeys){ if(user[k]) return user[k]; }

    // fallback: inspect values for phone-like, numeric or uuid-like values
    for(const v of Object.values(user)){
      if(!v) continue;
      if(typeof v === 'number') return v;
      if(typeof v === 'string'){
        const s = v.trim();
        if(/^[\+]?\d[\d\s\-]{4,}$/.test(s)) return s; // phone-like
        if(/^[0-9]+$/.test(s)) return s; // numeric id
        if(/^[0-9a-fA-F\-]{8,}$/.test(s)) return s; // uuid-ish
      }
    }
    return null;
  }

  function applyUserToHeader(user){
    if(!user) return;
    const headerName = document.querySelector('header.topbar .user span');
    const headerImg = document.querySelector('header.topbar .user img');
    const name = user.nom || user.name || user.username || user.numeroWhatsapp || user.id || 'Utilisateur';
    if(headerName) headerName.textContent = name;
    if(headerImg && user.avatar) headerImg.src = user.avatar;
  }

  document.addEventListener('DOMContentLoaded', function(){
    const user = getUserFromAuth();
    if(user){
      // determine id field (robust)
      const id = findUserId(user);
      applyUserToHeader(user);
      if(id){
        console.debug('Dashboard: using user id ->', id);
        loadStatsFor(id);
      } else {
        console.warn('No id found on auth user; cannot load dashboard stats — user object:', user);
      }
    } else {
      console.warn('No authenticated user found in localStorage');
      const soldeEl = document.getElementById('soldeTotal');
      const venteEl = document.getElementById('venteTotal');
      const gainEl = document.getElementById('gainTotal');
      if(soldeEl) soldeEl.textContent = '—';
      if(venteEl) venteEl.textContent = '—';
      if(gainEl) gainEl.textContent = '—';
    }
  });

})();
