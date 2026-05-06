import React, { useMemo, useState } from "react";
import "./Dashboard.css";

const IVA_RATE = 0.13;

const menuProducts = [
    {
        id: 1,
        name: "Casado con Pollo",
        category: "Platos fuertes",
        price: 3500,
        description: "Arroz, frijoles, ensalada fresca, plátano maduro, pollo a la plancha y picadillo del día.",
        image: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=80",
        tag: "Más vendido",
    },
    {
        id: 2,
        name: "Hamburguesa Artesanal",
        category: "Especiales",
        price: 4200,
        description: "Carne jugosa, queso derretido, lechuga, tomate, cebolla caramelizada y salsa de la casa.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
        tag: "Promoción",
    },
    {
        id: 3,
        name: "Pizza Personal",
        category: "Especiales",
        price: 3900,
        description: "Pizza personal con salsa de tomate natural, queso mozzarella y toppings a elección.",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
        tag: "Nuevo",
    },
    {
        id: 4,
        name: "Arroz con Camarones",
        category: "Mariscos",
        price: 5200,
        description: "Arroz salteado con camarones frescos, vegetales, especias y toque especial de la casa.",
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80",
        tag: "Premium",
    },
    {
        id: 5,
        name: "Pasta Alfredo",
        category: "Pastas",
        price: 4600,
        description: "Pasta cremosa con salsa Alfredo, pollo a la plancha, queso parmesano y pan tostado.",
        image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=900&q=80",
        tag: "Recomendado",
    },
    {
        id: 6,
        name: "Tacos Mixtos",
        category: "Antojitos",
        price: 3100,
        description: "Tres tacos con carne, pollo y vegetales, acompañados de salsas caseras y limón.",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80",
        tag: "Picante",
    },
    {
        id: 7,
        name: "Nachos Supremos",
        category: "Para compartir",
        price: 4800,
        description: "Nachos crujientes con queso, carne, pico de gallo, frijoles molidos, jalapeños y guacamole.",
        image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?auto=format&fit=crop&w=900&q=80",
        tag: "Para 2",
    },
    {
        id: 8,
        name: "Ensalada Tropical",
        category: "Saludable",
        price: 3400,
        description: "Lechuga fresca, pollo, aguacate, tomate cherry, zanahoria, mango y aderezo especial.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
        tag: "Ligero",
    },
    {
        id: 9,
        name: "Papas con Queso y Bacon",
        category: "Acompañamientos",
        price: 2600,
        description: "Papas fritas doradas con queso cheddar, bacon crujiente y salsa ranch de la casa.",
        image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=80",
        tag: "Crispy",
    },
    {
        id: 10,
        name: "Batido de Fresa",
        category: "Bebidas",
        price: 1800,
        description: "Batido natural de fresa preparado al momento con leche o agua, según preferencia.",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=900&q=80",
        tag: "Natural",
    },
    {
        id: 11,
        name: "Limonada Hierbabuena",
        category: "Bebidas",
        price: 1500,
        description: "Refrescante limonada natural con hierbabuena, hielo y un toque cítrico perfecto.",
        image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80",
        tag: "Frío",
    },
    {
        id: 12,
        name: "Brownie con Helado",
        category: "Postres",
        price: 2800,
        description: "Brownie tibio de chocolate acompañado con helado de vainilla y salsa dulce.",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
        tag: "Dulce",
    },
];

function formatCurrency(amount) {
    return new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0,
    }).format(amount);
}

