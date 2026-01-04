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
let scoreSubmitted = false;

/* =====================
   ELEMENTS
===================== */
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
const playerNameInput = document.getElementById("playerName");
const submitBtn = document.getElementById("submitBtn");

/* =====================
   UI HELPERS
===================== */
function showScreen(screen){
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  leaderboardScreen.classList.add("hidden");

  if (screen) {
    screen.classList.remove("hidden");
    screen.style.display = "flex";
  }
}


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
  scoreSubmitted = false;

  scoreBox.textContent = score;
  updateHearts();

  if(submitBtn) submitBtn.disabled = false;
  if(playerNameInput) playerNameInput.value = "";

  startScreen.style.display = "none";
gameOverScreen.style.display = "none";
leaderboardScreen.style.display = "none";

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

  if(level >= 4){
    currentDroplet.style.left = Math.random() < 0.5 ? "20%" : "80%";
  }else{
    currentDroplet.style.left = "50%";
  }

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
   ANSWER HANDLERS
===================== */
functionfunction handleCorrect(){
  const points = kidsMode ? 5 : 10;   // 👈 CHANGE HERE

  score += points;
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
   LEADERBOARD (GLOBAL)
===================== */
async function saveScore(){
  if (score <= 0) {
    alert("Score is zero");
    return;
  }

  const name = playerNameInput.value.trim() || "Anonymous";
  submitBtn.disabled = true;

  try {
    await db.collection("leaderboard").add({
      name: name,
      score: score,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // ✅ GO TO HOME AFTER SUBMIT
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
      .limit(40)
      .get();

    leaderboardList.innerHTML = "";

    let rank = 1;

    snapshot.forEach(doc => {
      const { name, score } = doc.data();
      const li = document.createElement("li");

      li.classList.add("leaderboard-item");

      if(rank === 1) li.classList.add("gold");
      else if(rank === 2) li.classList.add("silver");
      else if(rank === 3) li.classList.add("bronze");

      li.innerHTML = `
        <span class="rank">${rank}</span>
        <span class="player-name">${name}</span>
        <span class="player-score">${score}</span>
      `;

      leaderboardList.appendChild(li);
      rank++;
      

    });

  } catch (e) {
    leaderboardList.innerHTML = "<li>Error loading leaderboard</li>";
  }

  showScreen(leaderboardScreen);
   requestAnimationFrame(() => {
    leaderboardScreen.scrollTop = 0;
    leaderboardList.scrollTop = 0;
  });
}


function closeLeaderboard(){
  showScreen(startScreen);
}
