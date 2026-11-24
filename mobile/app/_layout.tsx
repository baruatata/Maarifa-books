import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ReaderProvider } from "@epubjs-react-native/core";

export default function RootLayout() {
  return <SafeAreaProvider><ReaderProvider><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F8FA" } }} /></ReaderProvider></SafeAreaProvider>;
}