import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import WebView, { WebViewNavigation } from "react-native-webview";

const HOME_URL = "https://maarifabooks.vercel.app";
const ALLOWED_HOST = "maarifabooks.vercel.app";

type TabKey = "home" | "books" | "library" | "account";

const TABS: { key: TabKey; label: string; icon: string; url: string }[] = [
  { key: "home", label: "Mwanzo", icon: "⌂", url: HOME_URL },
  { key: "books", label: "Vitabu", icon: "▤", url: `${HOME_URL}/#vitabu` },
  { key: "library", label: "Maktaba", icon: "▥", url: `${HOME_URL}/dashboard/jihudumie` },
  { key: "account", label: "Akaunti", icon: "◉", url: `${HOME_URL}/dashboard` },
];

function isInternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === ALLOWED_HOST;
  } catch {
    return value.startsWith("about:blank");
  }
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sectionsVisible, setSectionsVisible] = useState(false);

  const navigateToUrl = useCallback((url: string) => {
    setCurrentUrl(url);
    setLoading(true);
    setFailed(false);
    webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
  }, []);

  const navigateToTab = useCallback((tab: (typeof TABS)[number]) => {
    if (tab.key === activeTab && tab.url === currentUrl) {
      webViewRef.current?.injectJavaScript("window.scrollTo({ top: 0, behavior: 'smooth' }); true;");
      return;
    }
    setActiveTab(tab.key);
    setCurrentUrl(tab.url);
    setLoading(true);
    setFailed(false);
    webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(tab.url)}; true;`);
  }, [activeTab, currentUrl]);

  const handleNavigation = useCallback((request: WebViewNavigation) => {
    const url = request.url;
    if (url.startsWith("about:blank")) return true;
    if (isInternalUrl(url)) return true;

    try {
      const parsed = new URL(url);
      if (["tel:", "mailto:", "sms:", "whatsapp:"].includes(parsed.protocol)) {
        void Linking.openURL(url);
        return false;
      }
      if (parsed.protocol === "https:") {
        void Linking.openURL(url);
      }
    } catch {
      // Ignore unsupported or malformed navigation targets.
    }
    return false;
  }, []);

  const handleNewWindow = useCallback((event: { nativeEvent: { targetUrl: string } }) => {
    const target = event.nativeEvent.targetUrl;
    if (isInternalUrl(target)) {
      setCurrentUrl(target);
      setLoading(true);
      setFailed(false);
      webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(target)}; true;`);
      return;
    }
    try {
      const parsed = new URL(target);
      if (["https:", "tel:", "mailto:", "sms:", "whatsapp:"].includes(parsed.protocol)) {
        void Linking.openURL(target);
      }
    } catch {
      // Ignore malformed popup URLs.
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      if (activeTab !== "home") {
        navigateToTab(TABS[0]);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [activeTab, canGoBack, navigateToTab]);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  const openSection = (section: string) => {
    setSectionsVisible(false);
    switch (section) {
      case "store":
        setActiveTab("home");
        navigateToUrl(`${HOME_URL}/#vitabu`);
        break;
      case "search":
        setActiveTab("home");
        navigateToUrl(HOME_URL);
        Alert.alert("Tafuta vitabu", "Tumia sehemu ya utafutaji na vichujio vya kategoria kwenye ukurasa wa Mwanzo.");
        break;
      case "book":
        setActiveTab("books");
        navigateToUrl(`${HOME_URL}/#vitabu`);
        Alert.alert("Maelezo ya kitabu", "Chagua kitabu kwenye orodha ili kufungua ukurasa wake wa maelezo na utaratibu wa malipo.");
        break;
      case "authors":
        navigateToUrl(`${HOME_URL}/wauzaji`);
        break;
      case "library":
        setActiveTab("library");
        navigateToUrl(`${HOME_URL}/dashboard/jihudumie`);
        break;
      case "community":
        Alert.alert("Jamii ya Maarifa", "Sehemu hii bado haina mfumo wa jumuiya uliounganishwa. Haijawezeshwa ili kuepuka kuonyesha mazungumzo au taarifa za kubuni.");
        break;
      case "cart":
        Alert.alert("Kikapu cha vitabu", "Kikapu hakijaunganishwa kwa sasa. Unaweza kuchagua kitabu na kufuata utaratibu rasmi wa kulipa moja kwa moja kwa muuzaji.");
        break;
      case "checkout":
        Alert.alert("Malipo ya vitabu", "Lipa moja kwa moja kwa muuzaji. Muuzaji akithibitisha kupokea fedha, omba coupon kupitia mfumo; muuzaji atakutumia coupon ya kufungua kitabu.");
        setActiveTab("books");
        navigateToUrl(`${HOME_URL}/#vitabu`);
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" backgroundColor="#071B36" />
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brand}>Maarifa<Text style={styles.brandGold}>Books</Text></Text>
          <Text style={styles.tagline}>Soma. Sikiliza. Jifunze.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Omba kujiunga kama muuzaji"
          onPress={() => navigateToUrl(`${HOME_URL}/wauzaji`)}
          style={styles.sellerShortcut}
        >
          <Text style={styles.sellerShortcutText}>Uza vitabu</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fungua sehemu zote za MaarifaBooks"
          onPress={() => setSectionsVisible(true)}
          style={styles.menuShortcut}
        >
          <Text style={styles.menuShortcutText}>Sehemu</Text>
        </Pressable>
      </View>

      <Modal
        visible={sectionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSectionsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setSectionsVisible(false)} accessibilityLabel="Funga menyu" />
          <View style={styles.sectionsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeading}>
              <View>
                <Text style={styles.sheetTitle}>Sehemu za MaarifaBooks</Text>
                <Text style={styles.sheetSubtitle}>Chagua huduma unayotaka kufungua</Text>
              </View>
              <Pressable onPress={() => setSectionsVisible(false)} accessibilityRole="button" accessibilityLabel="Funga">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { id: "store", title: "Duka kuu la MaarifaBooks", description: "Tazama vitabu vilivyopo sokoni", icon: "▤", status: "Inapatikana" },
                { id: "search", title: "Tafuta na kategoria", description: "Tafuta kitabu kwa jina au kategoria", icon: "⌕", status: "Inapatikana" },
                { id: "book", title: "Maelezo ya kitabu na malipo", description: "Chagua kitabu kuona maelezo na njia ya kulipia", icon: "▣", status: "Inapatikana" },
                { id: "authors", title: "Waandishi na wachapishaji", description: "Fungua maombi ya kujiunga kama muuzaji", icon: "✎", status: "Inapatikana" },
                { id: "library", title: "Maktaba ya vitabu", description: "Fungua maktaba yako na vitabu ulivyopata", icon: "▥", status: "Inapatikana" },
                { id: "community", title: "Jamii ya Maarifa", description: "Jumuiya bado haijaunganishwa na mfumo", icon: "♧", status: "Inatayarishwa", disabled: true },
                { id: "cart", title: "Kikapu cha vitabu", description: "Hakuna kikapu halisi kwa sasa", icon: "🛒", status: "Inatayarishwa", disabled: true },
                { id: "checkout", title: "Malipo ya vitabu", description: "Fuata utaratibu rasmi wa malipo na coupon", icon: "✓", status: "Mwongozo wa malipo" },
              ].map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: Boolean(item.disabled) }}
                  disabled={Boolean(item.disabled)}
                  onPress={() => openSection(item.id)}
                  style={[styles.sectionRow, item.disabled && styles.sectionRowDisabled]}
                >
                  <View style={styles.sectionIcon}><Text style={styles.sectionIconText}>{item.icon}</Text></View>
                  <View style={styles.sectionCopy}>
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                    <Text style={styles.sectionDescription}>{item.description}</Text>
                    <Text style={[styles.sectionStatus, item.disabled && styles.sectionStatusDisabled]}>{item.status}</Text>
                  </View>
                  <Text style={styles.sectionChevron}>{item.disabled ? "…" : "›"}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={[styles.webview, loading && styles.webviewLoading]}
          originWhitelist={["https://*"]}
          onShouldStartLoadWithRequest={handleNavigation}
          onOpenWindow={handleNewWindow}
          onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
          onLoadStart={() => { setLoading(true); setFailed(false); }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setFailed(true); }}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 500) {
              setLoading(false);
              setFailed(true);
            }
          }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          setSupportMultipleWindows
          javaScriptCanOpenWindowsAutomatically
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="never"
          allowFileAccess={false}
          allowUniversalAccessFromFileURLs={false}
          cacheEnabled
          incognito={false}
          onFileDownload={({ nativeEvent }) => {
            if (nativeEvent.downloadUrl.startsWith("https://")) {
              void Linking.openURL(nativeEvent.downloadUrl);
            }
          }}
        />
        {loading && !failed && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#D5A642" />
            <Text style={styles.loadingText}>Inafungua MaarifaBooks...</Text>
          </View>
        )}
        {failed && (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>Imeshindikana kufungua MaarifaBooks</Text>
            <Text style={styles.errorText}>Angalia muunganisho wa intaneti kisha ujaribu tena.</Text>
            <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
              <Text style={styles.retryText}>Jaribu tena</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.bottomNav} accessibilityRole="tablist">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
              testID={`tab-${tab.key}`}
              onPress={() => navigateToTab(tab)}
              style={styles.tab}
            >
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {active && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071B36" },
  topBar: {
    minHeight: 62,
    paddingHorizontal: 18,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#071B36",
  },
  brand: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", letterSpacing: -0.6 },
  brandGold: { color: "#D5A642" },
  tagline: { color: "#DCE4EF", fontSize: 10, fontWeight: "500", marginTop: 1 },
  sellerShortcut: { minHeight: 36, justifyContent: "center", paddingHorizontal: 13, borderRadius: 18, borderWidth: 1, borderColor: "#D5A642" },
  sellerShortcutText: { color: "#F1D18B", fontSize: 12, fontWeight: "700" },

  menuShortcut: { minHeight: 36, justifyContent: "center", paddingHorizontal: 12, borderRadius: 18, backgroundColor: "#D5A642" },
  menuShortcutText: { color: "#071B36", fontSize: 12, fontWeight: "800" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(3, 12, 25, 0.55)" },
  modalDismiss: { flex: 1 },
  sectionsSheet: { maxHeight: "82%", paddingHorizontal: 18, paddingTop: 10, paddingBottom: 22, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: "#FFFFFF" },
  sheetHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: "#D5DCE5", marginBottom: 16 },
  sheetHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { color: "#071B36", fontSize: 18, fontWeight: "800" },
  sheetSubtitle: { color: "#667386", fontSize: 12, marginTop: 4 },
  closeText: { color: "#526174", fontSize: 22, paddingHorizontal: 8 },
  sectionRow: { minHeight: 76, flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5EAF0" },
  sectionRowDisabled: { opacity: 0.58 },
  sectionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F0E7", marginRight: 12 },
  sectionIconText: { color: "#9B7225", fontSize: 21, fontWeight: "700" },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: "#071B36", fontSize: 13, fontWeight: "800" },
  sectionDescription: { color: "#667386", fontSize: 11, marginTop: 3 },
  sectionStatus: { color: "#28724E", fontSize: 10, fontWeight: "700", marginTop: 5 },
  sectionStatusDisabled: { color: "#8A6A2A" },
  sectionChevron: { color: "#9B7225", fontSize: 25, paddingLeft: 8 },
  content: { flex: 1, backgroundColor: "#FFFFFF" },
  webview: { flex: 1, backgroundColor: "#FFFFFF" },
  webviewLoading: { opacity: 0 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: { marginTop: 12, color: "#071B36", fontSize: 14 },
  error: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#FFFFFF",
  },
  errorTitle: { color: "#071B36", fontSize: 18, fontWeight: "700", textAlign: "center" },
  errorText: { color: "#526174", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 21 },
  retry: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 10, backgroundColor: "#D5A642", minHeight: 44, justifyContent: "center" },
  retryText: { color: "#071B36", fontWeight: "700" },
  bottomNav: {
    minHeight: 66,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 7 : 5,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DCE2EA",
  },
  tab: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 2 },
  tabIcon: { color: "#7B8798", fontSize: 21, lineHeight: 25 },
  tabIconActive: { color: "#B78628" },
  tabLabel: { color: "#667386", fontSize: 10, fontWeight: "600" },
  tabLabelActive: { color: "#071B36", fontWeight: "800" },
  activeIndicator: { position: "absolute", top: -6, width: 22, height: 3, borderRadius: 2, backgroundColor: "#D5A642" },
});
