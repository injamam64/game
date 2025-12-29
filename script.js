// 🔥 FIREBASE INITIALIZATION
const firebaseConfig = {
  apiKey: "AIzaSyAkt1QYgycXgYLFRBLwq2Sks0F-dnPJPD0",
  authDomain: "mathdroplet.firebaseapp.com",
  projectId: "mathdroplet",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let score = 0;
let hearts = 3;
let input = "";
let correctAnswer = 0;
let dropInterval;
let dropPosition;
let currentDroplet;
let gameStarted = false;
let kidsMode = false;

// NEW
let level = 1;

const answerBox = document.getElementById("answerBox");
const gameArea = document.getElementById("gameArea");
const scoreBox = document.getElementById("score");
const heartsBox = document.querySelector(".hearts");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const kidsStatus = document.getElementById("kidsStatus");
const leaderboardScreen = document.getElementById("leaderboardScreen");
const leaderboardList = document.getElementById("leaderboardList");

/* =====================
   HEARTS
===================== */
function updateHearts(){
  heartsBox.textContent = "❤️".repeat(hearts);
}

/* =====================
   LEVEL CALCULATION
===================== */
function calculateLevel(){
  level = Math.floor(score / 100) + 1;
}

/* =====================
   DROP SPEED BY LEVEL
===================== */
function getDropSpeed(){
  return 1.6 + (level - 1) * 0.5; // speed increases per level
}

/* =====================
   KIDS MODE
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

  scoreBox.textContent = score;
  updateHearts();

  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";

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
    a = Math.floor(Math.random()*9);
    b = Math.floor(Math.random()*(9-a));
  }else{
    a = Math.floor(Math.random()*20)+1;
    b = Math.floor(Math.random()*20)+1;
  }

  correctAnswer = a + b;

  currentDroplet = document.createElement("div");
  currentDroplet.className = "droplet";
  currentDroplet.textContent = `${a} + ${b}`;

  // 🔥 LEVEL 4+: LEFT OR RIGHT DROP
  if(level >= 4){
    const side = Math.random() < 0.5 ? "left" : "right";
    currentDroplet.style.left = side === "left" ? "20%" : "80%";
    currentDroplet.style.transform = "translateX(-50%)";
  }else{
    currentDroplet.style.left = "50%";
    currentDroplet.style.transform = "translateX(-50%)";
  }

  gameArea.appendChild(currentDroplet);

  const speed = getDropSpeed();

  dropInterval = setInterval(() => {
    dropPosition += speed;
    currentDroplet.style.top = dropPosition + "px";

    if(dropPosition > gameArea.offsetHeight){
      clearInterval(dropInterval);
      handleWrong(true);
    }
  }, 16);
}

/* =====================
   KEY PRESS
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

/* =====================
   CLEAR INPUT
===================== */
function clearInput(){
  input = "";
  answerBox.textContent = "Type answer...";
}

/* =====================
   CORRECT
===================== */
function handleCorrect(){
  score += 10;
  scoreBox.textContent = score;

  clearInterval(dropInterval);
  currentDroplet.classList.add("burst-correct");

  setTimeout(createDroplet, 300);
}

/* =====================
   WRONG / MISSED
===================== */
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
  gameOverScreen.style.display = "flex";
}

/* =====================
   RESTART
===================== */
function restartGame(){
  gameOverScreen.style.display = "none";
  startScreen.style.display = "flex";
}

/* =====================
   LEADERBOARD (LOCAL)
===================== */
async function saveScore(){
  const name =
    document.getElementById("playerName").value.trim() || "Anonymous";

  try {
    await db.collection("leaderboard").add({
      name: name,
      score: score,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("playerName").value = "";
    showLeaderboard();
  } catch (e) {
    alert("Failed to save score. Check internet.");
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
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = `${data.name} - ${data.score}`;
      leaderboardList.appendChild(li);
    });

  } catch (e) {
    leaderboardList.innerHTML = "<li>Failed to load leaderboard</li>";
  }

  leaderboardScreen.style.display = "flex";
  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";
}


function closeLeaderboard(){
  leaderboardScreen.style.display = "none";
  startScreen.style.display = "flex";
}
