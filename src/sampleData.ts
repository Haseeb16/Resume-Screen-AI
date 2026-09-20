import { SampleScenario } from './types.ts';

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'senior-frontend-success',
    title: 'Senior Frontend Engineer (Strong Match)',
    badge: 'High Alignment (~85%)',
    jobRole: 'Senior Frontend Engineer - Design Systems & Web Performance',
    resumeText: `ALEX MORGAN
Email: alex.morgan@email.com | Portfolio: alexmorgan.dev | GitHub: github.com/alexm
Location: San Francisco, CA

SUMMARY
Senior Frontend Engineer with 6+ years of experience architecting high-traffic web applications with React, TypeScript, Next.js, and modern CSS architecture. Proven track record of spearheading enterprise design systems, reducing bundle sizes, and mentoring junior engineers.

CORE SKILLS
Languages & Frameworks: TypeScript, JavaScript (ES6+), React 18, Next.js, HTML5, CSS3, Tailwind CSS, Sass
Testing & Tools: Jest, React Testing Library, Cypress, Vite, Webpack, Git, Storybook, Figma
Performance & Architecture: Web Vitals, SSR/SSG, Code Splitting, RESTful APIs, GraphQL

PROFESSIONAL EXPERIENCE
Senior Frontend Engineer | CloudScale Inc. | 2022 - Present
* Engineered an enterprise design system in React and TypeScript adopted by 14 cross-functional teams, reducing UI development cycle time by 35%.
* Refactored core dashboard architecture to Next.js server components, boosting Core Web Vitals (LCP from 3.8s to 1.2s) and improving page load speed by 42%.
* Spearheaded automated visual regression testing with Storybook and Cypress, catching 95+ UI defects before production deployments.
* Mentored 5 mid-level engineers through weekly code reviews, architectural design pairing, and performance benchmarking workshops.

Frontend Software Engineer | Apex Retail | 2019 - 2022
* Built high-conversion responsive checkout flow using React, Redux Toolkit, and Tailwind CSS, increasing checkout completion rate by 18%.
* Integrated client-side telemetry and error tracking with Sentry and Datadog, cutting mean time to resolution (MTTR) by 25%.
* Collaborated closely with UX designers and product managers to conduct A/B testing across 250,000 monthly active users.

EDUCATION
B.S. in Computer Science | University of California, Davis | 2015 - 2019`,
    jobDescText: `Job Title: Senior Frontend Engineer
Company: LinearPulse
Location: San Francisco, CA (Hybrid / Remote friendly)

About The Role:
We are seeking an experienced Senior Frontend Engineer to lead our frontend architecture, expand our internal design system, and elevate web application performance across our core analytics suite.

Key Responsibilities:
* Architect, build, and maintain robust, accessible web interfaces using React 18, TypeScript, and modern component systems.
* Lead the evolution of our Storybook design system component library in close collaboration with Product Design.
* Drive Web Vitals optimization and client-side performance audits (LCP, FID/INP, CLS) across all core customer journeys.
* Establish frontend testing standards using Jest, React Testing Library, and End-to-End frameworks (Cypress/Playwright).
* Mentor mid-level and junior developers, participate in technical roadmap planning, and conduct rigorous code reviews.

Required Qualifications:
* 5+ years of production experience building complex single-page applications with React and TypeScript.
* Deep proficiency in modern CSS (Tailwind CSS or CSS Modules), responsive UI design, and web accessibility standards (WCAG 2.1 AA).
* Demonstrated experience optimizing frontend performance, bundle analysis, and Web Vitals metrics.
* Experience with component library tooling such as Storybook and automated visual regression testing.
* Excellent communication skills and proven ability to cross-collaborate with Design, Product, and Backend engineers.

Preferred Qualifications:
* Hands-on experience with Next.js App Router and server-side rendering.
* Experience with GraphQL client caching (Apollo or TanStack Query).
* Track record of building data visualization components using D3 or Recharts.`,
    sampleBullets: [
      'Engineered an enterprise design system in React and TypeScript adopted by 14 cross-functional teams, reducing UI development cycle time by 35%.',
      'Refactored core dashboard architecture to Next.js server components, boosting Core Web Vitals and improving page load speed by 42%.',
      'Built high-conversion responsive checkout flow using React, Redux Toolkit, and Tailwind CSS, increasing checkout completion rate by 18%.',
      'Integrated client-side telemetry and error tracking with Sentry and Datadog, cutting mean time to resolution by 25%.',
      'Helped out with visual design and discussed features with product managers on various calls.'
    ]
  },
  {
    id: 'product-manager-pivot',
    title: 'Product Manager (Moderate Match with Gap)',
    badge: 'Pivot / Gap (~65%)',
    jobRole: 'Lead Technical Product Manager - AI & Data Infrastructure',
    resumeText: `PRIYA SHARMA
Austin, TX | priya.sharma@example.com | linkedin.com/in/psharma-pm

PROFESSIONAL SUMMARY
Dynamic Product Manager with 4 years of experience guiding B2B SaaS workflow tools and customer success automation. Strong background in agile scrum ceremonies, user interviews, backlog prioritization, and launch management.

EXPERIENCE
Product Manager | NexaWorkflow | 2022 - Present
* Defined product requirements and roadmap for customer feedback intelligence platform used by 80+ enterprise clients.
* Conducted 60+ customer discovery interviews to uncover critical pain points, leading to a revamped onboarding flow that raised 30-day retention by 14%.
* Led sprint planning, backlog refinement, and daily standups for an engineering squad of 8 developers and 2 designers.
* Partnered with Sales and Marketing to execute go-to-market launches resulting in $1.2M in net new ARR within 6 months.

Associate Product Manager | VentureOps | 2020 - 2022
* Managed feature backlog and release checklists for internal operations CRM, reducing manual ticket processing time by 20%.
* Created detailed user stories and wireframes in Jira and Miro for cross-functional sprint deliveries.

EDUCATION & SKILLS
B.A. in Economics | University of Texas at Austin
Skills: Agile / Scrum, Jira, Product Discovery, Backlog Management, User Research, Roadmapping, SQL (Basic)`,
    jobDescText: `Job Title: Lead Technical Product Manager - AI & Data Infrastructure
Company: DataMesh Labs
Location: Austin, TX

Role Overview:
DataMesh Labs is seeking a Lead Technical Product Manager to oversee our real-time streaming data infrastructure and generative AI feature pipeline. You will collaborate directly with machine learning researchers, data platform engineers, and enterprise security leads.

Responsibilities:
* Define technical specs and API roadmaps for our distributed streaming data pipelines (Kafka, Apache Flink) and vector search index.
* Oversee LLM orchestration services and retrieval-augmented generation (RAG) capabilities for enterprise LLM agents.
* Work closely with data platform engineers on throughput benchmarks, GPU inference latency SLOs, and SOC2 / HIPAA compliance.
* Guide technical trade-offs between open-source foundation models and managed hyperscaler AI APIs.

Qualifications:
* 6+ years of technical product management experience specifically within distributed data platforms, MLOps, or AI products.
* Hands-on technical background: ability to read Python code, write advanced SQL, and architect REST/gRPC data contracts.
* Proven track record deploying machine learning or generative AI models to production environments with strict latency SLAs.
* Deep knowledge of modern vector databases (Pinecone, Weaviate, pgvector) and streaming pipelines (Kafka, Kinesis).`,
    sampleBullets: [
      'Defined product requirements and roadmap for customer feedback intelligence platform used by 80+ enterprise clients.',
      'Conducted 60+ customer discovery interviews to uncover critical pain points, leading to a revamped onboarding flow that raised 30-day retention by 14%.',
      'Partnered with Sales and Marketing to execute go-to-market launches resulting in $1.2M in net new ARR within 6 months.',
      'Managed feature backlog and release checklists for internal operations CRM, reducing manual ticket processing time by 20%.'
    ]
  }
];
