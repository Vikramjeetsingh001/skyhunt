// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, getDocs, query, where } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 KEEP YOUR FIREBASE CONFIG (don't change)
const firebaseConfig = {
  apiKey: "AIzaSyAAA0ZxHBtjtlsPNYUekb5DJCYEW-i14b8",
  authDomain: "skyhunt-e295b.firebaseapp.com",
  projectId: "skyhunt-e295b",
  storageBucket: "skyhunt-e295b.firebasestorage.app",
  messagingSenderId: "1010144044594",
  appId: "1:1010144044594:web:6e18dc8544afeb59403e2b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====== 10 ITEMS DATA ======
const items = [
  { id: 1, emoji: "🍦", name: "Ice Cream",  store: "Baskin Robbins",   lat: 17.2403, lng: 78.4294 },
  { id: 2, emoji: "☕", name: "Coffee",     store: "Starbucks",        lat: 17.2406, lng: 78.4298 },
  { id: 3, emoji: "🕶️", name: "Sunglasses", store: "Sunglass Hut",     lat: 17.2410, lng: 78.4292 },
  { id: 4, emoji: "🎧", name: "Headphones", store: "Bose",             lat: 17.2401, lng: 78.4301 },
  { id: 5, emoji: "📚", name: "Book",       store: "WHSmith",          lat: 17.2408, lng: 78.4305 },
  { id: 6, emoji: "🍫", name: "Chocolate",  store: "Duty Free",        lat: 17.2412, lng: 78.4299 },
  { id: 7, emoji: "👜", name: "Handbag",    store: "Hidesign",         lat: 17.2399, lng: 78.4296 },
  { id: 8, emoji: "⌚", name: "Watch",      store: "Titan",            lat: 17.2415, lng: 78.4302 },
  { id: 9, emoji: "🧴", name: "Perfume",    store: "Duty Free Perfumes", lat: 17.2404, lng: 78.4307 },
  { id: 10, emoji: "🧸", name: "Teddy",     store: "Hamleys",          lat: 17.2418, lng: 78.4296 }
];

// ====== GLOBAL STATE ======
let collectedItems = [];
let playerDocId = null;
let mapInstance = null;

// ====== SCREEN NAVIGATION ======
window.showScreen = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
};

// ====== SIGNUP ======
window.signupUser = async function() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!name || phone.length !== 10) {
    alert('Please enter a valid name and 10-digit phone number');
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "players"), {
      name: name,
      phone: phone,
      itemsCollected: [],
      createdAt: new Date().toISOString()
    });

    localStorage.setItem('playerName', name);
    localStorage.setItem('playerPhone', phone);
    localStorage.setItem('playerDocId', docRef.id);

    showScreen('screen-warning');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// ====== START GAME (loads map + items) ======
window.startGame = function() {
  const name = localStorage.getItem('playerName');
  playerDocId = localStorage.getItem('playerDocId');
  document.getElementById('player-name').textContent = name;
  showScreen('screen-game');

  // Small delay so map can render properly
  setTimeout(() => {
    initMap();
    renderItemsList();
    updateProgress();
  }, 300);
};

// ====== INITIALIZE MAP ======
function initMap() {
  // Hyderabad RGIA Airport coordinates
  if (mapInstance) {
    mapInstance.remove();
  }

  mapInstance = L.map('map').setView([17.2408, 78.4299], 17);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance);

  // Add markers for all 10 items
  items.forEach(item => {
    const isCollected = collectedItems.includes(item.id);

    const icon = L.divIcon({
      className: 'custom-marker' + (isCollected ? ' collected' : ''),
      html: item.emoji,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const marker = L.marker([item.lat, item.lng], { icon: icon }).addTo(mapInstance);

    marker.bindPopup(`
      <div style="text-align:center; font-family:Arial;">
        <div style="font-size:32px;">${item.emoji}</div>
        <strong>${item.name}</strong><br>
        <small>Near: ${item.store}</small><br>
        <small style="color:${isCollected ? 'green' : '#888'};">
          ${isCollected ? '✅ Collected' : '🔒 Walk here & open camera'}
        </small>
      </div>
    `);
  });
}

// ====== RENDER ITEMS LIST ======
function renderItemsList() {
  const container = document.getElementById('items-container');
  container.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-icon' + (collectedItems.includes(item.id) ? ' collected' : '');
    div.textContent = item.emoji;
    div.title = item.name;
    container.appendChild(div);
  });
}

// ====== UPDATE PROGRESS BAR ======
function updateProgress() {
  const count = collectedItems.length;
  const percent = (count / 10) * 100;

  document.getElementById('progress-text').textContent = `${count}/10`;
  document.getElementById('progress-bar').style.width = percent + '%';
}

// ====== TEST FUNCTION (manually collect for Day 2 testing) ======
// You can test in browser console: collectItem(1)
window.collectItem = async function(itemId) {
  if (collectedItems.includes(itemId)) {
    console.log('Already collected!');
    return;
  }
  collectedItems.push(itemId);

  // Update Firebase
  try {
    if (playerDocId) {
      const playerRef = doc(db, "players", playerDocId);
      await updateDoc(playerRef, { itemsCollected: collectedItems });
    }
  } catch (e) {
    console.log('Firebase update failed:', e);
  }

  // Refresh UI
  initMap();
  renderItemsList();
  updateProgress();

  console.log(`✅ Collected: ${items.find(i => i.id === itemId).name}`);
};