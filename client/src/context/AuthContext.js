import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [restaurantId, setRestaurantId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Fetch restaurantId from Firestore
                const restaurantDoc = await getDoc(doc(db, 'restaurants', currentUser.uid));
                if (restaurantDoc.exists()) {
                    setRestaurantId(currentUser.uid);
                    setUser(currentUser);
                } else {
                    setUser(null);
                    setRestaurantId(null);
                }
            } else {
                setUser(null);
                setRestaurantId(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, restaurantId, loading }}>
            {children}
        </AuthContext.Provider>
    );
};