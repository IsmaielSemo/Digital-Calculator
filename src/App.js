import './App.css';
import { evaluate } from "mathjs";
import { useState, useEffect } from "react";

function Button({ text, onClick, disabled = false, className = "Buttons-look" }) {
  return (
    <button
      className={`${className} ${disabled ? "disabled" : ""}`}
      onClick={!disabled ? () => onClick(text) : undefined}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

function Display({ value, onClick }) {
  return (
    <div className="display-screen" onClick={onClick}>
      {value ? formatNumber(value) : "0"}
    </div>
  );
}

function formatNumber(value) {
  const num = Number(value);

  // Not a number (e.g. "", JSX, feedback)
  if (!isFinite(num)) return value;

  // Scientific notation for very large numbers
  if (Math.abs(num) >= 1e9) {
    return num.toExponential(3); // 3 significant digits
  }

  return value.toString();
}

function App() {
  const [input, setInput] = useState("");
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [mode, setMode] = useState("Normal");
  const [question, setQuestion] = useState("");
  const [feedback, setFeedback] = useState("");
  const [difficulty, setDifficulty] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const TOTAL_QUESTIONS = 10;

  useEffect(() => {
  if (!timerRunning) return;

  if (timeLeft <= 0) {
  setTimerRunning(false);

  const score = Math.round(
    (correctCount / 10) * 100
  );

  setFeedback(
    `⏰ Time's up! Score: ${score}%`
  );
  return;
}
  const interval = setInterval(() => {
    setTimeLeft((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(interval);
}, [timerRunning, timeLeft]);

useEffect(() => {
  const handleKeyDown = (e) => {
    const key = e.key;

    // Numbers
    if (!isNaN(key)) {
      handleClick(key);
      return;
    }

    // Decimal
    if (key === ".") {
      handleClick(".");
      return;
    }

    // Operators (Normal mode only)
    if (mode === "Normal" && ["+", "-", "*", "/"].includes(key)) {
      handleClick(key === "*" ? "X" : key);
      return;
    }

    // Enter → equals
    if (key === "Enter") {
      e.preventDefault();
      handleEqual();
      return;
    }

    // Backspace → DEL
    if (key === "Backspace") {
      handleDelete();
      return;
    }

    // Escape → CE
    if (key === "Escape") {
      handleClear();
      return;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [mode, isEvaluated, input]);

  const exitGame = () => {
  setDifficulty(null);
  setQuestion("");
  setInput("");
  setFeedback("");
  setQuestionCount(0);
  setCorrectCount(0);
  setIsEvaluated(false);
  setTimerRunning(false); 
  setTimeLeft(90);       
};

  // Generate a random math question based on difficulty
  const generateQuestion = (level) => {
  let max = 10;
  let min = 1;
  if (level === "Medium"){
    max = 50;
    min = 10;
    }
  if (level === "Hard") {
    max = 100;
    min = 50;
  }

  const ops = ["+", "-", "*", "/"];

  const a = Math.floor(Math.random() * max) + min;
  let b = Math.floor(Math.random() * max) + min;

  while (b > a) {
    b = Math.floor(Math.random() * max) + min;
  }

  const op = ops[Math.floor(Math.random() * ops.length)];
 if (op === "/") {
  while (a % b !== 0) {
    b = Math.floor(Math.random() * max) + min;
  }
}
  setQuestion(`${a}${op}${b}`);
  setInput("");
  setFeedback("");
};


  const handleModeChange = (newMode) => {
    setMode(newMode);
    setInput("");
    setFeedback("");
    setDifficulty(null);
    setQuestion("");
  };

  const handleClick = (value) => {
    if (isEvaluated) {
      if (!isNaN(value) || value === ".") {
        setInput(value);
      } else {
        setInput((prev) => prev + value);
      }
      setIsEvaluated(false);
    } else {
      setInput((prev) => prev + value);
    }
  };

  const handleDelete = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleEqual = () => {
    if (mode === "Normal") {
      try {
        const expression = input.replace(/X/g, "*");
        const result = evaluate(expression);
        setInput(result.toString());
        setIsEvaluated(true);
      } catch {
        setInput("Error");
        setIsEvaluated(true);
      }
    }

  if (mode === "Game" && difficulty) {
  try {
    const correct = evaluate(question);
    const userAnswer = Number(input);

    if (userAnswer === correct) {
      setCorrectCount((c) => c + 1);
      setFeedback("✅ Correct!");
    } else {
      setFeedback(`❌ Wrong! (${correct})`);
    }

    

    setTimeout(() => {
      setQuestionCount((q) => q + 1);
      if (questionCount + 1 >= TOTAL_QUESTIONS) {
        setTimerRunning(false); // ✅ stop timer
        setFeedback(
          `Finished! Score: ${Math.round(
            ((correctCount + (userAnswer === correct ? 1 : 0)) / TOTAL_QUESTIONS) * 100
          )}%`
        );
      } else {
        generateQuestion(difficulty);
      }
    }, 1200);

    setInput("");
  } catch {
    setFeedback("Error");
  }
}
};

  const handleClear = () => {
    setInput("");
    setFeedback("");
    setIsEvaluated(false);
  };

  const getDisplayValue = () => {
  if (mode === "Game" && !difficulty) {
    return (
      <div className="difficulty-picker">
        <button onClick={() => startGame("Easy")}>Easy</button>
        <button onClick={() => startGame("Medium")}>Medium</button>
        <button onClick={() => startGame("Hard")}>Hard</button>
      </div>
    );
  }

  if (mode === "Game") {
    return feedback || `${question} = ${input}`;
  }

  return input;
};

  const handleDisplayClick = (e) => {
    if (mode !== "Game" || difficulty) return;

    const text = e.target.innerText;

    if (text.includes("Easy")) {
      setDifficulty("Easy");
      generateQuestion("Easy");
    }
    if (text.includes("Medium")) {
      setDifficulty("Medium");
      generateQuestion("Medium");
    }
    if (text.includes("Hard")) {
      setDifficulty("Hard");
      generateQuestion("Hard");
    }
  };

 const startGame = (level) => {
  setDifficulty(level);
  setQuestionCount(0);
  setCorrectCount(0);
  setTimeLeft(90);       //reset timer
  setTimerRunning(true);  //start timer
  generateQuestion(level);
};

  return (
    <div className="App">
      <header className="App-header">

        {/* Mode bar */}
        <div className="mode-bar">
          <button
            className={`Buttons-mode ${mode === "Normal" ? "active" : ""}`}
            onClick={() => handleModeChange("Normal")}
          >
            Normal Mode
          </button>
          <button
            className={`Buttons-mode ${mode === "Game" ? "active" : ""}`}
            onClick={() => handleModeChange("Game")}
          >
            Game Mode
          </button>
        </div>

        {mode === "Game" && difficulty && (
 <div className={`game-timer ${timeLeft <= 10 ? "danger" : ""}`}>
    ⏱ {Math.floor(timeLeft / 60)}:
    {String(timeLeft % 60).padStart(2, "0")}
    <span className="question-counter">
      {" "}• Question {questionCount + 1}/{TOTAL_QUESTIONS}
    </span>
  </div>
)}

        {/* Display */}
        <Display
          value={getDisplayValue()}
          onClick={handleDisplayClick}
        />

        {mode === "Game" && difficulty && (
  <button className="exit-game-btn" onClick={exitGame}>
    ← Change Difficulty
  </button>
)}


        {/* Calculator */}
        <div className="calculator-grid">
          <Button text="7" onClick={handleClick} />
          <Button text="8" onClick={handleClick} />
          <Button text="9" onClick={handleClick} />
          <Button text="X" onClick={handleClick} disabled={mode === "Game"} />

          <Button text="4" onClick={handleClick} />
          <Button text="5" onClick={handleClick} />
          <Button text="6" onClick={handleClick} />
          <Button text="-" onClick={handleClick} disabled={mode === "Game"} />

          <Button text="1" onClick={handleClick} />
          <Button text="2" onClick={handleClick} />
          <Button text="3" onClick={handleClick} />
          <Button text="+" onClick={handleClick} disabled={mode === "Game"} />

          <Button text="0" onClick={handleClick} />
          <Button text="." onClick={handleClick} />
          <Button text="/" onClick={handleClick} disabled={mode === "Game"} />
          <Button text="=" onClick={handleEqual} />

          <Button text="(" onClick={handleClick} disabled={mode === "Game"} />
          <Button text=")" onClick={handleClick} disabled={mode === "Game"} />
          <Button text="DEL" onClick={handleDelete} />
          <Button text="CE" onClick={handleClear} />
</div>

      </header>
    </div>
  );
}

export default App;
