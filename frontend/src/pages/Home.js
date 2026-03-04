import React from 'react';
import { Link } from 'react-router-dom';

const VULNS = [
  {
    id: 'A01',
    name: 'Broken Access Control',
    color: '#e74c3c',
    demos: [
      'View any user\'s orders: GET /api/orders (no ownership filter)',
      'IDOR on orders: GET /api/orders/<any_id>',
      'Privilege escalation: PUT /api/users/<id> with {"isAdmin":true}',
      'Admin panel via forged JWT (A01 + A02)',
    ]
  },
  {
    id: 'A02',
    name: 'Cryptographic Failures',
    color: '#e67e22',
    demos: [
      'Passwords stored as plaintext in MongoDB',
      'Weak JWT secret: "secret123"',
      'JWT with no expiry',
      'Token stored in localStorage (XSS-accessible)',
    ]
  },
  {
    id: 'A03',
    name: 'Injection',
    color: '#f39c12',
    demos: [
      'NoSQL Injection login: POST /api/auth/login with {"password":{"$gt":""}}',
      'Stored XSS in product comments: <script>alert(1)</script>',
      'OS Command Injection: POST /api/admin/ping with {"host":"127.0.0.1; whoami"}',
      'XSS via product description (rendered as innerHTML)',
    ]
  },
  {
    id: 'A04',
    name: 'Insecure Design',
    color: '#27ae60',
    demos: [
      'Price manipulation: POST /api/orders with {"total":0.01}',
      'Unrestricted file upload: upload .html/.js files',
      'No rate limiting on login (brute force)',
    ]
  },
  {
    id: 'A05',
    name: 'Security Misconfiguration',
    color: '#16a085',
    demos: [
      'CORS allows all origins with credentials',
      'Debug endpoint: GET /api/debug (dumps all env vars)',
      'Stack traces in error responses',
      'Directory listing on /uploads',
    ]
  },
  {
    id: 'A06',
    name: 'Vulnerable Components',
    color: '#2980b9',
    demos: [
      'node-serialize package (known RCE CVE)',
      'No package integrity checks',
    ]
  },
  {
    id: 'A07',
    name: 'Auth & Identity Failures',
    color: '#8e44ad',
    demos: [
      'Username/email enumeration on login & forgot-password',
      'No brute force protection',
      'Predictable password reset tokens (timestamp)',
      'Reset token not invalidated after use',
    ]
  },
  {
    id: 'A08',
    name: 'Software & Data Integrity',
    color: '#c0392b',
    demos: [
      'Insecure deserialization: POST /api/admin/deserialize',
      'RCE payload: {"rce":"_$$ND_FUNC$$_function(){require(\'child_process\').exec(\'calc\')}()"}',
    ]
  },
  {
    id: 'A09',
    name: 'Logging & Monitoring Failures',
    color: '#7f8c8d',
    demos: [
      'No audit trail for admin actions',
      'No alerts on failed login attempts',
      'No logging of sensitive data access',
    ]
  },
  {
    id: 'A10',
    name: 'SSRF',
    color: '#2c3e50',
    demos: [
      'POST /api/comments/fetch-preview with {"url":"http://169.254.169.254/latest/meta-data/"}',
      'Access internal services: {"url":"http://localhost:27017"}',
    ]
  },
];

export default function Home() {
  return (
    <div>
      <div className="hero">
        <h1>⚠️ VulnShop — OWASP Top 10 Demo App</h1>
        <p>A deliberately vulnerable e-commerce app for security training. <strong>DO NOT deploy to production.</strong></p>
        <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/products"><button className="btn btn-primary">Browse Products</button></Link>
          <Link to="/login"><button className="btn btn-success">Login / Register</button></Link>
          <Link to="/admin"><button className="btn btn-warning">Admin Panel</button></Link>
        </div>
      </div>

      <div className="card">
        <h2 style={{marginBottom:'0.5rem'}}>📋 Quick Start Credentials</h2>
        <table>
          <thead><tr><th>Role</th><th>Email</th><th>Password</th></tr></thead>
          <tbody>
            <tr><td>🔐 Admin</td><td>admin@vulnshop.com</td><td><code>admin123</code></td></tr>
            <tr><td>👤 User</td><td>alice@example.com</td><td><code>password</code></td></tr>
            <tr><td>👤 User</td><td>bob@example.com</td><td><code>123456</code></td></tr>
          </tbody>
        </table>
      </div>

      <h2 style={{margin:'1.5rem 0 1rem'}}>🎯 OWASP Top 10 (2021) Vulnerabilities</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'1rem' }}>
        {VULNS.map(v => (
          <div key={v.id} className="card" style={{ borderLeft: `4px solid ${v.color}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
              <span className="tag" style={{ background: v.color, color:'white', borderRadius:'4px', padding:'3px 8px' }}>{v.id}</span>
              <strong>{v.name}</strong>
            </div>
            <ul style={{ paddingLeft:'1.2rem', fontSize:'0.82rem', color:'#555' }}>
              {v.demos.map((d, i) => <li key={i} style={{marginBottom:'3px'}}>{d}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
