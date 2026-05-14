import React, { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db, storage } from "../firebase/config";
import "./Admin.css";

const ADMIN_CREDENTIALS = {
  email: "admin@restaurant.com",
  password: "admin123",
};

function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Productos
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Nuevo producto
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    tag: "",
    image: null,
  });

  useEffect(() => {
    const isLogged = localStorage.getItem("admin_logged") === "true";
    if (isLogged) {
      setUser({ name: "Administrador" });
    }

    let isMounted = true;

    // Check if Firebase is actually configured
    const isFirebaseConfigured = auth?.app?.options?.apiKey && 
                                 auth.app.options.apiKey !== "TU_API_KEY";

    if (isFirebaseConfigured) {
      const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
        if (!isMounted) return;
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          active: true,
          ...doc.data()
        }));
        setProducts(productsData);
        setLoading(false);
      }, (err) => {
        console.error("Firestore products error:", err);
        setLoading(false);
      });

      const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
        if (!isMounted) return;
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(ordersData);
      }, (err) => {
        console.error("Firestore orders error:", err);
      });

      return () => {
        isMounted = false;
        unsubProducts();
        unsubOrders();
      };
    } else {
      // Local development fallback con polling para simular tiempo real
      const syncLocalData = () => {
        if (!isMounted) return;
        const localProducts = JSON.parse(localStorage.getItem("local_products") || "[]");
        const localOrders = JSON.parse(localStorage.getItem("local_orders") || "[]");
        setProducts(localProducts);
        setOrders(localOrders);
        setLoading(false);
      };

      syncLocalData();
      const interval = setInterval(syncLocalData, 3000); // Poll cada 3s

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const isFirebaseConfigured = auth?.app?.options?.apiKey && auth.app.options.apiKey !== "TU_API_KEY";
    
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      } catch (error) {
        console.error("Error updating order status:", error);
      }
    } else {
      const localOrders = JSON.parse(localStorage.getItem("local_orders") || "[]");
      const updatedOrders = localOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      localStorage.setItem("local_orders", JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta orden?")) return;
    const isFirebaseConfigured = auth?.app?.options?.apiKey && auth.app.options.apiKey !== "TU_API_KEY";

    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    } else {
      const localOrders = JSON.parse(localStorage.getItem("local_orders") || "[]");
      const updatedOrders = localOrders.filter(o => o.id !== orderId);
      localStorage.setItem("local_orders", JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
    }
  };

  const toggleProductVisibility = async (productId, currentStatus) => {
    try {
      await updateDoc(doc(db, "products", productId), { active: !currentStatus });
    } catch (error) {
      console.error("Error toggling product visibility:", error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    if (email === "ADMINPANEL" && password === "12345678") {
      localStorage.setItem("admin_logged", "true");
      setUser({ name: "Administrador" });
    } else {
      setLoginError("Credenciales incorrectas");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_logged");
    setUser(null);
  };

  const handleImageUpload = async (file, productId) => {
    if (!file) return null;

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `products/${productId}_${timestamp}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProduct = async (productId, field, value) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, { [field]: value });
      // loadProducts() ya no es necesario con onSnapshot
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleChangeProductImage = async (productId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = await handleImageUpload(file, productId);
    if (imageUrl) {
      await handleUpdateProduct(productId, "image", imageUrl);
      alert("Imagen actualizada correctamente");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!newProduct.name || !newProduct.price) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      // Crear producto temporal
      const productData = {
        name: newProduct.name,
        category: newProduct.category || "Sin categoría",
        price: parseFloat(newProduct.price),
        description: newProduct.description || "",
        tag: newProduct.tag || "Nuevo",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
        active: true,
        createdAt: new Date().toISOString(),
      };

      // Agregar a Firestore
      const docRef = await addDoc(collection(db, "products"), productData);

      // Si hay imagen, subirla y actualizar
      if (newProduct.image) {
        const imageUrl = await handleImageUpload(newProduct.image, docRef.id);
        if (imageUrl) {
          await updateDoc(doc(db, "products", docRef.id), { image: imageUrl });
        }
      }

      // Limpiar formulario
      setNewProduct({
        name: "",
        category: "",
        price: "",
        description: "",
        tag: "",
        image: null,
      });
      setShowAddProduct(false);
      // loadProducts() ya no es necesario con onSnapshot
      alert("Producto agregado correctamente");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error al agregar producto");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;

    try {
      await deleteDoc(doc(db, "products", productId));
      // loadProducts() ya no es necesario con onSnapshot
      alert("Producto eliminado");
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
    pendingOrders: orders.filter((o) => o.status === "Pendiente").length,
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-badge">Admin Panel</div>
          <h1>Bienvenido</h1>
          <p>Ingresa tus credenciales para acceder al panel de administración</p>

          <form onSubmit={handleLogin} className="admin-login-form">
            <label>
              Usuario
              <input
                type="text"
                placeholder="ADMINPANEL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button type="submit">Iniciar sesión</button>

            {loginError && <div className="login-error">{loginError}</div>}
          </form>

          <div className="admin-login-hint">
            <strong>Demo:</strong> <code>{ADMIN_CREDENTIALS.email}</code> /{" "}
            <code>{ADMIN_CREDENTIALS.password}</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-circle">🍽️</div>
          <div>
            <h2>Restaurant</h2>
            <p>Panel Admin</p>
          </div>
        </div>

        <nav className="admin-menu">
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            🏠 Vista General
          </button>
          <button
            className={activeTab === "productos" ? "active" : ""}
            onClick={() => setActiveTab("productos")}
          >
            📦 Productos
          </button>
          <button
            className={activeTab === "ordenes" ? "active" : ""}
            onClick={() => setActiveTab("ordenes")}
          >
            🛒 Órdenes
          </button>
        </nav>

        <div className="admin-side-actions">
          <button className="refresh-btn" onClick={() => window.location.reload()}>
            🔄 Refrescar Panel
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-content">
        {activeTab === "dashboard" && (
          <div className="dashboard-view">
            <div className="admin-header">
              <span className="mini-label">Resumen en vivo</span>
              <h1>Vista General</h1>
              <p>Monitorea las métricas, órdenes y productos desde un solo lugar.</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card highlight">
                <span>Total Ingresos</span>
                <strong>₡{stats.totalRevenue.toFixed(0)}</strong>
                <small>Suma de todas las órdenes</small>
              </div>

              <div className="stat-card soft">
                <span>Órdenes</span>
                <strong>{stats.totalOrders}</strong>
                <small>{stats.pendingOrders} pendientes</small>
              </div>

              <div className="stat-card soft">
                <span>Productos</span>
                <strong>{stats.totalProducts}</strong>
                <small>En el menú</small>
              </div>

              <div className="stat-card soft">
                <span>Promedio</span>
                <strong>
                  ₡
                  {stats.totalOrders > 0
                    ? (stats.totalRevenue / stats.totalOrders).toFixed(0)
                    : 0}
                </strong>
                <small>Por orden</small>
              </div>
            </div>

            <div className="dashboard-sections">
              <section className="dashboard-section">
                <div className="section-header-inline">
                  <h2>Órdenes Recibidas</h2>
                  <button className="text-btn" onClick={() => setActiveTab("ordenes")}>Ver todas →</button>
                </div>
                {orders.length === 0 ? (
                  <div className="empty-box small">
                    <p>No hay órdenes aún.</p>
                  </div>
                ) : (
                  <div className="orders-mini-list">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="order-mini-card">
                        <div className="mini-card-left">
                          <strong>#{order.ticketNumber || '---'}</strong>
                          <span>{order.customerName}</span>
                        </div>
                        <div className="mini-card-right">
                          <span className={`status-dot ${order.status?.toLowerCase()}`}></span>
                          <strong>₡{order.total?.toFixed(0)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-section">
                <div className="section-header-inline">
                  <h2>Gestión de productos</h2>
                  <button className="text-btn" onClick={() => setActiveTab("productos")}>Gestionar →</button>
                </div>
                <div className="products-mini-grid">
                  {products.slice(0, 4).map(product => (
                    <div key={product.id} className="product-mini-item">
                      <img src={product.image} alt={product.name} />
                      <div className="product-mini-info">
                        <h4>{product.name}</h4>
                        <span>₡{product.price}</span>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && <p className="empty-text">No hay productos en el menú.</p>}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "productos" && (
          <>
            <div className="admin-header">
              <span className="mini-label">Gestión de productos</span>
              <h1>Productos del Menú</h1>
              <p>
                Administra los productos, actualiza precios, cambia imágenes y
                edita descripciones.
              </p>
            </div>

            <div className="product-actions">
              <button
                className="add-product-btn"
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                {showAddProduct ? "❌ Cancelar" : "➕ Agregar Producto"}
              </button>
            </div>

            {showAddProduct && (
              <div className="add-product-panel">
                <h3>Nuevo Producto</h3>
                <form onSubmit={handleAddProduct} className="product-form">
                  <div className="form-row">
                    <label>
                      Nombre *
                      <input
                        type="text"
                        placeholder="Ej: Pizza Margarita"
                        value={newProduct.name}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      Categoría
                      <input
                        type="text"
                        placeholder="Ej: Pizzas"
                        value={newProduct.category}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, category: e.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      Precio (₡) *
                      <input
                        type="number"
                        placeholder="5000"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, price: e.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      Etiqueta
                      <input
                        type="text"
                        placeholder="Ej: Nuevo, Popular"
                        value={newProduct.tag}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, tag: e.target.value })
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Descripción
                    <textarea
                      placeholder="Describe el producto..."
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, description: e.target.value })
                      }
                      rows="3"
                    ></textarea>
                  </label>

                  <label className="file-input-label">
                    Imagen del producto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, image: e.target.files[0] })
                      }
                    />
                    {newProduct.image && (
                      <span className="file-name">{newProduct.image.name}</span>
                    )}
                  </label>

                  <button type="submit" className="submit-product-btn" disabled={uploadingImage}>
                    {uploadingImage ? "Subiendo..." : "✅ Crear Producto"}
                  </button>
                </form>
              </div>
            )}

            <div className="products-grid-admin">
              {products.length === 0 ? (
                <div className="empty-box">
                  <h4>No hay productos</h4>
                  <p>Agrega tu primer producto para comenzar</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="product-card-admin">
                      <div className="product-image-admin">
                        <img src={product.image} alt={product.name} />
                        <div className="admin-product-badges">
                          <span className={`status-badge ${product.active !== false ? 'active' : 'inactive'}`}>
                            {product.active !== false ? 'Visible' : 'Oculto'}
                          </span>
                        </div>
                        <div className="image-edit-overlay">
                          <label className="change-image-btn">
                            📷 Cambiar
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleChangeProductImage(product.id, e)}
                              style={{ display: "none" }}
                            />
                          </label>
                          <button 
                            className={`visibility-toggle-btn ${product.active !== false ? 'hide' : 'show'}`}
                            onClick={() => toggleProductVisibility(product.id, product.active !== false)}
                          >
                            {product.active !== false ? '🚫 Ocultar' : '👁️ Mostrar'}
                          </button>
                        </div>
                      </div>

                    <div className="product-details-admin">
                      <span className="product-tag-admin">{product.tag}</span>

                      <label>
                        Nombre
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) =>
                            handleUpdateProduct(product.id, "name", e.target.value)
                          }
                          onBlur={() => console.log("Field updated")}
                        />
                      </label>

                      <label>
                        Categoría
                        <input
                          type="text"
                          value={product.category}
                          onChange={(e) =>
                            handleUpdateProduct(product.id, "category", e.target.value)
                          }
                          onBlur={() => console.log("Field updated")}
                        />
                      </label>

                      <label>
                        Precio (₡)
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) =>
                            handleUpdateProduct(
                              product.id,
                              "price",
                              parseFloat(e.target.value)
                            )
                          }
                          onBlur={() => console.log("Field updated")}
                        />
                      </label>

                      <label>
                        Descripción
                        <textarea
                          value={product.description}
                          onChange={(e) =>
                            handleUpdateProduct(
                              product.id,
                              "description",
                              e.target.value
                            )
                          }
                          onBlur={() => console.log("Field updated")}
                          rows="3"
                        ></textarea>
                      </label>

                      <button
                        className="delete-product-btn"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "ordenes" && (
          <>
            <div className="admin-header">
              <span className="mini-label">Pedidos</span>
              <h1>Órdenes Recibidas</h1>
              <p>Visualiza y gestiona todas las órdenes de los clientes</p>
            </div>

            {orders.length === 0 ? (
              <div className="empty-box">
                <h4>No hay órdenes</h4>
                <p>Las órdenes aparecerán aquí cuando los clientes realicen pedidos</p>
              </div>
            ) : (
              <div className="orders-grid">
                {orders.map((order) => (
                  <div key={order.id} className="order-card">
                      <div className="order-top">
                        <div>
                          <div className="order-header-main">
                            <span className="order-ticket">#{order.ticketNumber || '---'}</span>
                            <h4>{order.customerName}</h4>
                          </div>
                          <p className="order-phone">{order.customerPhone}</p>
                        </div>
                        <select 
                          className={`order-status-select ${order.status?.toLowerCase()}`}
                          value={order.status} 
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="Pendiente">⏳ Pendiente</option>
                          <option value="Preparando">🍳 Preparando</option>
                          <option value="Listo">✅ Listo</option>
                          <option value="Entregado">🥡 Entregado</option>
                          <option value="Cancelado">❌ Cancelado</option>
                        </select>
                      </div>

                    <div className="order-meta">
                      <span>💳 {order.paymentMethod}</span>
                      <span>🍽️ {order.serviceType}</span>
                    </div>

                    <div className="order-items">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <strong>₡{item.price * item.quantity}</strong>
                        </div>
                      ))}
                    </div>

                      <div className="order-totals">
                        <div>
                          <span>Subtotal</span>
                          <strong>₡{order.subtotal?.toFixed(0)}</strong>
                        </div>
                        <div className="final-total">
                          <span>Total</span>
                          <strong>₡{order.total?.toFixed(0)}</strong>
                        </div>
                      </div>

                      <div className="order-actions-footer">
                        <button className="delete-order-btn" onClick={() => handleDeleteOrder(order.id)}>
                          🗑️ Eliminar orden
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </>
        )}

        {uploadingImage && (
          <div className="upload-overlay">
            <div className="upload-spinner"></div>
            <p>Subiendo imagen...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPanel;