const express = require('express');
const { db } = require('../config/firebase');
const router = express.Router();

// GET /restaurants - Fetch all restaurants (public)
router.get('/restaurants', async (req, res) => {
    try {
        const restaurantsRef = db.collection('restaurants');
        const snapshot = await restaurantsRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No restaurants found' });
        }

        const restaurants = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json(restaurants);
    } catch (error) {
        console.error('Error retrieving restaurants:', error);
        res.status(500).json({ message: 'Error retrieving restaurants', error });
    }
});

module.exports = router;