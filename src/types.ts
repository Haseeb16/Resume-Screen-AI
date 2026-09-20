export type InputType = 'pdf' | 'text';

export interface DocumentInput {
  type: InputType;
  text?: string;
  name?: string;
  data?: string; // base64 data for PDF (without or with data:application/pdf;base64, prefix)
  size?: number;
}

export interface SixSecondTestResult {
  decision: 'YES' | 'NO';
  confidence: number; // 0-100
  first_glance_reason: string;
  strongest_signals: string[]; // max 3
  biggest_concern: string;
  recruiter_view: string; // max 60 words
}

export interface DimensionScores {
  hard_skills: number; // 35%
  responsibilities: number; // 25%
  seniority: number; // 15%
  domain: number; // 10%
  education: number; // 5%
  keywords: number; // 10%
}

export interface MatchResult {
  score: number; // 0-100
  threshold_80_reached: boolean;
  strongest_matches: string[];
  important_gaps: string[];
  explanation: string;
  dimension_scores?: DimensionScores;
}

export type SkillCategory =
  | 'Technical / Hard Skills'
  | 'Tools / Platforms'
  | 'Methods / Frameworks'
  | 'Domain Knowledge'
  | 'Business Skills';

export type EvidenceLevel = 'explicit' | 'reasonable' | 'unsupported';
export type RecommendedAction = 'keep' | 'add_to_skills' | 'add_to_experience' | 'do_not_add';
export type SkillImportance = 'critical' | 'high' | 'medium' | 'nice_to_have';

export interface SkillItem {
  skill: string;
  category: SkillCategory;
  importance: SkillImportance;
  resume_evidence: string;
  evidence_level: EvidenceLevel;
  recommended_action: RecommendedAction;
  suggested_resume_location: string;
  reasoning: string;
}

export interface SkillCoverageSummary {
  total_skills: number;
  supported_count: number;
  underused_count: number;
  missing_count: number;
}

export interface SkillFinderResult {
  skills: SkillItem[];
  critical_skills_missing_from_resume: string[];
  skills_already_present_but_underused: string[];
  summary: SkillCoverageSummary;
}

export interface AnalysisResult {
  job_title: string;
  candidate_headline: string;
  detected_bullets?: string[];
  six_second_test: SixSecondTestResult;
  match: MatchResult;
  skill_finder: SkillFinderResult;
  analyzed_at: string;
  business_impact?: BusinessImpactResult;
  structured_resume?: StructuredResume;
  application_id?: string;
}

export interface BusinessImpactItem {
  metric_type: 'revenue' | 'efficiency' | 'performance' | 'scale' | 'quality' | 'user_growth';
  context: string;
  metric_value: string;
  bullet_text: string;
  impact_level: 'high' | 'medium' | 'moderate';
}

export interface BusinessImpactOpportunity {
  original_text: string;
  suggestion: string;
  recommended_metric_type: string;
  verification_prompt: string;
}

export interface BusinessImpactResult {
  quantified_bullets_count: number;
  total_bullets_count: number;
  impact_score: number; // 0-100
  detected_impacts: BusinessImpactItem[];
  opportunities: BusinessImpactOpportunity[];
  summary: string;
}

export interface TailoredBullet {
  original_bullet: string;
  tailored_bullet: string;
  word_count: number;
  hard_skill: string;
  action_verb: string;
  metric: string;
  metric_missing: boolean;
  metric_to_verify: string | null;
  why_changed: string;
}

export type BulletApprovalDecision = 'accepted' | 'rejected' | 'pending';

export interface ApprovedBulletItem {
  original_bullet: string;
  approved_bullet: string;
  is_edited: boolean;
  hard_skill?: string;
  metric?: string;
}

export interface CandidateInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  github?: string;
}

export interface StructuredBullet {
  bulletId: string;
  text: string;
  originalText?: string;
  status?: 'original' | 'accepted' | 'rejected' | 'edited';
}

export interface StructuredExperienceItem {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
  bulletItems?: StructuredBullet[];
}

export interface StructuredEducationItem {
  id?: string;
  degree: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  graduationDate?: string;
  details?: string[];
}

