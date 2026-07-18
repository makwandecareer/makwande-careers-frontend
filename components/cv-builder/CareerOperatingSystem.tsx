"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateCareerHealth,
  createApplication,
  createCVVersion,
  createGoal,
  createInteraction,
  createInterview,
  createLearning,
  createSalaryRecord,
  createTask,
  enterpriseCapabilities,
  type ApplicationStage,
  type CareerApplication,
  type CareerGoal,
  type CareerInterview,
  type CareerProfile,
  type CareerTask,
  type CVVersion,
  type InteractionType,
  type LearningItem,
  type LearningStatus,
  type PromotionReadiness,
  type RecruiterInteraction,
  type SalaryRecord,
  type TaskFrequency,
  type TaskStatus,
} from "@/lib/career-operating-system";
import styles from "./CareerOperatingSystem.module.css";

interface Props {
  cvContent: unknown;
  targetRole: string;
  jobDescription: string;
  atsScore: number | null;
}

const STORAGE_KEY = "makwande-career-operating-system-v1";
const STAGES: ApplicationStage[] = ["Targeted","Preparing","Applied","Screening","Interview","Assessment","Offer","Rejected","Withdrawn"];
const PERIODS: TaskFrequency[] = ["Daily","Weekly","Monthly"];
const TASK_STATUSES: TaskStatus[] = ["Not started","In progress","Completed"];
const LEARNING_STATUSES: LearningStatus[] = ["Planned","Active","Completed"];
const INTERACTION_TYPES: InteractionType[] = ["LinkedIn","Email","Phone","Interview","Networking","Referral"];

function cvText(value: unknown): string {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value ?? {}); } catch { return ""; }
}

function money(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value || 0);
}

