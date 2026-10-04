import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

// Get all checkpoints
export const getCheckpoints = async () => {
  try {
    const snapshot = await getDocs(collection(db, "checkpoints"));

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  } catch (error) {
    console.error("Error fetching checkpoints:", error);
    throw error;
  }
};

// Get one checkpoint
export const getCheckpointById = async (checkpointId) => {
  try {
    const checkpointRef = doc(db, "checkpoints", checkpointId);
    const checkpointSnapshot = await getDoc(checkpointRef);

    if (!checkpointSnapshot.exists()) {
      return null;
    }

    return {
      id: checkpointSnapshot.id,
      ...checkpointSnapshot.data(),
    };
  } catch (error) {
    console.error("Error fetching checkpoint:", error);
    throw error;
  }
};

// Activate a checkpoint
export const activateCheckpoint = async (checkpointId) => {
  try {
    const snapshot = await getDocs(collection(db, "checkpoints"));

    // Make every checkpoint inactive
    const updates = snapshot.docs.map((document) =>
      updateDoc(doc(db, "checkpoints", document.id), {
        status: document.id === checkpointId ? "active" : "inactive",
        reader: document.id === checkpointId ? "RC522 #1" : null,
      })
    );

    await Promise.all(updates);

    return getCheckpoints();
  } catch (error) {
    console.error("Error activating checkpoint:", error);
    throw error;
  }
};