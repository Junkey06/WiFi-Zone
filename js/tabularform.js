
        // Offer table rows -> populate and open Offer Details modal
        document.addEventListener('DOMContentLoaded', function(){
          function openOfferModal(){ try{document.getElementById('offerDetailsModal').style.display = 'flex';}catch(e){} }
          function closeOfferModal(){ try{document.getElementById('offerDetailsModal').style.display = 'none';}catch(e){} }

          function openPaymentModal(){ try{document.getElementById('paymentModal').style.display = 'flex';}catch(e){} }
          function closePaymentModal(){ try{document.getElementById('paymentModal').style.display = 'none';}catch(e){} }

          document.querySelectorAll('.offer-row').forEach(function(row){
            row.addEventListener('click', function(e){
              try{ if(e && e.preventDefault) e.preventDefault(); }catch(ex){}
              var t = row.dataset.title || '';
              var p = row.dataset.price || '';
              var dur = row.dataset.duration || '';
              var speed = row.dataset.speed || '';
              var data = row.dataset.data || '';
              var desc = row.dataset.description || '';
              var el;
              el = document.getElementById('od_title'); if(el) el.textContent = t;
              el = document.getElementById('od_price'); if(el) el.textContent = p;
              el = document.getElementById('od_duration'); if(el) el.textContent = dur;
              el = document.getElementById('od_speed'); if(el) el.textContent = speed ? (speed + ' Mbps') : '';
              el = document.getElementById('od_data'); if(el) el.textContent = data;
              el = document.getElementById('od_description'); if(el) el.textContent = desc;
              // attach idForfait and categorie onto the offer details modal so the payer button can pick them up
              try{
                var odModal = document.getElementById('offerDetailsModal');
                if(odModal){
                  if(row.dataset.idforfait) odModal.setAttribute('data-idforfait', row.dataset.idforfait);
                  if(row.dataset.categorie) odModal.setAttribute('data-categorie', row.dataset.categorie);
                }
              }catch(e){ }
              openOfferModal();
              // Keep viewport position; focus a control inside modal for accessibility.
              try{ var c = document.querySelector('.close-offer-details'); if(c && c.focus) c.focus(); }catch(e){}
            });
          });

          // Wire the offer "Payer" button to open payment modal and prefill form
          var payBtn = document.getElementById('od_pay_btn');
          if(payBtn){
            payBtn.addEventListener('click', function(){
              try{
                var title = (document.getElementById('od_title')||{}).textContent || '';
                var priceText = (document.getElementById('od_price')||{}).textContent || '';
                // extract numeric amount (strip non-digits)
                var amountNum = priceText.replace(/[^0-9\.]/g,'');
                if(amountNum === '') amountNum = priceText;
                var offerInput = document.getElementById('offer');
                var amountInput = document.getElementById('amount');
                // Keep the offer title in the offer field and the numeric value in the amount field
                if(offerInput) offerInput.value = title;
                if(amountInput) amountInput.value = amountNum;
                // pick up idForfait and categorie from the offer details modal and persist into payment form
                try{
                  var odModal = document.getElementById('offerDetailsModal');
                  var idForfait = odModal && odModal.getAttribute('data-idforfait') ? odModal.getAttribute('data-idforfait') : '';
                  var categorie = odModal && odModal.getAttribute('data-categorie') ? odModal.getAttribute('data-categorie') : ((document.body && document.body.getAttribute('data-categorie')) || 'particulier');
                  var paymentForm = document.getElementById('paymentForm');
                  if(paymentForm){
                    var idInput = paymentForm.querySelector('input[name="idForfait"]');
                    if(idInput) idInput.value = idForfait; else {
                      var inp = document.createElement('input'); inp.type='hidden'; inp.name='idForfait'; inp.value = idForfait; paymentForm.appendChild(inp);
                    }
                    try{ if(document.body) document.body.setAttribute('data-categorie', categorie); }catch(e){}
                  }
                }catch(e){}
                // Close the offer details modal before opening payment modal
                try{ closeOfferModal(); }catch(e){}
                openPaymentModal();
                // Keep viewport position; focus phone input in payment modal.
                try{ var ph = document.getElementById('phoneNumber'); if(ph && ph.focus) ph.focus(); }catch(e){}
              }catch(e){ console.warn(e); }
            });
          }

          var closeBtn = document.querySelector('.close-offer-details');
          if(closeBtn) closeBtn.addEventListener('click', closeOfferModal);
          document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeOfferModal(); });

          // Wire payment modal close button
          var closePaymentBtn = document.getElementById('closeModalBtn');
          if(closePaymentBtn) closePaymentBtn.addEventListener('click', closePaymentModal);
        });
