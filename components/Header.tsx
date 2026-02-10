
import React from 'react';
import { Zap, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/80 backdrop-blur-md border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className={`font-bold text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>NuVision AI</span>
        </div>
        
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button 
              onClick={onToggleTheme}
              className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          <span className={`hidden sm:inline text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/50' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
            Vision v1.0
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
