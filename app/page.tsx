"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileSearch,
  FileText,
  Gauge,
  Globe2,
  LayoutDashboard,
  Linkedin,
  LockKeyhole,
  Menu,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserSearch,
  UsersRound,
  WandSparkles,
  X,
} from "lucide-react";

import "./worldclass-cover.css";

const testimonials = [
  {
    name: "Mpho Tsie",
    role: "Army Communications Specialist",
    image: "/testimonials/mpho-tsie.png",
    quote:
      "South Africans need mentorship and wisdom when it comes to job seeking. I was pleased with my experience and I got hired soon after I got my CV. Thank you for believing in me. Keep helping the youth of South Africa.",
  },
  {
    name: "Millicent Manana (MBA)",
    role: "Global Product Specialist",
    image: "/testimonials/millicent-manana.png",
    quote:
      "Makwande meticulously polished my CV, transforming it into a compelling showcase of my professional strengths. This refined document propelled me straight into my dream job.",
  },
  {
    name: "Sonia Shokwe",
    role: "Goods Receiving Coordinator",
    image: "/testimonials/sonia-shokwe.png",
    quote:
      "Makwande Careers transformed my CV into a standout piece that highlighted my skills and experience. I secured two interviews shortly after the revamp and later secured a job with one of the biggest companies in South Africa.",
  },
  {
    name: "Ntsako Trevor Baloyi",
    role: "Graduate Trainee",
    image: "/testimonials/ntsako-baloyi.png",
    quote:
      "After a year of struggling to secure a graduate job, Makwande's personalised approach transformed my application strategy. Thanks to his guidance, I secured a Graduate Trainee role.",
  },
  {
    name: "Sandisiwe Mncanca",
    role: "Operations Management Professional",
    image: "/testimonials/sandisiwe-mncanca.png",
    quote:
      "He assisted me with CV revamping while I was still at university. After graduation, his guidance and support were invaluable to my career growth.",
  },
  {
    name: "Sonia Mavhungu",
    role: "Metallurgy Consultant",
    image: "/testimonials/sonia-mavhungu.png",
    quote:
      "He assisted me with a CV revamp, promoted me on LinkedIn, invited me to his informative online interview sessions and helped me negotiate salaries. Makwande is the best and I recommend him any day.",
  },
  {
    name: "Marcia Lehlongonolo Maimela",
    role: "Administrative Officer",
    image: "/testimonials/marcia-maimela.png",
    quote:
      "Working with Makwande and his team on my resume was one of the best professional decisions I have made. Their expertise, attention to detail and genuine desire to help others succeed are evident in every interaction.",
  },
  {
    name: "Zandile Hulane",
    role: "Compliance Officer",
    image: "/testimonials/zandile-hulane.png",
    quote:
      "After revamping my CV, I landed a couple of interviews and two months later I was employed by one of the South African banks.",
  },
  {
    name: "Palesa Molele",
    role: "Financial Accounting Graduate",
    image: "/testimonials/palesa-molele.png",
    quote:
      "After a year of unsuccessful interviews, Makwande helped revamp my CV, write a cover letter and provide interview tips that were very helpful.",
  },
  {
    name: "Yingisani Goodness Hlongwang",
    role: "Auditor",
    image: "/testimonials/yingisani-hlongwang.png",
    quote:
      "I made many applications without being called for interviews. Two weeks after revamping my CV with Makwande, I was called for different interviews.",
  },
  {
    name: "Aphiwe Malunga",
    role: "Quality Control Laboratory Technician",
    image: "/testimonials/aphiwe-malunga.png",
    quote:
      "Makwande provided support throughout my job search, revamped my CV and helped me write a cover letter when I struggled to do so.",
  },
  {
    name: "Fikile Ntshangase",
    role: "Quality Engineer",
    image: "/testimonials/fikile-ntshangase.png",
    quote:
      "In less than two months after Makwande helped revamp my CV, I managed to get eight interviews and two job offers.",
  },
  {
    name: "Thabang Gaolefeloe",
    role: "Process Engineer",
    image: "/testimonials/thabang-gaolefeloe.png",
    quote:
      "Makwande is the go-to person for helping young professionals prepare for suitable opportunities and interviews. He takes people step by step through the preparation journey.",
  },
];

