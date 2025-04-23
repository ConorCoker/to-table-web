const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendOrderNotification = functions.https.onCall(async (data) => {
    const { restaurantId, roleId, itemName, cartItemsCount, cartTotal } = data.data;
    const message = {
        notification: {
            title: "New Order for Preparation",
            body: `Prepare ${itemName} (Qty: ${cartItemsCount}). Total cart value: $${cartTotal.toFixed(2)}`,
        },
        topic: `restaurant_${restaurantId}_role_${roleId}`,
    };

    console.log("Sending notification to Android with topic:", message.topic);
    console.log("Notification message attempting to send to Android:", message);

    try {
        await admin.messaging().send(message);
        console.log("Notification sent to Android successfully!");
        return { success: true, message: "Notification sent to Android successfully" };
    } catch (error) {
        console.error("Error sending notification to Android:", error);
        throw new functions.https.HttpsError("internal", "Failed to send notification to Android");
    }
});