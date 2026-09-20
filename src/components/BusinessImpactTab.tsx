import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Layers,
  Award,
  ShieldCheck,
  ArrowRight,
  Info,
  Sparkles,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import type { BusinessImpactResult } from '../types.ts';

interface BusinessImpactTabProps {
  businessImpact?: BusinessImpactResult;
  onNavigateToBulletEditor?: () => void;
}

export const BusinessImpactTab: React.FC<BusinessImpactTabProps> = ({
  businessImpact,
  onNavigateToBulletEditor,
}) => {
  const data: BusinessImpactResult = businessImpact || {
    total_bullets_count: 0,
    quantified_bullets_count: 0,
    impact_score: 0,
    detected_impacts: [],
    opportunities: [],
    summary:
      'No quantified business impact metrics were detected in the uploaded resume. Use the Bullet Editor to review opportunities for quantifying verified impact.',
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'efficiency':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'performance':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'scale':
        return <Layers className="w-4 h-4 text-blue-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div
        id="business-impact-header"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Metric &amp; Commercial Evaluation
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Zero Metric Fabrication
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Business Impact Finder
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Recruiters evaluate candidate outcomes based on measurable commercial, operational, and technical impact.
          </p>
        </div>

        {/* Impact Score Box */}
        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xl">
            {data.impact_score}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Business Impact Score
            </span>
            <span className="text-[11px] text-slate-500">
              {data.quantified_bullets_count} of {data.total_bullets_count || data.detected_impacts.length} bullets quantified
            </span>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Executive Impact Assessment</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            {data.summary}
          </p>
        </div>
      </div>

      {/* Detected Impacts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Verified Measurable Outcomes ({data.detected_impacts.length})
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% grounded in resume evidence</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data.detected_impacts.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4"
            >
              {/* Category & Metric Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-100">
                    {getCategoryIcon(item.metric_type)}
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {item.metric_type} impact
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Verified Metric: {item.metric_value}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold uppercase">
                    {item.impact_level} impact
                  </span>
                </div>
              </div>

              {/* Original Bullet */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Resume Bullet Evidence
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-mono leading-relaxed">
                  "{item.bullet_text}"
                </p>
              </div>

              {/* Context Summary */}
              <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-800 block mb-0.5">
                  Recruiter Takeaway &amp; Scope
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {item.context}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unquantified Opportunities (if any) */}
      {data.opportunities && data.opportunities.length > 0 && (
        <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-950">
              Metric Verification Opportunities ({data.opportunities.length})
            </h3>
          </div>
          <p className="text-xs text-amber-800">
            These bullets could become significantly stronger with a verified candidate metric.
          </p>

          <div className="space-y-3">
            {data.opportunities.map((opp, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-2">
                <p className="text-xs font-mono text-slate-700">"{opp.original_text}"</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-600">
                    <strong>Suggestion:</strong> {opp.suggestion}
                  </span>
                  <span className="text-amber-800 font-semibold">
                    Target Metric: {opp.recommended_metric_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA to Bullet Editor */}
      {onNavigateToBulletEditor && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-lg font-bold">Ready to optimize these bullets for recruiters?</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Head into the HAMS Bullet Editor to tighten phrasing into under 19 words with action verbs and zero invented metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToBulletEditor}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            <span>Optimize in Bullet Editor</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          AI screening simulation based on the information provided. Results are not a guarantee of recruiter or employer decisions.
        </p>
      </div>
    </div>
  );
};
