import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './RestaurantPage.css';

const defaultRestaurantPfp = 'https://firebasestorage.googleapis.com/v0/b/tootable-6beb7.firebasestorage.app/o/assets%2Fdefault_rest_image.png?alt=media&token=ff81d826-4dbe-4f5b-8c22-b036acb66093';
const apiUrl = process.env.REACT_APP_API_URL;
const RestaurantPage = () => {
    const { restaurantId } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState({});
    const [cart, setCart] = useState([]);
    const [pastOrders, setPastOrders] = useState([]);
    const [showPastOrders, setShowPastOrders] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const savedCart = localStorage.getItem(`cart_${restaurantId}`);
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, [restaurantId]);

    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cart));
        } else {
            localStorage.removeItem(`cart_${restaurantId}`);
        }
    }, [cart, restaurantId]);

    useEffect(() => {
        const fetchRestaurantAndCategories = async () => {
            try {
                setLoading(true);
                const docRef = doc(db, 'restaurants', restaurantId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const restaurantData = { id: docSnap.id, ...docSnap.data() };
                    setRestaurant(restaurantData);
                    const categoriesRef = collection(db, `restaurants/${restaurantId}/categories`);
                    const categoriesSnap = await getDocs(categoriesRef);
                    const categoriesData = categoriesSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    const menuRef = collection(db, `restaurants/${restaurantId}/menu`);
                    const menuSnap = await getDocs(menuRef);
                    const menuItemsData = menuSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    const categoryNameToId = {};
                    categoriesData.forEach(category => {
                        if (category.name) {
                            categoryNameToId[category.name] = category.id;
                        }
                    });
                    const itemsByCategory = {};
                    menuItemsData.forEach(item => {
                        const categoryName = item.category;
                        const categoryId = categoryName ? categoryNameToId[categoryName] : null;
                        if (categoryId) {
                            if (!itemsByCategory[categoryId]) {
                                itemsByCategory[categoryId] = [];
                            }
                            itemsByCategory[categoryId].push(item);
                        }
                    });
                    setMenuItems(itemsByCategory);

                    const filteredCategories = categoriesData.filter(category =>
                        itemsByCategory[category.id]?.length > 0
                    );
                    setCategories(filteredCategories);
                    try {
                        const response = await fetch(`${apiUrl}/api/${restaurantId}/orders`);
                        if (response.ok) {
                            const orders = await response.json();
                            setPastOrders(orders);
                        } else if (response.status === 404) {
                            setPastOrders([]);
                        } else {
                            console.warn(`Failed to fetch past orders: ${response.status} ${response.statusText}`);
                            setPastOrders([]);
                        }
                    } catch (fetchError) {
                        console.warn('Error fetching past orders:', fetchError);
                        setPastOrders([]);
                    }
                } else {
                    setError('Restaurant somehow was not found even though was clicked on homescreen');
                }
            } catch (err) {
                setError('Failed to load restaurant details');
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurantAndCategories();
    }, [restaurantId]);

    const handleAddToOrder = (item) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1, specialRequests: '' }];
        });
    };

    const handleUpdateQuantity = (itemId, change) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === itemId
                    ? { ...item, quantity: Math.max(1, item.quantity + change) }
                    : item
            )
        );
    };

    const handleUpdateSpecialRequests = (itemId, specialRequests) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === itemId ? { ...item, specialRequests } : item
            )
        );
    };

    const handleRemoveItem = (itemId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };

    const getCartTotal = () => {
        return parseFloat(
            cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
        );
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        try {
            const orderId = `ORDER_${restaurantId}_${Date.now()}`;
            const order = {
                orderId,
                items: cart.map(item => ({
                    itemName: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    specialRequests: item.specialRequests || ''
                })),
                total: getCartTotal()
            };

            const response = await fetch(`${apiUrl}/api/${restaurantId}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to place order: ${response.status} ${response.statusText} - ${errorData.message}`);
            }

            const result = await response.json();
            const firestoreOrderId = result.orderId;

            const pastOrderIds = JSON.parse(localStorage.getItem(`orderIds_${restaurantId}`) || '[]');
            pastOrderIds.push(firestoreOrderId);
            localStorage.setItem(`orderIds_${restaurantId}`, JSON.stringify(pastOrderIds));

            setCart([]);
            try {
                const ordersResponse = await fetch(`${apiUrl}/api/${restaurantId}/orders`);
                if (ordersResponse.ok) {
                    const orders = await ordersResponse.json();
                    setPastOrders(orders);
                } else {
                    setPastOrders([]);
                    console.warn(`Failed to refresh past orders: ${ordersResponse.status}`);
                }
            } catch (fetchError) {
                console.warn('Error refreshing past orders:', fetchError);
                setPastOrders([]);
            }
            alert(`Order placed successfully! Order ID: ${firestoreOrderId}`);
        } catch (err) {
            console.error('Error placing order:', err);
            alert(`Failed to place order: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading restaurant details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
                <Link to="/" className="back-button">
                    Back to Home
                </Link>
            </div>
        );
    }
    // Filter out the profile picture from the photos array to avoid showing it with the rest of the photos
    const galleryPhotos = restaurant.photos
        ? restaurant.photos.filter((photo) => photo !== restaurant.profilePicture)
        : [];

    const contactFields = [
        restaurant?.phoneNumber && { label: 'Phone', value: restaurant.phoneNumber, href: `tel:${restaurant.phoneNumber}` },
        restaurant?.address && { label: 'Address', value: restaurant.address },
        restaurant?.email && { label: 'Email', value: restaurant.email, href: `mailto:${restaurant.email}` }
    ].filter(Boolean);

    return (
        <div className="restaurant-page">
            <Link to="/" className="back-button">Back to explore</Link>

            <div className="restaurant-hero">
                <div className="hero-image-container">
                    <img
                        src={restaurant?.profilePicture || defaultRestaurantPfp}
                        alt={`${restaurant?.name} profile`}
                        className="restaurant-profile-pic"
                        onError={(e) => (e.target.src = defaultRestaurantPfp)}
                    />
                </div>
                <div className="hero-details">
                    <h1 className="restaurant-name">{restaurant?.name}</h1>
                    <p className="restaurant-location">{restaurant?.location || 'N/A'}</p>
                    <div className="restaurant-meta">
                        {contactFields.map((field, index) => (
                            <span key={index}>
                <strong>{field.label}:</strong>{' '}
                                {field.href ? (
                                    <a href={field.href} className="contact-link">
                                        {field.value}
                                    </a>
                                ) : (
                                    field.value
                                )}
              </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="restaurant-content">
                <div className="menu-section">
                    <h2>Menu</h2>
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <div key={category.id} className="menu-category">
                                <h3>{category.name || 'Unnamed Category'}</h3>
                                <div className="menu-items">
                                    {menuItems[category.id]?.length > 0 ? (
                                        menuItems[category.id].map((item) => (
                                            <div
                                                key={item.id}
                                                className="menu-item"
                                                onClick={() => handleAddToOrder(item)}
                                            >
                                                <span>{item.name}</span>
                                                <span>${item.price?.toFixed(2) || ''}</span>
                                                <p>{item.description || 'No description available'}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No menu items available in this category</p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No menu categories were added! Please contact the restaurant for menu details!</p>
                    )}
                </div>

                <div className="cart-section">
                    <h2>Cart</h2>
                    {cart.length > 0 ? (
                        <div className="cart-items">
                            {cart.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <span className="cart-item-name">{item.name}</span>
                                    <span className="cart-item-price">${item.price.toFixed(2)}</span>
                                    <div className="cart-item-quantity">
                                        <button
                                            onClick={() => handleUpdateQuantity(item.id, -1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => handleUpdateQuantity(item.id, 1)}>+</button>
                                    </div>
                                    <span className="cart-item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                                    <textarea
                                        className="cart-item-special-requests"
                                        placeholder="Special requests (e.g., no onions)"
                                        value={item.specialRequests || ''}
                                        onChange={(e) => handleUpdateSpecialRequests(item.id, e.target.value)}
                                    />
                                    <button
                                        className="cart-item-remove"
                                        onClick={() => handleRemoveItem(item.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <div className="cart-total">
                                <strong>Total: ${getCartTotal().toFixed(2)}</strong>
                            </div>
                            <button className="place-order-button" onClick={handlePlaceOrder}>
                                Place Order
                            </button>
                        </div>
                    ) : (
                        <p>Your cart is empty</p>
                    )}
                    <button
                        className="view-orders-button"
                        onClick={() => setShowPastOrders(!showPastOrders)}
                    >
                        {showPastOrders ? 'Hide Past Orders' : 'View Past Orders'}
                    </button>
                    {showPastOrders && (
                        <div className="past-orders">
                            <h3>Past Orders</h3>
                            {pastOrders.length > 0 ? (
                                pastOrders.map((order) => (
                                    <div key={order.id} className="past-order">
                                        <p><strong>Order ID:</strong> {order.orderId}</p>
                                        <p><strong>Status:</strong> {order.status}</p>
                                        <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                                        <p><strong>Items:</strong> {order.items.map(item => `${item.quantity}x ${item.itemName}`).join(', ')}</p>
                                        {order.items.some(item => item.specialRequests) && (
                                            <p><strong>Special Requests:</strong> {order.items.filter(item => item.specialRequests).map(item => `${item.itemName}: ${item.specialRequests}`).join('; ')}</p>
                                        )}
                                        <p><strong>Date:</strong> {order.timestamp?.toDate ? new Date(order.timestamp.toDate()).toLocaleString() : 'N/A'}</p>
                                    </div>
                                ))
                            ) : (
                                <p>No past orders found</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="photos-section">
                    <h2>Photos</h2>
                    {galleryPhotos.length > 0 ? (
                        <div className="photo-gallery">
                            {galleryPhotos.map((photo, index) => (
                                <a
                                    key={index}
                                    href={photo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="photo-link"
                                >
                                    <img
                                        src={photo}
                                        alt={`Restaurant photo ${index + 1}`}
                                        className="gallery-photo"
                                        onError={(e) => (e.target.src = defaultRestaurantPfp)}
                                    />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p>No additional photos available</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantPage;