// frontend/components/TerminalWrapper.tsx
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import DetailPanel from "./DetailPanel";

const TerminalController = dynamic(() => import("./TerminalController"), {
  ssr: false,
});

type ViewMode = "TERMINAL" | "PROFILE" | "WORKS" | "MUSIC";

const TerminalWrapper = () => {
  const [currentView, setCurrentView] = useState<ViewMode>("TERMINAL");
  
  // ★追加: 解析結果データを保存する箱
  const [analysisData, setAnalysisData] = useState<any | null>(null);

  const handleViewChange = (view: ViewMode) => {
    if (currentView === view && view !== "TERMINAL") {
      setCurrentView("TERMINAL");
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className="flex flex-row h-screen w-full bg-transparent text-white overflow-hidden font-mono">
      <Sidebar currentView={currentView} onChangeView={handleViewChange} />

      <div className="flex-1 flex flex-col relative h-full min-w-0 transition-all duration-300">
        <div className="flex-1 relative z-0">
            <TerminalController 
              activeTab={currentView} 
              onNavigate={handleViewChange}
              // ★追加: 解析が終わったらデータをセットする関数を渡す
              onAnalysisComplete={(data) => setAnalysisData(data)}
            />
        </div>
        <div className="h-16 md:h-0 flex-shrink-0" />
      </div>

      <DetailPanel 
        currentView={currentView} 
        onClose={() => setCurrentView("TERMINAL")}
        // ★追加: 解析データをパネルに渡す
        analysisData={analysisData}
      />
    </div>
  );
};

export default TerminalWrapper;