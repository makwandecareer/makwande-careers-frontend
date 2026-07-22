"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import styles from "../account.module.css";

type Settings = {
  theme:string; language:string; timezone:string; ai_personalisation:boolean;
  profile_discoverable:boolean; product_updates:boolean; job_alerts:boolean;
  application_updates:boolean; interview_reminders:boolean;
  security_alerts:boolean; email_notifications:boolean;
};

const defaults:Settings={theme:"system",language:"en",timezone:"Africa/Johannesburg",ai_personalisation:true,profile_discoverable:false,product_updates:true,job_alerts:true,application_updates:true,interview_reminders:true,security_alerts:true,email_notifications:true};

export default function SettingsPage(){
  const [data,setData]=useState(defaults),[busy,setBusy]=useState(true),[message,setMessage]=useState(""),[error,setError]=useState("");
  useEffect(()=>{api<Settings>("/api/account/settings").then(setData).catch(e=>setError(e.message)).finally(()=>setBusy(false))},[]);
  async function save(event:FormEvent){event.preventDefault();setBusy(true);setError("");setMessage("");try{setData(await api<Settings>("/api/account/settings",{method:"PUT",body:JSON.stringify(data)}));setMessage("Your preferences have been saved.")}catch(e){setError(e instanceof Error?e.message:"Unable to save settings")}finally{setBusy(false)}}
  const toggle=(key:keyof Settings,title:string,description:string)=><label className={styles.toggle}><span><strong>{title}</strong><span>{description}</span></span><input type="checkbox" checked={Boolean(data[key])} onChange={e=>setData({...data,[key]:e.target.checked})}/></label>;
  return <><header className={styles.hero}><div><span className={styles.eyebrow}>Account centre</span><h1>Settings</h1><p className={styles.muted}>Control how Makwande Careers works for you.</p></div></header>{message&&<div className={styles.notice}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}<form className={styles.grid} onSubmit={save}><section className={styles.card}><div className={styles.cardHeader}><h2>Experience</h2></div><div className={styles.field}><label>Theme</label><select className={styles.input} value={data.theme} onChange={e=>setData({...data,theme:e.target.value})}><option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option></select></div><div className={styles.field}><label>Language</label><select className={styles.input} value={data.language} onChange={e=>setData({...data,language:e.target.value})}><option value="en">English</option></select></div><div className={styles.field}><label>Timezone</label><input className={styles.input} value={data.timezone} onChange={e=>setData({...data,timezone:e.target.value})}/></div>{toggle("ai_personalisation","AI personalisation","Use your career profile to produce more relevant AI guidance.")}{toggle("profile_discoverable","Employer discovery","Allow verified employers to discover your public career profile.")}</section><section className={styles.card}><div className={styles.cardHeader}><h2>Notification preferences</h2></div>{toggle("email_notifications","Email notifications","Receive selected alerts by email when delivery is configured.")}{toggle("job_alerts","Job matches","New roles that match your profile and goals.")}{toggle("application_updates","Application updates","Status changes and employer responses.")}{toggle("interview_reminders","Interview reminders","Preparation and scheduled interview reminders.")}{toggle("security_alerts","Security alerts","Important sign-in and account security events.")}{toggle("product_updates","Platform updates","Useful improvements and new AI capabilities.")}</section><div className={`${styles.card} ${styles.cardWide}`}><button className={styles.button} disabled={busy}>{busy?"Saving…":"Save settings"}</button></div></form></>;
}
