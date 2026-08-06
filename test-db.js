const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDrMw5gxptqdancpaoSu2Mg0_C1DcSVqn8",
  authDomain: "tnnn-aa170.firebaseapp.com",
  projectId: "tnnn-aa170",
  storageBucket: "tnnn-aa170.firebasestorage.app",
  messagingSenderId: "540085648299",
  appId: "1:540085648299:web:9451081f61c38cf45270ee",
  measurementId: "G-R2CHP04HTE"
};

async function test() {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.docs.forEach(doc => {
      console.log("User details:", JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error(err);
  }
}

test();
