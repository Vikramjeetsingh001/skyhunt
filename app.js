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
  { id: 1,  emoji: "🍦", name: "Ice Cream",   store: "Baskin Robbins",     lat: 17.2403, lng: 78.4294 },
  { id: 2,  emoji: "☕", name: "Coffee",      store: "Starbucks",          lat: 17.2406, lng: 78.4298 },
  { id: 3,  emoji: "🕶️", name: "Sunglasses",  store: "Sunglass Hut",       lat: 17.2410, lng: 78.4292 },
  { id: 4,  emoji: "🎧", name: "Headphones",  store: "Bose",               lat: 17.2401, lng: 78.4301 },
  { id: 5,  emoji: "📚", name: "Book",        store: "WHSmith",            lat: 17.2408, lng: 78.4305 },
  { id: 6,  emoji: "🍫", name: "Chocolate",   store: "Duty Free",          lat: 17.2412, lng: 78.4299 },
  { id: 7,  emoji: "👜", name: "Handbag",     store: "Hidesign",           lat: 17.2399, lng: 78.4296 },
  { id: 8,  emoji: "⌚", name: "Watch",       store: "Titan",              lat: 17.2415, lng: 78.4302 },
  { id: 9,  emoji: "🧴", name: "Perfume",     store: "Duty Free Perfumes", lat: 17.2404, lng: 78.4307 },
  { id: 10, emoji: "🧸", name: "Teddy",       store: "Hamleys",            lat: 17.2418, lng: 78.4296 }
];

// ====== GLOBAL STATE ======
let collectedItems = [];
let playerDocId = null;
let mapInstance = null;

// ✅ NEW (Step 2): Flight timer state
let flightTimerInterval = null;
const LS_FLIGHT_KEY = "skymate_flight_target_ms";

// ====== SCREEN NAVIGATION ======
window.showScreen = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
};

// ✅ NEW (Step 2): Helper — convert "HH:MM" to a target timestamp
function computeFlightTargetMs(timeStr) {
  const [hh, mm] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(),
    hh, mm, 0, 0
  );
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1); // already passed → tomorrow
  }
  return target.getTime();
}

