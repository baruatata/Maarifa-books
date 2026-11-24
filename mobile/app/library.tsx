import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabase, isSupabaseConfigured } from "@/src/lib/supabase";

const navy="#10233F",gold="#C9A34A";
type OwnedBook={id:string;book_id:string;created_at:string;books:{id:string;title:string;author_name:string|null;format:string;price_tzs:number}|null};

export default function LibraryScreen(){
 const [items,setItems]=useState<OwnedBook[]>([]);
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
  try{
   setError("");
   if(!isSupabaseConfigured)throw new Error("Supabase haijaunganishwa. Sanidi mobile/.env kwanza.");
   const {data:{user},error:authError}=await getSupabase().auth.getUser();
   if(authError)throw authError;
   if(!user){setItems([]);return;}
   const {data,error:queryError}=await getSupabase().from("book_entitlements").select("id,book_id,created_at,books!book_entitlements_book_id_fkey(id,title,author_name,format,price_tzs)").eq("buyer_id",user.id).order("created_at",{ascending:false});
   if(queryError)throw queryError;
   setItems((data??[]) as unknown as OwnedBook[]);
  }catch(e){setError(e instanceof Error?e.message:"Imeshindikana kupakia maktaba.");}
  finally{setLoading(false);setRefreshing(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 return <SafeAreaView style={styles.safe}>
  <View style={styles.header}><Link href="/" style={styles.back}>‹  Nyumbani</Link><Text style={styles.brand}>MAARIFA<Text style={{color:gold}}>BOOKS</Text></Text><Text style={styles.heading}>Maktaba yangu</Text><Text style={styles.sub}>Vitabu ulivyofungua kwa coupon vinaonekana hapa.</Text></View>
  {loading?<ActivityIndicator color={gold} size="large" style={{marginTop:50}}/>:error?<View style={styles.empty}><Text style={styles.title}>Hitilafu</Text><Text style={styles.sub}>{error}</Text><Pressable onPress={load} style={styles.button}><Text style={styles.buttonText}>Jaribu tena</Text></Pressable></View>:<FlatList data={items} keyExtractor={x=>x.id} contentContainerStyle={items.length?styles.list:styles.fill} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void load();}} tintColor={gold}/>} ListEmptyComponent={<View style={styles.empty}><Text style={styles.title}>Maktaba bado haina vitabu</Text><Text style={styles.sub}>Ukitumia coupon kufungua kitabu, kitaonekana hapa.</Text><Pressable onPress={()=>router.replace("/")} style={styles.button}><Text style={styles.buttonText}>Tafuta vitabu</Text></Pressable></View>} renderItem={({item})=><Pressable onPress={()=>item.books&&router.push("/book/"+item.books.id)} style={styles.book}><View style={styles.mark}><Text style={styles.markText}>MB</Text></View><View style={{flex:1}}><Text style={styles.title}>{item.books?.title??"Kitabu"}</Text><Text style={styles.sub}>{item.books?.author_name??"Mwandishi hajatajwa"}</Text><Text style={styles.meta}>{(item.books?.format??"").toUpperCase()}  •  KIMEFUNGULIWA</Text></View><Text style={styles.arrow}>›</Text></Pressable>}/>}
 </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#F7F8FA"},header:{backgroundColor:navy,padding:22,paddingTop:16,borderBottomLeftRadius:22,borderBottomRightRadius:22},back:{color:"#FFFFFF",fontSize:13,marginBottom:24},brand:{color:"#FFFFFF",fontSize:19,fontWeight:"900",letterSpacing:1},heading:{color:"#FFFFFF",fontSize:25,fontWeight:"900",marginTop:22},sub:{color:"#7A8797",fontSize:12,lineHeight:18,marginTop:6},headerSub:{color:"#D5DCE5"},list:{padding:18},fill:{flexGrow:1,justifyContent:"center",padding:20},book:{backgroundColor:"#FFFFFF",borderRadius:14,padding:13,marginBottom:10,flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"#E7EAF0"},mark:{width:48,height:64,borderRadius:6,backgroundColor:navy,borderLeftWidth:4,borderLeftColor:gold,alignItems:"center",justifyContent:"center",marginRight:13},markText:{color:gold,fontWeight:"900"},title:{color:navy,fontSize:14,fontWeight:"900"},meta:{color:"#92752F",fontSize:9,fontWeight:"800",marginTop:7},arrow:{color:gold,fontSize:25,paddingHorizontal:5},empty:{backgroundColor:"#FFFFFF",borderRadius:15,padding:22,alignItems:"center",margin:20},button:{backgroundColor:navy,borderRadius:10,paddingHorizontal:20,paddingVertical:13,marginTop:18},buttonText:{color:"#FFFFFF",fontSize:12,fontWeight:"800"}});
