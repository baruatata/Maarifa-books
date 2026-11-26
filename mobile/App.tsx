import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Image, Keyboard, Linking, Modal,
  Pressable, RefreshControl, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const NAVY = "#071B36";
const NAVY_LIGHT = "#102B4D";
const GOLD = "#D5A642";
const PAPER = "#F5F7FA";
const MUTED = "#667085";
const SITE_URL = "https://maarifabooks.vercel.app";

type Book = {
  id: string; title: string; author_name: string | null; description?: string | null;
  language?: string | null; format: string; price_tzs: number;
  cover_path: string | null; category: string | null; seller_id?: string;
};
type BookCard = Book & { cover_url: string | null };

let supabase: SupabaseClient | null = null;
function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Mipangilio ya Supabase haijawekwa. Weka EXPO_PUBLIC_SUPABASE_URL na EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY kwenye mazingira ya Expo.");
  supabase = createClient(url, key, {
    auth: {
      storage: {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      },
      autoRefreshToken: true, persistSession: true, detectSessionInUrl: false,
    },
  });
  return supabase;
}

function money(value: number) {
  return value > 0 ? "TSh " + new Intl.NumberFormat("sw-TZ").format(value) : "BURE";
}
function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : "Kumetokea hitilafu. Tafadhali jaribu tena.";
}

