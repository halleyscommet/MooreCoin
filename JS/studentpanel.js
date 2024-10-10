import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
      }
    }
  } else {
    console.log("No user signed in.");
    window.location.href = "../";
  }
});
