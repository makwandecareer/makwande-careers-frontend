"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ClipboardCheck,
  FilePenLine,
  FileSearch,
  FileText,
  Gauge,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  Linkedin,
  LockKeyhole,
  Menu,
  MessageSquareText,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserRoundSearch,
  UserSearch,
  UsersRound,
  WandSparkles,
  X,
} from "lucide-react";

import "./worldclass-cover.css";

const coreModules = [
  {
    icon: FileText,
    title: "AI CV Builder",
    description:
      "Create professional, ATS-ready CVs from a complete career profile and target role.",
  },
  {
    icon: BarChart3,
    title: "ATS Intelligence",
    description:
      "Analyse keyword coverage, structure, readability, evidence and role alignment.",
  },
  {
    icon: BrainCircuit,
    title: "Career Intelligence",
    description:
      "Identify strengths, career gaps, leadership signals and progression opportunities.",
  },
  {
    icon: ClipboardCheck,
    title: "Application Copilot",
    description:
      "Prepare cover letters, recruiter briefs, application plans and interview strategy.",
  },
  {
    icon: UserSearch,
    title: "Recruiter Simulation",
    description:
      "See how recruiters may review your CV before you submit the application.",
  },
  {
    icon: WandSparkles,
    title: "AI Resume Writer",
    description:
      "Strengthen summaries, achievements and role-specific evidence without inventing claims.",
  },
  {
    icon: Target,
    title: "Job Matching",
    description:
      "Compare your documented experience with vacancies using transparent match dimensions.",
  },
  {
    icon: LayoutDashboard,
    title: "Opportunity Dashboard",
    description:
      "Rank, compare, save and manage several opportunities from one command centre.",
  },
];

const allTools = [
  "CV Studio",
  "Professional CV templates",
  "PDF and DOCX export",
  "ATS Intelligence",
  "Career Intelligence",
  "Skill-gap analysis",
  "Career-fit explanations",
  "AI Resume Writer",
  "Application Copilot",
  "Job Matching",
  "Opportunity Dashboard",
  "Career Coach",
  "Career Progress Dashboard",
  "Career Goal Planner",
  "Interview Preparation Studio",
  "Dynamic Interview Builder",
  "Interview Simulation",
  "Experience Interview Engine",
  "Technical Deep Dive",
  "Pressure Interview",
  "Executive Interview",
  "Assessment Centre",
  "Company Intelligence",
  "Recruitment Intelligence",
  "Career Copilot",
  "Opportunity Intelligence",
  "Application Command Centre",
  "Recruiter Employer Portal",
  "Career Operating System",
  "CV Intake and Revamp Centre",
];

const workflow = [
  {
    number: "01",
    title: "Build your career profile",
    text: "Add your education, experience, skills, projects, certifications, languages and references once.",
  },
  {
    number: "02",
    title: "Create and improve your CV",
    text: "Generate a polished CV, select a template and strengthen your evidence with responsible AI guidance.",
  },
  {
    number: "03",
    title: "Analyse the opportunity",
    text: "Paste a vacancy and run ATS, recruiter, job-match and career-readiness analysis.",
  },
  {
    number: "04",
    title: "Prepare the full application",
    text: "Use the Copilot, interview tools and opportunity dashboard to complete every step.",
  },
];

