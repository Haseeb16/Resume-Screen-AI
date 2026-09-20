import assert from 'node:assert/strict';
import {
  clamp,
  computeWeightedMatchScore,
  validateDimensionScores,
  validateSixSecondTest,
  validateMatchResult,
  validateSkillItem,
  validateSkillFinder,
  validateAnalysisResult,
  calculateWordCount,
  hasMetric,
  detectsInventedMetric,
  extractActionVerb,
  validateTailoredBullet,
  validateBulletEditorResponse,
} from '../src/lib/validation.ts';

console.log('Running ResumeScreen AI Unit Validation Tests...');

// 1. Test score between 0 and 100
{
  assert.equal(clamp(150, 0, 100, 50), 100, 'Score above 100 must be clamped to 100');
  assert.equal(clamp(-25, 0, 100, 50), 0, 'Score below 0 must be clamped to 0');
  assert.equal(clamp(82.4, 0, 100, 50), 82, 'Score must round to integer');
  assert.equal(clamp(NaN, 0, 100, 70), 70, 'Invalid score defaults cleanly');
  console.log('✔ Score between 0 and 100 clamp test passed');
}

// 2. Test confidence between 0 and 100
{
  const testHigh = validateSixSecondTest({
    decision: 'YES',
    confidence: 140,
    strongest_signals: ['Signal 1'],
  });
  assert.equal(testHigh.confidence, 100, 'Confidence > 100 must clamp to 100');

  const testLow = validateSixSecondTest({
    decision: 'NO',
    confidence: -30,
    strongest_signals: ['Signal 1'],
  });
  assert.equal(testLow.confidence, 0, 'Confidence < 0 must clamp to 0');
  console.log('✔ Confidence between 0 and 100 test passed');
}

// 3. Test maximum 3 strongest signals
{
  const result = validateSixSecondTest({
    decision: 'YES',
    confidence: 85,
    strongest_signals: [
      'Signal 1',
      'Signal 2',
      'Signal 3',
      'Signal 4 (excess)',
      'Signal 5 (excess)',
    ],
  });
  assert.equal(
    result.strongest_signals.length,
    3,
    'Strongest signals must be capped at maximum 3',
  );
  assert.deepEqual(result.strongest_signals, ['Signal 1', 'Signal 2', 'Signal 3']);
  console.log('✔ Maximum 3 strongest signals test passed');
}

// 4. Test weighted scoring model (Rule 3)
{
  const dimensions = validateDimensionScores({
    hard_skills: 80, // 80 * 0.35 = 28
    responsibilities: 70, // 70 * 0.25 = 17.5
    seniority: 90, // 90 * 0.15 = 13.5
    domain: 60, // 60 * 0.10 = 6
    education: 100, // 100 * 0.05 = 5
    keywords: 85, // 85 * 0.10 = 8.5
    // Sum = 28 + 17.5 + 13.5 + 6 + 5 + 8.5 = 78.5 -> rounded = 79
  });
  const computed = computeWeightedMatchScore(dimensions);
  assert.equal(computed, 79, 'Weighted composite score must compute accurately');

  const match = validateMatchResult({
    score: 45, // artificially drifted from true weighted calculation
    dimension_scores: dimensions,
    strongest_matches: ['Match 1', 'Match 2'],
    important_gaps: ['Gap 1'],
  });
  assert.equal(
    match.score,
    79,
    'Match score must enforce strict weighted calculation model',
  );
  console.log('✔ Weighted scoring model test passed');
}

// 5. Test maximum 5 strongest matches & maximum 5 important gaps
{
  const match = validateMatchResult({
    score: 85,
    dimension_scores: {
      hard_skills: 85,
      responsibilities: 85,
      seniority: 85,
      domain: 85,
      education: 85,
      keywords: 85,
    },
    strongest_matches: [
      'Match 1',
      'Match 2',
      'Match 3',
      'Match 4',
      'Match 5',
      'Match 6 (excess)',
      'Match 7 (excess)',
    ],
    important_gaps: [
      'Gap 1',
      'Gap 2',
      'Gap 3',
      'Gap 4',
      'Gap 5',
      'Gap 6 (excess)',
    ],
  });
  assert.equal(
    match.strongest_matches.length,
    5,
    'Strongest matches must be capped at maximum 5',
  );
  assert.equal(
    match.important_gaps.length,
    5,
    'Important gaps must be capped at maximum 5',
  );
  console.log('✔ Maximum 5 matches and maximum 5 gaps test passed');
}

