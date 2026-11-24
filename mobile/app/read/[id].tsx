import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSupabase, isSupabaseConfigured } from "@/src/lib/supabase";

const navy = "#10233F";
const gold = "#C9A34A";

type ReaderSource = { uri: string; cache: boolean };

export default function PdfReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("Soma kitabu");
  const [source, setSource] = useState<ReaderSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function loadBook() {
    setLoading(true);
    setError("");
    setSource(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase haijaunganishwa. Sanidi mobile/.env kwanza.");
      }

      const supabase = getSupabase();
      const [{ data: { user }, error: authError }, { data: book, error: bookError }] =
        await Promise.all([
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
      if (book.format !== "pdf") throw new Error("Kisomaji hiki kinafungua vitabu vya PDF pekee.");

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

      const path = hasFullAccess ? book.file_path : book.preview_path;
      if (!path) {
        throw new Error(hasFullAccess
          ? "Faili la PDF la kitabu hiki halijawekwa."
          : "Sampuli ya PDF haipatikani kwa sasa.");
      }

      const { data: signed, error: signedError } = await supabase.storage
        .from("book-files")
        .createSignedUrl(path, 900);
      if (signedError || !signed?.signedUrl) {
        throw signedError ?? new Error("Kiungo salama cha PDF hakikupatikana.");
      }

      setTitle(book.title);
      setSource({ uri: signed.signedUrl, cache: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Imeshindikana kufungua PDF.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBook();
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Link href={"/book/" + id} style={styles.back}>‹  Rudi kwenye kitabu</Link>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.page}>{total > 0 ? "Ukurasa " + page + " / " + total : "Kisomaji cha PDF"}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={gold} size="large" />
          <Text style={styles.message}>Tunafungua kitabu chako...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>PDF haijafunguka</Text>
          <Text style={styles.message}>{error}</Text>
          <Pressable onPress={() => void loadBook()} style={styles.retry}>
            <Text style={styles.retryText}>Jaribu tena</Text>
          </Pressable>
        </View>
      ) : source ? (
        <Pdf
          source={source}
          style={styles.pdf}
          trustAllCerts={false}
          enablePaging={false}
          spacing={8}
          onLoadComplete={(pages: number) => setTotal(pages)}
          onPageChanged={(nextPage: number, pages: number) => {
            setPage(nextPage);
            setTotal(pages);
          }}
          onError={(e: unknown) => {
            setError(e instanceof Error ? e.message : "Hitilafu imetokea wakati wa kusoma PDF.");
          }}
          renderActivityIndicator={() => <ActivityIndicator color={gold} size="large" />}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F4F7" },
  header: { backgroundColor: navy, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 },
  back: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", marginBottom: 10 },
  title: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  page: { color: gold, fontSize: 11, fontWeight: "800", marginTop: 6 },
  pdf: { flex: 1, width: "100%", backgroundColor: "#E9EDF2" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 26 },
  message: { color: "#687586", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 12 },
  errorTitle: { color: navy, fontSize: 18, fontWeight: "900" },
  retry: { backgroundColor: navy, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 13, marginTop: 18 },
  retryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