const faqs = [
  {
    question: "What is included in the 14-day access plan?",
    answer:
      "The 14-day plan gives candidates access to the CV platform and AI career tools during the active access period, including CV creation, ATS analysis, job matching and document export.",
  },
  {
    question: "Can I cancel the premium subscription?",
    answer:
      "Yes. The premium plan is designed to allow candidates to cancel renewal from account settings. Access remains available until the end of the paid period.",
  },
  {
    question: "Does the AI invent experience or achievements?",
    answer:
      "No. Makwande Careers is designed to work from information supplied by the candidate and to avoid inventing unsupported achievements, salaries, qualifications or company facts.",
  },
  {
    question: "Can I download my CV?",
    answer:
      "Yes. Candidates can export supported CVs in PDF and DOCX formats.",
  },
  {
    question: "Is the platform only for graduates?",
    answer:
      "No. The platform is designed for graduates, experienced professionals, career changers and job seekers preparing for local or global opportunities.",
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="wc-page">
      <header className="wc-nav">
        <Link href="/" className="wc-brand" aria-label="Makwande Careers home">
          <span className="wc-brand-mark">MC</span>
          <span>
            <strong>MAKWANDE</strong>
            <small>CAREERS</small>
          </span>
        </Link>

        <nav className="wc-desktop-nav" aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <a href="#features">AI Tools</a>
          <a href="#founder">Why trust us</a>
          <a href="#pricing">Pricing</a>
          <a href="#employers">Employers</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="wc-nav-actions">
          <Link href="/login" className="wc-sign-in">
            Sign in
          </Link>
          <Link href="/register" className="wc-nav-cta">
            Start now
          </Link>
          <button
            type="button"
            className="wc-menu-button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {menuOpen ? (
          <nav className="wc-mobile-nav">
            <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>AI Tools</a>
            <a href="#founder" onClick={() => setMenuOpen(false)}>Why trust us</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#employers" onClick={() => setMenuOpen(false)}>Employers</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          </nav>
        ) : null}
      </header>

      <section className="wc-hero">
        <div className="wc-hero-copy">
          <span className="wc-kicker">
            <Sparkles size={16} />
            Africa&apos;s AI career operating system
          </span>

          <h1>
            Build the career
            <span>recruiters want to hire.</span>
          </h1>

          <p>
            Create recruiter-ready CVs, analyse ATS compatibility, match
            opportunities, prepare applications and practise interviews from one
            intelligent platform.
          </p>

          <div className="wc-actions">
            <Link href="/register" className="wc-primary-action">
              Start 14-day access — R45
              <ArrowRight size={18} />
            </Link>
            <a href="#platform" className="wc-secondary-action">
              <PlayCircle size={18} />
              Explore the platform
            </a>
          </div>

          <div className="wc-trust-row">
            <span><ShieldCheck size={17} /> Responsible AI guidance</span>
            <span><FileSearch size={17} /> ATS-ready workflow</span>
            <span><Globe2 size={17} /> Built in South Africa</span>
          </div>
        </div>

        <div className="wc-product-preview" aria-label="Makwande Careers dashboard preview">
          <div className="wc-preview-top">
            <div><span /><span /><span /></div>
            <small>Career Command Centre</small>
          </div>

          <div className="wc-preview-body">
            <aside>
              <div className="wc-preview-brand">
                <span>MC</span>
                <div>
                  <strong>MAKWANDE</strong>
                  <small>CAREERS</small>
                </div>
              </div>

              <nav>
                <span className="active"><Gauge size={15} />Dashboard</span>
                <span><FileText size={15} />AI CV Builder</span>
                <span><BarChart3 size={15} />ATS Intelligence</span>
                <span><Target size={15} />Job Matching</span>
                <span><BriefcaseBusiness size={15} />Opportunities</span>
              </nav>
            </aside>

            <div className="wc-preview-content">
              <div className="wc-preview-heading">
                <div>
                  <small>CAREER READINESS</small>
                  <h3>Your intelligent career command centre</h3>
                </div>
                <strong>89%</strong>
              </div>

              <div className="wc-preview-metrics">
                <article>
                  <span>ATS compatibility</span>
                  <strong>82%</strong>
                  <i><b style={{ width: "82%" }} /></i>
                </article>
                <article>
                  <span>Job match</span>
                  <strong>76%</strong>
                  <i><b style={{ width: "76%" }} /></i>
                </article>
                <article>
                  <span>Interview readiness</span>
                  <strong>74%</strong>
                  <i><b style={{ width: "74%" }} /></i>
                </article>
              </div>

              <div className="wc-preview-lower">
                <article className="wc-preview-document">
                  <span className="wc-mini-label">LIVE CV PREVIEW</span>
                  <div className="wc-document-name">Makwande Candidate</div>
                  <div className="wc-line wc-line-short" />
                  <div className="wc-line" />
                  <div className="wc-line" />
                  <div className="wc-line wc-line-medium" />
                  <div className="wc-line" />
                </article>

                <article className="wc-preview-findings">
                  <span className="wc-mini-label">PRIORITY FINDINGS</span>
                  <div><Check size={14} /> Strong keyword alignment</div>
                  <div><Target size={14} /> Improve measurable outcomes</div>
                  <div><BrainCircuit size={14} /> Strengthen leadership evidence</div>
                </article>
              </div>
            </div>
          </div>

          <div className="wc-floating-card wc-floating-one">
            <BarChart3 size={18} />
            <span>ATS Score</span>
            <strong>82%</strong>
          </div>
          <div className="wc-floating-card wc-floating-two">
            <UserSearch size={18} />
            <span>Recruiter ready</span>
            <strong>Improving</strong>
          </div>
        </div>
      </section>

      <section className="wc-founder" id="founder">
        <div className="wc-founder-image">
          <Image
            src="/founder-makwande.png"
            alt="Founder of Makwande Careers"
            width={720}
            height={720}
            priority
          />
          <div className="wc-founder-badge">
            <Linkedin size={18} />
            300K+ professional audience
          </div>
        </div>

        <div className="wc-founder-copy">
          <span className="wc-eyebrow">BUILT FROM REAL CAREER-MARKET EXPERIENCE</span>
          <h2>Built by Makwande Gcora</h2>
          <p className="wc-founder-role">
            Founder &amp; CEO, Makwande Careers
          </p>
          <p>
            Makwande Careers was created to help graduates and professionals
            compete more effectively through AI-powered career technology,
            recruiter-focused guidance and practical tools that support the
            entire application journey.
          </p>

          <div className="wc-founder-stats">
            <article>
              <strong>309K+</strong>
              <span>LinkedIn followers</span>
            </article>
            <article>
              <strong>30.2M+</strong>
              <span>Content impressions</span>
            </article>
            <article>
              <strong>798K+</strong>
              <span>Social engagements</span>
            </article>
          </div>

          <div className="wc-proof-note">
            <ShieldCheck size={18} />
            <p>
              These figures reflect the founder&apos;s public LinkedIn audience
              and content performance, not registered platform users.
            </p>
          </div>

          <a
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noreferrer"
            className="wc-linkedin-button"
          >
            <Linkedin size={17} />
            View LinkedIn presence
          </a>
        </div>
      </section>

      <section className="wc-proof-gallery" aria-label="LinkedIn social proof">
        <div className="wc-proof-gallery-heading">
          <span className="wc-eyebrow">PUBLIC REACH AND PROFESSIONAL INFLUENCE</span>
          <h2>Evidence of a large professional audience</h2>
          <p>
            Makwande Careers is backed by an established professional network
            and measurable public content reach.
          </p>
        </div>

        <div className="wc-proof-gallery-grid">
          <button type="button" aria-label="LinkedIn profile proof">
            <Image src="/linkedin-profile-proof.png" alt="LinkedIn profile screenshot" width={900} height={560} />
          </button>
          <button type="button" aria-label="LinkedIn impressions proof">
            <Image src="/linkedin-impressions-proof.png" alt="LinkedIn impressions screenshot" width={900} height={900} />
          </button>
          <button type="button" aria-label="LinkedIn engagement proof">
            <Image src="/linkedin-engagement-proof.png" alt="LinkedIn engagement screenshot" width={900} height={560} />
          </button>
        </div>
      </section>

      <section className="wc-section" id="features">
        <div className="wc-section-heading">
          <span className="wc-eyebrow">CORE AI PLATFORM</span>
          <h2>One platform. Every major career tool.</h2>
          <p>
            Move from CV creation to application preparation without switching
            between disconnected tools or repeating your information.
          </p>
        </div>

        <div className="wc-feature-grid">
          {coreModules.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title}>
                <div className="wc-feature-icon"><Icon size={22} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <Link href="/register">
                  Explore feature
                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="wc-workflow" id="platform">
        <div className="wc-section-heading wc-section-heading-light">
          <span className="wc-eyebrow">CONNECTED CAREER WORKFLOW</span>
          <h2>From profile to application readiness</h2>
          <p>
            Build once, improve continuously and use the same information across
            every career workflow.
          </p>
        </div>

        <div className="wc-workflow-grid">
          {workflow.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wc-section wc-platform-list">
        <div className="wc-platform-copy">
          <span className="wc-eyebrow">COMPLETE CAREER OPERATING SYSTEM</span>
          <h2>More than a CV builder</h2>
          <p>
            Makwande Careers combines document creation, recruitment
            intelligence, interview preparation and opportunity management in
            one connected platform.
          </p>
          <Link href="/register" className="wc-primary-action">
            Create your account
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="wc-option-grid">
          {allTools.map((tool) => (
            <div key={tool}>
              <Check size={16} />
              <span>{tool}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wc-employer" id="employers">
        <div className="wc-employer-visual">
          <div className="wc-employer-search">
            <div className="wc-search-bar">
              <Search size={17} />
              <span>Search qualified candidates</span>
            </div>

            <div className="wc-candidate-row">
              <span className="wc-avatar">AM</span>
              <div><strong>Operations Graduate</strong><small>Logistics · Johannesburg</small></div>
              <span>82% match</span>
            </div>
            <div className="wc-candidate-row">
              <span className="wc-avatar">TN</span>
              <div><strong>Junior Data Analyst</strong><small>Analytics · Pretoria</small></div>
              <span>79% match</span>
            </div>
            <div className="wc-candidate-row">
              <span className="wc-avatar">LK</span>
              <div><strong>Project Coordinator</strong><small>Administration · Cape Town</small></div>
              <span>76% match</span>
            </div>
          </div>
        </div>

        <div className="wc-employer-copy">
          <span className="wc-eyebrow">EMPLOYER AND RECRUITER PORTAL</span>
          <h2>Connect organisations with stronger candidate profiles</h2>
          <p>
            The employer platform is designed to support candidate discovery,
            profile review, interview preparation and more efficient recruitment
            workflows.
          </p>

          <div className="wc-employer-points">
            <span><UsersRound size={18} /> Search candidate profiles</span>
            <span><FileSearch size={18} /> Review structured career evidence</span>
            <span><Building2 size={18} /> Manage employer opportunities</span>
            <span><MessageSquareText size={18} /> Support interview coordination</span>
          </div>
        </div>
      </section>

      <section className="wc-section wc-pricing" id="pricing">
        <div className="wc-section-heading">
          <span className="wc-eyebrow">SIMPLE ACCESS</span>
          <h2>Choose the access period that suits your job search</h2>
          <p>
            Use the connected CV and AI career platform during your active
            access period.
          </p>
        </div>

        <div className="wc-pricing-grid">
          <article>
            <span className="wc-plan-name">14-Day Access</span>
            <div className="wc-price"><small>R</small><strong>45</strong></div>
            <p>Ideal for a focused CV and application sprint.</p>
            <ul>
              <li><Check size={16} /> Unlimited CV editing</li>
              <li><Check size={16} /> ATS and career intelligence</li>
              <li><Check size={16} /> Job matching and Copilot</li>
              <li><Check size={16} /> PDF and DOCX export</li>
            </ul>
            <Link href="/register">Start 14-day access</Link>
          </article>

          <article className="featured">
            <span className="wc-popular">MOST COMPLETE</span>
            <span className="wc-plan-name">30-Day Premium</span>
            <div className="wc-price"><small>R</small><strong>300</strong></div>
            <p>Complete access for an active job-search month.</p>
            <ul>
              <li><Check size={16} /> Everything in 14-Day Access</li>
              <li><Check size={16} /> Opportunity Dashboard</li>
              <li><Check size={16} /> Recruiter and interview simulations</li>
              <li><Check size={16} /> Career progress and goal tools</li>
              <li><Check size={16} /> Cancel renewal from settings</li>
            </ul>
            <Link href="/register">Start premium access</Link>
          </article>
        </div>

        <div className="wc-payment-trust">
          <LockKeyhole size={18} />
          <span>Secure Paystack checkout planned for candidate subscriptions.</span>
        </div>
      </section>

      <section className="wc-faq" id="faq">
        <div className="wc-faq-copy">
          <span className="wc-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Everything candidates need to know</h2>
          <p>
            Clear information about access, AI guidance, downloads and the
            planned subscription workflow.
          </p>
        </div>

        <div className="wc-faq-list">
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <article key={faq.question}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={open ? "open" : ""} size={18} />
                </button>
                {open ? <p>{faq.answer}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="wc-final-cta">
        <div>
          <span className="wc-eyebrow">YOUR CAREER COMMAND CENTRE</span>
          <h2>Build, analyse, prepare and apply from one platform</h2>
          <p>
            Create your profile and unlock a connected career-development
            workflow designed to help you present your experience more clearly.
          </p>
        </div>

        <Link href="/register" className="wc-primary-action wc-primary-light">
          Get started now
          <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="wc-footer">
        <div className="wc-footer-main">
          <div className="wc-footer-intro">
            <div className="wc-brand wc-brand-footer">
              <span className="wc-brand-mark">MC</span>
              <span>
                <strong>MAKWANDE</strong>
                <small>CAREERS</small>
              </span>
            </div>
            <p>
              Career-development technology for graduates, professionals and
              job seekers across Africa.
            </p>
          </div>

          <div className="wc-footer-column">
            <strong>Platform</strong>
            <Link href="/register">AI CV Builder</Link>
            <Link href="/register">ATS Intelligence</Link>
            <Link href="/register">Job Matching</Link>
            <Link href="/register">Career Copilot</Link>
          </div>

          <div className="wc-footer-column">
            <strong>Company</strong>
            <a href="#founder">About</a>
            <a href="#pricing">Pricing</a>
            <a href="#employers">Employers</a>
            <a href="#faq">Support</a>
          </div>

          <div className="wc-footer-column">
            <strong>Account</strong>
            <Link href="/login">Sign in</Link>
            <Link href="/register">Register</Link>
            <a href="#faq">Privacy</a>
            <a href="#faq">Terms</a>
          </div>
        </div>

        <div className="wc-footer-bottom">
          <span>© 2026 Makwande Careers. All rights reserved.</span>
          <span>Built in South Africa.</span>
        </div>
      </footer>
    </main>
  );
}
