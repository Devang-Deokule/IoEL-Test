import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import { seedAlerts } from "../data/alerts";

// Convert Firebase alert data to the format used by the dashboard
const convertAlert = (document) => {
  const data = document.data();

  return {
    id: document.id,
    type: data.type,
    severity: data.severity,
    state: data.state,
    title: data.title,
    message: data.message,
    checkpoint: data.checkpoint,
    rfidUid: data.rfid_uid,
    assetId: data.asset_id,
    timestamp: data.timestamp,
  };
};

// Get all alerts
export const getAlerts = async () => {
  try {
    const snapshot = await getDocs(collection(db, "alerts"));

    return snapshot.docs
      .map(convertAlert)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw error;
  }
};

// Get one alert
export const getAlertById = async (alertId) => {
  try {
    const alertRef = doc(db, "alerts", alertId);
    const alertSnapshot = await getDoc(alertRef);

    if (!alertSnapshot.exists()) {
      return null;
    }

    return convertAlert(alertSnapshot);
  } catch (error) {
    console.error("Error fetching alert:", error);
    throw error;
  }
};

// Update alert state
export const updateAlertState = async (alertId, state) => {
  try {
    const alertRef = doc(db, "alerts", alertId);

    await updateDoc(alertRef, {
      state,
    });

    const updated = await getDoc(alertRef);

    return convertAlert(updated);
  } catch (error) {
    console.error("Error updating alert:", error);
    throw error;
  }
};

// One-time import of existing demo alerts into Firebase
export const seedAlertsToFirebase = async () => {
  try {
    for (const alert of seedAlerts) {
      await setDoc(doc(db, "alerts", alert.id), {
        type: alert.type,
        severity: alert.severity,
        state: alert.state,
        title: alert.title,
        message: alert.message,
        checkpoint: alert.checkpoint,
        rfid_uid: alert.rfidUid,
        asset_id: alert.assetId,
        timestamp: alert.timestamp,
      });
    }

    console.log("Alerts seeded successfully!");
  } catch (error) {
    console.error("Alert seeding failed:", error);
  }
};