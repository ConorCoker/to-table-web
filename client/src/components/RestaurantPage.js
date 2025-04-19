import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './RestaurantPage.css';


const defaultRestaurantPfp = 'https://firebasestorage.googleapis.com/v0/b/tootable-6beb7.firebasestorage.app/o/assets%2Fdefault_rest_image.png?alt=media&token=ff81d826-4dbe-4f5b-8c22-b036acb66093';

const RestaurantPage = () => {
    const { restaurantId } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRestaurantAndCategories = async () => {
            try {
                setLoading(true);
                const docRef = doc(db, 'restaurants', restaurantId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const restaurantData = { id: docSnap.id, ...docSnap.data() };
                    setRestaurant(restaurantData);
                    // Getting categories
                    const categoriesRef = collection(db, `restaurants/${restaurantId}/categories`);
                    const categoriesSnap = await getDocs(categoriesRef);
                    const categoriesData = categoriesSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    // Getting menu items
                    const menuRef = collection(db, `restaurants/${restaurantId}/menu`);
                    const menuSnap = await getDocs(menuRef);
                    const menuItemsData = menuSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
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
                        } else {
                            console.warn(`Menu item ${item.id} has no valid category this should not happen!!!:`, item);
                        }
                    });
                    setMenuItems(itemsByCategory);

                    // So to not show empty categories
                    const filteredCategories = categoriesData.filter(category =>
                        itemsByCategory[category.id]?.length > 0
                    );

                    if (filteredCategories.length > 0) {
                        setCategories(filteredCategories);
                    } else {
                        console.warn(`No categories with menu items found for restaurant ${restaurantId}`);
                        setCategories([]);
                    }
                } else {
                    setError('Restaurant not found');
                }
            } catch (err) {
                setError('Failed to load restaurant details');
                console.error('Error fetching restaurant data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurantAndCategories();
    }, [restaurantId]);

    const handleAddToOrder = (item) => {
        console.log(`Add to order: ${item.name}`); //TODO
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
        restaurant.phoneNumber && { label: 'Phone', value: restaurant.phoneNumber, href: `tel:${restaurant.phoneNumber}` },
        restaurant.address && { label: 'Address', value: restaurant.address },
        restaurant.email && { label: 'Email', value: restaurant.email, href: `mailto:${restaurant.email}` }
    ].filter(Boolean);

    return (
        <div className="restaurant-page">
            <Link to="/" className="back-button">Back to explore</Link>

            <div className="restaurant-hero">
                <div className="hero-image-container">
                    <img
                        src={restaurant.profilePicture || defaultRestaurantPfp}
                        alt={`${restaurant.name} profile`}
                        className="restaurant-profile-pic"
                        onError={(e) => (e.target.src = defaultRestaurantPfp)}
                    />
                </div>
                <div className="hero-details">
                    <h1 className="restaurant-name">{restaurant.name}</h1>
                    <p className="restaurant-location">{restaurant.location || ''}</p>
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
                                                <p>{item.description || ''}</p>
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