export function CareerOperatingSystem({ cvContent, targetRole, jobDescription, atsScore }: Props) {
  const [view, setView] = useState<"command"|"tasks"|"pipeline"|"growth"|"network"|"enterprise">("command");
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<CareerProfile>({
    fullName: "", currentRole: "", targetRole, currentSalary: 0, targetSalary: 0,
    location: "South Africa", language: "English", weeklyHours: 5, lastUpdated: new Date().toISOString(),
  });
  const [tasks, setTasks] = useState<CareerTask[]>([
    createTask({ title: "Review priority opportunities", category: "Applications", impact: 8 }),
    createTask({ title: "Complete one focused skill action", category: "Learning", impact: 7 }),
    createTask({ title: "Follow up with one recruiter", category: "Networking", frequency: "Weekly", impact: 8 }),
  ]);
  const [goals, setGoals] = useState<CareerGoal[]>([
    createGoal({ title: "High-fit applications", target: 5, unit: "applications" }),
    createGoal({ title: "Recruiter conversations", period: "Monthly", target: 6, unit: "conversations" }),
  ]);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [interviews, setInterviews] = useState<CareerInterview[]>([]);
  const [learning, setLearning] = useState<LearningItem[]>([]);
  const [cvs, setCVs] = useState<CVVersion[]>([
    createCVVersion({ name: "Primary Career CV", targetRole, atsScore: atsScore ?? 0, notes: cvText(cvContent) ? "Connected to CV Builder." : "" }),
  ]);
  const [interactions, setInteractions] = useState<RecruiterInteraction[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [promotion, setPromotion] = useState<PromotionReadiness>({
    performance: 55, skillDepth: 55, leadership: 45, visibility: 40, impactEvidence: 45, sponsorSupport: 35,
  });

  const [taskTitle, setTaskTitle] = useState("");
  const [taskFrequency, setTaskFrequency] = useState<TaskFrequency>("Daily");
  const [appDraft, setAppDraft] = useState(() => createApplication({ role: targetRole, matchScore: 70 }));
  const [interviewDraft, setInterviewDraft] = useState(() => createInterview({ role: targetRole, readiness: 60 }));
  const [learningDraft, setLearningDraft] = useState(() => createLearning());
  const [interactionDraft, setInteractionDraft] = useState(() => createInteraction());
  const [salaryDraft, setSalaryDraft] = useState(() => createSalaryRecord());
  const [cvName, setCVName] = useState("Role-specific CV");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.profile) setProfile(data.profile);
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (Array.isArray(data.goals)) setGoals(data.goals);
        if (Array.isArray(data.applications)) setApplications(data.applications);
        if (Array.isArray(data.interviews)) setInterviews(data.interviews);
        if (Array.isArray(data.learning)) setLearning(data.learning);
        if (Array.isArray(data.cvs)) setCVs(data.cvs);
        if (Array.isArray(data.interactions)) setInteractions(data.interactions);
        if (Array.isArray(data.salaryHistory)) setSalaryHistory(data.salaryHistory);
        if (data.promotion) setPromotion(data.promotion);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, tasks, goals, applications, interviews, learning, cvs, interactions, salaryHistory, promotion }));
  }, [hydrated, profile, tasks, goals, applications, interviews, learning, cvs, interactions, salaryHistory, promotion]);

  useEffect(() => {
    setProfile((p) => ({ ...p, targetRole: p.targetRole || targetRole, lastUpdated: new Date().toISOString() }));
  }, [targetRole]);

  const health = useMemo(() => calculateCareerHealth({
    profile, tasks, goals, applications, interviews, learning, cvs, interactions, salaryHistory, promotion,
  }), [profile, tasks, goals, applications, interviews, learning, cvs, interactions, salaryHistory, promotion]);

  const addTask = () => {
    if (!taskTitle.trim()) return;
    setTasks((x) => [createTask({ title: taskTitle.trim(), frequency: taskFrequency }), ...x]);
    setTaskTitle("");
  };

  const addApplication = () => {
    if (!appDraft.company.trim() || !appDraft.role.trim()) return;
    setApplications((x) => [createApplication(appDraft), ...x]);
    setAppDraft(createApplication({ role: profile.targetRole, matchScore: 70 }));
  };

  const addInterview = () => {
    if (!interviewDraft.company.trim() || !interviewDraft.role.trim()) return;
    setInterviews((x) => [createInterview(interviewDraft), ...x]);
    setInterviewDraft(createInterview({ role: profile.targetRole, readiness: 60 }));
  };

  const addLearning = () => {
    if (!learningDraft.title.trim()) return;
    setLearning((x) => [createLearning(learningDraft), ...x]);
    setLearningDraft(createLearning());
  };

  const addInteraction = () => {
    if (!interactionDraft.recruiter.trim() && !interactionDraft.company.trim()) return;
    setInteractions((x) => [createInteraction(interactionDraft), ...x]);
    setInteractionDraft(createInteraction());
  };

  const addSalary = () => {
    if (!salaryDraft.role.trim() || !salaryDraft.annualSalary) return;
    setSalaryHistory((x) => [createSalaryRecord(salaryDraft), ...x]);
    setSalaryDraft(createSalaryRecord());
  };

  return (
    <div className={styles.os}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Phase 20 · AI Career Operating System</span>
          <h1>Makwande Careers — The AI Career Platform</h1>
          <p>Your daily career companion for planning, applications, interviews, learning, recruiter relationships, salary growth and promotion readiness.</p>
        </div>
        <div className={styles.healthCard}>
          <span>Career health</span>
          <strong>{health.overall}</strong>
          <small>{health.overall >= 80 ? "Strong momentum" : health.overall >= 65 ? "Progressing well" : "Focused action required"}</small>
        </div>
      </header>

      <nav className={styles.nav}>
        {[
          ["command","Career Command Centre"],["tasks","Tasks & Goals"],["pipeline","Applications & Interviews"],
          ["growth","Learning, CV & Salary"],["network","Recruiters & Promotion"],["enterprise","Enterprise Platform"],
        ].map(([key,label]) => (
          <button key={key} type="button" className={view === key ? styles.activeNav : ""} onClick={() => setView(key as typeof view)}>{label}</button>
        ))}
      </nav>

      {view === "command" && <>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Career intelligence</span><h2>Your career system at a glance</h2></div></div>
          <div className={styles.scoreGrid}>
            {[
              ["Readiness",health.readiness],["Execution",health.execution],["Market positioning",health.marketPositioning],
              ["Learning velocity",health.learningVelocity],["Network strength",health.networkStrength],
              ["Salary progression",health.financialProgression],["Promotion readiness",health.promotionReadiness],
            ].map(([label,score]) => <article key={String(label)}><div><span>{label}</span><strong>{score}%</strong></div><div className={styles.track}><span style={{width:`${score}%`}} /></div></article>)}
          </div>
          <div className={styles.commandGrid}>
            <article><span className={styles.eyebrow}>AI priorities</span><h3>Next-best actions</h3>{health.recommendations.map(x => <p key={x}>→ {x}</p>)}</article>
            <article><span className={styles.eyebrow}>Career risk</span><h3>Attention required</h3>{health.alerts.length ? health.alerts.map(x => <p key={x}>⚠ {x}</p>) : <p>✓ No major alerts.</p>}</article>
            <article><span className={styles.eyebrow}>Live metrics</span><h3>Career activity</h3><p>{applications.length} tracked applications</p><p>{interviews.length} interviews</p><p>{learning.length} learning plans</p><p>{interactions.length} recruiter interactions</p></article>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Career identity</span><h2>Professional profile</h2></div></div>
          <div className={styles.formGrid}>
            <label><span>Full name</span><input value={profile.fullName} onChange={e=>setProfile(p=>({...p,fullName:e.target.value}))}/></label>
            <label><span>Current role</span><input value={profile.currentRole} onChange={e=>setProfile(p=>({...p,currentRole:e.target.value}))}/></label>
            <label><span>Target role</span><input value={profile.targetRole} onChange={e=>setProfile(p=>({...p,targetRole:e.target.value}))}/></label>
            <label><span>Location</span><input value={profile.location} onChange={e=>setProfile(p=>({...p,location:e.target.value}))}/></label>
            <label><span>Current salary</span><input type="number" value={profile.currentSalary} onChange={e=>setProfile(p=>({...p,currentSalary:Number(e.target.value)}))}/></label>
            <label><span>Target salary</span><input type="number" value={profile.targetSalary} onChange={e=>setProfile(p=>({...p,targetSalary:Number(e.target.value)}))}/></label>
            <label><span>Preferred language</span><input value={profile.language} onChange={e=>setProfile(p=>({...p,language:e.target.value}))}/></label>
            <label><span>Career hours per week</span><input type="number" min={1} value={profile.weeklyHours} onChange={e=>setProfile(p=>({...p,weeklyHours:Number(e.target.value)}))}/></label>
          </div>
        </section>
      </>}

      {view === "tasks" && <div className={styles.twoColumn}>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Daily execution</span><h2>Tasks</h2></div></div>
          <div className={styles.inlineForm}><input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Add a high-impact career action"/><select value={taskFrequency} onChange={e=>setTaskFrequency(e.target.value as TaskFrequency)}>{PERIODS.map(x=><option key={x}>{x}</option>)}</select><button type="button" onClick={addTask}>Add task</button></div>
          <div className={styles.list}>{tasks.map(task=><article key={task.id}><div><span>{task.category} · {task.frequency}</span><h3>{task.title}</h3><small>Impact {task.impact}/10 · Due {task.dueDate}</small></div><select value={task.status} onChange={e=>setTasks(x=>x.map(t=>t.id===task.id?{...t,status:e.target.value as TaskStatus}:t))}>{TASK_STATUSES.map(x=><option key={x}>{x}</option>)}</select></article>)}</div>
        </section>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Goal system</span><h2>Weekly and monthly goals</h2></div></div>
          <div className={styles.list}>{goals.map(goal=>{const progress=Math.min(100,Math.round(goal.current/Math.max(1,goal.target)*100));return <article key={goal.id}><div className={styles.goal}><span>{goal.period}</span><h3>{goal.title}</h3><small>{goal.current}/{goal.target} {goal.unit}</small><div className={styles.track}><span style={{width:`${progress}%`}}/></div></div><div className={styles.goalButtons}><button onClick={()=>setGoals(x=>x.map(g=>g.id===goal.id?{...g,current:Math.max(0,g.current-1)}:g))}>−</button><button onClick={()=>setGoals(x=>x.map(g=>g.id===goal.id?{...g,current:g.current+1}:g))}>+</button></div></article>})}</div>
        </section>
      </div>}

      {view === "pipeline" && <>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Opportunity pipeline</span><h2>Job application tracker</h2></div></div>
          <div className={styles.formGrid}>
            <label><span>Company</span><input value={appDraft.company} onChange={e=>setAppDraft(x=>({...x,company:e.target.value}))}/></label>
            <label><span>Role</span><input value={appDraft.role} onChange={e=>setAppDraft(x=>({...x,role:e.target.value}))}/></label>
            <label><span>Stage</span><select value={appDraft.stage} onChange={e=>setAppDraft(x=>({...x,stage:e.target.value as ApplicationStage}))}>{STAGES.map(x=><option key={x}>{x}</option>)}</select></label>
            <label><span>Match score</span><input type="number" min={0} max={100} value={appDraft.matchScore} onChange={e=>setAppDraft(x=>({...x,matchScore:Number(e.target.value)}))}/></label>
            <label><span>Applied date</span><input type="date" value={appDraft.appliedDate} onChange={e=>setAppDraft(x=>({...x,appliedDate:e.target.value}))}/></label>
            <label><span>Next action</span><input value={appDraft.nextAction} onChange={e=>setAppDraft(x=>({...x,nextAction:e.target.value}))}/></label>
            <label><span>Next action date</span><input type="date" value={appDraft.nextActionDate} onChange={e=>setAppDraft(x=>({...x,nextActionDate:e.target.value}))}/></label>
            <label><span>Salary maximum</span><input type="number" value={appDraft.salaryMax} onChange={e=>setAppDraft(x=>({...x,salaryMax:Number(e.target.value)}))}/></label>
          </div>
          <button className={styles.primary} onClick={addApplication}>Add application</button>
          <div className={styles.pipeline}>{STAGES.slice(0,7).map(stage=><div key={stage}><h3>{stage}</h3>{applications.filter(x=>x.stage===stage).map(item=><article key={item.id}><strong>{item.company}</strong><span>{item.role}</span><small>{item.matchScore}% match</small><select value={item.stage} onChange={e=>setApplications(x=>x.map(a=>a.id===item.id?{...a,stage:e.target.value as ApplicationStage}:a))}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></article>)}</div>)}</div>
        </section>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Interview readiness</span><h2>Interview tracker</h2></div></div>
          <div className={styles.formGrid}>
            <label><span>Company</span><input value={interviewDraft.company} onChange={e=>setInterviewDraft(x=>({...x,company:e.target.value}))}/></label>
            <label><span>Role</span><input value={interviewDraft.role} onChange={e=>setInterviewDraft(x=>({...x,role:e.target.value}))}/></label>
            <label><span>Date</span><input type="datetime-local" value={interviewDraft.date} onChange={e=>setInterviewDraft(x=>({...x,date:e.target.value}))}/></label>
            <label><span>Type</span><input value={interviewDraft.type} onChange={e=>setInterviewDraft(x=>({...x,type:e.target.value}))}/></label>
            <label><span>Readiness</span><input type="number" min={0} max={100} value={interviewDraft.readiness} onChange={e=>setInterviewDraft(x=>({...x,readiness:Number(e.target.value)}))}/></label>
            <label><span>Outcome</span><input value={interviewDraft.outcome} onChange={e=>setInterviewDraft(x=>({...x,outcome:e.target.value}))}/></label>
          </div>
          <button className={styles.primary} onClick={addInterview}>Add interview</button>
          <div className={styles.cardGrid}>{interviews.map(x=><article key={x.id}><span>{x.type}</span><h3>{x.company}</h3><p>{x.role}</p><strong>{x.readiness}% ready</strong><small>{x.date || "Date pending"} · {x.outcome}</small></article>)}</div>
        </section>
      </>}

      {view === "growth" && <>
        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <div className={styles.heading}><div><span className={styles.eyebrow}>Capability building</span><h2>Learning tracker</h2></div></div>
            <div className={styles.formGrid}>
              <label><span>Programme</span><input value={learningDraft.title} onChange={e=>setLearningDraft(x=>({...x,title:e.target.value}))}/></label>
              <label><span>Provider</span><input value={learningDraft.provider} onChange={e=>setLearningDraft(x=>({...x,provider:e.target.value}))}/></label>
              <label><span>Skill</span><input value={learningDraft.skill} onChange={e=>setLearningDraft(x=>({...x,skill:e.target.value}))}/></label>
              <label><span>Status</span><select value={learningDraft.status} onChange={e=>setLearningDraft(x=>({...x,status:e.target.value as LearningStatus}))}>{LEARNING_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label><span>Progress</span><input type="number" min={0} max={100} value={learningDraft.progress} onChange={e=>setLearningDraft(x=>({...x,progress:Number(e.target.value)}))}/></label>
              <label><span>Target date</span><input type="date" value={learningDraft.targetDate} onChange={e=>setLearningDraft(x=>({...x,targetDate:e.target.value}))}/></label>
            </div>
            <button className={styles.primary} onClick={addLearning}>Add learning plan</button>
            <div className={styles.list}>{learning.map(x=><article key={x.id}><div className={styles.goal}><span>{x.provider || "Provider pending"} · {x.status}</span><h3>{x.title}</h3><small>{x.skill} · {x.progress}% complete</small><div className={styles.track}><span style={{width:`${x.progress}%`}}/></div></div></article>)}</div>
          </section>
          <section className={styles.panel}>
            <div className={styles.heading}><div><span className={styles.eyebrow}>Document intelligence</span><h2>CV versions</h2></div></div>
            <div className={styles.inlineForm}><input value={cvName} onChange={e=>setCVName(e.target.value)}/><button onClick={()=>{if(!cvName.trim())return;setCVs(x=>[createCVVersion({name:cvName.trim(),targetRole:profile.targetRole,atsScore:atsScore??0,notes:jobDescription?"Created from active job description.":"Created in Career OS."}),...x]);}}>Save version</button></div>
            <div className={styles.list}>{cvs.map(x=><article key={x.id}><div><span>{x.targetRole || "General profile"}</span><h3>{x.name}</h3><small>{new Date(x.updatedAt).toLocaleString()} · ATS {x.atsScore}%</small></div></article>)}</div>
          </section>
        </div>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Financial career intelligence</span><h2>Salary progression</h2></div><span>Target {money(profile.targetSalary)}</span></div>
          <div className={styles.formGrid}>
            <label><span>Role</span><input value={salaryDraft.role} onChange={e=>setSalaryDraft(x=>({...x,role:e.target.value}))}/></label>
            <label><span>Employer</span><input value={salaryDraft.employer} onChange={e=>setSalaryDraft(x=>({...x,employer:e.target.value}))}/></label>
            <label><span>Annual salary</span><input type="number" value={salaryDraft.annualSalary} onChange={e=>setSalaryDraft(x=>({...x,annualSalary:Number(e.target.value)}))}/></label>
            <label><span>Date</span><input type="date" value={salaryDraft.date} onChange={e=>setSalaryDraft(x=>({...x,date:e.target.value}))}/></label>
          </div>
          <button className={styles.primary} onClick={addSalary}>Add salary record</button>
          <div className={styles.cardGrid}>{salaryHistory.map(x=><article key={x.id}><span>{x.date}</span><h3>{x.role}</h3><p>{x.employer}</p><strong>{money(x.annualSalary)}</strong></article>)}</div>
        </section>
      </>}

      {view === "network" && <div className={styles.twoColumn}>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Recruiter CRM</span><h2>Professional interactions</h2></div></div>
          <div className={styles.formGrid}>
            <label><span>Recruiter/contact</span><input value={interactionDraft.recruiter} onChange={e=>setInteractionDraft(x=>({...x,recruiter:e.target.value}))}/></label>
            <label><span>Company</span><input value={interactionDraft.company} onChange={e=>setInteractionDraft(x=>({...x,company:e.target.value}))}/></label>
            <label><span>Type</span><select value={interactionDraft.type} onChange={e=>setInteractionDraft(x=>({...x,type:e.target.value as InteractionType}))}>{INTERACTION_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
            <label><span>Date</span><input type="date" value={interactionDraft.date} onChange={e=>setInteractionDraft(x=>({...x,date:e.target.value}))}/></label>
            <label className={styles.full}><span>Summary</span><textarea rows={3} value={interactionDraft.summary} onChange={e=>setInteractionDraft(x=>({...x,summary:e.target.value}))}/></label>
            <label><span>Follow-up date</span><input type="date" value={interactionDraft.followUpDate} onChange={e=>setInteractionDraft(x=>({...x,followUpDate:e.target.value}))}/></label>
          </div>
          <button className={styles.primary} onClick={addInteraction}>Record interaction</button>
          <div className={styles.list}>{interactions.map(x=><article key={x.id}><div><span>{x.type} · {x.date}</span><h3>{x.recruiter || x.company}</h3><p>{x.company} — {x.summary}</p><small>Follow up: {x.followUpDate || "Not scheduled"}</small></div></article>)}</div>
        </section>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Advancement intelligence</span><h2>Promotion readiness</h2></div><strong>{health.promotionReadiness}%</strong></div>
          <div className={styles.readiness}>
            {([["Performance","performance"],["Skill depth","skillDepth"],["Leadership","leadership"],["Visibility","visibility"],["Impact evidence","impactEvidence"],["Sponsor support","sponsorSupport"]] as const).map(([label,key])=><label key={key}><div><span>{label}</span><strong>{promotion[key]}%</strong></div><input type="range" min={0} max={100} value={promotion[key]} onChange={e=>setPromotion(p=>({...p,[key]:Number(e.target.value)}))}/></label>)}
          </div>
          <div className={styles.advice}><h3>Promotion strategy</h3><p>Document measurable outcomes, leadership evidence and organisational impact.</p><p>Increase visibility with decision-makers and identify a credible sponsor.</p></div>
        </section>
      </div>}

      {view === "enterprise" && <>
        <section className={styles.panel}>
          <div className={styles.heading}><div><span className={styles.eyebrow}>Enterprise capabilities</span><h2>Global career technology platform</h2></div><span>{enterpriseCapabilities.length} capabilities</span></div>
          <div className={styles.capabilities}>{enterpriseCapabilities.map(([name,category,status])=><article key={name}><div><span>{category}</span><strong>{status}</strong></div><h3>{name}</h3><p>Enterprise-ready capability within the Makwande Careers platform roadmap.</p></article>)}</div>
        </section>
        <section className={styles.vision}>
          <span className={styles.eyebrow}>Long-term vision</span>
          <h2>Makwande Careers — The AI Career Platform</h2>
          <p>Build a professional CV. Optimise it for ATS. Match it to jobs. Practise interviews. Complete assessment-centre exercises. Receive personalised coaching. Track applications and interviews. Build missing skills. Measure career readiness. Help employers identify the best candidates.</p>
        </section>
      </>}
    </div>
  );
}
