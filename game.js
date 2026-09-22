window.addEventListener('DOMContentLoaded', () => {
  const screens = {
    start: document.getElementById('startScreen'),
    game: document.getElementById('gameScreen'),
    transition: document.getElementById('transitionScreen'),
    final: document.getElementById('finalScreen')
  };

  const levelLabel = document.getElementById('levelLabel');
  const scoreLabel = document.getElementById('scoreLabel');
  const accuracyLabel = document.getElementById('accuracyLabel');
  const streakLabel = document.getElementById('streakLabel');
  const progressBar = document.getElementById('progressBar');
  const challengeType = document.getElementById('challengeType');
  const questionText = document.getElementById('questionText');
  const tagDisplay = document.getElementById('tagDisplay');
  const hintText = document.getElementById('hintText');
  const answers = document.getElementById('answers');
  const feedback = document.getElementById('feedback');

  let level = 1;
  let questionIndex = 0;
  let score = 0;
  let attempts = 0;
  let correct = 0;
  let streak = 0;
  let bestStreak = 0;
  let locked = false;
  let currentQuestions = [];

  const level1Pool = [
    { tag: '<h1>', type: 'Opening Tag' }, { tag: '</h1>', type: 'Closing Tag' },
    { tag: '<h2>', type: 'Opening Tag' }, { tag: '</h2>', type: 'Closing Tag' },
    { tag: '<h4>', type: 'Opening Tag' }, { tag: '</h4>', type: 'Closing Tag' },
    { tag: '<h6>', type: 'Opening Tag' }, { tag: '</h6>', type: 'Closing Tag' },
    { tag: '<ol>', type: 'Opening Tag' }, { tag: '</ol>', type: 'Closing Tag' },
    { tag: '<ul>', type: 'Opening Tag' }, { tag: '</ul>', type: 'Closing Tag' },
    { tag: '<li>', type: 'Opening Tag' }, { tag: '</li>', type: 'Closing Tag' }
  ];

  const level2Pool = [
    { q: 'Which tag creates the largest heading?', display: 'Largest Heading', correct: '<h1>', choices: ['<h1>', '<h6>', '<ul>', '<li>'] },
    { q: 'Which tag creates the smallest heading?', display: 'Smallest Heading', correct: '<h6>', choices: ['<h1>', '<h6>', '<ol>', '<li>'] },
    { q: 'Which tag creates a numbered list?', display: '1. First\n2. Second\n3. Third', correct: '<ol>', choices: ['<ol>', '<ul>', '<li>', '<h3>'] },
    { q: 'Which tag creates a bulleted list?', display: '• First\n• Second\n• Third', correct: '<ul>', choices: ['<ul>', '<ol>', '<li>', '<h2>'] },
    { q: 'Which tag defines one item inside a list?', display: 'List Item', correct: '<li>', choices: ['<li>', '<ol>', '<ul>', '<h1>'] },
    { q: 'What closing tag matches <h2>?', display: '<h2>  ...  ?', correct: '</h2>', choices: ['</h2>', '<h2>', '</h1>', '</li>'] },
    { q: 'What closing tag matches <ul>?', display: '<ul>  ...  ?', correct: '</ul>', choices: ['</ul>', '</ol>', '<ul>', '</li>'] },
    { q: 'What closing tag matches <ol>?', display: '<ol>  ...  ?', correct: '</ol>', choices: ['</ol>', '</ul>', '<ol>', '</li>'] },
    { q: 'What closing tag matches <li>?', display: '<li> Favorite Food ?', correct: '</li>', choices: ['</li>', '</ul>', '<li>', '</ol>'] },
    { q: 'Which tag would you use for a major page title?', display: 'MY WEBPAGE', correct: '<h1>', choices: ['<h1>', '<h5>', '<ol>', '<li>'] },
    { q: 'Which tag groups list items into a numbered sequence?', display: 'Numbered Sequence', correct: '<ol>', choices: ['<ol>', '<ul>', '<li>', '<h6>'] },
    { q: 'Which tag groups list items into bullets?', display: 'Bulleted Group', correct: '<ul>', choices: ['<ul>', '<ol>', '<li>', '<h4>'] }
  ];

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function escapeHTML(value) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  function startLevel(which) {
    level = which;
    questionIndex = 0;
    locked = false;
    feedback.textContent = '';
    feedback.className = 'feedback';
    currentQuestions = level === 1 ? shuffle(level1Pool).slice(0, 10) : shuffle(level2Pool).slice(0, 10);
    showScreen('game');
    renderQuestion();
  }

  function updateHUD() {
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 100;
    levelLabel.textContent = level;
    scoreLabel.textContent = score.toLocaleString();
    accuracyLabel.textContent = `${accuracy}%`;
    streakLabel.textContent = `${streak} 🔥`;
    progressBar.style.width = `${(questionIndex / currentQuestions.length) * 100}%`;
  }

  function renderQuestion() {
    locked = false;
    feedback.textContent = '';
    feedback.className = 'feedback';
    answers.innerHTML = '';
    updateHUD();

    const item = currentQuestions[questionIndex];
    if (level === 1) {
      challengeType.textContent = 'LEVEL 1 • OPEN OR CLOSE?';
      questionText.textContent = 'Is this an opening tag or a closing tag?';
      tagDisplay.textContent = item.tag;
      hintText.textContent = 'Hint: A closing tag has a slash / after the < symbol.';
      ['Opening Tag', 'Closing Tag'].forEach(choice => addAnswer(choice, item.type));
    } else {
      challengeType.textContent = 'LEVEL 2 • TAG MATCH CHALLENGE';
      questionText.textContent = item.q;
      tagDisplay.textContent = item.display;
      tagDisplay.style.whiteSpace = 'pre-line';
      hintText.textContent = 'Think about what each HTML tag does or which closing tag matches.';
      shuffle(item.choices).forEach(choice => addAnswer(choice, item.correct));
    }
  }

  function addAnswer(choice, correctAnswer) {
    const button = document.createElement('button');
    button.className = 'answer-btn';
    button.innerHTML = escapeHTML(choice);
    button.addEventListener('click', () => checkAnswer(button, choice, correctAnswer));
    answers.appendChild(button);
  }

  function checkAnswer(button, choice, correctAnswer) {
    if (locked) return;
    locked = true;
    attempts++;

    if (choice === correctAnswer) {
      correct++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      score += 100 + Math.min(streak * 10, 100);
      button.classList.add('correct');
      feedback.textContent = streak >= 5 ? `Correct! 🔥 ${streak} answer streak!` : 'Correct! Great coding knowledge.';
      feedback.classList.add('good');
    } else {
      streak = 0;
      button.classList.add('wrong');
      [...answers.children].forEach(btn => {
        if (btn.textContent === correctAnswer) btn.classList.add('correct');
      });
      feedback.textContent = `Not quite. The correct answer is ${correctAnswer}.`;
      feedback.classList.add('bad');
    }

    updateHUD();
    setTimeout(() => {
      questionIndex++;
      if (questionIndex >= currentQuestions.length) finishLevel();
      else renderQuestion();
    }, 900);
  }

  function finishLevel() {
    progressBar.style.width = '100%';
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    if (level === 1) {
      document.getElementById('transitionScore').textContent = score.toLocaleString();
      document.getElementById('transitionAccuracy').textContent = `${accuracy}%`;
      showScreen('transition');
    } else {
      finishQuest();
    }
  }

  function finishQuest() {
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    let rank = 'Nighthawk HTML Rookie';
    let message = 'Keep practicing your tags and you will level up quickly.';
    if (accuracy >= 95) { rank = 'Nighthawk HTML Elite'; message = 'Outstanding! You showed elite-level accuracy with HTML headings, lists, and tag structure.'; }
    else if (accuracy >= 88) { rank = 'Nighthawk HTML Ace'; message = 'Excellent work! Your HTML fundamentals are strong.'; }
    else if (accuracy >= 78) { rank = 'Nighthawk HTML Pro'; message = 'Strong work! You understand the core HTML tags in this quest.'; }
    else if (accuracy >= 68) { rank = 'Nighthawk HTML Flyer'; message = 'Good progress. Review the tags you missed and challenge yourself again.'; }

    document.getElementById('rankTitle').textContent = rank;
    document.getElementById('rankMessage').textContent = message;
    document.getElementById('finalScore').textContent = score.toLocaleString();
    document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
    document.getElementById('finalStreak').textContent = bestStreak;
    showScreen('final');
  }

  function resetGame() {
    level = 1; questionIndex = 0; score = 0; attempts = 0; correct = 0; streak = 0; bestStreak = 0; locked = false;
    tagDisplay.style.whiteSpace = '';
    showScreen('start');
  }

  document.getElementById('startBtn').addEventListener('click', () => startLevel(1));
  document.getElementById('nextLevelBtn').addEventListener('click', () => startLevel(2));
  document.getElementById('playAgainBtn').addEventListener('click', resetGame);
});
