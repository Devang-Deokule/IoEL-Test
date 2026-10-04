import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const convertAsset = (document) => {
  const data = document.data();

  return {
    id: document.id,

    // Firebase fields → dashboard fields
    name: data.asset_name,
    rfidUid: data.rfid_uid,
    type: data.asset_type,
    department: data.department,
    location: data.current_location,
    status: data.status,
    lastEvent: data.last_event,
    lastDetected: data.last_detected,
    expectedLocation: data.expected_location,
  };
};

// Get all assets from Firestore
export const getAssets = async () => {
  try {
    const snapshot = await getDocs(collection(db, "assets"));

    return snapshot.docs.map(convertAsset);
  } catch (error) {
    console.error("Error fetching assets:", error);
    throw error;
  }
};

// Get one asset by ID
export const getAssetById = async (assetId) => {
  try {
    const assetRef = doc(db, "assets", assetId);
    const assetSnapshot = await getDoc(assetRef);

    if (!assetSnapshot.exists()) {
      return null;
    }

    return convertAsset(assetSnapshot);
  } catch (error) {
    console.error("Error fetching asset:", error);
    throw error;
  }
};