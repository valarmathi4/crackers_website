import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/orders/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="page">
      <h1>My Orders</h1>
      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <span className="order-id">Order #{order._id.slice(-6)}</span>
                <span className={`status-pill status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-meta">
                <p>Date: {new Date(order.createdAt).toLocaleString()}</p>
                <p>Total: ₹{order.totalAmount}</p>
              </div>
              <div className="order-items">
                {order.products.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img
                      src={item.imageUrl || "/cracker-default.svg"}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/cracker-default.svg";
                      }}
                    />
                    <div>
                      <p>{item.name}</p>
                      <p>
                        Qty: {item.qty} × ₹{item.price} = ₹{item.qty * item.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-address">
                <p>
                  Ship to: {order.shippingAddress.fullName}, {order.shippingAddress.address1},{" "}
                  {order.shippingAddress.city} - {order.shippingAddress.pincode}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

