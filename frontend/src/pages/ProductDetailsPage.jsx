import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await addToCart(id, qty);
      navigate("/cart");
    } catch (e) {
      setError(e.message || "Failed to add to cart");
    }
  };

  if (loading) return <div className="page">Loading...</div>;
  if (error) return <div className="page">{error}</div>;
  if (!product) return <div className="page">Not found</div>;

  return (
    <div className="page">
      <div className="product-details">
        <img
          src={product.imageUrl || "/cracker-default.svg"}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/cracker-default.svg";
          }}
        />
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="category">{product.category}</p>
          <p className="price">₹{product.price}</p>
          <p>{product.description}</p>
          <p className="stock">
            {product.countInStock > 0 ? `In stock: ${product.countInStock}` : "Out of stock"}
          </p>
          {product.countInStock > 0 && (
            <div className="add-to-cart">
              <input
                type="number"
                min="1"
                max={product.countInStock}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button className="btn-primary" onClick={handleAdd}>
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

