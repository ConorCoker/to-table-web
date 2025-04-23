const firebaseAdmin = require('firebase-admin');
// require('dotenv').config();

if (!firebaseAdmin.apps.length) {
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Private Key:', process.env.FIREBASE_PRIVATE_KEY);
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY, //no longer replace
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
    });
}

const db = firebaseAdmin.firestore();

module.exports = { db, firebaseAdmin };