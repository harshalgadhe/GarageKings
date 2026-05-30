import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, writeBatch, getDoc, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

export const isFirebaseConfigured = requiredKeys.every(key => !!import.meta.env[key]);

let app, db, storage, auth;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase init error:", error);
  }
}

export { auth };

function checkFirebase() {
  if (!isFirebaseConfigured) {
    const missing = requiredKeys.filter(key => !import.meta.env[key]);
    throw new Error(`Firebase not configured! Missing: ${missing.join(', ')}. If you are on a different machine, make sure to copy your .env file.`);
  }
  if (!db) {
    throw new Error("Firebase initialized but Firestore is unavailable. Check your console for errors.");
  }
}

export async function getGlobalSettings() {
  checkFirebase();
  try {
    const docRef = doc(db, 'settings', 'global');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return { showPrices: false };
  } catch (e) {
    console.error("Error fetching settings:", e);
    return { showPrices: false };
  }
}

export async function updateGlobalSettings(settings) {
  checkFirebase();
  const docRef = doc(db, 'settings', 'global');
  await setDoc(docRef, settings, { merge: true });
}

export async function getCars() {
  checkFirebase();
  try {
    const carsCol = collection(db, 'cars');
    const carSnapshot = await getDocs(carsCol);
    const carList = carSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort them if we have an order index
    return carList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  } catch (e) {
    console.error("Error fetching cars:", e);
    return [];
  }
}

export async function addCar(car) {
  checkFirebase();
  const cars = await getCars();
  const newOrderIndex = cars.length > 0 ? Math.max(...cars.map(c => c.orderIndex || 0)) + 1 : 0;
  
  const docRef = await addDoc(collection(db, 'cars'), {
    ...car,
    orderIndex: newOrderIndex,
    createdAt: new Date().toISOString()
  });
  
  return { id: docRef.id, ...car, orderIndex: newOrderIndex };
}

export async function updateCar(id, updatedFields) {
  checkFirebase();
  const carRef = doc(db, 'cars', id);
  await updateDoc(carRef, updatedFields);
  return { id, ...updatedFields };
}

export async function deleteCar(id) {
  checkFirebase();
  const carRef = doc(db, 'cars', id);
  await deleteDoc(carRef);
}

export async function updateCarOrder(newCarsArray) {
  checkFirebase();
  const batch = writeBatch(db);
  newCarsArray.forEach((car, index) => {
    const carRef = doc(db, 'cars', car.id);
    batch.update(carRef, { orderIndex: index });
  });
  await batch.commit();
}

// Bidding Functions
export async function addBid(carId, bidData) {
  checkFirebase();
  const bidsRef = collection(db, 'cars', carId, 'bids');
  const docRef = await addDoc(bidsRef, {
    ...bidData,
    amount: Number(bidData.amount), // Ensure it's a number for ordering
    timestamp: new Date().toISOString()
  });
  return docRef.id;
}

export async function getBids(carId) {
  checkFirebase();
  const bidsRef = collection(db, 'cars', carId, 'bids');
  const q = query(bidsRef, orderBy('amount', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function listenToTopBid(carId, callback) {
  if (!isFirebaseConfigured) return () => {};
  const bidsRef = collection(db, 'cars', carId, 'bids');
  const q = query(bidsRef, orderBy('amount', 'desc'), limit(1));
  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      callback({ id: snap.docs[0].id, ...snap.docs[0].data() });
    } else {
      callback(null);
    }
  });
}

export function listenToBidCount(carId, callback) {
  if (!isFirebaseConfigured) return () => {};
  const bidsRef = collection(db, 'cars', carId, 'bids');
  return onSnapshot(bidsRef, (snap) => {
    callback(snap.size);
  });
}

export function listenToRecentBids(carId, callback, count = 5) {
  if (!isFirebaseConfigured) return () => {};
  const bidsRef = collection(db, 'cars', carId, 'bids');
  const q = query(bidsRef, orderBy('amount', 'desc'), limit(count));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ─── Standalone Auction Functions ───────────────────────────────────
export async function getAuctions() {
  checkFirebase();
  try {
    const col = collection(db, 'auctions');
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } catch (e) {
    console.error('Error fetching auctions:', e);
    return [];
  }
}

export async function addAuction(auction) {
  checkFirebase();
  const docRef = await addDoc(collection(db, 'auctions'), {
    ...auction,
    createdAt: new Date().toISOString()
  });
  return { id: docRef.id, ...auction };
}

export async function updateAuction(id, fields) {
  checkFirebase();
  await updateDoc(doc(db, 'auctions', id), fields);
}

export async function deleteAuction(id) {
  checkFirebase();
  await deleteDoc(doc(db, 'auctions', id));
}

export async function addAuctionBid(auctionId, bidData) {
  checkFirebase();
  const ref = collection(db, 'auctions', auctionId, 'bids');
  const docRef = await addDoc(ref, {
    ...bidData,
    amount: Number(bidData.amount),
    timestamp: new Date().toISOString()
  });
  return docRef.id;
}

export async function getAuctionBids(auctionId) {
  checkFirebase();
  const ref = collection(db, 'auctions', auctionId, 'bids');
  const q = query(ref, orderBy('amount', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function listenToAuctionTopBid(auctionId, callback) {
  if (!isFirebaseConfigured) return () => {};
  const ref = collection(db, 'auctions', auctionId, 'bids');
  const q = query(ref, orderBy('amount', 'desc'), limit(1));
  return onSnapshot(q, (snap) => {
    callback(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
  });
}

export function listenToAuctionBidCount(auctionId, callback) {
  if (!isFirebaseConfigured) return () => {};
  const ref = collection(db, 'auctions', auctionId, 'bids');
  return onSnapshot(ref, (snap) => callback(snap.size));
}

export function listenToAuctionRecentBids(auctionId, callback, count = 10) {
  if (!isFirebaseConfigured) return () => {};
  const ref = collection(db, 'auctions', auctionId, 'bids');
  const q = query(ref, orderBy('amount', 'desc'), limit(count));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Uploads an image. If VITE_IMGBB_API_KEY is provided, it uses ImgBB (bypassing Firebase billing).
 * Otherwise, it attempts to use Firebase Cloud Storage.
 */
export async function uploadImageToStorage(file) {
  checkFirebase();
  if (!file) return null;

  // Use ImgBB if the API key is available (No credit card required)
  const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (imgbbKey) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || "ImgBB upload failed");
    }
  }
  
  // Fallback to Firebase Storage (Requires Blaze plan / Credit Card)
  const filename = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `vault-images/${filename}`);
  
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

// Fallback for file to base64 if needed, but we should use uploadImageToStorage
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Receipt Management Functions
export async function getReceipts() {
  checkFirebase();
  try {
    const col = collection(db, 'receipts');
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    console.error('Error fetching receipts:', e);
    return [];
  }
}

export async function addReceipt(receipt) {
  checkFirebase();
  const docRef = await addDoc(collection(db, 'receipts'), {
    ...receipt,
    createdAt: new Date().toISOString()
  });
  return { id: docRef.id, ...receipt };
}

export async function deleteReceipt(id) {
  checkFirebase();
  await deleteDoc(doc(db, 'receipts', id));
}
