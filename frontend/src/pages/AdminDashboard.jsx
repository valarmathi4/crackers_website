import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Sparklers",
    price: 0,
    countInStock: 0,
    featured: false,
    imageFile: null,
  });

  const authHeader = { Authorization: `Bearer ${token}` };

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      axios.get("/api/products"),
      axios.get("/api/admin/orders", { headers: authHeader }),
    ])
      .then(([prodRes, orderRes]) => {
        setProducts(prodRes.data);
        setOrders(orderRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      category: "Sparklers",
      price: 0,
      countInStock: 0,
      featured: false,
      imageFile: null,
    });
  };

  const startEdit = (product) => {
    setEditing(product._id);
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      countInStock: product.countInStock,
      featured: product.featured,
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
    const data = new FormData();
    data.append("name", form.name);
    data.append("description", form.description);
    data.append("category", form.category);
    data.append("price", form.price);
    data.append("countInStock", form.countInStock);
    data.append("featured", form.featured);
    if (form.imageFile) data.append("image", form.imageFile);

    if (editing) {
      await axios.put(`/api/products/${editing}`, data, { headers: authHeader });
    } else {
      await axios.post("/api/products", data, { headers: authHeader });
    }
    loadAll();
    startCreate();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await axios.delete(`/api/products/${id}`, { headers: authHeader });
    loadAll();
  };

  const updateOrderStatus = async (id, status) => {
    await axios.put(
      `/api/admin/orders/${id}/status`,
      { status },
      { headers: authHeader }
    );
    loadAll();
  };

  return (
    <div className="page admin-page">
      <h1>Admin Dashboard</h1>
      {loading && <p>Loading...</p>}

      <div className="admin-layout">
        <section>
          <h2>{editing ? "Edit Product" : "Add Product"}</h2>
          <form className="admin-form" onSubmit={saveProduct}>
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              required
            />
            <select name="category" value={form.category} onChange={handleChange} required>
              {["Sparklers", "Rockets", "Flower Pots", "Bombs", "Gift Boxes"].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              name="price"
              type="number"
              min="0"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              required
            />
            <input
              name="countInStock"
              type="number"
              min="0"
              placeholder="Stock"
              value={form.countInStock}
              onChange={handleChange}
              required
            />
            <label className="checkbox">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
              Featured
            </label>
            <input name="image" type="file" accept="image/*" onChange={handleChange} />
            <button type="submit" className="btn-primary">
              {editing ? "Update Product" : "Create Product"}
            </button>
            {editing && (
              <button type="button" className="btn-secondary" onClick={startCreate}>
                Cancel
              </button>
            )}
          </form>

          <h2>Products</h2>
          <div className="admin-list">
            {products.map((p) => (
              <div key={p._id} className="admin-item">
                <div>
                  <strong>{p.name}</strong> ({p.category}) - ₹{p.price} | Stock: {p.countInStock}
                </div>
                <div className="admin-actions">
                  <button onClick={() => startEdit(p)}>Edit</button>
                  <button onClick={() => deleteProduct(p._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Orders</h2>
          <div className="admin-list">
            {orders.map((o) => (
              <div key={o._id} className="admin-item">
                <div>
                  <strong>Order #{o._id.slice(-6)}</strong> - ₹{o.totalPrice} -{" "}
                  <span className={`status-pill status-${o.status.toLowerCase()}`}>{o.status}</span>
                  <div>Customer: {o.user?.name}</div>
                  <div>
                    Items:{" "}
                    {o.items
                      .map((i) => `${i.name} x ${i.qty}`)
                      .join(", ")}
                  </div>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                >
                  {["Placed", "Packed", "Shipped", "Delivered", "Cancelled"].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

