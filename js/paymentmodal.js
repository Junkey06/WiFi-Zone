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
// Prefix datasets (Cameroon)
const MTN_PREFIXES = ['670','671','672','673','674','675','676','677','678','679','683','682'];
const ORANGE_PREFIXES = ['690','691','692','693','694','695','696','697','698','699','655','640','659'];

function getOperatorTypeFromNumber(num) {
  const value = (num || '').trim();
  if (value.length < 3) return null;
  const prefix = value.substring(0, 3);
  if (MTN_PREFIXES.includes(prefix)) return 'MTN';
  if (ORANGE_PREFIXES.includes(prefix)) return 'ORANGE';
  return null;
}

// Operator detection UI logic
const operatorLogo = document.getElementById('operatorLogo');
const phoneInput = document.getElementById('phoneNumber');
phoneInput.addEventListener('input', function() {
  const value = this.value.trim();
  let logo = '';
  let show = false;
  const operator = getOperatorTypeFromNumber(value);
  if (operator === 'MTN') {
    logo = '<img src="img/mtn-momo.png" alt="MTN MoMo" style="height:32px; width:32px;">';
    show = true;
  } else if (operator === 'ORANGE') {
    logo = '<img src="img/orange-money.png" alt="Orange Money" style="height:32px; width:32px;">';
    show = true;
  }
  operatorLogo.innerHTML = logo;
  operatorLogo.style.display = show ? 'inline-block' : 'none';
});

// Submit to backend API
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
  if (!Number.isFinite(montant) || montant <= 0) {
    alert('Montant invalide.');
    return;
  }
  if (!type) {
    alert('Type d\'offre manquant.');
    return;
  }

  const payload = { numero, montant, categorie, idForfait };

  // API URL
  const apiUrl = 'http://185.213.27.226:7071/api/wifi/payment';

  submitBtn.disabled = true;
  const oldText = submitBtn.textContent;
  submitBtn.textContent = 'Traitement...';

  try {
    console.log('[payment] payload', payload);
    const res = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = (isJson && (data && (data.message || data.error))) ? (data.message || data.error) : (typeof data === 'string' ? data : 'Erreur inconnue');
      console.error('[payment] response error', { status: res.status, data });
      // show transient toast for failure
      showTransientToast('Transaction échouée: ' + msg, 8000);
      return;
    }

    // show transient success toast and replace/hide payment modal
    try {
      var modal = document.getElementById('paymentModal');
      if (modal) {
        modal.style.display = 'none';
      }
    } catch (err) {}
    try { document.body.style.overflow = ''; } catch (err) {}
    showTransientToast('Transaction initiée avec succès. Veuillez vérifier votre téléphone pour finaliser le paiement.', 10000);
  } catch (err) {
    console.error('[payment] network/CORS error', err);
    showTransientToast('Erreur réseau/CORS. Détail: ' + (err && err.message ? err.message : err), 8000);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = oldText;
  }
};

// Transient toast/modal helper (creates a small popup that fades after duration)
function showTransientToast(message, duration) {
  duration = Number(duration) || 10000;
  // remove existing
  var existing = document.getElementById('transientToast');
  if (existing) {
    try{ existing.parentNode.removeChild(existing); }catch(e){}
  }
  var el = document.createElement('div');
  el.id = 'transientToast';
  el.className = 'transient-toast';
  el.innerHTML = '<div class="transient-body">' + message + '</div>';
  el.addEventListener('click', function(){ fadeOutAndRemove(el); });
  document.body.appendChild(el);
  // force reflow then show
  window.getComputedStyle(el).opacity;
  el.classList.add('visible');
  // hide after duration
  var hideTimer = setTimeout(function(){ fadeOutAndRemove(el); }, duration);
  function fadeOutAndRemove(node){
    if(!node) return;
    node.classList.remove('visible');
    setTimeout(function(){ try{ if(node.parentNode) node.parentNode.removeChild(node); }catch(e){} }, 600);
  }
}

