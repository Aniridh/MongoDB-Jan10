import React from 'react';

export function HeaderBar() {
  return (
    <header className="relative border-b border-cyan-400/20 bg-slate-900/50 backdrop-blur-xl px-8 py-6 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and subtitle */}
        <div className="flex items-center gap-3">
          {/* Visibl logo icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-sky-400/20 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-400">
              V
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-400">
              Visibl
            </h1>
            <p className="mt-0.5 text-sm text-slate-400 tracking-wide">
              AI-Native Engineering Design Notebook
            </p>
          </div>
        </div>

        {/* Right side - MongoDB Atlas status pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-emerald-400/30 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <svg
            className="w-4 h-4 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium text-slate-200">
            MongoDB Atlas • Connected
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]"></div>
        </div>
      </div>
    </header>
  );
}