// 6. Test valid evidence levels and recommended actions
{
  // Valid explicit skill with evidence
  const validSupported = validateSkillItem({
    skill: 'TypeScript',
    category: 'Technical / Hard Skills',
    importance: 'critical',
    resume_evidence: 'Engineered 14 apps with TypeScript and React',
    evidence_level: 'explicit',
    recommended_action: 'keep',
  });
  assert.equal(validSupported.evidence_level, 'explicit');
  assert.equal(validSupported.recommended_action, 'keep');

  // Unsupported skill: MUST be forced to do_not_add (Rule 7)
  const unsupportedAttemptedAdd = validateSkillItem({
    skill: 'Rust',
    category: 'Technical / Hard Skills',
    importance: 'high',
    resume_evidence: '', // No evidence
    evidence_level: 'unsupported',
    recommended_action: 'add_to_experience', // VIOLATION!
  });
  assert.equal(
    unsupportedAttemptedAdd.evidence_level,
    'unsupported',
    'Must remain unsupported',
  );
  assert.equal(
    unsupportedAttemptedAdd.recommended_action,
    'do_not_add',
    'Unsupported skill MUST NOT be recommended for insertion into experience (Rule 7)',
  );

  // Missing evidence with claimed 'explicit': MUST be downgraded to 'unsupported' (Rule 6)
  const falseExplicit = validateSkillItem({
    skill: 'Kubernetes',
    category: 'Tools / Platforms',
    importance: 'high',
    resume_evidence: 'No evidence found',
    evidence_level: 'explicit', // FALSE CLAIM
    recommended_action: 'add_to_skills',
  });
  assert.equal(
    falseExplicit.evidence_level,
    'unsupported',
    'Skill without credible evidence must downgrade to unsupported',
  );
  assert.equal(
    falseExplicit.recommended_action,
    'do_not_add',
    'Skill without credible evidence must have recommended_action do_not_add',
  );
  console.log('✔ Valid evidence levels and anti-fabrication action enforcement test passed');
}

// 7. Test Anti-Probability Rule (Rule 5)
{
  const matchResult = validateMatchResult({
    score: 82,
    dimension_scores: {
      hard_skills: 82,
      responsibilities: 82,
      seniority: 82,
      domain: 82,
      education: 82,
      keywords: 82,
    },
    strongest_matches: ['Frontend expertise'],
    important_gaps: [],
    explanation: 'High interview chances and hiring probability guarantee of an interview.',
  });
  assert.ok(
    !matchResult.explanation.includes('interview chances'),
    'Must not include interview probability phrasing',
  );
  assert.ok(
    !matchResult.explanation.includes('hiring probability'),
    'Must not include hiring probability phrasing',
  );
  console.log('✔ Anti-probability language sanitization test passed');
}

// 8. Master validateAnalysisResult test (Rule 8)
{
  const fullResult = validateAnalysisResult({
    job_title: 'Staff Software Engineer',
    candidate_headline: 'Senior Full Stack Engineer',
    detected_bullets: ['Engineered scalable microservices'],
    six_second_test: {
      decision: 'YES',
      confidence: 120, // should clamp to 100
      first_glance_reason: 'Strong tenure and stack alignment.',
      strongest_signals: ['S1', 'S2', 'S3', 'S4', 'S5'], // should clamp to 3
      biggest_concern: 'No Golang experience noted.',
      recruiter_view: 'Good profile, screen for distributed systems.',
    },
    match: {
      score: 75,
      threshold_80_reached: false,
      strongest_matches: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'], // should clamp to 5
      important_gaps: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'], // should clamp to 5
      explanation: 'Solid alignment across core criteria.',
      dimension_scores: {
        hard_skills: 80,
        responsibilities: 75,
        seniority: 80,
        domain: 70,
        education: 80,
        keywords: 75,
      },
    },
    skill_finder: {
      skills: [
        {
          skill: 'React',
          category: 'Technical / Hard Skills',
          importance: 'critical',
          resume_evidence: 'Built 10+ web apps in React',
          evidence_level: 'explicit',
          recommended_action: 'keep',
        },
        {
          skill: 'Go',
          category: 'Technical / Hard Skills',
          importance: 'critical',
          resume_evidence: 'None',
          evidence_level: 'unsupported',
          recommended_action: 'add_to_experience', // Illegal!
        },
      ],
      critical_skills_missing_from_resume: ['Go'],
      skills_already_present_but_underused: [],
    },
  });

  assert.equal(fullResult.six_second_test.confidence, 100);
  assert.equal(fullResult.six_second_test.strongest_signals.length, 3);
  assert.equal(fullResult.match.strongest_matches.length, 5);
  assert.equal(fullResult.match.important_gaps.length, 5);
  assert.equal(fullResult.skill_finder.skills[1].evidence_level, 'unsupported');
  assert.equal(fullResult.skill_finder.skills[1].recommended_action, 'do_not_add');
  assert.equal(fullResult.skill_finder.summary.total_skills, 2);
  assert.equal(fullResult.skill_finder.summary.supported_count, 1);
  assert.equal(fullResult.skill_finder.summary.missing_count, 1);
  console.log('✔ Master validateAnalysisResult test passed');
}

