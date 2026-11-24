import { Directory, File, Paths } from "expo-file-system";
import { useCallback, useState } from "react";

function withTrailingSlash(uri: string) {
  return uri.endsWith("/") ? uri : uri + "/";
}

function directoryUri(directory: Directory | null | undefined) {
  return directory?.uri ? withTrailingSlash(directory.uri) : null;
}

export function useEpubFileSystem() {
  const [file, setFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [size, setSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const downloadFile = useCallback((fromUrl: string, toFile: string) => {
    const destination = new File(Paths.document, toFile);
    setDownloading(true);
    setProgress(0);
    return File.downloadFileAsync(fromUrl, destination, { idempotent: true }).then((downloaded) => {
      setSize(downloaded.size);
      setSuccess(true);
      setError(null);
      setFile(downloaded.uri);
      setProgress(100);
      return { uri: downloaded.uri, mimeType: downloaded.type || null };
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Imeshindikana kupakua EPUB.");
      setSuccess(false);
      setFile(null);
      setSize(0);
      return { uri: null, mimeType: null };
    }).finally(() => setDownloading(false));
  }, []);

  const getFileInfo = useCallback(async (fileUri: string) => {
    const directory = new Directory(fileUri);
    if (directory.exists) {
      return { uri: directory.uri, exists: true, isDirectory: true, size: directory.size ?? undefined };
    }
    const target = new File(fileUri);
    return { uri: target.uri, exists: target.exists, isDirectory: false, size: target.exists ? target.size : undefined };
  }, []);

  const readAsStringAsync = useCallback(async (fileUri: string, options?: { encoding?: "utf8" | "base64" }) => {
    const target = new File(fileUri);
    return options?.encoding === "base64" ? target.base64() : target.text();
  }, []);

  const writeAsStringAsync = useCallback(async (fileUri: string, contents: string, options?: { encoding?: "utf8" | "base64" }) => {
    const target = new File(fileUri);
    await target.write(contents, { encoding: options?.encoding ?? "utf8" });
  }, []);

  const deleteAsync = useCallback(async (fileUri: string) => {
    const target = new File(fileUri);
    if (target.exists) {
      target.delete();
      return;
    }
    const directory = new Directory(fileUri);
    if (directory.exists) directory.delete();
  }, []);

  return {
    file,
    progress,
    downloading,
    size,
    error,
    success,
    documentDirectory: directoryUri(Paths.document),
    cacheDirectory: directoryUri(Paths.cache),
    bundleDirectory: directoryUri(Paths.bundle) ?? undefined,
    readAsStringAsync,
    writeAsStringAsync,
    deleteAsync,
    downloadFile,
    getFileInfo,
  };
}
