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
let dropInterval;
let dropPosition;
let currentDroplet;
let gameStarted = false;
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
  gameStarted = true;
  score = 0;
  hearts = 3;
  level = 1;
  input = "";

  scoreBox.textContent = score;
  updateHearts();

  submitBtn.disabled = false;
  playerNameInput.value = "";

  showScreen(null); // 👈 hide all overlays
  createDroplet();
}

/* =====================
   CREATE DROPLET
===================== */
function createDroplet(){
  if(!gameStarted) return;

  gameArea.innerHTML = "";
  input = "";
  answerBox.textContent = "Type answer...";
  dropPosition = -80;

  calculateLevel();

  let a, b;
  if(kidsMode){
    a = Math.floor(Math.random() * 9);
    b = Math.floor(Math.random() * (9 - a));
  }else{
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

  const speed = getDropSpeed();

  dropInterval = setInterval(() => {
    dropPosition += speed;
    currentDroplet.style.top = dropPosition + "px";

    if(dropPosition > gameArea.offsetHeight){
      clearInterval(dropInterval);
      handleWrong();
    }
  }, 16);
}

/* =====================
   INPUT
===================== */
function pressKey(num){
  if(!gameStarted) return;
  if(kidsMode && input.length >= 1) return;
  if(!kidsMode && input.length >= 2) return;

  input += num;
  answerBox.textContent = input;

  if(parseInt(input) === correctAnswer){
    handleCorrect();
  }else if(kidsMode || input.length === 2){
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
  score += 10;
  scoreBox.textContent = score;

  clearInterval(dropInterval);
  currentDroplet.classList.add("burst-correct");

  setTimeout(createDroplet, 300);
}

function handleWrong(){
  clearInterval(dropInterval);
  currentDroplet.classList.add("burst-wrong");

  setTimeout(() => {
    hearts--;
    updateHearts();

    if(hearts <= 0){
      gameOver();
    }else{
      createDroplet();
    }
  }, 250);
}

/* =====================
   GAME OVER
===================== */
function gameOver(){
  gameStarted = false;
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
  if(score <= 0) return;

  const name = playerNameInput.value.trim() || "Anonymous";
  submitBtn.disabled = true;

  try {
    await db.collection("leaderboard").add({
      name,
      score,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showScreen(startScreen); // ✅ FIXED

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

  } catch (e) {
    leaderboardList.innerHTML = "<li>Error loading leaderboard</li>";
  }

  showScreen(leaderboardScreen);
}

function closeLeaderboard(){
  showScreen(startScreen);
}
