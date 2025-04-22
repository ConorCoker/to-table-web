const express = require('express');
const { db, firebaseAdmin } = require('../config/firebase');
const router = express.Router();

// POST /:restaurantId/roles - Add a new role
router.post('/:restaurantId/roles', async (req, res) => {
    const { restaurantId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Role name is required and must be a non-empty string' });
    }

    try {
        const roleRef = await db.collection('restaurants')
            .doc(restaurantId)
            .collection('roles')
            .add({
                name: name.trim(),
                timestamp: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });

        res.status(201).json({ message: 'Role added', roleId: roleRef.id });
    } catch (error) {
        console.error('Error adding role:', error);
        res.status(500).json({ message: 'Error adding role', error: error.message });
    }
});

// GET /:restaurantId/roles - Get all roles for a restaurant
router.get('/:restaurantId/roles', async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const rolesRef = db.collection('restaurants').doc(restaurantId).collection('roles');
        const snapshot = await rolesRef.orderBy('timestamp', 'asc').get();

        if (snapshot.empty) {
            return res.status(404).json({ message: `No roles found for restaurant ${restaurantId}` });
        }

        const roles = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.get('name'),
        }));

        res.status(200).json(roles);
    } catch (error) {
        console.error('Error retrieving roles:', error);
        res.status(500).json({ message: 'Error retrieving roles', error: error.message });
    }
});

module.exports = router;