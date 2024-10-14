import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(window.firebaseConfig);
const db = getFirestore(app);

async function getTotalMoorecoins() {
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  let totalMoorecoins = 0;

  usersSnapshot.forEach((doc) => {
    const userData = doc.data();
    if (userData.moorecoins) {
      totalMoorecoins += userData.moorecoins;
    }
  });

  return totalMoorecoins;
}

export async function calculateER() {
  const totalMoorecoins = await getTotalMoorecoins();
  const er =
    Math.pow(totalMoorecoins, 3) / 16464000 -
    3 * (Math.pow(totalMoorecoins, 2) / 78400) +
    totalMoorecoins / 1680 +
    5 / 2;
  return Number(er.toPrecision(2));
}
