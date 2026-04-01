// Modern collapsible sidebar with mobile support
  (function(){
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const body = document.body;

    function isMobile() { return window.innerWidth <= 900; }

    // Restore saved state on desktop
    if (!isMobile() && localStorage.getItem('sidebarCollapsed') === '1') {
      body.classList.add('sidebar-collapsed');
    }

    // Toggle sidebar (desktop: collapse, mobile: slide open)
    function toggleSidebar(e) {
      if (e) e.stopPropagation();
      if (isMobile()) {
        body.classList.toggle('sidebar-open');
      } else {
        const collapsed = body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
      }
    }

    toggle.addEventListener('click', toggleSidebar);
    mobileToggle.addEventListener('click', toggleSidebar);

    // Close mobile sidebar on overlay click
    overlay.addEventListener('click', function() {
      body.classList.remove('sidebar-open');
    });

    // Close mobile sidebar when clicking a nav link
    sidebar.querySelectorAll('.sidebar-nav a').forEach(function(link) {
      link.addEventListener('click', function() {
        if (isMobile()) body.classList.remove('sidebar-open');
      });
    });

    // Handle resize: normalize classes
    window.addEventListener('resize', function() {
      if (isMobile()) {
        body.classList.remove('sidebar-collapsed');
      } else {
        body.classList.remove('sidebar-open');
      }
    });
  })();

  // Notifications Modal

const modal = document.getElementById('notifModal');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalMessage = document.getElementById('modalMessage');
const closeBtn = document.querySelector('.notif-close');

document.querySelectorAll('.notif-item').forEach(item => {
  item.addEventListener('click', () => {
    // Fill modal
    modalTitle.textContent = item.dataset.title;
    modalDate.textContent = item.dataset.date;
    modalMessage.textContent = item.dataset.message;

    // Show modal
    modal.classList.add('active');

    // Mark as read
    if (item.classList.contains('unread')) {
      item.classList.add('marking-read');

      setTimeout(() => {
        item.classList.remove('unread', 'marking-read');
        item.classList.add('read');
      }, 400);
    }
  });
});

// Close modal
closeBtn.addEventListener('click', () => {
  modal.classList.remove('active');
});

modal.addEventListener('click', e => {
  if (e.target === modal) modal.classList.remove('active');
});

// Message preview truncation

function createPreview(text, limit = 50) {
  if (text.length <= limit) return text;
  return text.substring(0, limit).trim() + "…";
}

document.querySelectorAll(".notif-item").forEach(item => {
  const fullMessage = item.dataset.message;
  const previewBox = item.querySelector(".notif-message");

  previewBox.textContent = createPreview(fullMessage);
});