// 9. Bullet Editor validation tests:
// - contain 19 words or fewer
// - start with an action verb
// - include a supported hard skill
// - include verified metric when metric exists
// - never invent metrics (return metric_missing=true if none in original)
{
  // Test word count calculation
  const bullet23Words =
    'Engineered an enterprise design system in React and TypeScript adopted by fourteen cross-functional squads across multiple global engineering departments resulting in cycle time drop.';
  const wordCount = calculateWordCount(bullet23Words);
  assert.equal(wordCount, 24, 'Calculates word count accurately');

  // Test truncation/clamping to <= 19 words
  const validatedClamped = validateTailoredBullet({
    original_bullet: bullet23Words,
    tailored_bullet: bullet23Words,
    hard_skill: 'React',
    action_verb: 'Engineered',
  });
  assert.equal(
    validatedClamped.word_count <= 19,
    true,
    'Tailored bullet must never exceed 19 words',
  );
  assert.equal(validatedClamped.word_count, 19, 'Clamped exactly to 19 words');
  console.log('✔ Word count <= 19 constraint enforcement passed');

  // Test action verb detection
  assert.equal(
    extractActionVerb('Architected cloud infrastructure on AWS'),
    'Architected',
    'Action verb properly extracted',
  );
  assert.equal(
    extractActionVerb('"Spearheaded" new microservice migration'),
    'Spearheaded',
    'Quotes stripped from action verb',
  );
  console.log('✔ Action verb detection passed');

  // Test metric detection and anti-fabrication
  const originalWithMetric =
    'Engineered design system in React adopted by 14 teams, reducing cycle times by 35%.';
  const originalWithoutMetric =
    'Collaborated with product designers to improve web application user experience.';

  assert.equal(hasMetric(originalWithMetric), true, 'Detects 14 teams and 35%');
  assert.equal(hasMetric(originalWithoutMetric), false, 'No metric in general text');

  // Test detectsInventedMetric
  const tailoredInventedMetric =
    'Spearheaded UX overhaul improving conversion rates by 45%.';
  assert.equal(
    detectsInventedMetric(originalWithoutMetric, tailoredInventedMetric, '45%', false),
    true,
    'Flags invented metric when original bullet had none',
  );
  assert.equal(
    detectsInventedMetric(originalWithMetric, 'Optimized design system reducing cycle times by 35%.', '35%', false),
    false,
    'Allows verified metric present in original bullet',
  );
  console.log('✔ Invented metric detection tests passed');

  // Test metric_missing behavior when original has no metric
  const validatedNoMetric = validateTailoredBullet(
    {
      original_bullet: originalWithoutMetric,
      tailored_bullet: 'Spearheaded UX overhaul improving component accessibility in React.',
      hard_skill: 'React',
      action_verb: 'Spearheaded',
      metric: '35% improvement', // Model tried to fabricate a metric!
      metric_missing: false,
    },
    originalWithoutMetric,
  );

  assert.equal(
    validatedNoMetric.metric_missing,
    true,
    'metric_missing must be true when original bullet lacked metrics',
  );
  assert.equal(
    validatedNoMetric.metric,
    'None (unverified)',
    'Invented metric must be sanitized to None (unverified)',
  );
  assert.notEqual(
    validatedNoMetric.metric_to_verify,
    null,
    'Must provide verification hint for missing metric',
  );
  console.log('✔ Zero metric fabrication and metric_missing enforcement passed');

  // Test bullet editor batch response validator
  const batchResponse = validateBulletEditorResponse(
    {
      bullets: [
        {
          original_bullet: originalWithMetric,
          tailored_bullet: 'Engineered React design system across 14 squads, slashing cycle times 35%.',
          hard_skill: 'React',
          action_verb: 'Engineered',
          metric: '35%',
          metric_missing: false,
        },
        {
          original_bullet: originalWithoutMetric,
          tailored_bullet: 'Streamlined design handoffs using Figma and Storybook across frontend teams.',
          hard_skill: 'Storybook',
          action_verb: 'Streamlined',
          metric: 'None (unverified)',
          metric_missing: true,
          metric_to_verify: '[verify: % time saved in sprint handoffs]',
        },
      ],
    },
    [originalWithMetric, originalWithoutMetric],
  );

  assert.equal(batchResponse.bullets.length, 2);
  assert.equal(batchResponse.bullets[0].metric_missing, false);
  assert.equal(batchResponse.bullets[0].metric, '35%');
  assert.equal(batchResponse.bullets[1].metric_missing, true);
  assert.equal(batchResponse.bullets[1].metric, 'None (unverified)');
  console.log('✔ Bullet editor response validator passed');
}

