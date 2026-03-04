import React, { useState, useEffect } from 'react';
import { getUsers, updateUser } from '../utils/api';

export default function UserList({ user }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState('');
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editResult, setEditResult] = useState('');

  useEffect(() => {
    if (user) {
      getUsers()
        .then(r => setUsers(r.data))
        .catch(err => setError(err.response?.data?.error || 'Failed'));
    }
  }, [user]);

  const handleUpdate = async () => {
    try {
      const payload = { [editField]: editField === 'isAdmin' ? editValue === 'true' : editValue };
      const res = await updateUser(editId, payload);
      setEditResult(JSON.stringify(res.data, null, 2));
      getUsers().then(r => setUsers(r.data));
    } catch (err) {
      setEditResult(err.response?.data?.error || 'Failed');
    }
  };

  if (!user) return <div className="card"><p>Please login.</p></div>;

  return (
    <div>
      <div className="page-header"><h1>👥 All Users</h1></div>

      <div className="vuln-box">
        <strong>🎯 A01 + A02 Demo: Any user can list all users + see passwords!</strong>
        <p style={{fontSize:'0.82rem', color:'#666', marginTop:'4px'}}>
          <code>GET /api/users</code> requires only authentication — not admin role.
          The response includes <strong>plaintext passwords</strong> and sensitive PII (credit cards, SSNs from seed data).
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr><th>Username</th><th>Email</th><th>Password ⚠️</th><th>Role</th><th>ID</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <code style={{background:'#fde8e8', color:'#c0392b', padding:'2px 6px', borderRadius:'3px'}}>
                    {u.password}
                  </code>
                </td>
                <td>
                  <span className={`tag ${u.isAdmin ? 'tag-red' : 'tag-blue'}`}>
                    {u.isAdmin ? 'admin' : 'user'}
                  </span>
                </td>
                <td><code style={{fontSize:'0.72rem'}}>{u._id}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IDOR update any user */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>✏️ Update Any User Field (A01 IDOR + A03 Mass Assignment)</h3>
        <div className="vuln-box">
          No ownership check — any user can modify any other user. Set <code>isAdmin=true</code> on any account!
        </div>
        <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'8px'}}>
          <input value={editId} onChange={e => setEditId(e.target.value)}
            placeholder="User _id..."
            style={{flex:2, padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontFamily:'monospace'}} />
          <input value={editField} onChange={e => setEditField(e.target.value)}
            placeholder="Field (e.g. isAdmin)"
            style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}} />
          <input value={editValue} onChange={e => setEditValue(e.target.value)}
            placeholder="Value (e.g. true)"
            style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}} />
          <button className="btn btn-danger" onClick={handleUpdate}>Update</button>
        </div>
        {editResult && <pre style={{fontSize:'0.8rem', maxHeight:'150px', overflow:'auto'}}>{editResult}</pre>}
      </div>
    </div>
  );
}
