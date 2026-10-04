import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkFk3d8NglSkPU6Gz9wtSGK3hRgoilh-Y",
  authDomain: "hospital-asset-tracker-ac9ca.firebaseapp.com",
  projectId: "hospital-asset-tracker-ac9ca",
  storageBucket: "hospital-asset-tracker-ac9ca.firebasestorage.app",
  messagingSenderId: "110753771407",
  appId: "1:110753771407:web:8d2cc7bcfc9b5808a965fa",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);