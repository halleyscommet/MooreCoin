import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { calculateER } from "./utils.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let exchangeRate = 1;

async function updateExchangeRate() {
  exchangeRate = await calculateER();
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDoc);

    if (!docSnap.exists()) {
      window.location.href = "../";
    } else {
      const userData = docSnap.data();
      if (userData.admin) {
        console.log("User is an admin.");
        window.location.href = "../adminpanel/";
      } else {
        console.log("User is not an admin.");
        const pfp = document.getElementById("profile-picture");
        const placeholder = document.getElementById("default-profile-picture");
        if (userData.profilePicture) {
          pfp.src = userData.profilePicture;
          placeholder.style.display = "none";
        } else {
          pfp.style.display = "none";
          placeholder.style.display = "block";
        }

        renderUserData(userData);

        // Set up real-time listener
        onSnapshot(userDoc, (doc) => {
          if (doc.exists()) {
            renderUserData(doc.data());
          }
        });
      }
    }
  } else {
    console.log("No user signed in.");
    window.location.href = "../";
  }
});

async function renderUserData(userData) {
  const moorecoins = document.getElementById("moorecoins");
  moorecoins.innerHTML = userData.moorecoins;

  const er = await calculateER();
  const value = document.getElementById("value");
  value.innerHTML = Number((er * userData.moorecoins).toFixed(1));

  const name = document.getElementById("name");
  name.innerHTML = userData.displayName;

  const email = document.getElementById("email");
  email.innerHTML = userData.email;
}

document.addEventListener("DOMContentLoaded", async () => {
  await updateExchangeRate();

  const moorecoinInput = document.getElementById("moorecoin-input");
  const valueInput = document.getElementById("value-input");

  // Fetch user data to get available MooreCoins
  const user = auth.currentUser;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();
  const availableMooreCoins = userData.moorecoins;

  // Set the max attribute for both inputs
  moorecoinInput.max = availableMooreCoins;
  valueInput.max = Number((availableMooreCoins * exchangeRate).toFixed(1));

  moorecoinInput.addEventListener("input", () => {
    const moorecoins = parseFloat(moorecoinInput.value);
    if (!isNaN(moorecoins)) {
      valueInput.value = Number((moorecoins * exchangeRate).toFixed(1));
    }
  });

  valueInput.addEventListener("input", () => {
    const value = parseFloat(valueInput.value);
    if (!isNaN(value)) {
      moorecoinInput.value = Number((value / exchangeRate).toFixed(1));
    }
  });

  const profilePicture = document.getElementById("profile-picture");
  const dropdown = document.getElementById("profile-dropdown");

  profilePicture.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", (event) => {
    if (
      !event.target.matches(
        "#profile-dropdown, #profile-dropdown button, #profile-dropdown p, #profile-dropdown hr"
      )
    ) {
      dropdown.classList.remove("show");
    }
  });

  const exchangeButton = document.getElementById("exchange-button");
  exchangeButton.addEventListener("click", async () => {
    const moorecoins = parseFloat(moorecoinInput.value);
    const value = parseFloat(valueInput.value);

    if (isNaN(moorecoins) || isNaN(value)) {
      alert("Please enter a valid number.");
      moorecoinInput.value = "";
      valueInput.value = "";
      return;
    }

    if (moorecoins <= 0 || value <= 0) {
      alert("Please enter a number greater than 0.");
      moorecoinInput.value = "";
      valueInput.value = "";
      return;
    }

    if (moorecoins > availableMooreCoins) {
      alert("You do not have enough MooreCoins to make this exchange.");
      moorecoinInput.value = "";
      valueInput.value = "";
      return;
    }

    if (!Number.isInteger(moorecoins)) {
      alert("Please enter a whole number of MooreCoins.");
      moorecoinInput.value = "";
      valueInput.value = "";
      return;
    }

    if (userData.pending > 0) {
      alert("You already have a pending exchange. Please wait for it to be processed.");
      moorecoinInput.value = "";
      valueInput.value = "";
      return;
    }

    updatePending(user.uid, userData.pending + moorecoins);
    updateMoorcoins(user.uid, userData.moorecoins - moorecoins);

    moorecoinInput.value = "";
    valueInput.value = "";
  });
});

async function updatePending(userId, newPending) {
  const db = getFirestore();
  const userDoc = doc(db, "users", userId);
  return updateDoc(userDoc, {
    pending: parseInt(newPending),
  });
}

async function updateMoorcoins(userId, newMoorecoins) {
  const db = getFirestore();
  const userDoc = doc(db, "users", userId);
  return updateDoc(userDoc, {
    moorecoins: parseInt(newMoorecoins),
  });
}

document.getElementById("sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../";
  } catch (error) {
    console.error("Error signing out:", error);
  }
});
