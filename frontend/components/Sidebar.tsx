// frontend/components/Sidebar.tsx
"use client";

import React from "react";
import { Terminal, User, FolderGit2, Music, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

type ViewMode = "TERMINAL" | "PROFILE" | "WORKS" | "MUSIC";

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: "TERMINAL", icon: Terminal, label: "Console" },
    { id: "PROFILE", icon: User, label: "Whoami" },
    { id: "WORKS", icon: FolderGit2, label: "Projects" },
    { id: "MUSIC", icon: Music, label: "Music AI" },
  ] as const;

  return (
    <>
      {/* ▼▼ PC用サイドバー (左側固定) ▼▼ */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex flex-col w-20 h-screen glass-panel border-r border-[#333] z-50"
      >
        <div className="p-6 mb-6 flex justify-center items-center">
          <ShieldAlert className="w-8 h-8 text-[#00ff41] glitch-hover transition-colors" />
        </div>
        
        <div className="flex flex-col gap-6 items-center">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={clsx(
                "p-3 rounded-xl transition-all duration-300 group relative",
                currentView === item.id 
                  ? "bg-[#00ff41]/10 text-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.3)]" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              <item.icon className="w-6 h-6" />
              {/* ホバー時のツールチップ */}
              <span className="absolute left-14 bg-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ▼▼ スマホ用ボトムナビ (下側固定) ▼▼ */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-t border-[#333] z-50 px-6 py-4 flex justify-between items-center safe-area-bottom">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={clsx(
              "flex flex-col items-center gap-1 transition-colors",
              currentView === item.id ? "text-[#00ff41]" : "text-gray-500"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-mono">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Sidebar;