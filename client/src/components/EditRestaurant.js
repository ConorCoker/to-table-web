import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { countries } from 'countries-list';
import citiesData from 'cities.json/cities.json';
import './EditRestaurant.css';

const EditRestaurant = () => {
    const { restaurantId } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [location, setLocation] = useState('');
    const [photos, setPhotos] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [countriesList, setCountriesList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');

    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            if (!restaurantId) return;
            try {
                const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
                if (restaurantDoc.exists()) {
                    const data = restaurantDoc.data();
                    setName(data.name || '');
                    setAddress(data.address || '');
                    setPhoneNumber(data.phoneNumber || '');
                    const savedLocation = data.location || '';
                    setLocation(savedLocation);
                    setExistingPhotos(data.photos || []);

                    if (savedLocation) {
                        const [city, country] = savedLocation.split(', ').map(part => part.trim());
                        setSelectedLocation(city || '');
                        setSelectedCountry(country || '');
                    }
                }
            } catch (err) {
                setError('Error fetching restaurant details: ' + err.message);
            }
        };
        fetchRestaurantDetails();
    }, [restaurantId]);

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
            setLocation('');
            return;
        }

        const selectedCountryData = countriesList.find(c => c.name === selectedCountry);
        if (!selectedCountryData) return;

        const countryLocations = citiesData
            .filter(city => city.country.toLowerCase() === selectedCountryData.code)
            .map(city => city.name);

        // Remove duplicates, sort, and filter out null values
        const uniqueLocations = [...new Set(countryLocations.filter(loc => loc))].sort();
        setLocations(uniqueLocations);

        if (uniqueLocations.length === 0) {
            setError(`No locations found for ${selectedCountry}.`);
        } else {
            console.log(`Fetched ${uniqueLocations.length} locations for ${selectedCountry}:`, uniqueLocations);
        }
    }, [selectedCountry, countriesList]);

    useEffect(() => {
        if (selectedLocation && selectedCountry) {
            setLocation(`${selectedLocation}, ${selectedCountry}`);
        } else if (selectedCountry) {
            setLocation(selectedCountry);
        } else {
            setLocation('');
        }
    }, [selectedLocation, selectedCountry]);

    const handlePhotoUpload = async (files) => {
        const uploadedPhotos = [];
        for (const file of files) {
            const storageRef = ref(storage, `restaurants/${restaurantId}/photos/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            uploadedPhotos.push(url);
        }
        return uploadedPhotos;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newPhotos = photos.length > 0 ? await handlePhotoUpload(photos) : [];
            const updatedPhotos = [...existingPhotos, ...newPhotos];

            await updateDoc(doc(db, 'restaurants', restaurantId), {
                name,
                address,
                phoneNumber,
                location,
                photos: updatedPhotos,
                updatedAt: new Date().toISOString(),
            });

            setMessage('Restaurant details updated successfully');
            setPhotos([]);
        } catch (err) {
            setError('Error updating restaurant details: ' + err.message);
        }
    };

    return (
        <div className="edit-restaurant">
            <h2>Edit Restaurant Details</h2>
            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Restaurant Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Address:</label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
                <div>
                    <label>Phone Number:</label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
                <div>
                    <label>Country:</label>
                    <select
                        value={selectedCountry}
                        onChange={(e) => {
                            setSelectedCountry(e.target.value);
                            setSelectedLocation('');
                        }}
                    >
                        <option value="">Select a country</option>
                        {countriesList.map((country, index) => (
                            <option key={index} value={country.name}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedCountry && (
                    <div>
                        <label>Location (City/Region):</label>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            disabled={!locations.length}
                        >
                            <option value="">Select a location</option>
                            {locations.map((loc, index) => (
                                <option key={index} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label>Upload Photos:</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setPhotos(Array.from(e.target.files))}
                    />
                </div>
                {existingPhotos.length > 0 && (
                    <div className="existing-photos">
                        <h3>Existing Photos</h3>
                        {existingPhotos.map((photo, index) => (
                            <img key={index} src={photo} alt={`Existing ${index}`} />
                        ))}
                    </div>
                )}
                <button type="submit">Save Changes</button>
            </form>
        </div>
    );
};

export default EditRestaurant;