// 🔥 FIREBASE INITIALIZATION (COMPAT SDK REQUIRED)
const firebaseConfig = {
  apiKey: "AIzaSyAkt1QYgycXgYLFRBLwq2Sks0F-dnPJPD0",
  authDomain: "mathdroplet.firebaseapp.com",
  projectId: "mathdroplet",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =====================
   GAME STATE
===================== */
let score = 0;
let hearts = 3;
let input = "";
let correctAnswer = 0;
let dropInterval = null;
let currentDroplet = null;
let gameStarted = false;
let isGameOver = false;   // 🔒 HARD LOCK
let kidsMode = false;
let level = 1;

/* =====================
   ELEMENTS
===================== */
const answerBox = document.getElementById("answerBox");
const gameArea = document.getElementById("gameArea");
const scoreBox = document.getElementById("score");
const heartsBox = document.querySelector(".hearts");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");
const leaderboardScreen = document.getElementById("leaderboardScreen");

const finalScore = document.getElementById("finalScore");
const kidsStatus = document.getElementById("kidsStatus");
const leaderboardList = document.getElementById("leaderboardList");

const playerNameInput = document.getElementById("playerName");
const submitBtn = document.getElementById("submitBtn");

/* =====================
   SCREEN CONTROLLER (ONLY SYSTEM)
===================== */
function showScreen(screen){
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  leaderboardScreen.classList.add("hidden");

  if (screen) {
    screen.classList.remove("hidden");
  }
}

/* =====================
   UI HELPERS
===================== */
function updateHearts(){
  heartsBox.textContent = "❤️".repeat(hearts);
}

/* =====================
   LEVEL & SPEED
===================== */
function calculateLevel(){
  level = Math.floor(score / 100) + 1;
}

function getDropSpeed(){
  return 1.6 + (level - 1) * 0.5;
}

/* =====================
   MODES
===================== */
function toggleKidsMode(){
  if(gameStarted) return;
  kidsMode = !kidsMode;
  kidsStatus.textContent = kidsMode ? "ON" : "OFF";
}

/* =====================
   START GAME
===================== */
function startGame(){
  // 🔥 HARD RESET
  clearInterval(dropInterval);
  dropInterval = null;
  currentDroplet = null;

  gameStarted = true;
  isGameOver = false;

  score = 0;
  hearts = 3;
  level = 1;
  input = "";

  scoreBox.textContent = score;
  updateHearts();

  submitBtn.disabled = false;
  playerNameInput.value = "";

  showScreen(null);
  createDroplet();
}

/* =====================
   CREATE DROPLET
===================== */
function createDroplet(){
  if (!gameStarted || isGameOver || hearts <= 0) return;

  gameArea.innerHTML = "";
  input = "";
  answerBox.textContent = "Type answer...";

  calculateLevel();

  let a, b;
  if(kidsMode){
    a = Math.floor(Math.random() * 9);
    b = Math.floor(Math.random() * (9 - a));
  } else {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
  }

  correctAnswer = a + b;

  currentDroplet = document.createElement("div");
  currentDroplet.className = "droplet";
  currentDroplet.textContent = `${a} + ${b}`;

  currentDroplet.style.left =
    level >= 4 && Math.random() < 0.5 ? "20%" :
    level >= 4 ? "80%" : "50%";

  currentDroplet.style.transform = "translateX(-50%)";
  gameArea.appendChild(currentDroplet);

  let position = -80;
  const speed = getDropSpeed();

  clearInterval(dropInterval);
  dropInterval = setInterval(() => {
    if (!gameStarted || isGameOver) {
      clearInterval(dropInterval);
      return;
    }

    position += speed;
    currentDroplet.style.top = position + "px";

    if (position > gameArea.offsetHeight) {
      clearInterval(dropInterval);
      handleWrong();
    }
  }, 16);
}

/* =====================
   INPUT
===================== */
function pressKey(num){
  if(!gameStarted || isGameOver) return;
  if(kidsMode && input.length >= 1) return;
  if(!kidsMode && input.length >= 2) return;

  input += num;
  answerBox.textContent = input;

  if (parseInt(input) === correctAnswer) {
    handleCorrect();
  } else if (kidsMode || input.length === 2) {
    handleWrong();
  }
}

function clearInput(){
  input = "";
  answerBox.textContent = "Type answer...";
}

/* =====================
   ANSWERS
===================== */
function handleCorrect(){
  if (isGameOver) return;

  score += 10;
  scoreBox.textContent = score;

  clearInterval(dropInterval);
  currentDroplet.classList.add("burst-correct");

  setTimeout(() => {
    if (!isGameOver) createDroplet();
  }, 300);
}

function handleWrong(){
  if (isGameOver) return;

  clearInterval(dropInterval);
  if (currentDroplet) currentDroplet.classList.add("burst-wrong");

  setTimeout(() => {
    if (isGameOver) return;

    hearts--;
    updateHearts();

    if (hearts <= 0) {
      isGameOver = true;
      gameStarted = false;

      gameOver();
      return;
    }

    createDroplet();
  }, 250);
}

/* =====================
   GAME OVER
===================== */
function gameOver(){
  clearInterval(dropInterval);
  finalScore.textContent = score;
  showScreen(gameOverScreen);
}

/* =====================
   RESTART
===================== */
function restartGame(){
  showScreen(startScreen);
}

/* =====================
   LEADERBOARD
===================== */
async function saveScore(){
  if (score <= 0) return;

  submitBtn.disabled = true;
  const name = playerNameInput.value.trim() || "Anonymous";

  try {
    await db.collection("leaderboard").add({
      name,
      score,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showScreen(startScreen);
  } catch (e) {
    alert("Failed to save score");
    submitBtn.disabled = false;
  }
}

async function showLeaderboard(){
  leaderboardList.innerHTML = "<li>Loading...</li>";

  try {
    const snapshot = await db
      .collection("leaderboard")
      .orderBy("score", "desc")
      .limit(20)
      .get();

    leaderboardList.innerHTML = "";
    snapshot.forEach(doc => {
      const { name, score } = doc.data();
      const li = document.createElement("li");
      li.textContent = `${name} - ${score}`;
      leaderboardList.appendChild(li);
    });

  } catch {
    leaderboardList.innerHTML = "<li>Error loading leaderboard</li>";
  }

  showScreen(leaderboardScreen);
}

function closeLeaderboard(){
  showScreen(startScreen);
}