export default function App() {
  const [books, setBooks] = useState<BookCard[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<BookCard | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<"home" | "search">("home");

  const loadBooks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const client = getSupabase();
      let query = client.from("books")
        .select("id,title,author_name,description,language,format,price_tzs,cover_path,category,seller_id")
        .eq("status", "approved").order("created_at", { ascending: false }).limit(60);
      if (search.trim()) {
        const safe = search.trim().replace(/[%,()]/g, "").slice(0, 80);
        if (safe) query = query.or(`title.ilike.%${safe}%,author_name.ilike.%${safe}%`);
      }
      if (selectedCategory) query = query.eq("category", selectedCategory);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      const rows = (data ?? []) as Book[];
      const paths = rows.flatMap(book => book.cover_path ? [book.cover_path] : []);
      const { data: signed, error: coverError } = paths.length
        ? await client.storage.from("book-files").createSignedUrls(paths, 86400)
        : { data: [], error: null };
      if (coverError) throw coverError;
      const coverMap = new Map((signed ?? []).flatMap(item =>
        item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : []
      ));
      setBooks(rows.map(book => ({ ...book, cover_url: book.cover_path ? coverMap.get(book.cover_path) ?? null : null })));
      setCategories(Array.from(new Set(rows.map(book => book.category).filter((v): v is string => Boolean(v)))));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => { void loadBooks(); }, [loadBooks]);

  const openBook = async (book: BookCard) => {
    setSelectedBook(book); setWhatsapp(null); setDetailBusy(true);
    try {
      if (book.price_tzs > 0 && book.seller_id) {
        const { data, error: rpcError } = await getSupabase().rpc("get_seller_whatsapp", { p_seller_id: book.seller_id });
        if (rpcError) throw rpcError;
        if (data) {
          const message = `Habari, nahitaji kununua kitabu "${book.title}" cha ${money(book.price_tzs)} kupitia MaarifaBooks. Naomba maelekezo ya malipo.`;
          setWhatsapp(`https://wa.me/${data}?text=${encodeURIComponent(message)}`);
        }
      }
    } catch {
      setWhatsapp(null);
    } finally { setDetailBusy(false); }
  };

  const visibleBooks = useMemo(() => books, [books]);
  const renderBook = ({ item }: { item: BookCard }) => (
    <Pressable style={styles.bookCard} onPress={() => void openBook(item)} accessibilityRole="button" accessibilityLabel={`Maelezo ya ${item.title}`}>
      <View style={styles.coverWrap}>
        {item.cover_url
          ? <Image source={{ uri: item.cover_url }} style={styles.cover} resizeMode="cover" />
          : <View style={styles.coverFallback}><Text style={styles.coverBrand}>MAARIFABOOKS</Text><Text style={styles.coverFallbackTitle} numberOfLines={4}>{item.title}</Text><Text style={styles.coverAuthor} numberOfLines={2}>{item.author_name || "Mwandishi"}</Text></View>}
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>{item.author_name || "Mwandishi hajatajwa"}</Text>
      <View style={styles.bookMeta}><Text style={styles.format}>{(item.format || "").toUpperCase()}</Text><Text style={styles.price}>{money(item.price_tzs)}</Text></View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.header}>
        <View><Text style={styles.brand}>Maarifa<Text style={styles.brandGold}>Books</Text></Text><Text style={styles.tagline}>Soma. Sikiliza. Jifunze.</Text></View>
        <Pressable style={styles.sellButton} onPress={() => void Linking.openURL(`${SITE_URL}/wauzaji`)}><Text style={styles.sellText}>Uza vitabu</Text></Pressable>
      </View>
      <View style={styles.tabs}>
        <Pressable onPress={() => { setScreen("home"); setSearch(""); setSearchInput(""); setSelectedCategory(null); }} style={[styles.tab, screen === "home" && styles.tabActive]}><Text style={[styles.tabText, screen === "home" && styles.tabTextActive]}>Mwanzo</Text></Pressable>
        <Pressable onPress={() => setScreen("search")} style={[styles.tab, screen === "search" && styles.tabActive]}><Text style={[styles.tabText, screen === "search" && styles.tabTextActive]}>Tafuta vitabu</Text></Pressable>
        <Pressable onPress={() => void Linking.openURL(`${SITE_URL}/ingia`)} style={styles.tab}><Text style={styles.tabText}>Akaunti</Text></Pressable>
      </View>
      <View style={styles.content}>
        <Text style={styles.kicker}>MAKTABA YETU</Text>
        <Text style={styles.heading}>{screen === "search" ? "Tafuta kitabu" : "Vitabu vya kidijitali"}</Text>
        <Text style={styles.intro}>Gundua vitabu vilivyoidhinishwa na vinavyopatikana MaarifaBooks.</Text>
        <View style={styles.searchBox}>
          <TextInput
            value={searchInput} onChangeText={setSearchInput}
            onSubmitEditing={() => { setSearch(searchInput); Keyboard.dismiss(); }}
            placeholder="Tafuta jina la kitabu au mwandishi..." placeholderTextColor="#98A2B3"
            returnKeyType="search" style={styles.searchInput}
            accessibilityLabel="Tafuta jina la kitabu au mwandishi"
          />
          <Pressable style={styles.searchButton} onPress={() => { setSearch(searchInput); Keyboard.dismiss(); }}><Text style={styles.searchButtonText}>Tafuta</Text></Pressable>
        </View>
        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Pressable onPress={() => setSelectedCategory(null)} style={[styles.chip, !selectedCategory && styles.chipActive]}><Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Vyote</Text></Pressable>
            {categories.map(category => <Pressable key={category} onPress={() => setSelectedCategory(category)} style={[styles.chip, selectedCategory === category && styles.chipActive]}><Text style={[styles.chipText, selectedCategory === category && styles.chipTextActive]}>{category}</Text></Pressable>)}
          </ScrollView>
        )}
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{search ? "Matokeo ya utafutaji" : selectedCategory || "Vitabu vipya"}</Text><Text style={styles.count}>{books.length} vitabu</Text></View>
        {loading ? <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /><Text style={styles.stateText}>Inapakia vitabu...</Text></View>
          : error ? <View style={styles.empty}><Text style={styles.emptyTitle}>Imeshindikana kupakia vitabu</Text><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => void loadBooks()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Jaribu tena</Text></Pressable></View>
          : visibleBooks.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Hakuna kitabu kilichopatikana</Text><Text style={styles.stateText}>Vitabu vitaonekana hapa baada ya kuwasilishwa na kuidhinishwa na msimamizi.</Text></View>
          : <FlatList data={visibleBooks} keyExtractor={item => item.id} renderItem={renderBook} numColumns={2} columnWrapperStyle={styles.bookRow} contentContainerStyle={styles.bookList} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadBooks(true)} tintColor={GOLD} />} />}
      </View>
      <Modal visible={Boolean(selectedBook)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedBook(null)}>
        {selectedBook && <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}><Text style={styles.modalHeaderTitle}>Maelezo ya kitabu</Text><Pressable onPress={() => setSelectedBook(null)}><Text style={styles.close}>✕</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.detailContent}>
            <View style={styles.detailCoverWrap}>{selectedBook.cover_url ? <Image source={{ uri: selectedBook.cover_url }} style={styles.detailCover} resizeMode="contain" /> : <View style={[styles.coverFallback, styles.detailFallback]}><Text style={styles.coverFallbackTitle}>{selectedBook.title}</Text></View>}</View>
            <Text style={styles.detailTitle}>{selectedBook.title}</Text>
            <Text style={styles.detailAuthor}>Na {selectedBook.author_name || "Mwandishi hajatajwa"}</Text>
            <View style={styles.detailTags}><Text style={styles.tag}>{(selectedBook.format || "").toUpperCase()}</Text>{selectedBook.language && <Text style={styles.tag}>{selectedBook.language === "sw" ? "Kiswahili" : selectedBook.language === "en" ? "Kiingereza" : selectedBook.language}</Text>}{selectedBook.category && <Text style={styles.tag}>{selectedBook.category}</Text>}</View>
            <Text style={styles.detailSection}>Maelezo ya kitabu</Text>
            <Text style={styles.description}>{selectedBook.description || "Maelezo ya kitabu hiki hayajawekwa bado."}</Text>
            {selectedBook.price_tzs > 0 ? <>
              <Text style={styles.detailPrice}>{money(selectedBook.price_tzs)}</Text>
              <Text style={styles.paymentNote}>Lipa moja kwa moja kwa muuzaji kupitia WhatsApp. Baada ya muuzaji kuthibitisha kupokea fedha, omba coupon kupitia mfumo ili kufungua kitabu kizima.</Text>
              {detailBusy ? <ActivityIndicator color={GOLD} /> : whatsapp ? <Pressable style={styles.primaryButton} onPress={() => void Linking.openURL(whatsapp)}><Text style={styles.primaryButtonText}>Wasiliana na muuzaji WhatsApp</Text></Pressable> : <Text style={styles.stateText}>Namba ya WhatsApp ya muuzaji haipatikani kwa sasa.</Text>}
              <Pressable style={styles.secondaryButton} onPress={() => void Linking.openURL(`${SITE_URL}/kitabu/${selectedBook.id}`)}><Text style={styles.secondaryButtonText}>Sampuli na ombi la coupon</Text></Pressable>
            </> : <><Text style={styles.freeLabel}>Kitabu hiki kinapatikana bure.</Text><Pressable style={styles.primaryButton} onPress={() => void Linking.openURL(`${SITE_URL}/soma/${selectedBook.id}`)}><Text style={styles.primaryButtonText}>Soma / Sikiliza kitabu</Text></Pressable></>}
          </ScrollView>
        </SafeAreaView>}
      </Modal>
      <View style={styles.footer}><Text style={styles.footerText}>MaarifaBooks · Sehemu ya Lumbwa Digital</Text></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:PAPER},header:{backgroundColor:NAVY,paddingHorizontal:18,paddingTop:12,paddingBottom:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  brand:{fontSize:24,fontWeight:"900",color:"#FFFFFF",letterSpacing:-0.7},brandGold:{color:GOLD},tagline:{color:"#D7DFEA",fontSize:11,marginTop:2,letterSpacing:0.4},
  sellButton:{borderWidth:1,borderColor:GOLD,borderRadius:9,paddingHorizontal:13,paddingVertical:9},sellText:{color:GOLD,fontWeight:"800",fontSize:12},
  tabs:{flexDirection:"row",backgroundColor:"#FFFFFF",paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:"#E5EAF0"},
  tab:{flex:1,alignItems:"center",paddingVertical:13,borderBottomWidth:2,borderBottomColor:"transparent"},tabActive:{borderBottomColor:GOLD},tabText:{fontSize:13,color:MUTED,fontWeight:"700"},tabTextActive:{color:NAVY},
  content:{flex:1,paddingHorizontal:16,paddingTop:19},kicker:{fontSize:10,color:"#9A741E",fontWeight:"900",letterSpacing:1.5},heading:{fontSize:24,color:NAVY,fontWeight:"900",marginTop:4},intro:{fontSize:13,color:MUTED,marginTop:5,lineHeight:19},
  searchBox:{flexDirection:"row",marginTop:15,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#DCE2EA",borderRadius:11,padding:5,alignItems:"center"},searchInput:{flex:1,paddingHorizontal:10,paddingVertical:9,color:NAVY,fontSize:13},searchButton:{backgroundColor:NAVY,borderRadius:8,paddingHorizontal:15,paddingVertical:11},searchButtonText:{color:"#FFFFFF",fontWeight:"800",fontSize:12},
  chips:{gap:8,paddingVertical:12},chip:{paddingHorizontal:13,paddingVertical:8,borderRadius:20,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E1E6ED"},chipActive:{backgroundColor:NAVY,borderColor:NAVY},chipText:{fontSize:11,color:MUTED,fontWeight:"700"},chipTextActive:{color:"#FFFFFF"},
  sectionHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:6,marginBottom:10},sectionTitle:{fontSize:16,color:NAVY,fontWeight:"900"},count:{fontSize:11,color:MUTED},
  bookList:{paddingBottom:16},bookRow:{gap:12,marginBottom:15},bookCard:{flex:1,backgroundColor:"#FFFFFF",borderRadius:12,padding:9,borderWidth:1,borderColor:"#E9EDF2"},
  coverWrap:{height:170,backgroundColor:"#E8EDF3",borderRadius:8,overflow:"hidden"},cover:{width:"100%",height:"100%"},coverFallback:{flex:1,backgroundColor:NAVY,alignItems:"center",justifyContent:"center",padding:12},coverBrand:{color:GOLD,fontSize:8,fontWeight:"900",letterSpacing:1.4,marginBottom:12},coverFallbackTitle:{color:"#FFFFFF",fontSize:14,fontWeight:"900",textAlign:"center"},coverAuthor:{color:"#D7DFEA",fontSize:10,marginTop:12,textAlign:"center"},
  bookTitle:{color:NAVY,fontWeight:"800",fontSize:13,marginTop:9,minHeight:34},bookAuthor:{color:MUTED,fontSize:11,marginTop:3},bookMeta:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:9},format:{fontSize:9,color:MUTED,fontWeight:"800"},price:{fontSize:11,color:"#98701B",fontWeight:"900"},
  center:{alignItems:"center",justifyContent:"center",paddingVertical:50},stateText:{fontSize:12,color:MUTED,textAlign:"center",lineHeight:18,marginTop:9},empty:{alignItems:"center",paddingHorizontal:18,paddingVertical:35},emptyTitle:{fontSize:16,color:NAVY,fontWeight:"900",textAlign:"center"},primaryButton:{backgroundColor:NAVY,borderRadius:10,paddingHorizontal:18,paddingVertical:13,alignItems:"center,marginTop:16},primaryButtonText:{color:"#FFFFFF",fontWeight:"800",fontSize:13},
  secondaryButton:{borderWidth:1,borderColor:NAVY,borderRadius:10,paddingHorizontal:18,paddingVertical:13,alignItems:"center",marginTop:10},secondaryButtonText:{color:NAVY,fontWeight:"800",fontSize:12},
  modalSafe:{flex:1,backgroundColor:PAPER},modalHeader:{paddingHorizontal:18,paddingVertical:14,backgroundColor:"#FFFFFF",borderBottomWidth:1,borderBottomColor:"#E5EAF0",flexDirection:"row",justifyContent:"space-between",alignItems:"center"},modalHeaderTitle:{fontSize:15,color:NAVY,fontWeight:"900"},close:{fontSize:22,color:MUTED,paddingHorizontal:5},detailContent:{padding:20,paddingBottom:40},detailCoverWrap:{height:220,alignItems:"center",justifyContent:"center",marginBottom:18},detailCover:{width:155,height:220},detailFallback:{width:155,height:220,borderRadius:9},detailTitle:{fontSize:23,color:NAVY,fontWeight:"900",lineHeight:29},detailAuthor:{fontSize:13,color:MUTED,marginTop:5},detailTags:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:13},tag:{fontSize:10,color:NAVY,backgroundColor:"#E7EDF4",paddingHorizontal:9,paddingVertical:6,borderRadius:6,fontWeight:"700"},detailSection:{fontSize:15,color:NAVY,fontWeight:"900",marginTop:20},description:{fontSize:13,color:"#475467",lineHeight:21,marginTop:7},detailPrice:{fontSize:22,color:"#98701B",fontWeight:"900",marginTop:20},paymentNote:{fontSize:13,color:"#475467",lineHeight:20,marginTop:8},freeLabel:{fontSize:14,color:"#18794E",fontWeight:"800",marginTop:20},footer:{backgroundColor:"#FFFFFF",paddingVertical:8,alignItems:"center",borderTopWidth:1,borderTopColor:"#E5EAF0"},footerText:{fontSize:10,color:MUTED}
});
