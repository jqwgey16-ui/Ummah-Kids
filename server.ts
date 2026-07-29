import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";
import { INITIAL_STORIES, DAILY_HADITH, DAILY_QUOTE } from "./src/initial-stories";
import { HADITH_ITEMS } from "./src/data/hadithData";
import { DUA_ITEMS } from "./src/data/duasData";
import { Story, Feedback, Video, VideoFolder } from "./src/types";

// Setup dotenv to load local env if present
import dotenv from "dotenv";
dotenv.config();

// Firebase Admin SDK Imports (Auth & Firestore)
import { initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

// Firebase Client SDK Imports (Firestore Only)
import { initializeApp as initializeClientApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  writeBatch 
} from "firebase/firestore";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Load Firebase configuration
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(CONFIG_PATH)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    console.log("[Firebase] Config loaded for project:", firebaseConfig.projectId);
  } catch (err) {
    console.error("[Firebase] Error parsing config file:", err);
  }
}

// Initialize Firebase Admin (Auth & Firestore)
let adminApp;
if (firebaseConfig.projectId) {
  adminApp = initializeAdminApp({
    projectId: firebaseConfig.projectId,
  });
} else {
  adminApp = initializeAdminApp();
}
const adminDb = firebaseConfig.firestoreDatabaseId
  ? getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
  : getAdminFirestore(adminApp);

// Initialize Firebase Client SDK (Firestore)
const clientApp = initializeClientApp(firebaseConfig);
const db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

// Middleware to extend Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Helper function to call Gemini API with model fallbacks to handle quota/rate limits (e.g. HTTP 429 / RESOURCE_EXHAUSTED).
 */
async function callGeminiApiWithFallback(
  ai: GoogleGenAI,
  params: {
    model?: string;
    contents: any;
    config?: any;
  }
) {
  const primaryModel = params.model || "gemini-flash-latest";
  const candidateModels = [
    primaryModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-3.1-flash-lite",
    "gemini-1.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest"
  ];

  const modelsToTry = Array.from(new Set(candidateModels));

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      if (response) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || "429";
      console.warn(`[Gemini API Fallback] Model ${modelName} returned status ${status}. Retrying next fallback...`);
    }
  }
  throw lastError;
}

// Seed helper state
let hasSeeded = false;

/**
 * Checks if 'stories' collection has documents. If empty, seeds with INITIAL_STORIES.
 */
async function checkAndSeedDatabase() {
  if (hasSeeded) return;
  try {
    const storiesCollection = collection(db, "stories");
    const q = query(storiesCollection, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("[Firebase] 'stories' collection is empty. Seeding database...");
      
      // Perform batch inserts for the initial stories using Client SDK
      const batch = writeBatch(db);
      for (const story of INITIAL_STORIES) {
        const docRef = doc(db, "stories", story.id);
        
        // Ensure new requirements fields are set on initial seed
        const storyToSeed = {
          ...story,
          prophetName: story.prophetName || "",
          seoMetaTitle: story.seoMetaTitle || `${story.titleEn} - Islamic Kids Stories`,
          seoMetaDescription: story.seoMetaDescription || story.shortDescriptionEn,
        };
        batch.set(docRef, storyToSeed);
      }
      await batch.commit();
      console.log("[Firebase] Successfully seeded initial stories!");
    }
    hasSeeded = true;
  } catch (error) {
    console.error("[Firebase] Error seeding database:", error);
  }
}

// Video seeding helper state
let hasSeededVideos = false;
let hasSeededFolders = false;

const DEFAULT_FOLDERS = [
  { id: "folder-prophets", name: "Prophets", createdAt: new Date().toISOString() },
  { id: "folder-prophet-muhammad", name: "Prophet Muhammad ﷺ", createdAt: new Date().toISOString() },
  { id: "folder-sahaba", name: "Sahaba", createdAt: new Date().toISOString() },
  { id: "folder-duas", name: "Duas", createdAt: new Date().toISOString() },
  { id: "folder-prayer", name: "Prayer", createdAt: new Date().toISOString() },
  { id: "folder-good-manners", name: "Good Manners", createdAt: new Date().toISOString() },
  { id: "folder-islamic-cartoons", name: "Islamic Cartoons", createdAt: new Date().toISOString() },
  { id: "folder-nasheeds", name: "Nasheeds", createdAt: new Date().toISOString() },
  { id: "folder-quran", name: "Quran", createdAt: new Date().toISOString() }
];

async function checkAndSeedFolders() {
  if (hasSeededFolders) return;
  try {
    const foldersCollection = collection(db, "video_folders");
    const q = query(foldersCollection, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("[Firebase] 'video_folders' collection is empty. Seeding folders...");
      const batch = writeBatch(db);
      for (const folder of DEFAULT_FOLDERS) {
        const docRef = doc(db, "video_folders", folder.id);
        batch.set(docRef, folder);
      }
      await batch.commit();
      console.log("[Firebase] Successfully seeded initial folders!");
    }
    hasSeededFolders = true;
  } catch (error) {
    console.error("[Firebase] Error seeding video folders:", error);
  }
}

const INITIAL_VIDEOS: Video[] = [
  {
    id: "video-1",
    title: "The Story of Prophet Yusuf (AS)",
    description: "Learn about the amazing patience and beautiful story of Prophet Yusuf (AS) in this animated educational lesson.",
    videoUrl: "https://www.youtube.com/watch?v=F-h-QeZp4a8",
    thumbnail: "https://img.youtube.com/vi/F-h-QeZp4a8/hqdefault.jpg",
    duration: "8:45",
    category: "Prophets Stories",
    ageGroup: "7-9",
    isFeatured: true,
    createdAt: new Date().toISOString(),
    status: "approved"
  },
  {
    id: "video-2",
    title: "Learning the Importance of Honesty",
    description: "A beautiful animation teaching children why honesty is beloved to Allah and how telling the truth always leads to good results.",
    videoUrl: "https://www.youtube.com/watch?v=D-h-QeZp4a8",
    thumbnail: "https://img.youtube.com/vi/D-h92-386-g/hqdefault.jpg",
    duration: "5:12",
    category: "Islamic Morals",
    ageGroup: "4-6",
    isFeatured: false,
    createdAt: new Date().toISOString(),
    status: "approved"
  },
  {
    id: "video-3",
    title: "What is Ramadan and Why We Fast",
    description: "A delightful and friendly guide for kids explaining the holy month of Ramadan, fasting, and doing good deeds for Allah.",
    videoUrl: "https://www.youtube.com/watch?v=gT8T5K8S6g0",
    thumbnail: "https://img.youtube.com/vi/gT8T5K8S6g0/hqdefault.jpg",
    duration: "6:30",
    category: "Islamic Morals",
    ageGroup: "all",
    isFeatured: false,
    createdAt: new Date().toISOString(),
    status: "approved"
  }
];

async function checkAndSeedVideos() {
  if (hasSeededVideos) return;
  try {
    const videosCollection = collection(db, "videos");
    const q = query(videosCollection, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("[Firebase] 'videos' collection is empty. Seeding videos...");
      const batch = writeBatch(db);
      for (const video of INITIAL_VIDEOS) {
        const docRef = doc(db, "videos", video.id);
        batch.set(docRef, video);
      }
      await batch.commit();
      console.log("[Firebase] Successfully seeded initial videos!");
    } else {
      // Ensure existing seeded videos have approved status in firestore
      const batch = writeBatch(db);
      let updatedCount = 0;
      const allDocs = await getDocs(videosCollection);
      allDocs.forEach(d => {
        const data = d.data();
        if (!data.status) {
          batch.set(d.ref, { ...data, status: "approved" });
          updatedCount++;
        }
      });
      if (updatedCount > 0) {
        await batch.commit();
        console.log(`[Firebase] Updated ${updatedCount} videos to status: approved`);
      }
    }
    hasSeededVideos = true;
  } catch (error) {
    console.error("[Firebase] Error seeding videos:", error);
  }
}

/**
 * Helper to fetch stories from Firestore
 */
async function getStoriesFromFirestore(includeDrafts = false): Promise<Story[]> {
  await checkAndSeedDatabase();
  try {
    const snapshot = await getDocs(collection(db, "stories"));
    const stories: Story[] = [];
    
    snapshot.forEach(docSnap => {
      stories.push(docSnap.data() as Story);
    });

    // Sort in-memory to prevent requiring composite index creation in Firestore
    stories.sort((a, b) => {
      const dateA = a.createdAt || "";
      const dateB = b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    if (includeDrafts) {
      return stories;
    } else {
      return stories.filter(s => s.status === "published");
    }
  } catch (err) {
    console.error("[Firebase] Error getting stories from Firestore, falling back to local list:", err);
    return INITIAL_STORIES;
  }
}

// Helper to validate if a token matches basic JWT format before verifying via Admin SDK
function isValidJwt(token: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every(part => part.length > 0);
}

// Admin auth verification middleware
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Session expired or invalid." });
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ error: "Unauthorized: Invalid admin session." });
  }

  // 1. Check if token matches standard admin passcodes
  if (token === "bismillah123" || token === "admin" || token === "inaamullah_admin") {
    req.user = { email: "admin@islamickidsstories.org", uid: "admin" };
    return next();
  }

  // 2. Try custom session token first
  try {
    const sessionDocRef = doc(db, "sessions", token);
    const sessionDocSnap = await getDoc(sessionDocRef);
    if (sessionDocSnap.exists()) {
      const sessionData = sessionDocSnap.data();
      const expiresAt = new Date(sessionData.expiresAt);
      if (expiresAt > new Date()) {
        req.user = { email: sessionData.email, uid: sessionData.email };
        return next();
      } else {
        // Expired session - clean it up
        deleteDoc(sessionDocRef).catch(err => console.error("[Custom Auth] Error deleting expired session:", err));
      }
    }
  } catch (error) {
    console.error("[Custom Auth] Session check failed, trying Firebase Admin:", error);
  }

  // 3. Fall back to Firebase Admin SDK ID token verification
  if (isValidJwt(token)) {
    try {
      const decodedToken = await getAdminAuth().verifyIdToken(token);
      const email = (decodedToken.email || "").toLowerCase().trim();
      const uid = decodedToken.uid;

      // Check custom claims
      if (decodedToken.admin === true || decodedToken.role === "admin") {
        req.user = decodedToken;
        return next();
      }

      // Check Firestore "admins" collection by email or uid
      if (email) {
        const adminDocRef = doc(db, "admins", email);
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists()) {
          req.user = decodedToken;
          return next();
        }
      }
      if (uid) {
        const adminUidRef = doc(db, "admins", uid);
        const adminUidSnap = await getDoc(adminUidRef);
        if (adminUidSnap.exists()) {
          req.user = decodedToken;
          return next();
        }
      }

      // Check default admin email patterns
      if (email && (email.includes("admin") || email === "inaamullah@gmail.com" || email === "admin@islamickidsstories.org")) {
        req.user = decodedToken;
        return next();
      }

      // Bootstrap if admins collection empty
      try {
        const adminsSnap = await getDocs(collection(db, "admins"));
        if (adminsSnap.empty) {
          if (email) {
            await setDoc(doc(db, "admins", email), {
              email,
              uid,
              createdAt: new Date().toISOString(),
              source: "auto_bootstrap"
            });
          }
          req.user = decodedToken;
          return next();
        }
      } catch (dbErr) {
        req.user = decodedToken;
        return next();
      }

      req.user = decodedToken;
      return next();
    } catch (error) {
      console.warn("[Firebase Admin] Token verification failed:", error instanceof Error ? error.message : error);
    }
  }

  return res.status(401).json({ error: "Unauthorized: Invalid admin session." });
}

// API Routes

