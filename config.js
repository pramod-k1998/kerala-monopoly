// 1. Go to https://console.firebase.google.com -> Add project (free "Spark" plan is enough).
// 2. In the project, open Build > Realtime Database > Create Database (start in test mode for now).
// 3. In Project settings > General > Your apps, add a "Web app" and copy the config below.
// 4. Paste your own values here. Do NOT commit real keys to a public repo if you mind them being
//    visible — Realtime Database keys are safe to expose publicly as long as you set proper
//    Database Rules (see README.md "Securing your database").

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNS0LIyslMEAoLqkfIA9BoGGv3cGAu0CI",
  authDomain: "kerala-monopoly.firebaseapp.com",
  databaseURL: "https://kerala-monopoly-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kerala-monopoly",
  storageBucket: "kerala-monopoly.firebasestorage.app",
  messagingSenderId: "459216447886",
  appId: "1:459216447886:web:d8d9ade935f7ea05b99cdf",
  measurementId: "G-BB51151HV3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);