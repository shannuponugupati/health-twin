import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCqXVIdRpt_4medHEiXLngyBA-Bq8k53ek",
    authDomain: "health-twin-848c7.firebaseapp.com",
    projectId: "health-twin-848c7",
    storageBucket: "health-twin-848c7.firebasestorage.app",
    messagingSenderId: "24659077367",
    appId: "1:24659077367:web:dc82873bd5bd2a439b4bf2",
    measurementId: "G-9T5GZKCXN9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
