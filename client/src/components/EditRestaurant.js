import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
                    setLocation(data.location || '');
                    setExistingPhotos(data.photos || []);
                }
            } catch (err) {
                setError('Error fetching restaurant details');
            }
        };
        fetchRestaurantDetails();
    }, [restaurantId]);

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
            setPhotos([]); // Clear photo input
        } catch (err) {
            setError('Error updating restaurant details');
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
                    <label>Location (e.g., Dublin):</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>
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