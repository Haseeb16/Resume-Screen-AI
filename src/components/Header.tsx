import React from 'react';
import { ShieldCheck, RotateCcw, Sparkles } from 'lucide-react';

interface HeaderProps {
  onStartNew?: () => void;
  showStartNew?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onStartNew, showStartNew }) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                ResumeScreen <span className="text-emerald-600">AI</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                Recruiter Screener
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Would a recruiter interview you in 7 seconds?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Anti-Fabrication Guard: Never invents experience</span>
          </div>

          {showStartNew && onStartNew && (
            <button
              id="header-start-new-btn"
              type="button"
              onClick={onStartNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Analysis</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
