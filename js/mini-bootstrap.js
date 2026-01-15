// Minimal JS to support navbar collapse & simple interactions
(function(){
  document.addEventListener('click',function(e){
    var toggler=e.target.closest('[data-bs-toggle="collapse"]');
    if(toggler){
      var targetSel=toggler.getAttribute('data-bs-target');
      if(!targetSel) return;
      var target=document.querySelector(targetSel);
      if(!target) return;
      target.classList.toggle('show');
      e.preventDefault();
    }
  });

  // Basic dropdown click toggle for mobile
  document.querySelectorAll('.nav-item.dropdown > a, .dropdown-toggle').forEach(function(el){
    el.addEventListener('click',function(ev){
      var parent=el.closest('.nav-item');
      var menu=parent?parent.querySelector('.dropdown-menu'):null;
      if(menu){
        if(window.innerWidth<992){
          ev.preventDefault();
          menu.style.display= menu.style.display==='block' ? 'none':'block';
        }
      }
    });
  });


  // Back to top button
  var backToTop=document.querySelector('.back-to-top');
  if(backToTop){
    window.addEventListener('scroll',function(){
      if(window.scrollY>200){backToTop.style.display='block';}
      else{backToTop.style.display='none';}
    });
    backToTop.addEventListener('click',function(ev){
      ev.preventDefault();window.scrollTo({top:0,behavior:'smooth'});
    });
  }
})();