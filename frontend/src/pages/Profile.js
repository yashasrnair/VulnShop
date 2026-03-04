import React, { useState, useEffect } from 'react';
import { getProfile, updateUser, getToken } from '../utils/api';

export default function Profile({ user, setUser }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    if (user) {
      getProfile().then(r => {
        setProfile(r.data);
        setForm(r.data);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        // Decode JWT without verification (just base64)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo({ token, payload });
      } catch {}
    }
  }, []);

  const handleSave = async () => {
    try {
      const res = await updateUser(profile._id, form);
      setSaved('Profile updated!');
      setProfile(res.data);
    } catch (err) {
      setSaved(err.response?.data?.error || 'Failed');
    }
  };

  const escalatePrivileges = async () => {
    try {
      await updateUser(profile._id, { isAdmin: true, role: 'admin' });
      setSaved('⚡ Privileges escalated! Refresh page.');
    } catch (err) {
      setSaved(err.response?.data?.error || 'Failed');
    }
  };

  if (!user) return <div className="card"><p>Please login.</p></div>;
  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header"><h1>👤 My Profile</h1></div>

      {/* JWT Info */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>🔑 Your JWT Token (A02)</h3>
        <div className="vuln-box">
          <strong>Token stored in localStorage</strong> — accessible to any JavaScript on the page (XSS risk).<br/>
          <strong>Weak secret:</strong> <code>secret123</code> — crackable with hashcat/jwt-cracker.
        </div>
        {tokenInfo && (
          <div>
            <p style={{fontSize:'0.82rem', marginBottom:'4px', color:'#555'}}>Decoded payload:</p>
            <pre style={{fontSize:'0.8rem'}}>{JSON.stringify(tokenInfo.payload, null, 2)}</pre>
            <details style={{marginTop:'8px'}}>
              <summary style={{cursor:'pointer', fontSize:'0.85rem', color:'#3498db'}}>Show raw token</summary>
              <pre style={{fontSize:'0.72rem', wordBreak:'break-all', marginTop:'6px'}}>{tokenInfo.token}</pre>
            </details>
          </div>
        )}
      </div>

      {/* Profile data — shows plaintext password! */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>📋 Profile Data</h3>
        <div className="vuln-box">
          <strong>🎯 A02: Password returned in API response!</strong>
          <p style={{fontSize:'0.82rem', marginTop:'4px', color:'#666'}}>
            <code>GET /api/auth/profile</code> returns the full user object including the plaintext password.
          </p>
        </div>
        <pre style={{fontSize:'0.82rem', maxHeight:'200px', overflow:'auto'}}>
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>

      {/* Edit profile */}
      <div className="card">
        <h3 style={{marginBottom:'1rem'}}>✏️ Edit Profile</h3>
        {saved && <div className="alert alert-success">{saved}</div>}

        <div className="form-group">
          <label>Username</label>
          <input value={form.username || ''} onChange={e => setForm({...form, username: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div className="form-group">
          <label>New Password (stored as plaintext!)</label>
          <input type="text" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} />
        </div>

        <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          <button className="btn btn-warning" onClick={escalatePrivileges}>
            ⚡ Escalate to Admin (A03 Mass Assignment)
          </button>
        </div>

        <div className="vuln-box" style={{marginTop:'1rem'}}>
          <strong>🎯 A01 + A03: Privilege Escalation via Mass Assignment</strong>
          <p style={{fontSize:'0.82rem', color:'#666', marginTop:'4px'}}>
            <code>PUT /api/users/:id</code> accepts any fields — including <code>isAdmin: true</code>.
            No ownership check either, so you can modify other users' profiles too.
          </p>
        </div>
      </div>
    </div>
  );
}
