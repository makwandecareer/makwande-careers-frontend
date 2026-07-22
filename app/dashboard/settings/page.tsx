"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CreditCard, FileText, LockKeyhole, Mail, UserRound } from "lucide-react";
import { api } from "@/lib/client-api";
import type { User } from "@/lib/types";
import styles from "../account.module.css";

type Settings = { theme:string; language:string; timezone:string; ai_personalisation:boolean; profile_discoverable:boolean; product_updates:boolean; job_alerts:boolean; application_updates:boolean; interview_reminders:boolean; security_alerts:boolean; email_notifications:boolean };
const defaults: Settings = {theme:"system",language:"en",timezone:"Africa/Johannesburg",ai_personalisation:true,profile_discoverable:false,product_updates:true,job_alerts:true,application_updates:true,interview_reminders:true,security_alerts:true,email_notifications:true};

export default function SettingsPage() {
  const [data,setData]=useState(defaults),[user,setUser]=useState<User|null>(null),[busy,setBusy]=useState(true),[message,setMessage]=useState(""),[error,setError]=useState("");
  useEffect(()=>{Promise.all([api<Settings>("/api/account/settings"),api<User>("/api/users/me")]).then(([settings,currentUser])=>{setData(settings);setUser(currentUser)}).catch((reason)=>setError(reason instanceof Error?reason.message:"Unable to load settings")).finally(()=>setBusy(false))},[]);
  async function save(event:FormEvent){event.preventDefault();setBusy(true);setError("");setMessage("");try{setData(await api<Settings>("/api/account/settings",{method:"PUT",body:JSON.stringify(data)}));setMessage("Your preferences have been saved.")}catch(reason){setError(reason instanceof Error?reason.message:"Unable to save settings")}finally{setBusy(false)}}
  const toggle=(key:keyof Settings,title:string,description:string)=><label className={styles.toggle}><span><strong>{title}</strong><span>{description}</span></span><input type="checkbox" checked={Boolean(data[key])} onChange={(event)=>setData({...data,[key]:event.target.checked})}/></label>;
  return <>
    <header className={styles.hero}><div><span className={styles.eyebrow}>Account centre</span><h1>Settings</h1><p className={styles.muted}>Manage login details, preferences, privacy and support from one place.</p></div></header>
    {message&&<div className={styles.notice}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}
    <section className={`${styles.card} ${styles.loginCard}`}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Login details</span><h2>Your Makwande account</h2></div><UserRound size={28}/></div><div className={styles.identityGrid}><div><span>Full name</span><strong>{user?.full_name||"Loading…"}</strong></div><div><span>Login email</span><strong>{user?.email||"Loading…"}</strong></div></div><div className={styles.actions}><Link className={styles.button} href="/dashboard/profile">Update profile</Link><Link className={`${styles.button} ${styles.secondary}`} href="/dashboard/security">Change password</Link></div></section>
    <form className={styles.grid} onSubmit={save}>
      <section className={styles.card}><div className={styles.cardHeader}><h2>Experience & privacy</h2></div><div className={styles.field}><label>Theme</label><select className={styles.input} value={data.theme} onChange={(event)=>setData({...data,theme:event.target.value})}><option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option></select></div><div className={styles.field}><label>Language</label><select className={styles.input} value={data.language} onChange={(event)=>setData({...data,language:event.target.value})}><option value="en">English</option></select></div><div className={styles.field}><label>Timezone</label><input className={styles.input} value={data.timezone} onChange={(event)=>setData({...data,timezone:event.target.value})}/></div>{toggle("ai_personalisation","AI personalisation","Use your career profile to produce more relevant AI guidance.")}{toggle("profile_discoverable","Employer discovery","Allow verified employers to discover your public career profile.")}</section>
      <section className={styles.card}><div className={styles.cardHeader}><h2>Notification preferences</h2></div>{toggle("email_notifications","Email notifications","Receive selected alerts by email when delivery is configured.")}{toggle("job_alerts","Job matches","New roles that match your profile and goals.")}{toggle("application_updates","Application updates","Status changes and employer responses.")}{toggle("interview_reminders","Interview reminders","Preparation and scheduled interview reminders.")}{toggle("security_alerts","Security alerts","Important sign-in and account security events.")}{toggle("product_updates","Platform updates","Useful improvements and new AI capabilities.")}</section>
      <div className={`${styles.card} ${styles.cardWide}`}><button className={styles.button} disabled={busy}>{busy?"Saving…":"Save settings"}</button></div>
    </form>
    <section className={styles.linkGrid} aria-label="Account resources"><Link href="/dashboard/security"><LockKeyhole/><span><strong>Security centre</strong><small>Password, sessions and activity</small></span></Link><Link href="/dashboard/billing"><CreditCard/><span><strong>Plans & payments</strong><small>Access periods and Paystack checkout</small></span></Link><Link href="/terms"><FileText/><span><strong>Terms & conditions</strong><small>Rules governing platform use</small></span></Link><Link href="/contact"><Mail/><span><strong>Contact Makwande</strong><small>Account, payment and career support</small></span></Link></section>
  </>;
}
