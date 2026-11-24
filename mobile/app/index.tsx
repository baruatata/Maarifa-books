import { useCallback, useEffect, useState } from "react";
import { Link, router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isSupabaseConfigured, getSupabase } from "@/src/lib/supabase";

type Book = { id: string; title: string; author_name: string | null; format: string; price_tzs: number };
const navy = "#10233F", gold = "#C9A34A";

export default function HomeScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const loadBooks = useCallback(async (term = "", all = false) => {
    if (!isSupabaseConfigured) { setError("Muunganisho wa Supabase haujawekwa. Tafadhali sanidi faili la .env."); setLoading(false); setRefreshing(false); return; }
    try {
      setError("");
      let query = getSupabase().from("books").select("id,title,author_name,format,price_tzs").eq("status", "approved").order("created_at", { ascending: false }).limit(all ? 100 : 12);
      const safeTerm = term.trim().slice(0, 80).replace(/[(),%_*]/g, " ").trim();
      if (safeTerm) query = query.or(`title.ilike.%${safeTerm}%,author_name.ilike.%${safeTerm}%`);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setBooks((data ?? []) as Book[]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Imeshindikana kupakia vitabu."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void loadBooks(); }, [loadBooks]);
  const refresh = () => { setRefreshing(true); void loadBooks(activeQuery, showAll); };
  const searchBooks = () => { const term = searchText.trim(); setActiveQuery(term); setShowAll(true); void loadBooks(term, true); };
  const showEveryBook = () => { setActiveQuery(""); setSearchText(""); setShowAll(true); void loadBooks("", true); };

  const renderBook = ({ item }: { item: Book }) => <Pressable accessibilityRole="button" onPress={() => router.push("/book/" + item.id)} style={styles.bookCard}>
    <View style={styles.bookMark}><Text style={styles.bookMarkText}>MB</Text></View>
    <View style={styles.bookInfo}><Text style={styles.bookTitle}>{item.title}</Text><Text style={styles.author}>{item.author_name || "Mwandishi hajatajwa"}</Text><Text style={styles.format}>{item.format.toUpperCase()}</Text></View>
    <Text style={styles.price}>{item.price_tzs > 0 ? `TSh ${new Intl.NumberFormat("sw-TZ").format(item.price_tzs)}` : "BURE"}</Text>
  </Pressable>;

  return <SafeAreaView style={styles.safeArea}>
    <View style={styles.hero}>
      <View style={styles.topLine}><View><Text style={styles.brand}>MAARIFA<Text style={styles.brandGold}>BOOKS</Text></Text><Text style={styles.tagline}>Maarifa yako, safari yako.</Text></View><Link href="/auth" style={styles.languagePill}><Text style={styles.languageText}>Ingia / Akaunti</Text></Link></View>
      <Text style={styles.welcome}>Karibu kwenye maktaba yako.</Text>
      <Text style={styles.subtitle}>Gundua vitabu, soma na sikiliza maarifa mapya.</Text>
      <View style={styles.searchPlaceholder}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Tafuta kitabu au mwandishi" value={searchText} onChangeText={setSearchText} onSubmitEditing={searchBooks} returnKeyType="search" placeholder="Tafuta kitabu au mwandishi..." placeholderTextColor="#788391" style={styles.searchInput}/><Pressable accessibilityRole="button" onPress={searchBooks}><Text style={styles.searchAction}>Tafuta</Text></Pressable></View>
    </View>
    <View style={styles.content}>
      <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>MAKTABA YA MAARIFA</Text><Text style={styles.sectionTitle}>{activeQuery ? "Matokeo ya utafutaji" : showAll ? "Vitabu vyote" : "Vitabu vipya"}</Text></View><Pressable accessibilityRole="button" onPress={showEveryBook}><Text style={styles.seeAll}>Tazama vyote</Text></Pressable></View>
      {loading ? <ActivityIndicator color={gold} size="large" style={styles.loader} /> : error ? <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>Imeshindikana kuonyesha vitabu</Text><Text style={styles.messageText}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={() => loadBooks(activeQuery, showAll)} style={styles.retryButton}><Text style={styles.retryText}>Jaribu tena</Text></Pressable>
      </View> : <FlatList data={books} keyExtractor={(book) => book.id} renderItem={renderBook} contentContainerStyle={books.length ? styles.bookList : styles.emptyList} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={gold} />} ListEmptyComponent={<View style={styles.messageCard}><Text style={styles.messageTitle}>{activeQuery ? "Hakuna kitabu kilichopatikana" : "Vitabu vinaandaliwa"}</Text><Text style={styles.messageText}>{activeQuery ? "Jaribu jina jingine la kitabu au mwandishi." : "Vitabu vilivyoidhinishwa vitaonekana hapa."}</Text></View>} />}
    </View>
    <View style={styles.bottomNav}><Pressable onPress={() => router.replace("/")}><Text style={styles.activeNav}>⌂{"\\n"}Nyumbani</Text></Pressable><Pressable onPress={() => router.push("/library")}><Text style={styles.navItem}>▤{"\\n"}Maktaba</Text></Pressable><Pressable onPress={() => router.push("/account")}><Text style={styles.navItem}>◎{"\\n"}Akaunti</Text></Pressable></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:"#F7F8FA"},hero:{backgroundColor:navy,paddingHorizontal:22,paddingTop:16,paddingBottom:28,borderBottomLeftRadius:26,borderBottomRightRadius:26},
  topLine:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},brand:{color:"#FFFFFF",fontSize:19,fontWeight:"900",letterSpacing:1.2},brandGold:{color:gold},tagline:{color:"#C7D0DC",fontSize:11,marginTop:3},
  languagePill:{borderColor:"#52647B",borderWidth:1,borderRadius:20,paddingHorizontal:11,paddingVertical:7},languageText:{color:"#FFFFFF",fontSize:11,fontWeight:"700"},
  welcome:{color:"#FFFFFF",fontSize:25,fontWeight:"800",marginTop:30},subtitle:{color:"#D5DCE5",fontSize:13,lineHeight:20,marginTop:7},
  searchPlaceholder:{height:48,backgroundColor:"#FFFFFF",borderRadius:12,marginTop:20,paddingHorizontal:14,flexDirection:"row",alignItems:"center"},searchIcon:{color:navy,fontSize:24,marginRight:9},searchInput:{flex:1,color:navy,fontSize:13,paddingVertical:0},searchAction:{color:"#92752F",fontSize:12,fontWeight:"800",paddingLeft:8},
  content:{flex:1,paddingHorizontal:20,paddingTop:24},sectionHeading:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginBottom:15},
  sectionEyebrow:{color:"#9A7B35",fontSize:9,fontWeight:"800",letterSpacing:1.4},sectionTitle:{color:navy,fontSize:21,fontWeight:"800",marginTop:4},seeAll:{color:"#9A7B35",fontSize:12,fontWeight:"700",paddingBottom:3},
  loader:{marginTop:45},bookList:{paddingBottom:16},emptyList:{flexGrow:1},bookCard:{flexDirection:"row",alignItems:"center",backgroundColor:"#FFFFFF",borderRadius:14,padding:12,marginBottom:10,borderWidth:1,borderColor:"#E9ECF0"},
  bookMark:{width:52,height:68,borderRadius:7,backgroundColor:navy,alignItems:"center",justifyContent:"center",borderLeftWidth:4,borderLeftColor:gold},bookMarkText:{color:gold,fontSize:13,fontWeight:"900"},bookInfo:{flex:1,paddingHorizontal:12},
  bookTitle:{color:navy,fontSize:14,fontWeight:"800"},author:{color:"#77818D",fontSize:11,marginTop:4},format:{color:"#9A7B35",fontSize:9,fontWeight:"800",marginTop:7,letterSpacing:0.8},price:{color:navy,fontSize:11,fontWeight:"800"},
  messageCard:{backgroundColor:"#FFFFFF",borderRadius:14,padding:18,borderWidth:1,borderColor:"#E9ECF0"},messageTitle:{color:navy,fontSize:15,fontWeight:"800"},messageText:{color:"#697583",fontSize:12,lineHeight:19,marginTop:7},
  retryButton:{alignSelf:"flex-start",backgroundColor:navy,borderRadius:9,paddingHorizontal:15,paddingVertical:9,marginTop:13},retryText:{color:"#FFFFFF",fontSize:12,fontWeight:"700"},
  bottomNav:{height:66,borderTopWidth:1,borderTopColor:"#E7EAF0",backgroundColor:"#FFFFFF",flexDirection:"row",alignItems:"center",justifyContent:"space-around"},activeNav:{color:"#9A7B35",fontSize:10,lineHeight:17,textAlign:"center",fontWeight:"800"},navItem:{color:"#87919D",fontSize:10,lineHeight:17,textAlign:"center"}
});