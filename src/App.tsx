import { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Layers,
  Edit3,
  RotateCcw,
  AlertCircle,
  X,
  FileCheck,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { InputSection } from './components/InputSection.tsx';
import { OverviewTab } from './components/OverviewTab.tsx';
import { SixSecondTestTab } from './components/SixSecondTestTab.tsx';
import { SkillFinderTab } from './components/SkillFinderTab.tsx';
import { BusinessImpactTab } from './components/BusinessImpactTab.tsx';
import { BulletEditorTab } from './components/BulletEditorTab.tsx';
import { FinalCvBuilderTab } from './components/FinalCvBuilderTab.tsx';
import { LoadingOverlay } from './components/LoadingOverlay.tsx';
import { runAnalysis } from './lib/api.ts';
import { validateAnalysisResult } from './lib/validation.ts';
import { SAMPLE_SCENARIOS } from './sampleData.ts';
import type { AnalysisResult, DocumentInput } from './types.ts';

export type NavigationTab =
  | 'overview'
  | 'six_second'
  | 'skills'
  | 'impact'
  | 'bullets'
  | 'final_cv';

export default function App() {
  const [resume, setResume] = useState<DocumentInput>({
    type: 'pdf',
    name: '',
    data: '',
    size: 0,
    text: '',
  });

  const [jobDescription, setJobDescription] = useState<DocumentInput>({
    type: 'text',
    text: '',
    name: '',
    data: '',
    size: 0,
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Final CV Builder Shared State
  const [approvedBullets, setApprovedBullets] = useState<
    { original_bullet: string; approved_bullet: string }[]
  >([]);
  const [rejectedBullets, setRejectedBullets] = useState<string[]>([]);

  // Restore analysis from localStorage on initial render if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('resumescreen_last_analysis');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.six_second_test && parsed.match && parsed.skill_finder) {
          const validated = validateAnalysisResult(parsed);
          setAnalysisResult(validated);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached analysis from localStorage', e);
    }
  }, []);

  // Save analysis to localStorage when updated
  const handleSetAnalysis = (result: AnalysisResult | null) => {
    setAnalysisResult(result);
    setApprovedBullets([]);
    setRejectedBullets([]);
    if (result) {
      try {
        localStorage.setItem('resumescreen_last_analysis', JSON.stringify(result));
      } catch (e) {
        console.warn('Failed to persist analysis to localStorage', e);
      }
    } else {
      localStorage.removeItem('resumescreen_last_analysis');
    }
  };

  const handleLoadSample = (scenarioId: string) => {
    const scenario = SAMPLE_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    setResume({
      type: 'text',
      text: scenario.resumeText,
      name: `${scenario.id}-resume.txt`,
    });

    setJobDescription({
      type: 'text',
      text: scenario.jobDescText,
      name: `${scenario.id}-job.txt`,
    });

    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await runAnalysis(resume, jobDescription);
      handleSetAnalysis(result);
      setActiveTab('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete analysis. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNew = () => {
    handleSetAnalysis(null);
    setActiveTab('overview');
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuildFinalCvFromBullets = (params: {
    acceptedBullets: { original_bullet: string; approved_bullet: string }[];
    rejectedBullets: string[];
    manualEdits: Record<number, string>;
  }) => {
    setApprovedBullets(params.acceptedBullets);
    setRejectedBullets(params.rejectedBullets);
    setActiveTab('final_cv');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const supportedSkillsList =
    analysisResult?.skill_finder.skills
      .filter((s) => s.evidence_level !== 'unsupported')
      .map((s) => s.skill) || [];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Loading screen */}
      {isLoading && <LoadingOverlay />}

      {/* Main App Header */}
      <Header
        showStartNew={Boolean(analysisResult)}
        onStartNew={handleStartNew}
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div
            id="app-error-banner"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">Analysis Notice</strong>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {!analysisResult ? (
          /* Landing Page / Input Experience */
          <InputSection
            resume={resume}
            jobDescription={jobDescription}
            onResumeChange={setResume}
            onJobChange={setJobDescription}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            onLoadSample={handleLoadSample}
          />
        ) : (
          /* Analysis Result Experience */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Quick Status Subheader & Navigation Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-6 overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 truncate max-w-md">
                      {analysisResult.job_title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {analysisResult.candidate_headline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                    <span>Match:</span>
                    <strong className="text-slate-900">{analysisResult.match.score}%</strong>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                      analysisResult.six_second_test.decision === 'YES'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <span>Recruiter:</span>
                    <span>{analysisResult.six_second_test.decision}</span>
                  </div>

                  <button
                    id="subbar-start-new-btn"
                    type="button"
                    onClick={handleStartNew}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors ml-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Change Inputs</span>
                  </button>
                </div>
              </div>

              {/* 6 Sequential Flow Navigation Tabs */}
              <div
                id="results-navigation-tabs"
                className="flex border-b border-slate-200 overflow-x-auto bg-white"
              >
                {/* 1. Overview */}
                <button
                  id="nav-tab-overview"
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Overview</span>
                </button>

                {/* 2. 6-7 Second Test */}
                <button
                  id="nav-tab-six-second"
                  type="button"
                  onClick={() => setActiveTab('six_second')}
                  className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'six_second'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>6–7 Second Test</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      analysisResult.six_second_test.decision === 'YES'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {analysisResult.six_second_test.decision}
                  </span>
                </button>

                {/* 3. Skills */}
                <button
                  id="nav-tab-skills"
                  type="button"
                  onClick={() => setActiveTab('skills')}
                  className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'skills'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Skill Finder</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                    {analysisResult.skill_finder.summary.total_skills}
                  </span>
                </button>

                {/* 4. Business Impact */}
                <button
                  id="nav-tab-impact"
                  type="button"
                  onClick={() => setActiveTab('impact')}
                  className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'impact'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Business Impact</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {analysisResult.business_impact?.quantified_bullets_count ?? 3}
                  </span>
                </button>

                {/* 5. Bullet Editor */}
                <button
                  id="nav-tab-bullets"
                  type="button"
                  onClick={() => setActiveTab('bullets')}
                  className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'bullets'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Bullet Editor</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    HAMS
                  </span>
                </button>

                {/* 6. Final CV Builder */}
                <button
                  id="nav-tab-final-cv"
                  type="button"
                  onClick={() => setActiveTab('final_cv')}
                  className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === 'final_cv'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Final CV Builder</span>
                  {approvedBullets.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-extrabold">
                      {approvedBullets.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Active Tab View */}
            <div>
              {activeTab === 'overview' && (
                <OverviewTab
                  analysis={analysisResult}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'six_second' && (
                <SixSecondTestTab
                  testResult={analysisResult.six_second_test}
                  jobTitle={analysisResult.job_title}
                />
              )}

              {activeTab === 'skills' && (
                <SkillFinderTab
                  skillFinder={analysisResult.skill_finder}
                />
              )}

              {activeTab === 'impact' && (
                <BusinessImpactTab
                  businessImpact={analysisResult.business_impact}
                  onNavigateToBulletEditor={() => setActiveTab('bullets')}
                />
              )}

              {activeTab === 'bullets' && (
                <BulletEditorTab
                  initialBullets={analysisResult.detected_bullets}
                  jobDescription={jobDescription}
                  resumeContext={resume.text || undefined}
                  onBuildFinalCv={handleBuildFinalCvFromBullets}
                />
              )}

              {activeTab === 'final_cv' && (
                <FinalCvBuilderTab
                  resumeInput={resume}
                  jobDescriptionInput={jobDescription}
                  targetJobTitle={analysisResult.job_title}
                  supportedSkills={supportedSkillsList}
                  acceptedBullets={approvedBullets}
                  rejectedBullets={rejectedBullets}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">ResumeScreen AI</span> — Recruiter screening intelligence powered by Gemini.
          </div>
          <div>
            Adheres strictly to Anti-Fabrication HAMS &amp; 13-Point ATS Validation Standards.
          </div>
        </div>
      </footer>
    </div>
  );
}
