import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const res = await signup(signupName, signupEmail, signupRole, signupPassword);
    if (res.success) {
      setSuccess('Account created! You can now sign in.');
      setSignupName('');
      setSignupEmail('');
      setSignupRole('');
      setSignupPassword('');
      setActiveTab('login');
    } else {
      setError(res.message);
    }
  };

  const fillDemo = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div>
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <div className="login-wrapper">
        <div className="branding-panel">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">ERP Pro</span>
            </div>
            <h1 className="brand-headline">Procurement &amp; Vendor Management</h1>
            <p className="brand-sub">Streamline your supply chain, manage vendors, and drive procurement efficiency — all in one powerful platform.</p>
            <div className="feature-list">
              <div className="feature-item"><span className="feature-icon">🏢</span><span>Vendor Lifecycle Management</span></div>
              <div className="feature-item"><span className="feature-icon">📋</span><span>RFQ &amp; Quotation Tracking</span></div>
              <div className="feature-item"><span className="feature-icon">✅</span><span>Smart Approval Workflows</span></div>
              <div className="feature-item"><span className="feature-icon">📊</span><span>Real-time Analytics &amp; Reports</span></div>
            </div>
            <div className="brand-stats">
              <div className="stat"><div className="stat-num">248+</div><div className="stat-label">Vendors</div></div>
              <div className="stat"><div className="stat-num">1.2K</div><div className="stat-label">Orders</div></div>
              <div className="stat"><div className="stat-num">99.9%</div><div className="stat-label">Uptime</div></div>
            </div>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-card">
            <div className="auth-tabs">
              <button className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}>Sign In</button>
              <button className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}>Sign Up</button>
            </div>

            {activeTab === 'login' && (
              <div className="auth-panel">
                <div className="card-header">
                  <h2>Welcome back</h2>
                  <p>Sign in to your account to continue</p>
                </div>
                
                {error && (
                  <div className="alert alert-error">
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="alert alert-success">
                    <span>✅</span><span>{success}</span>
                  </div>
                )}

                <form className="login-form" onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">✉️</span>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="admin@erpro.com" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Enter password" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span className="checkmark"></span>Remember me
                    </label>
                    <a href="#" className="forgot-link" onClick={e => e.preventDefault()}>Forgot password?</a>
                  </div>
                  <button type="submit" className="btn-login">
                    <span className="btn-text">Sign In</span>
                  </button>
                </form>

                <div className="divider"><span>Demo Credentials</span></div>
                <div className="demo-credentials">
                  <div className="demo-card" onClick={() => fillDemo('admin@erpro.com','admin123')}>
                    <div className="demo-role">👑 Admin</div>
                    <div className="demo-email">admin@erpro.com</div>
                    <div className="demo-pw">admin123</div>
                  </div>
                  <div className="demo-card" onClick={() => fillDemo('emp@erpro.com','emp123')}>
                    <div className="demo-role">👤 Officer</div>
                    <div className="demo-email">emp@erpro.com</div>
                    <div className="demo-pw">emp123</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'signup' && (
              <div className="auth-panel">
                <div className="card-header">
                  <h2>Create account</h2>
                  <p>Join ERP Pro to manage procurement</p>
                </div>
                
                {error && (
                  <div className="alert alert-error">
                    <span>⚠️</span><span>{error}</span>
                  </div>
                )}

                <form className="login-form" onSubmit={handleSignupSubmit}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input 
                        type="text" 
                        value={signupName} 
                        onChange={e => setSignupName(e.target.value)} 
                        placeholder="Your full name" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">✉️</span>
                      <input 
                        type="email" 
                        value={signupEmail} 
                        onChange={e => setSignupEmail(e.target.value)} 
                        placeholder="you@company.com" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🏷️</span>
                      <select 
                        className="select-input" 
                        value={signupRole} 
                        onChange={e => setSignupRole(e.target.value)} 
                        required
                        style={{width: '100%', padding: '0.75rem', paddingLeft: '2.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem'}}
                      >
                        <option value="">Select your role</option>
                        <option value="Administrator">Administrator</option>
                        <option value="Procurement Officer">Procurement Officer</option>
                        <option value="Finance Manager">Finance Manager</option>
                        <option value="Vendor">Vendor</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input 
                        type="password" 
                        value={signupPassword} 
                        onChange={e => setSignupPassword(e.target.value)} 
                        placeholder="Min. 6 characters" 
                        required 
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-login">
                    <span className="btn-text">Create Account</span>
                  </button>
                </form>
              </div>
            )}

            <p className="card-footer-text">ERP Pro &copy; 2025 &mdash; Odoo × KSV Hackathon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
