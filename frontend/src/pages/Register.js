import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login, setToken, setUser } from '../utils/api';

export default function Register({ setUser: setAppUser }) {
  const [form, setForm] = useState({ username:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await register(form);
      // auto login
      const res = await login({ email: form.email, password: form.password });
      setToken(res.data.token);
      setUser(res.data.user);
      setAppUser(res.data.user);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  // ⚠️ Demo: Register with isAdmin:true (mass assignment)
  const handlePrivEsc = async () => {
    try {
      const payload = {
        ...form,
        isAdmin: true,        // privilege escalation!
        role: 'admin',
        profile: { note: 'hacked via mass assignment' }
      };
      await register(payload);
      const res = await login({ email: form.email, password: form.password });
      setToken(res.data.token);
      const user = { ...res.data.user, isAdmin: true };
      setUser(user);
      setAppUser(user);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="card">
        <h2 style={{marginBottom:'1.5rem'}}>📝 Register</h2>
        {error   && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input name="username" value={form.username} onChange={handleChange} placeholder="johndoe" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
          </div>
          <div style={{display:'flex', gap:'8px'}}>
            <button type="submit" className="btn btn-primary" style={{flex:1}}>Register</button>
            <button type="button" className="btn btn-warning" style={{flex:1}} onClick={handlePrivEsc}>
              ⚡ Register as Admin
            </button>
          </div>
        </form>
        <p style={{marginTop:'1rem', color:'#777', fontSize:'0.9rem'}}>
          Have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      <div className="vuln-box">
        <strong>🎯 A03 Demo: Mass Assignment Privilege Escalation</strong>
        <p style={{color:'#666', fontSize:'0.85rem', marginTop:'6px'}}>
          Click "Register as Admin" — it sends <code>&#123;"isAdmin": true, "role": "admin"&#125;</code>
          along with registration data. Because the User model uses <code>strict: false</code> and
          the route does <code>new User(req.body)</code>, any field gets saved — including <code>isAdmin</code>!
        </p>
      </div>
    </div>
  );
}
