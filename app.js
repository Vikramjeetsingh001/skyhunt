// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ====== FIREBASE CONFIG ======
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

// ====== ITEMS ======
const items = [
  { id: 1, emoji: "🍦", name: "Ice Cream", store: "Baskin Robbins", lat: 17.2403, lng: 78.4294 },

  { id: 2, emoji: "☕", name: "Coffee", store: "Starbucks", lat: 17.2406, lng: 78.4298 },

  { id: 3, emoji: "🕶️", name: "Sunglasses", store: "Sunglass Hut", lat: 17.2410, lng: 78.4292 },

  { id: 4, emoji: "🎧", name: "Headphones", store: "Bose", lat: 17.2401, lng: 78.4301 },

  { id: 5, emoji: "📚", name: "Book", store: "WHSmith", lat: 17.2408, lng: 78.4305 },

  { id: 6, emoji: "🍫", name: "Chocolate", store: "Duty Free", lat: 17.2412, lng: 78.4299 },

  { id: 7, emoji: "👜", name: "Handbag", store: "Hidesign", lat: 17.2399, lng: 78.4296 },

  { id: 8, emoji: "⌚", name: "Watch", store: "Titan", lat: 17.2415, lng: 78.4302 },

  { id: 9, emoji: "🧴", name: "Perfume", store: "Duty Free Perfumes", lat: 17.2404, lng: 78.4307 },

  { id: 10, emoji: "🧸", name: "Teddy", store: "Hamleys", lat: 17.2418, lng: 78.4296 }
];

// ====== GLOBAL STATE ======
let collectedItems = [];

let playerDocId = null;

let mapInstance = null;

// ====== SCREEN NAVIGATION ======
window.showScreen = function(screenId) {

  document
    .querySelectorAll('.screen')
    .forEach(s => s.classList.remove('active'));

  document
    .getElementById(screenId)
    .classList.add('active');
};

// ====== SIGNUP ======
window.signupUser = async function() {

  const name =
    document.getElementById('name').value.trim();

  const phone =
    document.getElementById('phone').value.trim();

  const flightTime =
    document.getElementById('flight-time').value;

  // Validation
  if (!name || phone.length !== 10 || !flightTime) {

    alert('Please enter valid details');

    return;
  }

  try {

    // Save to Firebase
    const docRef = await addDoc(
      collection(db, "players"),
      {
        name: name,
        phone: phone,
        flightTime: flightTime,
        itemsCollected: [],
        createdAt: new Date().toISOString()
      }
    );

    // Save locally
    localStorage.setItem(
      'playerName',
      name
    );

    localStorage.setItem(
      'playerPhone',
      phone
    );

    localStorage.setItem(
      'playerFlightTime',
      flightTime
    );

    localStorage.setItem(
      'playerDocId',
      docRef.id
    );

    showScreen('screen-warning');

  } catch (error) {

    alert('Error: ' + error.message);
  }
};

// ====== START GAME ======
window.startGame = function() {

  const name =
    localStorage.getItem('playerName');

  playerDocId =
    localStorage.getItem('playerDocId');

  document.getElementById(
    'player-name'
  ).textContent = name;

  showScreen('screen-game');

  setTimeout(() => {

    initMap();

    renderItemsList();

    updateProgress();

    startFlightCountdown();

  }, 300);
};

// ====== MAP ======
function initMap() {

  if (mapInstance) {
    mapInstance.remove();
  }

  mapInstance =
    L.map('map')
    .setView([17.2408, 78.4299], 17);

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }
  ).addTo(mapInstance);

  // Add markers
  items.forEach(item => {

    const isCollected =
      collectedItems.includes(item.id);

    const icon = L.divIcon({
      className:
        'custom-marker' +
        (isCollected ? ' collected' : ''),

      html: item.emoji,

      iconSize: [38, 38],

      iconAnchor: [19, 19]
    });

    const marker = L.marker(
      [item.lat, item.lng],
      { icon: icon }
    ).addTo(mapInstance);

    marker.bindPopup(`
      <div style="text-align:center; font-family:Arial;">
        <div style="font-size:32px;">
          ${item.emoji}
        </div>

        <strong>
          ${item.name}
        </strong><br>

        <small>
          Near: ${item.store}
        </small><br>

        <small style="color:${isCollected ? 'green' : '#888'};">
          ${isCollected
            ? '✅ Collected'
            : '🔒 Walk here & open camera'}
        </small>
      </div>
    `);
  });
}

