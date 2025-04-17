import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
    const [profilePicture, setProfilePicture] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const [countriesList, setCountriesList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');

    const fileInputRef = useRef(null);

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
                    setProfilePicture(data.profilePicture || '');

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
        setUploading(true);
        setMessage('Uploading photos...');

        for (const file of files) {
            console.log(`Uploading file: ${file.name}, Type: ${file.type}`);
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `restaurants/${restaurantId}/photos/${sanitizedFileName}`);

            try {
                const metadata = {
                    contentType: file.type,
                };
                await uploadBytes(storageRef, file, metadata);
                const url = await getDownloadURL(storageRef);
                console.log(`Uploaded file URL: ${url}`);
                uploadedPhotos.push(url);
            } catch (err) {
                console.error(`Error uploading file ${file.name}:`, err);
                setError(prev => prev + ` Failed to upload ${file.name}: ${err.message}.`);
            }
        }

        setUploading(false);
        return uploadedPhotos;
    };

    const handleSetProfilePicture = async (photoUrl) => {
        try {
            await updateDoc(doc(db, 'restaurants', restaurantId), {
                profilePicture: photoUrl,
                updatedAt: new Date().toISOString(),
            });
            setProfilePicture(photoUrl);
            setMessage('Profile picture updated successfully');
        } catch (err) {
            setError('Error setting profile picture: ' + err.message);
        }
    };

    const handleRemoveProfilePicture = async () => {
        try {
            await updateDoc(doc(db, 'restaurants', restaurantId), {
                profilePicture: '',
                updatedAt: new Date().toISOString(),
            });
            setProfilePicture('');
            setMessage('Profile picture removed successfully');
        } catch (err) {
            setError('Error removing profile picture: ' + err.message);
        }
    };

    const handleDeletePhoto = async (photoUrl) => {
        try {
            const photoRef = ref(storage, photoUrl);
            await deleteObject(photoRef);

            const updatedPhotos = existingPhotos.filter(photo => photo !== photoUrl);
            const updateData = {
                photos: updatedPhotos,
                updatedAt: new Date().toISOString(),
            };

            if (profilePicture === photoUrl) {
                updateData.profilePicture = '';
                setProfilePicture('');
            }

            await updateDoc(doc(db, 'restaurants', restaurantId), updateData);
            setExistingPhotos(updatedPhotos);
            setMessage('Photo deleted successfully');
        } catch (err) {
            setError('Error deleting photo: ' + err.message);
        }
    };

    const handleRemovePreviewPhoto = (index) => {
        const updatedPhotos = photos.filter((_, i) => i !== index);
        setPhotos(updatedPhotos);
        if (updatedPhotos.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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

            setExistingPhotos(updatedPhotos);
            setMessage('Restaurant details updated successfully');
            setPhotos([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError('Error updating restaurant details: ' + err.message);
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        console.log("Selected files:", selectedFiles.map(file => ({ name: file.name, type: file.type })));
        setPhotos(prevPhotos => [...prevPhotos, ...selectedFiles]);
    };

    return (
        <div className="edit-restaurant">
            <h2>Edit Restaurant Details</h2>
            <div className="form-wrapper">
                {uploading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Display Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={uploading}
                        />
                    </div>
                    <div>
                        <label>Address:</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={uploading}
                        />
                    </div>
                    <div>
                        <label>Phone Number:</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={uploading}
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
                            disabled={uploading}
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
                            <label>Location within {selectedCountry}:</label>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                disabled={uploading || !locations.length}
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
                    <div className="upload-section">
                        <div className="upload-wrapper">
                            <label>Upload Restaurant Photos:</label>
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    disabled={uploading}
                                />
                                {photos.length > 0 && (
                                    <span className="file-count">
                                        {photos.length} file{photos.length !== 1 ? 's' : ''} selected
                                    </span>
                                )}
                            </div>
                        </div>
                        {photos.length > 0 && (
                            <div className="photo-preview">
                                <div className="preview-gallery">
                                    {photos.map((file, index) => (
                                        <div key={index} className="preview-item">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${file.name}`}
                                            />
                                            <div className="preview-actions">
                                                <button
                                                    type="button"
                                                    className="action-btn delete"
                                                    onClick={() => handleRemovePreviewPhoto(index)}
                                                    disabled={uploading}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {existingPhotos.length > 0 && (
                        <div className="existing-photos">
                            <h3>Current Restaurant Photos</h3>
                            <div className="photo-gallery">
                                {existingPhotos.map((photo, index) => (
                                    <div key={index} className="photo-item">
                                        <img
                                            src={photo}
                                            alt={`Existing ${index}`}
                                            className={profilePicture === photo ? 'profile-picture' : ''}
                                        />
                                        <div className="photo-actions">
                                            {profilePicture === photo ? (
                                                <button
                                                    type="button"
                                                    className="action-btn remove-profile"
                                                    onClick={handleRemoveProfilePicture}
                                                    disabled={uploading}
                                                >
                                                    Remove Profile Picture
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="action-btn set-profile"
                                                    onClick={() => handleSetProfilePicture(photo)}
                                                    disabled={uploading}
                                                >
                                                    Set as Profile Picture
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="action-btn delete"
                                                onClick={() => handleDeletePhoto(photo)}
                                                disabled={uploading}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button type="submit" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Save Changes'}
                    </button>
                    {message && <p className="success">{message}</p>}
                    {error && <p className="error">{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default EditRestaurant;