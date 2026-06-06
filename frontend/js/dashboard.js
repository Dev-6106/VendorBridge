/**
 * dashboard.js — Dashboard page logic
 * Handles auth guard, user info rendering, logout, and interactivity.
 */

/* ── Auth guard: redirect if not logged in ── */
(function checkAuth() {
  const token = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
  if (!token) {
    window.location.href = 'index.html';
  }
})();

/* ── Load user info ── */
function getUser() {
  try {
    const raw = localStorage.getItem('erp_user') || sessionStorage.getItem('erp_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderUser() {
  const user = getUser();
  if (!user) return;

  // Topbar
  const topName = document.getElementById('topbarName');
  const topRole = document.getElementById('topbarRole');
  if (topName) topName.textContent = user.name;
  if (topRole) topRole.textContent = user.role;

  // Sidebar
  const sidebarName = document.getElementById('sidebarName');
  const sidebarRole = document.getElementById('sidebarRole');
  if (sidebarName) sidebarName.textContent = user.name;
  if (sidebarRole) sidebarRole.textContent = user.role;

  // Welcome message
  const welcome = document.getElementById('welcomeMsg');
  if (welcome) welcome.textContent = `Welcome back, ${user.name.split(' ')[0]}! 👋`;
}

renderUser();

/* ── Logout ── */
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('erp_token');
  localStorage.removeItem('erp_user');
  sessionStorage.removeItem('erp_token');
  sessionStorage.removeItem('erp_user');
  window.location.href = 'index.html';
});

/* ── Sidebar active nav ── */
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  });
});

/* ── Stat card counter animation ── */
function animateCounter(el, target) {
  const duration  = 1200;
  const start     = performance.now();
  const isFloat   = target % 1 !== 0;

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    const current  = Math.round(target * ease);
    el.textContent = isFloat
      ? (target * ease).toFixed(1) + '%'
      : current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = isFloat ? target + '%' : target.toLocaleString();
  }

  requestAnimationFrame(update);
}

/* Observe stat cards and animate on scroll into view */
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseFloat(el.dataset.target);
      animateCounter(el, target);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => statObserver.observe(el));

/* ── Live clock in topbar ── */
function updateClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}
updateClock();
setInterval(updateClock, 1000);

/* ── Add Vendor button demo ── */
document.getElementById('addVendorBtn')?.addEventListener('click', () => {
  alert('➕ Add Vendor form coming soon!');
});

document.getElementById('createRFQBtn')?.addEventListener('click', () => {
  alert('📋 Create RFQ form coming soon!');
});

document.getElementById('generatePOBtn')?.addEventListener('click', () => {
  alert('🛒 Generate Purchase Order form coming soon!');
});

document.getElementById('generateInvBtn')?.addEventListener('click', () => {
  alert('🧾 Generate Invoice form coming soon!');
});
