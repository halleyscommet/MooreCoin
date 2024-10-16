import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getTotalMoorecoins, calculateER } from "./utils.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDoc);

    if (!docSnap.exists()) {
      window.location.href = "../";
    } else {
      const userData = docSnap.data();
      if (!userData.admin) {
        console.log("User is not an admin.");
        window.location.href = "../studentpanel/";
      } else {
        console.log("User is an admin.");
      }
    }
  } else {
    console.log("No user signed in.");
    window.location.href = "../";
  }
});

async function getTotalNonAdminUsers() {
  const usersCollection = collection(db, "users");
  const nonAdminQuery = query(usersCollection, where("admin", "==", false));
  const querySnapshot = await getDocs(nonAdminQuery);
  return querySnapshot.size;
}

async function getUsersWithPending() {
  const usersCollection = collection(db, "users");
  const pendingQuery = query(usersCollection, where("pending", ">", 0));
  const querySnapshot = await getDocs(pendingQuery);

  const users = [];
  querySnapshot.forEach((doc) => {
    users.push(doc.data());
  });

  return users;
}

document.addEventListener("DOMContentLoaded", async () => {
  const totalMoorecoins = await getTotalMoorecoins();
  const er = await calculateER();
  const totalNonAdminUsers = await getTotalNonAdminUsers();
  const usersWithPending = await getUsersWithPending();
  const userCount = usersWithPending.length;

  document.getElementById(
    "total-moorecoins"
  ).textContent = `${totalMoorecoins} MooreCoins`;
  document.getElementById("ec").textContent = `${
    er.toFixed(1) * totalMoorecoins
  } Extra Credit`;

  document.getElementById("exchange-rate").textContent = `1 MooreCoin = ${er.toFixed(1)} Extra Credit`;

  document.getElementById("total-users").textContent = `${totalNonAdminUsers} Students`;

  if (userCount > 1) {
    document.getElementById("alert").textContent = `${userCount} Alerts`;
  } else if (userCount === 1) {
    document.getElementById("alert").textContent = `${userCount} Alert`;
  } else {
    document.getElementById("alert").textContent = "No Alerts";
  }

  const alertList = document.getElementById("alert-list");
  usersWithPending.forEach((user) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${user.displayName}`;
    alertList.appendChild(listItem);
  });
});