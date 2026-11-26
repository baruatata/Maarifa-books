import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as SecureStore from "expo-secure-store";
import type { SupabaseClient } from "@supabase/supabase-js";

type Chapter = { id: string; chapter_index: number; title: string; audio_path: string; is_preview: boolean };
type Props = { bookId: string; userId: string | null; client: SupabaseClient };

const NAVY = "#071B36";
const GOLD = "#D5A642";
const MUTED = "#667085";

export default function AudioBookPlayer({ bookId, userId, client }: Props) {
  const player = useAudioPlayer(null, { updateInterval: 1000 });
  const playback = useAudioPlayerStatus(player);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selected, setSelected] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingRequest, setPlayingRequest] = useState(false);
  const [message, setMessage] = useState("");
  const [speed, setSpeed] = useState(1);

  const loadChapters = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      // Supabase RLS returns preview/free chapters to visitors and full chapters
      // only to buyers with an entitlement, the seller, or an administrator.
      const { data, error } = await client.from("book_audio_chapters")
        .select("id,chapter_index,title,audio_path,is_preview")
        .eq("book_id", bookId)
        .order("chapter_index", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Chapter[];
      setChapters(rows);
      if (!rows.length) setMessage("Hakuna sura za sauti zilizowekwa kwa kitabu hiki bado.");
      else setSelected(current => current && rows.some(row => row.id === current.id) ? current : rows[0]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Imeshindikana kupakia sura za sauti.");
    } finally {
      setLoading(false);
    }
  }, [bookId, client]);

  useEffect(() => { void loadChapters(); }, [loadChapters]);

  const startChapter = useCallback(async (chapter: Chapter) => {
    setPlayingRequest(true);
    setMessage("");
    try {
      const { data, error } = await client.storage.from("book-files").createSignedUrl(chapter.audio_path, 3600);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Kiungo salama cha sauti hakikupatikana.");
      const key = `maarifa-audio:${userId ?? "guest"}:${bookId}:${chapter.id}`;
      const saved = Platform.OS === "web"
        ? (typeof window !== "undefined" ? window.localStorage.getItem(key) : null)
        : await SecureStore.getItemAsync(key);
      player.pause();
      player.replace(data.signedUrl);
      if (saved) {
        const position = Number(saved);
        if (Number.isFinite(position) && position > 0) player.seekTo(position);
      }
      setSelected(chapter);
      player.playbackRate = speed;
      player.play();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Imeshindikana kuanzisha sauti.";
      setMessage(text);
      Alert.alert("Sauti haijafunguka", text);
    } finally {
      setPlayingRequest(false);
    }
  }, [bookId, client, player, speed, userId]);

  useEffect(() => {
    if (!selected || !playback.isLoaded || playback.currentTime <= 0) return;
    const key = `maarifa-audio:${userId ?? "guest"}:${bookId}:${selected.id}`;
    const value = String(Math.floor(playback.currentTime));
    if (Platform.OS === "web") {
      try { if (typeof window !== "undefined") window.localStorage.setItem(key, value); } catch { /* Browser storage may be unavailable. */ }
    } else {
      void SecureStore.setItemAsync(key, value).catch(() => undefined);
    }
  }, [bookId, playback.currentTime, playback.isLoaded, selected, userId]);

  const changeSpeed = () => {
    const next = speed >= 2 ? 1 : Number((speed + 0.25).toFixed(2));
    setSpeed(next);
    player.playbackRate = next;
  };
  const seek = (delta: number) => {
    const duration = playback.duration || 0;
    player.seekTo(Math.max(0, Math.min(duration, playback.currentTime + delta)));
  };
  const time = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Sikiliza kitabu</Text>
      <Text style={styles.subheading}>Sura za sauti zilizowekwa na mwandishi au muuzaji.</Text>
      {loading ? <ActivityIndicator color={GOLD} style={{ marginVertical: 20 }} /> : null}
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!loading && chapters.map(chapter => (
        <Pressable key={chapter.id} onPress={() => void startChapter(chapter)}
          style={[styles.chapter, selected?.id === chapter.id && styles.chapterSelected]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.chapterTitle}>{chapter.chapter_index}. {chapter.title}</Text>
            <Text style={styles.chapterType}>{chapter.is_preview ? "Sampuli ya kusikiliza" : "Sura kamili"}</Text>
          </View>
          <Text style={styles.chapterAction}>{selected?.id === chapter.id && playback.playing ? "Inasikika" : "Sikiliza"}</Text>
        </Pressable>
      ))}
      {selected && chapters.length > 0 && (
        <View style={styles.controls}>
          <Text style={styles.nowPlaying}>Sasa: {selected.title}</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${playback.duration > 0 ? Math.min(100, playback.currentTime / playback.duration * 100) : 0}%` }]} /></View>
          <View style={styles.timeRow}><Text style={styles.time}>{time(playback.currentTime)}</Text><Text style={styles.time}>{time(playback.duration)}</Text></View>
          <View style={styles.buttons}>
            <Pressable style={styles.smallButton} onPress={() => seek(-15)}><Text style={styles.buttonText}>−15s</Text></Pressable>
            <Pressable style={styles.playButton} disabled={playingRequest || !playback.isLoaded} onPress={() => playback.playing ? player.pause() : player.play()}>
              <Text style={styles.playText}>{playingRequest ? "..." : playback.playing ? "Sitisha" : "Endelea"}</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => seek(15)}><Text style={styles.buttonText}>+15s</Text></Pressable>
            <Pressable style={styles.speedButton} onPress={changeSpeed}><Text style={styles.buttonText}>{speed}×</Text></Pressable>
          </View>
          <Text style={styles.savedNote}>Maendeleo ya usikilizaji yanahifadhiwa kwenye kifaa hiki.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: 22, padding: 15, backgroundColor: "#FFFFFF", borderRadius: 13, borderWidth: 1, borderColor: "#E6EAF0" },
  heading: { fontSize: 18, fontWeight: "900", color: NAVY },
  subheading: { fontSize: 12, color: MUTED, lineHeight: 18, marginTop: 5, marginBottom: 12 },
  message: { color: MUTED, fontSize: 12, lineHeight: 18, marginVertical: 10 },
  chapter: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: "#EDF0F4" },
  chapterSelected: { backgroundColor: "#F7F8FA" },
  chapterTitle: { color: NAVY, fontSize: 13, fontWeight: "800" },
  chapterType: { color: MUTED, fontSize: 10, marginTop: 4 },
  chapterAction: { color: "#98701B", fontSize: 11, fontWeight: "900" },
  controls: { marginTop: 12, padding: 12, backgroundColor: "#F5F7FA", borderRadius: 10 },
  nowPlaying: { color: NAVY, fontSize: 12, fontWeight: "800", marginBottom: 12 },
  progressTrack: { height: 5, borderRadius: 5, backgroundColor: "#DCE2EA", overflow: "hidden" },
  progressFill: { height: 5, backgroundColor: GOLD },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  time: { color: MUTED, fontSize: 10, fontVariant: ["tabular-nums"] },
  buttons: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7, marginTop: 14 },
  smallButton: { paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#E7EDF4", borderRadius: 8 },
  speedButton: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#F2E8D1", borderRadius: 8 },
  buttonText: { color: NAVY, fontSize: 11, fontWeight: "900" },
  playButton: { flex: 1, alignItems: "center", paddingVertical: 11, backgroundColor: NAVY, borderRadius: 8 },
  playText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },
  savedNote: { color: MUTED, fontSize: 10, marginTop: 10, textAlign: "center" },
});
