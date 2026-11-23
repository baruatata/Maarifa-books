"use client";

import {useEffect,useRef,useState} from "react";

type Chapter={id:string;title:string;url:string;chapterIndex:number};
export default function AudiobookPlayer({bookId,chapters}:{bookId:string;chapters:Chapter[]}){
 const audioRef=useRef<HTMLAudioElement>(null);
 const key="maarifabooks-audio-progress-"+bookId;
 const [active,setActive]=useState(0);const [speed,setSpeed]=useState("1");
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(key)||"null");if(saved&&Number.isInteger(saved.chapterIndex)&&saved.chapterIndex>=0&&saved.chapterIndex<chapters.length){setActive(saved.chapterIndex);const audio=audioRef.current;if(audio&&saved.time>0)audio.currentTime=saved.time;}}catch{}},[key,chapters.length]);
 useEffect(()=>{if(audioRef.current)audioRef.current.playbackRate=Number(speed);},[speed,active]);
 function saveProgress(){const audio=audioRef.current;if(audio)try{localStorage.setItem(key,JSON.stringify({chapterIndex:active,time:audio.currentTime}));}catch{}}
 function restoreChapterPosition(){const audio=audioRef.current;if(!audio)return;audio.playbackRate=Number(speed);try{const saved=JSON.parse(localStorage.getItem(key)||"null");if(saved&&saved.chapterIndex===active&&Number.isFinite(saved.time)&&saved.time>0)audio.currentTime=saved.time;}catch{}}
 function selectChapter(index:number){saveProgress();setActive(index);}
 function next(){if(active<chapters.length-1){setActive(active+1);}}
 function previous(){if(active>0){setActive(active-1);}}
 const chapter=chapters[active];
 if(!chapter)return <p className="message">Sauti za kitabu hazipatikani kwa sasa.</p>;
 return <section className="panel" style={{padding:20}}>
  <p className="eyebrow">SIKILIZA KITABU</p><h2>{chapter.title}</h2>
  <audio key={chapter.id} ref={audioRef} controls preload="metadata" src={chapter.url} onLoadedMetadata={restoreChapterPosition} onTimeUpdate={saveProgress} onPause={saveProgress} onEnded={next} style={{width:"100%"}}/>
  <div className="field" style={{marginTop:16}}><label htmlFor="audio-speed">Kasi ya usomaji</label><select id="audio-speed" value={speed} onChange={e=>setSpeed(e.target.value)}><option value="0.75">0.75×</option><option value="1">1× Kawaida</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select></div>
  <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"12px 0"}}><button type="button" className="btn btn-outline" onClick={previous} disabled={active===0}>Sura iliyotangulia</button><button type="button" className="btn btn-outline" onClick={next} disabled={active===chapters.length-1}>Sura inayofuata</button></div>
  <h3>Orodha ya sura</h3><ol>{chapters.map((item,index)=><li key={item.id} style={{marginBottom:8}}><button type="button" className={index===active?"btn":"btn btn-outline"} onClick={()=>selectChapter(index)}>{index+1}. {item.title}</button></li>)}</ol>
  <p className="muted">Maendeleo ya kusikiliza yanahifadhiwa kwenye kifaa hiki. Unaweza kusitisha na kuendelea wakati wowote.</p>
 </section>;
}
