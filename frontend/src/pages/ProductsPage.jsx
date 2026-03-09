import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function ProductsPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query.get("search") || "");
  const [category, setCategory] = useState(query.get("category") || "");

  const load = () => {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (searchTerm) params.search = searchTerm;
    axios
      .get("/api/products", { params })
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (searchTerm) params.set("search", searchTerm);
    navigate(`/products?${params.toString()}`);
    load();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategory("");
    navigate("/products");
    load();
  };

  return (
    <div className="page">
      <h1>All Crackers</h1>

      <form className="filters" onSubmit={handleFilter}>
        <input
          type="text"
          placeholder="Search crackers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {["Sparklers", "Rockets", "Flower Pots", "Bombs", "Gift Boxes"].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          Apply
        </button>
        <button type="button" className="btn-secondary" onClick={clearFilters}>
          Clear
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
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
    </div>
  );
}

