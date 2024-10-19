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
import { calculateER, calculateIR } from "./utils.js";

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
  const name = document.getElementById("name");
  name.innerHTML = userData.displayName;

  const email = document.getElementById("email");
  email.innerHTML = userData.email;
}

document.addEventListener("DOMContentLoaded", async () => {
  await updateExchangeRate();
  await checkForBond();

  const buyAmount = document.getElementById("buy-amount");

  // Fetch user data to get available MooreCoins
  const user = auth.currentUser;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();
  const availableMooreCoins = userData.moorecoins;

  buyAmount.max = availableMooreCoins;

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

  const buyButton = document.getElementById("buy-submit");
  buyButton.addEventListener("click", async () => {
    const buyAmount1 = parseFloat(buyAmount.value);

    if (isNaN(buyAmount1)) {
      alert("Please enter a valid number.");
      buyAmount.value = "";
      return;
    }

    if (buyAmount1 <= 0) {
      alert("Please enter a number greater than 0.");
      buyAmount.value = "";
      return;
    }

    if (buyAmount1 > availableMooreCoins) {
      alert("You do not have enough MooreCoins to make this exchange.");
      buyAmount.value = "";
      return;
    }

    if (!Number.isInteger(buyAmount1)) {
      alert("Please enter a whole number of MooreCoins.");
      buyAmount.value = "";
      return;
    }

    if (userData.bondExpiry > new Date().getTime()) {
      alert("You already have an active bond.");
      buyAmount.value = "";
      return;
    }

    updateMoorcoins(user.uid, availableMooreCoins - buyAmount1);
    updateBonds(user.uid, buyAmount1);

    buyAmount.value = "";
  });
});

async function updateBonds(userId, newBond) {
  const db = getFirestore();
  const userDoc = doc(db, "users", userId);
  const bondInfoDiv = document.getElementById("bond-info");
  bondInfoDiv.style.display = "block";
  return updateDoc(userDoc, {
    bond: parseInt(newBond),
    bondExpiry: new Date().getTime() + 1209600000, // 14 days
    bondInterestRate: await calculateIR(),
  });
}

async function updateMoorcoins(userId, newMoorecoins) {
  const db = getFirestore();
  const userDoc = doc(db, "users", userId);
  return updateDoc(userDoc, {
    moorecoins: parseInt(newMoorecoins),
  });
}

async function checkForBond() {
  const user = auth.currentUser;
  const userRef = doc(db, "users", user.uid); // Get the DocumentReference
  const userDoc = await getDoc(userRef); // Get the DocumentSnapshot
  const userData = userDoc.data();

  if (userData.bond !== 0 && userData.bondExpiry !== 0) {
    if (userData.bondExpiry <= new Date().getTime()) {
      const claimBondsDiv = document.getElementById("claim-bonds");
      claimBondsDiv.style.display = "block";

      const claimButton = document.getElementById("claim-bonds-button");
      claimButton.addEventListener("click", async () => {
        const newMoorecoins =
          userData.moorecoins +
          userData.bond * (userData.bondInterestRate / 100);
        updateMoorcoins(user.uid, newMoorecoins);
        updateDoc(userRef, {
          // Use the DocumentReference here
          bond: 0,
          bondExpiry: 0,
          bondInterestRate: 0,
        });

        claimBondsDiv.style.display = "none";
      });
    } else if (userData.bondExpiry > new Date().getTime()) {
      const bondInfoDiv = document.getElementById("bond-info");
      bondInfoDiv.style.display = "block";

      const bondAmount = document.getElementById("bond-amount");
      bondAmount.innerHTML = `${userData.bond} MooreCoin(s)`;

      const bondExpiry = document.getElementById("bond-expiry");
      const expiryDate = new Date(userData.bondExpiry);
      const now = new Date();
      const timeDiff = expiryDate - now;

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      bondExpiry.innerHTML = `Expires on ${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" }
      )} (${days} days, ${hours} hours, ${minutes} minutes)`;

      const bondInterestRate = document.getElementById("bond-interest-rate");
      bondInterestRate.innerHTML = `${
        userData.bondInterestRate
      }% Interest Rate - Returns ${
        userData.bond * (userData.bondInterestRate / 100)
      } MooreCoins`;
    } else {
      console.log("user has no bond");
    }
  }
}

document.getElementById("sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../";
  } catch (error) {
    console.error("Error signing out:", error);
  }
});
