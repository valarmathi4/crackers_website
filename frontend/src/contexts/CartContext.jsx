import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cart, setCart] = useState(null);

  useEffect(() => {
    if (!token) {
      setCart(null);
      return;
    }
    axios
      .get("/api/cart", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCart(res.data))
      .catch(() => setCart(null));
  }, [token]);

  const refreshCart = async () => {
    if (!token) return;
    const res = await axios.get("/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCart(res.data);
  };

  const addToCart = async (productId, qty = 1) => {
    if (!token) throw new Error("Login required");
    await axios.post(
      "/api/cart/add",
      { productId, qty },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await refreshCart();
  };

  const removeFromCart = async (productId) => {
    if (!token) return;
    await axios.delete(`/api/cart/item/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await refreshCart();
  };

  const clearCart = async () => {
    if (!token) return;
    await axios.delete("/api/cart/clear", {
      headers: { Authorization: `Bearer ${token}` },
    });
    await refreshCart();
  };

  const value = { cart, addToCart, removeFromCart, clearCart, refreshCart };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

