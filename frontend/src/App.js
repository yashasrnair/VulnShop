import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { getUser, removeToken } from './utils/api';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import UserList from './pages/UserList';
import './App.css';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const logout = () => {
    removeToken();
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">🛒 VulnShop</Link>
        <span className="vuln-badge">⚠️ DELIBERATELY VULNERABLE</span>
      </div>
      <div className="nav-links">
        <Link to="/products">Products</Link>
        {user ? (
          <>
            <Link to="/orders">My Orders</Link>
            <Link to="/profile">👤 {user.username}</Link>
            {user.isAdmin && <Link to="/admin" className="admin-link">🔐 Admin</Link>}
            <button onClick={logout} className="btn-logout">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(getUser());

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <main className="main-content">
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/login"      element={<Login setUser={setUser} />} />
          <Route path="/register"   element={<Register setUser={setUser} />} />
          <Route path="/products"   element={<Products user={user} />} />
          <Route path="/products/:id" element={<ProductDetail user={user} />} />
          <Route path="/orders"     element={<Orders user={user} />} />
          <Route path="/profile"    element={<Profile user={user} setUser={setUser} />} />
          <Route path="/admin"      element={<Admin user={user} />} />
          <Route path="/users"      element={<UserList user={user} />} />
        </Routes>
      </main>
    </Router>
  );
}
