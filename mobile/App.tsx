import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
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
      </View>

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
