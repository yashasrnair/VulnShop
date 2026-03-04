import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProduct, getComments, createComment, fetchPreview, createOrder } from '../utils/api';

export default function ProductDetail({ user }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [ssrfUrl, setSsrfUrl] = useState('');
  const [ssrfResult, setSsrfResult] = useState(null);
  const [orderMsg, setOrderMsg] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  useEffect(() => {
    getProduct(id).then(r => setProduct(r.data));
    getComments(id).then(r => setComments(r.data));
  }, [id]);

  const submitComment = async () => {
    if (!commentText) return;
    try {
      const res = await createComment({ productId: id, content: commentText });
      setComments([...comments, res.data]);
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const doSSRF = async () => {
    try {
      const res = await fetchPreview(ssrfUrl);
      setSsrfResult(res.data);
    } catch (err) {
      setSsrfResult({ error: err.response?.data?.error });
    }
  };

  const placeOrder = async (price) => {
    try {
      await createOrder({
        products: [{ productId: id, quantity: 1, price }],
        total: price,   // VULN: price from client
        address: { street: '123 Demo St', city: 'Hackerville' }
      });
      setOrderMsg(`Order placed for $${price}!`);
    } catch (err) {
      setOrderMsg(err.response?.data?.error || 'Failed');
    }
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <div className="card">
        <div style={{display:'flex', gap:'2rem', flexWrap:'wrap'}}>
          <img src={product.imageUrl || `https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            style={{width:280, height:200, objectFit:'cover', borderRadius:'8px'}}
            onError={e => e.target.src='https://via.placeholder.com/280x200?text=No+Image'} />
          <div style={{flex:1}}>
            <h1>{product.name}</h1>
            <div className="product-price" style={{fontSize:'1.6rem', margin:'8px 0'}}>
              ${product.price}
            </div>
            {/* ⚠️ VULN A03: dangerouslySetInnerHTML — Stored XSS */}
            <div dangerouslySetInnerHTML={{ __html: product.description }}
              style={{color:'#555', marginBottom:'12px'}} />
            <div style={{color:'#888', fontSize:'0.9rem', marginBottom:'16px'}}>
              Category: {product.category} · Stock: {product.stock}
            </div>

            {user && (
              <div>
                <div style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'8px'}}>
                  <button className="btn btn-success" onClick={() => placeOrder(product.price)}>
                    🛒 Buy at ${product.price}
                  </button>
                </div>
                {/* Price manipulation demo */}
                <div className="vuln-box">
                  <strong>🎯 A04 Demo: Price Manipulation</strong>
                  <p style={{fontSize:'0.82rem', color:'#666', margin:'4px 0'}}>
                    The order total is sent from the client — server trusts it blindly!
                  </p>
                  <div style={{display:'flex', gap:'8px', marginTop:'6px'}}>
                    <input value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                      placeholder="Enter any price (e.g. 0.01)"
                      style={{padding:'6px', border:'1px solid #ddd', borderRadius:'4px', width:200}} />
                    <button className="btn btn-warning btn-sm"
                      onClick={() => placeOrder(parseFloat(customPrice) || 0)}>
                      Buy at Custom Price
                    </button>
                  </div>
                </div>
                {orderMsg && <div className="alert alert-success" style={{marginTop:'8px'}}>{orderMsg}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments — Stored XSS */}
      <div className="card">
        <h3 style={{marginBottom:'1rem'}}>💬 Reviews & Comments</h3>
        <div className="vuln-box">
          <strong>🎯 A03 Demo: Stored XSS in Comments</strong>
          <p style={{fontSize:'0.82rem', color:'#666', margin:'4px 0'}}>
            Comments are stored raw and rendered with <code>dangerouslySetInnerHTML</code>. Try:
          </p>
          <code style={{fontSize:'0.8rem'}}>&lt;img src=x onerror="alert(document.cookie)"&gt;</code><br/>
          <code style={{fontSize:'0.8rem'}}>&lt;svg onload="fetch('http://localhost:5000/api/debug').then(r=&gt;r.json()).then(d=&gt;document.title=d.nodeVersion)"&gt;&lt;/svg&gt;</code>
        </div>

        {comments.map((c, i) => (
          <div className="comment" key={i}>
            <div className="comment-user">👤 {c.username}</div>
            {/* ⚠️ VULN: Stored XSS */}
            <div dangerouslySetInnerHTML={{ __html: c.content }} />
          </div>
        ))}

        {user ? (
          <div style={{marginTop:'1rem'}}>
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              rows={3} placeholder="Leave a comment (HTML allowed!)"
              style={{width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}} />
            <button className="btn btn-primary btn-sm" style={{marginTop:'6px'}} onClick={submitComment}>
              Post Comment
            </button>
          </div>
        ) : (
          <p style={{color:'#888', marginTop:'8px', fontSize:'0.9rem'}}>Login to comment</p>
        )}
      </div>

      {/* SSRF Demo */}
      <div className="card">
        <h3 style={{marginBottom:'8px'}}>🌐 Link Preview (SSRF Demo - A10)</h3>
        <div className="vuln-box">
          <strong>🎯 A10 Demo: Server Side Request Forgery</strong>
          <p style={{fontSize:'0.82rem', color:'#666', margin:'4px 0'}}>
            The server fetches any URL you provide — including internal services!
          </p>
          <div style={{fontSize:'0.8rem', color:'#555'}}>
            Try: <code>http://localhost:5000/api/debug</code> (internal API)<br/>
            Try: <code>http://169.254.169.254/latest/meta-data/</code> (AWS metadata)<br/>
            Try: <code>http://localhost:27017</code> (MongoDB)
          </div>
        </div>
        <div style={{display:'flex', gap:'8px'}}>
          <input value={ssrfUrl} onChange={e => setSsrfUrl(e.target.value)}
            placeholder="http://localhost:5000/api/debug"
            style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontFamily:'monospace'}} />
          <button className="btn btn-warning" onClick={doSSRF}>Fetch</button>
        </div>
        {ssrfResult && (
          <pre style={{marginTop:'8px', maxHeight:'250px', overflow:'auto', fontSize:'0.8rem'}}>
            {JSON.stringify(ssrfResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
