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
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { calculateER } from "./utils.js";

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
  const welcome = document.getElementById("welcome-text");
  welcome.innerHTML = `Welcome, <span id="display-name">${userData.displayName}</span>!`;

  const moorecoins = document.getElementById("moorecoins");
  moorecoins.innerHTML = userData.moorecoins;

  const er = await calculateER();
  const value = document.getElementById("value");
  value.innerHTML = Number((er * userData.moorecoins).toFixed(1));

  const moorecoinValue = document.getElementById("moorecoin-value");
  moorecoinValue.innerHTML = `1 &#8776; ${Number(er.toFixed(1))}`;

  const name = document.getElementById("name");
  name.innerHTML = userData.displayName;

  const email = document.getElementById("email");
  email.innerHTML = userData.email;
}

document.addEventListener("DOMContentLoaded", () => {
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
});

document.getElementById("sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../";
  } catch (error) {
    console.error("Error signing out:", error);
  }
});

document.getElementById("exchange-moorecoins").addEventListener("click", () => {
  window.location.href = "./exchange.html";
});

document.getElementById("buy-bonds").addEventListener("click", () => {
  window.location.href = "./bonds.html";
});