const firebaseAdmin = require('firebase-admin');
// require('dotenv').config();

if (!firebaseAdmin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
    });
}

const db = firebaseAdmin.firestore();

module.exports = { db, firebaseAdmin };