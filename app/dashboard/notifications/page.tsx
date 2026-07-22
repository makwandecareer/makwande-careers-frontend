"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import styles from "../account.module.css";

type Notification={id:string;notification_type:string;title:string;message:string;action_url:string|null;is_read:boolean;created_at:string};

export default function NotificationsPage(){
 const [items,setItems]=useState<Notification[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(true);
 async function load(){setBusy(true);try{setItems(await api<Notification[]>("/api/candidate/notifications?limit=100"))}catch(e){setError(e instanceof Error?e.message:"Unable to load notifications")}finally{setBusy(false)}}
 useEffect(()=>{load()},[]);
 async function read(item:Notification){if(!item.is_read){await api(`/api/candidate/notifications/${item.id}`,{method:"PUT",body:JSON.stringify({is_read:true})});setItems(v=>v.map(x=>x.id===item.id?{...x,is_read:true}:x))}}
 async function readAll(){await api("/api/candidate/notifications",{method:"PUT"});setItems(v=>v.map(x=>({...x,is_read:true})))}
 async function clearRead(){await api("/api/candidate/notifications/read",{method:"DELETE"});setItems(v=>v.filter(x=>!x.is_read))}
 return <><header className={styles.hero}><div><span className={styles.eyebrow}>Activity centre</span><h1>Notifications</h1><p className={styles.muted}>Job, application, interview, billing and security activity in one place.</p></div><div className={styles.actions}><button className={`${styles.button} ${styles.secondary}`} onClick={readAll}>Mark all read</button><button className={`${styles.button} ${styles.secondary}`} onClick={clearRead}>Clear read</button></div></header>{error&&<div className={styles.error}>{error}</div>}<section className={`${styles.card} ${styles.list}`}>{busy?<div className={styles.empty}>Loading notifications…</div>:items.length===0?<div className={styles.empty}>You are all caught up.</div>:items.map(item=><article key={item.id} className={`${styles.item} ${!item.is_read?styles.notificationUnread:""}`} onClick={()=>read(item)}><div><span className={styles.badge}>{item.notification_type.replaceAll("_"," ")}</span><h3>{item.title}</h3><p>{item.message}</p><small className={styles.muted}>{new Date(item.created_at).toLocaleString()}</small></div>{item.action_url&&<Link className={styles.button} href={item.action_url}>Open</Link>}</article>)}</section></>;
}
