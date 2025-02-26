function checkWord() {
    let guessedWord = document.getElementById("wordInput").value;
    fetch('/check_word', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word: guessedWord })
    })
    .then(response => response.json())
    .then(data => {
        let result = document.getElementById("result");
        if (data.correct) {
            result.innerHTML = "🎉 Correct! You guessed the word!";
            result.style.color = "green";
        } else {
            let feedback = data.letters.map(l => `<span class="${l.status}">${l.letter}</span>`).join(" ");
            result.innerHTML = `Incorrect! ${feedback}`;
            result.style.color = "red";
        }
    });
}

function logout() {
    window.location.href = "/logout";
}