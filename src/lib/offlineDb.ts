import { Story } from "../types";

const DB_NAME = "IslamicKidsStoriesOffline";
const STORE_NAME = "stories";
const AUDIO_STORE_NAME = "story_audio";
const DB_VERSION = 2;

export function initOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Utility to convert image URL to base64 for full offline image rendering
async function imageUrlToBase64(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url; // Already base64
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) return url;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("[Offline Cache] Could not cache image as base64 (likely CORS or network):", e);
    return url;
  }
}

// Utility to fetch audio URL as base64 Data URL for offline storage
async function audioUrlToBase64(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("[Offline Audio Cache] Could not fetch audio URL for offline storage:", e);
    return null;
  }
}

// Save Story Narration Audio Track specifically to IndexedDB
export async function saveStoryAudioTrackOffline(storyId: string, lang: "en" | "ur", audioDataOrBlob: Blob | string): Promise<void> {
  try {
    const db = await initOfflineDb();
    let dataUrl: string = "";
    if (typeof audioDataOrBlob === "string") {
      dataUrl = audioDataOrBlob;
    } else {
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioDataOrBlob);
      });
    }

    const key = `${storyId}_${lang}`;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE_NAME, "readwrite");
      const store = transaction.objectStore(AUDIO_STORE_NAME);
      const request = store.put({ 
        key, 
        storyId, 
        lang, 
        dataUrl, 
        savedAt: new Date().toISOString() 
      });

      request.onsuccess = () => {
        console.log(`[Offline Audio Cache] Saved narration audio for ${key}`);
        window.dispatchEvent(new CustomEvent("offline-stories-updated"));
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (err) {
    console.error("[Offline Audio Cache] Error saving audio track:", err);
  }
}

// Retrieve Story Narration Audio Track from IndexedDB
export async function getOfflineStoryAudioTrack(storyId: string, lang: "en" | "ur"): Promise<string | null> {
  try {
    const db = await initOfflineDb();
    const key = `${storyId}_${lang}`;
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        resolve(null);
        return;
      }
      const transaction = db.transaction(AUDIO_STORE_NAME, "readonly");
      const store = transaction.objectStore(AUDIO_STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result && request.result.dataUrl) {
          resolve(request.result.dataUrl);
        } else {
          resolve(null);
        }
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (err) {
    console.error("[Offline Audio Cache] Error getting audio track:", err);
    return null;
  }
}

// Check if an offline story audio track exists
export async function hasOfflineStoryAudio(storyId: string, lang: "en" | "ur"): Promise<boolean> {
  const track = await getOfflineStoryAudioTrack(storyId, lang);
  return !!track;
}

// Save Story & any associated Audio Tracks offline
export async function saveStoryOffline(story: Story, narrationAudio?: { lang: "en" | "ur"; audioDataUrl: string }): Promise<void> {
  try {
    console.log(`[Offline Cache] Saving story ${story.id} ("${story.titleEn}") and audio to IndexedDB...`);
    
    // Attempt to cache cover image as base64 for offline use
    let cachedCoverImage = story.coverImage;
    if (story.coverImage && !story.coverImage.startsWith("data:")) {
      cachedCoverImage = await imageUrlToBase64(story.coverImage);
    }

    // Cache pre-existing audio URLs if provided in story object
    if (story.audioUrlEn) {
      const audioEn = await audioUrlToBase64(story.audioUrlEn);
      if (audioEn) {
        await saveStoryAudioTrackOffline(story.id, "en", audioEn);
      }
    }
    if (story.audioUrlUr) {
      const audioUr = await audioUrlToBase64(story.audioUrlUr);
      if (audioUr) {
        await saveStoryAudioTrackOffline(story.id, "ur", audioUr);
      }
    }

    // Cache explicit narration audio passed during save if provided
    if (narrationAudio && narrationAudio.audioDataUrl) {
      await saveStoryAudioTrackOffline(story.id, narrationAudio.lang, narrationAudio.audioDataUrl);
    }

    const storyToCache: Story = {
      ...story,
      coverImage: cachedCoverImage
    };

    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(storyToCache);

      request.onsuccess = () => {
        console.log(`[Offline Cache] Story ${story.id} successfully saved offline with audio capability.`);
        window.dispatchEvent(new CustomEvent("offline-stories-updated"));
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error("[Offline Cache] Failed to save story to IndexedDB:", error);
  }
}

export async function getOfflineStoryIds(): Promise<string[]> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve((request.result as string[]));
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error("[Offline Cache] Failed to get offline story IDs:", error);
    return [];
  }
}

export async function getOfflineStories(): Promise<Story[]> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as Story[]));
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error("[Offline Cache] Failed to get offline stories:", error);
    return [];
  }
}

export async function deleteOfflineStory(storyId: string): Promise<void> {
  try {
    console.log(`[Offline Cache] Deleting cached story and audio for ${storyId}...`);
    const db = await initOfflineDb();

    // Delete audio tracks
    if (db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
      const audioTx = db.transaction(AUDIO_STORE_NAME, "readwrite");
      const audioStore = audioTx.objectStore(AUDIO_STORE_NAME);
      audioStore.delete(`${storyId}_en`);
      audioStore.delete(`${storyId}_ur`);
    }

    // Delete story
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(storyId);

      request.onsuccess = () => {
        console.log(`[Offline Cache] Story ${storyId} deleted from cache.`);
        window.dispatchEvent(new CustomEvent("offline-stories-updated"));
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error("[Offline Cache] Failed to delete offline story:", error);
  }
}

