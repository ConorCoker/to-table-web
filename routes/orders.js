const express = require('express');
const firebaseAdmin = require('firebase-admin');
const router = express.Router();

const serviceAccount = require('../config/tootable-6beb7-firebase-adminsdk-fbsvc-a71b7a7601.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});

// POST route to receive orders
router.post('/', (req, res) => {
  const { itemName, specialRequests, price } = req.body;

  console.log(`Received order: ${itemName}, Special Requests: ${specialRequests}, Price: ${price}`);

  const message = {
    notification: {
      title: 'New Order Received',
      body: `Order for ${itemName} with special requests: ${specialRequests}`
    },
    topic: 'staff',
  };

  firebaseAdmin.messaging().send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
      res.status(200).send('Order received and notification sent');
    })
    .catch((error) => {
      console.error('Error sending message:', error);
      res.status(500).send('Error sending notification');
    });
});

module.exports = router;
