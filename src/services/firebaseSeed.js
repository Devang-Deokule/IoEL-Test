import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import { seedAssets } from "../data/assets";
import { seedCheckpoints } from "../data/checkpoints";

export async function seedFirebaseDatabase() {
  try {
    const seedRef = doc(db, "system", "initialSeed");
    const seedSnapshot = await getDoc(seedRef);

    if (seedSnapshot.exists()) {
      console.log("Firebase database has already been seeded.");
      return;
    }

    // Add all assets
    for (const asset of seedAssets) {
      await setDoc(doc(db, "assets", asset.id), {
        asset_name: asset.name,
        rfid_uid: asset.rfidUid,
        asset_type: asset.type,
        department: asset.department,
        current_location: asset.location,
        status: asset.status,
        last_event: asset.lastEvent,
        last_detected: asset.lastDetected,
        expected_location: asset.expectedLocation,
      });
    }

    // Add all checkpoints
    for (const checkpoint of seedCheckpoints) {
      await setDoc(doc(db, "checkpoints", checkpoint.id), {
        title: checkpoint.title,
        location: checkpoint.location,
        label: checkpoint.label,
      });
    }

    await setDoc(seedRef, {
      completed: true,
      seededAt: new Date(),
    });

    console.log("Firebase database seeded successfully!");
  } catch (error) {
    console.error("Firebase seeding failed:", error);
  }
}