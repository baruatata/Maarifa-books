import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabase, isSupabaseConfigured } from "@/src/lib/supabase";

const navy="#10233F", gold="#C9A34A";
type Profile={full_name:string|null;phone:string|null;email:string|null;role:"buyer"|"seller"|"admin"|null};

export default function AccountScreen(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;(async()=>{
    try{
      if(!isSupabaseConfigured) return;
      const supabase=getSupabase();
      const {data:{user},error}=await supabase.auth.getUser();
      if(error) throw error;
      if(!user){if(active)setProfile(null);return;}
      const {data,error:profileError}=await supabase.from("profiles").select("full_name,phone,email,role").eq("id",user.id).maybeSingle();
      if(profileError) throw profileError;
      if(active)setProfile(data as Profile|null);
    }catch(e){Alert.alert("Hitilafu",e instanceof Error?e.message:"Imeshindikana kupakia akaunti.");}
    finally{if(active)setLoading(false);}
  })();return()=>{active=false};},[]);
  async function logout(){
    try{const {error}=await getSupabase().auth.signOut();if(error)throw error;router.replace("/");}
    catch(e){Alert.alert("Imeshindikana kutoka",e instanceof Error?e.message:"Jaribu tena.");}
  }
  return <SafeAreaView style={styles.safe}><View style={styles.container}>
    <Link href="/" style={styles.back}>‹  Nyumbani</Link>
    <Text style={styles.brand}>MAARIFA<Text style={{color:gold}}>BOOKS</Text></Text>
    <Text style={styles.heading}>Akaunti yangu</Text>
    {loading?<ActivityIndicator color={gold} style={{marginTop:40}}/>:profile?<View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(profile.full_name||"M")[0].toUpperCase()}</Text></View>
      <Text style={styles.name}>{profile.full_name||"Msomaji wa MaarifaBooks"}</Text>
      <Text style={styles.detail}>{profile.email||"Barua pepe haijawekwa"}</Text>
      <Text style={styles.detail}>{profile.phone||"Namba ya simu haijawekwa"}</Text>
      <Text style={styles.role}>Aina ya akaunti: {profile.role==="seller"?"Muuzaji":profile.role==="admin"?"Msimamizi":"Msomaji"}</Text>
      <Pressable accessibilityRole="button" onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Toka kwenye akaunti</Text></Pressable>
    </View>:<View style={styles.card}>
      <Text style={styles.name}>Hujaingia bado</Text><Text style={styles.detail}>Ingia ili kuona maktaba yako na vitabu ulivyonunua.</Text>
      <Pressable accessibilityRole="button" onPress={()=>router.push("/auth")} style={styles.login}><Text style={styles.loginText}>Ingia / Jisajili</Text></Pressable>
    </View>}
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:"#F7F8FA"},container:{padding:24,paddingTop:18,flex:1},back:{color:navy,fontSize:14,marginBottom:35},brand:{fontSize:20,fontWeight:"900",color:navy,letterSpacing:1},heading:{fontSize:27,fontWeight:"900",color:navy,marginTop:25,marginBottom:20},card:{backgroundColor:"#FFFFFF",padding:22,borderRadius:16,borderWidth:1,borderColor:"#E7EAF0",alignItems:"center"},avatar:{height:68,width:68,borderRadius:34,backgroundColor:navy,alignItems:"center",justifyContent:"center"},avatarText:{color:gold,fontSize:26,fontWeight:"900"},name:{fontSize:18,fontWeight:"800",color:navy,marginTop:15},detail:{fontSize:13,color:"#687586",marginTop:8},role:{fontSize:12,color:"#92752F",fontWeight:"700",marginTop:16},logout:{backgroundColor:"#FCECEC,paddingHorizontal:20,paddingVertical:13,borderRadius:10,marginTop:25},logoutText:{color:"#A12D2D",fontWeight:"800"},login:{backgroundColor:navy,paddingHorizontal:22,paddingVertical:14,borderRadius:10,marginTop:20},loginText:{color:"#FFFFFF",fontWeight:"800"}});
