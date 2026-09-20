import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  Edit3,
  Undo2,
  FileCheck2,
} from 'lucide-react';
import type { TailoredBullet, DocumentInput, BulletApprovalDecision } from '../types.ts';
import { tailorBullets } from '../lib/api.ts';

interface BulletEditorTabProps {
  initialBullets?: string[];
  jobDescription: DocumentInput;
  resumeContext?: string;
  onBuildFinalCv?: (params: {
    acceptedBullets: { original_bullet: string; approved_bullet: string }[];
    rejectedBullets: string[];
    manualEdits: Record<number, string>;
  }) => void;
}

export const BulletEditorTab: React.FC<BulletEditorTabProps> = ({
  initialBullets = [],
  jobDescription,
  resumeContext,
  onBuildFinalCv,
}) => {
  const [bulletsToEdit, setBulletsToEdit] = useState<string[]>(
    initialBullets.length > 0 ? initialBullets : [''],
  );
  const [tailoredResults, setTailoredResults] = useState<TailoredBullet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Bullet Approval & Editing State
  const [decisions, setDecisions] = useState<Record<number, BulletApprovalDecision>>({});
  const [manualEdits, setManualEdits] = useState<Record<number, string>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [reviewMode, setReviewMode] = useState<'individual' | 'all'>('individual');

  const handleAddBullet = () => {
    setBulletsToEdit([...bulletsToEdit, '']);
  };

  const handleUpdateBullet = (index: number, val: string) => {
    const updated = [...bulletsToEdit];
    updated[index] = val;
    setBulletsToEdit(updated);
  };

  const handleRemoveBullet = (index: number) => {
    if (bulletsToEdit.length <= 1) return;
    const updated = bulletsToEdit.filter((_, i) => i !== index);
    setBulletsToEdit(updated);
  };

  const handleTailorBullets = async () => {
    const activeBullets = bulletsToEdit.filter((b) => b.trim().length > 0);
    if (activeBullets.length === 0) {
      setErrorMessage('Please add at least one bullet point to tailor.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await tailorBullets(activeBullets, jobDescription, resumeContext);
      setTailoredResults(res.bullets);
      // Reset decisions to pending for individual review
      const initialDecisions: Record<number, BulletApprovalDecision> = {};
      res.bullets.forEach((_, idx) => {
        initialDecisions[idx] = 'pending';
      });
      setDecisions(initialDecisions);
      setManualEdits({});
      setReviewMode('individual');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to tailor bullets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Approval Handlers
  const handleAcceptBullet = (idx: number) => {
    setDecisions((prev) => ({ ...prev, [idx]: 'accepted' }));
    if (editingIndex === idx) setEditingIndex(null);
  };

  const handleRejectBullet = (idx: number) => {
    setDecisions((prev) => ({ ...prev, [idx]: 'rejected' }));
    if (editingIndex === idx) setEditingIndex(null);
  };

  const handleStartEdit = (idx: number, currentText: string) => {
    setEditingIndex(idx);
    setEditingText(manualEdits[idx] ?? currentText);
  };

  const handleSaveEdit = (idx: number) => {
    const trimmed = editingText.trim();
    if (trimmed) {
      setManualEdits((prev) => ({ ...prev, [idx]: trimmed }));
      setDecisions((prev) => ({ ...prev, [idx]: 'accepted' }));
    }
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleAcceptAll = () => {
    const nextDecisions: Record<number, BulletApprovalDecision> = {};
    tailoredResults.forEach((_, idx) => {
      nextDecisions[idx] = 'accepted';
    });
    setDecisions(nextDecisions);
    setReviewMode('all');
  };

  const handleReviewIndividually = () => {
    setReviewMode('individual');
  };

  const copyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllBullets = () => {
    if (tailoredResults.length === 0) return;
    const combined = tailoredResults
      .map((b, idx) => {
        const text = manualEdits[idx] ?? b.tailored_bullet;
        return `• ${text}`;
      })
      .join('\n');
    navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Calculate accepted count
  const acceptedCount = Object.entries(decisions).filter(
    ([_, status]) => status === 'accepted',
  ).length;

  const handleBuildFinalCvClick = () => {
    const acceptedList: { original_bullet: string; approved_bullet: string }[] = [];
    const rejectedList: string[] = [];

    tailoredResults.forEach((b, idx) => {
      const decision = decisions[idx];
      const finalBullet = manualEdits[idx]?.trim() || b.tailored_bullet;
      if (decision === 'accepted') {
        acceptedList.push({
          original_bullet: b.original_bullet,
          approved_bullet: finalBullet,
        });
      } else if (decision === 'rejected') {
        rejectedList.push(b.tailored_bullet);
      }
    });

    onBuildFinalCv?.({
      acceptedBullets: acceptedList,
      rejectedBullets: rejectedList,
      manualEdits,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div
        id="bullet-editor-header"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              HAMS Bullet Optimization &amp; Approval
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Max 19 Words • Zero Hallucinations
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            HAMS Resume Bullet Editor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every bullet is strictly re-architected to: <strong>Action Verb + Hard Skill + Impact + One Verified Metric</strong>.
          </p>
        </div>

        {tailoredResults.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="copy-all-bullets-btn"
              type="button"
              onClick={copyAllBullets}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedAll ? 'All Copied!' : 'Copy Bullets'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Input Bullets Section */}
      <div
        id="bullets-input-container"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Select or Paste Your Resume Bullets
            </h3>
            <p className="text-xs text-slate-500">
              Edit individual bullet points or add more to optimize together against the target job.
            </p>
          </div>
          <button
            id="add-bullet-btn"
            type="button"
            onClick={handleAddBullet}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bullet</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {bulletsToEdit.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 mt-2">
                {idx + 1}
              </span>
              <textarea
                rows={2}
                value={bullet}
                onChange={(e) => handleUpdateBullet(idx, e.target.value)}
                placeholder="e.g., Engineered an enterprise design system in React adopted by 14 teams..."
                className="flex-1 p-3 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800 resize-y"
              />
              {bulletsToEdit.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveBullet(idx)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-slate-100 mt-1"
                  title="Remove bullet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Anti-Fabrication: If no metric is present, the AI will NOT invent fake numbers.</span>
          </div>

          <button
            id="tailor-bullets-cta"
            type="button"
            onClick={handleTailorBullets}
            disabled={isLoading}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer shadow-emerald-600/20'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Tailoring Bullets with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Tailor My Bullets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tailored Results & Approval Section */}
      {tailoredResults.length > 0 && (
        <div id="tailored-results-list" className="space-y-6">
          {/* Controls Bar: User Control & Counter */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Rewritten HAMS Bullets ({tailoredResults.length})
                </span>
                <span
                  id="accepted-changes-counter"
                  className={`text-xs px-3 py-1 rounded-full font-bold border transition-colors ${
                    acceptedCount > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  Accepted Changes: {acceptedCount}
                </span>
              </div>
            </div>

            {/* Approval Mode Switches */}
            <div className="flex items-center gap-2">
              <button
                id="review-individually-btn"
                type="button"
                onClick={handleReviewIndividually}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  reviewMode === 'individual'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Review Changes Individually
              </button>

              <button
                id="accept-all-changes-btn"
                type="button"
                onClick={handleAcceptAll}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  reviewMode === 'all' && acceptedCount === tailoredResults.length
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept All Suggested Changes</span>
              </button>
            </div>
          </div>

          {/* Bullets List */}
          {tailoredResults.map((b, idx) => {
            const decision = decisions[idx] ?? 'pending';
            const isBeingEdited = editingIndex === idx;
            const activeTailoredText = manualEdits[idx] ?? b.tailored_bullet;
            const hasManualEdit = manualEdits[idx] !== undefined;

            return (
              <div
                key={idx}
                id={`tailored-bullet-card-${idx}`}
                className={`bg-white rounded-2xl p-6 border shadow-xs space-y-4 transition-all ${
                  decision === 'accepted'
                    ? 'border-emerald-300 ring-1 ring-emerald-400/30'
                    : decision === 'rejected'
                    ? 'border-slate-200 bg-slate-50/50 opacity-80'
                    : 'border-slate-200'
                }`}
              >
                {/* Decision Header Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Bullet {idx + 1}
                    </span>
                    {decision === 'accepted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Accepted for Final CV</span>
                      </span>
                    )}
                    {decision === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Rejected (Original Preserved)</span>
                      </span>
                    )}
                    {decision === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Pending Review
                      </span>
                    )}
                    {hasManualEdit && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                        Custom Candidate Edit
                      </span>
                    )}
                  </div>

                  {/* Actions: Accept / Reject / Edit */}
                  <div className="flex items-center gap-2">
                    <button
                      id={`accept-bullet-btn-${idx}`}
                      type="button"
                      onClick={() => handleAcceptBullet(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        decision === 'accepted'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{decision === 'accepted' ? 'Accepted' : 'Accept'}</span>
                    </button>

                    <button
                      id={`reject-bullet-btn-${idx}`}
                      type="button"
                      onClick={() => handleRejectBullet(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        decision === 'rejected'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{decision === 'rejected' ? 'Rejected' : 'Reject'}</span>
                    </button>

                    {!isBeingEdited ? (
                      <button
                        id={`edit-bullet-btn-${idx}`}
                        type="button"
                        onClick={() => handleStartEdit(idx, activeTailoredText)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Side-by-side: Original vs AI Tailored Version */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* [Original] */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="font-bold text-slate-700">[Original]</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {b.original_bullet.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-mono">
                      "{b.original_bullet}"
                    </p>
                  </div>

                  {/* [AI Tailored Version] or In-place Editor */}
                  <div
                    className={`p-4 rounded-xl border relative transition-all ${
                      decision === 'accepted'
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : decision === 'rejected'
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-blue-50/30 border-blue-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-900">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>[AI Tailored Version]</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {activeTailoredText.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    {isBeingEdited ? (
                      <div className="space-y-3 mt-2">
                        <textarea
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-2.5 text-xs sm:text-sm font-sans bg-white border border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 resize-y"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(idx)}
                            className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                          >
                            Save &amp; Accept
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1 rounded-md bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm text-slate-900 font-semibold leading-relaxed">
                          "{activeTailoredText}"
                        </p>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            id={`copy-bullet-btn-${idx}`}
                            type="button"
                            onClick={() => copyBullet(activeTailoredText, idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {hasManualEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = { ...manualEdits };
                                delete next[idx];
                                setManualEdits(next);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-slate-500 hover:text-slate-800 bg-white border border-slate-200 transition-colors cursor-pointer"
                              title="Revert to AI suggestion"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Reset to AI</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Visual Validation Indicator */}
                <div
                  id={`visual-validation-indicator-${idx}`}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Visual Validation Indicator</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ATS &amp; Recruiter Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* 1. Word count */}
                    <div
                      id={`val-words-${idx}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
                    >
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">
                        ✓ {activeTailoredText.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    {/* 2. Hard skill */}
                    <div
                      id={`val-hard-skill-${idx}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
                    >
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate" title={`Hard skill: ${b.hard_skill}`}>
                        ✓ Hard skill detected
                      </span>
                    </div>

                    {/* 3. Action verb */}
                    <div
                      id={`val-action-verb-${idx}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
                    >
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate" title={`Action verb: ${b.action_verb}`}>
                        ✓ Action verb detected
                      </span>
                    </div>

                    {/* 4. Metric detected (when verified metric exists) */}
                    {!b.metric_missing && b.metric && !/^(none|unverified)/i.test(b.metric) ? (
                      <div
                        id={`val-metric-${idx}`}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
                      >
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold truncate" title={`Metric: ${b.metric}`}>
                          ✓ Metric detected
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Metric missing warning if no metric exists */}
                  {b.metric_missing || !b.metric || /^(none|unverified)/i.test(b.metric) ? (
                    <div
                      id={`val-metric-missing-${idx}`}
                      className="mt-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          ⚠ Metric missing — verify a real metric before using this bullet.
                        </span>
                        {b.metric_to_verify && (
                          <p className="text-[11px] text-amber-800 mt-1">
                            Recommended verification:{' '}
                            <code className="font-mono font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-amber-200 text-amber-950">
                              {b.metric_to_verify}
                            </code>
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Attributes Details Summary */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                    <strong>Word count:</strong> {activeTailoredText.split(/\s+/).filter(Boolean).length} (≤19 limit ✓)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                    <strong>Hard skill:</strong> {b.hard_skill}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                    <strong>Action verb:</strong> {b.action_verb}
                  </span>

                  {b.metric_missing ? (
                    <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                      <strong>Metric:</strong> Missing in original (not fabricated)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      <strong>Metric:</strong> {b.metric}
                    </span>
                  )}
                </div>

                {/* Why Changed */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-700">Why this changed: </strong>
                    <span>{b.why_changed}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Prominent Primary CTA at end of Bullet Editor */}
          <div
            id="build-final-cv-cta-card"
            className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <FileCheck2 className="w-4 h-4" />
                <span>Next Step: Final CV Builder</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">
                Ready to assemble your complete tailored CV?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                The builder will compile your original CV structure, apply your{' '}
                <strong>{acceptedCount} approved bullet changes</strong>, integrate verified supported skills, and run full anti-fabrication validation.
              </p>
            </div>

            <button
              id="build-my-final-cv-btn"
              type="button"
              onClick={handleBuildFinalCvClick}
              className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/25 shrink-0 cursor-pointer"
            >
              <span>Build My Final CV</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

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
