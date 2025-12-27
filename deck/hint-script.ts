var answer = "{{Front}}";
var revealed = 0;

var revealNext = function () {
  if (revealed >= answer.length) return;
  revealed++;
  const btn = document.getElementById("hint-btn");
  if (!btn) return;
  btn.textContent = answer.slice(0, revealed) + "_".repeat(answer.length - revealed);
};
