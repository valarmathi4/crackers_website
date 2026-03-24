import React, { useState } from "react";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import axios from "axios";

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Helper function to download invoice
const downloadInvoice = (orderId, base64Data) => {
  if (base64Data) {
    // If we have base64 data from the response
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } else {
    // Fallback: fetch invoice from server
    fetchInvoice(orderId);
  }
};

const fetchInvoice = async (orderId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/payment/invoice/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to download invoice');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    alert('Failed to download invoice. Please check your orders page.');
  }
};

export default function CartPage() {
  const { cart, removeFromCart, clearCart, refreshCart } = useCart();
  const { token, user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: "",
    address1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const items = cart?.items || [];
  const itemsPrice = items.reduce((sum, i) => sum + i.priceSnapshot * i.qty, 0);
  const shippingPrice = itemsPrice > 1000 ? 0 : items.length > 0 ? 50 : 0;
  const totalAmount = itemsPrice + shippingPrice;

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
    setShowInvoice(false);
    
    // Load Razorpay Script
    const resScript = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!resScript) {
      setMessage("Razorpay SDK failed to load. Are you online?");
      setPlacing(false);
      return;
    }

    try {
      // Create Razorpay Order
      const { data: rzpOrder } = await axios.post(
        "/api/payment/create-order",
        { amount: totalAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mappedItems = items.map(i => ({
        product: i.product,
        qty: i.qty,
        price: i.priceSnapshot,
        name: i.nameSnapshot,
        imageUrl: i.imageSnapshot
      }));

      if (rzpOrder.isMock) {
        // Mock payment flow
        const { data: response } = await axios.post(
          "/api/payment/verify",
          {
            razorpayOrderId: rzpOrder.id,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: "mock_signature",
            shippingAddress: address,
            items: mappedItems,
            itemsPrice,
            shippingPrice,
            totalAmount
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        await refreshCart();
        
        if (response.success) {
          setLastOrderId(response.orderId);
          setShowInvoice(true);
          setMessage("Payment successful! Order placed. Check your order history.");
          
          // Download invoice automatically
          if (response.invoice) {
            downloadInvoice(response.orderId, response.invoice);
          } else {
            fetchInvoice(response.orderId);
          }
        }
        
        setPlacing(false);
        return;
      }

      // Real Razorpay flow
      const options = {
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_xxxxxx",
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "Iniya Sri Crackers",
        description: "Payment for order",
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            const { data: verifyResponse } = await axios.post(
              "/api/payment/verify",
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                shippingAddress: address,
                items: mappedItems,
                itemsPrice,
                shippingPrice,
                totalAmount
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            await refreshCart();
            
            if (verifyResponse.success) {
              setLastOrderId(verifyResponse.orderId);
              setShowInvoice(true);
              setMessage("Payment successful! Order placed. Check your order history.");
              
              // Download invoice automatically
              if (verifyResponse.invoice) {
                downloadInvoice(verifyResponse.orderId, verifyResponse.invoice);
              } else {
                fetchInvoice(verifyResponse.orderId);
              }
            }
          } catch (err) {
            setMessage(err.response?.data?.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: address.fullName,
          email: user?.email || "",
          contact: address.phone,
        },
        theme: {
          color: "#f97316",
        },
        modal: {
          ondismiss: function() {
            setPlacing(false);
            setMessage("Payment cancelled.");
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response) {
        setMessage("Payment failed: " + (response.error?.description || "Unknown error"));
        setPlacing(false);
      });
      paymentObject.open();

    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to initialize payment.");
      setPlacing(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (lastOrderId) {
      fetchInvoice(lastOrderId);
    }
  };

  return (
    <div className="page">
      <h1>Your Cart</h1>
      
      {showInvoice && (
        <div className="invoice-success" style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong style={{ color: '#155724' }}>✓ Order placed successfully!</strong>
            <p style={{ margin: '0.5rem 0 0', color: '#155724' }}>
              Invoice has been downloaded. You can also download it again.
            </p>
          </div>
          <button 
            onClick={handleDownloadInvoice}
            className="btn-primary"
            style={{ backgroundColor: '#28a745' }}
          >
            Download Invoice Again
          </button>
        </div>
      )}

      <div className="cart-layout">
        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart" style={{
              textAlign: 'center',
              padding: '3rem',
              background: '#f9f9f9',
              borderRadius: '1rem'
            }}>
              <p>Your cart is empty.</p>
              <a href="/products" className="btn-primary" style={{ marginTop: '1rem' }}>
                Continue Shopping
              </a>
            </div>
          ) : (
            <>
              {items.map((item) => (
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
                    <p>Quantity: {item.qty}</p>
                    <p>Price per unit: ₹{item.priceSnapshot}</p>
                    <p className="subtotal" style={{ fontWeight: 'bold' }}>
                      Subtotal: ₹{item.priceSnapshot * item.qty}
                    </p>
                  </div>
                  <button 
                    className="btn-secondary" 
                    onClick={() => removeFromCart(item.product)}
                    style={{ minWidth: '80px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <div className="cart-actions" style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: '1rem'
              }}>
                <button className="btn-link" type="button" onClick={clearCart}>
                  Clear Cart
                </button>
                <a href="/products" className="btn-link">
                  Continue Shopping
                </a>
              </div>
            </>
          )}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-details" style={{ margin: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Items Subtotal:</span>
              <span>₹{itemsPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Shipping:</span>
              <span>{shippingPrice === 0 ? 'Free' : `₹${shippingPrice.toFixed(2)}`}</span>
            </div>
            {shippingPrice > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                Free shipping on orders above ₹1000
              </p>
            )}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontWeight: 'bold',
              fontSize: '1.2rem',
              borderTop: '2px solid #eee',
              paddingTop: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <span>Total:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

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
              type="tel"
              placeholder="Phone number"
              value={address.phone}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit phone number"
            />
            <input
              name="address1"
              placeholder="Street address"
              value={address.address1}
              onChange={handleChange}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input
                name="city"
                placeholder="City"
                value={address.city}
                onChange={handleChange}
                required
              />
              <input
                name="state"
                placeholder="State"
                value={address.state}
                onChange={handleChange}
                required
              />
            </div>
            <input
              name="pincode"
              placeholder="Pincode"
              value={address.pincode}
              onChange={handleChange}
              required
              pattern="[0-9]{6}"
              title="Please enter a valid 6-digit pincode"
            />
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={placing || items.length === 0}
              style={{ 
                width: '100%', 
                marginTop: '1rem',
                opacity: (placing || items.length === 0) ? 0.6 : 1 
              }}
            >
              {placing ? (
                <span>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.5rem'
                  }}></span>
                  Processing...
                </span>
              ) : (
                `Pay ₹${totalAmount.toFixed(2)}`
              )}
            </button>
          </form>
          
          {message && (
            <p className="status-message" style={{
              marginTop: '1rem',
              padding: '0.5rem',
              borderRadius: '4px',
              backgroundColor: message.includes('successful') ? '#d4edda' : '#f8d7da',
              color: message.includes('successful') ? '#155724' : '#721c24'
            }}>
              {message}
            </p>
          )}

          <div className="payment-info" style={{
            marginTop: '1rem',
            padding: '0.5rem',
            fontSize: '0.85rem',
            color: '#666',
            borderTop: '1px solid #eee'
          }}>
            <p>✓ Secure payment via Razorpay</p>
            <p>✓ Invoice will be generated automatically</p>
            <p>✓ Order confirmation will be sent to your email</p>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}