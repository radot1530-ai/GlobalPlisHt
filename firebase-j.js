// ==========================
// IMPORT AK CONFIG FIREBASE (firebase-j.js)
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1f26ZYfvHkFWf9x1Zm6bJlrUwbXWWBfk",
    authDomain: "globalplis-9f740.firebaseapp.com",
    databaseURL: "https://globalplis-9f740-default-rtdb.firebaseio.com",
    projectId: "globalplis-9f740",
    storageBucket: "globalplis-9f740.firebasestorage.app",
    messagingSenderId: "907235331553",
    appId: "1:907235331553:web:5b13a1497f857a0fec16a0",
    measurementId: "G-R91CLS4MY8"
};

// Initialize Firebase epi EXPORT yo
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();