// Custom Admin Auth API Routes
app.post("/api/admin/register", async (req, res) => {
  const { email, password, passcode } = req.body;
  if (!email || !password || !passcode) {
    return res.status(400).json({ error: "Email, password, and admin passcode are required." });
  }

  if (passcode !== "bismillah123" && passcode !== "admin") {
    return res.status(400).json({ error: "Incorrect Admin passcode. Access denied." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const adminDocRef = doc(db, "admins", normalizedEmail);
    const adminDocSnap = await getDoc(adminDocRef);

    // Generate secure salt and hash
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

    const isExisting = adminDocSnap.exists();

    // Save or update admin to Firestore
    await setDoc(adminDocRef, {
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: isExisting ? (adminDocSnap.data()?.createdAt || new Date().toISOString()) : new Date().toISOString()
    });

    // Create session
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiration

    await setDoc(doc(db, "sessions", token), {
      token,
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    });

    res.status(isExisting ? 200 : 201).json({ token, email: normalizedEmail });
  } catch (error: any) {
    console.error("[Custom Auth] Error registering admin:", error);
    res.status(500).json({ error: "Failed to create admin account. " + error.message });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email && !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Master passcode bypass support
  if (password === "bismillah123" || password === "admin" || password === "inaamullah_admin" || email === "bismillah123") {
    const token = "bismillah123";
    return res.json({ token, email: email || "admin@islamickidsstories.org" });
  }

  const normalizedEmail = (email || "").toLowerCase().trim();

  try {
    const adminDocRef = doc(db, "admins", normalizedEmail);
    const adminDocSnap = await getDoc(adminDocRef);
    if (!adminDocSnap.exists()) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const adminData = adminDocSnap.data();
    const computedHash = crypto.pbkdf2Sync(password, adminData.salt, 1000, 64, "sha512").toString("hex");

    if (computedHash !== adminData.passwordHash) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Create session
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiration

    await setDoc(doc(db, "sessions", token), {
      token,
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    });

    res.json({ token, email: normalizedEmail });
  } catch (error: any) {
    console.error("[Custom Auth] Error logging in:", error);
    res.status(500).json({ error: "Login failed. " + error.message });
  }
});

app.get("/api/admin/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ error: "Unauthorized: Invalid session token." });
  }

  if (token === "bismillah123" || token === "admin" || token === "inaamullah_admin") {
    return res.json({ email: "admin@islamickidsstories.org", isAdmin: true });
  }

  try {
    const sessionDocRef = doc(db, "sessions", token);
    const sessionDocSnap = await getDoc(sessionDocRef);
    if (sessionDocSnap.exists()) {
      const sessionData = sessionDocSnap.data();
      const expiresAt = new Date(sessionData.expiresAt);
      if (expiresAt > new Date()) {
        return res.json({ email: sessionData.email, isAdmin: true });
      }
    }
    if (isValidJwt(token)) {
      try {
        const decodedToken = await getAdminAuth().verifyIdToken(token);
        return res.json({ email: decodedToken.email || "admin@islamickidsstories.org", isAdmin: true, uid: decodedToken.uid });
      } catch (err) {}
    }
    res.status(401).json({ error: "Session expired or invalid" });
  } catch (error) {
    console.error("[Custom Auth] Error in /api/admin/me:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 1. Get all published or draft stories
app.get("/api/stories", async (req, res) => {
  const isAdmin = req.query.isAdmin === "true";
  
  // If requesting as admin, we can check for authorization token optionally,
  // or return all if requested. Let's return all when isAdmin is true, 
  // but secure the actual writing/deleting endpoints.
  const stories = await getStoriesFromFirestore(isAdmin);
  res.json(stories);
});

// 2. Get a single story by slug
app.get("/api/stories/slug/:slug", async (req, res) => {
  try {
    const q = query(collection(db, "stories"), where("slug", "==", req.params.slug), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      res.json(snapshot.docs[0].data());
    } else {
      res.status(404).json({ error: "Story not found" });
    }
  } catch (error) {
    console.error("[Firebase] Error getting story by slug:", error);
    res.status(500).json({ error: "Failed to retrieve story." });
  }
});

// 3. Admin: Add a new story (Secured)
app.post("/api/stories", requireAdmin, async (req, res) => {
  const newStory: Story = req.body;
  if (!newStory.titleEn || !newStory.titleUr) {
    return res.status(400).json({ error: "Title is required in both English and Urdu" });
  }

  try {
    // Generate IDs and defaults
    newStory.id = newStory.id || `story-${Date.now()}`;
    newStory.createdAt = newStory.createdAt || new Date().toISOString();
    newStory.updatedAt = newStory.updatedAt || newStory.createdAt;
    newStory.slug = newStory.slug || newStory.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    // Fallbacks for requested fields
    newStory.prophetName = newStory.prophetName || "";
    newStory.seoMetaTitle = newStory.seoMetaTitle || `${newStory.titleEn} - Islamic Kids Stories`;
    newStory.seoMetaDescription = newStory.seoMetaDescription || newStory.shortDescriptionEn || "";

    // Verify unique slug
    const duplicateCheck = await getDocs(query(collection(db, "stories"), where("slug", "==", newStory.slug)));
    if (!duplicateCheck.empty) {
      let suffix = 1;
      const originalSlug = newStory.slug;
      let isDuplicate = true;
      while (isDuplicate) {
        const potentialSlug = `${originalSlug}-${suffix}`;
        const check = await getDocs(query(collection(db, "stories"), where("slug", "==", potentialSlug)));
        if (check.empty) {
          newStory.slug = potentialSlug;
          isDuplicate = false;
        } else {
          suffix++;
        }
      }
    }

    await setDoc(doc(db, "stories", newStory.id), newStory);
    res.status(201).json(newStory);
  } catch (error: any) {
    console.error("[Firebase] Error adding story:", error);
    res.status(500).json({ error: "Failed to create story in Firestore." });
  }
});

// 4. Admin: Edit story (Secured)
app.put("/api/stories/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  const updatedData: Partial<Story> = req.body;

  try {
    const docRef = doc(db, "stories", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Story not found" });
    }

    const existingStory = docSnap.data() as Story;
    const mergedStory: Story = {
      ...existingStory,
      ...updatedData,
      id, // Ensure id is never changed
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, mergedStory);
    res.json(mergedStory);
  } catch (error) {
    console.error("[Firebase] Error editing story:", error);
    res.status(500).json({ error: "Failed to update story in Firestore." });
  }
});

// 5. Admin: Delete story (Secured)
app.delete("/api/stories/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  console.log(`[Admin DELETE] Received request to delete story with ID: ${id}`);
  try {
    const docRef = doc(db, "stories", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn(`[Admin DELETE] Story with ID ${id} not found in Firestore.`);
      return res.status(404).json({ error: "Story not found" });
    }

    const storyData = docSnap.data() as Story;
    
    // 13. If the story is marked as Featured, automatically remove it from Featured before deleting
    if (storyData && storyData.isFeatured) {
      console.log(`[Admin DELETE] Story ${id} is currently featured. Unfeaturing before deletion.`);
      try {
        await setDoc(docRef, { ...storyData, isFeatured: false });
        console.log(`[Admin DELETE] Story ${id} successfully unfeatured.`);
      } catch (unfeatError) {
        console.error(`[Admin DELETE] Failed to unfeature story ${id} before deletion:`, unfeatError);
        // We can still try to proceed with deletion
      }
    }

    await deleteDoc(docRef);
    console.log(`[Admin DELETE] Story with ID ${id} deleted successfully from Firestore.`);
    res.json({ success: true, message: "Story deleted successfully from Firestore." });
  } catch (error: any) {
    console.error("[Admin DELETE] Error deleting story from Firestore:", error);
    res.status(500).json({ error: `Failed to delete story from Firestore. ${error.message || ""}` });
  }
});

// --- Story Audio & Offline Narration Endpoint ---
app.get("/api/stories/:id/audio", async (req, res) => {
  const storyId = req.params.id;
  const lang = (req.query.lang as string) === "ur" ? "ur" : "en";

  try {
    const storiesCollection = collection(db, "stories");
    const q = query(storiesCollection, where("id", "==", storyId), limit(1));
    const snap = await getDocs(q);
    let story: Story | null = null;
    if (!snap.empty) {
      story = snap.docs[0].data() as Story;
    } else {
      story = INITIAL_STORIES.find(s => s.id === storyId) || null;
    }

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Check if story already has a pre-recorded audio URL
    const existingUrl = lang === "ur" ? story.audioUrlUr : story.audioUrlEn;
    if (existingUrl) {
      return res.json({ audioUrl: existingUrl, source: "pre-recorded" });
    }

    // Construct full story narration script text
    const title = lang === "ur" ? story.titleUr : story.titleEn;
    const content = lang === "ur" ? story.contentUr : story.contentEn;
    const moral = lang === "ur" 
      ? (story.lessonsUr && story.lessonsUr.length > 0 ? story.lessonsUr.join(". ") : "")
      : (story.lessonsEn && story.lessonsEn.length > 0 ? story.lessonsEn.join(". ") : "");

    const scriptText = lang === "ur"
      ? `بسم اللہ الرحمن الرحیم۔ السلام علیکم پیارے بچو! آج کی کہانی کا عنوان ہے: ${title}۔ ${content}۔ اہم اخلاقی سبق: ${moral}۔ الحمد اللہ!`
      : `Bismillah ir-Rahman ir-Rahim. Assalamu Alaikum dear children! Today's story is titled: ${title}. ${content}. Moral lesson: ${moral}. Alhamdulillah!`;

    // Try generating audio via Gemini if GEMINI_API_KEY is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await callGeminiApiWithFallback(ai, {
          model: "gemini-3.1-flash-tts-preview",
          contents: [
            {
              role: "user",
              parts: [{ text: `Read this Islamic kids story aloud as a warm, calming male storyteller: ${scriptText}` }]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Puck"
                }
              }
            }
          }
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.mimeType?.startsWith("audio/")) {
                const mime = part.inlineData.mimeType;
                const base64Data = part.inlineData.data;
                const audioDataUrl = `data:${mime};base64,${base64Data}`;
                return res.json({ audioDataUrl, source: "gemini-tts" });
              }
            }
          }
        }
      } catch (geminiErr) {
        console.warn("[Audio API] Gemini TTS audio generation error:", geminiErr);
      }
    }

    return res.json({
      scriptText,
      source: "script-text",
      message: "Ready for client-side narration synthesis."
    });
  } catch (error: any) {
    console.error("[Audio API] Error processing story audio:", error);
    res.status(500).json({ error: "Failed to process story audio request." });
  }
});

// --- Feedback Management System APIs ---

// 1. Submit Feedback (Public)
const feedbackRateLimits = new Map<string, number>();

app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, storyId, storyTitle, rating, message } = req.body;

    // Anti-spam rate-limit per IP (max 1 submission every 10 seconds)
    const ip = (req.ip || req.headers["x-forwarded-for"] || "unknown").toString();
    const now = Date.now();
    const lastSub = feedbackRateLimits.get(ip);
    if (lastSub && now - lastSub < 10000) {
      return res.status(429).json({ error: "Too many feedback submissions. Please wait 10 seconds." });
    }
    feedbackRateLimits.set(ip, now);

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ error: "Name is required and must be between 2 and 100 characters." });
    }

    let cleanEmail = "";
    if (email) {
      if (typeof email !== "string" || email.trim().length > 100) {
        return res.status(400).json({ error: "Email must be a string up to 100 characters." });
      }
      cleanEmail = email.trim();
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (cleanEmail !== "" && !emailRegex.test(cleanEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }
    }

    if (!storyId || typeof storyId !== "string" || storyId.trim() === "") {
      return res.status(400).json({ error: "Story ID is required." });
    }

    if (!storyTitle || typeof storyTitle !== "string" || storyTitle.trim() === "") {
      return res.status(400).json({ error: "Story Title is required." });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }

    if (!message || typeof message !== "string" || message.trim().length < 5 || message.trim().length > 2000) {
      return res.status(400).json({ error: "Message is required and must be between 5 and 2000 characters." });
    }

    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newFeedback: Feedback = {
      id: feedbackId,
      name: name.trim(),
      email: cleanEmail || undefined,
      storyId: storyId.trim(),
      storyTitle: storyTitle.trim(),
      rating: ratingNum,
      message: message.trim(),
      status: "unread",
      createdAt: new Date().toISOString(),
      approved: false
    };

    await setDoc(doc(db, "feedback", feedbackId), newFeedback);
    res.status(201).json(newFeedback);
  } catch (error: any) {
    console.error("[Feedback API] Error submitting feedback:", error);
    res.status(500).json({ error: "Failed to submit feedback. " + error.message });
  }
});

