import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth();

document.getElementById("sign-out").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../";
  } catch (error) {
    console.error("Error signing out:", error);
  }
});