const coreModules = [
  ["AI CV Builder", "Create professional, ATS-ready CVs from one career profile.", FileText],
  ["ATS Intelligence", "Analyse keyword coverage, structure, readability and evidence.", BarChart3],
  ["Career Intelligence", "Understand strengths, gaps and progression opportunities.", BrainCircuit],
  ["Application Copilot", "Prepare cover letters, recruiter briefs and application plans.", ClipboardCheck],
  ["Recruiter Simulation", "See how a recruiter may review your CV before submission.", UserSearch],
  ["AI Resume Writer", "Strengthen summaries and achievement evidence responsibly.", WandSparkles],
  ["Job Matching", "Compare your experience with vacancies using transparent scores.", Target],
  ["Opportunity Dashboard", "Rank, save and manage multiple job opportunities.", LayoutDashboard],
] as const;

const faqs = [
  ["What is included in 14-day access?", "Candidates receive access to CV creation, ATS analysis, career intelligence, job matching, application preparation and supported exports during the active period."],
  ["Does access renew automatically?", "No. The current R45 and R300 plans are once-off access purchases. Access ends after the selected 14-day or 30-day period."],
  ["Does the AI invent experience?", "No. The system is designed to work from candidate-supplied evidence and avoid inventing unsupported achievements, qualifications or company facts."],
  ["Can I download my CV?", "Yes. Supported CVs can be exported in PDF and DOCX formats."],
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [testimonialStart, setTestimonialStart] = useState(0);

  const visibleTestimonials = useMemo(
    () => [0, 1, 2].map((offset) => testimonials[(testimonialStart + offset) % testimonials.length]),
    [testimonialStart],
  );

  return (
    <main className="site">
      <header className="nav">
        <Link href="/" className="brand">
          <Image src="/makwande-careers-logo.jpeg" alt="Makwande Careers" width={52} height={52} priority />
          <span><strong>MAKWANDE</strong><small>CAREERS</small></span>
        </Link>

        <nav className="desktopNav">
          <a href="#platform">Platform</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#founder">Founder</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="navActions">
          <Link href="/login" className="signIn">Sign in</Link>
          <Link href="/register" className="navCta">Start now</Link>
          <button type="button" className="menuBtn" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="mobileNav">
            {["platform", "testimonials", "founder", "pricing", "faq"].map((id) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{id}</a>
            ))}
          </nav>
        )}
      </header>

      <section className="hero">
        <div className="heroCopy">
          <span className="kicker"><Sparkles size={16} /> Africa&apos;s AI career operating system</span>
          <h1>Build the career <span>recruiters want to hire.</span></h1>
          <p>
            Create recruiter-ready CVs, analyse ATS compatibility, match opportunities,
            prepare complete applications and practise interviews from one intelligent platform.
          </p>
          <div className="actions">
            <Link href="/register" className="primary">Start 14-day access — R45 <ArrowRight size={18} /></Link>
            <a href="#platform" className="secondary"><PlayCircle size={18} /> Explore the platform</a>
          </div>
          <div className="trustRow">
            <span><ShieldCheck size={17} /> Responsible AI</span>
            <span><FileSearch size={17} /> ATS-ready workflow</span>
            <span><Globe2 size={17} /> Built in South Africa</span>
          </div>
        </div>

        <div className="product">
          <div className="browser"><div><i /><i /><i /></div><small>Career Command Centre</small></div>
          <div className="productBody">
            <aside>
              <Image src="/makwande-careers-logo.jpeg" alt="" width={44} height={44} />
              <nav>
                <span className="active"><Gauge size={15} />Dashboard</span>
                <span><FileText size={15} />AI CV Builder</span>
                <span><BarChart3 size={15} />ATS Intelligence</span>
                <span><Target size={15} />Job Matching</span>
                <span><BriefcaseBusiness size={15} />Opportunities</span>
              </nav>
            </aside>
            <div className="productContent">
              <div className="command">
                <div><small>CAREER READINESS</small><h3>Your intelligent career command centre</h3></div>
                <strong>89%</strong>
              </div>
              <div className="metrics">
                {[["ATS compatibility","82%"],["Job match","76%"],["Interview readiness","74%"]].map(([a,b]) => (
                  <article key={a}><span>{a}</span><strong>{b}</strong><i><b style={{width:b}} /></i></article>
                ))}
              </div>
              <div className="previewGrid">
                <article className="doc">
                  <small>LIVE CV PREVIEW</small><h4>Professional Candidate</h4>
                  <p /><p /><p className="short" /><p /><p className="medium" />
                </article>
                <article className="findings">
                  <small>PRIORITY FINDINGS</small>
                  <div><Check size={14}/>Strong keyword alignment</div>
                  <div><Target size={14}/>Improve measurable outcomes</div>
                  <div><BrainCircuit size={14}/>Strengthen leadership evidence</div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="founder" id="founder">
        <div className="founderPhoto">
          <Image src="/founder-makwande.png" alt="Makwande Gcora" width={720} height={720} />
        </div>
        <div className="founderCopy">
          <span className="eyebrow">BUILT FROM REAL CAREER-MARKET EXPERIENCE</span>
          <h2>Built by Makwande Gcora</h2>
          <p className="role">Founder &amp; CEO, Makwande Careers</p>
          <p>
            Makwande Careers was built to help graduates and professionals compete more effectively
            through career technology, recruiter-focused guidance and practical support across the full application journey.
          </p>
          <div className="stats">
            <article><strong>309K+</strong><span>LinkedIn followers</span></article>
            <article><strong>30.2M+</strong><span>Content impressions</span></article>
            <article><strong>798K+</strong><span>Social engagements</span></article>
          </div>
          <div className="note"><ShieldCheck size={18}/><p>These figures represent Makwande Gcora&apos;s public LinkedIn audience and content performance, not registered platform users.</p></div>
          <a className="linkedin" href="https://www.linkedin.com/" target="_blank" rel="noreferrer"><Linkedin size={17}/>View LinkedIn presence</a>
        </div>
      </section>

      <section className="testimonials" id="testimonials">
        <div className="sectionHead light">
          <span className="eyebrow">REAL LINKEDIN RECOMMENDATIONS</span>
          <h2>Career outcomes shared by real clients</h2>
          <p>Testimonials below are transcribed from recommendations publicly shared on LinkedIn by Makwande&apos;s clients.</p>
        </div>

        <div className="testimonialGrid">
          {visibleTestimonials.map((item) => (
            <article key={item.name}>
              <div className="person">
                <Image src={item.image} alt={item.name} width={58} height={58} />
                <div><strong>{item.name}</strong><span>{item.role}</span><small><Linkedin size={12}/> LinkedIn recommendation</small></div>
              </div>
              <div className="stars">{[0,1,2,3,4].map((x)=><Star key={x} size={15} fill="currentColor"/>)}</div>
              <blockquote>“{item.quote}”</blockquote>
            </article>
          ))}
        </div>

        <div className="testimonialControls">
          <button type="button" onClick={() => setTestimonialStart((v) => (v - 1 + testimonials.length) % testimonials.length)}>Previous</button>
          <span>{testimonialStart + 1} / {testimonials.length}</span>
          <button type="button" onClick={() => setTestimonialStart((v) => (v + 1) % testimonials.length)}>Next</button>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="sectionHead">
          <span className="eyebrow">CORE AI PLATFORM</span>
          <h2>One platform. Every major career tool.</h2>
          <p>Move from CV creation to application preparation without repeating your information or switching tools.</p>
        </div>
        <div className="featureGrid">
          {coreModules.map(([title, description, Icon]) => (
            <article key={title}>
              <div className="featureIcon"><Icon size={22}/></div>
              <h3>{title}</h3><p>{description}</p>
              <Link href="/register">Explore feature <ArrowRight size={15}/></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="proofText">
        <div className="sectionHead light">
          <span className="eyebrow">PUBLIC PROFESSIONAL REACH</span>
          <h2>Social proof, presented transparently</h2>
          <p>The founder&apos;s LinkedIn analytics show a large and engaged professional audience.</p>
        </div>
        <div className="proofCards">
          <article><strong>30,276,136</strong><span>LinkedIn content impressions</span><p>Measured in the supplied LinkedIn content-performance dashboard.</p></article>
          <article><strong>798,520</strong><span>Social engagements</span><p>Including reactions, comments, reposts, saves and sends.</p></article>
          <article><strong>52% / 48%</strong><span>In-network / out-of-network discovery</span><p>Evidence that content reaches both established connections and new audiences.</p></article>
          <article><strong>309,601</strong><span>Followers shown on profile</span><p>Public LinkedIn profile count supplied by the founder.</p></article>
        </div>
      </section>

      <section className="pricing section" id="pricing">
        <div className="sectionHead">
          <span className="eyebrow">SIMPLE ACCESS</span>
          <h2>Choose the access period that suits your job search</h2>
          <p>Use the connected CV and AI career platform during your active access period.</p>
        </div>
        <div className="pricingGrid">
          <article>
            <span className="plan">14-Day Access</span>
            <div className="price"><small>R</small><strong>45</strong></div>
            <p>Ideal for a focused CV and application sprint.</p>
            <ul><li><Check size={16}/>Unlimited CV editing</li><li><Check size={16}/>ATS and career intelligence</li><li><Check size={16}/>Job matching and Copilot</li><li><Check size={16}/>PDF and DOCX export</li></ul>
            <Link href="/register">Start 14-day access</Link>
          </article>
          <article className="featured">
            <span className="popular">MOST COMPLETE</span>
            <span className="plan">30-Day Premium</span>
            <div className="price"><small>R</small><strong>300</strong></div>
            <p>Complete access for an active job-search month.</p>
            <ul><li><Check size={16}/>Everything in 14-Day Access</li><li><Check size={16}/>Opportunity Dashboard</li><li><Check size={16}/>Recruiter and interview simulations</li><li><Check size={16}/>Career progress tools</li><li><Check size={16}/>Once-off 30-day access</li></ul>
            <Link href="/register">Start premium access</Link>
          </article>
        </div>
        <div className="paymentTrust"><LockKeyhole size={18}/>Secure Paystack checkout is used for once-off access payments.</div>
      </section>

      <section className="faq" id="faq">
        <div>
          <span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Everything candidates need to know</h2>
          <p>Clear information about access, AI guidance, downloads and subscriptions.</p>
        </div>
        <div className="faqList">
          {faqs.map(([q,a], i) => (
            <article key={q}>
              <button type="button" onClick={() => setOpenFaq(i === openFaq ? -1 : i)} aria-expanded={i===openFaq}>
                <span>{q}</span><ChevronDown size={18} className={i===openFaq ? "open":""}/>
              </button>
              {i===openFaq && <p>{a}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="finalCta">
        <div><span className="eyebrow">YOUR CAREER COMMAND CENTRE</span><h2>Build, analyse, prepare and apply from one platform</h2><p>Create your profile and unlock a connected workflow designed to help you present your experience more clearly.</p></div>
        <Link href="/register" className="primary lightBtn">Get started now <ArrowRight size={18}/></Link>
      </section>

      <footer className="footer">
        <div className="footerMain">
          <div className="footerIntro">
            <Image src="/makwande-careers-logo.jpeg" alt="Makwande Careers" width={72} height={72}/>
            <p>Career-development technology for graduates, professionals and job seekers across Africa.</p>
          </div>
          <div><strong>Platform</strong><Link href="/register">AI CV Builder</Link><Link href="/register">ATS Intelligence</Link><Link href="/register">Job Matching</Link></div>
          <div><strong>Company</strong><a href="#founder">Founder</a><a href="#testimonials">Testimonials</a><a href="#pricing">Pricing</a></div>
          <div><strong>Account</strong><Link href="/login">Sign in</Link><Link href="/register">Register</Link><Link href="/terms">Terms & conditions</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></div>
        </div>
        <div className="footerBottom"><span>© 2026 Makwande Careers.</span><span>Built in South Africa.</span></div>
      </footer>
    </main>
  );
}
