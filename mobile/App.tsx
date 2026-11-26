import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Image, Keyboard, Linking, Modal,
  Pressable, RefreshControl, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View
} from "react-native";
import * as SecureStore from "expo-secure-store";
import AudioBookPlayer from "./AudioBookPlayer";
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
  cover_path: string | null; category: string | null; seller_id?: string; file_path?: string | null;
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
  const [libraryBooks, setLibraryBooks] = useState<BookCard[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<BookCard | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [couponFormOpen, setCouponFormOpen] = useState(false);
  const [couponName, setCouponName] = useState("");
  const [couponPhone, setCouponPhone] = useState("");
  const [couponReference, setCouponReference] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponNotice, setCouponNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<"home" | "search" | "library" | "account">("home");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authUser, setAuthUser] = useState<{ id: string; email: string | null } | null>(null);

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

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const client = getSupabase();
      void client.auth.getSession().then(({ data }) => {
        if (active) setAuthUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email ?? null } : null);
      }).catch(() => undefined);
      const result = client.auth.onAuthStateChange((_event, session) => {
        if (active) setAuthUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null);
      });
      subscription = result.data.subscription;
    } catch {
      // The catalogue shows the configuration error; account setup can be retried after env vars are added.
    }
    return () => { active = false; subscription?.unsubscribe(); };
  }, []);

  const submitAuth = async () => {
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      const client = getSupabase();
      if (authMode === "signup") {
        if (authName.trim().length < 2) throw new Error("Weka jina lako kamili.");
        if (authPassword.length < 8) throw new Error("Nenosiri liwe na angalau herufi 8.");
        const { data, error: signUpError } = await client.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: { data: { full_name: authName.trim(), phone: authPhone.trim(), preferred_language: "sw" } },
        });
        if (signUpError) throw signUpError;
        if (data.session?.user) setAuthUser({ id: data.session.user.id, email: data.session.user.email ?? null });
        else setAuthMessage("Akaunti imeombwa. Angalia barua pepe yako kuthibitisha akaunti kabla ya kuingia.");
      } else {
        const { data, error: signInError } = await client.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (signInError) throw signInError;
        if (data.user) setAuthUser({ id: data.user.id, email: data.user.email ?? null });
        setAuthMessage("Umeingia kwenye akaunti yako.");
      }
    } catch (err) {
      setAuthError(friendlyError(err));
    } finally { setAuthBusy(false); }
  };

  const signOutNative = async () => {
    try {
      setAuthBusy(true);
      const { error: signOutError } = await getSupabase().auth.signOut();
      if (signOutError) throw signOutError;
      setAuthUser(null); setAuthMessage("Umetoka kwenye akaunti.");
    } catch (err) { setAuthError(friendlyError(err)); }
    finally { setAuthBusy(false); }
  };

  const openBook = async (book: BookCard) => {
    setSelectedBook(book); setWhatsapp(null); setDetailBusy(true); setCouponFormOpen(false); setCouponNotice(""); setCouponName(""); setCouponPhone(""); setCouponReference("");
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


  const loadLibrary = useCallback(async () => {
    if (!authUser) {
      setLibraryBooks([]);
      setLibraryError("Ingia kwenye akaunti yako kuona vitabu ulivyonunua.");
      return;
    }
    setLibraryLoading(true);
    setLibraryError("");
    try {
      const client = getSupabase();
      // RLS limits this query to entitlements belonging to the signed-in buyer.
      const { data: grants, error: grantsError } = await client
        .from("book_entitlements").select("book_id").eq("buyer_id", authUser.id);
      if (grantsError) throw grantsError;
      const ids = Array.from(new Set((grants ?? []).map(row => row.book_id).filter(Boolean)));
      if (!ids.length) {
        setLibraryBooks([]);
        return;
      }
      const { data, error: booksError } = await client.from("books")
        .select("id,title,author_name,description,language,format,price_tzs,cover_path,category,seller_id,file_path")
        .in("id", ids).order("title", { ascending: true });
      if (booksError) throw booksError;
      const rows = (data ?? []) as Book[];
      const paths = rows.flatMap(book => book.cover_path ? [book.cover_path] : []);
      const { data: signed, error: coverError } = paths.length
        ? await client.storage.from("book-files").createSignedUrls(paths, 3600)
        : { data: [], error: null };
      if (coverError) throw coverError;
      const coverMap = new Map((signed ?? []).flatMap(item =>
        item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : []
      ));
      setLibraryBooks(rows.map(book => ({ ...book, cover_url: book.cover_path ? coverMap.get(book.cover_path) ?? null : null })));
    } catch (err) {
      setLibraryError(friendlyError(err));
    } finally {
      setLibraryLoading(false);
    }
  }, [authUser]);


  const submitCouponRequest = async () => {
    if (!selectedBook?.seller_id) {
      Alert.alert("Ombi halijatumwa", "Taarifa za muuzaji hazipatikani kwa kitabu hiki.");
      return;
    }
    const phoneDigits = couponPhone.replace(/\\D/g, "");
    const normalizedPhone = phoneDigits.startsWith("0") ? "255" + phoneDigits.slice(1)
      : phoneDigits.startsWith("255") ? phoneDigits : phoneDigits;
    if (!/^255[67][0-9]{8}$/.test(normalizedPhone)) {
      Alert.alert("Namba si sahihi", "Weka namba ya Tanzania, mfano 07XXXXXXXX au 2557XXXXXXXX.");
      return;
    }
    if (couponReference.trim().length < 3 || couponReference.trim().length > 100) {
      Alert.alert("Taarifa hazijakamilika", "Weka kumbukumbu ya muamala yenye herufi au namba 3 hadi 100.");
      return;
    }
    setCouponBusy(true);
    setCouponNotice("");
    try {
      const { error: requestError } = await getSupabase().from("book_coupon_requests").insert({
        book_id: selectedBook.id,
        seller_id: selectedBook.seller_id,
        customer_user_id: authUser?.id ?? null,
        customer_name: couponName.trim() || null,
        customer_phone: normalizedPhone,
        transaction_reference: couponReference.trim(),
      });
      if (requestError) throw requestError;
      setCouponNotice("Ombi lako limetumwa kwa muuzaji. Atathibitisha malipo na kukutumia coupon kupitia mfumo.");
      setCouponFormOpen(false);
      setCouponName(""); setCouponPhone(""); setCouponReference("");
    } catch (err) {
      Alert.alert("Ombi halijatumwa", friendlyError(err));
    } finally {
      setCouponBusy(false);
    }
  };

  const openOwnedBook = async (book: BookCard) => {
    if (!book.file_path) {
      Alert.alert("Kitabu hakipatikani", "Faili la kitabu halijaunganishwa kwenye mfumo kwa sasa.");
      return;
    }
    try {
      const { data, error: signedError } = await getSupabase().storage
        .from("book-files").createSignedUrl(book.file_path, 900);
      if (signedError) throw signedError;
      if (!data?.signedUrl) throw new Error("Kiungo salama cha kitabu hakikupatikana.");
      await Linking.openURL(data.signedUrl);
    } catch (err) {
      Alert.alert("Imeshindikana kufungua kitabu", friendlyError(err));
    }
  };

  useEffect(() => {
    if (screen === "library") void loadLibrary();
  }, [screen, authUser, loadLibrary]);

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
        <Pressable onPress={() => setScreen("library")} style={[styles.tab, screen === "library" && styles.tabActive]}><Text style={[styles.tabText, screen === "library" && styles.tabTextActive]}>Maktaba</Text></Pressable>
        <Pressable onPress={() => setScreen("account")} style={[styles.tab, screen === "account" && styles.tabActive]}><Text style={[styles.tabText, screen === "account" && styles.tabTextActive]}>Akaunti</Text></Pressable>
      </View>
      <View style={styles.content}>
        {screen === "library" ? (
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>VITABU VYAKO</Text>
            <Text style={styles.heading}>Maktaba yangu</Text>
            <Text style={styles.intro}>Vitabu vilivyofunguliwa kwa akaunti yako kupitia mfumo wa MaarifaBooks.</Text>
            {!authUser ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Ingia kuona maktaba yako</Text>
                <Text style={styles.stateText}>Vitabu vyako vitaonekana hapa baada ya kuingia kwenye akaunti iliyotumika kununua.</Text>
                <Pressable style={styles.primaryButton} onPress={() => setScreen("account")}><Text style={styles.primaryButtonText}>Ingia kwenye akaunti</Text></Pressable>
              </View>
            ) : libraryLoading ? (
              <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /><Text style={styles.stateText}>Inapakia maktaba yako...</Text></View>
            ) : libraryError ? (
              <View style={styles.empty}><Text style={styles.emptyTitle}>Imeshindikana kufungua maktaba</Text><Text style={styles.stateText}>{libraryError}</Text><Pressable style={styles.primaryButton} onPress={() => void loadLibrary()}><Text style={styles.primaryButtonText}>Jaribu tena</Text></Pressable></View>
            ) : libraryBooks.length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyTitle}>Maktaba bado haina vitabu</Text><Text style={styles.stateText}>Vitabu ulivyonunua na kufunguliwa kwa akaunti hii vitaonekana hapa.</Text><Pressable style={styles.secondaryButton} onPress={() => setScreen("home")}><Text style={styles.secondaryButtonText}>Tafuta vitabu</Text></Pressable></View>
            ) : (
              <FlatList data={libraryBooks} keyExtractor={item => item.id} contentContainerStyle={styles.bookList}
                refreshControl={<RefreshControl refreshing={libraryLoading} onRefresh={() => void loadLibrary()} tintColor={GOLD} />}
                renderItem={({item}) => (
                  <View style={[styles.bookCard,{flexDirection:"row",gap:12,marginBottom:12}]}>
                    <View style={[styles.coverWrap,{width:82,height:112}]}>
                      {item.cover_url ? <Image source={{uri:item.cover_url}} style={styles.cover} resizeMode="cover"/> : <View style={styles.coverFallback}><Text style={styles.coverFallbackTitle} numberOfLines={4}>{item.title}</Text></View>}
                    </View>
                    <View style={{flex:1,justifyContent:"center"}}>
                      <Text style={styles.bookTitle}>{item.title}</Text>
                      <Text style={styles.bookAuthor}>{item.author_name || "Mwandishi hajatajwa"}</Text>
                      <Text style={styles.format}>{(item.format || "").toUpperCase()}</Text>
                      <Pressable style={[styles.primaryButton,{marginTop:9,alignSelf:"flex-start"}]} onPress={() => void openOwnedBook(item)}><Text style={styles.primaryButtonText}>Fungua kitabu</Text></Pressable>
                    </View>
                  </View>
                )}/>
            )}
          </View>
        ) : screen === "account" ? (
          <ScrollView contentContainerStyle={styles.accountContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.kicker}>AKAUNTI YA MAARIFABOOKS</Text>
            <Text style={styles.heading}>Akaunti yako</Text>
            <Text style={styles.intro}>Ingia au fungua akaunti ili kutumia huduma za MaarifaBooks.</Text>
            {authUser ? (
              <View style={styles.authPanel}>
                <Text style={styles.authTitle}>Umeingia kikamilifu</Text>
                <Text style={styles.authLabel}>Barua pepe</Text>
                <Text style={styles.authValue}>{authUser.email || "Barua pepe haijaonyeshwa"}</Text>
                <Text style={styles.authHint}>Akaunti yako imehifadhiwa kwa usalama kwenye kifaa hiki. Huduma za Jihudumie na dashibodi za wauzaji bado zinapatikana kupitia tovuti.</Text>
                <Pressable style={styles.primaryButton} onPress={() => void Linking.openURL(`${SITE_URL}/dashboard/jihudumie`)}><Text style={styles.primaryButtonText}>Fungua Jihudumie</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => void Linking.openURL(`${SITE_URL}/muuzaji`)}><Text style={styles.secondaryButtonText}>Dashibodi ya muuzaji</Text></Pressable>
                <Pressable style={styles.secondaryButton} disabled={authBusy} onPress={() => void signOutNative()}><Text style={styles.secondaryButtonText}>{authBusy ? "Subiri..." : "Toka kwenye akaunti"}</Text></Pressable>
              </View>
            ) : (
              <View style={styles.authPanel}>
                <View style={styles.authSwitch}>
                  <Pressable onPress={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); }} style={[styles.authSwitchButton, authMode === "login" && styles.authSwitchActive]}><Text style={[styles.authSwitchText, authMode === "login" && styles.authSwitchTextActive]}>Ingia</Text></Pressable>
                  <Pressable onPress={() => { setAuthMode("signup"); setAuthError(""); setAuthMessage(""); }} style={[styles.authSwitchButton, authMode === "signup" && styles.authSwitchActive]}><Text style={[styles.authSwitchText, authMode === "signup" && styles.authSwitchTextActive]}>Jisajili</Text></Pressable>
                </View>
                {authMode === "signup" && <>
                  <Text style={styles.authLabel}>Jina kamili</Text>
                  <TextInput value={authName} onChangeText={setAuthName} style={styles.authInput} placeholder="Jina lako kamili" placeholderTextColor="#98A2B3" autoCapitalize="words" />
                  <Text style={styles.authLabel}>Namba ya simu (hiari)</Text>
                  <TextInput value={authPhone} onChangeText={setAuthPhone} style={styles.authInput} placeholder="07XXXXXXXX" placeholderTextColor="#98A2B3" keyboardType="phone-pad" />
                </>}
                <Text style={styles.authLabel}>Barua pepe</Text>
                <TextInput value={authEmail} onChangeText={setAuthEmail} style={styles.authInput} placeholder="jina@example.com" placeholderTextColor="#98A2B3" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                <Text style={styles.authLabel}>Nenosiri</Text>
                <TextInput value={authPassword} onChangeText={setAuthPassword} style={styles.authInput} placeholder="Angalau herufi 8" placeholderTextColor="#98A2B3" secureTextEntry autoComplete={authMode === "login" ? "current-password" : "new-password"} />
                {!!authError && <Text style={styles.authError}>{authError}</Text>}
                {!!authMessage && <Text style={styles.authNotice}>{authMessage}</Text>}
                <Pressable style={styles.primaryButton} disabled={authBusy} onPress={() => void submitAuth()}><Text style={styles.primaryButtonText}>{authBusy ? "Inashughulikia..." : authMode === "login" ? "Ingia kwenye akaunti" : "Fungua akaunti"}</Text></Pressable>
                <Text style={styles.authHint}>Kwa sasa kuingia kwa barua pepe na nenosiri kunatumia Supabase Auth iliyopo. OTP ya SMS haitatumwa na skrini hii.</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <>
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
          </>)}
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
            {selectedBook.format === "audiobook" && <AudioBookPlayer bookId={selectedBook.id} userId={authUser?.id ?? null} client={getSupabase()} /> }
            {selectedBook.price_tzs > 0 ? <>
              <Text style={styles.detailPrice}>{money(selectedBook.price_tzs)}</Text>
              <Text style={styles.paymentNote}>Lipa moja kwa moja kwa muuzaji kupitia WhatsApp. Baada ya muuzaji kuthibitisha kupokea fedha, omba coupon kupitia mfumo ili kufungua kitabu kizima.</Text>
              {detailBusy ? <ActivityIndicator color={GOLD} /> : whatsapp ? <Pressable style={styles.primaryButton} onPress={() => void Linking.openURL(whatsapp)}><Text style={styles.primaryButtonText}>Wasiliana na muuzaji WhatsApp</Text></Pressable> : <Text style={styles.stateText}>Namba ya WhatsApp ya muuzaji haipatikani kwa sasa.</Text>}
              <Pressable style={styles.secondaryButton} onPress={() => setCouponFormOpen(value => !value)}><Text style={styles.secondaryButtonText}>{couponFormOpen ? "Funga ombi la coupon" : "Nimelipa — omba coupon"}</Text></Pressable>
              {!!couponNotice && <Text style={styles.authNotice}>{couponNotice}</Text>}
              {couponFormOpen && <View style={styles.authPanel}>
                <Text style={styles.authTitle}>Tuma ombi la coupon</Text>
                <Text style={styles.authHint}>Jaza taarifa baada ya kulipa muuzaji moja kwa moja. Muuzaji ndiye atakayethibitisha kupokea fedha.</Text>
                <Text style={styles.authLabel}>Jina lako (hiari)</Text>
                <TextInput value={couponName} onChangeText={setCouponName} style={styles.authInput} placeholder="Jina kamili" placeholderTextColor="#98A2B3" />
                <Text style={styles.authLabel}>Namba ya simu</Text>
                <TextInput value={couponPhone} onChangeText={setCouponPhone} style={styles.authInput} placeholder="07XXXXXXXX" placeholderTextColor="#98A2B3" keyboardType="phone-pad" />
                <Text style={styles.authLabel}>Namba ya kumbukumbu ya muamala</Text>
                <TextInput value={couponReference} onChangeText={setCouponReference} style={styles.authInput} placeholder="Weka transaction reference" placeholderTextColor="#98A2B3" autoCapitalize="characters" />
                <Pressable style={styles.primaryButton} disabled={couponBusy} onPress={() => void submitCouponRequest()}><Text style={styles.primaryButtonText}>{couponBusy ? "Inatuma ombi..." : "Tuma ombi kwa muuzaji"}</Text></Pressable>
              </View>}
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
  content:{flex:1,paddingHorizontal:16,paddingTop:19},accountContent:{paddingBottom:28},authPanel:{backgroundColor:"#FFFFFF",borderRadius:14,padding:16,marginTop:18,borderWidth:1,borderColor:"#E6EAF0"},authTitle:{fontSize:17,color:NAVY,fontWeight:"900"},authSwitch:{flexDirection:"row",backgroundColor:"#F0F3F7",padding:4,borderRadius:10,marginBottom:18},authSwitchButton:{flex:1,alignItems:"center",paddingVertical:10,borderRadius:8},authSwitchActive:{backgroundColor:NAVY},authSwitchText:{fontSize:13,fontWeight:"800",color:MUTED},authSwitchTextActive:{color:"#FFFFFF"},authLabel:{fontSize:12,fontWeight:"800",color:NAVY,marginBottom:7,marginTop:12},authInput:{borderWidth:1,borderColor:"#DCE2EA",borderRadius:9,paddingHorizontal:12,paddingVertical:12,color:NAVY,fontSize:14,backgroundColor:"#FFFFFF"},authError:{color:"#B42318",fontSize:12,lineHeight:18,marginTop:12},authNotice:{color:"#18794E",fontSize:12,lineHeight:18,marginTop:12},authValue:{fontSize:14,color:NAVY,fontWeight:"700",marginTop:4},authHint:{fontSize:12,color:MUTED,lineHeight:19,marginTop:14},kicker:{fontSize:10,color:"#9A741E",fontWeight:"900",letterSpacing:1.5},heading:{fontSize:24,color:NAVY,fontWeight:"900",marginTop:4},intro:{fontSize:13,color:MUTED,marginTop:5,lineHeight:19},
  searchBox:{flexDirection:"row",marginTop:15,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#DCE2EA",borderRadius:11,padding:5,alignItems:"center"},searchInput:{flex:1,paddingHorizontal:10,paddingVertical:9,color:NAVY,fontSize:13},searchButton:{backgroundColor:NAVY,borderRadius:8,paddingHorizontal:15,paddingVertical:11},searchButtonText:{color:"#FFFFFF",fontWeight:"800",fontSize:12},
  chips:{gap:8,paddingVertical:12},chip:{paddingHorizontal:13,paddingVertical:8,borderRadius:20,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E1E6ED"},chipActive:{backgroundColor:NAVY,borderColor:NAVY},chipText:{fontSize:11,color:MUTED,fontWeight:"700"},chipTextActive:{color:"#FFFFFF"},
  sectionHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:6,marginBottom:10},sectionTitle:{fontSize:16,color:NAVY,fontWeight:"900"},count:{fontSize:11,color:MUTED},
  bookList:{paddingBottom:16},bookRow:{gap:12,marginBottom:15},bookCard:{flex:1,backgroundColor:"#FFFFFF",borderRadius:12,padding:9,borderWidth:1,borderColor:"#E9EDF2"},
  coverWrap:{height:170,backgroundColor:"#E8EDF3",borderRadius:8,overflow:"hidden"},cover:{width:"100%",height:"100%"},coverFallback:{flex:1,backgroundColor:NAVY,alignItems:"center",justifyContent:"center",padding:12},coverBrand:{color:GOLD,fontSize:8,fontWeight:"900",letterSpacing:1.4,marginBottom:12},coverFallbackTitle:{color:"#FFFFFF",fontSize:14,fontWeight:"900",textAlign:"center"},coverAuthor:{color:"#D7DFEA",fontSize:10,marginTop:12,textAlign:"center"},
  bookTitle:{color:NAVY,fontWeight:"800",fontSize:13,marginTop:9,minHeight:34},bookAuthor:{color:MUTED,fontSize:11,marginTop:3},bookMeta:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:9},format:{fontSize:9,color:MUTED,fontWeight:"800"},price:{fontSize:11,color:"#98701B",fontWeight:"900"},
  center:{alignItems:"center",justifyContent:"center",paddingVertical:50},stateText:{fontSize:12,color:MUTED,textAlign:"center",lineHeight:18,marginTop:9},empty:{alignItems:"center",paddingHorizontal:18,paddingVertical:35},emptyTitle:{fontSize:16,color:NAVY,fontWeight:"900",textAlign:"center"},primaryButton:{backgroundColor:NAVY,borderRadius:10,paddingHorizontal:18,paddingVertical:13,alignItems:"center",marginTop:16},primaryButtonText:{color:"#FFFFFF",fontWeight:"800",fontSize:13},
  secondaryButton:{borderWidth:1,borderColor:NAVY,borderRadius:10,paddingHorizontal:18,paddingVertical:13,alignItems:"center",marginTop:10},secondaryButtonText:{color:NAVY,fontWeight:"800",fontSize:12},
  modalSafe:{flex:1,backgroundColor:PAPER},modalHeader:{paddingHorizontal:18,paddingVertical:14,backgroundColor:"#FFFFFF",borderBottomWidth:1,borderBottomColor:"#E5EAF0",flexDirection:"row",justifyContent:"space-between",alignItems:"center"},modalHeaderTitle:{fontSize:15,color:NAVY,fontWeight:"900"},close:{fontSize:22,color:MUTED,paddingHorizontal:5},detailContent:{padding:20,paddingBottom:40},detailCoverWrap:{height:220,alignItems:"center",justifyContent:"center",marginBottom:18},detailCover:{width:155,height:220},detailFallback:{width:155,height:220,borderRadius:9},detailTitle:{fontSize:23,color:NAVY,fontWeight:"900",lineHeight:29},detailAuthor:{fontSize:13,color:MUTED,marginTop:5},detailTags:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:13},tag:{fontSize:10,color:NAVY,backgroundColor:"#E7EDF4",paddingHorizontal:9,paddingVertical:6,borderRadius:6,fontWeight:"700"},detailSection:{fontSize:15,color:NAVY,fontWeight:"900",marginTop:20},description:{fontSize:13,color:"#475467",lineHeight:21,marginTop:7},detailPrice:{fontSize:22,color:"#98701B",fontWeight:"900",marginTop:20},paymentNote:{fontSize:13,color:"#475467",lineHeight:20,marginTop:8},freeLabel:{fontSize:14,color:"#18794E",fontWeight:"800",marginTop:20},footer:{backgroundColor:"#FFFFFF",paddingVertical:8,alignItems:"center",borderTopWidth:1,borderTopColor:"#E5EAF0"},footerText:{fontSize:10,color:MUTED}
});
