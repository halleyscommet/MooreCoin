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
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getTotalMoorecoins, calculateER, calculateIR } from "./utils.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let cachedUserData = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = doc(db, "users", user.uid);
    onSnapshot(userDoc, (docSnap) => {
      if (!docSnap.exists()) {
        window.location.href = "../";
      } else {
        cachedUserData = docSnap.data();
        if (!cachedUserData.admin) {
          console.log("User is not an admin.");
          window.location.href = "../studentpanel/";
        } else {
          console.log("User is an admin.");
        }
      }
    });
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
  document.getElementById("ec").textContent = `${(er * totalMoorecoins).toFixed(
    1
  )} Extra Credit`;

  document.getElementById(
    "exchange-rate"
  ).textContent = `1 MooreCoin = ${er.toFixed(1)} Extra Credit`;

  document.getElementById(
    "interest-rate"
  ).textContent = `${await calculateIR() / 100}%`;

  document.getElementById(
    "total-users"
  ).textContent = `${totalNonAdminUsers} Students`;

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

  const supplyInput = document.getElementById("to-increase");
  const updateButton = document.getElementById("update");

  supplyInput.value = totalMoorecoins;

  updateButton.addEventListener("click", async () => {
    const newSupply = parseInt(supplyInput.value);

    console.log("Supply Input Value:", supplyInput.value);
    console.log("Parsed New Supply:", newSupply);
    console.log("User Data:", cachedUserData);
    console.log(
      "User Data MooreCoins:",
      cachedUserData ? cachedUserData.moorecoins : "undefined"
    );

    if (isNaN(newSupply)) {
      alert("Please enter a valid amount of MooreCoins.");
      return;
    }

    if (cachedUserData && cachedUserData.moorecoins !== undefined) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        moorecoins: cachedUserData.moorecoins + (newSupply - totalMoorecoins),
      });
    } else {
      alert("User data is missing MooreCoins field.");
    }

    window.location.reload();
  });
});
