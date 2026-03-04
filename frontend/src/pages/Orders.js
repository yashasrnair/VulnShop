import React, { useState, useEffect } from 'react';
import { getOrders, getOrder, updateOrderStatus } from '../utils/api';

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [idorId, setIdorId] = useState('');
  const [idorResult, setIdorResult] = useState(null);
  const [statusId, setStatusId] = useState('');
  const [newStatus, setNewStatus] = useState('refunded');

  useEffect(() => {
    if (user) getOrders().then(r => setOrders(r.data)).catch(() => {});
  }, [user]);

  const fetchByID = async () => {
    try {
      const res = await getOrder(idorId);
      setIdorResult(res.data);
    } catch (err) {
      setIdorResult({ error: err.response?.data?.error });
    }
  };

  const changeStatus = async () => {
    try {
      const res = await updateOrderStatus(statusId, newStatus);
      setIdorResult(res.data);
    } catch (err) {
      setIdorResult({ error: err.response?.data?.error });
    }
  };

  if (!user) return <div className="card"><p>Please login to view orders.</p></div>;

  return (
    <div>
      <div className="page-header"><h1>📦 All Orders</h1></div>

      {/* IDOR warning */}
      <div className="vuln-box">
        <strong>🎯 A01 Demo: IDOR — Broken Object Level Authorization</strong>
        <p style={{fontSize:'0.82rem', color:'#666', marginTop:'4px'}}>
          <code>GET /api/orders</code> returns ALL orders from ALL users — no filter by logged-in user.<br/>
          Any order ID below can be fetched or modified by any authenticated user.
        </p>
      </div>

      {/* All orders table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th><th>User ID</th><th>Total</th><th>Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id}>
                <td><code style={{fontSize:'0.75rem'}}>{o._id}</code></td>
                <td><code style={{fontSize:'0.75rem'}}>{o.userId}</code></td>
                <td style={{color: o.total < 1 ? '#e74c3c' : '#2ecc71', fontWeight:'bold'}}>
                  ${o.total}
                  {o.total < 1 && ' ⚠️ Price manipulated!'}
                </td>
                <td>
                  <span className={`tag ${o.status === 'refunded' ? 'tag-red' : o.status === 'pending' ? 'tag-orange' : 'tag-blue'}`}>
                    {o.status}
                  </span>
                </td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IDOR fetch by ID */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>🔍 Fetch Any Order by ID (IDOR)</h3>
        <p style={{fontSize:'0.85rem', color:'#666', marginBottom:'8px'}}>
          Paste any order ID — any authenticated user can fetch any order.
        </p>
        <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
          <input value={idorId} onChange={e => setIdorId(e.target.value)}
            placeholder="Paste any order _id..."
            style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontFamily:'monospace'}} />
          <button className="btn btn-warning" onClick={fetchByID}>Fetch Order</button>
        </div>
        {idorResult && <pre style={{fontSize:'0.8rem', maxHeight:'200px', overflow:'auto'}}>{JSON.stringify(idorResult, null, 2)}</pre>}
      </div>

      {/* Modify any order status */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>✏️ Change Any Order Status (A01)</h3>
        <div className="vuln-box" style={{marginBottom:'8px'}}>
          <strong>No ownership check!</strong> Any user can set any order to "refunded".
        </div>
        <div style={{display:'flex', gap:'8px'}}>
          <input value={statusId} onChange={e => setStatusId(e.target.value)}
            placeholder="Order ID..."
            style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontFamily:'monospace'}} />
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            style={{padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}>
            {['refunded','cancelled','delivered','pending','shipped'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-danger" onClick={changeStatus}>Update Status</button>
        </div>
      </div>
    </div>
  );
}
