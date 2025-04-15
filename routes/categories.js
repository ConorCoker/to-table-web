const express = require('express');
const { db, firebaseAdmin } = require('../config/firebase'); // Add firebaseAdmin
const router = express.Router();

// POST /:restaurantId/categories - Add a new category
router.post('/:restaurantId/categories', async (req, res) => {
    const { restaurantId } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const categoryRef = await db.collection('restaurants')
            .doc(restaurantId)
            .collection('categories')
            .add({
                name,
                timestamp: firebaseAdmin.firestore.FieldValue.serverTimestamp(), // Fix here
            });

        res.status(201).json({ message: 'Category added', categoryId: categoryRef.id });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Error adding category', error });
    }
});

// GET /:restaurantId/categories - Get all categories for a restaurant
router.get('/:restaurantId/categories', async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const categoriesRef = db.collection('restaurants').doc(restaurantId).collection('categories');
        const snapshot = await categoriesRef.orderBy('timestamp', 'asc').get();

        if (snapshot.empty) {
            return res.status(404).json({ message: `No categories found for restaurant ${restaurantId}` });
        }

        const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.get('name'),
        }));

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error retrieving categories:', error);
        res.status(500).json({ message: 'Error retrieving categories', error });
    }
});

module.exports = router;