// ✅ NEW (Step 2): Live flight countdown ticker
function startFlightTimer() {
  const valueEl = document.getElementById('flightTimeLeft');
  if (!valueEl) return;

  const pad = (n) => String(n).padStart(2, "0");

  function formatHMS(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function applyColor(ms) {
    valueEl.classList.remove("green", "amber", "red", "neutral");
    if (ms <= 0) { valueEl.classList.add("red"); return; }
    const mins = ms / 60000;
    if (mins > 60)       valueEl.classList.add("green");
    else if (mins >= 30) valueEl.classList.add("amber");
    else                 valueEl.classList.add("red");
  }

  function tick() {
    const targetMs = Number(localStorage.getItem(LS_FLIGHT_KEY));
    if (!targetMs) {
      valueEl.textContent = "--:--:--";
      valueEl.classList.add("neutral");
      return;
    }
    const remaining = targetMs - Date.now();
    valueEl.textContent = remaining > 0 ? formatHMS(remaining) : "00:00:00";
    applyColor(remaining);
  }

  if (flightTimerInterval) clearInterval(flightTimerInterval);
  tick();
  flightTimerInterval = setInterval(tick, 1000);
}

// ====== SIGNUP ======
window.signupUser = async function() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const flightTimeStr = document.getElementById('flightTime').value; // ✅ NEW

  if (!name || phone.length !== 10) {
    alert('Please enter a valid name and 10-digit phone number');
    return;
  }

  // ✅ NEW (Step 2): Flight time is mandatory
  if (!flightTimeStr) {
    alert('Please enter your Flight Departure Time.');
    return;
  }

  // ✅ NEW: Compute target timestamp (today, or tomorrow if already passed)
  const targetMs = computeFlightTargetMs(flightTimeStr);
  localStorage.setItem(LS_FLIGHT_KEY, String(targetMs));

  try {
    const docRef = await addDoc(collection(db, "players"), {
      name: name,
      phone: phone,
      flightTime: flightTimeStr,   // (stored for future use — harmless)
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
    startFlightTimer();   // ✅ NEW (Step 2)
  }, 300);
};

// ====== INITIALIZE MAP ======
function initMap() {
  if (mapInstance) { mapInstance.remove(); }
  mapInstance = L.map('map').setView([17.2408, 78.4299], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(mapInstance);

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

// ====== COLLECT ITEM ======
window.collectItem = async function(itemId) {
  if (collectedItems.includes(itemId)) {
    console.log('Already collected!');
    return;
  }
  collectedItems.push(itemId);

  try {
    if (playerDocId) {
      const playerRef = doc(db, "players", playerDocId);
      await updateDoc(playerRef, { itemsCollected: collectedItems });
    }
  } catch (e) {
    console.log('Firebase update failed:', e);
  }

  initMap();
  renderItemsList();
  updateProgress();
  console.log(`✅ Collected: ${items.find(i => i.id === itemId).name}`);
};

// ============================================
// DAY 3: CAMERA MODE + GPS + ITEM DETECTION
// ============================================
let videoStream = null;
let currentNearbyItem = null;
let locationWatcherId = null;
let demoLocationActive = false;

// 🎯 STEP 1: Open Camera Screen
window.openCameraMode = async function() {
  showScreen('screen-camera');
  updateCameraProgress();

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    document.getElementById('camera-video').srcObject = videoStream;
    document.getElementById('status-text').textContent = '📡 Searching for items nearby...';
  } catch (err) {
    document.getElementById('status-text').textContent = '⚠️ Camera permission denied. Use Demo mode!';
    console.error('Camera error:', err);
  }

  startLocationTracking();
};

// 🎯 STEP 2: Close Camera Screen
window.closeCameraMode = function() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  if (locationWatcherId !== null) {
    navigator.geolocation.clearWatch(locationWatcherId);
    locationWatcherId = null;
  }
  demoLocationActive = false;
  showScreen('screen-game');
};

// 🎯 STEP 3: Track User Location
function startLocationTracking() {
  if (!navigator.geolocation) {
    document.getElementById('status-text').textContent = '⚠️ GPS not supported. Use Demo mode!';
    return;
  }
  locationWatcherId = navigator.geolocation.watchPosition(
    (pos) => {
      if (demoLocationActive) return;
      checkNearbyItems(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      document.getElementById('status-text').textContent = '⚠️ Allow location access or use Demo mode';
    },
    { enableHighAccuracy: true, maximumAge: 1000 }
  );
}

// 🎯 STEP 4: Haversine Formula
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 🎯 STEP 5: Check if any item is nearby
function checkNearbyItems(userLat, userLng) {
  const TRIGGER_DISTANCE = 30;
  let nearest = null;
  let minDist = Infinity;

  items.forEach(item => {
    if (collectedItems.includes(item.id)) return;
    const dist = getDistanceMeters(userLat, userLng, item.lat, item.lng);
    if (dist < TRIGGER_DISTANCE && dist < minDist) {
      minDist = dist;
      nearest = item;
    }
  });

  if (nearest) {
    showARItem(nearest);
  } else {
    hideARItem();
    document.getElementById('status-text').textContent =
      '📡 Searching... Walk near a store to find items';
  }
}

// 🎯 STEP 6: Show item floating on camera
function showARItem(item) {
  currentNearbyItem = item;
  document.getElementById('ar-emoji').textContent = item.emoji;
  document.getElementById('ar-label').textContent = `Tap to collect ${item.name}!`;
  document.getElementById('ar-item').classList.remove('hidden');
  document.getElementById('status-text').textContent =
    `✨ ${item.name} found near ${item.store}! Tap it!`;
}

function hideARItem() {
  currentNearbyItem = null;
  document.getElementById('ar-item').classList.add('hidden');
}

// 🎯 STEP 7: Collect the item when tapped
window.collectCurrentItem = async function() {
  if (!currentNearbyItem) return;
  const item = currentNearbyItem;

  await collectItem(item.id);
  showSuccessPopup(item);
  hideARItem();
  updateCameraProgress();

  if (collectedItems.length === 5) {
    setTimeout(() => alert('🎉 5 items collected! You unlocked 2 coupons!'), 1500);
  }
  if (collectedItems.length === 10) {
    setTimeout(() => {
      alert('🏆 ALL 10 collected! You unlocked 4 exclusive coupons!');
      closeCameraMode();
    }, 1500);
  }
};

// 🎯 STEP 8: Update progress on camera screen
function updateCameraProgress() {
  document.getElementById('cam-progress').textContent =
    `${collectedItems.length}/10`;
}

// 🎯 STEP 9: Success Popup Animation
function showSuccessPopup(item) {
  const popup = document.createElement('div');
  popup.className = 'success-popup';
  popup.innerHTML = `
    <div class="big-emoji">${item.emoji}</div>
    <h3>${item.name} Collected!</h3>
    <p style="color:#666;">from ${item.store}</p>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2000);
}

// 🎯 STEP 10: DEMO MODE
window.simulateLocation = function() {
  demoLocationActive = true;
  const nextItem = items.find(i => !collectedItems.includes(i.id));
  if (!nextItem) {
    document.getElementById('status-text').textContent = '🏆 All items collected!';
    return;
  }
  checkNearbyItems(nextItem.lat, nextItem.lng);
  document.getElementById('status-text').textContent =
    `🎬 Demo Mode: You are near ${nextItem.store}`;
};