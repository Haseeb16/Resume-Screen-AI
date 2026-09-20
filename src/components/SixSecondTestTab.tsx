import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  FileSearch,
  Eye,
  Info,
  ShieldCheck,
} from 'lucide-react';
import type { SixSecondTestResult } from '../types.ts';

interface SixSecondTestTabProps {
  testResult: SixSecondTestResult;
  jobTitle: string;
}

export const SixSecondTestTab: React.FC<SixSecondTestTabProps> = ({
  testResult,
  jobTitle,
}) => {
  const isYes = testResult.decision === 'YES';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Prominent Result Card */}
      <div
        id="six-second-main-card"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* Header Ribbon */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                6–7 Second Recruiter Screen
              </h2>
              <p className="text-xs text-slate-500">First-pass talent sourcer simulation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Recruiter Certainty:</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
              <span>{testResult.confidence}% confidence</span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Giant YES / NO Announcement */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 mb-8">
            <div className="text-center shrink-0">
              <span
                id="six-second-decision-badge"
                className={`text-4xl sm:text-5xl font-black px-8 py-3 rounded-2xl shadow-sm tracking-widest inline-block ${
                  isYes
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {testResult.decision}
              </span>
              <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-wider">
                {isYes ? 'Screen Passed' : 'Pass / Hesitation'}
              </p>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left flex-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                First-Glance Recruiter Reaction
              </div>
              <p className="text-base sm:text-lg font-medium text-slate-900 italic leading-relaxed">
                "{testResult.first_glance_reason}"
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Simulated for: <strong className="text-slate-800">{jobTitle}</strong>
              </p>
            </div>
          </div>

          {/* 3 Strongest Signals & Biggest Concern */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3 Strongest Signals */}
            <div
              id="six-second-signals-box"
              className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                  3 Strongest Signals Detected
                </h3>
              </div>
              <p className="text-xs text-emerald-800 mb-4">
                What jumped out positively during the first 6–7 second visual sweep:
              </p>

              <div className="space-y-3">
                {testResult.strongest_signals.slice(0, 3).map((signal, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg border border-emerald-100 flex items-start gap-2.5 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      {signal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Biggest Concern */}
            <div
              id="six-second-concern-box"
              className="p-5 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                    Biggest Concern / Friction Point
                  </h3>
                </div>
                <p className="text-xs text-amber-800 mb-4">
                  The primary hesitation or missing criterion that risks a quick pass:
                </p>

                <div className="p-4 bg-white rounded-lg border border-amber-100 shadow-2xs">
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {testResult.biggest_concern}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-100/60 rounded-lg text-xs text-amber-900 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Optimize this via resume restructuring or bullet tailoring.</span>
              </div>
            </div>
          </div>

          {/* Recruiter Internal View ATS Note */}
          <div
            id="six-second-recruiter-view"
            className="mt-6 p-5 rounded-xl bg-slate-900 text-slate-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <FileSearch className="w-4 h-4" />
                <span>Internal Recruiter ATS Note (Max 60 words)</span>
              </div>
              <span className="text-[11px] text-slate-400">Simulated Sourcer Log</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-mono bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              "{testResult.recruiter_view}"
            </p>
          </div>
        </div>
      </div>

      {/* Recruiter Psychology Explainer */}
      <div
        id="six-second-heuristics"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs"
      >
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-600" />
          <span>How Recruiters Read Resumes in 6–7 Seconds</span>
        </h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Eye-tracking studies consistently demonstrate that professional recruiters use an F-shaped scanning pattern. They look for 7 core anchors before reading deeper:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block mb-0.5">1. Current Title</span>
            <span className="text-slate-500">Does your recent title map directly to the target vacancy?</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block mb-0.5">2. Seniority & Scope</span>
            <span className="text-slate-500">Are total years and responsibilities aligned with the role level?</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block mb-0.5">3. Visible Hard Skills</span>
            <span className="text-slate-500">Are non-negotiable tools and tech stacks prominent in the top third?</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block mb-0.5">4. Quantifiable Metrics</span>
            <span className="text-slate-500">Do numbers, percentages, and scale pop out immediately in bullets?</span>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          AI screening simulation based on the information provided. Results are not a guarantee of recruiter or employer decisions.
        </p>
      </div>
    </div>
  );
};
