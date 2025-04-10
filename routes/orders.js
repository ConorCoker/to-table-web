const express = require('express');
const firebaseAdmin = require('firebase-admin');
const router = express.Router();
require('dotenv').config();

if (!firebaseAdmin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
  });
}

const db = firebaseAdmin.firestore();

// 📌 POST /:restaurantId/orders - Add a new order for a specific restaurant
router.post('/:restaurantId/orders', async (req, res) => {
  const { restaurantId } = req.params;
  const { itemName, specialRequests, price } = req.body;

  try {
    const orderRef = await db.collection('restaurants').doc(restaurantId)
                             .collection('orders').add({
      itemName,
      specialRequests,
      price,
      timestamp: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });

    console.log(`Order stored in Firestore for Restaurant ${restaurantId}, Order ID: ${orderRef.id}`);

    const message = {
      notification: {
        title: 'New Order Received',
        body: `Order for ${itemName} with special requests: ${specialRequests}`
      },
      topic: `restaurant_${restaurantId}`, // Send notifications per restaurant
    };

    await firebaseAdmin.messaging().send(message);
    console.log('Successfully sent notification');

    res.status(201).json({ message: 'Order received and stored', orderId: orderRef.id });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ message: 'Error processing order', error });
  }
});

// 📌 GET /:restaurantId/orders - Get all orders for a specific restaurant
router.get('/:restaurantId/orders', async (req, res) => {
  const { restaurantId } = req.params;  // Extract restaurantId from the URL

  try {
    // Reference the orders subcollection inside a specific restaurant
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
    console.error('Error retrieving orders:', error);
    res.status(500).json({ message: 'Error retrieving orders', error });
  }
});

module.exports = router;
