const express = require('express');
const firebaseAdmin = require('firebase-admin');
const router = express.Router();

if (!firebaseAdmin.apps.length) {
  const serviceAccount = require('../config/tootable-6beb7-firebase-adminsdk-fbsvc-a71b7a7601.json');

  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
  });
}

const db = firebaseAdmin.firestore();

router.post('/', async (req, res) => {
  const { itemName, specialRequests, price } = req.body;

  try {
    const orderRef = await db.collection('orders').add({
      itemName,
      specialRequests,
      price,
      timestamp: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });

    console.log(`Order stored in Firestore with ID: ${orderRef.id}`);

    const message = {
      notification: {
        title: 'New Order Received',
        body: `Order for ${itemName} with special requests: ${specialRequests}`
      },
      topic: 'staff',
    };

    await firebaseAdmin.messaging().send(message);
    console.log('Successfully sent notification');

    res.status(201).json({ message: 'Order received and stored', orderId: orderRef.id });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ message: 'Error processing order', error });
  }
});

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('timestamp', 'desc').get();
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
