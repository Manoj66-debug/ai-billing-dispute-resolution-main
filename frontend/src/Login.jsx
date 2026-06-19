import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

const API_BASE = '/api';

function Login({ onAuthSuccess, theme, showToast }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple client-side validation
  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return false;
    }
    
    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (authMode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('akinfras_user', JSON.stringify(data.user));
        showToast('success', `${authMode === 'login' ? 'Signed in' : 'Registered'} successfully!`);
        onAuthSuccess(data.user);
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Cannot connect to authentication server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-wrapper" data-theme={theme}>
      <div className="auth-glow-blob blob-1"></div>
      <div className="auth-glow-blob blob-2"></div>
      <div className="auth-glow-blob blob-3"></div>
      <div className="auth-mesh-grid"></div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">AK</div>
          <h2 className="auth-title">AVINASH KANAPARTHI INFRA</h2>
          <p className="auth-subtitle">
            {authMode === 'login' 
              ? 'Sign in to access the Dispute Resolution Portal' 
              : 'Create an account to join the Finance & Arbitration Team'}
          </p>
        </div>

        {error && (
          <div className="alert-banner" style={{ marginBottom: '1.25rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon-left" size={18} />
              <input 
                type="email" 
                placeholder="e.g. finance@akinfras.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input-field"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon-left" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input-field"
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {authMode === 'register' && (
              <div className="password-strength-indicator">
                <span className={`strength-bar ${password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : ''}`}></span>
                <span className="strength-text">
                  {password.length === 0 ? '' : password.length >= 8 ? 'Strong password' : 'Medium strength'}
                </span>
              </div>
            )}
          </div>

          {authMode === 'register' && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon-left" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="auth-input-field"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="pulse-text spin-icon" size={18} /> Validating...
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> 
                {authMode === 'login' ? 'Sign In Securely' : 'Register & Join Team'}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {authMode === 'login' ? (
            <p>
              New to the portal?{' '}
              <button 
                type="button" 
                className="auth-link"
                onClick={toggleAuthMode}
              >
                Join / Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                className="auth-link"
                onClick={toggleAuthMode}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
