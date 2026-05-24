import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const { login, register, API } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowReg, setAllowReg] = useState(true);

  useEffect(() => {
    axios.get(`${API}/settings/public`)
      .then(r => setAllowReg(r.data.allow_registration !== 'false'))
      .catch(() => {});
  }, [API]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.username, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-glow" />
      </div>
      <div className="login-box fade-in">
        <div className="login-logo">
          <span className="logo-mark">♪</span>
          <h1>SOUNDRR</h1>
        </div>
        <p className="login-sub">Your music request hub</p>

        <div className="login-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
          {allowReg && <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Register</button>}
        </div>

        <form onSubmit={submit} className="login-form">
          <input className="input" placeholder="Username or Email" value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          {mode === 'register' && (
            <input className="input" type="email" placeholder="Email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          )}
          <input className="input" type="password" placeholder="Password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          {error && <div className="login-error">{error}</div>}
          <button className="btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
