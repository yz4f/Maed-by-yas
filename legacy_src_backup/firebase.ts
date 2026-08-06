import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDrMw5gxptqdancpaoSu2Mg0_C1DcSVqn8",
  authDomain: "tnnn-aa170.firebaseapp.com",
  projectId: "tnnn-aa170",
  storageBucket: "tnnn-aa170.firebasestorage.app",
  messagingSenderId: "540085648299",
  appId: "1:540085648299:web:9451081f61c38cf45270ee",
  measurementId: "G-R2CHP04HTE"
};

export const app = initializeApp(firebaseConfig);
export const dbFirestore = getFirestore(app);