// ====== RENDER ITEMS ======
function renderItemsList() {

  const container =
    document.getElementById('items-container');

  container.innerHTML = '';

  items.forEach(item => {

    const div =
      document.createElement('div');

    div.className =
      'item-icon' +
      (collectedItems.includes(item.id)
        ? ' collected'
        : '');

    div.textContent = item.emoji;

    div.title = item.name;

    container.appendChild(div);
  });
}

// ====== PROGRESS ======
function updateProgress() {

  const count =
    collectedItems.length;

  const percent =
    (count / 10) * 100;

  document.getElementById(
    'progress-text'
  ).textContent = `${count}/10`;

  document.getElementById(
    'progress-bar'
  ).style.width = percent + '%';
}

// ====== FLIGHT COUNTDOWN ======

let countdownInterval = null;

function startFlightCountdown() {

  const timerEl =
    document.getElementById('flight-timer');

  const storedFlightTime =
    localStorage.getItem('playerFlightTime');

  if (!storedFlightTime || !timerEl) return;

  function updateCountdown() {

    const now = new Date();

    const [hours, minutes] =
      storedFlightTime.split(':');

    // Today's flight time
    let flightDate = new Date();

    flightDate.setHours(hours);

    flightDate.setMinutes(minutes);

    flightDate.setSeconds(0);

    // If passed today -> tomorrow
    if (flightDate < now) {

      flightDate.setDate(
        flightDate.getDate() + 1
      );
    }

    const diffMs =
      flightDate - now;

    // If passed
    if (diffMs <= 0) {

      timerEl.innerHTML =
        '🕒 00:00:00 left for departure';

      timerEl.classList.remove('safe');

      timerEl.classList.add('warning');

      return;
    }

    // Convert to HH:MM:SS
    const totalSeconds =
      Math.floor(diffMs / 1000);

    const hrs =
      Math.floor(totalSeconds / 3600);

    const mins =
      Math.floor((totalSeconds % 3600) / 60);

    const secs =
      totalSeconds % 60;

    const formatted =
      String(hrs).padStart(2, '0') + ':' +
      String(mins).padStart(2, '0') + ':' +
      String(secs).padStart(2, '0');

    timerEl.innerHTML =
      `🕒 ${formatted} left for departure`;

    // Color logic
    if (diffMs <= 45 * 60 * 1000) {

      timerEl.classList.remove('safe');

      timerEl.classList.add('warning');

    } else {

      timerEl.classList.remove('warning');

      timerEl.classList.add('safe');
    }
  }

  // First run
  updateCountdown();

  // Clear previous interval
  if (countdownInterval) {

    clearInterval(countdownInterval);
  }

  // Update every second
  countdownInterval =
    setInterval(updateCountdown, 1000);
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

      const playerRef =
        doc(db, "players", playerDocId);

      await updateDoc(playerRef, {
        itemsCollected: collectedItems
      });
    }

  } catch (e) {

    console.log(
      'Firebase update failed:',
      e
    );
  }

  initMap();

  renderItemsList();

  updateProgress();

  console.log(
    `✅ Collected: ${
      items.find(i => i.id === itemId).name
    }`
  );
};

// ============================================
// CAMERA MODE
// ============================================

let videoStream = null;

let currentNearbyItem = null;

let locationWatcherId = null;

let demoLocationActive = false;

// ====== OPEN CAMERA ======
window.openCameraMode = async function() {

  showScreen('screen-camera');

  updateCameraProgress();

  try {

    videoStream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        },
        audio: false
      });

    document.getElementById(
      'camera-video'
    ).srcObject = videoStream;

    document.getElementById(
      'status-text'
    ).textContent =
      '📡 Searching for items nearby...';

  } catch (err) {

    document.getElementById(
      'status-text'
    ).textContent =
      '⚠️ Camera permission denied. Use Demo mode!';

    console.error(
      'Camera error:',
      err
    );
  }

  startLocationTracking();
};

// ====== CLOSE CAMERA ======
window.closeCameraMode = function() {

  // Stop camera
  if (videoStream) {

    videoStream
      .getTracks()
      .forEach(track => track.stop());

    videoStream = null;
  }

  // Stop GPS
  if (locationWatcherId !== null) {

    navigator.geolocation.clearWatch(
      locationWatcherId
    );

    locationWatcherId = null;
  }

  demoLocationActive = false;

  showScreen('screen-game');
};