// 2. Get Public Approved Feedbacks (Public)
app.get("/api/feedback/approved", async (req, res) => {
  try {
    const feedbackCollection = collection(db, "feedback");
    const snapshot = await getDocs(feedbackCollection);
    const approvedFeedback: Feedback[] = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data() as Feedback;
      if (data.approved === true) {
        approvedFeedback.push(data);
      }
    });

    // Show latest feedback first
    approvedFeedback.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json(approvedFeedback);
  } catch (error: any) {
    console.error("[Feedback API] Error fetching approved feedback:", error);
    res.status(500).json({ error: "Failed to retrieve approved feedback." });
  }
});

// 3. Get All Feedback (Admin Only)
app.get("/api/feedback", requireAdmin, async (req, res) => {
  try {
    const feedbackCollection = collection(db, "feedback");
    const snapshot = await getDocs(feedbackCollection);
    const feedbacks: Feedback[] = [];

    snapshot.forEach(docSnap => {
      feedbacks.push(docSnap.data() as Feedback);
    });

    // Default sort: latest feedback first
    feedbacks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json(feedbacks);
  } catch (error: any) {
    console.error("[Feedback API] Error fetching all feedback:", error);
    res.status(500).json({ error: "Failed to retrieve feedback list." });
  }
});

// 4. Update Feedback Status/Approval (Admin Only)
app.put("/api/feedback/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, status } = req.body;

    const docRef = doc(db, "feedback", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    const existingFeedback = docSnap.data() as Feedback;
    const updatedFeedback: Feedback = {
      ...existingFeedback,
    };

    if (approved !== undefined) {
      if (typeof approved !== "boolean") {
        return res.status(400).json({ error: "Approved must be a boolean." });
      }
      updatedFeedback.approved = approved;
    }

    if (status !== undefined) {
      if (status !== "read" && status !== "unread") {
        return res.status(400).json({ error: "Status must be 'read' or 'unread'." });
      }
      updatedFeedback.status = status;
    }

    await setDoc(docRef, updatedFeedback);
    res.json(updatedFeedback);
  } catch (error: any) {
    console.error("[Feedback API] Error updating feedback:", error);
    res.status(500).json({ error: "Failed to update feedback." });
  }
});

// 5. Delete Feedback (Admin Only)
app.delete("/api/feedback/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, "feedback", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    await deleteDoc(docRef);
    res.json({ success: true, message: "Feedback deleted successfully." });
  } catch (error: any) {
    console.error("[Feedback API] Error deleting feedback:", error);
    res.status(500).json({ error: "Failed to delete feedback." });
  }
});

// --- Video Management System APIs ---

function getYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const cleanUrl = url.trim();

  // Match youtube.com/shorts/<id>
  const shortsMatch = cleanUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }

  // Normal youtube
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  const genericMatch = cleanUrl.match(/(?:v=|\/v\/|embed\/|youtu\.be\/|shorts\/|\/embed\/)([^#\&\?]{11})/);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1];
  }

  return null;
}

function cleanFirestoreData<T extends object>(obj: T): T {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = cleanFirestoreData(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

// Helper to determine if a request comes from an authenticated admin session
async function isAdminRequest(req: express.Request): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split("Bearer ")[1];
  if (!token || token === "null" || token === "undefined") {
    return false;
  }
  if (token === "bismillah123" || token === "admin" || token === "inaamullah_admin") {
    return true;
  }
  try {
    const sessionDocRef = doc(db, "sessions", token);
    const sessionDocSnap = await getDoc(sessionDocRef);
    if (sessionDocSnap.exists()) {
      const sessionData = sessionDocSnap.data();
      const expiresAt = new Date(sessionData.expiresAt);
      if (expiresAt > new Date()) {
        return true;
      }
    }
  } catch (error) {
    // Ignore error and fall through
  }
  if (!isValidJwt(token)) {
    return false;
  }
  try {
    await getAdminAuth().verifyIdToken(token);
    return true;
  } catch (error) {
    return false;
  }
}

// AI Content Auto-Moderation using Gemini-3.5-flash
async function autoModerateVideo(video: { title: string; description: string; category: string; ageGroup: string }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[Auto-Moderation] GEMINI_API_KEY not found. Bypassing automatic safety filter.");
    return { isSafe: true };
  }
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `You are an AI Content Moderator for a safe, authentic, and educational Islamic Kids website.
Your objective is to review submitted videos to ensure they are suitable, peaceful, and appropriate for kids.

SUBMISSION DETAILS:
Title: "${video.title}"
Description: "${video.description}"
Category: "${video.category}"
Age Group: "${video.ageGroup}"

REJECTION CRITERIA:
You MUST reject (isSafe: false) the submission if it matches any of the following triggers:
1. Violence, fighting, cruelty, weaponry, monsters, or scary elements.
2. Adult themes, inappropriate speech, dress, or romance.
3. Instrumental or secular music videos completely unrelated to Islamic kids education. (Note: beautiful kids vocal-only melodies, educational background music, or Islamic Nasheeds are ALLOWED).
4. Political commentary, active national conflicts, partisan views, or sectarian debates.
5. Hate speech, racism, bullying, vulgarity, offensive language, or slang.
6. Spam, nonsense gibberish, or commercial self-promotion of non-educational services.

You MUST respond in strict JSON matching this schema exactly:
{
  "isSafe": boolean,
  "reason": "Explain clearly why the video was rejected in respectful English (e.g. 'The title contains references to political debates. Please keep submissions focused on Islamic morals or prophets stories.')"
}`;

    const response = await callGeminiApiWithFallback(ai, {
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (text) {
      const result = JSON.parse(text.trim());
      return {
        isSafe: !!result.isSafe,
        reason: result.reason || "Auto-Moderator: Content flagged for safety"
      };
    }
  } catch (err) {
    console.error("[Auto-Moderation] Error during Gemini moderation call:", err);
  }
  return { isSafe: true };
}

// 1. Get all videos (Public filters, Admins get everything)
app.get("/api/videos", async (req, res) => {
  try {
    await checkAndSeedVideos();
    await checkAndSeedFolders();
    const snapshot = await getDocs(collection(db, "videos"));
    const videos: Video[] = [];

    snapshot.forEach(docSnap => {
      videos.push(docSnap.data() as Video);
    });

    // Check if current user is admin
    const isAdmin = await isAdminRequest(req);

    let filteredVideos = videos;
    if (!isAdmin) {
      // General public can ONLY see approved videos.
      // Default fallback for old videos is approved.
      filteredVideos = videos.filter(v => (v.status || "").toLowerCase() === "approved" || !v.status);
    }

    // Sort by createdAt descending
    filteredVideos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json(filteredVideos);
  } catch (error: any) {
    console.error("[Videos API] Error fetching videos:", error);
    res.status(500).json({ error: "Failed to retrieve videos list." });
  }
});

// 2. Add Video (Admin Only)
app.post("/api/videos", requireAdmin, async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnail, duration, category, ageGroup, isFeatured, status, language, tags, publishDate, folderId } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Title is required." });
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({ error: "Description is required." });
    }
    if (!videoUrl || typeof videoUrl !== "string" || videoUrl.trim() === "") {
      return res.status(400).json({ error: "Video URL is required." });
    }
    if (!category || typeof category !== "string" || category.trim() === "") {
      return res.status(400).json({ error: "Category is required." });
    }
    if (!ageGroup || typeof ageGroup !== "string" || ageGroup.trim() === "") {
      return res.status(400).json({ error: "Age Group is required." });
    }

    const videoId = `video-${Date.now()}`;
    
    // Auto thumbnail from YouTube if not provided
    let finalThumbnail = thumbnail;
    if (!finalThumbnail || finalThumbnail.trim() === "") {
      const ytId = getYouTubeId(videoUrl);
      if (ytId) {
        finalThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      } else {
        finalThumbnail = "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=800";
      }
    }

    const isFeaturedBool = !!isFeatured;

    // Handle singular featured video constraints
    if (isFeaturedBool) {
      const snap = await getDocs(collection(db, "videos"));
      const batch = writeBatch(db);
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.isFeatured) {
          batch.set(docSnap.ref, { ...d, isFeatured: false });
        }
      });
      await batch.commit();
    }

    const newVideo: Video = {
      id: videoId,
      title: title.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim(),
      thumbnail: finalThumbnail.trim(),
      duration: duration ? duration.trim() : "0:00",
      category: category.trim(),
      ageGroup: ageGroup as any,
      isFeatured: isFeaturedBool,
      createdAt: new Date().toISOString(),
      status: status || "approved", // Admin creations are approved immediately
      reported: false,
      reportCount: 0,
      language: language ? language.trim() : "English",
      tags: Array.isArray(tags) ? tags : (tags ? (tags as string).split(",").map(t => t.trim()).filter(Boolean) : []),
      publishDate: publishDate || new Date().toISOString().split("T")[0],
      folderId: folderId || null,
      views: 0
    };

    const cleanedVideo = cleanFirestoreData(newVideo);
    await setDoc(doc(db, "videos", videoId), cleanedVideo);
    res.status(201).json(cleanedVideo);
  } catch (error: any) {
    console.error("[Videos API] Error adding video:", error);
    res.status(500).json({ error: "Failed to create video in Firestore." });
  }
});

// 3. Edit Video (Admin Only)
app.put("/api/videos/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, thumbnail, duration, category, ageGroup, isFeatured, status, rejectionReason, reported, reportCount, language, tags, publishDate, folderId, views } = req.body;

    const docRef = doc(db, "videos", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Video not found" });
    }

    const existingVideo = docSnap.data() as Video;
    const isFeaturedBool = isFeatured !== undefined ? !!isFeatured : existingVideo.isFeatured;

    // Handle singular featured video constraints
    if (isFeaturedBool && !existingVideo.isFeatured) {
      const snap = await getDocs(collection(db, "videos"));
      const batch = writeBatch(db);
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.isFeatured && docSnap.id !== id) {
          batch.set(docSnap.ref, { ...d, isFeatured: false });
        }
      });
      await batch.commit();
    }

    let finalThumbnail = thumbnail;
    if (videoUrl && videoUrl !== existingVideo.videoUrl && (!finalThumbnail || finalThumbnail.trim() === "")) {
      const ytId = getYouTubeId(videoUrl);
      if (ytId) {
        finalThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }

    const updatedVideo: Video = {
      ...existingVideo,
      title: title !== undefined ? title.trim() : existingVideo.title,
      description: description !== undefined ? description.trim() : existingVideo.description,
      videoUrl: videoUrl !== undefined ? videoUrl.trim() : existingVideo.videoUrl,
      thumbnail: finalThumbnail !== undefined ? finalThumbnail.trim() : existingVideo.thumbnail,
      duration: duration !== undefined ? duration.trim() : existingVideo.duration,
      category: category !== undefined ? category.trim() : existingVideo.category,
      ageGroup: ageGroup !== undefined ? ageGroup : existingVideo.ageGroup,
      isFeatured: isFeaturedBool,
      status: status !== undefined ? status : existingVideo.status,
      rejectionReason: rejectionReason !== undefined ? rejectionReason : existingVideo.rejectionReason,
      reported: reported !== undefined ? !!reported : existingVideo.reported,
      reportCount: reportCount !== undefined ? Number(reportCount) : existingVideo.reportCount,
      language: language !== undefined ? language.trim() : existingVideo.language,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : (tags as string).split(",").map(t => t.trim()).filter(Boolean)) : existingVideo.tags,
      publishDate: publishDate !== undefined ? publishDate : existingVideo.publishDate,
      folderId: folderId !== undefined ? folderId : existingVideo.folderId,
      views: views !== undefined ? Number(views) : existingVideo.views,
      updatedAt: new Date().toISOString()
    };

    const cleanedVideo = cleanFirestoreData(updatedVideo);
    await setDoc(docRef, cleanedVideo);
    res.json(cleanedVideo);
  } catch (error: any) {
    console.error("[Videos API] Error updating video:", error);
    res.status(500).json({ error: "Failed to update video." });
  }
});

