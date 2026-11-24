import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabase, isSupabaseConfigured } from "@/src/lib/supabase";

const navy = "#10233F", gold = "#C9A34A";
type Book = { id:string; seller_id:string; title:string; author_name:string|null; description:string|null; language:string; category:string|null; format:string; price_tzs:number; cover_path:string|null; preview_path:string|null; file_path:string|null };

function normalizePhone(value:string) {
  const digits=value.replace(/\\D/g,"");
  if(digits.startsWith("0")&&digits.length===10)return "255"+digits.slice(1);
  if(digits.startsWith("255")&&digits.length===12)return digits;
  if((digits.startsWith("6")||digits.startsWith("7"))&&digits.length===9)return "255"+digits;
  throw new Error("Weka namba sahihi ya Tanzania, mfano 0652245742.");
}

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{id:string}>();
  const [book,setBook]=useState<Book|null>(null);
  const [coverUrl,setCoverUrl]=useState<string|null>(null);
  const [sellerPhone,setSellerPhone]=useState("");
  const [userId,setUserId]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [customerName,setCustomerName]=useState("");
  const [customerPhone,setCustomerPhone]=useState("");
  const [reference,setReference]=useState("");
  const [requested,setRequested]=useState(false);
  const [coupon,setCoupon]=useState("");
  const [unlocked,setUnlocked]=useState(false);

  useEffect(()=>{let active=true;(async()=>{
    try {
      if(!isSupabaseConfigured) throw new Error("Supabase haijaunganishwa. Sanidi mobile/.env kwanza.");
      const supabase=getSupabase();
      const [{data:{user}},{data,error}]=await Promise.all([
        supabase.auth.getUser(),
        supabase.from("books").select("id,seller_id,title,author_name,description,language,category,format,price_tzs,cover_path,preview_path,file_path").eq("id",id).eq("status","approved").maybeSingle()
      ]);
      if(error) throw error;
      if(!data) throw new Error("Kitabu hiki hakipatikani au bado hakijaidhinishwa.");
      if(!active)return;
      setBook(data as Book);setUserId(user?.id??null);
      if(data.cover_path){const {data:cover}=await supabase.storage.from("book-files").createSignedUrl(data.cover_path,3600);if(active)setCoverUrl(cover?.signedUrl??null);}
      if(data.price_tzs>0){const {data:phone}=await supabase.rpc("get_seller_whatsapp",{p_seller_id:data.seller_id});if(active&&phone)setSellerPhone(String(phone));}
      if(user?.id){const {data:entitlement}=await supabase.from("book_entitlements").select("id").eq("buyer_id",user.id).eq("book_id",data.id).maybeSingle();if(active&&entitlement)setUnlocked(true);}
    } catch(e){if(active)Alert.alert("Imeshindikana kupakia kitabu",e instanceof Error?e.message:"Tafadhali jaribu tena.");}
    finally{if(active)setLoading(false);}
  })();return()=>{active=false};},[id]);

  async function requestCoupon(){
    setBusy(true);
    try{
      if(!book)throw new Error("Kitabu hakijapakiwa.");
      const phone=normalizePhone(customerPhone);
      if(reference.trim().length<3||reference.trim().length>100)throw new Error("Weka kumbukumbu sahihi ya muamala.");
      const {error}=await getSupabase().from("book_coupon_requests").insert({
        book_id:book.id,seller_id:book.seller_id,customer_user_id:userId,
        customer_name:customerName.trim().slice(0,100)||null,customer_phone:phone,
        transaction_reference:reference.trim(),status:"pending",payment_status:"unverified"
      });
      if(error)throw error;
      setRequested(true);
      Alert.alert("Ombi limetumwa","Muuzaji atathibitisha malipo na kukutumia coupon. Sehemu ya kuweka coupon sasa imefunguliwa.");
    }catch(e){Alert.alert("Ombi halikufanikiwa",e instanceof Error?e.message:"Tafadhali jaribu tena.");}
    finally{setBusy(false);}
  }

  async function redeemCoupon(){
    setBusy(true);
    try{
      if(!userId)throw new Error("Ingia kwenye akaunti ya kawaida kabla ya kutumia coupon.");
      const {data,error}=await getSupabase().rpc("redeem_book_access_code",{p_code:coupon.trim()});
      if(error)throw error;
      if(data!==book?.id)throw new Error("Coupon hii si ya kitabu hiki.");
      setUnlocked(true);
      Alert.alert("Kitabu kimefunguliwa","Coupon imekubaliwa. Sasa unaweza kufungua faili la kitabu.");
    }catch(e){Alert.alert("Coupon haijakubaliwa",e instanceof Error?e.message:"Hakikisha msimbo ni sahihi.");}
    finally{setBusy(false);}
  }

  async function openBook(){
    if(!book)return;
    if(book.format==="pdf"){
      router.push("/read/"+book.id);
      return;
    }
    if(book.format==="audiobook"){
      router.push("/listen/"+book.id);
      return;
    }
    try{
      const path=unlocked||book.price_tzs===0||userId===book.seller_id?book.file_path:book.preview_path;
      if(!path)throw new Error("Faili la kitabu halijawekwa.");
      const {data,error}=await getSupabase().storage.from("book-files").createSignedUrl(path,900);
      if(error||!data?.signedUrl)throw error??new Error("Kiungo cha kitabu hakikupatikana.");
      await Linking.openURL(data.signedUrl);
    }catch(e){Alert.alert("Kitabu hakikufunguka",e instanceof Error?e.message:"Jaribu tena.");}
  }

  if(loading)return <SafeAreaView style={styles.safe}><ActivityIndicator color={gold} size="large" style={{marginTop:80}}/></SafeAreaView>;
  if(!book)return <SafeAreaView style={styles.safe}><Text style={styles.error}>Kitabu hakipatikani.</Text><Link href="/" style={styles.back}>Rudi mwanzo</Link></SafeAreaView>;

  const isOwner=userId===book.seller_id;
  const canRead=unlocked||book.price_tzs===0||isOwner;
  const format=book.format==="pdf"?"PDF":book.format==="epub"?"EPUB":"Audiobook";
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}>
    <Link href="/" style={styles.back}>‹  Rudi kwenye vitabu</Link>
    <View style={styles.bookHeader}>
      {coverUrl?<Image source={{uri:coverUrl}} style={styles.cover} resizeMode="cover"/>:<View style={styles.coverFallback}><Text style={styles.coverInitials}>MB</Text></View>}
      <View style={styles.headInfo}><Text style={styles.eyebrow}>TAARIFA ZA KITABU</Text><Text style={styles.title}>{book.title}</Text><Text style={styles.author}>Na {book.author_name||"Mwandishi hajatajwa"}</Text><Text style={styles.tag}>{format}  •  {book.language==="sw"?"Kiswahili":book.language==="en"?"Kiingereza":"Lugha nyingine"}</Text><Text style={styles.price}>{book.price_tzs>0?"TSh "+new Intl.NumberFormat("sw-TZ").format(book.price_tzs):"BURE"}</Text></View>
    </View>
    <View style={styles.card}><Text style={styles.sectionTitle}>Maelezo ya kitabu</Text><Text style={styles.description}>{book.description||"Maelezo ya kitabu hiki hayajawekwa bado."}</Text>{!!book.category&&<Text style={styles.category}>Aina: {book.category}</Text>}</View>
    {book.format==="audiobook"&&<View style={styles.card}><Text style={styles.sectionTitle}>Sikiliza kitabu</Text><Text style={styles.description}>Sikiliza sura za kitabu, sitisha na endelea, badilisha kasi na hifadhi sehemu uliyofikia.</Text><Pressable onPress={()=>router.push("/listen/"+book.id)} style={styles.primary}><Text style={styles.primaryText}>Fungua kicheza sauti</Text></Pressable></View>}
    {canRead?<View style={styles.card}><Text style={styles.sectionTitle}>Kitabu kiko tayari</Text><Text style={styles.description}>Una ruhusa ya kufungua kitabu hiki.</Text><Pressable onPress={openBook} style={styles.primary}><Text style={styles.primaryText}>Fungua kitabu</Text></Pressable></View>:<View style={styles.card}>
      <Text style={styles.sectionTitle}>Nunua kitabu</Text><Text style={styles.description}>Lipa moja kwa moja kwa muuzaji kupitia WhatsApp. Baada ya malipo, tuma ombi la coupon hapa chini. Muuzaji akithibitisha kupokea fedha atakutumia coupon ya kufungua kitabu kizima.</Text>
      {sellerPhone?<Pressable onPress={()=>Linking.openURL("https://wa.me/"+sellerPhone+"?text="+encodeURIComponent("Habari, nahitaji kununua kitabu "+book.title+" kupitia MaarifaBooks. Naomba maelekezo ya malipo.") )} style={styles.secondary}><Text style={styles.secondaryText}>Wasiliana na muuzaji WhatsApp</Text></Pressable>:<Text style={styles.error}>Namba ya WhatsApp ya muuzaji haipatikani.</Text>}
      <Pressable onPress={openBook} style={styles.outline}><Text style={styles.outlineText}>Soma sampuli ya bure</Text></Pressable>
      <View style={styles.separator}/>
      <Text style={styles.sectionTitle}>Omba coupon baada ya kulipa</Text>
      <Text style={styles.hint}>Kila ombi linafuatiliwa kivyake. Hakikisha kumbukumbu ya muamala ni sahihi.</Text>
      <Text style={styles.label}>Jina lako (si lazima)</Text><TextInput value={customerName} onChangeText={setCustomerName} style={styles.input} placeholder="Jina kamili"/>
      <Text style={styles.label}>Namba ya simu</Text><TextInput value={customerPhone} onChangeText={setCustomerPhone} style={styles.input} placeholder="0652245742" keyboardType="phone-pad"/>
      <Text style={styles.label}>Kumbukumbu ya malipo</Text><TextInput value={reference} onChangeText={setReference} style={styles.input} placeholder="Namba ya muamala" autoCapitalize="characters"/>
      <Pressable disabled={busy} onPress={requestCoupon} style={[styles.primary,busy&&styles.disabled]}><Text style={styles.primaryText}>{busy?"Inatuma...":"Tuma ombi la coupon"}</Text></Pressable>
      {requested&&<View style={styles.couponArea}><Text style={styles.successTitle}>Ombi limetumwa kwa muuzaji</Text><Text style={styles.hint}>Weka coupon hapa baada ya muuzaji kukutumia msimbo.</Text><Text style={styles.label}>Coupon ya kitabu</Text><TextInput value={coupon} onChangeText={setCoupon} style={styles.input} placeholder="XXXXXX-XXXXXX-XXXXXX" autoCapitalize="characters"/><Pressable disabled={busy} onPress={redeemCoupon} style={[styles.primary,busy&&styles.disabled]}><Text style={styles.primaryText}>{busy?"Inathibitisha...":"Thibitisha coupon na fungua"}</Text></Pressable></View>}
    </View>}
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F7F8FA"},container:{padding:20,paddingBottom:40},back:{color:navy,fontSize:14,fontWeight:"700",marginBottom:20},
 bookHeader:{flexDirection:"row",gap:16,alignItems:"center",marginBottom:18},cover:{width:112,height:154,borderRadius:10,backgroundColor:"#E8EBEF"},coverFallback:{width:112,height:154,borderRadius:10,backgroundColor:navy,alignItems:"center",justifyContent:"center",borderLeftWidth:5,borderLeftColor:gold},coverInitials:{color:gold,fontSize:24,fontWeight:"900"},
 headInfo:{flex:1},eyebrow:{fontSize:9,fontWeight:"900",letterSpacing:1.2,color:"#9A7B35"},title:{fontSize:20,fontWeight:"900",color:navy,marginTop:7},author:{fontSize:12,color:"#687586",marginTop:6},tag:{fontSize:10,color:"#9A7B35",fontWeight:"700",marginTop:9},price:{fontSize:17,fontWeight:"900",color:navy,marginTop:12},
 card:{backgroundColor:"#FFFFFF",borderRadius:16,padding:18,marginBottom:14,borderWidth:1,borderColor:"#E7EAF0"},sectionTitle:{fontSize:16,fontWeight:"900",color:navy,marginBottom:9},description:{fontSize:13,lineHeight:21,color:"#536174"},category:{fontSize:11,color:"#92752F",marginTop:12},hint:{fontSize:11,lineHeight:17,color:"#748091",marginBottom:10},label:{fontSize:12,fontWeight:"700",color:navy,marginTop:12,marginBottom:6},input:{height:48,borderWidth:1,borderColor:"#DCE1E8",borderRadius:10,paddingHorizontal:12,color:navy,backgroundColor:"#FFFFFF"},
 primary:{height:48,backgroundColor:navy,borderRadius:10,alignItems:"center",justifyContent:"center",marginTop:12},primaryText:{color:"#FFFFFF",fontSize:13,fontWeight:"800"},secondary:{height:46,backgroundColor:"#16744A",borderRadius:10,alignItems:"center",justifyContent:"center",marginTop:14},secondaryText:{color:"#FFFFFF",fontWeight:"800",fontSize:12},outline:{height:46,borderWidth:1,borderColor:gold,borderRadius:10,alignItems:"center",justifyContent:"center",marginTop:10},outlineText:{color:"#92752F",fontWeight:"800",fontSize:12},separator:{height:1,backgroundColor:"#E8EBEF",marginVertical:20},couponArea:{marginTop:20,paddingTop:15,borderTopWidth:1,borderTopColor:"#E8EBEF"},successTitle:{color:"#16744A",fontSize:13,fontWeight:"900"},disabled:{opacity:.55},error:{color:"#A12D2D",fontSize:13,marginVertical:10}
});
