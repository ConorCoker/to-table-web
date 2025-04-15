const express = require('express');
const router = express.Router();
const { db, firebaseAdmin } = require('../config/firebase');

// POST /:restaurantId/menu - Add a new menu item
router.post('/:restaurantId/menu', async (req, res) => {
    const { restaurantId } = req.params;
    const { name, description, price, category } = req.body;

    // Basic validation
    if (!name || !price || !category) {
        return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    try {
        const menuItemRef = await db.collection('restaurants')
            .doc(restaurantId)
            .collection('menu')
            .add({
                name,
                description: description || '',
                price: parseFloat(price),
                category,
                timestamp: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });

        res.status(201).json({ message: 'Menu item added', itemId: menuItemRef.id });
    } catch (error) {
        console.error('Error adding menu item:', error);
        res.status(500).json({ message: 'Error adding menu item', error });
    }
});

module.exports = router;