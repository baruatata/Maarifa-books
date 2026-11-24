import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabase, isSupabaseConfigured } from "@/src/lib/supabase";

const navy="#10233F",gold="#C9A34A";
type Chapter={id:string;chapter_index:number;title:string;audio_path:string;is_preview:boolean;url:string};
type Saved={chapterId:string;time:number};
const progressKey=(bookId:string)=>"maarifabooks-audio-progress-"+bookId;
function timeLabel(seconds:number){if(!Number.isFinite(seconds)||seconds<0)return "00:00";const n=Math.floor(seconds);return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");}

export default function ListenScreen(){
 const {id}=useLocalSearchParams<{id:string}>();
 const [title,setTitle]=useState("Sikiliza kitabu");
 const [chapters,setChapters]=useState<Chapter[]>([]);
 const [active,setActive]=useState(0);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [rate,setRate]=useState(1);
 const [restored,setRestored]=useState(false);
 const lastSave=useRef(0);
 const restoreFor=useRef<string|null>(null);
 const finishedFor=useRef<string|null>(null);
 const player=useAudioPlayer(null,{updateInterval:1000});
 const status=useAudioPlayerStatus(player);
 const current=chapters[active];

 useEffect(()=>{void setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:"doNotMix"}).catch(()=>{});},[]);
 useEffect(()=>{let alive=true;(async()=>{
  try{
   if(!isSupabaseConfigured)throw new Error("Supabase haijaunganishwa. Sanidi mobile/.env kwanza.");
   const supabase=getSupabase();
   const [{data:book,error:bookError},{data:rows,error:chapterError}]=await Promise.all([
    supabase.from("books").select("id,title,format,status").eq("id",id).eq("status","approved").maybeSingle(),
    supabase.from("book_audio_chapters").select("id,chapter_index,title,audio_path,is_preview").eq("book_id",id).order("chapter_index",{ascending:true})
   ]);
   if(bookError)throw bookError;if(chapterError)throw chapterError;
   if(!book)throw new Error("Kitabu hiki hakipatikani.");
   if(book.format!=="audiobook")throw new Error("Kitabu hiki si audiobook.");
   if(!rows?.length)throw new Error("Sauti za kitabu hiki hazijapatikana au huna ruhusa ya kuzisikiliza.");
   const signed=await Promise.all(rows.map(async(row)=>{
    const {data,error}=await supabase.storage.from("book-files").createSignedUrl(row.audio_path,3600);
    if(error||!data?.signedUrl)throw error??new Error("Kiungo cha sauti hakikupatikana.");
    return {...row,url:data.signedUrl} as Chapter;
   }));
   if(!alive)return;
   setTitle(book.title);setChapters(signed);
   const savedRaw=await AsyncStorage.getItem(progressKey(String(id)));
   if(savedRaw){const saved=JSON.parse(savedRaw) as Saved;const index=signed.findIndex(c=>c.id===saved.chapterId);if(index>=0&&Number.isFinite(saved.time)&&saved.time>0){setActive(index);restoreFor.current=signed[index].id;}}
  }catch(e){if(alive)setError(e instanceof Error?e.message:"Imeshindikana kufungua audiobook.");}
  finally{if(alive)setLoading(false);}
 })();return()=>{alive=false;};},[id]);

 useEffect(()=>{if(!current)return;restoreFor.current=current.id;player.replace({uri:current.url});setRestored(false);},[active,chapters.length]);
 useEffect(()=>{if(!current||!status.isLoaded||restoreFor.current!==current.id||restored)return;
  let alive=true;(async()=>{try{const raw=await AsyncStorage.getItem(progressKey(String(id)));if(!alive)return;if(raw){const saved=JSON.parse(raw) as Saved;if(saved.chapterId===current.id&&Number.isFinite(saved.time)&&saved.time>0&&saved.time<status.duration)await player.seekTo(saved.time);}if(alive){setRestored(true);player.playbackRate=rate;}}catch{if(alive)setRestored(true);}})();return()=>{alive=false;};
 },[current?.id,status.isLoaded,restored,id]);

 const saveProgress=useCallback(async()=>{if(!current)return;try{await AsyncStorage.setItem(progressKey(String(id)),JSON.stringify({chapterId:current.id,time:status.currentTime} satisfies Saved));}catch{}},[current?.id,id,status.currentTime]);
 useEffect(()=>{if(!current||!status.isLoaded||!restored)return;const now=Date.now();if(now-lastSave.current>5000){lastSave.current=now;void saveProgress();}},[status.currentTime,status.isLoaded,restored,saveProgress,current?.id]);
 useEffect(()=>{player.playbackRate=rate;},[rate]);
 useEffect(()=>{if(status.didJustFinish&&current&&finishedFor.current!==current.id){finishedFor.current=current.id;void saveProgress();if(active<chapters.length-1)setActive(v=>Math.min(v+1,chapters.length-1));}},[status.didJustFinish,current?.id,active,chapters.length,saveProgress]);

 function changeChapter(index:number){if(index<0||index>=chapters.length||index===active)return;void saveProgress();setActive(index);}
 function toggle(){if(!current)return;if(status.playing)player.pause();else player.play();}
 function seek(seconds:number){const end=status.duration||0;void player.seekTo(Math.max(0,Math.min(end,status.currentTime+seconds)));}

 if(loading)return <SafeAreaView style={styles.safe}><ActivityIndicator color={gold} size="large" style={{marginTop:70}}/></SafeAreaView>;
 if(error)return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.heading}>Audiobook haijafunguka</Text><Text style={styles.muted}>{error}</Text><Link href={"/book/"+id} style={styles.back}>Rudi kwenye kitabu</Link></View></SafeAreaView>;
 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}>
  <Link href={"/book/"+id} style={styles.back}>‹  Rudi kwenye kitabu</Link>
  <View style={styles.hero}><Text style={styles.eyebrow}>MAARIFABOOKS AUDIO</Text><View style={styles.disc}><Text style={styles.discText}>♫</Text></View><Text style={styles.heading}>{title}</Text><Text style={styles.mutedLight}>{current?.title??"Sura ya kitabu"}</Text><Text style={styles.counter}>SURA {active+1} / {chapters.length}</Text></View>
  <View style={styles.playerCard}>
   <Text style={styles.section}>Sikiliza kitabu</Text>
   <View style={styles.progressTrack}><View style={[styles.progressFill,{width:(status.duration>0?Math.min(100,status.currentTime/status.duration*100):0)+"%"}]}/></View>
   <View style={styles.times}><Text style={styles.muted}>{timeLabel(status.currentTime)}</Text><Text style={styles.muted}>{timeLabel(status.duration)}</Text></View>
   <View style={styles.controls}><Pressable onPress={()=>seek(-15)} style={styles.skip}><Text style={styles.skipText}>−15s</Text></Pressable><Pressable onPress={toggle} disabled={!status.isLoaded} style={styles.play}><Text style={styles.playText}>{status.isBuffering?"…":status.playing?"Ⅱ":"▶"}</Text></Pressable><Pressable onPress={()=>seek(30)} style={styles.skip}><Text style={styles.skipText}>+30s</Text></Pressable></View>
   <Text style={styles.rateLabel}>Kasi ya usomaji</Text><View style={styles.rates}>{[0.75,1,1.25,1.5,1.75,2].map(v=><Pressable key={v} onPress={()=>setRate(v)} style={[styles.rateButton,rate===v&&styles.rateActive]}><Text style={[styles.rateText,rate===v&&styles.rateTextActive]}>{v}×</Text></Pressable>)}</View>
   <Text style={styles.saved}>{restored?"Maendeleo ya usikilizaji yanahifadhiwa kwenye kifaa hiki.":"Inatayarisha sauti..."}</Text>
  </View>
  <View style={styles.playerCard}><Text style={styles.section}>Orodha ya sura</Text>{chapters.map((chapter,index)=><Pressable key={chapter.id} onPress={()=>changeChapter(index)} style={[styles.chapter,index===active&&styles.chapterActive]}><View style={styles.chapterNumber}><Text style={styles.chapterNumberText}>{index+1}</Text></View><View style={{flex:1}}><Text style={[styles.chapterTitle,index===active&&styles.chapterTitleActive]}>{chapter.title}</Text>{chapter.is_preview&&<Text style={styles.preview}>SAMPULI YA BURE</Text>}</View><Text style={styles.chapterAction}>{index===active?(status.playing?"▶":"Ⅱ"):"›"}</Text></Pressable>)}</View>
 </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#F7F8FA"},container:{padding:18,paddingBottom:40},back:{color:navy,fontSize:13,fontWeight:"800",marginBottom:16},hero:{backgroundColor:navy,borderRadius:20,padding:22,alignItems:"center"},eyebrow:{color:gold,fontSize:10,fontWeight:"900",letterSpacing:1.5},disc:{width:108,height:108,borderRadius:54,backgroundColor:"#203A5C",borderWidth:5,borderColor:gold,alignItems:"center",justifyContent:"center",marginTop:20,marginBottom:18},discText:{fontSize:42,color:"#FFFFFF"},heading:{fontSize:21,fontWeight:"900",color:"#FFFFFF",textAlign:"center"},mutedLight:{fontSize:13,color:"#D5DCE5",marginTop:8},counter:{fontSize:10,color:gold,fontWeight:"900",marginTop:14,letterSpacing:1},playerCard:{backgroundColor:"#FFFFFF",borderRadius:16,borderWidth:1,borderColor:"#E7EAF0",padding:17,marginTop:14},section:{fontSize:16,fontWeight:"900",color:navy,marginBottom:15},progressTrack:{height:6,backgroundColor:"#E7EAF0",borderRadius:5,overflow:"hidden"},progressFill:{height:6,backgroundColor:gold,borderRadius:5},times:{flexDirection:"row",justifyContent:"space-between",marginTop:8},muted:{color:"#748091",fontSize:11,lineHeight:18},controls:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:28,marginVertical:17},skip:{width:54,height:44,borderRadius:12,backgroundColor:"#F0F2F5",alignItems:"center",justifyContent:"center"},skipText:{color:navy,fontSize:13,fontWeight:"800"},play:{width:68,height:68,borderRadius:34,backgroundColor:navy,alignItems:"center",justifyContent:"center"},playText:{color:"#FFFFFF",fontSize:25,fontWeight:"900"},rateLabel:{textAlign:"center",color:"#748091",fontSize:11,fontWeight:"700",marginBottom:10},rates:{flexDirection:"row",justifyContent:"space-between",gap:5},rateButton:{paddingVertical:9,paddingHorizontal:8,borderRadius:9,backgroundColor:"#F0F2F5"},rateActive:{backgroundColor:navy},rateText:{fontSize:10,color:navy,fontWeight:"700"},rateTextActive:{color:"#FFFFFF"},saved:{fontSize:10,color:"#718091",textAlign:"center",marginTop:14},chapter:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:"#EEF0F3"},chapterActive:{backgroundColor:"#F7F8FA",borderRadius:10,paddingHorizontal:9},chapterNumber:{width:32,height:32,borderRadius:16,backgroundColor:"#EEF0F3",alignItems:"center",justifyContent:"center"},chapterNumberText:{color:navy,fontWeight:"900",fontSize:11},chapterTitle:{fontSize:13,color:navy,fontWeight:"700"},chapterTitleActive:{color:"#92752F"},preview:{fontSize:9,color:"#16744A",fontWeight:"900",marginTop:4},chapterAction:{color:gold,fontSize:19,fontWeight:"900"},center:{flex:1,justifyContent:"center",alignItems:"center",padding:24}});