export interface StructuredCertificationItem {
  name: string;
  issuer?: string;
  date?: string;
}

export interface StructuredSkillGroup {
  category: string;
  skills: string[];
}

export interface StructuredAdditionalSection {
  title: string;
  items: string[];
}

export interface StructuredResume {
  candidate: CandidateInfo;
  summary: string;
  experience: StructuredExperienceItem[];
  education: StructuredEducationItem[];
  certifications: StructuredCertificationItem[];
  skills: StructuredSkillGroup[];
  languages: string[];
  additionalSections: StructuredAdditionalSection[];
  rawText?: string;
}

export interface BulletChange {
  bulletId: string;
  original: string;
  suggested: string;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  manualEdit?: string;
  hardSkill?: string;
  metric?: string;
  whyChanged?: string;
}

export interface FinalCvContact {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  github?: string;
}

export interface FinalCvBullet {
  bulletId: string;
  text: string;
  originalText: string;
  status: 'original' | 'accepted' | 'rejected' | 'edited';
}

export interface FinalCvExperienceItem {
  id: string;
  jobTitle: string;
  employer: string;
  company?: string;
  title?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
  bulletItems?: FinalCvBullet[];
  originalBullets?: string[];
}

export interface FinalCvEducationItem {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  graduationDate?: string;
  details?: string[];
}

export interface FinalCvCertificationItem {
  name: string;
  issuer?: string;
  date?: string;
}

export interface FinalCvSkillGroup {
  category: string;
  skills: string[];
}

export interface FinalCvMetadata {
  source: 'user_resume' | 'demo_resume';
  jobTitle: string;
  applicationId: string;
  generatedAt: string;
}

export interface FinalCvSummaryObject {
  original: string;
  tailored: string;
  current: string;
  isTailored: boolean;
}

export interface FinalCvData {
  candidate: CandidateInfo;
  contact: FinalCvContact;
  professionalTitle: string;
  summary: string;
  originalSummary: string;
  tailoredSummary: string;
  usingTailoredSummary: boolean;
  summaryObject?: FinalCvSummaryObject;
  skills: FinalCvSkillGroup[];
  originalSkills: FinalCvSkillGroup[];
  addedSkills: string[];
  experience: FinalCvExperienceItem[];
  education: FinalCvEducationItem[];
  certifications?: FinalCvCertificationItem[];
  languages?: string[];
  additionalSections?: { title: string; items: string[] }[];
  metadata?: FinalCvMetadata;
}

export type FinalCv = FinalCvData;

export interface ApplicationRecord {
  applicationId: string;
  createdAt: string;
  updatedAt: string;
  resumeSource: 'user_upload' | 'pasted_text' | 'demo_scenario';
  resumeInput: DocumentInput;
  jobDescriptionInput: DocumentInput;
  originalResume: StructuredResume;
  structuredResume: StructuredResume;
  analysisResult: AnalysisResult | null;
  bulletSuggestions: BulletChange[];
  acceptedChanges: BulletChange[];
  rejectedChanges: string[];
  manualEdits: Record<string, string>;
  approvedSkills: string[];
  approvedSummaryMode: 'original' | 'tailored';
  approvedCustomSummary?: string;
  finalCv: FinalCv | null;
}

export interface ValidationCheckItem {
  id: string;
  label: string;
  passed: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface FinalCvValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  checks: ValidationCheckItem[];
  unsupportedSkillsFound: string[];
  inventedMetricsFound: string[];
  mismatchedDatesFound: string[];
  mismatchedEmployersFound: string[];
  mismatchedTitlesFound: string[];
  summaryMessage: string;
}

export interface TailoringSummaryStats {
  matchScore: number;
  changesApplied: number;
  bulletsImproved: number;
  skillsAdded: number;
  summaryUpdated: boolean;
  businessImpactImprovements: number;
}

export interface BulletEditorResponse {
  bullets: TailoredBullet[];
}

export interface SampleScenario {
  id: string;
  title: string;
  badge: string;
  jobRole: string;
  resumeText: string;
  jobDescText: string;
  sampleBullets: string[];
}