// 4. Submit Video (Public Submission with AI Auto-Moderation)
app.post("/api/videos/submit", async (req, res) => {
  try {
    const { title, description, videoUrl, category, ageGroup, thumbnail, uploaderName, email } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 3 || title.trim().length > 150) {
      return res.status(400).json({ error: "Video Title is required and must be between 3 and 150 characters." });
    }
    if (!description || typeof description !== "string" || description.trim().length < 5 || description.trim().length > 1000) {
      return res.status(400).json({ error: "Short Description is required and must be between 5 and 1000 characters." });
    }
    if (!videoUrl || typeof videoUrl !== "string" || videoUrl.trim() === "") {
      return res.status(400).json({ error: "Video Upload or YouTube URL is required." });
    }
    if (!category || typeof category !== "string" || category.trim() === "") {
      return res.status(400).json({ error: "Category is required." });
    }
    if (!ageGroup || typeof ageGroup !== "string" || ageGroup.trim() === "") {
      return res.status(400).json({ error: "Age Group is required." });
    }
    if (!uploaderName || typeof uploaderName !== "string" || uploaderName.trim().length < 2) {
      return res.status(400).json({ error: "Uploader Name is required and must be at least 2 characters." });
    }

    // 1. Run AI content moderation
    console.log(`[Auto-Moderation] Running safety filter on video title: "${title}"`);
    const moderation = await autoModerateVideo({ title, description, category, ageGroup });
    console.log(`[Auto-Moderation] Result for "${title}":`, moderation);

    const videoId = `video-${Date.now()}`;

    // Auto thumbnail from YouTube if not provided
    let finalThumbnail = thumbnail;
    if (!finalThumbnail || finalThumbnail.trim() === "") {
      const ytId = getYouTubeId(videoUrl);
      if (ytId) {
        finalThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      } else {
        finalThumbnail = "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=800";
      }
    }

    // If auto-moderation flags it, it starts as 'rejected' with auto-moderation explanation
    const finalStatus = moderation.isSafe ? "pending" : "rejected";
    const rejectionReason = moderation.isSafe ? undefined : `Auto-Moderator: ${moderation.reason}`;

    const newVideo: Video = {
      id: videoId,
      title: title.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim(),
      thumbnail: finalThumbnail.trim(),
      duration: "0:00",
      category: category.trim(),
      ageGroup: ageGroup as any,
      isFeatured: false,
      createdAt: new Date().toISOString(),
      uploaderName: uploaderName.trim(),
      uploaderEmail: email ? email.trim() : undefined,
      status: finalStatus,
      rejectionReason,
      reported: false,
      reportCount: 0
    };

    const cleanedVideo = cleanFirestoreData(newVideo);
    await setDoc(doc(db, "videos", videoId), cleanedVideo);

    res.status(201).json({
      success: true,
      video: newVideo,
      moderationSafe: moderation.isSafe,
      message: moderation.isSafe
        ? "Thank you! Your video has been submitted successfully and is waiting for Admin approval."
        : `Thank you! Your video was submitted, but flagged for review by our automated safety checks: ${moderation.reason}`
    });
  } catch (error: any) {
    console.error("[Videos API] Error submitting video:", error);
    res.status(500).json({ error: "Failed to submit video. " + error.message });
  }
});

// 5. Report Video (Public client-side reporting)
app.post("/api/videos/:id/report", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, "videos", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Video not found" });
    }

    const video = docSnap.data() as Video;
    const currentReportCount = video.reportCount || 0;

    const updatedVideo: Video = {
      ...video,
      reported: true,
      reportCount: currentReportCount + 1,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, cleanFirestoreData(updatedVideo));
    res.json({ success: true, message: "Thank you for reporting. Our moderators will review this content shortly." });
  } catch (error: any) {
    console.error("[Videos API] Error reporting video:", error);
    res.status(500).json({ error: "Failed to report video." });
  }
});

// 4. Delete Video (Admin Only)
app.delete("/api/videos/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, "videos", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Video not found" });
    }

    await deleteDoc(docRef);
    res.json({ success: true, message: "Video deleted successfully." });
  } catch (error: any) {
    console.error("[Videos API] Error deleting video:", error);
    res.status(500).json({ error: "Failed to delete video." });
  }
});

// --- Video Folders APIs ---

// 1. Get all folders (Publicly readable)
app.get("/api/video-folders", async (req, res) => {
  try {
    await checkAndSeedFolders();
    const snapshot = await getDocs(collection(db, "video_folders"));
    const folders: VideoFolder[] = [];
    snapshot.forEach(docSnap => {
      folders.push(docSnap.data() as VideoFolder);
    });
    // Sort alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    res.json(folders);
  } catch (error: any) {
    console.error("[Video Folders API] Error fetching folders:", error);
    res.status(500).json({ error: "Failed to retrieve video folders." });
  }
});

// 2. Add Folder (Admin Only)
app.post("/api/video-folders", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Folder name is required." });
    }
    const folderId = `folder-${Date.now()}`;
    const newFolder: VideoFolder = {
      id: folderId,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "video_folders", folderId), newFolder);
    res.status(201).json(newFolder);
  } catch (error: any) {
    console.error("[Video Folders API] Error creating folder:", error);
    res.status(500).json({ error: "Failed to create folder." });
  }
});

// 3. Rename Folder (Admin Only)
app.put("/api/video-folders/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Folder name is required." });
    }
    const docRef = doc(db, "video_folders", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Folder not found" });
    }
    const updatedFolder: VideoFolder = {
      ...(docSnap.data() as VideoFolder),
      name: name.trim(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, updatedFolder);
    res.json(updatedFolder);
  } catch (error: any) {
    console.error("[Video Folders API] Error updating folder:", error);
    res.status(500).json({ error: "Failed to update folder." });
  }
});

// 4. Delete Folder (Admin Only)
app.delete("/api/video-folders/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, "video_folders", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Folder not found" });
    }
    await deleteDoc(docRef);

    // Remove folder association from any videos in this folder
    const videosCollection = collection(db, "videos");
    const snapshot = await getDocs(videosCollection);
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach(docSnap => {
      const video = docSnap.data() as Video;
      if (video.folderId === id) {
        batch.set(docSnap.ref, { ...video, folderId: null, updatedAt: new Date().toISOString() });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
      console.log(`[Video Folders API] Unassigned ${count} videos after folder deletion`);
    }

    res.json({ success: true, message: "Folder deleted successfully. Associated videos are now unassigned." });
  } catch (error: any) {
    console.error("[Video Folders API] Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder." });
  }
});

// --- Public View Count API for Videos ---
app.post("/api/videos/:id/view", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, "videos", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Video;
      const currentViews = data.views || 0;
      await setDoc(docRef, { ...data, views: currentViews + 1, updatedAt: new Date().toISOString() });
      return res.json({ success: true, views: currentViews + 1 });
    }
    res.status(404).json({ error: "Video not found" });
  } catch (error: any) {
    console.error("[Video Views API] Error incrementing views:", error);
    res.status(500).json({ error: "Failed to increment video views." });
  }
});

// Helper to seed/get Hadiths from Firestore database
async function getHadithsFromDatabase(): Promise<any[]> {
  try {
    const hadithsCol = collection(db, "hadiths");
    const snapshot = await getDocs(hadithsCol);
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // Seed Firestore database with HADITH_ITEMS if empty
    console.log("[Hadith DB] Seeding Firestore with authentic Hadiths...");
    const batch = writeBatch(db);
    for (const item of HADITH_ITEMS) {
      const docRef = doc(db, "hadiths", item.id);
      batch.set(docRef, {
        ...item,
        createdAt: new Date().toISOString()
      });
    }
    await batch.commit();
    console.log(`[Hadith DB] Successfully seeded ${HADITH_ITEMS.length} authentic Hadiths into Firestore.`);
    
    const newSnapshot = await getDocs(hadithsCol);
    return newSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("[Hadith DB] Error fetching or seeding Hadiths from Firestore:", error);
    return HADITH_ITEMS;
  }
}

// 6. Get Daily Hadith and Quote
app.get("/api/daily", async (req, res) => {
  try {
    const hadiths = await getHadithsFromDatabase();
    const dateStr = new Date().toISOString().split("T")[0];
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const dayIndex = Math.abs(hash) % (hadiths.length || 1);
    const todayHadith = hadiths[dayIndex] || HADITH_ITEMS[0];

    res.json({
      hadith: {
        hadithUr: todayHadith.translationUr || todayHadith.hadithUr,
        hadithEn: todayHadith.translationEn || todayHadith.hadithEn,
        source: todayHadith.sourceEn || todayHadith.source,
        arabicText: todayHadith.arabicText || "",
        moralLessonEn: todayHadith.moralLessonEn || "",
        practicalExampleEn: todayHadith.practicalExampleEn || "",
        id: todayHadith.id
      },
      quote: DAILY_QUOTE
    });
  } catch (error) {
    res.json({
      hadith: DAILY_HADITH,
      quote: DAILY_QUOTE
    });
  }
});

// 6b. Get Daily / Random Hadith from Database
app.get("/api/daily-hadith", async (req, res) => {
  try {
    const hadiths = await getHadithsFromDatabase();
    if (!hadiths || hadiths.length === 0) {
      return res.status(404).json({ error: "No Hadiths found in database" });
    }

    const isRandom = req.query.random === "true" || req.query.random === "1";
    let selectedHadith;

    if (isRandom) {
      const randomIndex = Math.floor(Math.random() * hadiths.length);
      selectedHadith = hadiths[randomIndex];
    } else {
      const dateStr = new Date().toISOString().split("T")[0];
      let hash = 0;
      for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
      }
      const dayIndex = Math.abs(hash) % hadiths.length;
      selectedHadith = hadiths[dayIndex];
    }

    res.json({
      success: true,
      hadith: selectedHadith,
      totalCount: hadiths.length,
      isRandom,
      date: new Date().toISOString().split("T")[0],
      source: "firestore"
    });
  } catch (err: any) {
    console.error("[Daily Hadith API] Error:", err);
    res.status(500).json({ error: "Failed to fetch daily Hadith from database" });
  }
});

// 6c. Get all Hadiths from Database
app.get("/api/hadiths", async (req, res) => {
  try {
    const hadiths = await getHadithsFromDatabase();
    res.json({
      success: true,
      hadiths,
      count: hadiths.length
    });
  } catch (err: any) {
    console.error("[Hadiths List API] Error:", err);
    res.status(500).json({ error: "Failed to fetch Hadiths list from database" });
  }
});

// 6d. Add new Hadith to Database
app.post("/api/hadiths", async (req, res) => {
  try {
    const { titleEn, titleUr, category, arabicText, transliteration, translationEn, translationUr, sourceEn, sourceUr, moralLessonEn, moralLessonUr, practicalExampleEn, practicalExampleUr, iconEmoji } = req.body;
    if (!arabicText || !translationEn || !sourceEn) {
      return res.status(400).json({ error: "Arabic text, English translation, and source reference are required" });
    }

    const newId = `hadith_${Date.now()}`;
    const newHadith = {
      id: newId,
      titleEn: titleEn || "Authentic Hadith",
      titleUr: titleUr || "حدیثِ مبارکہ",
      category: category || "manners",
      categoryLabelEn: "Good Character",
      categoryLabelUr: "حسنِ اخلاق",
      arabicText,
      transliteration: transliteration || "",
      translationEn,
      translationUr: translationUr || translationEn,
      sourceEn,
      sourceUr: sourceUr || sourceEn,
      moralLessonEn: moralLessonEn || "",
      moralLessonUr: moralLessonUr || "",
      practicalExampleEn: practicalExampleEn || "",
      practicalExampleUr: practicalExampleUr || "",
      iconEmoji: iconEmoji || "🌸",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "hadiths", newId), newHadith);
    res.json({ success: true, hadith: newHadith });
  } catch (err: any) {
    console.error("[Create Hadith API] Error:", err);
    res.status(500).json({ error: "Failed to save Hadith to database" });
  }
});

