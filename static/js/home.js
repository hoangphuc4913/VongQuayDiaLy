(function () {
  const nextBtn = document.getElementById('nextBtn');
  const backBtn = document.getElementById('backBtn');
  const startBtn = document.getElementById('startBtn');
  const numPlayersEl = document.getElementById('numPlayers');
  const numRoundsEl = document.getElementById('numRounds');
  const playerNamesWrap = document.getElementById('playerNames');
  const namePanel = document.getElementById('namePanel');

  function renderNameInputs(n) {
    playerNamesWrap.innerHTML = '';
    for (let i = 1; i <= n; i++) {
      playerNamesWrap.innerHTML += `
        <div class="col-12 col-md-6">
          <div class="input-group">
            <span class="input-group-text">Người ${i}</span>
            <input class="form-control player-name" placeholder="Tên người ${i}" value="Người ${i}">
          </div>
        </div>`;
    }
  }

  nextBtn.onclick = () => {
    const nPlayers = parseInt(numPlayersEl.value);
    const nRounds = parseInt(numRoundsEl.value);
    if (!nPlayers || !nRounds) return alert("Nhập số hợp lệ!");
    renderNameInputs(nPlayers);
    namePanel.classList.remove('d-none');
  };

  backBtn.onclick = () => {
    namePanel.classList.add('d-none');
  };

  startBtn.onclick = () => {
    const players = Array.from(document.querySelectorAll('.player-name'))
      .map(inp => inp.value.trim() || "Người");
    const rounds = parseInt(numRoundsEl.value);
    const state = {
      players: players.map(name => ({ name, score: 0 })),
      totalRounds: rounds,
      currentRound: 1,
      currentPlayerIndex: 0
    };
    // truyền state bằng sessionStorage
    sessionStorage.setItem("quizGameState", JSON.stringify(state));
    window.location.href = "/game";
  };
})();