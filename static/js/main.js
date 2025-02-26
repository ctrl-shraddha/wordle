document.addEventListener("DOMContentLoaded", () => {
  createSquares();
  getNewWord();

  let guessedWords = [[]];
  let availableSpace = 1;

  let word;
  let guessedWordCount = 0;

  const keys = document.querySelectorAll(".keyboard-row button");

  function getNewWord() {
      fetch(`/get-word`, {
          method: "GET"
      })
      .then(response => response.json())
      .then(res => {
          word = res.word;
          console.log("Word is ", word);
      })
      .catch(err => console.error(err));
  }

  function getCurrentWordArr() {
      return guessedWords[guessedWords.length - 1];
  }

  function updateGuessedWords(letter) {
      const currentWordArr = getCurrentWordArr();

      if (currentWordArr.length < 5) {
          currentWordArr.push(letter);
          const availableSpaceEl = document.getElementById(String(availableSpace));
          availableSpace += 1;
          availableSpaceEl.textContent = letter;

          // Apply bounce animation
          availableSpaceEl.classList.add("animate__animated", "animate__bounce");

          // Remove animation class after animation ends
          setTimeout(() => {
              availableSpaceEl.classList.remove("animate__animated", "animate__bounce");r
          }, 500);

          // Play key click sound
          playSound(keyClickSound);r
      }
  }

  function getTileColor(letter, index) {
      const isCorrectLetter = word.includes(letter);
      if (!isCorrectLetter) return "rgb(58, 58, 60)";
      
      return letter === word.charAt(index) ? "rgb(83, 141, 78)" : "rgb(181, 159, 59)";
  }

  function handleSubmitWord() {
      const currentWordArr = getCurrentWordArr();
      if (currentWordArr.length !== 5) {
          window.alert("Word must be 5 letters");
          return;
      }

      const currentWord = currentWordArr.join("");

      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${currentWord}`, { method: "GET" })
      .then(res => {
          if (!res.ok) throw Error();

          const firstLetterId = guessedWordCount * 5 + 1;
          const interval = 200;
          currentWordArr.forEach((letter, index) => {
              setTimeout(() => {
                  const tileColor = getTileColor(letter, index);
                  const letterId = firstLetterId + index;
                  const letterEl = document.getElementById(letterId);
                  letterEl.classList.add("animate__flipInX");
                  letterEl.style = `background-color:${tileColor};border-color:${tileColor}`;
              }, interval * index);
          });

          guessedWordCount++;

          if (currentWord === word) {
              window.alert("🎉 Congratulations!");
          }

          if (guessedWords.length === 6) {
              window.alert(`😞 Sorry, you have no more guesses! The word is ${word}.`);
          }

          guessedWords.push([]);
      })
      .catch(() => {
          window.alert("⚠️ Word is not recognized!");
      });
  }

  function createSquares() {
      const gameBoard = document.getElementById("board");
      for (let index = 0; index < 30; index++) {
          let square = document.createElement("div");
          square.classList.add("square", "animate__animated");
          square.setAttribute("id", index + 1);
          gameBoard.appendChild(square);
      }
  }

  function handleDeleteLetter() {
      const currentWordArr = getCurrentWordArr();
      if (currentWordArr.length === 0) return;

      currentWordArr.pop();
      guessedWords[guessedWords.length - 1] = currentWordArr;

      const lastLetterEl = document.getElementById(String(availableSpace - 1));
      lastLetterEl.textContent = "";
      availableSpace--;
  }

  for (let i = 0; i < keys.length; i++) {
      keys[i].onclick = ({ target }) => {
          const letter = target.getAttribute("data-key");

          if (letter === "enter") {
              handleSubmitWord();
              return;
          }

          if (letter === "del") {
              handleDeleteLetter();
              return;
          }

          updateGuessedWords(letter);
      };
  }
});