// 12. Test Final CV Parser and 13-Point Anti-Fabrication Validation
{
  const { parseResumeToStructuredCv } = await import('../src/lib/cvParser.ts');
  const { validateFinalCv, formatCandidateFileName } = await import('../src/lib/validation.ts');

  const sampleResume = `
ALEX MORGAN
alex.morgan@email.com | (555) 234-5678 | San Francisco, CA | linkedin.com/in/alexmorgan

PROFESSIONAL SUMMARY
Senior Frontend Engineer with 7+ years of experience in React, TypeScript, and modern web architecture.

TECHNICAL SKILLS
Languages & Frameworks: React, TypeScript, JavaScript, Next.js, Redux, Tailwind CSS
Tools & Cloud: Git, Docker, Jest, Vite, Webpack

PROFESSIONAL EXPERIENCE
Senior Frontend Engineer | Acme Corp | 2021 - Present
- Architected enterprise React design system adopted by 14 squads, accelerating sprint velocity by 35%.
- Refactored legacy Redux application to Next.js server components, boosting performance by 40%.

Frontend Developer | TechFlow Inc | 2018 - 2021
- Developed interactive web dashboards with React and TypeScript for 50,000+ daily active users.
- Reduced initial bundle load time by 25% through code splitting and tree shaking.

EDUCATION
B.S. in Computer Science | University of California, Berkeley | 2018
`;

  const parsedCv = parseResumeToStructuredCv(sampleResume);
  assert.equal(parsedCv.contact.fullName, 'ALEX MORGAN');
  assert.equal(parsedCv.experience.length >= 2, true);
  assert.equal(parsedCv.skills.length >= 1, true);
  console.log('✔ Deterministic CV parser passed');

  // Test 13-point validator on compliant final CV
  const validationResult = validateFinalCv({
    originalCvText: sampleResume,
    finalCv: parsedCv,
    supportedSkills: ['React', 'TypeScript', 'Next.js', 'Redux', 'Tailwind CSS', 'Docker'],
    acceptedBullets: [
      {
        original_bullet:
          'Architected enterprise React design system adopted by 14 squads, accelerating sprint velocity by 35%.',
        approved_bullet:
          'Architected enterprise React design system across 14 squads, accelerating velocity by 35%.',
      },
    ],
    rejectedBullets: [],
  });

  assert.equal(validationResult.isValid, true, 'Compliant Final CV must pass validation');
  assert.equal(validationResult.hasErrors, false);
  assert.equal(validationResult.checks.length, 13, 'Must have exactly 13 rule checks');
  console.log('✔ 13-point Final CV Anti-Fabrication validation passed');

  // Test file name formatting
  const pdfName = formatCandidateFileName('Alex Morgan', 'pdf');
  const docxName = formatCandidateFileName('Alex Morgan', 'docx');
  assert.equal(pdfName, 'Alex_Morgan_Tailored_CV.pdf');
  assert.equal(docxName, 'Alex_Morgan_Tailored_CV.docx');
  console.log('✔ Candidate export file name formatting passed');
}

console.log('ALL UNIT VALIDATION TESTS PASSED SUCCESSFULLY!');


