const express = require('express');
const router = express.Router();
const { db, firebaseAdmin } = require('../config/firebase');

router.post('/:restaurantId/orders', async (req, res) => {
  const { restaurantId } = req.params;
  const { orderId, items, total } = req.body;

  try {
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'orderId is required and must be a string' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and must not be empty' });
    }
    const parsedTotal = parseFloat(total);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      return res.status(400).json({ message: 'Total must be a valid non-negative number' });
    }

    for (const item of items) {
      if (!item.itemName || typeof item.itemName !== 'string') {
        return res.status(400).json({ message: 'itemName is required and must be a string' });
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        return res.status(400).json({ message: 'price is required and must be a non-negative number' });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ message: 'quantity is required and must be a positive number' });
      }
      if (item.specialRequests && typeof item.specialRequests !== 'string') {
        return res.status(400).json({ message: 'specialRequests must be a string' });
      }
    }

    const orderRef = await db.collection('restaurants').doc(restaurantId)
        .collection('orders').add({
          orderId,
          items,
          total: parsedTotal,
          timestamp: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          status: 'pending' // maybe create a class of type OrderStatus?
        });
    console.log(`Order stored in Firestore for Restaurant ${restaurantId}, Order ID: ${orderRef.id}`);

    const message = {
      notification: {
        title: 'New Order Received',
        body: `Order ${orderId} with ${items.length} items, total: $${parsedTotal.toFixed(2)}`
      },
      topic: `restaurant_${restaurantId}`,
    };
    await firebaseAdmin.messaging().send(message);
    console.log('Successfully sent order notification to Android!');
    res.status(201).json({ message: 'Order received and stored', orderId: orderRef.id });
  } catch (error) {
    console.error('Error processing order:', error.stack);
    res.status(500).json({ message: 'Error processing order', error: error.message });
  }
});

router.get('/:restaurantId/orders', async (req, res) => {
  const { restaurantId } = req.params;
  try {
    const ordersRef = db.collection('restaurants').doc(restaurantId).collection('orders');
    const snapshot = await ordersRef.orderBy('timestamp', 'desc').get();
    if (snapshot.empty) {
      return res.status(404).json({ message: `No orders found for restaurant ${restaurantId}` });
    }
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders', error: error.message });
  }
});

module.exports = router;
