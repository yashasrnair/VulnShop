import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, createProduct, uploadImage, readFile } from '../utils/api';

export default function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name:'', description:'', price:'', category:'', stock:'' });
  const [uploadResult, setUploadResult] = useState(null);
  const [fileRead, setFileRead] = useState('');
  const [fileReadResult, setFileReadResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async (s) => {
    try {
      const res = await getProducts(s || search);
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts(search);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await createProduct({ ...newProduct, price: parseFloat(newProduct.price) });
      setShowAdd(false);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await uploadImage(form);
      setUploadResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    }
  };

  const handleReadFile = async () => {
    try {
      const res = await readFile(fileRead);
      setFileReadResult(res.data);
    } catch (err) {
      setFileReadResult(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🛍️ Products</h1>
        {user && <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Add Product</button>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search */}
      <div className="card" style={{padding:'1rem', marginBottom:'1rem'}}>
        <form onSubmit={handleSearch} style={{display:'flex', gap:'8px'}}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder='Search products... (try: {"$gt":""} for NoSQL injection)'
            style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        <div style={{fontSize:'0.8rem', color:'#888', marginTop:'6px'}}>
          💉 Injection test: search for <code>{"{"}"$gt":""{"}"}</code> to dump all products regardless of name
        </div>
      </div>

      {/* Add Product Form */}
      {showAdd && (
        <div className="card">
          <h3 style={{marginBottom:'1rem'}}>Add Product</h3>
          <div className="vuln-box">
            <strong>🎯 A03 Demo: Stored XSS via description</strong>
            <p style={{fontSize:'0.82rem', color:'#666', marginTop:'4px'}}>
              The description is rendered with <code>dangerouslySetInnerHTML</code>. Try:<br/>
              <code>&lt;img src=x onerror="alert('XSS')"&gt;</code><br/>
              <code>&lt;script&gt;document.title='hacked'&lt;/script&gt;</code>
            </p>
          </div>
          <form onSubmit={handleAddProduct}>
            {['name','description','price','category','stock'].map(field => (
              <div className="form-group" key={field}>
                <label style={{textTransform:'capitalize'}}>{field}</label>
                <input value={newProduct[field]}
                  onChange={e => setNewProduct({...newProduct, [field]: e.target.value})}
                  placeholder={field === 'description' ? '<img src=x onerror="alert(1)">' : ''} />
              </div>
            ))}
            <div style={{display:'flex', gap:'8px'}}>
              <button type="submit" className="btn btn-success">Save</button>
              <button type="button" className="btn btn-danger" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Product Grid */}
      <div className="product-grid">
        {products.map(p => (
          <Link to={`/products/${p._id}`} key={p._id} style={{textDecoration:'none', color:'inherit'}}>
            <div className="product-card">
              <img src={p.imageUrl || `https://via.placeholder.com/300x160?text=${encodeURIComponent(p.name)}`}
                alt={p.name} onError={e => e.target.src='https://via.placeholder.com/300x160?text=No+Image'} />
              <div className="product-card-body">
                <h3>{p.name}</h3>
                {/* ⚠️ VULN: dangerouslySetInnerHTML = XSS */}
                <div style={{fontSize:'0.82rem', color:'#666', marginBottom:'6px'}}
                  dangerouslySetInnerHTML={{ __html: p.description }} />
                <div className="product-price">${p.price}</div>
                <div style={{fontSize:'0.8rem', color:'#999', marginTop:'4px'}}>{p.category} · Stock: {p.stock}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* File Upload Demo */}
      {user && (
        <div className="card" style={{marginTop:'2rem'}}>
          <h3>📁 File Upload (A04 Demo)</h3>
          <div className="vuln-box" style={{marginTop:'8px'}}>
            <strong>🎯 Unrestricted File Upload</strong>
            <p style={{fontSize:'0.82rem', color:'#666', marginTop:'4px'}}>
              No file type validation. Upload <code>.html</code>, <code>.js</code>, or any file.
              Files are served from <code>/uploads/</code> — upload an HTML file with JS to achieve XSS!
            </p>
          </div>
          <input type="file" onChange={handleFileUpload} style={{marginBottom:'8px'}} />
          {uploadResult && (
            <div className="alert alert-success">
              Uploaded: <a href={`http://localhost:5000${uploadResult.path}`} target="_blank" rel="noreferrer">
                {uploadResult.path}
              </a>
              <pre style={{marginTop:'6px', fontSize:'0.8rem'}}>{JSON.stringify(uploadResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Path Traversal Demo */}
      {user && (
        <div className="card" style={{marginTop:'1rem'}}>
          <h3>📂 File Read (A01 Path Traversal Demo)</h3>
          <div className="vuln-box" style={{marginTop:'8px'}}>
            <strong>🎯 Path Traversal</strong>
            <p style={{fontSize:'0.82rem', color:'#666', marginTop:'4px'}}>
              The server reads files relative to <code>/uploads/</code> with no sanitization.
              Try: <code>../../.env</code> or <code>../../etc/passwd</code>
            </p>
          </div>
          <div style={{display:'flex', gap:'8px'}}>
            <input value={fileRead} onChange={e => setFileRead(e.target.value)}
              placeholder="../../.env"
              style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontFamily:'monospace'}} />
            <button className="btn btn-warning" onClick={handleReadFile}>Read File</button>
          </div>
          {fileReadResult && <pre style={{marginTop:'8px', maxHeight:'200px', overflow:'auto'}}>{fileReadResult}</pre>}
        </div>
      )}
    </div>
  );
}