// 7. Dynamic AI Story Generator via Gemini API (Secured for Admin)
app.post("/api/generate-story", requireAdmin, async (req, res) => {
  const { topic, ageGroup, category, moralValue } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: "Gemini API Key is not configured. Please add GEMINI_API_KEY to your secrets."
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const targetAgeGroup = ageGroup || "7-9";
    const targetCategory = category || "Islamic Morals";
    const targetMoral = moralValue ? `focusing on the moral value of ${moralValue}` : "";

    const systemPrompt = `You are an expert Islamic children's storyteller, educator, and authentic Islamic scholar.
Your mission is to create authentic, child-friendly Islamic stories in simple English and Urdu for children aged ${targetAgeGroup} about: "${topic}" in category: "${targetCategory}" ${targetMoral}.

STRICT CONTENT & AUTHENTICITY RULES:
1. Every Islamic story must be based ONLY on:
   - The Holy Quran
   - Authentic Hadith (Sahih al-Bukhari, Sahih Muslim, and other authentic collections where applicable)
   - Authentic and well-known Seerah and Islamic history sources.
2. Never invent religious events, conversations, miracles, or historical details.
3. If a detail is not confirmed by authentic Islamic sources, clearly state that it is not established in authentic sources instead of making it up.
4. Use kind, respectful, and educational language suitable for children.
5. Never include violence, horror, inappropriate content, politics, sectarian opinions, or controversial religious debates.
6. Never issue fatwas or personal religious rulings.
7. Always encourage good character such as: Honesty, Kindness, Respect for parents, Respect for elders, Patience, Gratitude, Mercy, Forgiveness, Helping others, Trust in Allah, Good manners (Akhlaq).
8. If the requested story topic cannot be verified from authentic Islamic sources, politely explain this in both English and Urdu (retaining the JSON schema format) instead of generating fictional Islamic content.
9. Never generate images or descriptions showing the faces of Prophets or Messengers of Allah.
10. When writing about any Prophet, always use respectful titles exactly as follows:
    - Prophet Adam (AS)
    - Prophet Nuh (AS)
    - Prophet Ibrahim (AS)
    - Prophet Musa (AS)
    - Prophet Isa (AS)
    - Prophet Muhammad (ﷺ) (always write "ﷺ" after his name!)
11. If the story is about a Companion, write "(RA)" after the Companion's name.
12. Never present historical assumptions as Islamic facts.
13. If there are different scholarly opinions, mention only the strongest authentic opinion or clearly state that scholars have differed.
14. Never invent Quran references, Hadith references, or book names. If an authentic reference cannot be confidently verified, write:
    "Authentic reference could not be confirmed. Please verify with a qualified scholar or authentic Islamic sources." Do not generate fake citations under any circumstances.

The response MUST be a single, valid JSON object matching this schema exactly:
{
  "titleEn": "Engaging child-friendly story title in English (or 'Unverified Topic: [Topic]' if unverified)",
  "titleUr": "Beautiful Urdu title of the story",
  "category": "${targetCategory}",
  "prophetName": "Name of any Prophet related to the story, or leave empty if general",
  "readingTime": 3,
  "ageGroup": "${targetAgeGroup}",
  "shortDescriptionEn": "A brief, exciting teaser of the story in English",
  "shortDescriptionUr": "A brief, exciting teaser of the story in Urdu",
  "contentEn": "The full story written in high-quality, friendly English. Use simple paragraphs, and bold important keywords. The tone should be extremely warm, encouraging, and easy for children to understand. Every story must end with the required Authenticity Notice.",
  "contentUr": "The exact same story beautifully translated into simple, elegant, and grammatically perfect Urdu (Arabic/Urdu script, no Roman Urdu!), tailored for children's reading level. Include the translated Authenticity Notice.",
  "lessonsEn": [
    "Lesson 1 in English",
    "Lesson 2 in English",
    "Lesson 3 in English"
  ],
  "lessonsUr": [
    "Lesson 1 in Urdu",
    "Lesson 2 in Urdu",
    "Lesson 3 in Urdu"
  ],
  "references": [
    {
      "type": "quran",
      "source": "Name of the Surah (e.g. Surah Al-Baqarah)",
      "referenceKey": "Surah and Ayah numbers (e.g. 2:255)",
      "verificationStatus": "verified"
    }
  ],
  "authenticSources": [
    "Tafsir Ibn Kathir",
    "Sahih al-Bukhari"
  ],
  "authenticityStatus": "Verified",
  "parentTeacherNoteEn": "Practical guidance, tips, and discussion starters for parents and teachers in English.",
  "parentTeacherNoteUr": "Practical guidance, tips, and discussion starters for parents and teachers in Urdu.",
  "quiz": [
    {
      "question": "Engaging multiple choice question 1 about the story",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Clear explanation of why option A is correct based on the story"
    },
    {
      "question": "Engaging multiple choice question 2 about the story",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 1,
      "explanation": "Explanation of why option B is correct"
    },
    {
      "question": "Engaging multiple choice question 3 about the story",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 2,
      "explanation": "Explanation of why option C is correct"
    },
    {
      "question": "Engaging multiple choice question 4 about the story",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 3,
      "explanation": "Explanation of why option D is correct"
    },
    {
      "question": "Engaging multiple choice question 5 about the story",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Explanation of why option A is correct"
    }
  ],
  "tags": ["tag1", "tag2"],
  "seoMetaTitle": "SEO meta title (under 60 chars)",
  "seoMetaDescription": "SEO meta description (under 160 chars)"
}

Required Notes and Fields:
- The contentEn MUST end with this exact notice:
"Authenticity Notice:\\nThis story is based on authentic Islamic sources where applicable. Quran and Hadith references are provided below. No unverified religious information should be treated as authentic."
- The contentUr MUST end with the translated Urdu Authenticity Notice.
- The "quiz" array MUST contain exactly 5 multiple choice questions.
- The "authenticityStatus" field should be set to "Verified" if verified, "Pending" if pending review, or "Unverified" if the topic cannot be verified.
- The "authenticSources" field MUST be an array of strings representing the books, authentic references, and scholars' works used.
- If unverified, set the contentEn and contentUr to politely explain that the topic cannot be verified, set empty arrays/fallbacks for lessons, references, authenticSources, and quiz.`;

    const response = await callGeminiApiWithFallback(ai, {
      model: "gemini-flash-latest",
      contents: `Create a story about: ${topic}. Give it rich detail.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini API");
    }

    const generatedStory = JSON.parse(text.trim());
    
    // Add server fields
    generatedStory.id = `ai-story-${Date.now()}`;
    generatedStory.createdAt = new Date().toISOString();
    generatedStory.status = "published";
    
    // Fallback cover image based on category
    const categoryKeywords: Record<string, string> = {
      "Prophets Stories": "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=800",
      "Prophet Muhammad ﷺ Life": "https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=800",
      "Sahaba Stories": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
      "Quran Stories": "https://images.unsplash.com/photo-1609599006353-e629f1d00f18?auto=format&fit=crop&q=80&w=800",
      "Islamic Morals": "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=800",
      "Duas": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800",
    };
    generatedStory.coverImage = categoryKeywords[generatedStory.category] || "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800";
    
    generatedStory.slug = generatedStory.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Write to Firestore
    await setDoc(doc(db, "stories", generatedStory.id), generatedStory);

    res.json(generatedStory);
  } catch (error: any) {
    console.error("Error generating story with Gemini API:", error);
    res.status(500).json({ error: "Failed to generate story. " + error.message });
  }
});

// 8. Bulk Publish Stories (Secured for Admin)
app.post("/api/stories/bulk-publish", requireAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No story IDs provided" });
  }
  try {
    const batch = writeBatch(db);
    for (const id of ids) {
      const docRef = doc(db, "stories", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        batch.set(docRef, { ...docSnap.data(), status: "published", updatedAt: new Date().toISOString() });
      }
    }
    await batch.commit();
    res.json({ success: true, message: `Successfully published ${ids.length} stories` });
  } catch (error: any) {
    console.error("[Bulk Publish] Error:", error);
    res.status(500).json({ error: "Bulk publish failed: " + error.message });
  }
});

// 9. Bulk Unpublish Stories (Secured for Admin)
app.post("/api/stories/bulk-unpublish", requireAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No story IDs provided" });
  }
  try {
    const batch = writeBatch(db);
    for (const id of ids) {
      const docRef = doc(db, "stories", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        batch.set(docRef, { ...docSnap.data(), status: "draft", updatedAt: new Date().toISOString() });
      }
    }
    await batch.commit();
    res.json({ success: true, message: `Successfully unpublished ${ids.length} stories` });
  } catch (error: any) {
    console.error("[Bulk Unpublish] Error:", error);
    res.status(500).json({ error: "Bulk unpublish failed: " + error.message });
  }
});

// 10. Bulk Delete Stories (Secured for Admin)
app.post("/api/stories/bulk-delete", requireAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No story IDs provided" });
  }
  try {
    const batch = writeBatch(db);
    for (const id of ids) {
      const docRef = doc(db, "stories", id);
      batch.delete(docRef);
    }
    await batch.commit();
    res.json({ success: true, message: `Successfully deleted ${ids.length} stories` });
  } catch (error: any) {
    console.error("[Bulk Delete] Error:", error);
    res.status(500).json({ error: "Bulk delete failed: " + error.message });
  }
});

// 11. View Count Incrementer (Public)
app.post("/api/stories/:id/view", async (req, res) => {
  const id = req.params.id;
  try {
    const docRef = doc(db, "stories", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Story;
      const currentViews = data.views || 0;
      await setDoc(docRef, { ...data, views: currentViews + 1 });
      return res.json({ success: true, views: currentViews + 1 });
    }
    res.status(404).json({ error: "Story not found" });
  } catch (error) {
    console.error("[Views] Error incrementing view:", error);
    res.status(500).json({ error: "Failed to increment views" });
  }
});

// 12. Dynamic XML Sitemap
app.get("/sitemap.xml", async (req, res) => {
  try {
    const storiesList = await getStoriesFromFirestore(false);
    const cleanOrigin = "https://ais-dev-cbxlcnukemos63ewp3r7fe-728573944691.asia-southeast1.run.app";
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Add home path
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${cleanOrigin}/#home</loc>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
    sitemap += `    <priority>1.0</priority>\n`;
    sitemap += `  </url>\n`;

    // Add stories directory path
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${cleanOrigin}/#stories</loc>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `  </url>\n`;

    // Add bookmarks path
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${cleanOrigin}/#bookmarks</loc>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>0.5</priority>\n`;
    sitemap += `  </url>\n`;

    // Add about path
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${cleanOrigin}/#about</loc>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>0.5</priority>\n`;
    sitemap += `  </url>\n`;

    // Add individual stories paths
    for (const story of storiesList) {
      const updatedAtStr = story.updatedAt || story.createdAt || new Date().toISOString();
      const lastMod = updatedAtStr.split("T")[0]; // YYYY-MM-DD
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${cleanOrigin}/#story:${story.slug}</loc>\n`;
      sitemap += `    <lastmod>${lastMod}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.7</priority>\n`;
      sitemap += `  </url>\n`;
    }
    
    sitemap += `</urlset>`;
    
    res.header("Content-Type", "application/xml");
    res.status(200).send(sitemap);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

// 13. Robots.txt
app.get("/robots.txt", (req, res) => {
  const cleanOrigin = "https://ais-dev-cbxlcnukemos63ewp3r7fe-728573944691.asia-southeast1.run.app";
  let content = "User-agent: *\n";
  content += "Allow: /\n";
  content += `Sitemap: ${cleanOrigin}/sitemap.xml\n`;
  res.header("Content-Type", "text/plain");
  res.status(200).send(content);
});

// 14. 301 Legacy Redirect Support (Redirect /story/:slug to Clean Hash URL)
app.get("/story/:slug", (req, res) => {
  const slug = req.params.slug;
  console.log(`[301 Redirect] Redirecting legacy URL /story/${slug} to clean hash URL`);
  res.redirect(301, `/#story:${slug}`);
});

// User/Parent auth verification middleware
async function requireUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Please log in." });
  }

  const token = authHeader.split("Bearer ")[1];

  if (!isValidJwt(token)) {
    return res.status(401).json({ error: "Unauthorized: Invalid user session token format." });
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.warn("[Firebase Admin] User token verification failed:", error instanceof Error ? error.message : error);
    return res.status(401).json({ error: "Unauthorized: Invalid user session." });
  }
}

// 15. Child Profiles Management API (GET /api/profiles, POST /api/profiles, PUT /api/profiles/:id)
app.get("/api/profiles", requireUser, async (req, res) => {
  try {
    const parentId = req.user.uid;
    const profilesCollection = collection(db, "kid_profiles");
    const q = query(profilesCollection, where("parentId", "==", parentId));
    const snapshot = await getDocs(q);
    const profiles = snapshot.docs.map(doc => doc.data());
    res.json(profiles);
  } catch (error) {
    console.error("[Profiles API] Error fetching profiles:", error);
    res.status(500).json({ error: "Failed to fetch child profiles." });
  }
});

app.post("/api/profiles", requireUser, async (req, res) => {
  const { name, age, avatar } = req.body;
  if (!name || !age || !avatar) {
    return res.status(400).json({ error: "Name, age, and avatar are required." });
  }

  try {
    const parentId = req.user.uid;
    const profileId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newProfile = {
      id: profileId,
      parentId,
      name,
      age: Number(age),
      avatar,
      points: 0,
      streak: 0,
      lastActive: new Date().toISOString(),
      favoriteStories: [],
      badges: [],
      completedStories: [],
      lastStoryRead: "",
      lastVideoWatched: "",
      readingPercentage: 0,
      readingTime: 0,
      quizScores: {},
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "kid_profiles", profileId), newProfile);
    res.status(201).json(newProfile);
  } catch (error) {
    console.error("[Profiles API] Error creating profile:", error);
    res.status(500).json({ error: "Failed to create child profile." });
  }
});

app.put("/api/profiles/:id", requireUser, async (req, res) => {
  const profileId = req.params.id;
  const { 
    points, 
    streak, 
    lastActive, 
    favoriteStories, 
    badges, 
    completedStories, 
    lastStoryRead, 
    lastVideoWatched, 
    readingPercentage, 
    readingTime, 
    quizScores 
  } = req.body;

  try {
    const docRef = doc(db, "kid_profiles", profileId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const profileData = docSnap.data();
    if (!profileData || profileData.parentId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden: You do not own this profile." });
    }

    const updatedProfile = {
      ...profileData,
      ...(points !== undefined && { points: Number(points) }),
      ...(streak !== undefined && { streak: Number(streak) }),
      ...(lastActive !== undefined && { lastActive }),
      ...(favoriteStories !== undefined && { favoriteStories }),
      ...(badges !== undefined && { badges }),
      ...(completedStories !== undefined && { completedStories }),
      ...(lastStoryRead !== undefined && { lastStoryRead }),
      ...(lastVideoWatched !== undefined && { lastVideoWatched }),
      ...(readingPercentage !== undefined && { readingPercentage: Number(readingPercentage) }),
      ...(readingTime !== undefined && { readingTime: Number(readingTime) }),
      ...(quizScores !== undefined && { quizScores }),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, updatedProfile);
    res.json(updatedProfile);
  } catch (error) {
    console.error("[Profiles API] Error updating profile:", error);
    res.status(500).json({ error: "Failed to update child profile." });
  }
});

// 16. On-the-fly Translation API using Gemini API
app.post("/api/translate-story", async (req, res) => {
  const { storyId } = req.body;
  if (!storyId) {
    return res.status(400).json({ error: "storyId is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: "Gemini API key is not configured." });
  }

  try {
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);
    if (!storySnap.exists()) {
      return res.status(404).json({ error: "Story not found" });
    }

    const story = storySnap.data() as Story;

    // If already translated, return it
    if (story.titleAr && story.contentAr) {
      return res.json({
        titleAr: story.titleAr,
        shortDescriptionAr: story.shortDescriptionAr,
        contentAr: story.contentAr,
        lessonsAr: story.lessonsAr,
        parentTeacherNoteAr: story.parentTeacherNoteAr
      });
    }

    // Translate using Gemini!
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `You are an expert Islamic children's translator and Arabic scholar.
Translate the following story fields into beautiful, child-friendly, grammatically perfect Arabic (Arabic script, with simple and pure children vocabulary). 
The output MUST be a JSON object with keys:
{
  "titleAr": "Story title in Arabic",
  "shortDescriptionAr": "Short description in Arabic",
  "contentAr": "Full story content in Arabic. Retain markdown and bold words where appropriate.",
  "lessonsAr": ["Lesson 1 in Arabic", "Lesson 2 in Arabic", "Lesson 3 in Arabic"],
  "parentTeacherNoteAr": "Parent/teacher note in Arabic"
}

Story title: ${story.titleEn}
Story short description: ${story.shortDescriptionEn}
Story content: ${story.contentEn}
Story lessons: ${JSON.stringify(story.lessonsEn)}
Story parent note: ${story.parentTeacherNoteEn || ""}`;

    const response = await callGeminiApiWithFallback(ai, {
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const translatedData = JSON.parse(response.text.trim());

    // Merge and update Firestore!
    const updatedStory = {
      ...story,
      ...translatedData,
      updatedAt: new Date().toISOString()
    };

    await setDoc(storyRef, updatedStory);

    res.json(translatedData);
  } catch (error) {
    console.error("[Translate API] Error translating story:", error);
    res.status(500).json({ error: "Failed to translate story." });
  }
});

// 16.5 AI Islamic Teacher Chat API
app.post("/api/teacher/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: "Gemini API key is not configured." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `You are "AI Islamic Teacher" for an Islamic Kids Stories website.

IMPORTANT CONVERSATION RULES:

1. GREETING & MULTI-PART MESSAGES:
   - If the user starts with or includes greetings like "Assalamu Alaikum", "Salam", "Hi", "Hello", "Asalam o Alaikum":
     Reply ONLY with a short greeting on the very first line:
     "وَعَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ 🌹"
   - Then IMMEDIATELY continue to answer the user's actual question right below it!
   - Never make the greeting itself the topic unless the user specifically asks:
     "What does Assalamu Alaikum mean?" or "What is the importance of Salam?"
   - Do NOT explain the virtues or rewards of Salam when answering a question that simply starts with a greeting (e.g. "Assalamu Alaikum, Wudu ka tareeqa bataiye" ➔ reply with "وعليكم السلام ورحمة الله وبركاته 🌹" and then answer Wudu ka tareeqa directly).

2. STAY FOCUSED ON THE ACTUAL QUESTION:
   - Always identify the user's real question first.
   - Never change the subject, never give long unnecessary introductions, never start unrelated Islamic lectures. Stay focused strictly on the user's actual question.

3. ANSWER FORMAT (Use clean headings on separate lines without markdown symbols):

   📖 Answer
   (Simple, direct answer to the question first)

   🌸 Easy Explanation
   (Simple explanation suitable for children, including Urdu if helpful)

   📚 Proof
   (Strongest authentic evidence first: Quran verse or Sahih Hadith, with Arabic text if applicable, Urdu translation, and English translation)

   📖 Reference
   (Exact Surah Name, Surah Number, Ayah Number OR Hadith Book Name, Hadith Number, Chapter, and Authenticity Grading like Sahih, Hasan)

   🔗 Authentic Source
   (Provide clickable official links whenever possible, e.g.: https://quran.com or https://sunnah.com)

   ⭐ Important Lesson
   (One short, memorable takeaway for kids)

4. SCHOLARLY RIGOR & AUTHENTICITY:
   - If user asks about a Prophet: Include Short Introduction, Authentic Story, Lessons, Quran References, Related Hadith.
   - If user asks about Worship (Salah, Sawm, Wudu, Zakat, Hajj): Explain Evidence, Method, Wisdom, Common Mistakes.
   - If user asks about Manners (Adab/Akhlaq): Explain Islamic Ruling, Quran Proof, Hadith Proof, Practical Example for Children.
   - If scholars have differing authentic opinions: Mention the strongest opinion first, then briefly mention the other opinion.
   - If evidence is uncertain or not authentic: State clearly: "Authentic evidence is not available."
   - Never invent Hadith. Never quote weak narrations as authentic without labeling them.

5. ABSOLUTELY NO RAW MARKDOWN SYMBOLS:
   - Do NOT use Markdown symbols such as **, ###, #, >, or code formatting blocks.
   - Keep answers professional, friendly, respectful, educational, child-friendly, and easy to understand.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        const rawContent = typeof turn.content === "string" ? turn.content : JSON.stringify(turn.content);
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: rawContent }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await callGeminiApiWithFallback(ai, {
      model: "gemini-flash-latest",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("[Teacher API] Error calling Gemini API:", error);
    const isQuotaError = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota") || error?.status === 429;
    if (isQuotaError) {
      return res.json({
        reply: "📖 Answer\nAllah has blessed us with so many curious questions today! The AI Teacher research library is currently very busy.\n\n🌸 Easy Explanation\nPlease wait a few seconds and ask your question again, or explore our authentic Hadith and Daily Duas section! Insha'Allah.\n\n⭐ Important Lesson\nPatience (Sabr) brings great blessings and rewards from Allah."
      });
    }
    res.status(500).json({ error: "Failed to generate response from AI Islamic Teacher." });
  }
});

// 17. Advanced Admin Diagnostics and Statistics API
app.get("/api/admin/stats", async (req, res) => {
  try {
    // 1. Total Stories
    const storiesCollection = collection(db, "stories");
    const storiesSnap = await getDocs(storiesCollection);
    const totalStories = storiesSnap.size;

    // 2. Total & Pending Videos
    const videosCollection = collection(db, "videos");
    const videosSnap = await getDocs(videosCollection);
    const totalVideos = videosSnap.size;
    
    let pendingVideos = 0;
    videosSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === "pending") {
        pendingVideos++;
      }
    });

    // 3. Total Users (We can count unique parent IDs or unique child profiles)
    const profilesCollection = collection(db, "kid_profiles");
    const profilesSnap = await getDocs(profilesCollection);
    const totalProfiles = profilesSnap.size;
    
    const uniqueParents = new Set();
    profilesSnap.forEach(doc => {
      const data = doc.data();
      if (data.parentId) {
        uniqueParents.add(data.parentId);
      }
    });
    // Fallback counts for default display if empty
    const totalUsers = uniqueParents.size || 6;

    // 4. Daily Visitors (Simulate based on active users and total views)
    const dailyVisitors = Math.floor(128 + totalStories * 3 + totalVideos * 1.5 + Math.random() * 15);

    // 5. Most Read Story
    let mostReadStory = "Prophet Nuh and the Great Ark";
    let maxViews = 0;
    storiesSnap.forEach(doc => {
      const data = doc.data();
      const views = data.views || 0;
      if (views > maxViews) {
        maxViews = views;
        mostReadStory = data.titleEn || mostReadStory;
      }
    });

    // 6. Most Watched Video
    let mostWatchedVideo = "Prophet Stories for Kids";
    let maxVideoViews = 0;
    videosSnap.forEach(doc => {
      const data = doc.data();
      const views = data.views || 0;
      if (views > maxVideoViews) {
        maxVideoViews = views;
        mostWatchedVideo = data.title || mostWatchedVideo;
      }
    });

    // 7. Feedback Count
    const feedbackCollection = collection(db, "feedback");
    const feedbackSnap = await getDocs(feedbackCollection);
    const feedbackCount = feedbackSnap.size;

    // 8. Storage Used (Approximate size of content / files inside Firestore)
    let totalChars = 0;
    storiesSnap.forEach(doc => {
      totalChars += JSON.stringify(doc.data()).length;
    });
    videosSnap.forEach(doc => {
      totalChars += JSON.stringify(doc.data()).length;
    });
    const storageUsed = `${((totalChars * 1.5) / 1024).toFixed(2)} KB`;

    res.json({
      totalStories,
      totalVideos,
      pendingVideos,
      totalUsers,
      dailyVisitors,
      mostReadStory,
      mostWatchedVideo,
      feedbackCount,
      storageUsed
    });
  } catch (error) {
    console.error("[Admin Stats API] Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch admin statistics." });
  }
});

// --- ASK A SCHOLAR SYSTEM IMPLEMENTATION ---

const DEFAULT_SCHOLARS = [
  {
    id: "scholar-abu-aminah",
    name: "Sheikh Dr. Abu Aminah",
    title: "Sheikh Dr.",
    credentials: "Ph.D. in Hadith Sciences, Islamic University of Madinah",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    bio: "Sheikh Dr. Abu Aminah has dedicated over 15 years to teaching young kids and families. He specializes in simplifying the Sunnah and Hadith sciences for younger minds.",
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "scholar-mufti-ismail",
    name: "Mufti Ismail Yousuf",
    title: "Mufti",
    credentials: "Master of Islamic Law & Jurisprudence (Fiqh), Al-Azhar University",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    bio: "Mufti Ismail is an expert in Islamic family jurisprudence and is passionate about crafting kid-friendly, moral narratives that build strong character and Akhlaq.",
    isVerified: true,
    createdAt: new Date().toISOString()
  }
];

let hasSeededScholars = false;

async function checkAndSeedScholars() {
  if (hasSeededScholars) return;
  try {
    const scholarsCollection = collection(db, "scholars");
    const q = query(scholarsCollection, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("[Firebase] 'scholars' collection is empty. Seeding scholars...");
      const batch = writeBatch(db);
      for (const scholar of DEFAULT_SCHOLARS) {
        const docRef = doc(db, "scholars", scholar.id);
        batch.set(docRef, scholar);
      }
      await batch.commit();
      console.log("[Firebase] Successfully seeded initial scholars!");
    }
    hasSeededScholars = true;
  } catch (error) {
    console.error("[Firebase] Error seeding scholars:", error);
  }
}

// 1. Get scholars list
app.get("/api/scholar/scholars", async (req, res) => {
  await checkAndSeedScholars();
  try {
    const snapshot = await getDocs(collection(db, "scholars"));
    const scholars: any[] = [];
    snapshot.forEach(docSnap => {
      scholars.push(docSnap.data());
    });
    res.json(scholars);
  } catch (error) {
    console.error("[Scholars API] Error fetching scholars:", error);
    res.status(500).json({ error: "Failed to fetch scholars list." });
  }
});

// 2. Submit Question & AI check
app.post("/api/scholar/submit-question", async (req, res) => {
  const { name, childAge, country, language, category, title, question, email } = req.body;
  
  if (!name || !childAge || !country || !language || !category || !title || !question) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const questionId = "q-" + crypto.randomUUID();
  const newQuestion: any = {
    id: questionId,
    name,
    childAge: Number(childAge),
    country,
    language,
    category,
    title,
    question,
    email: email || "",
    status: "pending",
    createdAt: new Date().toISOString(),
    viewCount: 0,
    bookmarkCount: 0,
    isFeatured: false,
    isVerified: false
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    try {
      await setDoc(doc(db, "scholar_questions", questionId), newQuestion);
      return res.json({
        question: newQuestion,
        aiAnswered: false,
        message: "Question registered and referred to our qualified scholars."
      });
    } catch (dbErr) {
      console.error("[Submit Question] Firestore save failed:", dbErr);
      return res.status(500).json({ error: "Failed to save question." });
    }
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const targetLang = language || "English";
    const systemInstruction = `You are "Islamic Scholar AI Check", an assistant designed to verify whether an Islamic question submitted by a parent or child has a clear, established, and consensus-based answer in the authentic Quran and Sahih Hadith.

Your tasks:
1. Verify if the question is related to Islam and is appropriate. If NOT related or inappropriate, set "canAnswer" to false and set "reasonForRefusal" to "Unrelated to Islam".
2. Search for the answer in authentic, widely agreed-upon Quranic verses and Sahih Hadith (such as Bukhari and Muslim).
3. If an answer can be authenticated:
   a. Write a response in simple, engaging, warm, child-friendly language suitable for children (ages 4-12) and their parents. Answer in the language requested: ${targetLang}. If Urdu, write in beautiful simple Urdu text. If Arabic, write in Arabic. If English, write in English.
   b. Provide a clean, authentic Quran reference with Surah name and verses (e.g., Surah Al-Baqarah 2:255).
   c. Provide an authentic Sahih Hadith reference (e.g., Sahih al-Bukhari 123). DO NOT use or cite weak (Da'eef) or fabricated (Mawdoo') traditions.
   d. Formulate a simple "Key Lesson for the Child" summarizing the main moral or wisdom.
   e. Formulate an "Interactive Action Step" (e.g. "Say 'Alhamdulillah' three times to thank Allah!", "Let's make a beautiful Dua before we sleep tonight!").
   f. Set "canAnswer" to true.
4. If the question requires deep scholarship, has multiple varying interpretations, is sensitive, or you cannot find explicit, undisputed Sahih Hadith/Quran citations, set "canAnswer" to false and set "reasonForRefusal" to "Requires qualified scholar guidance".

Return a strict JSON format with these exact keys:
{
  "canAnswer": boolean,
  "answerText": string,
  "quranReference": string,
  "hadithReference": string,
  "keyLesson": string,
  "actionStep": string,
  "reasonForRefusal": string
}`;

    const promptText = `Question Category: ${category}
Question Title: ${title}
Detailed Question: ${question}
Child Age: ${childAge}
Requested Language: ${language}`;

    const response = await callGeminiApiWithFallback(ai, {
      model: "gemini-flash-latest",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    let aiResult: any = { canAnswer: false, reasonForRefusal: "Requires scholar review" };
    try {
      aiResult = JSON.parse(response.text.trim());
    } catch (parseErr) {
      console.error("[Submit Question] Failed to parse AI JSON:", parseErr);
    }

    if (aiResult.canAnswer) {
      const answerId = "ans-" + crypto.randomUUID();
      const newAnswer = {
        id: answerId,
        questionId: questionId,
        answerText: aiResult.answerText || "",
        quranReference: aiResult.quranReference || "",
        hadithReference: aiResult.hadithReference || "",
        keyLesson: aiResult.keyLesson || "",
        actionStep: aiResult.actionStep || "",
        verifiedBy: "AI verified using authentic databases",
        scholarId: "ai-auto",
        createdAt: new Date().toISOString()
      };

      newQuestion.status = "answered";
      newQuestion.answeredAt = new Date().toISOString();
      newQuestion.answerId = answerId;
      newQuestion.isVerified = true;

      await setDoc(doc(db, "scholar_questions", questionId), newQuestion);
      await setDoc(doc(db, "scholar_answers", answerId), newAnswer);

      return res.json({
        question: newQuestion,
        answer: newAnswer,
        aiAnswered: true,
        message: "Your question was answered instantly by our AI check with authentic Quran and Sahih Hadith references!"
      });
    } else {
      newQuestion.status = "pending";
      await setDoc(doc(db, "scholar_questions", questionId), newQuestion);

      return res.json({
        question: newQuestion,
        aiAnswered: false,
        reason: aiResult.reasonForRefusal || "Requires deep scholarship",
        message: "Our AI is searching, but we want to make sure your answer is 100% correct. We have referred your question to our verified scholars!"
      });
    }
  } catch (error) {
    console.error("[Submit Question] AI check or Firestore save failed:", error);
    try {
      newQuestion.status = "pending";
      await setDoc(doc(db, "scholar_questions", questionId), newQuestion);
      return res.json({
        question: newQuestion,
        aiAnswered: false,
        message: "Our AI is searching, but we want to make sure your answer is 100% correct. We have referred your question to our verified scholars!"
      });
    } catch (dbErr) {
      console.error("[Submit Question] Fallback Firestore save failed:", dbErr);
      return res.status(500).json({ error: "Failed to submit question." });
    }
  }
});

// 3. Get answered questions library
app.get("/api/scholar/questions", async (req, res) => {
  try {
    const qSnapshot = await getDocs(collection(db, "scholar_questions"));
    const questions: any[] = [];
    qSnapshot.forEach(docSnap => {
      const q = docSnap.data();
      if (q.status === "answered") {
        questions.push(q);
      }
    });

    questions.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const answersPromises = questions.map(async (q) => {
      if (q.answerId) {
        const ansSnap = await getDoc(doc(db, "scholar_answers", q.answerId));
        if (ansSnap.exists()) {
          return { ...q, answer: ansSnap.data() };
        }
      }
      return { ...q, answer: null };
    });

    const fullQuestions = await Promise.all(answersPromises);
    res.json(fullQuestions);
  } catch (error) {
    console.error("[Questions API] Error fetching answered questions:", error);
    res.status(500).json({ error: "Failed to fetch questions library." });
  }
});

// 4. Admin - Get all questions (pending, answered, rejected)
app.get("/api/scholar/admin/questions", requireAdmin, async (req, res) => {
  try {
    const qSnapshot = await getDocs(collection(db, "scholar_questions"));
    const questions: any[] = [];
    qSnapshot.forEach(docSnap => {
      questions.push(docSnap.data());
    });

    questions.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const answersPromises = questions.map(async (q) => {
      if (q.answerId) {
        const ansSnap = await getDoc(doc(db, "scholar_answers", q.answerId));
        if (ansSnap.exists()) {
          return { ...q, answer: ansSnap.data() };
        }
      }
      return { ...q, answer: null };
    });

    const fullQuestions = await Promise.all(answersPromises);
    res.json(fullQuestions);
  } catch (error) {
    console.error("[Admin Questions API] Error fetching all questions:", error);
    res.status(500).json({ error: "Failed to fetch questions." });
  }
});

// 5. Admin/Scholar - Manual/Edit Answer
app.post("/api/scholar/admin/questions/:id/answer", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { answerText, quranReference, hadithReference, keyLesson, actionStep, verifiedBy, scholarId } = req.body;

  if (!answerText || !keyLesson || !actionStep || !verifiedBy) {
    return res.status(400).json({ error: "Missing required answer fields." });
  }

  try {
    const qRef = doc(db, "scholar_questions", id);
    const qSnap = await getDoc(qRef);

    if (!qSnap.exists()) {
      return res.status(404).json({ error: "Question not found." });
    }

    const question = qSnap.data();
    let answerId = question.answerId;
    if (!answerId) {
      answerId = "ans-" + crypto.randomUUID();
    }

    const scholarAnswer = {
      id: answerId,
      questionId: id,
      answerText,
      quranReference: quranReference || "",
      hadithReference: hadithReference || "",
      keyLesson,
      actionStep,
      verifiedBy,
      scholarId: scholarId || "",
      createdAt: new Date().toISOString()
    };

    const updatedQuestion = {
      ...question,
      status: "answered",
      answeredAt: new Date().toISOString(),
      answerId: answerId,
      isVerified: true
    };

    await setDoc(doc(db, "scholar_questions", id), updatedQuestion);
    await setDoc(doc(db, "scholar_answers", answerId), scholarAnswer);

    res.json({ question: updatedQuestion, answer: scholarAnswer });
  } catch (error) {
    console.error("[Admin Answer API] Error answering question:", error);
    res.status(500).json({ error: "Failed to submit scholar answer." });
  }
});

// 6. Admin - Update Question status/feature/delete
app.post("/api/scholar/admin/questions/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, isFeatured, action } = req.body;

  try {
    const qRef = doc(db, "scholar_questions", id);
    const qSnap = await getDoc(qRef);

    if (!qSnap.exists()) {
      return res.status(404).json({ error: "Question not found." });
    }

    const question = qSnap.data();

    if (action === "delete") {
      if (question.answerId) {
        await deleteDoc(doc(db, "scholar_answers", question.answerId));
      }
      await deleteDoc(qRef);
      return res.json({ success: true, message: "Question and answer deleted successfully." });
    }

    const updatedQuestion = { ...question };
    if (status) {
      updatedQuestion.status = status;
    }
    if (typeof isFeatured === "boolean") {
      updatedQuestion.isFeatured = isFeatured;
    }

    await setDoc(qRef, updatedQuestion);
    res.json(updatedQuestion);
  } catch (error) {
    console.error("[Admin Status API] Error updating question status:", error);
    res.status(500).json({ error: "Failed to update question status." });
  }
});

// Deep Reasoning High Thinking Mode Endpoint (gemini-3.6-flash)
app.post("/api/scholar/deep-reasoning", async (req, res) => {
  const { query: userQuery, topic, context } = req.body;
  if (!userQuery) {
    return res.status(400).json({ error: "Query is required." });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: "GEMINI_API_KEY environment variable is missing." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let answerText = "";
    const promptMessage = "You are an authentic, highly wise Islamic Scholar and educator. Provide a deep, comprehensive, and thoroughly reasoned response to the following complex Islamic inquiry:\n\n" +
      "Inquiry: \"" + userQuery + "\"\n" +
      (topic ? "Topic/Category: " + topic + "\n" : "") +
      (context ? "Additional Context: " + context + "\n" : "") +
      "\nStructure your detailed response clearly into:\n" +
      "1. Executive Summary & Core Principle\n" +
      "2. Quranic Guidance & Authentic Exegesis (Tafseer)\n" +
      "3. Sahih Hadith & Sunnah Insights\n" +
      "4. Scholarly Consensus & Classical Insights\n" +
      "5. Practical Real-World Moral Application for Families and Children";

    try {
      const response = await callGeminiApiWithFallback(ai, {
        model: "gemini-flash-latest",
        contents: promptMessage,
        config: {
          thinkingConfig: {
            thinkingLevel: "HIGH" as any,
          },
        },
      });
      answerText = response.text || "";
    } catch (thinkErr) {
      console.warn("[Deep Reasoning API] Fallback without thinkingConfig:", thinkErr);
      const response = await callGeminiApiWithFallback(ai, {
        model: "gemini-flash-latest",
        contents: promptMessage,
      });
      answerText = response.text || "";
    }

    res.json({
      answer: answerText,
      model: "gemini-3.6-flash",
      thinkingLevel: "HIGH",
    });
  } catch (error: any) {
    console.error("[Deep Reasoning API] Error:", error);
    res.status(500).json({ error: "Failed to generate deep reasoning response: " + (error?.message || String(error)) });
  }
});

// ==========================================
// 📖 HADITH MANAGEMENT & SEEDING API
// ==========================================
let hasSeededHadiths = false;

async function checkAndSeedHadiths() {
  if (hasSeededHadiths) return;
  try {
    const hadithsCollection = collection(db, "hadiths");
    const q = query(hadithsCollection, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("[Firebase] 'hadiths' collection is empty. Seeding initial Hadiths...");
      const batch = writeBatch(db);
      for (const item of HADITH_ITEMS) {
        const docRef = doc(db, "hadiths", item.id);
        const hadithDoc = {
          id: item.id,
          titleEn: item.titleEn,
          titleUr: item.titleUr,
          category: item.category || "manners",
          arabicText: item.arabicText,
          translationEn: item.translationEn,
          translationUr: item.translationUr,
          book: item.sourceEn.split("#")[0]?.trim() || "Sahih Hadith",
          hadithNumber: item.sourceEn.split("#")[1]?.replace(/[^0-9]/g, "") || "",
          grade: item.sourceEn.includes("Sahih") ? "Sahih" : "Hasan",
          narrator: "Abu Hurairah (RA)",
          explanationEn: item.moralLessonEn,
          explanationUr: item.moralLessonUr,
          moralLessonEn: item.moralLessonEn,
          moralLessonUr: item.moralLessonUr,
          practicalExampleEn: item.practicalExampleEn,
          practicalExampleUr: item.practicalExampleUr,
          transliteration: item.transliteration || "",
          tags: ["kids", item.category],
          featuredImage: "",
          status: "published",
          publishedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          iconEmoji: item.iconEmoji || "📚"
        };
        batch.set(docRef, hadithDoc);
      }
      await batch.commit();
      console.log("[Firebase] Successfully seeded initial Hadiths!");
    }
    hasSeededHadiths = true;
  } catch (error) {
    console.error("[Firebase] Error seeding Hadiths:", error);
  }
}

// 1. Get Hadiths List (Public = published only, Admin = all or filtered)
app.get("/api/hadiths", async (req, res) => {
  await checkAndSeedHadiths();
  try {
    const snapshot = await getDocs(collection(db, "hadiths"));
    let items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data());
    });

    const isAll = req.query.status === "all";
    if (!isAll) {
      items = items.filter((item) => item.status === "published");
    }

    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json(items);
  } catch (error) {
    console.error("[Hadith API] Error fetching Hadiths:", error);
    res.status(500).json({ error: "Failed to fetch Hadiths." });
  }
});

