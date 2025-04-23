import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { countries } from 'countries-list';
import citiesData from 'cities.json/cities.json';
import './BrowseRestaurants.css';

const BrowseRestaurants = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [error, setError] = useState('');
    const [countriesList, setCountriesList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/restaurants`);
                setRestaurants(response.data);
                setFilteredRestaurants(response.data);
            } catch (err) {
                setError('Error fetching restaurants');
            }
        };
        fetchRestaurants();
    }, []);

    useEffect(() => {
        const countryArray = Object.entries(countries).map(([code, country]) => ({
            name: country.name,
            code: code.toLowerCase()
        }));
        setCountriesList(countryArray.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    useEffect(() => {
        if (!selectedCountry) {
            setLocations([]);
            setSelectedLocation('');
            setFilteredRestaurants(restaurants);
            return;
        }

        const selectedCountryData = countriesList.find(c => c.name === selectedCountry);
        if (!selectedCountryData) return;

        const countryLocations = citiesData
            .filter(city => city.country.toLowerCase() === selectedCountryData.code)
            .map(city => city.name);

        const uniqueLocations = [...new Set(countryLocations.filter(loc => loc))].sort();
        setLocations(uniqueLocations);

        if (uniqueLocations.length === 0) {
            setError(`No locations found for ${selectedCountry}.`);
        }
    }, [selectedCountry, countriesList, restaurants]);

    useEffect(() => {
        if (!selectedCountry) {
            setFilteredRestaurants(restaurants);
            return;
        }

        let filtered = restaurants;
        if (selectedCountry) {
            filtered = filtered.filter(restaurant => {
                if (!restaurant.location) return false;
                const [, restaurantCountry] = restaurant.location.split(', ').map(part => part.trim());
                return restaurantCountry === selectedCountry;
            });
        }

        if (selectedLocation) {
            filtered = filtered.filter(restaurant => {
                if (!restaurant.location) return false;
                const [restaurantCity] = restaurant.location.split(', ').map(part => part.trim());
                return restaurantCity === selectedLocation;
            });
        }

        setFilteredRestaurants(filtered);
    }, [selectedCountry, selectedLocation, restaurants]);

    return (
        <div className="browse-restaurants">
            <h2>Browse Restaurants</h2>
            {error && <p className="error">{error}</p>}
            <div className="filter-container">
                <div className="filter-group">
                    <label htmlFor="country-filter">Filter by Country:</label>
                    <select
                        id="country-filter"
                        value={selectedCountry}
                        onChange={(e) => {
                            setSelectedCountry(e.target.value);
                            setSelectedLocation('');
                        }}
                    >
                        <option value="">All Countries</option>
                        {countriesList.map((country, index) => (
                            <option key={index} value={country.name}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedCountry && (
                    <div className="filter-group">
                        <label htmlFor="location-filter">Filter by City/Region:</label>
                        <select
                            id="location-filter"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            disabled={!locations.length}
                        >
                            <option value="">All Locations in {selectedCountry}</option>
                            {locations.map((loc, index) => (
                                <option key={index} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            {filteredRestaurants.length > 0 ? (
                <div className="restaurant-grid">
                    {filteredRestaurants.map((restaurant) => (
                        <div key={restaurant.id} className="restaurant-card">
                            <Link to={`/restaurants/${restaurant.id}`}>
                                <h3>{restaurant.name}</h3>
                                <p>{restaurant.email}</p>
                                <p className="location">{restaurant.location || 'Location not specified'}</p>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No restaurants found.</p>
            )}
        </div>
    );
};

export default BrowseRestaurants;