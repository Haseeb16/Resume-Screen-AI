import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Search,
  ShieldAlert,
  ArrowUpRight,
  Info,
  Sparkles,
  MapPin,
} from 'lucide-react';
import type {
  SkillFinderResult,
  SkillCategory,
  EvidenceLevel,
  RecommendedAction,
} from '../types.ts';

interface SkillFinderTabProps {
  skillFinder: SkillFinderResult;
}

export const SkillFinderTab: React.FC<SkillFinderTabProps> = ({ skillFinder }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: SkillCategory[] = [
    'Technical / Hard Skills',
    'Tools / Platforms',
    'Methods / Frameworks',
    'Domain Knowledge',
    'Business Skills',
  ];

  const filteredSkills = skillFinder.skills.filter((item) => {
    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatus === 'supported') {
      if (item.evidence_level === 'unsupported' || item.recommended_action === 'do_not_add') {
        return false;
      }
    } else if (selectedStatus === 'underused') {
      if (
        item.recommended_action !== 'add_to_skills' &&
        item.recommended_action !== 'add_to_experience'
      ) {
        return false;
      }
    } else if (selectedStatus === 'missing') {
      if (item.recommended_action !== 'do_not_add') {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSkill = item.skill.toLowerCase().includes(q);
      const matchReason = item.reasoning.toLowerCase().includes(q);
      const matchEvidence = item.resume_evidence.toLowerCase().includes(q);
      if (!matchSkill && !matchReason && !matchEvidence) {
        return false;
      }
    }

    return true;
  });

  const getActionBadge = (action: RecommendedAction) => {
    switch (action) {
      case 'keep':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Keep (Well Positioned)
          </span>
        );
      case 'add_to_skills':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Add to Skills Section
          </span>
        );
      case 'add_to_experience':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Feature in Experience
          </span>
        );
      case 'do_not_add':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Do Not Add (No Evidence)
          </span>
        );
    }
  };

  const getEvidenceBadge = (level: EvidenceLevel) => {
    switch (level) {
      case 'explicit':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Explicit Evidence
          </span>
        );
      case 'reasonable':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Reasonably Implied
          </span>
        );
      case 'unsupported':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Unsupported
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Skill Coverage Dashboard */}
      <div
        id="skill-coverage-dashboard"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Coverage Intelligence
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Anti-Fabrication Enforced
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Skill Coverage Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies job requirements, compares against verifiable resume evidence, and guards against fabrication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Verified by:</span>
            <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Gemini Document Analysis
            </span>
          </div>
        </div>

        {/* 4 Stat Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setSelectedStatus('all')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100/80'
            }`}
          >
            <div className="text-3xl font-black">
              {skillFinder.summary.total_skills}
            </div>
            <div className={`text-xs font-bold mt-1 ${selectedStatus === 'all' ? 'text-slate-200' : 'text-slate-700'}`}>
              Skills Found
            </div>
            <div className={`text-[11px] ${selectedStatus === 'all' ? 'text-slate-400' : 'text-slate-500'}`}>
              In target posting
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('supported')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'supported'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80'
            }`}
          >
            <div className="text-3xl font-black text-emerald-600">
              {skillFinder.summary.supported_count}
            </div>
            <div className="text-xs font-bold text-emerald-800 mt-1">
              Supported
            </div>
            <div className="text-[11px] text-emerald-600">
              Verified in resume
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('underused')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'underused'
                ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                : 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100/80'
            }`}
          >
            <div className="text-3xl font-black text-blue-600">
              {skillFinder.summary.underused_count}
            </div>
            <div className="text-xs font-bold text-blue-800 mt-1">
              Underused
            </div>
            <div className="text-[11px] text-blue-600">
              Recommend elevating
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('missing')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'missing'
                ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100/80'
            }`}
          >
            <div className="text-3xl font-black text-amber-600">
              {skillFinder.summary.missing_count}
            </div>
            <div className="text-xs font-bold text-amber-800 mt-1">
              Missing
            </div>
            <div className="text-[11px] text-amber-600">
              Do not fabricate
            </div>
          </div>
        </div>
      </div>

      {/* Critical Highlight Cards: Missing & Underused */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Critical Missing Skills Callout */}
        <div
          id="critical-missing-skills-box"
          className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-bold text-amber-950">
              Critical Skills Missing From Resume
            </h3>
          </div>
          <p className="text-xs text-amber-800 mb-3 leading-relaxed">
            These are core job requirements where your resume has zero verified evidence. <strong>Do NOT add them unless you genuinely possess this background.</strong>
          </p>

          <div className="flex flex-wrap gap-2">
            {skillFinder.critical_skills_missing_from_resume.length > 0 ? (
              skillFinder.critical_skills_missing_from_resume.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 text-xs font-semibold border border-amber-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">
                No critical must-have skills were completely missing.
              </span>
            )}
          </div>
        </div>

        {/* Skills Already Present But Underused */}
        <div
          id="underused-skills-box"
          className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/20 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            <h3 className="text-sm font-bold text-blue-950">
              Skills Present But Underused (Quick Wins)
            </h3>
          </div>
          <p className="text-xs text-blue-800 mb-3 leading-relaxed">
            You have verified evidence for these skills, but they are buried or not prominent. Elevating them directly boosts your ATS score.
          </p>

          <div className="flex flex-wrap gap-2">
            {skillFinder.skills_already_present_but_underused.length > 0 ? (
              skillFinder.skills_already_present_but_underused.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-blue-100/80 text-blue-900 text-xs font-semibold border border-blue-200"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">
                All present skills appear adequately emphasized.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        id="skill-filters-bar"
        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({skillFinder.skills.length})
          </button>
          {categories.map((cat) => {
            const count = skillFinder.skills.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search identified skills..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Skills List Table / Cards */}
      <div className="space-y-4">
        {filteredSkills.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No skills match the selected filter</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your category or status filter above.
            </p>
          </div>
        ) : (
          filteredSkills.map((item, idx) => (
            <div
              key={idx}
              id={`skill-card-${idx}`}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-900">{item.skill}</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {item.category}
                  </span>
                  {item.importance === 'critical' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold uppercase">
                      Must Have
                    </span>
                  )}
                  {item.importance === 'high' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold uppercase">
                      High Priority
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {getEvidenceBadge(item.evidence_level)}
                  {getActionBadge(item.recommended_action)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                {/* Resume Evidence */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Resume Evidence Found:</span>
                  </div>
                  <p className="text-slate-800 font-mono text-[11px] sm:text-xs leading-relaxed">
                    {item.resume_evidence && item.resume_evidence !== 'No evidence found' ? (
                      `"${item.resume_evidence}"`
                    ) : (
                      <span className="text-amber-800 font-sans italic">
                        No credible evidence located in candidate's resume.
                      </span>
                    )}
                  </p>
                  {item.suggested_resume_location && item.suggested_resume_location !== 'None' && (
                    <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Suggested Location: <strong>{item.suggested_resume_location}</strong></span>
                    </div>
                  )}
                </div>

                {/* AI Reasoning */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                    <span>Why This Action Was Recommended:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {item.reasoning}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Required Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          AI screening simulation based on the information provided. Results are not a guarantee of recruiter or employer decisions.
        </p>
      </div>
    </div>
  );
};
