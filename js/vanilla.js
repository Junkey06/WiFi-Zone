/* ============================================
   WIFIZONE — Vanilla JavaScript (No jQuery/Bootstrap)
   ============================================ */

(function () {
  'use strict';

  // Helpers
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // --- Mobile Nav Toggle ---
  const navToggle = qs('#navToggle');
  const navMenu = qs('#navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Mobile dropdown toggle (click)
  qsa('.nav-dropdown').forEach((dd) => {
    const toggle = qs('.dropdown-toggle', dd);
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        if (window.innerWidth < 992) {
          e.preventDefault();
          dd.classList.toggle('open');
        }
      });
    }
  });

  // --- Carousel ---
  const carouselInner = qs('.carousel-inner');
  const slides = qsa('.carousel-slide');
  const indicatorsContainer = qs('#carouselIndicators');
  const prevBtn = qs('#carouselPrev');
  const nextBtn = qs('#carouselNext');
  let currentSlide = 0;
  let autoplayInterval;

  function updateCarousel() {
    if (!carouselInner) return;
    carouselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
    qsa('span', indicatorsContainer).forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function goToSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    updateCarousel();
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  if (slides.length && indicatorsContainer) {
    // Create indicators
    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        stopAutoplay();
        goToSlide(i);
        startAutoplay();
      });
      indicatorsContainer.appendChild(dot);
    });

    if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoplay(); prevSlide(); startAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoplay(); nextSlide(); startAutoplay(); });

    startAutoplay();
  }

  // --- Testimonial Carousel ---
  const testimonialTrack = qs('.testimonial-track');
  const testimonialItems = qsa('.testimonial-item');
  const testimonialDotsContainer = qs('#testimonialDots');
  let testimonialIndex = 0;
  let itemsPerView = 3;

  function getItemsPerView() {
    if (window.innerWidth < 576) return 1;
    if (window.innerWidth < 992) return 2;
    return 3;
  }

  function updateTestimonialCarousel() {
    if (!testimonialTrack) return;
    itemsPerView = getItemsPerView();
    const itemWidth = 100 / itemsPerView;
    testimonialTrack.style.transform = `translateX(-${testimonialIndex * itemWidth}%)`;
    qsa('span', testimonialDotsContainer).forEach((dot, i) => {
      dot.classList.toggle('active', i === testimonialIndex);
    });
  }

  function createTestimonialDots() {
    if (!testimonialDotsContainer) return;
    testimonialDotsContainer.innerHTML = '';
    itemsPerView = getItemsPerView();
    const totalDots = Math.ceil(testimonialItems.length / itemsPerView);
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('span');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        testimonialIndex = i;
        updateTestimonialCarousel();
      });
      testimonialDotsContainer.appendChild(dot);
    }
  }

  if (testimonialItems.length) {
    createTestimonialDots();
    updateTestimonialCarousel();
    window.addEventListener('resize', () => {
      const newPerView = getItemsPerView();
      if (newPerView !== itemsPerView) {
        testimonialIndex = 0;
        createTestimonialDots();
        updateTestimonialCarousel();
      }
    });
  }

  // --- FAQ Accordion ---
  const accordionHeaders = qsa('.accordion-header');
  accordionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const wasOpen = item.classList.contains('open');

      // Close all
      qsa('.accordion-item').forEach((ai) => ai.classList.remove('open'));

      // Toggle current
      if (!wasOpen) item.classList.add('open');
    });
  });

  // --- Back to Top ---
  const backToTop = qs('#backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 400);
    });
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Scroll Fade-In Animation (simple IntersectionObserver) ---
  const fadeEls = qsa('.fade-in');
  if ('IntersectionObserver' in window && fadeEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    fadeEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback: show all
    fadeEls.forEach((el) => el.classList.add('visible'));
  }

  // --- Contact Form (simple demo) ---
  const contactForm = qs('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Merci pour votre message ! Nous vous répondrons bientôt.');
      contactForm.reset();
    });
  }
})();
