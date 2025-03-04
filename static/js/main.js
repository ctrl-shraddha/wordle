document.documentElement.requestFullscreen();
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

              fetch("/update-history", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: "win" })
            });
        
          }

          if (guessedWords.length === 6) {
              window.alert(`😞 Sorry, you have no more guesses! The word is ${word}.`);

              fetch("/update-history", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: "lose" })
            });
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

document.addEventListener("DOMContentLoaded", function() {
    fetch("/get-history")
        .then(response => response.json())
        .then(data => {
            generateCalendar(data);
        });

    function generateCalendar(history) {
        const calendarDiv = document.getElementById("calendar");
        calendarDiv.innerHTML = "";  // Clear previous calendar

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];


        let calendarHTML = `<h2>${monthNames[month]} ${year}</h2>`;
        
        
        calendarHTML += "<table><tr>";
        
        // Weekday headers
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let d of days) {
            calendarHTML += `<th>${d}</th>`;
        }
        calendarHTML += "</tr><tr>";

        // Empty spaces before the first day
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += "<td></td>";
        }

        // Add days with colors based on history
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            let color = "gray";  // Default for not attempted
            if (history[dateString] === "win") color = "green";
            if (history[dateString] === "lose") color = "red";

            calendarHTML += `<td style="background-color: ${color};">${day}</td>`;

            // Start a new row every Sunday
            if ((day + firstDay) % 7 === 0) {
                calendarHTML += "</tr><tr>";
            }
        }

        calendarHTML += "</tr></table>";
        calendarDiv.innerHTML = calendarHTML;
    }
});
