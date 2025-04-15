import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './BrowseRestaurants.css';

const BrowseRestaurants = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await axios.get('/api/restaurants');
                setRestaurants(response.data);
            } catch (err) {
                setError('Error fetching restaurants');
            }
        };
        fetchRestaurants();
    }, []);

    return (
        <div className="browse-restaurants">
            <h2>Browse Restaurants</h2>
            {error && <p className="error">{error}</p>}
            {restaurants.length > 0 ? (
                <ul>
                    {restaurants.map((restaurant) => (
                        <li key={restaurant.id}>
                            <Link to={`/restaurants/${restaurant.id}`}>
                                {restaurant.name} ({restaurant.email})
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No restaurants found.</p>
            )}
        </div>
    );
};

export default BrowseRestaurants;