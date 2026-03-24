import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportDates, setReportDates] = useState({ 
    startDate: "", 
    endDate: "" 
  });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Sparklers",
    price: 0,
    stock: 0,
    featured: false,
    imageFile: null,
  });

  const authHeader = { Authorization: `Bearer ${token}` };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [prodRes, orderRes, statRes] = await Promise.all([
        axios.get("/api/products"),
        axios.get("/api/admin/orders", { headers: authHeader }),
        axios.get("/api/admin/dashboard-stats", { headers: authHeader })
      ]);
      
      setProducts(prodRes.data || []);
      setOrders(orderRes.data || []);
      
      // Ensure stats object has all required properties
      const statsData = statRes.data || {};
      setStats({
        summary: statsData.summary || {
          totalOrders: 0,
          totalUsers: 0,
          totalRevenue: 0,
          today: { orders: 0, revenue: 0 },
          week: { orders: 0, revenue: 0 },
          month: { orders: 0, revenue: 0 },
          year: { orders: 0, revenue: 0 }
        },
        lowStock: statsData.lowStock || { count: 0, products: [] },
        topSelling: statsData.topSelling || [],
        categorySales: statsData.categorySales || [],
        dailySales: statsData.dailySales || []
      });
      
    } catch (err) {
      console.error("Error loading admin data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
      
      // Set default empty stats on error
      setStats({
        summary: {
          totalOrders: 0,
          totalUsers: 0,
          totalRevenue: 0,
          today: { orders: 0, revenue: 0 },
          week: { orders: 0, revenue: 0 },
          month: { orders: 0, revenue: 0 },
          year: { orders: 0, revenue: 0 }
        },
        lowStock: { count: 0, products: [] },
        topSelling: [],
        categorySales: [],
        dailySales: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      category: "Sparklers",
      price: 0,
      stock: 0,
      featured: false,
      imageFile: null,
    });
  };

  const startEdit = (product) => {
    setEditing(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "Sparklers",
      price: product.price || 0,
      stock: product.stock || 0,
      featured: product.featured || false,
      imageFile: null,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else if (type === "file") {
      setForm({ ...form, imageFile: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("category", form.category);
      data.append("price", form.price);
      data.append("stock", form.stock);
      data.append("featured", form.featured);
      if (form.imageFile) data.append("image", form.imageFile);

      if (editing) {
        await axios.put(`/api/products/${editing}`, data, { headers: authHeader });
      } else {
        await axios.post("/api/products", data, { headers: authHeader });
      }
      
      loadAll();
      startCreate();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    
    try {
      await axios.delete(`/api/products/${id}`, { headers: authHeader });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(
        `/api/admin/orders/${id}/status`,
        { status },
        { headers: authHeader }
      );
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status");
    }
  };

  const handleDownloadReport = async (format) => {
    try {
      let url = `/api/admin/reports?format=${format}`;
      if (reportDates.startDate && reportDates.endDate) {
        url += `&startDate=${reportDates.startDate}&endDate=${reportDates.endDate}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: authHeader
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const windowUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = windowUrl;
      a.download = `sales_report_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(windowUrl);
    } catch (err) {
      setError("Error downloading report");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page admin-page">
        <div className="centered">
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginLeft: '1rem' }}>Loading dashboard...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <h1>Admin Dashboard</h1>
      
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {stats && (
        <section className="stats-section">
          {/* Low Stock Alert */}
          {stats.lowStock?.count > 0 && (
            <div className="alert-box error" style={{ 
              padding: "1rem", 
              backgroundColor: "#fee2e2", 
              color: "#dc2626", 
              marginBottom: "1rem", 
              borderRadius: "8px",
              border: "1px solid #fecaca"
            }}>
              <strong>⚠️ Low Stock Alert:</strong> {stats.lowStock.count} products are running low on stock! 
              {stats.lowStock.products?.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  {stats.lowStock.products.map(p => (
                    <span key={p._id} style={{ 
                      display: 'inline-block', 
                      background: '#fff', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      margin: '0.25rem',
                      fontSize: '0.9rem'
                    }}>
                      {p.name} (stock: {p.stock})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Summary Cards */}
          <div className="summary-cards" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "1rem", 
            marginBottom: "2rem" 
          }}>
            <div className="stat-card" style={{ 
              padding: "1.5rem", 
              background: "#fef3c7", 
              borderRadius: "8px", 
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#92400e" }}>Total Orders</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                {stats.summary?.totalOrders || 0}
              </p>
            </div>
            
            <div className="stat-card" style={{ 
              padding: "1.5rem", 
              background: "#e0f2fe", 
              borderRadius: "8px", 
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#0369a1" }}>Total Revenue</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                ₹{(stats.summary?.totalRevenue || 0).toFixed(2)}
              </p>
            </div>
            
            <div className="stat-card" style={{ 
              padding: "1.5rem", 
              background: "#f1f5f9", 
              borderRadius: "8px", 
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>Total Users</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                {stats.summary?.totalUsers || 0}
              </p>
            </div>
            
            <div className="stat-card" style={{ 
              padding: "1.5rem", 
              background: "#fae8ff", 
              borderRadius: "8px", 
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#86198f" }}>Products</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>
                {products.length}
              </p>
            </div>
          </div>

          {/* Period Stats */}
          <div className="period-stats" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "1rem", 
            marginBottom: "2rem" 
          }}>
            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#4b5563" }}>Today</h4>
              <p><strong>Orders:</strong> {stats.summary?.today?.orders || 0}</p>
              <p><strong>Revenue:</strong> ₹{(stats.summary?.today?.revenue || 0).toFixed(2)}</p>
            </div>
            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#4b5563" }}>This Week</h4>
              <p><strong>Orders:</strong> {stats.summary?.week?.orders || 0}</p>
              <p><strong>Revenue:</strong> ₹{(stats.summary?.week?.revenue || 0).toFixed(2)}</p>
            </div>
            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#4b5563" }}>This Month</h4>
              <p><strong>Orders:</strong> {stats.summary?.month?.orders || 0}</p>
              <p><strong>Revenue:</strong> ₹{(stats.summary?.month?.revenue || 0).toFixed(2)}</p>
            </div>
            <div style={{ background: "#fff", padding: "1rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#4b5563" }}>This Year</h4>
              <p><strong>Orders:</strong> {stats.summary?.year?.orders || 0}</p>
              <p><strong>Revenue:</strong> ₹{(stats.summary?.year?.revenue || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Top Selling Products */}
          {stats.topSelling && stats.topSelling.length > 0 && (
            <div className="top-selling" style={{ 
              background: "#fff", 
              padding: "1rem", 
              borderRadius: "8px", 
              marginBottom: "2rem",
              border: "1px solid #e5e7eb"
            }}>
              <h3 style={{ margin: "0 0 1rem 0" }}>Top Selling Products</h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {stats.topSelling.map((product, index) => (
                  <div key={product._id} style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem",
                    background: index % 2 === 0 ? "#f9fafb" : "#fff",
                    borderRadius: "4px"
                  }}>
                    <span>
                      <strong>{index + 1}.</strong> {product.name}
                    </span>
                    <span style={{ 
                      background: "#f97316", 
                      color: "#fff", 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "999px",
                      fontSize: "0.85rem"
                    }}>
                      {product.soldCount || 0} sold
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Reports Section */}
          <div className="reports-section" style={{ 
            padding: "1rem", 
            background: "#f9f9f9", 
            borderRadius: "8px",
            marginBottom: "2rem",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{ margin: "0 0 1rem 0" }}>Download Reports</h3>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <input 
                type="date" 
                value={reportDates.startDate} 
                onChange={e => setReportDates({...reportDates, startDate: e.target.value})} 
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
              />
              <span>to</span>
              <input 
                type="date" 
                value={reportDates.endDate} 
                onChange={e => setReportDates({...reportDates, endDate: e.target.value})} 
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
              />
              <button 
                className="btn-primary" 
                onClick={() => handleDownloadReport('pdf')}
                disabled={!reportDates.startDate || !reportDates.endDate}
              >
                Download PDF
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => handleDownloadReport('excel')}
                disabled={!reportDates.startDate || !reportDates.endDate}
              >
                Download Excel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Product Management */}
      <div className="admin-layout" style={{ 
        display: "grid", 
        gridTemplateColumns: "minmax(300px, 1fr) 2fr", 
        gap: "2rem", 
        marginTop: "2rem" 
      }}>
        <section>
          <h2>{editing ? "Edit Product" : "Add New Product"}</h2>
          <form className="admin-form" onSubmit={saveProduct} style={{ 
            display: "grid", 
            gap: "1rem",
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <input
              name="name"
              placeholder="Product Name"
              value={form.name}
              onChange={handleChange}
              required
              style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              required
              rows="3"
              style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
            />
            <select 
              name="category" 
              value={form.category} 
              onChange={handleChange} 
              required
              style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
            >
              {["Sparklers", "Rockets", "Flower Pots", "Bombs", "Gift Boxes"].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={handleChange}
                required
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
              />
              <input
                name="stock"
                type="number"
                min="0"
                placeholder="Stock"
                value={form.stock}
                onChange={handleChange}
                required
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #d1d5db" }}
              />
            </div>
            <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
              Featured Product
            </label>
            <input 
              name="image" 
              type="file" 
              accept="image/*" 
              onChange={handleChange}
              style={{ padding: "0.5rem" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                {editing ? "Update Product" : "Create Product"}
              </button>
              {editing && (
                <button type="button" className="btn-secondary" onClick={startCreate}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2>Products ({products.length})</h2>
          <div className="admin-list" style={{ 
            display: "grid", 
            gap: "0.75rem",
            maxHeight: "600px",
            overflowY: "auto",
            paddingRight: "0.5rem"
          }}>
            {products.length === 0 ? (
              <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
                No products found. Add your first product!
              </p>
            ) : (
              products.map((p) => (
                <div key={p._id} className="admin-item" style={{ 
                  padding: "0.75rem", 
                  borderRadius: "8px", 
                  background: "#ffffff", 
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong>{p.name}</strong>
                      {p.featured && (
                        <span style={{ 
                          background: "#f97316", 
                          color: "#fff", 
                          padding: "0.15rem 0.5rem", 
                          borderRadius: "999px",
                          fontSize: "0.7rem"
                        }}>
                          Featured
                        </span>
                      )}
                      {p.stock < (p.lowStockThreshold || 5) && (
                        <span style={{ 
                          background: "#dc2626", 
                          color: "#fff", 
                          padding: "0.15rem 0.5rem", 
                          borderRadius: "999px",
                          fontSize: "0.7rem"
                        }}>
                          Low Stock
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      {p.category} | ₹{p.price} | Stock: {p.stock} | Sold: {p.soldCount || 0}
                    </div>
                  </div>
                  <div className="admin-actions" style={{ display: "flex", gap: "0.4rem" }}>
                    <button 
                      onClick={() => startEdit(p)}
                      style={{ 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "4px", 
                        border: "1px solid #3b82f6",
                        background: "#3b82f6",
                        color: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteProduct(p._id)}
                      style={{ 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "4px", 
                        border: "1px solid #dc2626",
                        background: "#dc2626",
                        color: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Orders Section */}
      <section style={{ marginTop: "2rem" }}>
        <h2>Recent Orders</h2>
        <div className="admin-list" style={{ 
          display: "grid", 
          gap: "0.75rem"
        }}>
          {orders.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
              No orders yet.
            </p>
          ) : (
            orders.slice(0, 10).map((o) => (
              <div key={o._id} className="admin-item" style={{ 
                padding: "1rem", 
                borderRadius: "8px", 
                background: "#ffffff", 
                border: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <strong>Order #{o._id.toString().slice(-6)}</strong>
                    <span className={`status-pill status-${o.status?.toLowerCase()}`} style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      border: "1px solid",
                      borderColor: 
                        o.status === 'Delivered' ? '#10b981' :
                        o.status === 'Cancelled' ? '#ef4444' :
                        o.status === 'Shipped' ? '#3b82f6' :
                        o.status === 'Packed' ? '#8b5cf6' : '#f97316'
                    }}>
                      {o.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                    <div>Customer: {o.userId?.name || "Unknown"}</div>
                    <div>Date: {new Date(o.createdAt).toLocaleDateString()}</div>
                    <div>Total: ₹{o.totalAmount?.toFixed(2)}</div>
                    <div style={{ 
                      maxWidth: "400px", 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      whiteSpace: "nowrap" 
                    }}>
                      Items: {o.products?.map(i => `${i.name} x${i.qty}`).join(', ')}
                    </div>
                  </div>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                  style={{ 
                    padding: "0.4rem", 
                    borderRadius: "4px", 
                    border: "1px solid #d1d5db",
                    minWidth: "120px"
                  }}
                >
                  {["Placed", "Packed", "Shipped", "Delivered", "Cancelled"].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
          {orders.length > 10 && (
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              Showing 10 of {orders.length} orders
            </p>
          )}
        </div>
      </section>
    </div>
  );
}