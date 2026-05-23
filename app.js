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

  // Try to start camera
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // back camera
      audio: false
    });
    document.getElementById('camera-video').srcObject = videoStream;
    document.getElementById('status-text').textContent = '📡 Searching for items nearby...';
  } catch (err) {
    document.getElementById('status-text').textContent = '⚠️ Camera permission denied. Use Demo mode!';
    console.error('Camera error:', err);
  }

  // Start GPS tracking
  startLocationTracking();
};

// 🎯 STEP 2: Close Camera Screen
window.closeCameraMode = function() {
  // Stop camera
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  // Stop GPS
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
      if (demoLocationActive) return; // skip if demo mode is on
      checkNearbyItems(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      document.getElementById('status-text').textContent = '⚠️ Allow location access or use Demo mode';
    },
    { enableHighAccuracy: true, maximumAge: 1000 }
  );
}

// 🎯 STEP 4: Calculate Distance Between Two Points (Haversine Formula)
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
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
  const TRIGGER_DISTANCE = 30; // 30 meters

  let nearest = null;
  let minDist = Infinity;

  items.forEach(item => {
    if (collectedItems.includes(item.id)) return; // skip already-collected

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

  // Use existing collectItem function from Day 2
  await collectItem(item.id);

  // Show success popup
  showSuccessPopup(item);

  // Hide item
  hideARItem();

  // Update progress display
  updateCameraProgress();

  // Check rewards
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

// 🎯 STEP 10: DEMO MODE (Simulate walking to next item)
window.simulateLocation = function() {
  demoLocationActive = true;

  // Find next uncollected item
  const nextItem = items.find(i => !collectedItems.includes(i.id));

  if (!nextItem) {
    document.getElementById('status-text').textContent = '🏆 All items collected!';
    return;
  }

  // Pretend user is right next to this item
  checkNearbyItems(nextItem.lat, nextItem.lng);
  document.getElementById('status-text').textContent =
    `🎬 Demo Mode: You are near ${nextItem.store}`;
};

// ============================================
// DAY 4: COUPONS + BOARDING TIMER + WIN
// ============================================

// --- The 4 coupons (in order of unlock) ---
const allCoupons = [
  { id: "C1", emoji: "🍦", title: "Buy 1 Get 1 Free", store: "Baskin Robbins",     category: "food",        unlockAt: 5 },
  { id: "C2", emoji: "👜", title: "10% off on ₹5000+", store: "Hidesign",          category: "fashion",     unlockAt: 5 },
  { id: "C3", emoji: "☕", title: "Free Coffee Upgrade", store: "Starbucks",        category: "food",        unlockAt: 10 },
  { id: "C4", emoji: "🧴", title: "15% off Duty-Free",  store: "Duty Free Store",  category: "dutyfree",    unlockAt: 10 }
];

let earnedCoupons = [];
let gameStartTime = null;
let boardingTimerInterval = null;

// ========== BOARDING TIMER ==========
// Patch signupUser to also save boarding time
const originalSignup = window.signupUser;
window.signupUser = async function () {
  const boarding = document.getElementById("boarding").value;
  if (!boarding) {
    alert("Please enter your boarding time");
    return;
  }
  localStorage.setItem("boardingTime", boarding);
  await originalSignup();
};

// Patch startGame to begin boarding countdown + game timer
const originalStartGame = window.startGame;
window.startGame = async function () {
  await originalStartGame();
  gameStartTime = Date.now();
  startBoardingCountdown();
  updateCouponsCount();
};

function startBoardingCountdown() {
  const boardingStr = localStorage.getItem("boardingTime"); // e.g., "18:30"
  if (!boardingStr) return;

  if (boardingTimerInterval) clearInterval(boardingTimerInterval);

  boardingTimerInterval = setInterval(() => {
    const now = new Date();
    const [hh, mm] = boardingStr.split(":").map(Number);

    const boarding = new Date();
    boarding.setHours(hh, mm, 0, 0);

    // If boarding time already passed today, treat it as next day
    let diffMs = boarding - now;
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

    const totalSec = Math.floor(diffMs / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");

    const el = document.getElementById("boarding-timer");
    if (el) {
      el.textContent = `⏰ Boarding in: ${h}:${m}:${s}`;
      // Urgent if less than 45 mins
      if (totalSec < 45 * 60) {
        el.classList.add("urgent");
      } else {
        el.classList.remove("urgent");
      }
    }
  }, 1000);
}

// ========== COUPONS LOGIC ==========

// Patch collectItem to also award coupons
const originalCollect = window.collectItem;
window.collectItem = async function (itemId) {
  await originalCollect(itemId);

  const count = collectedItems.length;
  // Unlock coupons at 5 and at 10
  if (count === 5 || count === 10) {
    awardCoupons(count);
  }

  updateCouponsCount();

  // Trigger WIN at 10
  if (count === 10) {
    setTimeout(triggerWin, 800);
  }
};

function awardCoupons(threshold) {
  const newOnes = allCoupons.filter(c =>
    c.unlockAt === threshold && !earnedCoupons.find(e => e.id === c.id)
  );

  newOnes.forEach(c => {
    earnedCoupons.push({
      ...c,
      code: generateCouponCode()
    });
  });

  // Save to Firebase
  saveCouponsToFirebase();
}

function generateCouponCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SKY-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function saveCouponsToFirebase() {
  try {
    if (playerDocId) {
      const ref = doc(db, "players", playerDocId);
      await updateDoc(ref, { coupons: earnedCoupons });
    }
  } catch (e) {
    console.warn("Could not save coupons:", e);
  }
}

function updateCouponsCount() {
  const el = document.getElementById("coupons-count");
  if (el) el.textContent = earnedCoupons.length;
}

// ========== SHOW COUPONS SCREEN ==========
window.showCouponsScreen = function () {
  showScreen("screen-coupons");
  renderCoupons();
};

function renderCoupons() {
  const list = document.getElementById("coupons-list");
  const noMsg = document.getElementById("no-coupons-msg");

  list.innerHTML = "";

  if (earnedCoupons.length === 0) {
    noMsg.style.display = "block";
    return;
  }
  noMsg.style.display = "none";

  earnedCoupons.forEach(c => {
    const div = document.createElement("div");
    div.className = `coupon ${c.category}`;
    div.innerHTML = `
      <div class="coupon-emoji">${c.emoji}</div>
      <div class="coupon-content">
        <div class="coupon-title">${c.title}</div>
        <div class="coupon-store">at ${c.store}</div>
        <div class="coupon-code">${c.code}</div>
        <div class="coupon-valid">⏰ Valid today only</div>
      </div>
    `;
    list.appendChild(div);
  });
}

// ========== WIN SCREEN ==========
function triggerWin() {
  // Stop camera if open
  if (typeof window.closeCameraMode === "function") {
    try { window.closeCameraMode(); } catch(e) {}
  }

  // Compute play time
  const elapsedMs = Date.now() - (gameStartTime || Date.now());
  const totalSec = Math.floor(elapsedMs / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");

  document.getElementById("stat-time").textContent = `${h}:${m}:${s}`;
  document.getElementById("stat-items").textContent = collectedItems.length;

  showScreen("screen-win");
  launchConfetti();
}

function launchConfetti() {
  const container = document.getElementById("confetti-container");
  if (!container) return;
  container.innerHTML = "";

  const colors = ["#f5b800", "#e91e63", "#1976d2", "#4caf50", "#ff8a00", "#000"];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2 + Math.random() * 2) + "s";
    piece.style.animationDelay = (Math.random() * 1) + "s";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
  }

  // Clear after 6s
  setTimeout(() => { container.innerHTML = ""; }, 6000);
}