function Dashboard() {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("SINPE Móvil");
    const [serviceType, setServiceType] = useState("Retirar");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    const cartSubtotal = useMemo(() => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cart]);

    const cartIVA = cartSubtotal * IVA_RATE;
    const cartTotal = cartSubtotal + cartIVA;

    const totalItems = useMemo(() => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    }, [cart]);

    const addToCart = (product) => {
        setCart((currentCart) => {
            const productExists = currentCart.find((item) => item.id === product.id);
            if (productExists) {
                return currentCart.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...currentCart, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const increaseQuantity = (productId) => {
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    };

    const decreaseQuantity = (productId) => {
        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromCart = (productId) => {
        setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    const handleSendOrder = () => {
        if (cart.length === 0) {
            alert("Primero agrega productos al carrito.");
            return;
        }
        if (!customerName.trim() || !customerPhone.trim()) {
            alert("Por favor escribe tu nombre y teléfono.");
            return;
        }

        const orderData = {
            id: `ORD-${Date.now()}`,
            customerName,
            customerPhone,
            paymentMethod,
            serviceType,
            items: cart,
            subtotal: cartSubtotal,
            iva: cartIVA,
            total: cartTotal,
            createdAt: new Date().toISOString(),
            status: "Pendiente",
        };

        // Guardar para el Admin
        const existingOrders = JSON.parse(localStorage.getItem("restaurantOrders") || "[]");
        localStorage.setItem("restaurantOrders", JSON.stringify([orderData, ...existingOrders]));

        alert(`¡Orden enviada! Total: ${formatCurrency(cartTotal)}`);
        clearCart();
        setCustomerName("");
        setCustomerPhone("");
        setIsCartOpen(false);
    };

    return (
        <main className="restaurant-dashboard">
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <div className="restaurant-badge">Nuestro Menú</div>
                    <h1>
                        Platillos deliciosos
                        <span> preparados con amor</span>
                    </h1>
                    <p>
                        Explora nuestra selección premium y haz tu pedido en segundos.
                    </p>
                    <div className="hero-actions">
                        <a href="#menu" className="hero-button primary">Ver menú</a>
                        <button className="hero-button secondary" onClick={() => setIsCartOpen(true)}>Ver pedido</button>
                    </div>
                </div>
            </section>

            <section className="sticky-info-bar">
                <div><strong>Horario</strong><span>10:00 AM - 9:00 PM</span></div>
                <div><strong>Pago</strong><span>SINPE, Efectivo, Tarjeta</span></div>
                <div><strong>Servicio</strong><span>Para llevar o en sitio</span></div>
            </section>

            <section id="menu" className="menu-section">
                <div className="section-header">
                    <span className="section-badge">Nuestra Cocina</span>
                    <h2>Menú Principal</h2>
                    <p>Selecciona tus platillos y agrégalos al carrito.</p>
                </div>

                <div className="products-grid">
                    {menuProducts.map((product, index) => (
                        <div className="product-card" key={product.id} style={{ animationDelay: `${index * 0.05}s` }}>
                            <div className="product-image-wrapper">
                                <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
                                <div className="product-tag">{product.tag}</div>
                            </div>
                            <div className="product-content">
                                <h3 className="product-name">{product.name}</h3>
                                <div className="product-price">{formatCurrency(product.price)}</div>
                                <p className="product-description">{product.description}</p>
                                <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
                                    Agregar al pedido
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <button className="floating-cart" onClick={() => setIsCartOpen(true)}>
                <span>🛒</span>
                {totalItems > 0 && <strong>{totalItems}</strong>}
            </button>

            <aside className={isCartOpen ? "cart-drawer open" : "cart-drawer"}>
                <div className="cart-header">
                    <div><span>Tu Pedido</span><h2>Carrito</h2></div>
                    <button className="close-cart" onClick={() => setIsCartOpen(false)}>✕</button>
                </div>

                <div className="cart-content">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-icon">🛒</div>
                            <h3>Carrito vacío</h3>
                            <p>Aún no has agregado nada.</p>
                        </div>
                    ) : (
                        <div className="cart-items">
                            {cart.map((item) => (
                                <div className="cart-item" key={item.id}>
                                    <img src={item.image} alt={item.name} />
                                    <div className="cart-item-info">
                                        <h4>{item.name}</h4>
                                        <span>{formatCurrency(item.price)}</span>
                                        <div className="quantity-controls">
                                            <button onClick={() => decreaseQuantity(item.id)}>-</button>
                                            <strong>{item.quantity}</strong>
                                            <button onClick={() => increaseQuantity(item.id)}>+</button>
                                            <button className="remove-button" onClick={() => removeFromCart(item.id)}>Quitar</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="checkout-box">
                        <div className="checkout-form">
                            <label>Nombre<input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></label>
                            <label>Teléfono<input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></label>
                            <label>Pago
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="SINPE Móvil">SINPE Móvil</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                </select>
                            </label>
                            <label>Servicio
                                <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                                    <option value="Retirar">Retirar</option>
                                    <option value="Comer en restaurante">Comer aquí</option>
                                </select>
                            </label>
                        </div>
                        <div className="cart-totals">
                            <div><span>Subtotal</span><strong>{formatCurrency(cartSubtotal)}</strong></div>
                            <div className="total-row"><span>Total</span><strong>{formatCurrency(cartTotal)}</strong></div>
                        </div>
                        <div className="checkout-actions">
                            <button className="send-order-button" onClick={handleSendOrder}>Confirmar Orden</button>
                            <button className="clear-cart-button" onClick={clearCart}>Vaciar</button>
                        </div>
                    </div>
                </div>
            </aside>

            {isCartOpen && <div className="cart-backdrop" onClick={() => setIsCartOpen(false)} />}
        </main>
    );
}

export default Dashboard;