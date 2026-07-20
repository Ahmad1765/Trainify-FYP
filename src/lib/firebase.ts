// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCRh6pWku8NKqOcLit0XO0kJHBo3NZePQk",
  authDomain: "trainify-6e4f3.firebaseapp.com",
  projectId: "trainify-6e4f3",
  storageBucket: "trainify-6e4f3.appspot.com",
  messagingSenderId: "385251908885",
  appId: "1:385251908885:web:6b83fc7d1ee014b7d79d1c",
  measurementId: "G-DGX9W0527X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
