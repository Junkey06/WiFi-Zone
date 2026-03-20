/* transactions.js — fetch and render transactions for signed-in user */
(function(){
  'use strict';

  const API_BASE = 'http://10.0.10.8:7071/api/wifi/transactions';

  function formatNumber(n){
    try{ return Number(n).toLocaleString('fr-FR'); }catch(e){ return String(n); }
  }

  function getUserFromAuth(){
    try{ if(window.getAuth && typeof window.getAuth === 'function'){ const a = window.getAuth(); if(a && a.user) return a.user; } }catch(e){}
    try{ const raw = localStorage.getItem('authUser'); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
  }

  function findUserId(user){
    if(!user) return null;
    if(typeof user === 'string') return user;
    const tryKeys = ['id','_id','idUser','userId','numeroWhatsapp','numero','phone','phoneNumber','user_id','id_user'];
    for(const k of tryKeys){ if(user[k]) return user[k]; }
    for(const v of Object.values(user)){
      if(!v) continue;
      if(typeof v === 'number') return v;
      if(typeof v === 'string'){
        const s = v.trim();
        if(/^[\+]?\d[\d\s\-]{4,}$/.test(s)) return s;
        if(/^[0-9]+$/.test(s)) return s;
      }
    }
    return null;
  }

  function makeRow(tx){
    const tr = document.createElement('tr');
    // Date/time
    const dt = document.createElement('td');
    dt.textContent = (tx.date || '') + (tx.time ? ', ' + tx.time : '');
    tr.appendChild(dt);

    // Status
    const st = document.createElement('td');
    const span = document.createElement('span');
    span.className = 'status-badge ' + (tx.statut && tx.statut.toLowerCase() === 'success' ? 'valid' : 'expired');
    span.textContent = tx.statut && tx.statut.toLowerCase() === 'success' ? 'Valide' : (tx.statut || 'Expiré');
    st.appendChild(span);
    tr.appendChild(st);

    // Amount
    const cost = document.createElement('td');
    cost.className = 'cost-cell';
    cost.textContent = (tx.montant !== undefined ? formatNumber(tx.montant) : '0') + ' Fcfa';
    tr.appendChild(cost);

    // Username
    const userTd = document.createElement('td');
    const userSpan = document.createElement('span');
    userSpan.className = 'credential';
    userSpan.textContent = tx.username || '';
    userTd.appendChild(userSpan);
    tr.appendChild(userTd);

    // Password (masked with reveal on hover)
    const passTd = document.createElement('td');
    const passSpan = document.createElement('span');
    passSpan.className = 'credential password';
    const hidden = document.createElement('span'); hidden.className = 'hidden-pass'; hidden.textContent = '••••••••';
    const realp = document.createElement('span'); realp.className = 'real-pass'; realp.textContent = tx.password || '';
    passSpan.appendChild(hidden); passSpan.appendChild(realp); passTd.appendChild(passSpan);
    tr.appendChild(passTd);

    // Data
    const dataTd = document.createElement('td');
    const dataBadge = document.createElement('span');
    dataBadge.className = 'data-badge';
    dataBadge.innerHTML = '<i class="bi bi-wifi"></i> ' + (tx.data || '');
    dataTd.appendChild(dataBadge);
    tr.appendChild(dataTd);

    return tr;
  }

  async function loadTransactions(userId){
    const body = document.getElementById('transactionBody');
    const totalEl = document.getElementById('totalTicker');
    const validEl = document.getElementById('ticketValide');
    const expEl = document.getElementById('ticketExpire');
    const revEl = document.getElementById('revenuTotal');
    if(body) body.innerHTML = '<tr><td colspan="6">Chargement…</td></tr>';
    const url = userId ? (API_BASE + '/' + encodeURIComponent(userId)) : API_BASE;
    try{
      const res = await fetch(url,{ method: 'GET' });
      if(!res.ok){
        console.warn('Transactions fetch failed', res.status);
        if(body) body.innerHTML = '<tr><td colspan="6">Impossible de charger les transactions.</td></tr>';
        return;
      }
      const data = await res.json();
      if(totalEl) totalEl.textContent = (data.totalTicker !== undefined ? data.totalTicker : 0);
      if(validEl) validEl.textContent = (data.ticketValide !== undefined ? data.ticketValide : 0);
      if(expEl) expEl.textContent = (data.ticketExpire !== undefined ? data.ticketExpire : 0);
      if(revEl) revEl.textContent = (data.revenuTotal !== undefined ? formatNumber(data.revenuTotal) + ' Fcfa' : '0 Fcfa');

      if(body){
        body.innerHTML = '';
        const arr = Array.isArray(data.dataTransactions) ? data.dataTransactions : [];
        if(arr.length === 0){
          body.innerHTML = '<tr><td colspan="6" class="empty-state">Aucune transaction</td></tr>';
        } else {
          for(const tx of arr){ body.appendChild(makeRow(tx)); }
        }
      }
    }catch(err){
      console.error('Transactions fetch error', err);
      if(body) body.innerHTML = '<tr><td colspan="6">Erreur de connexion.</td></tr>';
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    const user = getUserFromAuth();
    const id = findUserId(user);
    if(id){
      console.debug('Transactions: loading for user id', id);
      loadTransactions(id);
    } else {
      console.debug('Transactions: no user id found, loading global transactions');
      loadTransactions(null);
    }
    // expose reload for manual refresh
    window.reloadTransactions = function(){ const u = getUserFromAuth(); loadTransactions(findUserId(u)); };
  });

})();
