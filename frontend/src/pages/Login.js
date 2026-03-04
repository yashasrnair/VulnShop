import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, setToken, setUser } from '../utils/api';

export default function Login({ setUser: setAppUser }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [raw, setRaw]           = useState('');  // for raw JSON injection
  const navigate = useNavigate();

  // Normal login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      setAppUser(res.data.user);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  // ⚠️ DEMO: NoSQL Injection login bypass
  // Sends raw JSON — password field can be {"$gt":""} to bypass auth
  const handleInjection = async () => {
    try {
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        setError('Invalid JSON');
        return;
      }
      const res = await login(payload);
      setToken(res.data.token);
      setUser(res.data.user);
      setAppUser(res.data.user);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Injection failed');
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="card">
        <h2 style={{marginBottom:'1.5rem'}}>🔐 Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@vulnshop.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Login</button>
        </form>

        <p style={{marginTop:'1rem', color:'#777', fontSize:'0.9rem'}}>
          No account? <Link to="/register">Register here</Link>
        </p>
      </div>

      {/* ===== DEMO PANEL ===== */}
      <div className="vuln-box">
        <strong>🎯 A03 Demo: NoSQL Injection Login Bypass</strong>
        <p style={{margin:'8px 0 6px', color:'#666'}}>
          Send raw JSON payload. The backend does: <code>User.findOne(&#123; email, password &#125;)</code> — no sanitization.
        </p>
        <div className="form-group">
          <textarea rows={5} value={raw} onChange={e => setRaw(e.target.value)}
            placeholder={`Try:\n{\n  "email": "admin@vulnshop.com",\n  "password": {"$gt": ""}\n}`}
            style={{fontFamily:'monospace', fontSize:'0.85rem'}} />
        </div>
        <button className="btn btn-warning btn-sm" onClick={handleInjection}>
          🔫 Inject & Login
        </button>
        <div style={{marginTop:'8px', fontSize:'0.8rem', color:'#666'}}>
          Also try: <code>{"{"}"email": {"{"}"$regex":".*"{"}"}, "password": {"{"}"$gt":""{"}"}{"}"}}</code>
        </div>
      </div>

      <div className="vuln-box">
        <strong>🎯 A07 Demo: Username Enumeration</strong>
        <p style={{color:'#666', fontSize:'0.85rem', margin:'4px 0'}}>
          Try logging in with <code>nonexistent@example.com</code> — response says "Email not found".<br/>
          Then try <code>alice@example.com</code> with wrong password — response says "Wrong password".<br/>
          This lets attackers enumerate valid emails!
        </p>
      </div>
    </div>
  );
}
