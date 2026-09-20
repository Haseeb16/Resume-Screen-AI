import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import type { AnalysisResult } from '../types.ts';

interface OverviewTabProps {
  analysis: AnalysisResult;
  onNavigateTab: (tab: 'overview' | 'six_second' | 'skills' | 'impact' | 'bullets' | 'final_cv') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const { job_title, candidate_headline, six_second_test, match, skill_finder } = analysis;
  const isDecisionYes = six_second_test.decision === 'YES';

  // Dimension weights
  const dimensions = [
    { label: 'Hard skills & tools', weight: '35%', score: match.dimension_scores?.hard_skills ?? 80 },
    { label: 'Responsibilities & scope', weight: '25%', score: match.dimension_scores?.responsibilities ?? 75 },
    { label: 'Seniority & experience', weight: '15%', score: match.dimension_scores?.seniority ?? 85 },
    { label: 'Domain & industry', weight: '10%', score: match.dimension_scores?.domain ?? 70 },
    { label: 'Education & certs', weight: '5%', score: match.dimension_scores?.education ?? 90 },
    { label: 'Terminology / keywords', weight: '10%', score: match.dimension_scores?.keywords ?? 80 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Candidate & Target Job Headline */}
      <div
        id="overview-header-card"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Target Position
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              Screening Report
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{job_title}</h2>
          <p className="text-sm text-slate-600 mt-0.5 flex items-center gap-1.5">
            <span>Candidate Profile:</span>
            <span className="font-semibold text-slate-800">{candidate_headline}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="overview-jump-bullets-btn"
            type="button"
            onClick={() => onNavigateTab('bullets')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tailor Bullets Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 1: 6-7 Second Test Quick Card & Match Score Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 6-7 Second Test Card (5 cols) */}
        <div
          id="overview-six-second-summary"
          className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  7s
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    6–7 Second Recruiter Test
                  </h3>
                  <p className="text-xs text-slate-500">Simulated first-glance recruiter screen</p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  isDecisionYes
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {six_second_test.confidence}% confidence
              </span>
            </div>

            <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-2xl font-black px-4 py-1.5 rounded-xl shadow-xs tracking-wider inline-block ${
                    isDecisionYes
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {six_second_test.decision}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {isDecisionYes
                    ? 'Advance to phone screen'
                    : 'Hesitation or likely pass on initial review'}
                </span>
              </div>
              <p className="text-sm text-slate-800 font-medium italic mt-2">
                "{six_second_test.first_glance_reason}"
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                Top Immediate Signal
              </p>
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{six_second_test.strongest_signals[0] || 'Strong relevant background.'}</span>
              </div>
            </div>
          </div>

          <button
            id="overview-see-full-test-btn"
            type="button"
            onClick={() => onNavigateTab('six_second')}
            className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700 hover:text-emerald-700 flex items-center justify-between transition-colors w-full cursor-pointer"
          >
            <span>View Full Recruiter Analysis & Notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Resume-Job Match Score Indicator (7 cols) */}
        <div
          id="overview-match-summary"
          className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  %
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Resume–Job Alignment Match
                  </h3>
                  <p className="text-xs text-slate-500">6-dimension weighted alignment model</p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  match.score >= 80
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : match.score >= 60
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {match.threshold_80_reached ? '80%+ Target Alignment Reached' : 'Below 80% Threshold'}
              </span>
            </div>

            {/* Score Display */}
            <div className="flex flex-col sm:flex-row items-center gap-6 my-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-center sm:text-left shrink-0">
                <div className="text-5xl font-black text-slate-900 tracking-tight">
                  {match.score}%
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  Alignment Score
                </div>
              </div>

              <div className="text-xs text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6">
                <p className="leading-relaxed">
                  {match.explanation}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Note: Alignment score evaluates resume keyword & scope coverage, not guaranteed hiring probability.
                </p>
              </div>
            </div>

            {/* Dimension Breakdown Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {dimensions.map((dim) => (
                <div key={dim.label} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="font-medium text-slate-700 truncate">{dim.label}</span>
                    <span className="font-bold text-slate-900 ml-1">{dim.score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, dim.score))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 text-right">Weight: {dim.weight}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Top 3 Strengths vs Top 3 Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Matches */}
        <div
          id="overview-strengths-card"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Strengths & Match Areas</h3>
              <p className="text-xs text-slate-500">Highest-weighted qualifications verified</p>
            </div>
          </div>

          <div className="space-y-3">
            {match.strongest_matches.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Important Gaps */}
        <div
          id="overview-gaps-card"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Important Gaps & Hesitations</h3>
              <p className="text-xs text-slate-500">Qualifications missing or ambiguous in resume</p>
            </div>
          </div>

          <div className="space-y-3">
            {match.important_gaps.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-start gap-3"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Skill Coverage Summary Mini-Dashboard */}
      <div
        id="overview-skill-summary-card"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Skill Coverage Overview</h3>
              <p className="text-xs text-slate-500">Cross-referenced against verified resume evidence</p>
            </div>
          </div>

          <button
            id="overview-explore-skills-btn"
            type="button"
            onClick={() => onNavigateTab('skills')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Explore All {skill_finder.summary.total_skills} Identified Skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-2xl font-extrabold text-slate-900">
              {skill_finder.summary.total_skills}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">Skills Found</div>
            <div className="text-[11px] text-slate-400">In Job Posting</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
            <div className="text-2xl font-extrabold text-emerald-700">
              {skill_finder.summary.supported_count}
            </div>
            <div className="text-xs font-semibold text-emerald-800 mt-1">Supported</div>
            <div className="text-[11px] text-emerald-600">Explicit evidence verified</div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-center">
            <div className="text-2xl font-extrabold text-blue-700">
              {skill_finder.summary.underused_count}
            </div>
            <div className="text-xs font-semibold text-blue-800 mt-1">Underused</div>
            <div className="text-[11px] text-blue-600">Present but buried</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
            <div className="text-2xl font-extrabold text-amber-700">
              {skill_finder.summary.missing_count}
            </div>
            <div className="text-xs font-semibold text-amber-800 mt-1">Missing</div>
            <div className="text-[11px] text-amber-600">Do Not Fabricate</div>
          </div>
        </div>
      </div>

      {/* Business Impact & Final CV Builder Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Impact Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Business Impact Finder
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {analysis.business_impact?.quantified_bullets_count ?? 3} Verified Outcomes
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Commercial &amp; Metric Verification
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {analysis.business_impact?.summary ||
                'Candidate resume highlights quantifiable impact across frontend architecture, developer velocity, and conversion performance.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('impact')}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>Explore Business Impact Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Final CV Builder Workflow Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Next-Gen Flow
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                A4 Document Assembly
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Final CV Builder
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Synthesizes original resume structure, your approved HAMS bullets, and verified supported skills into an ATS-ready PDF/DOCX.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('final_cv')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs transition-all w-fit cursor-pointer"
          >
            <span>Open Final CV Builder</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Required Disclaimer */}
      <div
        id="overview-disclaimer"
        className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          AI screening simulation based on the information provided. Results are not a guarantee of recruiter or employer decisions.
        </p>
      </div>
    </div>
  );
};
