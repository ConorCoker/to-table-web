const express = require('express');
const bodyParser = require('body-parser');
const firebaseAdmin = require('firebase-admin');
const ordersRoutes = require('./routes/orders');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const serviceAccount = require('./config/tootable-6beb7-firebase-adminsdk-fbsvc-a71b7a7601.json');

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
  });
} else {
  firebaseAdmin.app();
}

app.use('/orders', ordersRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
