import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

document.getElementById("signin-button").addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with popup:", error);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDoc);

    if (!docSnap.exists()) {
      var hour = prompt("Please enter the hour you have with Mr. Moore");
      if (!hour) {
        console.log("User did not enter an hour.");
        hour = 0;
      }
      await setDoc(userDoc, {
        profilePicture: user.photoURL,
        displayName: user.displayName,
        email: user.email,
        moorecoins: 1,
        hour: parseInt(hour),
        admin: false,
        pending: 0,
      });
      console.log("User document created.");
      window.location.href = "./studentpanel/";
    } else {
      const userData = docSnap.data();
      if (userData.admin) {
        console.log("User is an admin.");
        window.location.href = "./adminpanel/";
      } else {
        console.log("User is not an admin.");
        window.location.href = "./studentpanel/";
      }
    }
  } else {
    console.log("No user signed in.");
  }
});
