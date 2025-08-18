window.onload = () => {
  const raw = sessionStorage.getItem("quizResult");
  if (!raw) {
    alert("Chưa có kết quả!");
    window.location.href = "/home";
    return;
  }
  const players = JSON.parse(raw);
  const max = Math.max(...players.map(p => p.score));
  const winners = players.filter(p => p.score === max).map(p => p.name);

  const board = document.getElementById("resultBoard");
  board.innerHTML = `
    <ul class="list-group">
      ${players.map(p => `<li class="list-group-item d-flex justify-content-between">
        <span>${p.name}</span>
        <span class="badge bg-dark">${p.score}</span>
      </li>`).join("")}
    </ul>
    <div class="alert alert-success mt-3">
      Người thắng: <strong>${winners.join(", ")}</strong> 🎉
    </div>
  `;
};