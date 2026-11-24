import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Reader } from "@epubjs-react-native/core";
import { useEpubFileSystem } from "@/src/lib/epubFileSystem";
import { getSupabase, isSupabaseConfigured } from "@/src/lib/supabase";

const navy = "#10233F";
const gold = "#C9A34A";

export default function EpubReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const [title, setTitle] = useState("Soma kitabu");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBook() {
    setLoading(true);
    setError("");
    setSource("");
    try {
      if (!isSupabaseConfigured) throw new Error("Supabase haijaunganishwa. Sanidi mobile/.env kwanza.");
      const supabase = getSupabase();
      const [{ data: { user }, error: authError }, { data: book, error: bookError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("books")
          .select("id,title,seller_id,format,price_tzs,file_path,preview_path,status")
          .eq("id", id)
          .eq("status", "approved")
          .maybeSingle(),
      ]);
      if (authError) throw authError;
      if (bookError) throw bookError;
      if (!book) throw new Error("Kitabu hiki hakipatikani au bado hakijaidhinishwa.");
      if (book.format !== "epub") throw new Error("Kisomaji hiki kinafungua vitabu vya EPUB pekee.");

      let hasFullAccess = book.price_tzs === 0 || user?.id === book.seller_id;
      if (!hasFullAccess && user?.id) {
        const { data: entitlement, error: entitlementError } = await supabase
          .from("book_entitlements")
          .select("id")
          .eq("buyer_id", user.id)
          .eq("book_id", book.id)
          .maybeSingle();
        if (entitlementError) throw entitlementError;
        hasFullAccess = Boolean(entitlement);
      }

      const filePath = hasFullAccess ? book.file_path : book.preview_path;
      if (!filePath) throw new Error(hasFullAccess
        ? "Faili la EPUB la kitabu hiki halijawekwa."
        : "Sampuli ya EPUB haipatikani. Nunua kitabu ili kukifungua.");

      const { data: signed, error: signedError } = await supabase.storage
        .from("book-files")
        .createSignedUrl(filePath, 3600);
      if (signedError || !signed?.signedUrl) throw signedError ?? new Error("Kiungo salama cha EPUB hakikupatikana.");
      setTitle(book.title);
      setSource(signed.signedUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Imeshindikana kufungua EPUB.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadBook(); }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Link href={"/book/" + id} style={styles.back}>‹  Rudi kwenye kitabu</Link>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.caption}>Kisomaji cha EPUB</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={gold} size="large" />
          <Text style={styles.message}>Tunafungua kitabu chako...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>EPUB haijafunguka</Text>
          <Text style={styles.message}>{error}</Text>
          <Pressable onPress={() => void loadBook()} style={styles.retry}>
            <Text style={styles.retryText}>Jaribu tena</Text>
          </Pressable>
        </View>
      ) : source ? (
        <Reader
          src={source}
          width={width}
          height={Math.max(320, height - 92)}
          fileSystem={useEpubFileSystem}
          enableSwipe
          onDisplayError={(reason: unknown) => setError(reason instanceof Error ? reason.message : "Hitilafu imetokea wakati wa kuonyesha EPUB.")}
          renderLoadingFileComponent={<View style={styles.center}><ActivityIndicator color={gold} size="large" /><Text style={styles.message}>Tunapakia kurasa...</Text></View>}
          renderOpeningBookComponent={<View style={styles.center}><ActivityIndicator color={gold} size="large" /><Text style={styles.message}>Tunaandaa kitabu...</Text></View>}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },
  header: { backgroundColor: navy, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 },
  back: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", marginBottom: 10 },
  title: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  caption: { color: gold, fontSize: 11, fontWeight: "800", marginTop: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 26 },
  message: { color: "#687586", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 12 },
  errorTitle: { color: navy, fontSize: 18, fontWeight: "900" },
  retry: { backgroundColor: navy, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 13, marginTop: 18 },
  retryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
