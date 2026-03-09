import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const cartCount = cart?.items?.reduce((sum, i) => sum + i.qty, 0) || 0;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="top-strip">Diwali sale is on now. Book early for best offers!</div>
      <div className="navbar-inner">
        <div className="contact-row">
          <div className="contact-box">
            <strong>For Enquiry</strong>
            <div>+91 90254 56695</div>
          </div>
          <div>
            <div className="logo-circle">INIYA SRI CRACKERS</div>
            <div className="brand">Iniya Sri Crackers</div>
          </div>
          <div className="contact-box">
            <strong>Location</strong>
            <div>553-1-2 Mettamalai, Sivakasi to Sattur Main Road, Sivakasi - 626203</div>
          </div>
        </div>
        <div className="nav-row">
          <nav className="nav-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/about">About Us</NavLink>
            {user && <NavLink to="/orders">My Orders</NavLink>}
            {user?.isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="nav-right">
            <a href="/iniyasri_crackers_pricelist.pdf" className="btn-primary" download>
              Download Pricelist
            </a>
            <NavLink to="/cart" className="cart-link">
              Cart {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </NavLink>
            {user ? (
              <div className="user-menu">
                <span className="user-name">Hi, {user.name.split(" ")[0]}</span>
                <button className="btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <NavLink to="/login" className="btn-secondary">
                  Login
                </NavLink>
                <NavLink to="/register" className="btn-primary">
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

