document.querySelectorAll('.offer-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    var offre = this.getAttribute('data-offre');
    var prix = this.getAttribute('data-prix');
    document.getElementById('offer').value = offre || '';
    document.getElementById('amount').value = prix || '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('paymentModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
  });
});

document.getElementById('closeModalBtn').onclick = function() {
  document.getElementById('paymentModal').style.display = 'none';
  document.body.style.overflow = '';
};

window.onclick = function(event) {
  var modal = document.getElementById('paymentModal');
  if (event.target === modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

function showAuthRequiredModal() {
  const authModal = document.getElementById('authRequiredModal');
  if (!authModal) {
    // Fallback for pages that do not include this modal markup.
    alert('Veuillez vous connecter ou créer un compte pour effectuer un achat.');
    return;
  }

  const closeBtn = document.getElementById('closeAuthRequiredBtn');
  const signInBtn = document.getElementById('authRequiredSignin');
  const signUpBtn = document.getElementById('authRequiredSignup');
  const laterBtn = document.getElementById('authRequiredLater');

  const closeAuthModal = function() {
    authModal.style.display = 'none';
    authModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  authModal.style.display = 'flex';
  authModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (closeBtn) closeBtn.onclick = closeAuthModal;
  if (laterBtn) laterBtn.onclick = closeAuthModal;

  authModal.onclick = function(e) {
    if (e.target === authModal) closeAuthModal();
  };

  if (!window.__authRequiredEscBound) {
    document.addEventListener('keydown', function(e) {
      const current = document.getElementById('authRequiredModal');
      if (e.key === 'Escape' && current && current.style.display !== 'none') {
        current.style.display = 'none';
        current.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
    window.__authRequiredEscBound = true;
  }

  if (signInBtn) {
    signInBtn.onclick = function() {
      closeAuthModal();
      if (typeof openSignin === 'function') openSignin();
      else window.location.href = 'login.html';
    };
  }

  if (signUpBtn) {
    signUpBtn.onclick = function() {
      closeAuthModal();
      if (typeof openSignup === 'function') openSignup();
      else window.location.href = 'login.html';
    };
  }
}

// Configuration Cameroun
const MTN_PREFIXES = ['670','671','672','673','674','675','676','677','678','679','683','682'];
const ORANGE_PREFIXES = ['690','691','692','693','694','695','696','697','698','699','655','640','659'];
const AVAILABLE_ACCESS_API_BASE = 'http://192.168.10.8:7071/api/wifi/available-access';

function getOperatorTypeFromNumber(num) {
  const value = (num || '').trim();
  if (value.length < 3) return null;
  const prefix = value.substring(0, 3);
  if (MTN_PREFIXES.includes(prefix)) return 'MTN';
  if (ORANGE_PREFIXES.includes(prefix)) return 'ORANGE';
  return null;
}

function extractAccessFromAnyPayload(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    for (let i = payload.length - 1; i >= 0; i--) {
      const candidate = extractAccessFromAnyPayload(payload[i]);
      if (candidate) return candidate;
    }
    return null;
  }
  if (typeof payload !== 'object') return null;

  const login = payload.login || payload.username || payload.user || payload.identifiant || payload.userName || null;
  const password = payload.password || payload.pass || payload.motDePasse || payload.mdp || null;
  if (login || password) return { login, password };

  // Try nested containers commonly used by APIs.
  return extractAccessFromAnyPayload(
    payload.data || payload.result || payload.access || payload.availableAccess || payload.ticket || null
  );
}

async function fetchLatestAvailableAccess(userId) {
  const url = AVAILABLE_ACCESS_API_BASE + '/' + encodeURIComponent(userId);
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return extractAccessFromAnyPayload(data);
}

// Détection opérateur UI
const operatorLogo = document.getElementById('operatorLogo');
const phoneInput = document.getElementById('phoneNumber');
phoneInput.addEventListener('input', function() {
  const value = this.value.trim();
  let logo = '';
  let show = false;
  const operator = getOperatorTypeFromNumber(value);
  if (operator === 'MTN') {
    logo = '<img src="img/mtn-momo.png" alt="MTN" style="height:32px; width:32px;">';
    show = true;
  } else if (operator === 'ORANGE') {
    logo = '<img src="img/orange-money.png" alt="Orange" style="height:32px; width:32px;">';
    show = true;
  }
  operatorLogo.innerHTML = logo;
  operatorLogo.style.display = show ? 'inline-block' : 'none';
});

// Soumission du paiement
const paymentForm = document.getElementById('paymentForm');
paymentForm.onsubmit = async function(e) {
  e.preventDefault();

  const submitBtn = paymentForm.querySelector('button[type="submit"]');
  const numero = document.getElementById('phoneNumber').value.trim();
  const montantStr = document.getElementById('amount').value.trim();
  const montant = parseInt(montantStr, 10);
  const type = document.getElementById('offer').value.trim();
  const categorie = (document.body && document.body.getAttribute('data-categorie')) || 'particulier';
  const idForfait = paymentForm.querySelector('input[name="idForfait"]') ? paymentForm.querySelector('input[name="idForfait"]').value.trim() : '';

  if (!/^\d{9}$/.test(numero)) {
    alert('Veuillez entrer un numéro à 9 chiffres.');
    return;
  }

  let idUser = null;
  try {
    const raw = localStorage.getItem('authUser');
    if(raw){ 
      const u = JSON.parse(raw); 
      idUser = u.id || u.idUser || u.numero || null; 
    }
  } catch(e){}

  if (!idUser) {
    document.getElementById('paymentModal').style.display = 'none';
    document.body.style.overflow = '';
    showAuthRequiredModal();
    return;
  }

  const payload = { numero, montant, categorie, idForfait, idUser };
  const apiUrl = 'http://192.168.10.8:7071/api/wifi/payment';

  submitBtn.disabled = true;
  const oldText = submitBtn.textContent;
  submitBtn.textContent = 'Traitement...';

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('paymentModal').style.display = 'none';
      document.body.style.overflow = '';
      showTransientToast('Transaction initiée. Vérifiez votre téléphone.', 10000);
      openAccessWaitingModal(idUser);
    } else {
      showTransientToast('Erreur lors de la transaction.', 8000);
    }
  } catch (err) {
    showTransientToast('Erreur réseau.', 8000);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = oldText;
  }
};

// --- MODAL D'ATTENTE ET DE VÉRIFICATION ---
function openAccessWaitingModal(userId){
  let overlay = document.getElementById('accessWaitingModal');
  
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'accessWaitingModal';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:10050;';

    const style = document.createElement('style');
    style.innerHTML = `
      .dot-loader { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 20px 0; }
      .dot-loader div { width: 12px; height: 12px; background: #0d6efd; border-radius: 50%; animation: pulse-dots 1.4s infinite ease-in-out both; }
      .dot-loader div:nth-child(1) { animation-delay: -0.32s; }
      .dot-loader div:nth-child(2) { animation-delay: -0.16s; }
      @keyframes pulse-dots {
        0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
        40% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.style.cssText = 'background:#fff; width:min(92vw, 500px); border-radius:16px; padding:30px 20px; position:relative; box-shadow:0 15px 35px rgba(0,0,0,0.3); text-align:center;';
    
    panel.innerHTML = `
      <button id="closeAccessWaitingModalBtn" style="position:absolute;top:10px;right:15px;border:none;background:transparent;font-size:28px;cursor:pointer;color:#999;">&times;</button>
      <h3 id="accessTitle" style="margin-bottom:12px; font-family:sans-serif;">Paiement en cours de validation</h3>
      
      <p id="accessWaitText" style="margin:0 0 16px 0;color:#444;line-height:1.5;">
        Veuillez patienter quelques minutes pour la <strong>génération de vos accès WiFi</strong>, puis cliquez sur VERIFIER.
      </p>
      
      <div class="dot-loader" id="loadingDots">
        <div></div><div></div><div></div>
      </div>

      <button id="verifyAccessBtn" style="border:none; background:#0d6efd; color:#fff; padding:12px 25px; border-radius:10px; cursor:pointer; font-weight:700; width:100%; font-size:16px;">
        VERIFIER
      </button>
      <div id="accessResultBox" style="margin-top:20px; text-align:left;"></div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
    document.getElementById('loadingDots').style.display = 'flex';
    document.getElementById('verifyAccessBtn').style.display = 'block';
    document.getElementById('accessTitle').textContent = 'Paiement en cours de validation';
    document.getElementById('accessWaitText').innerHTML = 'Veuillez patienter quelques minutes pour la <strong>génération de vos accès WiFi</strong>, puis cliquez sur VERIFIER.';
    document.getElementById('accessResultBox').innerHTML = '';
  }

  const verifyBtn = document.getElementById('verifyAccessBtn');
  const resultBox = document.getElementById('accessResultBox');
  const dots = document.getElementById('loadingDots');
  const waitText = document.getElementById('accessWaitText');
  const title = document.getElementById('accessTitle');

  document.getElementById('closeAccessWaitingModalBtn').onclick = () => {
    overlay.style.display = 'none';
    showAccessInfoModal(); 
  };

  verifyBtn.onclick = async function(){
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Vérification...';
    
    try {
      const access = await fetchLatestAccessFromBackend(userId);
      if(access) {
        if(dots) dots.style.display = 'none';      
        if(verifyBtn) verifyBtn.style.display = 'none'; 
        
        title.textContent = 'Accès Disponibles !';
        waitText.innerHTML = '<strong style="color:#059669;">Voici vos accès. Connectez-vous et profitez !</strong>';
        
        resultBox.innerHTML = `
          <div style="background:#f0fdf4; border:2px solid #bcf0da; padding:15px; border-radius:10px; color:#166534;">
            ${access.login ? `<div style="margin-bottom:5px;"><strong>Identifiant :</strong> ${escapeHtml(access.login)}</div>` : ''}
            ${access.password ? `<div><strong>Mot de passe :</strong> ${escapeHtml(access.password)}</div>` : ''}
          </div>
          <button id="finalFinishBtn" style="margin-top:15px; width:100%; padding:12px; border-radius:10px; border:none; background:#0d6efd; color:#fff; cursor:pointer; font-weight:600;">TERMINER</button>
        `;

        document.getElementById('finalFinishBtn').onclick = () => {
          overlay.style.display = 'none';
          showAccessInfoModal();
        };

      } else {
        resultBox.innerHTML = `<div style="background:#fff8e6; border:1px solid #f1d07a; padding:12px; border-radius:10px; color:#7a5a00; font-size:14px;">Vos accès ne sont pas encore prêts. Réessayez dans un instant.</div>`;
      }
    } catch(err) {
      resultBox.innerHTML = `<div style="background:#fff1f2; border:1px solid #fecdd3; padding:12px; border-radius:10px; color:#9f1239;">Erreur réseau. Réessayez.</div>`;
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'VERIFIER';
    }
  };
}

// --- LE DERNIER MODAL (RAPPEL NOTIFICATIONS) ---
function showAccessInfoModal(){
  let infoOverlay = document.getElementById('accessInfoModal');
  if(!infoOverlay){
    infoOverlay = document.createElement('div');
    infoOverlay.id = 'accessInfoModal';
    infoOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10060;';

    const panel = document.createElement('div');
    panel.style.cssText = 'background:#fff; width:min(90vw, 400px); border-radius:12px; padding:25px; box-shadow:0 10px 30px rgba(0,0,0,0.3); text-align:center;';
    
    panel.innerHTML = `
      <p style="margin:0 0 20px 0; font-size:16px; color:#333; line-height:1.4;">
        Vous pouvez retrouver vos accès à tout moment dans la page <strong>Notifications</strong> de votre compte.
      </p>
      <button id="closeAccessInfoModalBtn" type="button" style="border:none; background:#0d6efd; color:#fff; padding:10px 25px; border-radius:8px; cursor:pointer; font-weight:600; width:100%;">D'ACCORD</button>
    `;

    infoOverlay.appendChild(panel);
    document.body.appendChild(infoOverlay);
  } else {
    infoOverlay.style.display = 'flex';
  }

  document.getElementById('closeAccessInfoModalBtn').onclick = function(){
    infoOverlay.style.display = 'none';
  };
}

// Helpers techniques
async function fetchLatestAccessFromBackend(userId){
  try {
    return await fetchLatestAvailableAccess(userId);
  } catch (e) {
    return null;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showTransientToast(message, duration) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:12px 20px; border-radius:8px; z-index:11000; font-size:14px; text-align:center;';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration || 5000);
}