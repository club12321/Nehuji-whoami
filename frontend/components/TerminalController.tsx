"use client";

import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { fetchSongs, fetchRecommendation } from "../utils/api";

type ViewMode = "TERMINAL" | "PROFILE" | "WORKS" | "MUSIC";

interface TerminalControllerProps {
  activeTab: ViewMode;
  onNavigate: (mode: ViewMode) => void;
  onAnalysisComplete: (data: any) => void;
}

const TerminalController: React.FC<TerminalControllerProps> = ({ activeTab, onNavigate, onAnalysisComplete }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  // 状態管理
  const isTypingRef = useRef(false);       
  const isProcessingRef = useRef(false);   
  const ignoreNextAutoRun = useRef(false);

  // 入力管理
  const inputRef = useRef({
    buffer: "",
    cursor: 0,
    history: [] as string[],
    historyIdx: -1,
  });

  const PROMPT_STR = "\x1b[1;34mvisitor@nefuji:~$ \x1b[0m";
  const PROMPT_LEN = 18; 

  useEffect(() => {
    if (!terminalRef.current || termInstance.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: "rgba(0, 0, 0, 0)", 
        foreground: "#00ff41",
        cursor: "#00ff41",
      },
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    
    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    const boot = async () => {
      isProcessingRef.current = true;
      await typewriter(term, "\x1b[32m> Initializing NETO_SYSTEM...\x1b[0m", 10);
      term.writeln("\x1b[1;35mWelcome to NETO_SYSTEM (v2.1.0 Fix Behavior)\x1b[0m");
      prompt(term);
      isProcessingRef.current = false;
    };
    boot();

    // キー入力ハンドリング
    term.onData((e) => {
      if (isTypingRef.current || isProcessingRef.current) return;

      const { buffer, cursor, history, historyIdx } = inputRef.current;

      switch (e) {
        case "\r": // Enter
          term.write("\r\n");
          if (buffer.trim() && (history.length === 0 || history[history.length - 1] !== buffer)) {
            inputRef.current.history.push(buffer);
          }
          inputRef.current.historyIdx = inputRef.current.history.length;
          
          processCommand(term, buffer.trim());
          
          inputRef.current.buffer = "";
          inputRef.current.cursor = 0;
          break;

        case "\u007F": // Backspace
          if (cursor > 0) {
            if (cursor === buffer.length) {
              inputRef.current.buffer = buffer.slice(0, -1);
              inputRef.current.cursor--;
              term.write("\b \b");
            } else {
              const newBuffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
              inputRef.current.buffer = newBuffer;
              inputRef.current.cursor--;
              refreshLine(term);
            }
          }
          break;

        case "\x1b[D": // Left
          if (cursor > 0) {
            inputRef.current.cursor--;
            term.write(e); 
          }
          break;

        case "\x1b[C": // Right
          if (cursor < buffer.length) {
            inputRef.current.cursor++;
            term.write(e); 
          }
          break;

        case "\x1b[A": // Up (History)
          if (history.length > 0) {
             const newIdx = Math.max(0, historyIdx - 1);
             if (history[newIdx] !== undefined) {
                 inputRef.current.historyIdx = newIdx;
                 inputRef.current.buffer = history[newIdx];
                 inputRef.current.cursor = history[newIdx].length;
                 refreshLine(term);
             }
          }
          break;

        case "\x1b[B": // Down (History)
           if (history.length > 0 && historyIdx < history.length) {
               const newIdx = historyIdx + 1;
               inputRef.current.historyIdx = newIdx;
               if (newIdx === history.length) {
                   inputRef.current.buffer = "";
                   inputRef.current.cursor = 0;
               } else {
                   inputRef.current.buffer = history[newIdx];
                   inputRef.current.cursor = history[newIdx].length;
               }
               refreshLine(term);
           }
           break;

        default:
          if (e.charCodeAt(0) >= 32) {
            if (cursor === buffer.length) {
              inputRef.current.buffer += e;
              inputRef.current.cursor++;
              term.write(e);
            } else {
              const newBuffer = buffer.slice(0, cursor) + e + buffer.slice(cursor);
              inputRef.current.buffer = newBuffer;
              inputRef.current.cursor++;
              refreshLine(term);
            }
          }
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fitAddonRef.current?.fit(), 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    const term = termInstance.current;
    if (!term) return;

    const executeAutoCommand = async () => {
      if (isProcessingRef.current || isTypingRef.current) return;
      
      if (ignoreNextAutoRun.current) {
        ignoreNextAutoRun.current = false;
        return;
      }

      // ★修正: 第3引数を false にして、ボタンクリック時もコマンドを実行（ログ表示）させる
      if (activeTab === "PROFILE") await autoTypeCommand(term, "whoami", false);
      else if (activeTab === "WORKS") await autoTypeCommand(term, "ls projects", false);
      else if (activeTab === "MUSIC") await autoTypeCommand(term, "open music", false); 
    };
    executeAutoCommand();
  }, [activeTab]);

  // --- ヘルパー関数 ---

  const refreshLine = (term: Terminal) => {
    const { buffer, cursor } = inputRef.current;
    term.write("\r" + PROMPT_STR + buffer + "\x1b[K");
    const moveLeft = buffer.length - cursor;
    if (moveLeft > 0) {
      term.write(`\x1b[${moveLeft}D`);
    }
  };

  const prompt = (term: Terminal) => {
    inputRef.current.buffer = "";
    inputRef.current.cursor = 0;
    term.write("\r\n" + PROMPT_STR);
  };

  const typewriter = async (term: Terminal, text: string, delay: number = 20) => {
    isTypingRef.current = true;
    let i = 0;
    while (i < text.length) {
        if (text[i] === '\x1b') {
            let seq = ''; 
            while(i < text.length && text[i] !== 'm') { seq += text[i]; i++; }
            if(i < text.length) { seq += text[i]; i++; }
            term.write(seq);
        } else {
            term.write(text[i]);
            i++;
            await new Promise(r => setTimeout(r, delay));
        }
    }
    term.write('\r\n');
    isTypingRef.current = false;
  };

  const autoTypeCommand = async (term: Terminal, cmd: string, skipProcess = false) => {
    if (isTypingRef.current || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    term.write("\r\x1b[K" + PROMPT_STR);

    for (let i = 0; i < cmd.length; i++) {
      term.write(cmd[i]);
      await new Promise(r => setTimeout(r, 30));
    }
    await new Promise(r => setTimeout(r, 100));
    term.write("\r\n");
    
    if (!skipProcess) {
        await processCommand(term, cmd);
    } else {
        prompt(term);
        isProcessingRef.current = false;
    }
  };

  // --- コマンド処理 ---
  const processCommand = async (term: Terminal, cmd: string) => {
    isProcessingRef.current = true;

    if (cmd === "") { 
        prompt(term); 
        isProcessingRef.current = false; 
        return; 
    }

    if (cmd === "clear") {
        term.clear(); 
        prompt(term);
    }
    else if (cmd === "whoami") {
      // ★修正: 既に開いている場合はナビゲートのみスキップし、ログは出す
      if (activeTab !== "PROFILE") {
        ignoreNextAutoRun.current = true;
        onNavigate("PROFILE");
      }
      await typewriter(term, ">> Opening Profile Panel...");
      prompt(term); 
    } 
    else if (cmd === "ls projects") {
      // ★修正: 同上
      if (activeTab !== "WORKS") {
        ignoreNextAutoRun.current = true;
        onNavigate("WORKS");
      }
      await typewriter(term, ">> Opening Projects Panel...");
      prompt(term); 
    }
    else if (cmd === "open music") {
      await typewriter(term, "\x1b[36m> Fetching Database...\x1b[0m");
      try {
        const songs = await fetchSongs();
        if (!songs || songs.length === 0) {
          await typewriter(term, "\x1b[31mError: DB Offline.\x1b[0m");
        } else {
          await typewriter(term, "--- Database Loaded ---");
          for (const song of songs) {
              const line = ` [${song.id}] ${song.title} / ${song.artist}`;
              term.writeln(line);
              await new Promise(r => setTimeout(r, 10));
          }
          await typewriter(term, "-----------------------");
          await typewriter(term, "Type ID to analyze (e.g., '1').");
        }
        
        // ★修正: 同上
        if (activeTab !== "MUSIC") {
           ignoreNextAutoRun.current = true;
           onNavigate("MUSIC");
        }
      } catch (e) {
        await typewriter(term, "\x1b[31mConnection Error.\x1b[0m");
      }
      prompt(term); 
    }
    else if (!isNaN(parseInt(cmd))) {
         // ★修正: 同上
         if (activeTab !== "MUSIC") {
           ignoreNextAutoRun.current = true;
           onNavigate("MUSIC"); 
         }
         
         const songId = parseInt(cmd);
         await typewriter(term, `> Analyzing ID: ${songId}...`);
         await typewriter(term, `> Connecting to OpenAI RAG Engine...`);
         const result = await fetchRecommendation(songId);
         if(result) {
             onAnalysisComplete(result);
             await typewriter(term, ">> Analysis Complete.");
         } else {
             await typewriter(term, "\x1b[31mError: Analysis failed.\x1b[0m");
         }
         prompt(term); 
    }
    else {
      await typewriter(term, `Command not found: ${cmd}`);
      prompt(term); 
    }

    isProcessingRef.current = false; // ロック解除
  };

  return (
    <div className="w-full h-full bg-transparent p-2 overflow-hidden">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
};

export default TerminalController;