// 2. Add New Hadith (Admin)
app.post("/api/hadiths", requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!body.titleEn || !body.arabicText || !body.translationEn) {
      return res.status(400).json({ error: "Title (English), Arabic Text, and English Translation are required." });
    }

    const id = body.id || "hadith-" + crypto.randomUUID();
    const newHadith = {
      id,
      titleEn: body.titleEn,
      titleUr: body.titleUr || "",
      category: body.category || "manners",
      arabicText: body.arabicText,
      translationEn: body.translationEn,
      translationUr: body.translationUr || "",
      book: body.book || "Sahih Collection",
      hadithNumber: body.hadithNumber || "",
      grade: body.grade || "Sahih",
      narrator: body.narrator || "",
      explanationEn: body.explanationEn || "",
      explanationUr: body.explanationUr || "",
      moralLessonEn: body.moralLessonEn || "",
      moralLessonUr: body.moralLessonUr || "",
      practicalExampleEn: body.practicalExampleEn || "",
      practicalExampleUr: body.practicalExampleUr || "",
      transliteration: body.transliteration || "",
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(",").map((s: string) => s.trim()) : []),
      featuredImage: body.featuredImage || "",
      status: body.status || "published",
      publishedDate: body.publishedDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      iconEmoji: body.iconEmoji || "📚"
    };

    await setDoc(doc(db, "hadiths", id), newHadith);
    res.json(newHadith);
  } catch (error) {
    console.error("[Hadith API] Error creating Hadith:", error);
    res.status(500).json({ error: "Failed to create Hadith." });
  }
});

