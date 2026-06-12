import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, Sparkles, Eye, EyeOff, ShieldCheck, Mail, UserCircle } from 'lucide-react';
import './Auth.css';

const Auth = ({ mode, setMode, onAuth, loading, error }) => {
  const [formData, setFormData] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (mode === 'register') {
      if (!formData.name.trim()) {
        setValidationError('Full name is required');
        return;
      }
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        setValidationError('Please enter a valid email address');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setValidationError('Password must be at least 6 characters');
        return;
      }
    }

    const payload = mode === 'register'
      ? { name: formData.name, email: formData.email, username: formData.username, password: formData.password }
      : { username: formData.username, password: formData.password };

    onAuth(payload, mode);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setValidationError('');
  };

  return (
    <div className="auth-container">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div style={{display:'flex', justifyContent:'center', marginBottom:'1rem'}}>
             <div style={{padding:'0.75rem', background:'rgba(99,102,241,0.1)', borderRadius:'1rem', border:'1px solid rgba(99,102,241,0.2)'}}>
                <Sparkles style={{color:'#818cf8'}} size={32} />
             </div>
          </div>
          <h1 className="auth-title">
            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? 'Enter your details to access your dashboard' 
              : 'Join the next generation of project management'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="input-group animate-in">
                <label className="input-label">Full Name</label>
                <div className="input-wrapper">
                  <UserCircle className="input-icon" size={18} />
                  <input 
                    type="text"
                    className="auth-input"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="input-group animate-in">
                <label className="input-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email"
                    className="auth-input"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label">Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input 
                type="text"
                className="auth-input"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="input-group animate-in">
              <label className="input-label">Confirm Password</label>
              <div className="input-wrapper">
                <ShieldCheck className="input-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {(error || validationError) && (
            <div className="error-message">
              {validationError || error}
            </div>
          )}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? (
              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}}>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing...</span>
              </div>
            ) : (
              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}}>
                <span>{mode === 'login' ? 'Login to Dashboard' : 'Create My Account'}</span>
                <ArrowRight size={18} />
              </div>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login' ? "New here?" : "Already have an account?"}
            <span className="auth-link" onClick={toggleMode}>
              {mode === 'login' ? 'Create an account' : 'Sign in instead'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
