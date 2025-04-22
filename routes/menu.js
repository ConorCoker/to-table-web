const express = require('express');
const router = express.Router();
const { db, firebaseAdmin } = require('../config/firebase');

// POST /:restaurantId/menu - Add a new menu item
router.post('/:restaurantId/menu', async (req, res) => {
    const { restaurantId } = req.params;
    const { name, description, price, category, role } = req.body;

    try {
        const roleRef = db.collection('restaurants').doc(restaurantId).collection('roles').doc(role);
        const roleSnap = await roleRef.get();
        if (!roleSnap.exists) {
            return res.status(400).json({ message: 'Specified role does not exist' });
        }

        const menuItemRef = await db.collection('restaurants')
            .doc(restaurantId)
            .collection('menu')
            .add({
                name: name.trim(),
                description: description || '',
                price: parseFloat(price),
                category: category.trim(),
                role: role.trim(),
                timestamp: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });

        res.status(201).json({ message: 'Menu item added', itemId: menuItemRef.id });
    } catch (error) {
        console.error('Error adding menu item:', error);
        res.status(500).json({ message: 'Error adding menu item', error: error.message });
    }
});

module.exports = router;