import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabase, isSupabaseConfigured } from "@/src/lib/supabase";

const navy = "#10233F";
const gold = "#C9A34A";

function toE164(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "+255" + digits.slice(1);
  if (digits.startsWith("255") && digits.length === 12) return "+" + digits;
  if ((digits.startsWith("6") || digits.startsWith("7")) && digits.length === 9) return "+255" + digits;
  throw new Error("Weka namba sahihi ya Tanzania, mfano 0652245742.");
}

export default function AuthScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const returnPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const [mode, setMode] = useState<"login" | "signup" | "phone">("login");
  const [step, setStep] = useState<"details" | "verify">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submitEmail() {
    if (!isSupabaseConfigured) throw new Error("Supabase haijaunganishwa. Sanidi mobile/.env kwanza.");
    const supabase = getSupabase();
    if (mode === "signup") {
      if (name.trim().length < 2) throw new Error("Weka jina lako kamili.");
      if (password.length < 8) throw new Error("Nenosiri liwe na herufi 8 au zaidi.");
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim(), preferred_language: "sw" } } });
      if (error) throw error;
      if (!data.session) { setNotice("Akaunti imeundwa. Angalia barua pepe yako kuthibitisha akaunti kabla ya kuingia."); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    }
    router.replace(returnPath);
  }

  async function requestOtp() {
    if (!isSupabaseConfigured) throw new Error("Supabase haijaunganishwa. Sanidi mobile/.env kwanza.");
    const normalized = toE164(phone);
    if (mode === "signup" && name.trim().length < 2) throw new Error("Weka jina lako kamili.");
    const { error } = await getSupabase().auth.signInWithOtp({
      phone: normalized,
      options: { shouldCreateUser: mode === "signup", ...(mode === "signup" ? { data: { full_name: name.trim(), preferred_language: "sw" } } : {}) }
    });
    if (error) throw error;
    setStep("verify");
    setNotice("OTP imetumwa kwa SMS. Ikiwa SMS haijafika, hakikisha namba ni sahihi kisha jaribu tena.");
  }

  async function verifyOtp() {
    if (!/^\d{6}$/.test(otp.trim())) throw new Error("Ingiza OTP yenye tarakimu 6.");
    const normalized = toE164(phone);
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.verifyOtp({ phone: normalized, token: otp.trim(), type: "sms" });
    if (error) throw error;
    if (!data.user) throw new Error("Imeshindikana kuthibitisha akaunti.");
    const { error: profileError } = await supabase.from("profiles").update({ phone: normalized, phone_verified_at: new Date().toISOString() }).eq("id", data.user.id);
    if (profileError) throw profileError;
    router.replace(returnPath);
  }

  async function handleSubmit() {
    setBusy(true); setNotice("");
    try {
      if (mode === "phone") {
        if (step === "details") await requestOtp();
        else await verifyOtp();
      } else await submitEmail();
    } catch (error) {
      Alert.alert("Imeshindikana", error instanceof Error ? error.message : "Tafadhali jaribu tena.");
    } finally { setBusy(false); }
  }

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Link href="/" style={styles.back}>‹  Rudi mwanzo</Link>
        <Text style={styles.brand}>MAARIFA<Text style={{ color: gold }}>BOOKS</Text></Text>
        <Text style={styles.heading}>{mode === "signup" ? "Fungua akaunti" : "Karibu tena"}</Text>
        <Text style={styles.sub}>Ingia ili uendelee kusoma na kusikiliza vitabu vyako.</Text>
        <View style={styles.tabs}>
          {(["login", "signup", "phone"] as const).map((item) => <Pressable key={item} onPress={() => { setMode(item); setStep("details"); setNotice(""); }} style={[styles.tab, mode === item && styles.activeTab]}><Text style={[styles.tabText, mode === item && styles.activeTabText]}>{item === "login" ? "Ingia" : item === "signup" ? "Jisajili" : "Kwa simu"}</Text></Pressable>)}
        </View>
        {mode === "signup" && <><Text style={styles.label}>Jina kamili</Text><TextInput accessibilityLabel="Jina kamili" value={name} onChangeText={setName} placeholder="Andika jina lako" style={styles.input} autoCapitalize="words" /></>}
        {mode === "phone" ? <>
          {step === "details" ? <><Text style={styles.label}>Namba ya simu</Text><TextInput accessibilityLabel="Namba ya simu" value={phone} onChangeText={setPhone} placeholder="0652245742" keyboardType="phone-pad" style={styles.input} /></> : <><Text style={styles.label}>OTP ya tarakimu 6</Text><TextInput accessibilityLabel="OTP" value={otp} onChangeText={v=>setOtp(v.replace(/\D/g,"").slice(0,6))} placeholder="123456" keyboardType="number-pad" maxLength={6} style={styles.input} /><Pressable onPress={()=>{setStep("details");setOtp("");setNotice("");}}><Text style={styles.link}>Badili namba ya simu</Text></Pressable></>}
        </> : <>
          <Text style={styles.label}>Barua pepe</Text><TextInput accessibilityLabel="Barua pepe" value={email} onChangeText={setEmail} placeholder="jina@example.com" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
          <Text style={styles.label}>Nenosiri</Text><TextInput accessibilityLabel="Nenosiri" value={password} onChangeText={setPassword} placeholder="Angalau herufi 8" secureTextEntry style={styles.input} />
        </>}
        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        <Pressable accessibilityRole="button" disabled={busy} onPress={handleSubmit} style={[styles.submit,busy && {opacity:.6}]}><Text style={styles.submitText}>{busy ? "Subiri..." : mode === "phone" ? step === "details" ? "Tuma OTP" : "Thibitisha OTP" : mode === "signup" ? "Fungua akaunti" : "Ingia"}</Text></Pressable>
        <Text style={styles.foot}>Akaunti zako za MaarifaBooks zinaendelea kutumika. Hakuna akaunti mpya tofauti inayohitajika.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#F7F8FA"},container:{padding:24,paddingTop:16,flexGrow:1},back:{color:navy,fontSize:14,marginBottom:35},brand:{fontSize:20,fontWeight:"900",color:navy,letterSpacing:1},heading:{fontSize:28,fontWeight:"900",color:navy,marginTop:28},sub:{fontSize:14,color:"#687586",lineHeight:21,marginTop:8,marginBottom:24},tabs:{flexDirection:"row",backgroundColor:"#E9EDF2",padding:4,borderRadius:12,marginBottom:24},tab:{flex:1,paddingVertical:12,borderRadius:9,alignItems:"center"},activeTab:{backgroundColor:"#FFFFFF"},tabText:{fontSize:12,color:"#677383",fontWeight:"700"},activeTabText:{color:navy},label:{fontSize:13,fontWeight:"700",color:navy,marginBottom:8,marginTop:12},input:{height:50,backgroundColor:"#FFFFFF",borderColor:"#DDE3EA",borderWidth:1,borderRadius:10,paddingHorizontal:14,fontSize:15,color:navy},submit:{height:52,backgroundColor:navy,borderRadius:11,alignItems:"center",justifyContent:"center",marginTop:24},submitText:{color:"#FFFFFF",fontSize:15,fontWeight:"800"},notice:{color:"#365B43",fontSize:12,lineHeight:18,marginTop:14},foot:{fontSize:11,color:"#788391",lineHeight:18,textAlign:"center",marginTop:24},link:{color:"#92752F",fontSize:12,fontWeight:"700",marginTop:12}
});
