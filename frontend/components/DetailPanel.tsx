// frontend/components/DetailPanel.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Activity, ExternalLink, Github } from "lucide-react";

type ViewMode = "TERMINAL" | "PROFILE" | "WORKS" | "MUSIC";

interface DetailPanelProps {
  currentView: ViewMode;
  onClose: () => void;
  analysisData: any | null; // anyで受け取る
}

// タイプライター風コンポーネント
const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText(""); // リセット
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 30); 

    return () => clearInterval(timer);
  }, [text]);

  return (
    <span className="font-sans leading-7 text-gray-200 text-sm whitespace-pre-wrap">
      {displayedText}
      {/* 点滅するカーソル演出 */}
      <span className="inline-block w-2 h-4 bg-[#00ff41] ml-1 animate-pulse align-middle" />
    </span>
  );
};

const DetailPanel: React.FC<DetailPanelProps> = ({ currentView, onClose, analysisData }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case "PROFILE":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#00ff41] font-mono border-b border-[#333] pb-2">User Profile</h2>
            <div className="space-y-4 text-gray-300">
               {/* ▼▼▼ プロフィール情報 (更新済み) ▼▼▼ */}
               <p><strong className="text-white">Name: Nefuji (Taiyu)<br/>Role: Engineer<br/>Residence: Yokohama</strong></p>
               <div className="p-4 bg-[#111] border border-[#333] rounded">
                 <ul className="list-disc list-inside text-sm space-y-1">
                   <li>V-Kei / OniiKei Fashion</li>
                   <li>Hyperpop & DTM</li>
                   <li>Data Analyst (learning)</li>
                   <li>Backend & Frontend Engineering (Python)</li>
                   <li>AI Integration & RAG Systems</li>
                 </ul>
               </div>
            </div>
          </div>
        );
      case "WORKS":
        return (
           <div className="space-y-6">
             <h2 className="text-2xl font-bold text-[#00ff41] font-mono border-b border-[#333] pb-2">Projects</h2>
             
             {/* 1. ポートフォリオサイト */}
             <div className="p-4 bg-[#111] border border-[#333] rounded hover:border-[#00ff41] transition-colors group relative">
               <div className="flex justify-between items-start mb-2">
                   <div>
                       <h3 className="font-bold text-white group-hover:text-[#00ff41] transition-colors">Nefuji_System v1.9.0</h3>
                       <p className="text-xs text-gray-500">Next.js / FastAPI / RAG</p>
                   </div>
                   <a 
                     href="https://github.com/club12321/Nehuji-whoami"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-gray-500 hover:text-[#00ff41] transition-colors p-2 hover:bg-white/5 rounded-full"
                     title="View Source on GitHub"
                   >
                     <Github className="w-5 h-5" />
                   </a>
               </div>
               <p className="text-sm text-gray-400">This Portfolio Site.</p>
             </div>

             {/* 2. GitHubプロフィールへのリンク */}
             <div className="p-4 bg-[#111] border border-[#333] rounded hover:border-[#00ff41] transition-colors group relative">
               <div className="flex justify-between items-start mb-2">
                   <div>
                       <h3 className="font-bold text-white group-hover:text-[#00ff41] transition-colors">GitHub Profile</h3>
                   </div>
                   <a 
                     href="https://github.com/club12321"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-gray-500 hover:text-[#00ff41] transition-colors p-2 hover:bg-white/5 rounded-full"
                     title="View GitHub Profile"
                   >
                     <Github className="w-5 h-5" />
                   </a>
               </div>
               <p className="text-sm text-gray-400">Click icon to view my repositories.</p>
             </div>

           </div>
        );
      case "MUSIC":
        return (
           <div className="space-y-6 pb-20">
             <h2 className="text-2xl font-bold text-[#00ff41] font-mono border-b border-[#333] pb-2">
               Music Analysis
             </h2>
             
             {!analysisData ? (
                <div className="p-6 border border-dashed border-[#444] rounded text-center text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="mb-2">No data loaded.</p>
                  <p className="text-xs">
                    Terminalで曲ID（例: <span className="text-[#00ff41]">1</span>）を入力してください。
                  </p>
                </div>
             ) : (
                <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                  
                  {/* AI解説エリア */}
                  <div className="p-5 bg-[#111] border border-[#333] rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.1)]">
                    <h3 className="text-[#00ff41] text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> AI Analysis Report
                    </h3>
                    <div className="min-h-[100px]">
                      <TypewriterText text={analysisData.ai_analysis || "Analyzing..."} />
                    </div>
                  </div>

                  {/* おすすめ曲リスト */}
                  {analysisData.recommendations && (
                    <div>
                      <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
                         <Music className="w-4 h-4 text-[#00ff41]" /> Similar Tracks
                      </h3>
                      <div className="space-y-3">
                        {analysisData.recommendations.map((rec: any, idx: number) => (
                          <a 
                            key={idx} 
                            href={rec.url}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="group flex justify-between items-center p-3 bg-[#0a0a0a] border border-[#333] rounded cursor-pointer hover:border-[#00ff41] hover:bg-[#111] transition-all duration-200"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-white truncate group-hover:text-[#00ff41] transition-colors">
                                  {rec.title}
                                </div>
                                <ExternalLink className="w-3 h-3 text-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-xs text-gray-500 truncate">{rec.artist}</div>
                            </div>
                            <div className="text-xs font-mono text-[#00ff41] whitespace-nowrap">
                              {rec.similarity ? `${(rec.similarity * 100).toFixed(1)}%` : "MATCH"}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-600 text-center pt-4">
                    Powered by OpenAI & Vector Search
                  </div>
                </div>
             )}
           </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {/* PC Panel */}
      {!isMobile && currentView !== "TERMINAL" && (
        <motion.div
          key="desktop-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 450, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          // 背景色と透過設定
          className="hidden md:block h-screen glass-panel bg-black/80 backdrop-blur-xl border-l border-[#333] overflow-hidden flex-shrink-0"
        >
          <div className="w-[450px] p-6 h-full overflow-y-auto relative custom-scrollbar">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X />
            </button>
            {renderContent()}
          </div>
        </motion.div>
      )}

      {/* Mobile Modal */}
      {isMobile && currentView !== "TERMINAL" && (
        <>
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 bg-black z-40"
          />
          <motion.div
            key="mobile-panel"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="md:hidden fixed bottom-0 left-0 w-full h-[75vh] bg-[#111] border-t border-[#333] p-6 z-50 rounded-t-2xl shadow-2xl"
          >
            <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500"><X /></button>
            <div className="h-full overflow-y-auto pb-10 custom-scrollbar">{renderContent()}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailPanel;