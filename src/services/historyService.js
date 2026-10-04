import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import { seedHistory } from "../data/history";

// Convert Firestore history document to the format used by the dashboard
const convertHistory = (document) => {
  const data = document.data();

  return {
    id: document.id,
    assetId: data.asset_id,
    assetName: data.asset_name,
    rfidUid: data.rfid_uid,
    event: data.event,
    previousLocation: data.previous_location,
    newLocation: data.new_location,
    checkpoint: data.checkpoint,
    timestamp: data.timestamp,
    note: data.note,
  };
};

// Get tracking history from Firebase
export const getHistory = async () => {
  try {
    const snapshot = await getDocs(collection(db, "tracking_history"));

    return snapshot.docs
      .map(convertHistory)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error("Error fetching tracking history:", error);
    throw error;
  }
};

// Get one history entry
export const getHistoryById = async (historyId) => {
  try {
    const historyRef = doc(db, "tracking_history", historyId);
    const historySnapshot = await getDoc(historyRef);

    if (!historySnapshot.exists()) {
      return null;
    }

    return convertHistory(historySnapshot);
  } catch (error) {
    console.error("Error fetching history:", error);
    throw error;
  }
};

// One-time import of existing demo history into Firebase
export const seedHistoryToFirebase = async () => {
  try {
    for (const entry of seedHistory) {
      await setDoc(doc(db, "tracking_history", entry.id), {
        asset_id: entry.assetId,
        asset_name: entry.assetName,
        rfid_uid: entry.rfidUid,
        event: entry.event,
        previous_location: entry.previousLocation,
        new_location: entry.newLocation,
        checkpoint: entry.checkpoint,
        timestamp: entry.timestamp,
        note: entry.note,
      });
    }

    console.log("Tracking history seeded successfully!");
  } catch (error) {
    console.error("History seeding failed:", error);
  }
};