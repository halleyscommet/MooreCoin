import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { calculateER } from "./utils.js";

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

let exchangeRate = 1;

async function getExchangeRate() {
  exchangeRate = await calculateER();
  return exchangeRate;
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
                                    <input type="number" class="coin-edit-input" value="${user.hour}" min="1" max="6" name="hour">
                                    <button type="button" class="coin-edit-confirm">Confirm</button>
                                </form>`;
    row.appendChild(hourCell);

    const moorecoinsCell = document.createElement("td");
    moorecoinsCell.innerHTML = `<form class="coin-edit">
                                        <input type="number" class="coin-edit-input" value="${user.moorecoins}" name="moorecoins">
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
            `${user.displayName} has submitted ${user.pending} MooreCoins (${(
              user.pending * (await getExchangeRate())
            ).toFixed(1)} Extra Credit Points)`
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
          navigator.clipboard.writeText(
            (user.pending * (await getExchangeRate())).toFixed(1)
          );
          alert(
            `Copied ${(user.pending * (await getExchangeRate())).toFixed(
              1
            )} Extra Credit Points to clipboard and cleared alerts.`
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

  sortTable("hour", true);
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

  const tableHeaders = document.querySelectorAll("th");
  tableHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const column = header.id.split("-")[0];
      const sortIcon = header.querySelector(".sort-icon");
      const isAscending = sortIcon.classList.contains("asc");
      sortTable(column, !isAscending);
      updateSortIcons(header, !isAscending);
    });
  });

  const addMoorecoinsButton = document.getElementById("add-coins-button");
  if (addMoorecoinsButton) {
    addMoorecoinsButton.addEventListener("click", async () => {
      const moorecoinsInput = document.getElementById("add-coins-input");
      const selectedHour = await getSelectedHour();
      const moorecoinsAmount = parseInt(moorecoinsInput.value);

      if (isNaN(moorecoinsAmount)) {
        alert("Please enter a valid amount of MooreCoins.");
        return;
      }

      const usersInHour = await getUsersInHour(selectedHour);
      usersInHour.forEach(async (user) => {
        const newMoorecoins = user.moorecoins + moorecoinsAmount;
        await updateMoorecoins(user.id, newMoorecoins);
      });

      alert(
        `Added ${moorecoinsAmount} MooreCoins to all users in hour ${selectedHour}.`
      );
    });
  } else {
    console.error("Element with ID 'add-moorecoins-button' not found.");
  }
});

async function getSelectedHour() {
  const hourSelect = document.getElementById("hour");
  return parseInt(hourSelect.value);
}

async function getUsersInHour(hour) {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("hour", "==", hour));
  const querySnapshot = await getDocs(q);
  const users = [];
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() });
  });
  return users;
}

function sortTable(column, ascending) {
  const tableBody = document.querySelector("tbody");
  const rows = Array.from(tableBody.querySelectorAll("tr"));
  rows.sort((a, b) => {
    let aText = a
      .querySelector(`td:nth-child(${getColumnIndex(column)})`)
      .textContent.trim();
    let bText = b
      .querySelector(`td:nth-child(${getColumnIndex(column)})`)
      .textContent.trim();

    if (column === "name") {
      aText = getLastName(aText);
      bText = getLastName(bText);
    }

    if (column === "hour") {
      aText = parseInt(a.querySelector('input[name="hour"]').value);
      bText = parseInt(b.querySelector('input[name="hour"]').value);
      return ascending ? aText - bText : bText - aText;
    }

    if (column === "moorecoins") {
      aText = parseInt(a.querySelector('input[name="moorecoins"]').value);
      bText = parseInt(b.querySelector('input[name="moorecoins"]').value);
      return ascending ? aText - bText : bText - aText;
    }

    return ascending ? aText.localeCompare(bText) : bText.localeCompare(aText);
  });
  rows.forEach((row) => tableBody.appendChild(row));
}

function getLastName(fullName) {
  const nameParts = fullName.split(" ");
  return nameParts[nameParts.length - 1];
}

function getColumnIndex(column) {
  switch (column) {
    case "name":
      return 1;
    case "hour":
      return 3;
    case "moorecoins":
      return 4;
    case "alert":
      return 5;
    default:
      return 3;
  }
}

function updateSortIcons(header, ascending) {
  const sortIcons = document.querySelectorAll(".sort-icon");
  sortIcons.forEach((icon) => icon.classList.remove("asc", "desc"));
  const sortIcon = header.querySelector(".sort-icon");
  sortIcon.classList.add(ascending ? "asc" : "desc");
}
