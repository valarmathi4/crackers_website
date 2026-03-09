import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/products?featured=true")
      .then((res) => setFeatured(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <h1>Quality Makes the Belief for Customers</h1>
        <p>
          We provide all top branded Diwali crackers and other occasional fire crackers in retail and
          wholesale. Light up your celebration with safe, vibrant and memorable fireworks.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to="/products" className="btn-primary">
            Shop Products
          </Link>
        </div>
      </section>

      <section className="section">
        <h2>Shop by Category</h2>
        <div className="category-grid">
          {["Sparklers", "Rockets", "Flower Pots", "Bombs", "Gift Boxes"].map((cat) => (
            <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="category-card">
              <h3>{cat}</h3>
              <p>View all {cat.toLowerCase()}.</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Featured Crackers</h2>
        {loading ? (
          <p>Loading...</p>
        ) : featured.length === 0 ? (
          <p>No featured products yet.</p>
        ) : (
          <div className="product-grid">
            {featured.map((p) => (
              <Link key={p._id} to={`/products/${p._id}`} className="product-card">
                <img
                  src={p.imageUrl || "/cracker-default.svg"}
                  alt={p.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/cracker-default.svg";
                  }}
                />
                <h3>{p.name}</h3>
                <p className="category">{p.category}</p>
                <p className="price">₹{p.price}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

