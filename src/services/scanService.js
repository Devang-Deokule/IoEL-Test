import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import { db } from "../firebase";

export const postScan = async ({ rfidUid, checkpointId }) => {
  try {
    const uid = rfidUid.trim().toUpperCase();

    // --------------------------------------------------
    // 1. Find the checkpoint
    // --------------------------------------------------

    const checkpointRef = doc(db, "checkpoints", checkpointId);
    const checkpointSnapshot = await getDocs(collection(db, "checkpoints"));

    const checkpointDoc = checkpointSnapshot.docs.find(
      (document) => document.id === checkpointId
    );

    if (!checkpointDoc) {
      throw new Error("Checkpoint not found");
    }

    const checkpoint = {
      id: checkpointDoc.id,
      ...checkpointDoc.data(),
    };

    // --------------------------------------------------
    // 2. Find the asset using RFID UID
    // --------------------------------------------------

    const assetsSnapshot = await getDocs(collection(db, "assets"));

    const assetDoc = assetsSnapshot.docs.find((document) => {
      const data = document.data();

      return (
        String(data.rfid_uid || data.rfidUid || "")
          .toUpperCase() === uid
      );
    });

    // --------------------------------------------------
    // 3. Unknown RFID
    // --------------------------------------------------

    if (!assetDoc) {
      const now = new Date().toISOString();

      const historyEntry = {
        asset_id: null,
        asset_name: "Unknown tag",
        rfid_uid: uid,
        event: "ALERT",
        previous_location: null,
        new_location: null,
        checkpoint: checkpoint.label,
        timestamp: now,
        note: "Unregistered tag",
      };

      const historyRef = await addDoc(
        collection(db, "tracking_history"),
        historyEntry
      );

      const alert = {
        type: "UNKNOWN_RFID",
        severity: "critical",
        state: "new",
        title: "Unknown RFID",
        message: "An unregistered RFID tag was detected.",
        checkpoint: checkpoint.label,
        rfid_uid: uid,
        asset_id: null,
        timestamp: now,
      };

      const alertRef = await addDoc(
        collection(db, "alerts"),
        alert
      );

      return {
        event: "ALERT",
        asset: null,
        historyEntry: {
          id: historyRef.id,
          ...historyEntry,
        },
        alert: {
          id: alertRef.id,
          ...alert,
        },
      };
    }

    // --------------------------------------------------
    // 4. Valid RFID
    // --------------------------------------------------

    const asset = {
      id: assetDoc.id,
      ...assetDoc.data(),
    };

    const currentLocation =
      asset.current_location || asset.location || null;

    const lastEvent = asset.last_event || asset.lastEvent || null;

    // If the asset is already inside this checkpoint,
    // the next scan is EXIT.
    const isInsideHere =
      lastEvent === "ENTRY" &&
      currentLocation === checkpoint.location;

    const event = isInsideHere ? "EXIT" : "ENTRY";

    const previousLocation = currentLocation;

    const newLocation = isInsideHere
      ? "In Transit"
      : checkpoint.location;

    const now = new Date().toISOString();

    // --------------------------------------------------
    // 5. Update asset in Firebase
    // --------------------------------------------------

    await updateDoc(doc(db, "assets", asset.id), {
      current_location: newLocation,
      last_event: event,
      last_detected: now,
    });

    // --------------------------------------------------
    // 6. Create tracking history
    // --------------------------------------------------

    const historyEntry = {
      asset_id: asset.id,
      asset_name: asset.asset_name,
      rfid_uid: uid,
      event,
      previous_location: previousLocation,
      new_location: newLocation,
      checkpoint: checkpoint.label,
      timestamp: now,
      note: null,
    };

    const historyRef = await addDoc(
      collection(db, "tracking_history"),
      historyEntry
    );

    // --------------------------------------------------
    // 7. Unexpected movement alert
    // --------------------------------------------------

    let alert = null;

    const expectedLocation = asset.expected_location || null;

    if (
      event === "ENTRY" &&
      expectedLocation &&
      expectedLocation !== newLocation
    ) {
      const alertData = {
        type: "UNEXPECTED_MOVEMENT",
        severity: "warning",
        state: "new",
        title: "Unexpected movement",
        message: `${asset.asset_name} ${asset.id} was detected at ${newLocation} but is expected in ${expectedLocation}.`,
        checkpoint: checkpoint.label,
        rfid_uid: uid,
        asset_id: asset.id,
        timestamp: now,
      };

      const alertRef = await addDoc(
        collection(db, "alerts"),
        alertData
      );

      alert = {
        id: alertRef.id,
        ...alertData,
      };
    }

    return {
      event,
      asset: {
        id: asset.id,
        ...asset,
        current_location: newLocation,
        last_event: event,
        last_detected: now,
      },
      historyEntry: {
        id: historyRef.id,
        ...historyEntry,
      },
      alert,
    };
  } catch (error) {
    console.error("RFID scan failed:", error);
    throw error;
  }
};