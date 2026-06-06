/* ============================
   ERP Pro — auth.js
   Login · Signup · Forgot Password
   ============================ */

const MOCK_USERS = [
  { id:1, name:'Admin User',   email:'admin@erpro.com', password:'admin123', role:'Administrator',       avatar:'https://i.pravatar.cc/100?img=47' },
  { id:2, name:'Ravi Sharma',  email:'emp@erpro.com',   password:'emp123',   role:'Procurement Officer', avatar:'https://i.pravatar.cc/100?img=12' },
  { id:3, name:'Priya Patel',  email:'priya@erpro.com', password:'priya123', role:'Finance Manager',     avatar:'https://i.pravatar.cc/100?img=25' },
];

/* ── Guard: already logged in ── */
(function() {
  const t = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
  if (t) window.location.href = 'dashboard.html';
})();

/* ── Panel switching ── */
window.switchPanel = function(panel) {
  ['login','signup','forgot'].forEach(p => {
    document.getElementById('panel-'+p).classList.add('hidden');
  });
  document.getElementById('panel-'+panel).classList.remove('hidden');
  // Tabs
  document.getElementById('authTabs').style.display = panel === 'forgot' ? 'none' : 'flex';
  if (panel !== 'forgot') {
    document.getElementById('tabLogin').classList.toggle('active', panel === 'login');
    document.getElementById('tabSignup').classList.toggle('active', panel === 'signup');
  }
  // Clear alerts
  ['loginError','signupError','signupSuccess','forgotSuccess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
};

/* ── Toggle password visibility ── */
window.togglePw = function(inputId, btn) {
  const inp = document.getElementById(inputId);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁️';
};

/* ── Fill demo credentials ── */
window.fillDemo = function(email, pw) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = pw;
  document.getElementById('loginEmailErr').textContent = '';
  document.getElementById('loginPwErr').textContent = '';
  document.getElementById('loginError').style.display = 'none';
};

/* ── Get all users (mock + localStorage registered) ── */
function getAllUsers() {
  const stored = JSON.parse(localStorage.getItem('erp_registered_users') || '[]');
  return [...MOCK_USERS, ...stored];
}

/* ─────────────────────────────
   LOGIN FORM
   ───────────────────────────── */
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pw    = document.getElementById('loginPassword').value;
  let valid   = true;

  document.getElementById('loginEmailErr').textContent = '';
  document.getElementById('loginPwErr').textContent = '';
  document.getElementById('loginError').style.display = 'none';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('loginEmailErr').textContent = 'Enter a valid email.';
    valid = false;
  }
  if (!pw) {
    document.getElementById('loginPwErr').textContent = 'Password is required.';
    valid = false;
  }
  if (!valid) return;

  const users = getAllUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pw);

  if (!user) {
    document.getElementById('loginErrorMsg').textContent = 'Invalid email or password.';
    document.getElementById('loginError').style.display = 'flex';
    return;
  }

  const token   = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 28800000 }));
  const storage = document.getElementById('rememberMe').checked ? localStorage : sessionStorage;
  storage.setItem('erp_token', token);
  storage.setItem('erp_user',  JSON.stringify({ id:user.id, name:user.name, email:user.email, role:user.role, avatar:user.avatar||'https://i.pravatar.cc/100?img=47' }));

  window.location.href = 'dashboard.html';
});

/* ─────────────────────────────
   SIGNUP FORM
   ───────────────────────────── */
document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name    = document.getElementById('signupName').value.trim();
  const email   = document.getElementById('signupEmail').value.trim();
  const role    = document.getElementById('signupRole').value;
  const pw      = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;
  let valid     = true;

  ['signupNameErr','signupEmailErr','signupRoleErr','signupPwErr','signupConfirmErr'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  document.getElementById('signupError').style.display   = 'none';
  document.getElementById('signupSuccess').style.display = 'none';

  if (!name) { document.getElementById('signupNameErr').textContent = 'Name is required.'; valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('signupEmailErr').textContent = 'Valid email required.'; valid = false; }
  if (!role) { document.getElementById('signupRoleErr').textContent = 'Please select a role.'; valid = false; }
  if (!pw || pw.length < 6) { document.getElementById('signupPwErr').textContent = 'Min. 6 characters.'; valid = false; }
  if (pw !== confirm) { document.getElementById('signupConfirmErr').textContent = 'Passwords do not match.'; valid = false; }
  if (!valid) return;

  const all = getAllUsers();
  if (all.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    document.getElementById('signupErrorMsg').textContent = 'Email already registered.';
    document.getElementById('signupError').style.display = 'flex';
    return;
  }

  const stored = JSON.parse(localStorage.getItem('erp_registered_users') || '[]');
  stored.push({ id: Date.now(), name, email, password: pw, role, avatar: 'https://i.pravatar.cc/100?img=' + Math.floor(Math.random()*70+1) });
  localStorage.setItem('erp_registered_users', JSON.stringify(stored));

  document.getElementById('signupSuccess').style.display = 'flex';
  document.getElementById('signupForm').reset();
  setTimeout(() => switchPanel('login'), 2000);
});

/* ─────────────────────────────
   FORGOT PASSWORD FORM
   ───────────────────────────── */
document.getElementById('forgotForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();
  document.getElementById('forgotEmailErr').textContent = '';
  document.getElementById('forgotSuccess').style.display = 'none';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('forgotEmailErr').textContent = 'Enter a valid email.';
    return;
  }
  // Simulate sending email
  document.getElementById('forgotSuccess').style.display = 'flex';
  document.getElementById('forgotForm').reset();
  setTimeout(() => switchPanel('login'), 3000);
});
