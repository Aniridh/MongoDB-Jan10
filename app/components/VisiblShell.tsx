import React from 'react';

interface VisiblShellProps {
  children: React.ReactNode;
}

export function VisiblShell({ children }: VisiblShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* Animated background pattern */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Centered console card */}
      <div className="relative min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
