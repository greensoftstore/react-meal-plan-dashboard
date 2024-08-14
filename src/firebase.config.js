import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

var firebaseConfig = {
	apiKey: 'AIzaSyCSecHSamToZRX6ZrEzix298sdHpAlCepg',
    authDomain: 'scott-8ac91.firebaseapp.com',
    databaseURL: 'https://scott-8ac91-default-rtdb.firebaseio.com',
    projectId: 'scott-8ac91',
    storageBucket: 'scott-8ac91.appspot.com',
    messagingSenderId: '403527180790',
    appId: '1:403527180790:web:37dda0fd4a3f86f8be67d7',
    measurementId: "G-DZLVV22ME3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const storage = getStorage(app);

