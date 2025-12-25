let score = 0;
let hearts = 3;
let input = "";
let correctAnswer = 0;
let dropInterval;
let dropPosition;
let currentDroplet;
let gameStarted = false;
let kidsMode = false;

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

function updateHearts(){
  heartsBox.textContent = "❤️".repeat(hearts);
}

function toggleKidsMode(){
  if(gameStarted) return;
  kidsMode = !kidsMode;
  kidsStatus.textContent = kidsMode ? "ON" : "OFF";
}

function startGame(){
  gameStarted = true;
  score = 0;
  hearts = 3;
  scoreBox.textContent = score;
  updateHearts();
  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  createDroplet();
}

function createDroplet(){
  if(!gameStarted) return;
  gameArea.innerHTML = "";
  input = "";
  answerBox.textContent = "Type answer...";
  dropPosition = -80;

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
  gameArea.appendChild(currentDroplet);

  dropInterval = setInterval(()=>{
    dropPosition += 1.6;
    currentDroplet.style.top = dropPosition + "px";
    if(dropPosition > 320){
      clearInterval(dropInterval);
      handleWrong(true);
    }
  },16);
}

function pressKey(num){
  if(!gameStarted) return;
  if(kidsMode && input.length>=1) return;
  if(!kidsMode && input.length>=2) return;

  input += num;
  answerBox.textContent = input;

  if(parseInt(input) === correctAnswer){
    handleCorrect();
  }else if(kidsMode || input.length===2){
    handleWrong();
  }
}

function clearInput(){
  input="";
  answerBox.textContent="Type answer...";
}

function handleCorrect(){
  score+=10;
  scoreBox.textContent=score;
  clearInterval(dropInterval);
  currentDroplet.classList.add("burst-correct");
  setTimeout(createDroplet,300);
}

function handleWrong(){
  clearInterval(dropInterval);
  currentDroplet.classList.add("burst-wrong");
  setTimeout(()=>{
    hearts--;
    updateHearts();
    if(hearts<=0) gameOver();
    else createDroplet();
  },300);
}

function gameOver(){
  gameStarted=false;
  finalScore.textContent=score;
  gameOverScreen.style.display="flex";
}

function restartGame(){
  gameOverScreen.style.display="none";
  startScreen.style.display="flex";
}

function saveScore(){
  const name = document.getElementById("playerName").value || "Anonymous";
  let scores = JSON.parse(localStorage.getItem("leaderboard")||"[]");
  scores.push({name,score});
  scores.sort((a,b)=>b.score-a.score);
  scores = scores.slice(0,20);
  localStorage.setItem("leaderboard",JSON.stringify(scores));
  document.getElementById("playerName").value="";
  showLeaderboard();
}

function showLeaderboard(){
  leaderboardList.innerHTML="";
  const scores = JSON.parse(localStorage.getItem("leaderboard")||"[]");
  scores.forEach(s=>{
    const li=document.createElement("li");
    li.textContent=`${s.name} - ${s.score}`;
    leaderboardList.appendChild(li);
  });
  leaderboardScreen.style.display="flex";
  startScreen.style.display="none";
  gameOverScreen.style.display="none";
}

function closeLeaderboard(){
  leaderboardScreen.style.display="none";
  startScreen.style.display="flex";
}
