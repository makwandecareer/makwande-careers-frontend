"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/client-api";

type Tool = "cover-letter" | "interview-prep" | "skills-gap" | "roadmap";
const tools: Tool[] = ["cover-letter", "interview-prep", "skills-gap", "roadmap"];

export default function CareerPage() {
  const [tool, setTool] = useState<Tool>("cover-letter");
  const [candidateName, setCandidateName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<any>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const endpoints: Record<Tool, string> = {
      "cover-letter": "/api/career/cover-letter-v6",
      "interview-prep": "/api/career/interview-prep-v6",
      "skills-gap": "/api/career/skills-gap-v6",
      "roadmap": "/api/career/roadmap-v6",
    };
    const payloads: Record<Tool, object> = {
      "cover-letter": { candidate_name: candidateName, target_role: targetRole, company_name: company, verified_strengths: [], verified_experience: [] },
      "interview-prep": { target_role: targetRole, job_description: jobDescription, candidate_strengths: [] },
      "skills-gap": { current_skills: [], target_role: targetRole, job_description: jobDescription },
      "roadmap": { current_role: null, target_role: targetRole, qualifications: [], skills: [] },
    };
    setResult(await api(endpoints[tool], { method: "POST", body: JSON.stringify(payloads[tool]) }));
  }

  return (
    <>
      <header className="page-header"><h1>Career assistant</h1><p className="muted">Generate structured career documents and preparation guidance.</p></header>
      <div className="tabs">{tools.map(item => <button key={item} className={`tab ${tool === item ? "tab-active" : ""}`} onClick={() => setTool(item)}>{item.replace("-", " ")}</button>)}</div>
      <div className="two-column">
        <form className="card form" onSubmit={submit}>
          {tool === "cover-letter" && <div className="field"><label>Candidate name</label><input className="input" value={candidateName} onChange={e => setCandidateName(e.target.value)} required /></div>}
          <div className="field"><label>Target role</label><input className="input" value={targetRole} onChange={e => setTargetRole(e.target.value)} required /></div>
          {tool === "cover-letter" && <div className="field"><label>Company name</label><input className="input" value={company} onChange={e => setCompany(e.target.value)} required /></div>}
          {(tool === "interview-prep" || tool === "skills-gap") && <div className="field"><label>Job description</label><textarea className="input" value={jobDescription} onChange={e => setJobDescription(e.target.value)} required /></div>}
          <button className="button button-primary">Generate</button>
        </form>
        <section className="card"><h3>Result</h3><pre className="output">{result ? JSON.stringify(result, null, 2) : "Your result will appear here."}</pre></section>
      </div>
    </>
  );
}
