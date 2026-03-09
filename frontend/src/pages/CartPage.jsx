import React, { useState } from "react";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";

export default function CartPage() {
  const { cart, removeFromCart, clearCart, refreshCart } = useCart();
  const { token } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    address1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const items = cart?.items || [];
  const itemsPrice = items.reduce((sum, i) => sum + i.priceSnapshot * i.qty, 0);
  const shippingPrice = itemsPrice > 1000 ? 0 : items.length > 0 ? 50 : 0;
  const totalPrice = itemsPrice + shippingPrice;

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }
    setPlacing(true);
    setMessage("");
    try {
      await axios.post(
        "/api/orders",
        { shippingAddress: address, paymentMethod: "COD" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshCart();
      setMessage("Order placed successfully! You can see it in your order history.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="page">
      <h1>Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.product} className="cart-item">
                <img
                  src={item.imageSnapshot || "/cracker-default.svg"}
                  alt={item.nameSnapshot}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/cracker-default.svg";
                  }}
                />
                <div className="cart-item-info">
                  <h3>{item.nameSnapshot}</h3>
                  <p>Qty: {item.qty}</p>
                  <p>Price: ₹{item.priceSnapshot}</p>
                  <p>Subtotal: ₹{item.priceSnapshot * item.qty}</p>
                </div>
                <button className="btn-secondary" onClick={() => removeFromCart(item.product)}>
                  Remove
                </button>
              </div>
            ))
          )}
          {items.length > 0 && (
            <button className="btn-link" type="button" onClick={clearCart}>
              Clear cart
            </button>
          )}
        </div>

        <div className="cart-summary">
          <h2>Summary</h2>
          <p>Items: ₹{itemsPrice}</p>
          <p>Shipping: ₹{shippingPrice}</p>
          <p className="total">Total: ₹{totalPrice}</p>

          <h3>Shipping Address</h3>
          <form className="address-form" onSubmit={placeOrder}>
            <input
              name="fullName"
              placeholder="Full name"
              value={address.fullName}
              onChange={handleChange}
              required
            />
            <input
              name="phone"
              placeholder="Phone"
              value={address.phone}
              onChange={handleChange}
              required
            />
            <input
              name="address1"
              placeholder="Address"
              value={address.address1}
              onChange={handleChange}
              required
            />
            <input name="city" placeholder="City" value={address.city} onChange={handleChange} required />
            <input name="state" placeholder="State" value={address.state} onChange={handleChange} required />
            <input
              name="pincode"
              placeholder="Pincode"
              value={address.pincode}
              onChange={handleChange}
              required
            />
            <button type="submit" className="btn-primary" disabled={placing}>
              {placing ? "Placing..." : "Place Order (COD)"}
            </button>
          </form>
          {message && <p className="status-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}

