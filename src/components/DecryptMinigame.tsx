import { useState, useEffect } from "react";
import { Key, ShieldAlert, Cpu, CheckCircle2, RefreshCw } from "lucide-react";

interface DecryptMinigameProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DecryptMinigame({ onSuccess, onCancel }: DecryptMinigameProps) {
  const [secretCode, setSecretCode] = useState("");
  const [currentGuess, setCurrentGuess] = useState("");
  const [attempts, setAttempts] = useState<Array<{ guess: string; correct: number; misplaced: number }>>([]);
  const [maxAttempts] = useState(6);
  const [gameOver, setGameOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scrollingHex, setScrollingHex] = useState<string[]>([]);

  // Generate secret hex code
  const generateCode = () => {
    const hexChars = "0123456789ABCDEF";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += hexChars[Math.floor(Math.random() * 16)];
    }
    setSecretCode(code);
    setCurrentGuess("");
    setAttempts([]);
    setGameOver(false);
    setSuccess(false);
  };

  useEffect(() => {
    generateCode();

    // Spawn falling tactical hex lines in the background
    const interval = setInterval(() => {
      const hexLine = Array.from({ length: 8 }, () => 
        Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, "0")
      ).join("  |  ");
      setScrollingHex((prev) => [hexLine, ...prev.slice(0, 10)]);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (char: string) => {
    if (gameOver || success) return;
    if (currentGuess.length < 4) {
      setCurrentGuess((prev) => prev + char);
    }
  };

  const handleDelete = () => {
    if (gameOver || success) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (currentGuess.length !== 4 || gameOver || success) return;

    // Evaluate matching positions (correct) and pool characters (misplaced)
    let correct = 0;
    let misplaced = 0;

    const secretArr = secretCode.split("");
    const guessArr = currentGuess.split("");

    // 1st pass: count exact position matches
    const secretVisited = Array(4).fill(false);
    const guessVisited = Array(4).fill(false);

    for (let i = 0; i < 4; i++) {
      if (guessArr[i] === secretArr[i]) {
        correct++;
        secretVisited[i] = true;
        guessVisited[i] = true;
      }
    }

    // 2nd pass: count pool matches in incorrect positions
    for (let i = 0; i < 4; i++) {
      if (guessVisited[i]) continue;
      for (let j = 0; j < 4; j++) {
        if (!secretVisited[j] && guessArr[i] === secretArr[j]) {
          misplaced++;
          secretVisited[j] = true;
          break;
        }
      }
    }

    const newAttempts = [...attempts, { guess: currentGuess, correct, misplaced }];
    setAttempts(newAttempts);
    setCurrentGuess("");

    if (currentGuess === secretCode) {
      setSuccess(true);
      setGameOver(true);
      // Brief delay before triggering parent dashboard unlock
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else if (newAttempts.length >= maxAttempts) {
      setGameOver(true);
    }
  };

  const attemptsLeft = maxAttempts - attempts.length;

  return (
    <div className="flex flex-col md:grid md:grid-cols-5 gap-6 p-4 md:p-6 bg-[#141414] border border-brand-steel font-mono select-none">
      
      {/* Hex background feed & Instructions */}
      <div className="md:col-span-2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-brand-steel pb-4 md:pb-0 md:pr-6">
        <div>
          <div className="flex items-center gap-2 text-brand-primary mb-3">
            <Key className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">BYPASS_HANDSHAKE_UPLINK</span>
          </div>
          
          <h3 className="text-sm font-bold text-white uppercase mb-2">OPERATIONAL INSTRUCTIONS:</h3>
          <p className="text-[11px] text-brand-secondary leading-relaxed mb-4">
            ALIGN REVOLVING MATRIX KEYS TO FORCE SECURE UPLINK CHANNELS. IDENTIFY THE <span className="text-brand-primary font-bold">4-DIGIT HEXADECIMAL SECURITY KEY</span> TO BYPASS RE-ROUTE LOCKOUTS.
          </p>

          <div className="border border-brand-steel p-3 bg-black/60 text-[10px] space-y-1 mb-4">
            <div className="flex justify-between">
              <span className="text-brand-steel">SYSTEM DIRECTIVE:</span>
              <span className="text-brand-primary font-bold">DEC_UPLINK_BYPASS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-steel">PORT TUNNEL:</span>
              <span className="text-brand-secondary">03000 // EXPLOIT_SEC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-steel">DIFFICULTY RATING:</span>
              <span className="text-brand-alert font-bold">ALPHA_CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Dynamic scrolling binary/hex console panel */}
        <div className="hidden md:block border border-brand-steel/50 bg-[#0e0e0e] h-36 overflow-hidden rounded-sm relative p-2 text-[9px] text-brand-steel select-none opacity-60">
          <div className="absolute top-0 left-0 right-0 h-4 bg-brand-surface/90 border-b border-brand-steel/30 text-[8px] flex justify-between px-1.5 font-sans z-10 text-brand-primary font-bold">
            <span>MEM_BUFFER_0xF431</span>
            <span>LIVE STREAM</span>
          </div>
          <div className="pt-3 font-mono leading-tight space-y-0.5">
            {scrollingHex.map((line, idx) => (
              <div key={idx} className="whitespace-nowrap overflow-hidden text-ellipsis">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Interaction Interface */}
      <div className="md:col-span-3 flex flex-col justify-between">
        
        {/* Game State Panel */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5 text-xs text-brand-steel">
            <span>ATTEMPTS REMAINING:</span>
            <span className="flex gap-1">
              {Array.from({ length: maxAttempts }).map((_, idx) => (
                <span
                  key={idx}
                  className={`inline-block w-2.5 h-4 border ${
                    idx < attemptsLeft
                      ? "bg-brand-primary border-brand-primary"
                      : "bg-transparent border-brand-steel"
                  }`}
                />
              ))}
            </span>
          </div>
          
          <button 
            id="btn_retry_game"
            onClick={generateCode}
            className="flex items-center gap-1.5 text-[10px] text-brand-primary hover:text-white border border-brand-primary/40 px-2 py-0.5 bg-brand-primary/5 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            RESET MATRIX
          </button>
        </div>

        {/* Displays guesses */}
        <div className="border border-brand-steel bg-[#0c0c0c] min-h-44 p-3 mb-4 space-y-1.5 rounded-sm overflow-y-auto max-h-48 text-[11px]">
          {attempts.map((attempt, index) => (
            <div key={index} className="flex justify-between border-b border-brand-steel/20 pb-1 text-brand-secondary">
              <span className="text-brand-steel">#{index + 1} GUESS: <span className="text-white font-bold">{attempt.guess}</span></span>
              <span className="text-right">
                <span className="text-brand-primary font-semibold mr-2">[{attempt.correct} CORR_POS]</span>
                <span className="text-brand-secondary">[{attempt.misplaced} MISP_VAL]</span>
              </span>
            </div>
          ))}

          {/* Prompt result or idle warnings */}
          {attempts.length === 0 && (
            <div className="text-center py-10 text-brand-steel text-xs space-y-2">
              <ShieldAlert className="w-8 h-8 text-brand-steel/50 mx-auto animate-pulse" />
              <div>MATRIX TUNED TO IDLE STATE. ENTER GUESS CODE.</div>
            </div>
          )}

          {/* Fail Warning */}
          {gameOver && !success && (
            <div className="text-center py-6 text-brand-alert bg-brand-alert/10 border border-brand-alert/30 text-xs">
              <ShieldAlert className="w-6 h-6 text-brand-alert mx-auto mb-2" />
              LOCKOUT INITIATED. MATRIX STABLE VALUE WAS {secretCode}. RESET TO RETRY.
            </div>
          )}

          {/* Success Warning */}
          {success && (
            <div className="text-center py-6 text-brand-primary bg-brand-primary/10 border border-brand-primary/30 text-xs">
              <CheckCircle2 className="w-6 h-6 text-brand-primary mx-auto mb-2 animate-bounce" />
              CORRECT ALIGNMENT KEY FOUND: {secretCode}. BYPASSING HANDSHAKE BLOCK...
            </div>
          )}
        </div>

        {/* Input display and keypad */}
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-black/80 border border-brand-steel p-3 rounded-sm">
            <span className="text-[10px] text-brand-steel">KEY_INPUT:</span>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className="w-8 h-8 border border-brand-steel flex items-center justify-center text-sm font-bold text-white bg-brand-surface"
                >
                  {currentGuess[idx] || ""}
                </span>
              ))}
            </div>
            <button
              id="btn_submit_passcode"
              disabled={currentGuess.length !== 4 || gameOver || success}
              onClick={handleSubmit}
              className={`text-[10px] px-3 py-1.5 font-bold uppercase transition-all ${
                currentGuess.length === 4 && !gameOver && !success
                  ? "bg-brand-primary text-black hover:bg-white cursor-pointer"
                  : "bg-brand-steel/20 text-brand-steel cursor-not-allowed"
              }`}
            >
              INJECT KEY
            </button>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-6 gap-1">
            {"0123456789ABCDEF".split("").map((char) => (
              <button
                key={char}
                id={`btn_key_${char}`}
                disabled={gameOver || success || currentGuess.length >= 4}
                onClick={() => handleKeyPress(char)}
                className={`p-2 border border-brand-steel text-center text-xs font-bold transition-all ${
                  gameOver || success || currentGuess.length >= 4
                    ? "opacity-40 cursor-not-allowed text-brand-steel bg-black"
                    : "bg-brand-surface hover:bg-brand-primary hover:text-black cursor-pointer text-brand-secondary"
                }`}
              >
                {char}
              </button>
            ))}
            <button
              id="btn_key_del"
              onClick={handleDelete}
              className="col-span-3 p-2 border border-brand-steel bg-brand-surface hover:bg-brand-alert/10 hover:border-brand-alert hover:text-brand-alert text-xs font-bold uppercase transition-all"
            >
              DELETE
            </button>
            <button
              id="btn_key_cancel"
              onClick={onCancel}
              className="col-span-3 p-2 border border-brand-steel bg-brand-surface hover:bg-white hover:text-black text-xs font-bold uppercase transition-all"
            >
              ABORT
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
