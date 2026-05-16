import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
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

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app, db, storage, auth;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase init error", error);
  }
}

export { auth };

function checkFirebase() {
  if (!isFirebaseConfigured) {
    throw new Error("Missing Firebase Keys! Please add your Firebase configuration to the .env file.");
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
  // We use a batch write to update the orderIndex of all documents at once
  const batch = writeBatch(db);
  newCarsArray.forEach((car, index) => {
    const carRef = doc(db, 'cars', car.id);
    batch.update(carRef, { orderIndex: index });
  });
  await batch.commit();
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
