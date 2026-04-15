/* notifications.js — fetch and render notifications for signed-in user */
(function(){
  'use strict';

  const API_BASE = 'http://185.213.27.226:7071/api/wifi/notifications';
  // runtime state for current user and read set
  let __currentUserId = null;
  let __currentReadSet = new Set();

  function getUserFromAuth(){
    try{ if(window.getAuth && typeof window.getAuth === 'function'){ const a = window.getAuth(); if(a && a.user) return a.user; } }catch(e){}
    try{ const raw = localStorage.getItem('authUser'); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
  }

  function isNotificationRead(n){
    return !!(n && (n.lu || n.read || n.isRead || (n.status && String(n.status).toLowerCase() === 'read') || (n.statut && String(n.statut).toLowerCase() === 'read')));
  }

  function getReadKeyForUser(userId){
    return 'readNotifications:' + (userId ? String(userId) : 'global');
  }

  function loadReadSet(userId){
    try{
      const raw = localStorage.getItem(getReadKeyForUser(userId));
      if(!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    }catch(e){ return new Set(); }
  }

  function saveReadSet(userId, set){
    try{ const arr = Array.from(set); localStorage.setItem(getReadKeyForUser(userId), JSON.stringify(arr)); }catch(e){ console.error('Failed to save read set', e); }
  }

  function notifKey(n){
    if(!n) return '';
    if(n.id) return String(n.id);
    // fallback stable key from title+date+time+message
    return 'gen:' + encodeURIComponent((n.titre||'') + '|' + (n.date||'') + '|' + (n.time||'') + '|' + (n.message||''));
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

  function createNotifItem(n){
    const wrap = document.createElement('div');
    const key = notifKey(n);
    const readFromServer = isNotificationRead(n);
    const readFromLocal = __currentReadSet.has(key);
    const isRead = !!(readFromServer || readFromLocal);
    wrap.className = 'notif-item ' + (isRead ? 'read' : 'unread');
    if(n.id) wrap.dataset.id = n.id;
    wrap.dataset.key = key;
    wrap.dataset.title = n.titre || '';
    wrap.dataset.date = (n.date || '') + (n.time ? ' · ' + n.time : '');
    wrap.dataset.message = n.message || '';
    wrap.dataset.fullMessage = n.message || '';

    const accent = document.createElement('div'); accent.className = 'notif-accent';
    wrap.appendChild(accent);

    const content = document.createElement('div'); content.className = 'notif-content';
    const header = document.createElement('div'); header.className = 'notif-header';
    const sender = document.createElement('span'); sender.className = 'notif-sender'; sender.textContent = n.titre || 'Notification';
    const date = document.createElement('span'); date.className = 'notif-date'; date.textContent = (n.date || '') + (n.time ? ' · ' + n.time : '');
    header.appendChild(sender); header.appendChild(date);
    const msg = document.createElement('p'); msg.className = 'notif-message';
    const preview = n.message || '';
    msg.textContent = preview.length > 120 ? preview.slice(0,120) + '…' : preview;
    content.appendChild(header); content.appendChild(msg);
    wrap.appendChild(content);

    wrap.addEventListener('click', function(e){
      e.preventDefault();
      openNotifModal(n);
      // mark as read: persist and update counts
      try{ markNotificationRead(__currentUserId, n, wrap); }catch(e){ console.error(e); }
    });

    return wrap;
  }

  function openNotifModal(n){
    try{
      const modal = document.getElementById('notifModal');
      if(!modal) return;
      const modalBox = modal.querySelector('.notif-modal-box') || modal.firstElementChild;
      // show centered overlay
      modal.style.display = 'flex';
      modal.style.position = 'fixed';
      modal.style.inset = '0';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '9999';
      modal.style.background = 'rgba(0,0,0,0.45)';
      if(modalBox){
        modalBox.style.maxWidth = '720px';
        modalBox.style.margin = '0 16px';
        modalBox.style.borderRadius = '10px';
        modalBox.style.padding = modalBox.style.padding || '20px';
        modalBox.style.background = modalBox.style.background || '#fff';
        modalBox.style.position = 'relative';
      }

      const title = document.getElementById('modalTitle');
      const dateEl = document.getElementById('modalDate');
      const message = document.getElementById('modalMessage');
      if(title) title.textContent = n.titre || modal.dataset.title || '';
      if(dateEl) dateEl.textContent = (n.date || '') + (n.time ? ' · ' + n.time : '');
      if(message) message.textContent = n.message || modal.dataset.message || '';

      // close helpers
      function closeModal(){
        modal.style.display = 'none';
        window.removeEventListener('keydown', onKey);
        modal.removeEventListener('click', onOutside);
        if(closeBtn) closeBtn.removeEventListener('click', onCloseBtn);
      }
      function onKey(e){ if(e.key === 'Escape') closeModal(); }
      function onOutside(e){ if(e.target === modal) closeModal(); }
      function onCloseBtn(){ closeModal(); }

      window.addEventListener('keydown', onKey);
      modal.addEventListener('click', onOutside);
      const closeBtn = modal.querySelector('.notif-close');
      if(closeBtn){ closeBtn.addEventListener('click', onCloseBtn); }
    }catch(e){ console.error(e); }
  }

  function updateUnreadDisplay(delta){
    try{
      const titleEl = document.querySelector('.notifications-wrapper .notif-title');
      if(!titleEl) return;
      const span = titleEl.querySelector('span');
      if(!span) return;
      const m = span.textContent.match(/(\d+)/);
      if(!m) return;
      let cur = parseInt(m[1],10);
      cur = Math.max(0, cur + (delta||0));
      span.textContent = '(' + cur + ' nouveaux)';
    }catch(e){ console.error(e); }
  }

  function markNotificationRead(userId, n, element){
    try{
      const key = notifKey(n);
      const set = loadReadSet(userId);
      if(!set.has(key)){
        set.add(key);
        saveReadSet(userId, set);
        __currentReadSet = set;
        // update DOM element state
        try{ if(element){ element.classList.remove('unread'); element.classList.add('read'); } }
        catch(e){}
        // decrement unread count display
        updateUnreadDisplay(-1);
      }
    }catch(e){ console.error('markNotificationRead error', e); }
  }

  // Insert element into wrapper keeping unread items above read items
  function insertNotifElement(wrapper, el, isRead){
    if(!wrapper || !el) return;
    const unreadNodes = wrapper.querySelectorAll('.notif-item.unread');
    if(!isRead){
      // insert after last unread (or right after title)
      if(unreadNodes.length > 0){
        unreadNodes[unreadNodes.length-1].after(el);
      } else {
        const titleEl = wrapper.querySelector('.notif-title');
        if(titleEl) titleEl.after(el); else wrapper.prepend(el);
      }
    } else {
      // read: place after last unread, or append at end
      if(unreadNodes.length > 0){
        unreadNodes[unreadNodes.length-1].after(el);
      } else {
        wrapper.appendChild(el);
      }
    }
  }

  function moveElementToRead(wrapper, el){
    if(!wrapper || !el) return;
    // remove and re-insert in read section (after last unread)
    el.remove();
    const unreadNodes = wrapper.querySelectorAll('.notif-item.unread');
    if(unreadNodes.length > 0){
      unreadNodes[unreadNodes.length-1].after(el);
    } else {
      wrapper.appendChild(el);
    }
  }

  async function loadNotifications(userId){
    const wrapper = document.querySelector('.notifications-wrapper');
    if(!wrapper) return;
    // show loading placeholder while we fetch
    wrapper.innerHTML = '<p style="padding:18px;">Chargement…</p>';
    // set current user and load persisted read set
    __currentUserId = userId || null;
    __currentReadSet = loadReadSet(__currentUserId);
    const url = userId ? (API_BASE + '/' + encodeURIComponent(userId)) : API_BASE;
    try{
      const res = await fetch(url, { method: 'GET' });
      if(!res.ok){
        wrapper.innerHTML = '<p style="padding:18px;">Impossible de charger les notifications.</p>';
        return;
      }
      const data = await res.json();
      const arr = Array.isArray(data.dataNotifications) ? data.dataNotifications : [];
      const total = data.totalNotification ?? data.totalNotifications ?? data.total ?? arr.length;
      let unread = data.unreadNotification ?? data.unreadNotifications ?? data.unreadCount ?? null;
      if(unread === null || unread === undefined){
        unread = arr.reduce((acc, it) => {
          const key = notifKey(it);
          const isReadLocal = __currentReadSet.has(key);
          return acc + (isNotificationRead(it) || isReadLocal ? 0 : 1);
        }, 0);
      }
      // build output: title + list
      wrapper.innerHTML = '';
      const titleEl = document.createElement('h2');
      titleEl.className = 'notif-title';
      titleEl.innerHTML = total + ' Messages <span>(' + unread + ' nouveaux)</span>';
      wrapper.appendChild(titleEl);
      if(arr.length === 0){ wrapper.appendChild(document.createElement('p')).className = 'empty-state'; wrapper.querySelector('.empty-state').textContent = 'Aucune notification'; }
      else {
        for(const n of arr){
          const item = createNotifItem(n);
          const key = notifKey(n);
          const isRead = isNotificationRead(n) || __currentReadSet.has(key);
          insertNotifElement(wrapper, item, isRead);
        }
      }
    }catch(err){ console.error('Notifications fetch error', err); if(wrapper) wrapper.innerHTML = '<p style="padding:18px;">Erreur réseau.</p>'; }
  }

  document.addEventListener('DOMContentLoaded', function(){
    const user = getUserFromAuth();
    const id = findUserId(user);
    loadNotifications(id || null);
  });

})();
