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

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const handleNavigation = useCallback((request: WebViewNavigation) => {
    const url = request.url;
    if (url.startsWith("about:blank")) return true;

    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" && parsed.hostname === ALLOWED_HOST) {
        return true;
      }
      if (["tel:", "mailto:", "sms:", "whatsapp:"].includes(parsed.protocol)) {
        void Linking.openURL(url);
        return false;
      }
      if (parsed.protocol === "https:" && parsed.hostname !== ALLOWED_HOST) {
        void Linking.openURL(url);
        return false;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" backgroundColor="#071B36" />
      <View style={styles.topBar}>
        <Text style={styles.brand}>Maarifa<Text style={styles.brandGold}>Books</Text></Text>
        <Text style={styles.tagline}>Soma. Sikiliza. Jifunze.</Text>
      </View>

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

      <WebView
        ref={webViewRef}
        source={{ uri: HOME_URL }}
        style={[styles.webview, failed && styles.hidden, loading && styles.webviewLoading]}
        originWhitelist={["https://*"]}
        onShouldStartLoadWithRequest={handleNavigation}
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
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="never"
        javaScriptCanOpenWindowsAutomatically={false}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071B36" },
  topBar: {
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#071B36",
  },
  brand: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", letterSpacing: -0.6 },
  brandGold: { color: "#D5A642" },
  tagline: { color: "#DCE4EF", fontSize: 11, fontWeight: "500" },
  webview: { flex: 1, backgroundColor: "#FFFFFF" },
  webviewLoading: { opacity: 0 },
  hidden: { display: "none" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    top: 54,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: { marginTop: 12, color: "#071B36", fontSize: 14 },
  error: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#FFFFFF",
  },
  errorTitle: { color: "#071B36", fontSize: 18, fontWeight: "700", textAlign: "center" },
  errorText: { color: "#526174", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 21 },
  retry: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 10, backgroundColor: "#D5A642" },
  retryText: { color: "#071B36", fontWeight: "700" },
});