// ====== GPS TRACKING ======
function startLocationTracking() {

  if (!navigator.geolocation) {

    document.getElementById(
      'status-text'
    ).textContent =
      '⚠️ GPS not supported. Use Demo mode!';

    return;
  }

  locationWatcherId =
    navigator.geolocation.watchPosition(

      (pos) => {

        if (demoLocationActive) return;

        checkNearbyItems(
          pos.coords.latitude,
          pos.coords.longitude
        );
      },

      () => {

        document.getElementById(
          'status-text'
        ).textContent =
          '⚠️ Allow location access or use Demo mode';
      },

      {
        enableHighAccuracy: true,
        maximumAge: 1000
      }
    );
}

// ====== DISTANCE ======
function getDistanceMeters(
  lat1,
  lng1,
  lat2,
  lng2
) {

  const R = 6371000;

  const toRad =
    (deg) => deg * Math.PI / 180;

  const dLat =
    toRad(lat2 - lat1);

  const dLng =
    toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );
}

// ====== CHECK NEARBY ======
function checkNearbyItems(
  userLat,
  userLng
) {

  const TRIGGER_DISTANCE = 30;

  let nearest = null;

  let minDist = Infinity;

  items.forEach(item => {

    if (
      collectedItems.includes(item.id)
    ) return;

    const dist =
      getDistanceMeters(
        userLat,
        userLng,
        item.lat,
        item.lng
      );

    if (
      dist < TRIGGER_DISTANCE &&
      dist < minDist
    ) {

      minDist = dist;

      nearest = item;
    }
  });

  if (nearest) {

    showARItem(nearest);

  } else {

    hideARItem();

    document.getElementById(
      'status-text'
    ).textContent =
      '📡 Searching... Walk near a store to find items';
  }
}

// ====== SHOW ITEM ======
function showARItem(item) {

  currentNearbyItem = item;

  document.getElementById(
    'ar-emoji'
  ).textContent = item.emoji;

  document.getElementById(
    'ar-label'
  ).textContent =
    `Tap to collect ${item.name}!`;

  document.getElementById(
    'ar-item'
  ).classList.remove('hidden');

  document.getElementById(
    'status-text'
  ).textContent =
    `✨ ${item.name} found near ${item.store}! Tap it!`;
}

// ====== HIDE ITEM ======
function hideARItem() {

  currentNearbyItem = null;

  document.getElementById(
    'ar-item'
  ).classList.add('hidden');
}

// ====== COLLECT CURRENT ======
window.collectCurrentItem =
async function() {

  if (!currentNearbyItem) return;

  const item = currentNearbyItem;

  await collectItem(item.id);

  showSuccessPopup(item);

  hideARItem();

  updateCameraProgress();

  // Rewards
  if (collectedItems.length === 5) {

    setTimeout(() => {

      alert(
        '🎉 5 items collected! You unlocked 2 coupons!'
      );

    }, 1500);
  }

  if (collectedItems.length === 10) {

    setTimeout(() => {

      alert(
        '🏆 ALL 10 collected! You unlocked 4 exclusive coupons!'
      );

      closeCameraMode();

    }, 1500);
  }
};

// ====== CAMERA PROGRESS ======
function updateCameraProgress() {

  document.getElementById(
    'cam-progress'
  ).textContent =
    `${collectedItems.length}/10`;
}

// ====== SUCCESS POPUP ======
function showSuccessPopup(item) {

  const popup =
    document.createElement('div');

  popup.className =
    'success-popup';

  popup.innerHTML = `
    <div class="big-emoji">
      ${item.emoji}
    </div>

    <h3>
      ${item.name} Collected!
    </h3>

    <p style="color:#666;">
      from ${item.store}
    </p>
  `;

  document.body.appendChild(popup);

  setTimeout(
    () => popup.remove(),
    2000
  );
}

// ====== DEMO MODE ======
window.simulateLocation = function() {

  demoLocationActive = true;

  const nextItem =
    items.find(
      i => !collectedItems.includes(i.id)
    );

  if (!nextItem) {

    document.getElementById(
      'status-text'
    ).textContent =
      '🏆 All items collected!';

    return;
  }

  checkNearbyItems(
    nextItem.lat,
    nextItem.lng
  );

  document.getElementById(
    'status-text'
  ).textContent =
    `🎬 Demo Mode: You are near ${nextItem.store}`;
};