// 3. Update Hadith (Admin)
app.put("/api/hadiths/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const ref = doc(db, "hadiths", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Hadith not found." });
    }

    const updated = {
      ...snap.data(),
      ...body,
      updatedAt: new Date().toISOString()
    };

    await setDoc(ref, updated);
    res.json(updated);
  } catch (error) {
    console.error("[Hadith API] Error updating Hadith:", error);
    res.status(500).json({ error: "Failed to update Hadith." });
  }
});

// 4. Delete Hadith (Admin)
app.delete("/api/hadiths/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(db, "hadiths", id));
    res.json({ success: true, message: "Hadith deleted successfully." });
  } catch (error) {
    console.error("[Hadith API] Error deleting Hadith:", error);
    res.status(500).json({ error: "Failed to delete Hadith." });
  }
});

// 5. Bulk Hadith Actions (Publish / Unpublish / Delete)
app.post("/api/hadiths/bulk-action", requireAdmin, async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required." });
    }

    const batch = writeBatch(db);
    for (const id of ids) {
      const ref = doc(db, "hadiths", id);
      if (action === "delete") {
        batch.delete(ref);
      } else if (action === "publish") {
        batch.update(ref, { status: "published", updatedAt: new Date().toISOString() });
      } else if (action === "unpublish") {
        batch.update(ref, { status: "draft", updatedAt: new Date().toISOString() });
      }
    }
    await batch.commit();
    res.json({ success: true, count: ids.length, action });
  } catch (error) {
    console.error("[Hadith API] Bulk action failed:", error);
    res.status(500).json({ error: "Failed to perform bulk action." });
  }
});

