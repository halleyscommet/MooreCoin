import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(window.firebaseConfig);
const db = getFirestore(app);

function setupRealTimeListener() {
  const usersCol = collection(db, "users");
  onSnapshot(usersCol, (snapshot) => {
    const userList = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
    populateTable(userList);
  });
}

function populateTable(users) {
  const tableBody = document.getElementById("users-table-body");
  tableBody.innerHTML = ""; // Clear existing table rows

  users.forEach((user) => {
    if (user.admin) {
      return;
    }

    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = user.displayName;
    row.appendChild(nameCell);

    const emailCell = document.createElement("td");
    emailCell.innerHTML = `<a href="mailto:${user.email}" target="_blank" id="email">${user.email}</a>`;
    row.appendChild(emailCell);

    const hourCell = document.createElement("td");
    hourCell.innerHTML = `  <form class="coin-edit">
                                    <input type="number" class="coin-edit-input" value="${user.hour}" min="1" max="6">
                                    <button type="button" class="coin-edit-confirm">Confirm</button>
                                </form>`;
    row.appendChild(hourCell);

    const moorecoinsCell = document.createElement("td");
    moorecoinsCell.innerHTML = `<form class="coin-edit">
                                        <input type="number" class="coin-edit-input" value="${user.moorecoins}">
                                        <button type="button" class="coin-edit-confirm">Confirm</button>
                                    </form>`;
    row.appendChild(moorecoinsCell);

    const alertCell = document.createElement("td");
    if (user.pending > 0) {
      alertCell.innerHTML = ` <form class="coin-edit">
                                        <button type="button" id="alert" class="coin-edit-confirm">Alert</button>
                                        <button type="button" id="copy" class="coin-edit-confirm">Copy</button>
                                        <button type="button" id="clear-${user.uid}" class="coin-edit-confirm">🧹</button>
                                    </form>`;
    } else {
      alertCell.textContent = "No Alerts";
    }
    row.appendChild(alertCell);

    tableBody.appendChild(row);

    // Add event listener for the confirm button
    const confirmButton = moorecoinsCell.querySelector(".coin-edit-confirm");
    confirmButton.addEventListener("click", async () => {
      const newMoorecoins =
        moorecoinsCell.querySelector(".coin-edit-input").value;
      if (user && user.uid) {
        await updateMoorecoins(user.uid, newMoorecoins);
      } else {
        console.error("User UID is undefined", user);
      }
    });

    const hourConfirmButton = hourCell.querySelector(".coin-edit-confirm");
    hourConfirmButton.addEventListener("click", async () => {
      const newHour = hourCell.querySelector(".coin-edit-input").value;
      if (user && user.uid) {
        await updateHour(user.uid, newHour);
      } else {
        console.error("User UID is undefined", user);
      }
    });

    const alertButton = alertCell.querySelector("#alert");
    if (alertButton) {
      alertButton.addEventListener("click", async () => {
        if (user && user.uid) {
          alert(
            `${user.displayName} has submitted ${user.pending} MooreCoins.`
          );
        } else {
          console.error("User UID is undefined", user);
        }
      });
    }

    const copyButton = alertCell.querySelector("#copy");
    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        if (user && user.uid) {
          navigator.clipboard.writeText(user.pending);
          alert(
            `Copied ${user.pending} MooreCoins to clipboard and cleared alerts.`
          );
          await updatePending(user.uid, 0);
        } else {
          console.error("User UID is undefined", user);
        }
      });
    }

    const clearButton = document.getElementById(`clear-${user.uid}`);
    if (clearButton) {
      clearButton.addEventListener("click", async () => {
        if (user && user.uid) {
          await updatePending(user.uid, 0);
        } else {
          console.error("User UID is undefined", user);
        }
      });
    }
  });
}

async function updateMoorecoins(userId, newMoorecoins) {
  const db = getFirestore();
  const userDoc = doc(db, "users", userId);
  await updateDoc(userDoc, {
    moorecoins: parseInt(newMoorecoins),
  });
}

async function updateHour(userId, newHour) {
  const db = getFirestore();
  const userDoc = doc(db, "users", userId);
  await updateDoc(userDoc, {
    hour: parseInt(newHour),
  });
}

async function updatePending(userId, newPending) {
  const db = getFirestore();
  const userDoc = doc(db, "users", userId);
  return updateDoc(userDoc, {
    pending: parseInt(newPending),
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupRealTimeListener();
});
