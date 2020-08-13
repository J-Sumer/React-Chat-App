import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/storage'


var firebaseConfig = {
    apiKey: "AIzaSyBure0BP9FzTNtA4sGpTc2P_qOpy1g4YTc",
    authDomain: "react-chat-app-3a44a.firebaseapp.com",
    databaseURL: "https://react-chat-app-3a44a.firebaseio.com",
    projectId: "react-chat-app-3a44a",
    storageBucket: "react-chat-app-3a44a.appspot.com",
    messagingSenderId: "197120585121",
    appId: "1:197120585121:web:e161e9888da8e1382defe0",
    measurementId: "G-MMEJGPN39P"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// firebase.analytics();

export default firebase