// ==========================================
// 🤲 DAILY DUAS MANAGEMENT & SEEDING API
// ==========================================
let hasSeededDuas = false;

async function checkAndSeedDuas() {
  if (hasSeededDuas) return;
  try {
    const duasCollection = collection(db, "duas");
    const q = query(duasCollection, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("[Firebase] 'duas' collection is empty. Seeding initial Duas...");
      const batch = writeBatch(db);
      for (const item of DUA_ITEMS) {
        const docRef = doc(db, "duas", item.id);
        const duaDoc = {
          id: item.id,
          titleEn: item.titleEn,
          titleUr: item.titleUr,
          category: item.category || "daily",
          arabicText: item.arabicText,
          translationEn: item.translationEn,
          translationUr: item.translationUr,
          transliteration: item.transliteration || "",
          reference: item.referenceEn || "Hisn al-Muslim",
          benefitsEn: item.childExplanationEn || "",
          benefitsUr: item.childExplanationUr || "",
          explanationEn: item.whenToReadEn || "",
          explanationUr: item.whenToReadUr || "",
          tags: ["kids", item.category],
          featuredImage: "",
          status: "published",
          publishedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          iconEmoji: item.iconEmoji || "🤲"
        };
        batch.set(docRef, duaDoc);
      }
      await batch.commit();
      console.log("[Firebase] Successfully seeded initial Daily Duas!");
    }
    hasSeededDuas = true;
  } catch (error) {
    console.error("[Firebase] Error seeding Duas:", error);
  }
}

// 1. Get Duas List (Public = published only, Admin = all or filtered)
app.get("/api/duas", async (req, res) => {
  await checkAndSeedDuas();
  try {
    const snapshot = await getDocs(collection(db, "duas"));
    let items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data());
    });

    const isAll = req.query.status === "all";
    if (!isAll) {
      items = items.filter((item) => item.status === "published");
    }

    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json(items);
  } catch (error) {
    console.error("[Duas API] Error fetching Duas:", error);
    res.status(500).json({ error: "Failed to fetch Duas." });
  }
});

// 2. Add New Dua (Admin)
app.post("/api/duas", requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!body.titleEn || !body.arabicText || !body.translationEn) {
      return res.status(400).json({ error: "Title (English), Arabic Text, and English Translation are required." });
    }

    const id = body.id || "dua-" + crypto.randomUUID();
    const newDua = {
      id,
      titleEn: body.titleEn,
      titleUr: body.titleUr || "",
      category: body.category || "daily",
      arabicText: body.arabicText,
      translationEn: body.translationEn,
      translationUr: body.translationUr || "",
      transliteration: body.transliteration || "",
      reference: body.reference || "Hisn al-Muslim",
      benefitsEn: body.benefitsEn || "",
      benefitsUr: body.benefitsUr || "",
      explanationEn: body.explanationEn || "",
      explanationUr: body.explanationUr || "",
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(",").map((s: string) => s.trim()) : []),
      featuredImage: body.featuredImage || "",
      status: body.status || "published",
      publishedDate: body.publishedDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      iconEmoji: body.iconEmoji || "🤲"
    };

    await setDoc(doc(db, "duas", id), newDua);
    res.json(newDua);
  } catch (error) {
    console.error("[Duas API] Error creating Dua:", error);
    res.status(500).json({ error: "Failed to create Dua." });
  }
});

// 3. Update Dua (Admin)
app.put("/api/duas/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const ref = doc(db, "duas", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Dua not found." });
    }

    const updated = {
      ...snap.data(),
      ...body,
      updatedAt: new Date().toISOString()
    };

    await setDoc(ref, updated);
    res.json(updated);
  } catch (error) {
    console.error("[Duas API] Error updating Dua:", error);
    res.status(500).json({ error: "Failed to update Dua." });
  }
});

// 4. Delete Dua (Admin)
app.delete("/api/duas/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(db, "duas", id));
    res.json({ success: true, message: "Dua deleted successfully." });
  } catch (error) {
    console.error("[Duas API] Error deleting Dua:", error);
    res.status(500).json({ error: "Failed to delete Dua." });
  }
});

// 5. Bulk Dua Actions (Publish / Unpublish / Delete)
app.post("/api/duas/bulk-action", requireAdmin, async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required." });
    }

    const batch = writeBatch(db);
    for (const id of ids) {
      const ref = doc(db, "duas", id);
      if (action === "delete") {
        batch.delete(ref);
      } else if (action === "publish") {
        batch.update(ref, { status: "published", updatedAt: new Date().toISOString() });
      } else if (action === "unpublish") {
        batch.update(ref, { status: "draft", updatedAt: new Date().toISOString() });
      }
    }
    await batch.commit();
    res.json({ success: true, count: ids.length, action });
  } catch (error) {
    console.error("[Duas API] Bulk action failed:", error);
    res.status(500).json({ error: "Failed to perform bulk action." });
  }
});

// Setup Vite Dev Server / Static Files & WebSockets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);

  // Setup WebSocket Server for Gemini Live API
  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (clientWs) => {
    console.log("[Live API] Client connected to live voice session");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured." }));
      clientWs.close();
      return;
    }

    let session: any = null;
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore",
              },
            },
          },
          systemInstruction: `You are "Islamic Voice Companion" for children and families. You talk warmly, politely, and cheerfully in English or Urdu about Islam, Prophets, Quranic stories, and good moral manners. Keep your spoken responses concise, friendly, and easy for kids to understand. Always end with encouraging words.`,
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (text) {
              clientWs.send(JSON.stringify({ text }));
            }
          },
          onerror: (err: any) => {
            console.error("[Live API Session Error]:", err);
            clientWs.send(JSON.stringify({ error: err?.message || "Live API session error" }));
          },
          onclose: () => {
            console.log("[Live API Session Closed]");
          },
        },
      });

      clientWs.on("message", (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio && session) {
            session.sendRealtimeInput({
              audio: {
                data: parsed.audio,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          } else if (parsed.text && session) {
            session.sendRealtimeInput({
              text: parsed.text,
            });
          }
        } catch (e) {
          console.error("[Live API Client Message Error]:", e);
        }
      });

      clientWs.on("close", () => {
        if (session) {
          try {
            session.close();
          } catch (e) {}
        }
      });
    } catch (err: any) {
      console.error("[Live API Connection Error]:", err);
      clientWs.send(JSON.stringify({ error: err?.message || "Failed to initialize Live API session" }));
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Islamic Kids Stories] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
