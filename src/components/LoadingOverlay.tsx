import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

export const LoadingOverlay: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Parsing resume document structure and formatting...',
    'Extracting target role requirements and seniority scope...',
    'Simulating 6–7 second recruiter first-pass screen...',
    'Calculating weighted match across 6 dimensions...',
    'Cross-referencing skills against verified resume evidence...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div
      id="loading-screen-overlay"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 border border-slate-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 relative">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            Analyzing Resume Against Job
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Running simulated recruiter screen and dimension alignment.
          </p>

          <div className="w-full space-y-3 text-left">
            {steps.map((step, idx) => {
              const isCompleted = idx < stepIndex;
              const isCurrent = idx === stepIndex;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 text-xs p-2.5 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-emerald-50/80 text-emerald-900 font-semibold border border-emerald-200'
                      : isCompleted
                      ? 'text-slate-600 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{step}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
            <span>Anti-fabrication active: validating real evidence only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
