// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getFirestore, collection, addDoc }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// 🔥 PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyAAA0ZxHBtjtlsPNYUekb5DJCYEW-i14b8",
  authDomain: "skyhunt-e295b.firebaseapp.com",
  projectId: "skyhunt-e295b",
  storageBucket: "skyhunt-e295b.firebasestorage.app",
  messagingSenderId: "1010144044594",
  appId: "1:1010144044594:web:6e18dc8544afeb59403e2b"
};


// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// Screen Navigation
window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    document.getElementById(screenId).classList.add('active');
};


// Signup Logic
window.signupUser = async function() {

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!name || phone.length !== 10) {
        alert('Please enter a valid name and 10-digit phone number');
        return;
    }

    try {

        await addDoc(collection(db, "players"), {
            name: name,
            phone: phone,
            itemsCollected: [],
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('playerName', name);
        localStorage.setItem('playerPhone', phone);

        showScreen('screen-warning');

    } catch (error) {

        alert('Error: ' + error.message);

    }
};


// Start Game
window.startGame = function() {

    const name = localStorage.getItem('playerName');

    document.getElementById('player-name').textContent = name;

    showScreen('screen-game');

};