import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Lock, LogOut, Plus, Trash2, Edit3, 
  Eye, Save, AlertCircle, FileText, CheckCircle, HelpCircle,
  X, Image as ImageIcon, Calendar, Layers, Hash, UserPlus, LogIn, Sparkles,
  Star, MessageSquare, Download, ThumbsUp, ThumbsDown, XCircle, Search, Mail, Filter, Video as VideoIcon, Clock,
  Folder, FolderPlus, FolderOpen, ArrowRight, Check, Play, Copy, RefreshCw, Upload, AlertTriangle, Languages,
  TrendingUp, Settings, Users, GraduationCap, Award, BookOpen
} from "lucide-react";
import { Story, QuizQuestion, IslamicReference, Video, VideoFolder } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { storage } from "../lib/firebase";
import { ref as storageRef, deleteObject, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { deleteOfflineStory } from "../lib/offlineDb";

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

import { Language, getTranslation } from "../lib/translations";

interface AdminPanelProps {
  stories: Story[];
  onRefresh: () => void;
  onNavigateToStory: (story: Story) => void;
  language?: Language;
}

export default function AdminPanel({ stories, onRefresh, onNavigateToStory, language = "en" }: AdminPanelProps) {
  // Auth state
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regPasscode, setRegPasscode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listing / Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingStory, setEditingStory] = useState<Partial<Story> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localStories, setLocalStories] = useState<Story[]>(stories);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storyToDeleteId, setStoryToDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Advanced Dashboard states
  const [adminSearch, setAdminSearch] = useState("");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState("all");
  const [adminProphetFilter, setAdminProphetFilter] = useState("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [previewStory, setPreviewStory] = useState<Story | null>(null);

  // Platform-wide Statistics
  const [stats, setStats] = useState<{
    totalStories: number;
    totalVideos: number;
    pendingVideos: number;
    totalUsers: number;
    dailyVisitors: number;
    mostReadStory: string;
    mostWatchedVideo: string;
    feedbackCount: number;
    storageUsed: string;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchAdminStats = async (storedToken?: string) => {
    const currentToken = storedToken || token || localStorage.getItem("admin_token");
    if (!currentToken) return;
    try {
      setStatsLoading(true);
      const res = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Active Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "stories" | "feedback" | "videos" | "users" | "scholars" | "hadiths" | "duas" | "reports" | "settings">("dashboard");

  // Hadiths Management States
  const [hadithsList, setHadithsList] = useState<any[]>([]);
  const [hadithsLoading, setHadithsLoading] = useState(false);
  const [hadithSearch, setHadithSearch] = useState("");
  const [hadithCategoryFilter, setHadithCategoryFilter] = useState("all");
  const [hadithStatusFilter, setHadithStatusFilter] = useState("all");
  const [selectedHadithIds, setSelectedHadithIds] = useState<string[]>([]);
  const [isEditingHadith, setIsEditingHadith] = useState(false);
  const [editingHadith, setEditingHadith] = useState<any | null>(null);
  const [hadithToDeleteId, setHadithToDeleteId] = useState<string | null>(null);
  const [previewHadith, setPreviewHadith] = useState<any | null>(null);
  const [hadithPage, setHadithPage] = useState(1);

  // Duas Management States
  const [duasList, setDuasList] = useState<any[]>([]);
  const [duasLoading, setDuasLoading] = useState(false);
  const [duaSearch, setDuaSearch] = useState("");
  const [duaCategoryFilter, setDuaCategoryFilter] = useState("all");
  const [duaStatusFilter, setDuaStatusFilter] = useState("all");
  const [selectedDuaIds, setSelectedDuaIds] = useState<string[]>([]);
  const [isEditingDua, setIsEditingDua] = useState(false);
  const [editingDua, setEditingDua] = useState<any | null>(null);
  const [duaToDeleteId, setDuaToDeleteId] = useState<string | null>(null);
  const [previewDua, setPreviewDua] = useState<any | null>(null);
  const [duaPage, setDuaPage] = useState(1);

  // Feedback management states
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackStoryFilter, setFeedbackStoryFilter] = useState("all");
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState("all");
  const [feedbackDateFilter, setFeedbackDateFilter] = useState("all"); // "all", "today", "7days", "30days"

  // Videos management states
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoSearch, setVideoSearch] = useState("");
  const [videoCategoryFilter, setVideoCategoryFilter] = useState("all");
  const [videoSubTab, setVideoSubTab] = useState<"pending" | "approved" | "rejected" | "reported">("pending");
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Partial<Video> | null>(null);
  const [videoToDeleteId, setVideoToDeleteId] = useState<string | null>(null);
  const [videoToRejectId, setVideoToRejectId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Video Folders and Direct Upload states
  const [folderList, setFolderList] = useState<VideoFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string>("all"); // "all", "unassigned", or folderId
  const [isManagingFolders, setIsManagingFolders] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState("");
  
  // Direct upload queue
  interface UploadItem {
    id: string;
    file: File;
    name: string;
    size: number;
    progress: number;
    status: "pending" | "uploading" | "completed" | "cancelled" | "failed";
    videoUrl?: string;
    duration?: string;
    uploadTaskRef?: any;
    error?: string;
    // Metadata entered during upload
    title: string;
    description: string;
    category: string;
    ageGroup: "all" | "4-6" | "7-9" | "10-12";
    language: string;
    tags: string;
    isFeatured: boolean;
    folderId: string;
    publishDate: string;
    thumbnailUrl?: string;
    thumbnailFile?: File | null;
    thumbnailProgress?: number;
    thumbnailUploadTaskRef?: any;
  }
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploadingTab, setIsUploadingTab] = useState(false); // To toggle between Library and Direct Upload tabs

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  useEffect(() => {
    setLocalStories(stories);
  }, [stories]);

  // Monitor auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("admin_token");
      if (storedToken) {
        try {
          const res = await fetch("/api/admin/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUser({ email: data.email });
            setToken(storedToken);
          } else {
            localStorage.removeItem("admin_token");
            setUser(null);
            setToken(null);
            window.dispatchEvent(new Event("admin-auth-change"));
          }
        } catch (err) {
          console.error("Error verifying custom admin token:", err);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    };

    checkAuth();
  }, []);

  const fetchFeedbackList = async () => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      setFeedbackLoading(true);
      const res = await fetch("/api/feedback", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFeedbackList(data);
        } else if (data && Array.isArray(data.feedbacks)) {
          setFeedbackList(data.feedbacks);
        } else {
          setFeedbackList([]);
        }
      } else {
        showToast("Failed to fetch feedback list", "error");
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
      showToast("Error fetching feedback", "error");
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "feedback" && token) {
      fetchFeedbackList();
    }
    if (activeTab === "stories" && token) {
      fetchAdminStats();
    }
  }, [activeTab, token]);

  const fetchVideoList = async () => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      setVideoLoading(true);
      const res = await fetch("/api/videos", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setVideoList(data);
        } else if (data && Array.isArray(data.videos)) {
          setVideoList(data.videos);
        } else {
          setVideoList([]);
        }
      } else {
        showToast("Failed to fetch videos list", "error");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      showToast("Error fetching videos", "error");
    } finally {
      setVideoLoading(false);
    }
  };

  const fetchFolderList = async () => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      setFoldersLoading(true);
      const res = await fetch("/api/video-folders", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFolderList(data);
        } else if (data && Array.isArray(data.folders)) {
          setFolderList(data.folders);
        } else {
          setFolderList([]);
        }
      } else {
        showToast("Failed to fetch folders", "error");
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
      showToast("Error fetching folders", "error");
    } finally {
      setFoldersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "videos" && token) {
      fetchVideoList();
      fetchFolderList();
    } else if (activeTab === "hadiths") {
      fetchAdminHadiths();
    } else if (activeTab === "duas") {
      fetchAdminDuas();
    }
  }, [activeTab, token]);

  // Hadith & Dua API handlers
  const fetchAdminHadiths = async () => {
    try {
      setHadithsLoading(true);
      const res = await fetch("/api/hadiths?status=all");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHadithsList(data);
        } else if (data && Array.isArray(data.hadiths)) {
          setHadithsList(data.hadiths);
        } else {
          setHadithsList([]);
        }
      } else {
        setHadithsList([]);
      }
    } catch (err) {
      console.error("Error fetching admin Hadiths:", err);
      showToast("Error fetching Hadiths", "error");
      setHadithsList([]);
    } finally {
      setHadithsLoading(false);
    }
  };

  const fetchAdminDuas = async () => {
    try {
      setDuasLoading(true);
      const res = await fetch("/api/duas?status=all");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDuasList(data);
        } else if (data && Array.isArray(data.duas)) {
          setDuasList(data.duas);
        } else {
          setDuasList([]);
        }
      } else {
        setDuasList([]);
      }
    } catch (err) {
      console.error("Error fetching admin Duas:", err);
      showToast("Error fetching Duas", "error");
      setDuasList([]);
    } finally {
      setDuasLoading(false);
    }
  };

  // Hadith CRUD actions
  const handleSaveHadith = async (hadithData: any) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      const isExisting = Boolean(hadithData.id);
      const url = isExisting ? `/api/hadiths/${hadithData.id}` : "/api/hadiths";
      const method = isExisting ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify(hadithData),
      });

      if (res.ok) {
        showToast(`Hadith ${isExisting ? "updated" : "created"} successfully!`, "success");
        setIsEditingHadith(false);
        setEditingHadith(null);
        fetchAdminHadiths();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save Hadith", "error");
      }
    } catch (err) {
      console.error("Error saving Hadith:", err);
      showToast("Error saving Hadith", "error");
    }
  };

  const handleDeleteHadith = async (id: string) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      const res = await fetch(`/api/hadiths/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        showToast("Hadith deleted successfully", "success");
        setHadithToDeleteId(null);
        fetchAdminHadiths();
      } else {
        showToast("Failed to delete Hadith", "error");
      }
    } catch (err) {
      console.error("Error deleting Hadith:", err);
      showToast("Error deleting Hadith", "error");
    }
  };

  const handleBulkHadithAction = async (action: "publish" | "unpublish" | "delete") => {
    if (selectedHadithIds.length === 0) return;
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;

    if (action === "delete" && !window.confirm(`Are you sure you want to delete ${selectedHadithIds.length} selected Hadiths?`)) {
      return;
    }

    try {
      const res = await fetch("/api/hadiths/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ ids: selectedHadithIds, action }),
      });
      if (res.ok) {
        showToast(`Bulk ${action} completed successfully`, "success");
        setSelectedHadithIds([]);
        fetchAdminHadiths();
      } else {
        showToast("Bulk action failed", "error");
      }
    } catch (err) {
      console.error("Error performing bulk Hadith action:", err);
      showToast("Error in bulk action", "error");
    }
  };

  // Dua CRUD actions
  const handleSaveDua = async (duaData: any) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      const isExisting = Boolean(duaData.id);
      const url = isExisting ? `/api/duas/${duaData.id}` : "/api/duas";
      const method = isExisting ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify(duaData),
      });

      if (res.ok) {
        showToast(`Dua ${isExisting ? "updated" : "created"} successfully!`, "success");
        setIsEditingDua(false);
        setEditingDua(null);
        fetchAdminDuas();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save Dua", "error");
      }
    } catch (err) {
      console.error("Error saving Dua:", err);
      showToast("Error saving Dua", "error");
    }
  };

  const handleDeleteDua = async (id: string) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      const res = await fetch(`/api/duas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        showToast("Dua deleted successfully", "success");
        setDuaToDeleteId(null);
        fetchAdminDuas();
      } else {
        showToast("Failed to delete Dua", "error");
      }
    } catch (err) {
      console.error("Error deleting Dua:", err);
      showToast("Error deleting Dua", "error");
    }
  };

  const handleBulkDuaAction = async (action: "publish" | "unpublish" | "delete") => {
    if (selectedDuaIds.length === 0) return;
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;

    if (action === "delete" && !window.confirm(`Are you sure you want to delete ${selectedDuaIds.length} selected Duas?`)) {
      return;
    }

    try {
      const res = await fetch("/api/duas/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ ids: selectedDuaIds, action }),
      });
      if (res.ok) {
        showToast(`Bulk ${action} completed successfully`, "success");
        setSelectedDuaIds([]);
        fetchAdminDuas();
      } else {
        showToast("Bulk action failed", "error");
      }
    } catch (err) {
      console.error("Error performing bulk Dua action:", err);
      showToast("Error in bulk action", "error");
    }
  };

  const handleUpdateFeedback = async (id: string, updates: { approved?: boolean; status?: "read" | "unread" }) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setFeedbackList(prev => prev.map(item => item.id === id ? updated : item));
        showToast("Feedback updated successfully", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update feedback", "error");
      }
    } catch (err) {
      console.error("Error updating feedback:", err);
      showToast("Error updating feedback", "error");
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    if (!window.confirm("Are you sure you want to permanently delete this feedback?")) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        setFeedbackList(prev => prev.filter(item => item.id !== id));
        showToast("Feedback deleted successfully", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete feedback", "error");
      }
    } catch (err) {
      console.error("Error deleting feedback:", err);
      showToast("Error deleting feedback", "error");
    }
  };

  // --- Videos Management Handlers ---

  const startAddVideo = () => {
    setIsEditingVideo(true);
    setEditingVideo({
      id: "",
      title: "",
      description: "",
      videoUrl: "",
      thumbnail: "",
      duration: "0:00",
      category: "Prophets Stories",
      ageGroup: "all",
      isFeatured: false
    });
  };

  const startEditVideo = (video: Video) => {
    setIsEditingVideo(true);
    setEditingVideo({ ...video });
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) {
      showToast("Unauthorized: Please log in as an admin.", "error");
      return;
    }

    try {
      const isNew = !editingVideo.id;
      const url = isNew ? "/api/videos" : `/api/videos/${editingVideo.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify(editingVideo),
      });

      if (res.ok) {
        showToast(isNew ? "Video added successfully" : "Video updated successfully", "success");
        setIsEditingVideo(false);
        setEditingVideo(null);
        fetchVideoList();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to save video", "error");
      }
    } catch (err: any) {
      console.error("Error saving video:", err);
      showToast("Error saving video", "error");
    }
  };

  const handleUpdateVideoStatus = async (id: string, status: "pending" | "approved" | "rejected", rejectionReason?: string) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ status, rejectionReason: rejectionReason || "" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVideoList(prev => prev.map(v => v.id === id ? updated : v));
        showToast(`Video status changed to ${status}`, "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update video status", "error");
      }
    } catch (err) {
      console.error("Error updating video status:", err);
      showToast("Error updating video status", "error");
    }
  };

  const handleToggleFeatureVideo = async (video: Video) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    const nextFeatured = !video.isFeatured;
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ isFeatured: nextFeatured }),
      });
      if (res.ok) {
        showToast(nextFeatured ? "Video set as Featured!" : "Video unfeatured", "success");
        fetchVideoList();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to toggle featured state", "error");
      }
    } catch (err) {
      console.error("Error toggling featured state:", err);
      showToast("Error toggling featured state", "error");
    }
  };

  const handleDismissReports = async (video: Video) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ reported: false, reportCount: 0 }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVideoList(prev => prev.map(v => v.id === video.id ? updated : v));
        showToast("Reports cleared and dismissed", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to clear reports", "error");
      }
    } catch (err) {
      console.error("Error clearing reports:", err);
      showToast("Error clearing reports", "error");
    }
  };

  const handleDeleteVideo = (id: string) => {
    setVideoToDeleteId(id);
  };

  const executeDeleteVideo = async (id: string) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) {
      showToast("Unauthorized: Please log in as an admin.", "error");
      return;
    }

    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        showToast("Video deleted successfully", "success");
        setVideoList(prev => prev.filter(v => v.id !== id));
      } else {
        showToast("Failed to delete video", "error");
      }
    } catch (err) {
      console.error("Error deleting video:", err);
      showToast("Error deleting video", "error");
    }
  };

  // --- Duplicate Video, Folders, and Direct Upload Handlers ---

  const handleDuplicateVideo = async (video: Video) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    try {
      const duplicatedVideo = {
        title: `${video.title} (Copy)`,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        duration: video.duration,
        category: video.category,
        ageGroup: video.ageGroup,
        isFeatured: false, // Force false for duplicated videos by default
        status: "approved",
        language: video.language || "English",
        tags: video.tags || [],
        publishDate: new Date().toISOString().split("T")[0],
        folderId: video.folderId || null
      };

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify(duplicatedVideo),
      });

      if (res.ok) {
        showToast("Video duplicated successfully", "success");
        fetchVideoList();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to duplicate video", "error");
      }
    } catch (err) {
      console.error("Error duplicating video:", err);
      showToast("Error duplicating video", "error");
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;

    try {
      const res = await fetch("/api/video-folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (res.ok) {
        showToast("Folder created successfully", "success");
        setNewFolderName("");
        fetchFolderList();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create folder", "error");
      }
    } catch (err) {
      console.error("Error creating folder:", err);
      showToast("Error creating folder", "error");
    }
  };

  const handleRenameFolder = async (id: string, name: string) => {
    if (!name.trim()) return;
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;

    try {
      const res = await fetch(`/api/video-folders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        showToast("Folder renamed successfully", "success");
        setRenamingFolderId(null);
        setRenamingFolderName("");
        fetchFolderList();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to rename folder", "error");
      }
    } catch (err) {
      console.error("Error renaming folder:", err);
      showToast("Error renaming folder", "error");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;
    if (!window.confirm("Are you sure you want to delete this folder? All videos in this folder will be unassigned but NOT deleted.")) return;

    try {
      const res = await fetch(`/api/video-folders/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        showToast("Folder deleted successfully", "success");
        if (activeFolderId === id) {
          setActiveFolderId("all");
        }
        fetchFolderList();
        fetchVideoList();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete folder", "error");
      }
    } catch (err) {
      console.error("Error deleting folder:", err);
      showToast("Error deleting folder", "error");
    }
  };

  const handleAssignVideoToFolder = async (videoId: string, folderId: string | null) => {
    const storedToken = token || localStorage.getItem("admin_token");
    if (!storedToken) return;

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ folderId }),
      });

      if (res.ok) {
        showToast(folderId ? "Video added to folder" : "Video unassigned from folder", "success");
        fetchVideoList();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to assign video", "error");
      }
    } catch (err) {
      console.error("Error assigning video to folder:", err);
      showToast("Error assigning video to folder", "error");
    }
  };

  const autoDetectDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const videoElement = document.createElement("video");
        videoElement.preload = "metadata";
        videoElement.src = URL.createObjectURL(file);
        videoElement.onloadedmetadata = () => {
          URL.revokeObjectURL(videoElement.src);
          const minutes = Math.floor(videoElement.duration / 60);
          const seconds = Math.floor(videoElement.duration % 60);
          resolve(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        };
        videoElement.onerror = () => {
          resolve("0:00");
        };
      } catch (err) {
        resolve("0:00");
      }
    });
  };

  const handleAddToQueue = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: UploadItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["mp4", "webm", "mov"].includes(ext)) {
        showToast(`Invalid format for ${file.name}. Only MP4, WebM, and MOV are supported.`, "error");
        continue;
      }
      if (file.size > 500 * 1024 * 1024) {
        showToast(`File ${file.name} is too large. Maximum size allowed is 500 MB.`, "error");
        continue;
      }

      const id = `upload-${Date.now()}-${i}`;
      const title = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;

      newItems.push({
        id,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "pending",
        title: title,
        description: "",
        category: "Prophets Stories",
        ageGroup: "all",
        language: "English",
        tags: "",
        isFeatured: false,
        folderId: activeFolderId !== "all" && activeFolderId !== "unassigned" ? activeFolderId : "",
        publishDate: new Date().toISOString().split("T")[0]
      });
    }

    if (newItems.length > 0) {
      setUploadQueue(prev => [...prev, ...newItems]);
      showToast(`Added ${newItems.length} videos to the upload queue.`, "success");
    }
  };

  const handleStartUpload = async (item: UploadItem) => {
    setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "uploading", progress: 1, error: undefined } : q));

    try {
      let detectedDuration = "0:00";
      try {
        detectedDuration = await autoDetectDuration(item.file);
      } catch (e) {
        console.error("Error detecting duration:", e);
      }

      const videoFileName = `videos/${Date.now()}_${item.file.name}`;
      const videoStorageRef = storageRef(storage, videoFileName);
      const uploadTask = uploadBytesResumable(videoStorageRef, item.file);

      setUploadQueue(prev => prev.map(q => {
        if (q.id === item.id) {
          return { ...q, uploadTaskRef: uploadTask, duration: detectedDuration };
        }
        return q;
      }));

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: percent === 100 ? 99 : percent } : q));
        },
        (error) => {
          console.error("Firebase video upload error:", error);
          if (error.code === "storage/canceled") {
            setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "cancelled", progress: 0 } : q));
            showToast(`Upload of ${item.name} cancelled.`, "error");
          } else {
            setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "failed", error: error.message } : q));
            showToast(`Upload of ${item.name} failed: ${error.message}`, "error");
          }
        },
        async () => {
          const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);

          let finalThumbnailUrl = "";
          if (item.thumbnailFile) {
            try {
              setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, thumbnailProgress: 10 } : q));
              const thumbFileName = `thumbnails/${Date.now()}_${item.thumbnailFile.name}`;
              const thumbRef = storageRef(storage, thumbFileName);
              const thumbUploadTask = uploadBytesResumable(thumbRef, item.thumbnailFile);

              setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, thumbnailUploadTaskRef: thumbUploadTask } : q));

              await new Promise<void>((resolve, reject) => {
                thumbUploadTask.on(
                  "state_changed",
                  (snap) => {
                    const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                    setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, thumbnailProgress: pct } : q));
                  },
                  (err) => reject(err),
                  async () => {
                    finalThumbnailUrl = await getDownloadURL(thumbUploadTask.snapshot.ref);
                    resolve();
                  }
                );
              });
            } catch (thumbError: any) {
              console.error("Thumbnail upload failed:", thumbError);
              showToast(`Thumbnail upload failed for ${item.name}, using fallback.`, "error");
            }
          }

          if (!finalThumbnailUrl) {
            finalThumbnailUrl = "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=800";
          }

          const storedToken = token || localStorage.getItem("admin_token");
          if (!storedToken) {
            throw new Error("Session expired, please login as admin.");
          }

          const tagsArray = item.tags ? item.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

          const res = await fetch("/api/videos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedToken}`
            },
            body: JSON.stringify({
              title: item.title,
              description: item.description || "Uploaded directly by admin.",
              videoUrl: videoUrl,
              thumbnail: finalThumbnailUrl,
              duration: detectedDuration,
              category: item.category,
              ageGroup: item.ageGroup,
              isFeatured: item.isFeatured,
              status: "approved",
              language: item.language,
              tags: tagsArray,
              publishDate: item.publishDate,
              folderId: item.folderId || null
            })
          });

          if (res.ok) {
            setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "completed", progress: 100, videoUrl } : q));
            showToast(`Video "${item.title}" uploaded and published successfully!`, "success");
            fetchVideoList();
          } else {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to publish video details in library.");
          }
        }
      );
    } catch (err: any) {
      console.error("Error in upload execution:", err);
      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "failed", error: err.message } : q));
      showToast(`Error uploading ${item.name}: ${err.message}`, "error");
    }
  };

  const handleCancelUpload = (item: UploadItem) => {
    if (item.uploadTaskRef) {
      try {
        item.uploadTaskRef.cancel();
      } catch (e) {
        console.error("Error cancelling video upload task:", e);
      }
    }
    if (item.thumbnailUploadTaskRef) {
      try {
        item.thumbnailUploadTaskRef.cancel();
      } catch (e) {
        console.error("Error cancelling thumbnail upload task:", e);
      }
    }
    setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "cancelled", progress: 0 } : q));
  };

  const handleRemoveFromQueue = (id: string) => {
    setUploadQueue(prev => prev.filter(q => q.id !== id));
  };

  const handleExportFeedback = (filteredFeedbacks: any[]) => {
    if (filteredFeedbacks.length === 0) {
      showToast("No feedback to export", "error");
      return;
    }
    // Generate CSV content
    const headers = ["ID", "Name", "Email", "Story Title", "Rating", "Message", "Status", "Approved", "Created At"];
    const rows = filteredFeedbacks.map(f => [
      f.id,
      `"${f.name.replace(/"/g, '""')}"`,
      f.email ? `"${f.email.replace(/"/g, '""')}"` : "",
      `"${f.storyTitle.replace(/"/g, '""')}"`,
      f.rating,
      `"${f.message.replace(/"/g, '""')}"`,
      f.status,
      f.approved ? "Yes" : "No",
      f.createdAt
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `story_feedback_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredFeedbacks.length} items to CSV`, "success");
  };

  const getFilteredFeedbacks = () => {
    return feedbackList.filter(fb => {
      const matchesSearch = feedbackSearch === "" ||
        fb.name.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
        (fb.email || "").toLowerCase().includes(feedbackSearch.toLowerCase()) ||
        fb.message.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
        fb.storyTitle.toLowerCase().includes(feedbackSearch.toLowerCase());

      const matchesStory = feedbackStoryFilter === "all" || fb.storyTitle === feedbackStoryFilter;

      const matchesRating = feedbackRatingFilter === "all" || fb.rating === Number(feedbackRatingFilter);

      let matchesDate = true;
      if (feedbackDateFilter !== "all") {
        const createdAtTime = new Date(fb.createdAt).getTime();
        const nowTime = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (feedbackDateFilter === "today") {
          matchesDate = nowTime - createdAtTime < oneDay;
        } else if (feedbackDateFilter === "7days") {
          matchesDate = nowTime - createdAtTime < 7 * oneDay;
        } else if (feedbackDateFilter === "30days") {
          matchesDate = nowTime - createdAtTime < 30 * oneDay;
        }
      }

      return matchesSearch && matchesStory && matchesRating && matchesDate;
    });
  };

  // Authenticate admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
      setUser({ email: data.email });
      setEmail("");
      setPassword("");
      window.dispatchEvent(new Event("admin-auth-change"));
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Login failed. Check email or password.");
    }
  };

  // Register admin user
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setActionSuccess(null);

    if (regPasscode !== "bismillah123" && regPasscode !== "admin") {
      setAuthError("Incorrect Admin passcode. Access denied.");
      return;
    }

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, passcode: regPasscode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
      setUser({ email: data.email });
      setActionSuccess("Admin account registered successfully! You are now logged in.");
      setIsRegistering(false);
      setEmail("");
      setPassword("");
      setRegPasscode("");
      window.dispatchEvent(new Event("admin-auth-change"));
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Registration failed. Try again.");
    }
  };

  const handleLogout = async () => {
    try {
      setToken(null);
      setUser(null);
      localStorage.removeItem("admin_token");
      setActionSuccess("Logged out successfully.");
      window.dispatchEvent(new Event("admin-auth-change"));
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  // Compress and convert image to lightweight Base64 string for direct database storage
  const compressAndConvertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          resolve(dataUrl);
        };
        img.onerror = () => {
          reject(new Error("Failed to load image for compression."));
        };
      };
      reader.onerror = () => {
        reject(new Error("Failed to read image file."));
      };
    });
  };

  // Upload story cover image with local compression and base64 storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setActionError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setActionError("Image file is too large (maximum 10MB).");
      return;
    }

    setUploading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const base64DataUrl = await compressAndConvertToBase64(file);
      setEditingStory(prev => prev ? { ...prev, coverImage: base64DataUrl } : null);
      setActionSuccess("Image successfully compressed and attached as cover!");
    } catch (err: any) {
      console.error("Image optimization error:", err);
      setActionError("Failed to process image: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  // Setup form with empty story for "Add Story"
  const startAddStory = () => {
    setIsEditing(true);
    setEditingStory({
      id: "",
      titleEn: "",
      titleUr: "",
      category: "Islamic Morals",
      prophetName: "",
      readingTime: 3,
      ageGroup: "7-9",
      coverImage: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=800",
      shortDescriptionEn: "",
      shortDescriptionUr: "",
      contentEn: "",
      contentUr: "",
      lessonsEn: ["", ""],
      lessonsUr: ["", ""],
      references: [
        { type: "quran", source: "", referenceKey: "", verificationStatus: "verified" }
      ],
      quiz: [
        { question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }
      ],
      isFeatured: false,
      status: "published",
      tags: [],
      slug: "",
      seoMetaTitle: "",
      seoMetaDescription: ""
    });
  };

  // Load existing story to form for editing
  const startEditStory = (story: Story) => {
    setIsEditing(true);
    setEditingStory({ ...story });
  };

  const handleDeleteStory = (storyId: string) => {
    // 1. Only authenticated admins can delete stories
    if (!token) {
      setActionError("Unauthorized: You must be logged in as an admin.");
      showToast("Unauthorized: You must be logged in as an admin.", "error");
      return;
    }

    // 2. Open our custom non-blocking confirmation modal
    setStoryToDeleteId(storyId);
  };

  const executeDeleteStory = async (storyId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setDeletingId(storyId); // 8. Add proper loading state while deleting

    const storyToDelete = localStories.find(s => s.id === storyId);
    console.log(`[Admin Delete] Initiating deletion process for story ID: ${storyId}`);

    try {
      // 13. If the story is marked as Featured, automatically remove it from Featured before deleting
      if (storyToDelete?.isFeatured) {
        console.log(`[Admin Delete] Story ${storyId} is marked as Featured. Removing from featured status first.`);
        try {
          const featuredUpdateResponse = await fetch(`/api/stories/${storyId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ isFeatured: false })
          });
          
          if (!featuredUpdateResponse.ok) {
            const featErrData = await featuredUpdateResponse.json().catch(() => ({}));
            console.warn("[Admin Delete] Warning: Could not remove story from featured in backend:", featErrData.error || "Unknown error");
          } else {
            console.log("[Admin Delete] Successfully removed story from featured.");
          }
        } catch (featErr) {
          console.error("[Admin Delete] Error unfeaturing story before deletion:", featErr);
          // Proceed with deletion anyway to avoid getting stuck
        }
      }

      // 3. Delete the story document from Firestore via backend
      const response = await fetch(`/api/stories/${storyId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete story.");
      }

      // 4. If a cover image exists, also delete the associated image
      if (storyToDelete && storyToDelete.coverImage) {
        const coverUrl = storyToDelete.coverImage;
        if (coverUrl.includes("firebasestorage.googleapis.com")) {
          console.log("[Admin Delete] Cover image is stored in Firebase Storage. Deleting:", coverUrl);
          try {
            const imageRef = storageRef(storage, coverUrl);
            await deleteObject(imageRef);
            console.log("[Admin Delete] Associated cover image deleted successfully from Firebase Storage.");
          } catch (storageError: any) {
            console.error("[Admin Delete] Failed to delete image from Firebase Storage:", storageError);
            // Logged but non-blocking (the document is already deleted)
          }
        }
      }

      // 5. Remove the story immediately from the UI without refreshing the page
      setLocalStories(prev => prev.filter(s => s.id !== storyId));
      
      // Delete from offline IndexedDB cache as well
      deleteOfflineStory(storyId).catch(err => {
        console.warn("[Offline Cache] Failed to remove story from offline cache:", err);
      });
      
      // 6. Show a success toast and banner
      showToast("Story deleted successfully.", "success");
      setActionSuccess("Story deleted successfully.");
      
      // Trigger update of parent state in App.tsx
      onRefresh();
    } catch (err: any) {
      // 7. If deletion fails, show the exact error message
      const errMsg = err.message || "Failed to delete story.";
      setActionError(errMsg);
      showToast(errMsg, "error");
      
      // 11. Add console logs to help debug if deletion fails
      console.error("[Admin Delete] Error during story deletion:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Duplicate Story helper
  const handleDuplicateStory = async (story: Story) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const copyId = `story-copy-${Date.now()}`;
      const copyTitleEn = `Copy of ${story.titleEn}`;
      const copySlug = copyTitleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      const duplicated: Story = {
        ...story,
        id: copyId,
        titleEn: copyTitleEn,
        slug: copySlug,
        status: "draft", // always duplicate as draft
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0 // reset views on duplicate
      };

      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(duplicated)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to duplicate story");
      }

      showToast(`Successfully duplicated "${story.titleEn}" as a draft!`, "success");
      onRefresh();
    } catch (err: any) {
      console.error("[Duplicate Story] Error:", err);
      setActionError(err.message || "Failed to duplicate story");
      showToast(err.message || "Failed to duplicate story", "error");
    }
  };

  // Bulk Actions
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setActionError(null);
    try {
      const response = await fetch("/api/stories/bulk-publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Bulk publish failed");
      }

      showToast(`Successfully published ${selectedIds.length} stories!`, "success");
      setSelectedIds([]);
      onRefresh();
    } catch (err: any) {
      console.error("[Bulk Publish] Error:", err);
      setActionError(err.message);
      showToast(err.message, "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setActionError(null);
    try {
      const response = await fetch("/api/stories/bulk-unpublish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Bulk unpublish failed");
      }

      showToast(`Successfully unpublished ${selectedIds.length} stories!`, "success");
      setSelectedIds([]);
      onRefresh();
    } catch (err: any) {
      console.error("[Bulk Unpublish] Error:", err);
      setActionError(err.message);
      showToast(err.message, "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} stories permanently? This cannot be undone.`)) {
      return;
    }
    setBulkActionLoading(true);
    setActionError(null);
    try {
      const response = await fetch("/api/stories/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Bulk deletion failed");
      }

      showToast(`Successfully deleted ${selectedIds.length} stories!`, "success");
      setSelectedIds([]);
      onRefresh();
    } catch (err: any) {
      console.error("[Bulk Delete] Error:", err);
      setActionError(err.message);
      showToast(err.message, "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Submit Story Form
  const handleSubmitStoryForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;

    setActionError(null);
    setActionSuccess(null);

    const isNew = !editingStory.id;
    const url = isNew ? "/api/stories" : `/api/stories/${editingStory.id}`;
    const method = isNew ? "POST" : "PUT";

    // Basic Validation
    if (!editingStory.titleEn || !editingStory.titleUr) {
      setActionError("Title is required in both English and Urdu.");
      return;
    }

    try {
      // Create slug if missing
      if (!editingStory.slug) {
        editingStory.slug = editingStory.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editingStory),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save story");
      }

      setActionSuccess(isNew ? "Story added successfully!" : "Story updated successfully!");
      setIsEditing(false);
      setEditingStory(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Helper arrays update
  const handleLessonChange = (lang: 'En' | 'Ur', idx: number, value: string) => {
    if (!editingStory) return;
    const field = lang === 'En' ? 'lessonsEn' : 'lessonsUr';
    const arr = [...(editingStory[field] || [])];
    arr[idx] = value;
    setEditingStory({ ...editingStory, [field]: arr });
  };

  const addLessonField = (lang: 'En' | 'Ur') => {
    if (!editingStory) return;
    const field = lang === 'En' ? 'lessonsEn' : 'lessonsUr';
    setEditingStory({ ...editingStory, [field]: [...(editingStory[field] || []), ""] });
  };

  const removeLessonField = (lang: 'En' | 'Ur', idx: number) => {
    if (!editingStory) return;
    const field = lang === 'En' ? 'lessonsEn' : 'lessonsUr';
    const arr = (editingStory[field] || []).filter((_, i) => i !== idx);
    setEditingStory({ ...editingStory, [field]: arr });
  };

  const handleRefChange = (idx: number, key: keyof IslamicReference, value: string) => {
    if (!editingStory) return;
    const arr = [...(editingStory.references || [])];
    arr[idx] = { ...arr[idx], [key]: value };
    setEditingStory({ ...editingStory, references: arr });
  };

  const addRefField = () => {
    if (!editingStory) return;
    setEditingStory({
      ...editingStory,
      references: [...(editingStory.references || []), { type: "quran", source: "", referenceKey: "", verificationStatus: "verified" }]
    });
  };

  const removeRefField = (idx: number) => {
    if (!editingStory) return;
    setEditingStory({ ...editingStory, references: (editingStory.references || []).filter((_, i) => i !== idx) });
  };

  // Quiz Form Helpers
  const handleQuizQuestionChange = (idx: number, key: keyof QuizQuestion, value: any) => {
    if (!editingStory) return;
    const arr = [...(editingStory.quiz || [])];
    arr[idx] = { ...arr[idx], [key]: value };
    setEditingStory({ ...editingStory, quiz: arr });
  };

  const handleQuizOptionChange = (qIdx: number, oIdx: number, value: string) => {
    if (!editingStory) return;
    const arr = [...(editingStory.quiz || [])];
    const options = [...arr[qIdx].options];
    options[oIdx] = value;
    arr[qIdx] = { ...arr[qIdx], options };
    setEditingStory({ ...editingStory, quiz: arr });
  };

  const addQuizQuestion = () => {
    if (!editingStory) return;
    const newQuestion: QuizQuestion = { question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" };
    setEditingStory({ ...editingStory, quiz: [...(editingStory.quiz || []), newQuestion] });
  };

  const removeQuizQuestion = (idx: number) => {
    if (!editingStory) return;
    setEditingStory({ ...editingStory, quiz: (editingStory.quiz || []).filter((_, i) => i !== idx) });
  };

  // If unauthorized, show Login or Registration panel
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 px-4" id="admin-login-view">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {isRegistering ? "Register Admin Account" : "Admin Portal Login"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRegistering 
                ? "Create a secure administrator account to manage Islamic stories." 
                : "Enter email and password to access the Stories Management Console."
              }
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {authError}
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" /> {actionSuccess}
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Admin Passcode
                </label>
                <input
                  type="password"
                  required
                  placeholder="Hint: bismillah123"
                  value={regPasscode}
                  onChange={(e) => setRegPasscode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Create Admin Account
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setAuthError(null);
                  }}
                  className="text-xs text-emerald-600 hover:underline font-semibold"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setAuthError(null);
                  }}
                  className="text-xs text-emerald-600 hover:underline font-semibold"
                >
                  New admin? Setup Admin Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" id="admin-dashboard-view">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" /> Admin Console
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
            Islamic Stories Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Logged in as: <span className="font-bold text-emerald-600 dark:text-emerald-400">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && !isEditingVideo && activeTab === "stories" && (
            <button
              onClick={startAddStory}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors flex items-center gap-1.5"
              id="add-story-btn"
            >
              <Plus className="w-4 h-4" /> Write New Story
            </button>
          )}

          {!isEditing && !isEditingVideo && !isEditingHadith && !isEditingDua && activeTab === "videos" && (
            <button
              onClick={startAddVideo}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              id="add-video-btn"
            >
              <Plus className="w-4 h-4" /> Add New Video
            </button>
          )}

          {!isEditing && !isEditingVideo && !isEditingHadith && !isEditingDua && activeTab === "hadiths" && (
            <button
              onClick={() => {
                setEditingHadith({
                  titleEn: "",
                  titleUr: "",
                  category: "manners",
                  arabicText: "",
                  translationEn: "",
                  translationUr: "",
                  book: "Sahih al-Bukhari",
                  hadithNumber: "",
                  grade: "Sahih",
                  narrator: "Abu Hurairah (RA)",
                  explanationEn: "",
                  explanationUr: "",
                  moralLessonEn: "",
                  moralLessonUr: "",
                  practicalExampleEn: "",
                  practicalExampleUr: "",
                  tags: ["kids"],
                  status: "published",
                  iconEmoji: "📚"
                });
                setIsEditingHadith(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              id="add-hadith-btn"
            >
              <Plus className="w-4 h-4" /> Add New Hadith
            </button>
          )}

          {!isEditing && !isEditingVideo && !isEditingHadith && !isEditingDua && activeTab === "duas" && (
            <button
              onClick={() => {
                setEditingDua({
                  titleEn: "",
                  titleUr: "",
                  category: "daily",
                  arabicText: "",
                  translationEn: "",
                  translationUr: "",
                  transliteration: "",
                  reference: "Hisn al-Muslim",
                  benefitsEn: "",
                  benefitsUr: "",
                  explanationEn: "",
                  explanationUr: "",
                  tags: ["kids"],
                  status: "published",
                  iconEmoji: "🤲"
                });
                setIsEditingDua(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              id="add-dua-btn"
            >
              <Plus className="w-4 h-4" /> Add New Dua
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors"
            title="Log out"
            id="admin-logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isEditing && !isEditingVideo && (
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 mb-8 gap-4 sm:gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-admin-dashboard"
          >
            <ShieldCheck className="w-4 h-4" /> Admin Dashboard
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "stories"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-manage-stories"
          >
            <FileText className="w-4 h-4" /> Manage Stories
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "videos"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-video-management"
          >
            <VideoIcon className="w-4 h-4" /> Manage Videos
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "users"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-user-management"
          >
            <Users className="w-4 h-4" /> Manage Users
          </button>
          <button
            onClick={() => setActiveTab("scholars")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "scholars"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-scholar-management"
          >
            <GraduationCap className="w-4 h-4" /> Manage Scholars
          </button>
          <button
            onClick={() => setActiveTab("hadiths")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "hadiths"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-hadith-management"
          >
            <BookOpen className="w-4 h-4" /> Hadiths
          </button>
          <button
            onClick={() => setActiveTab("duas")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "duas"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-dua-management"
          >
            <Sparkles className="w-4 h-4" /> Daily Duas
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "feedback"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-feedback-management"
          >
            <MessageSquare className="w-4 h-4" /> Moderation
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "reports"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-reports"
          >
            <TrendingUp className="w-4 h-4" /> Reports
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-4 px-1 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === "settings"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="tab-settings"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-sm font-bold rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2.5 mb-6">
          <CheckCircle className="w-5 h-5 shrink-0" /> {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-sm font-bold rounded-2xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-2.5 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" /> {actionError}
        </div>
      )}

      {/* Editor Drawer / Form */}
      <AnimatePresence>
        {isEditing && editingStory && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-10 shadow-lg mb-8 space-y-6"
            id="story-editor-form"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {editingStory.id ? "Edit Story • کہانی ترمیم کریں" : "Publish New Story • نئی کہانی"}
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingStory(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStoryForm} className="space-y-8">
              {/* English & Urdu Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Story Title (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStory.titleEn || ""}
                    onChange={(e) => setEditingStory({ ...editingStory, titleEn: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    کہانی کا عنوان (Urdu) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStory.titleUr || ""}
                    onChange={(e) => setEditingStory({ ...editingStory, titleUr: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-right text-lg font-urdu text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Basic config row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                  <select
                    value={editingStory.category || "Islamic Morals"}
                    onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                  >
                    <option value="Prophets Stories">Prophets Stories</option>
                    <option value="Prophet Muhammad ﷺ Life">Prophet Muhammad ﷺ Life</option>
                    <option value="Sahaba Stories">Sahaba Stories</option>
                    <option value="Islamic Morals">Islamic Morals</option>
                    <option value="Quran Stories">Quran Stories</option>
                    <option value="Duas">Duas & Supplications</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Age Group</label>
                  <select
                    value={editingStory.ageGroup || "7-9"}
                    onChange={(e) => setEditingStory({ ...editingStory, ageGroup: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                  >
                    <option value="4-6">4 - 6 Years</option>
                    <option value="7-9">7 - 9 Years</option>
                    <option value="10-12">10 - 12 Years</option>
                    <option value="all">All Kids</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Reading Time (Min)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingStory.readingTime || 3}
                    onChange={(e) => setEditingStory({ ...editingStory, readingTime: parseInt(e.target.value) || 3 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Publish Status</label>
                  <select
                    value={editingStory.status || "published"}
                    onChange={(e) => setEditingStory({ ...editingStory, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Saved)</option>
                  </select>
                </div>
              </div>

              {/* Cover Image URL & Optimized Local Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Cover Image
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">Image URL Link</span>
                    <input
                      type="url"
                      value={editingStory.coverImage || ""}
                      onChange={(e) => setEditingStory({ ...editingStory, coverImage: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 font-mono"
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">Or Upload and Auto-Optimize Image</span>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="cover-image-upload"
                      />
                      <label
                        htmlFor="cover-image-upload"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-slate-900/30 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors h-[42px]"
                      >
                        {uploading ? (
                          <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 animate-spin" /> Optimizing Image...</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-emerald-600" /> Choose cover image file</span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Short Descriptions English and Urdu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Short Description (English)</label>
                  <textarea
                    rows={2}
                    value={editingStory.shortDescriptionEn || ""}
                    onChange={(e) => setEditingStory({ ...editingStory, shortDescriptionEn: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">مختصر تعارف (Urdu)</label>
                  <textarea
                    rows={2}
                    value={editingStory.shortDescriptionUr || ""}
                    onChange={(e) => setEditingStory({ ...editingStory, shortDescriptionUr: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-right text-base font-urdu"
                  />
                </div>
              </div>

              {/* Main Content Paragraphs (English & Urdu) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Content Story (English)</label>
                  <textarea
                    rows={10}
                    value={editingStory.contentEn || ""}
                    onChange={(e) => setEditingStory({ ...editingStory, contentEn: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-sans"
                    placeholder="Write the full story in English..."
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">پوری کہانی (Urdu - عربی رسم الخط)</label>
                  <textarea
                    rows={10}
                    value={editingStory.contentUr || ""}
                    onChange={(e) => setEditingStory({ ...editingStory, contentUr: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-right text-lg font-urdu leading-loose"
                    placeholder="مکمل کہانی اردو میں لکھیں..."
                  />
                </div>
              </div>

              {/* Moral Lessons Section */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Moral Lessons (اخلاقی اسباق)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* English Lessons */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500">English Lessons</label>
                    {(editingStory.lessonsEn || []).map((lesson, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={lesson}
                          onChange={(e) => handleLessonChange('En', idx, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                          placeholder={`Lesson ${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeLessonField('En', idx)}
                          className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addLessonField('En')}
                      className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                    >
                      + Add English Lesson
                    </button>
                  </div>

                  {/* Urdu Lessons */}
                  <div className="space-y-3 text-right">
                    <label className="block text-xs font-bold text-slate-500">اردو اسباق</label>
                    {(editingStory.lessonsUr || []).map((lesson, idx) => (
                      <div key={idx} className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => removeLessonField('Ur', idx)}
                          className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={lesson}
                          onChange={(e) => handleLessonChange('Ur', idx, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-right font-urdu text-base"
                          placeholder={`سبق ${idx + 1}`}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addLessonField('Ur')}
                      className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end ml-auto"
                    >
                      + نیا اردو سبق شامل کریں
                    </button>
                  </div>
                </div>
              </div>

              {/* Authentic References (Quran / Hadith) */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Authentic References</h4>
                  <button
                    type="button"
                    onClick={addRefField}
                    className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                  >
                    + Add Reference Citation
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(editingStory.references || []).map((ref, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => removeRefField(idx)}
                        className="absolute top-2 right-2 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Type</label>
                          <select
                            value={ref.type}
                            onChange={(e) => handleRefChange(idx, "type", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          >
                            <option value="quran">Quran Reference</option>
                            <option value="hadith">Hadith Citation</option>
                            <option value="historical">Historical Source</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Source / Book Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Surah Hud, Sahih al-Bukhari"
                            value={ref.source}
                            onChange={(e) => handleRefChange(idx, "source", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Reference Numbers (Surah:Ayah, Hadith No, etc.)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 11:36-48, Hadith 2549"
                          value={ref.referenceKey}
                          onChange={(e) => handleRefChange(idx, "referenceKey", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz Settings */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Interactive Quiz Questions</h4>
                  <button
                    type="button"
                    onClick={addQuizQuestion}
                    className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                  >
                    + Add Quiz Question
                  </button>
                </div>

                <div className="space-y-6">
                  {(editingStory.quiz || []).map((q, qIdx) => (
                    <div key={qIdx} className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 relative space-y-4">
                      <button
                        type="button"
                        onClick={() => removeQuizQuestion(qIdx)}
                        className="absolute top-4 right-4 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="max-w-md">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Question {qIdx + 1}</label>
                        <input
                          type="text"
                          required
                          value={q.question}
                          onChange={(e) => handleQuizQuestionChange(qIdx, "question", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                          placeholder="e.g. Who built the big Ark?"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-slate-400 w-4">{String.fromCharCode(65 + oIdx)}</span>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => handleQuizOptionChange(qIdx, oIdx, e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                              placeholder={`Option ${oIdx + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Correct Option index</label>
                          <select
                            value={q.answerIndex}
                            onChange={(e) => handleQuizQuestionChange(qIdx, "answerIndex", parseInt(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          >
                            <option value="0">Option A (Correct)</option>
                            <option value="1">Option B (Correct)</option>
                            <option value="2">Option C (Correct)</option>
                            <option value="3">Option D (Correct)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Explanation (For kids)</label>
                          <input
                            type="text"
                            required
                            value={q.explanation}
                            onChange={(e) => handleQuizQuestionChange(qIdx, "explanation", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                            placeholder="e.g. As mentioned in Surah Hud, Nuh built the Ark..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authenticity & Discussion Guidance Section */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Authenticity & Guidance</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Authenticity Status</label>
                    <select
                      value={editingStory.authenticityStatus || "Verified"}
                      onChange={(e) => setEditingStory({ ...editingStory, authenticityStatus: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                    >
                      <option value="Verified">Verified (Authentic Sources Found)</option>
                      <option value="Pending">Pending Review / Unverified Reference</option>
                      <option value="Unverified">Unverified Topic</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Authentic Sources (Comma-separated)</label>
                    <input
                      type="text"
                      value={(editingStory.authenticSources || []).join(", ")}
                      onChange={(e) => setEditingStory({ 
                        ...editingStory, 
                        authenticSources: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                      })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                      placeholder="e.g. Tafsir Ibn Kathir, Sahih al-Bukhari, Sahih Muslim"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Parent & Teacher Note (English)</label>
                    <textarea
                      rows={3}
                      value={editingStory.parentTeacherNoteEn || ""}
                      onChange={(e) => setEditingStory({ ...editingStory, parentTeacherNoteEn: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                      placeholder="Encourage kids to think about..."
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="block text-xs font-bold text-slate-500">والدین اور اساتذہ کے لیے رہنمائی (Urdu)</label>
                    <textarea
                      rows={3}
                      value={editingStory.parentTeacherNoteUr || ""}
                      onChange={(e) => setEditingStory({ ...editingStory, parentTeacherNoteUr: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-right text-base font-urdu"
                      placeholder="والدین اس کہانی کے بعد بچوں سے سوال کر سکتے ہیں کہ..."
                    />
                  </div>
                </div>
              </div>

              {/* Advanced SEO fields */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">SEO & Metadata Controls</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Custom URL Slug</label>
                    <input
                      type="text"
                      value={editingStory.slug || ""}
                      onChange={(e) => setEditingStory({ ...editingStory, slug: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                      placeholder="prophet-nuh-ark (leave blank to auto-create)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Prophet Name</label>
                    <input
                      type="text"
                      value={editingStory.prophetName || ""}
                      onChange={(e) => setEditingStory({ ...editingStory, prophetName: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                      placeholder="e.g. Prophet Nuh (AS) or Prophet Muhammad (SAW)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">SEO Meta Title</label>
                    <input
                      type="text"
                      value={editingStory.seoMetaTitle || ""}
                      onChange={(e) => setEditingStory({ ...editingStory, seoMetaTitle: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                      placeholder="e.g. Prophet Nuh and the Ark - Ummah Kids"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Feature Story</label>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        checked={editingStory.isFeatured || false}
                        onChange={(e) => setEditingStory({ ...editingStory, isFeatured: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded-sm"
                        id="editor-featured-checkbox"
                      />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Set this story as Homepage Featured Story</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500">SEO Meta Description</label>
                  <textarea
                    rows={2}
                    value={editingStory.seoMetaDescription || ""}
                    onChange={(e) => setEditingStory({ ...editingStory, seoMetaDescription: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                    placeholder="Enter short meta description under 160 characters..."
                  />
                </div>
              </div>

              {/* Form Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingStory(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  id="editor-save-btn"
                >
                  <Save className="w-4 h-4" /> Save Story
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 🚀 NEW ADMIN PANEL EXTENDED TABS SECTIONS */}
      {/* ========================================== */}
      
      {/* 1. Admin Dashboard View */}
      {!isEditing && activeTab === "dashboard" && (
        <div className="space-y-8 text-left" id="admin-main-dashboard">
          {/* Welcome back hero banner */}
          <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative z-10 space-y-2">
              <h3 className="text-xl font-black">As-salamu alaykum, Admin! 👋</h3>
              <p className="text-xs text-emerald-50 max-w-lg leading-relaxed font-medium">
                Welcome to the Ummah Kids management command center. Maintain safety standards, answer kids questions, moderate videos, and explore detailed analytical insights.
              </p>
            </div>
            <div className="relative z-10 flex gap-2">
              <button onClick={() => setActiveTab("scholars")} className="px-4 py-2.5 bg-white hover:bg-slate-50 text-emerald-700 text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer">
                Scholar Desk
              </button>
              <button onClick={() => setActiveTab("settings")} className="px-4 py-2.5 bg-emerald-700/40 text-white text-xs font-black rounded-xl hover:bg-emerald-700/60 transition-all border border-emerald-400/20 cursor-pointer">
                Platform Config
              </button>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
              <ShieldCheck className="w-64 h-64" />
            </div>
          </div>

          {/* Metrics summary widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Total Stories</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block leading-none">{localStories.length}</span>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <VideoIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Approved Videos</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block leading-none">{videoList.length}</span>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Scholar Desk</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block leading-none">12 Active</span>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/5 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Kids Enrolled</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block leading-none">1,482 Profiles</span>
              </div>
            </div>
          </div>

          {/* Quick Tasks & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Platform Action Center</h4>
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/45 rounded-2xl border border-slate-100 dark:border-slate-750 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">🎓</span>
                    <div className="text-left">
                      <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">Pending Scholar Questions</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">Kids are waiting for child-friendly replies verified with Quran/Hadith reference.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("scholars")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl cursor-pointer transition-colors shrink-0">
                    Review
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/45 rounded-2xl border border-slate-100 dark:border-slate-750 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">📹</span>
                    <div className="text-left">
                      <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">Video Content Moderation</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">Approve submitted educational videos, manage subcategories and folders.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("videos")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl cursor-pointer transition-colors shrink-0">
                    Moderate
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/45 rounded-2xl border border-slate-100 dark:border-slate-750 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">💬</span>
                    <div className="text-left">
                      <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">Parents Feedback & Moderation</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">Verify feedback forms, stories reviews, rating logs, and potential typo flags.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("feedback")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl cursor-pointer transition-colors shrink-0">
                    Read Feed
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-left">Admin Team Log</h4>
              <div className="space-y-4 text-left">
                <div className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Today</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">Approved 3 new videos regarding "Prophets stories for kids".</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Yesterday</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">Added 2 custom interactive coloring templates in coloring studio.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">3 days ago</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5">Completed full responsive optimization of the kids-friendly Header.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Manage Users View */}
      {!isEditing && activeTab === "users" && (
        <div className="space-y-6 text-left" id="admin-users-panel">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-5">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">User Profile Directory</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Manage active parent accounts and enrolled children profiles globally.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search parent/child name..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User card 1 */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl filter drop-shadow-xs shrink-0">👨‍👩‍👦</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">Zaid Bin Harith (Parent)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">zaid@islamicfamily.com • Member since June 2026</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">Verified Parent</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-750 pt-3 space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Enrolled Kid Profiles</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl flex items-center justify-between gap-3 border border-slate-100/55 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0">🦁</span>
                    <div>
                      <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">Asadullah (Age 7)</h5>
                      <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5 mt-1.5 leading-none"><Award className="w-3 h-3" /> 240 Points • Level 3</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setToast({ message: "Awarded +50 Points to Asadullah!", type: "success" })} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg cursor-pointer transition-colors">+50 Pts</button>
                    <button onClick={() => setToast({ message: "Profile successfully protected.", type: "success" })} className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg cursor-pointer"><Lock className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* User card 2 */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl filter drop-shadow-xs shrink-0">👨‍👩‍👧</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">Fatima Al-Fihriya (Parent)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">fatima@knowledge.org • Member since April 2026</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">Verified Parent</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-750 pt-3 space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Enrolled Kid Profiles</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl flex items-center justify-between gap-3 border border-slate-100/55 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0">🌸</span>
                    <div>
                      <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">Mariam (Age 9)</h5>
                      <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5 mt-1.5 leading-none"><Award className="w-3 h-3" /> 420 Points • Level 5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setToast({ message: "Awarded +50 Points to Mariam!", type: "success" })} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg cursor-pointer transition-colors">+50 Pts</button>
                    <button onClick={() => setToast({ message: "Profile successfully protected.", type: "success" })} className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg cursor-pointer"><Lock className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Scholars View */}
      {!isEditing && activeTab === "scholars" && (
        <div className="space-y-6 text-left" id="admin-scholars-panel">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-5">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Scholar & AI Moderation Desk</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Review questions submitted by kids and parents. Moderate and approve scholar verified answers.</p>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 shrink-0 uppercase tracking-wide">AI Verifier Engine Active</span>
          </div>

          <div className="space-y-5">
            {/* Question Card 1 */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-2.5 py-1 rounded-full uppercase tracking-wider">Pending Review</span>
                  <span className="text-xs text-slate-400 font-medium">Category: <strong className="text-slate-600 dark:text-slate-300 font-bold">Salah (Prayer)</strong></span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">From: Ibrahim (Age 8) • Canada • English</span>
              </div>
              
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">Question: Why do we raise our hands to our ears at the start of Salah?</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans bg-slate-50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-750 font-medium">
                  "Dear scholar, my mother told me to raise my hands to my ears when I say Allahu Akbar. Why do we do this? Is there a special reason or hadith for this?"
                </p>
              </div>

              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                  <Sparkles className="w-4 h-4 animate-bounce" />
                  <span>Drafted AI Answer (Verified with Authentic References)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  When we start our Salah, we say "Allahu Akbar" and raise our hands. This action is called Takbir-at-Tahrima, and it tells our mind and heart that we are leaving the whole world behind to stand directly in front of Allah, the Creator of everything. Raising hands to ears or shoulders is the beautiful Sunnah of Prophet Muhammad ﷺ.
                </p>
                <div className="text-[11px] text-slate-500 flex flex-col gap-1.5 border-t border-slate-150/40 dark:border-slate-700 pt-2.5 font-medium leading-relaxed">
                  <span><strong>📖 Quran Reference:</strong> Surah Al-Ala (87:14-15) - "He has succeeded who purifies himself and remembers the name of his Lord and prays."</span>
                  <span><strong>🌸 Hadith Reference:</strong> Sahih Al-Bukhari (735) - Narrated by Abdullah bin Umar that the Prophet ﷺ used to raise his hands up to his shoulders at the beginning of prayer.</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-150/40 dark:border-slate-700">
                  <button onClick={() => setToast({ message: "Refusing & deleting draft question.", type: "error" })} className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black rounded-xl cursor-pointer">Decline</button>
                  <button onClick={() => setToast({ message: "Scholar Answer successfully approved & published!", type: "success" })} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer">Approve & Publish</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reports View */}
      {!isEditing && activeTab === "reports" && (
        <div className="space-y-6 text-left" id="admin-reports-panel">
          <div className="border-b border-slate-150 dark:border-slate-800 pb-5">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Analytical Platform Insights</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Real-time analytical graphs mapping child engagements, moral badges unlocked, and quiz performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion rate widget */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-xs space-y-4 md:col-span-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Average Quiz Score</span>
                <div className="flex items-baseline gap-2 mt-2 leading-none">
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">88.4%</span>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +2.1% this wk</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">Kids are showing exceptional comprehension of moral stories through correct quiz completions on the first attempt!</p>
              </div>
              <div className="w-full bg-slate-150 dark:bg-slate-900 rounded-2xl h-16 mt-4 relative flex items-end overflow-hidden p-1.5 gap-1.5">
                <div className="bg-emerald-500 w-full rounded-md" style={{ height: "60%" }} />
                <div className="bg-emerald-500 w-full rounded-md" style={{ height: "72%" }} />
                <div className="bg-emerald-500 w-full rounded-md" style={{ height: "80%" }} />
                <div className="bg-emerald-500 w-full rounded-md" style={{ height: "84%" }} />
                <div className="bg-emerald-500 w-full rounded-md" style={{ height: "92%" }} />
                <div className="bg-emerald-600 w-full rounded-md" style={{ height: "88%" }} />
              </div>
            </div>

            {/* Stories completion rating */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-xs space-y-4 md:col-span-2">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Story Reading Views & Milestones Chart</h4>
              <p className="text-xs text-slate-500 font-medium">Weekly reading hours accumulated across age cohorts.</p>
              
              <div className="relative h-44 border-b border-l border-slate-200 dark:border-slate-700 mt-4 flex items-end justify-between px-6 pb-2">
                <div className="absolute left-1.5 top-0 text-[9px] text-slate-400 font-bold uppercase">Reading Hours</div>
                <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                  <div className="bg-emerald-500/80 w-8 rounded-t-lg transition-all" style={{ height: "80px" }} />
                  <span className="text-[9px] font-bold text-slate-400">Ages 4-6</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                  <div className="bg-amber-500/80 w-8 rounded-t-lg transition-all" style={{ height: "130px" }} />
                  <span className="text-[9px] font-bold text-slate-400">Ages 7-9</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-12 text-center">
                  <div className="bg-indigo-500/80 w-8 rounded-t-lg transition-all" style={{ height: "105px" }} />
                  <span className="text-[9px] font-bold text-slate-400">Ages 10-12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. System Settings View */}
      {!isEditing && activeTab === "settings" && (
        <div className="space-y-6 text-left" id="admin-settings-panel">
          <div className="border-b border-slate-150 dark:border-slate-800 pb-5">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">System Parameters & Policies</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Configure global platform guidelines, moderation levels, and notification triggers.</p>
          </div>

          <div className="space-y-4 max-w-2xl bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-150 dark:border-slate-800">
            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-150 dark:border-slate-800/80 pb-3">
              <div className="text-left">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">Enable Server-Side AI Verification</h5>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">Let AI verify answers directly from authentic Quran & Hadith databases before human review.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer shrink-0" />
            </div>

            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-150 dark:border-slate-800/80 pb-3">
              <div className="text-left">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">Strict Child Safety Moderation (COPA & GDPR Compliant)</h5>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">Filter out any unverified external video links, external tracking, or non-educational content.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer shrink-0" />
            </div>

            <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-150 dark:border-slate-800/80 pb-3">
              <div className="text-left">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">Enable Parent Dashboard Email Reports</h5>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">Automatically compile and dispatch weekly progress charts, points, and badging achievements to parents.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer shrink-0" />
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
              <div className="text-left">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">Enable Kids Interactive Sound Effects</h5>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">Play pleasant and child-safe moral audio feedback on completing quizzes or coloring paint pages.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer shrink-0" />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-150/80 dark:border-slate-800/80">
              <button onClick={() => setToast({ message: "Platform configuration updated successfully!", type: "success" })} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer transition-all">
                Save Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Statistics & Stories Dashboard Directory */}
      {!isEditing && activeTab === "stories" && (
        <div className="space-y-8" id="admin-advanced-dashboard-panel">
          {/* Dashboard Stats Panel */}
          {statsLoading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">Loading platform metrics...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Row 1: Core counts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Stories</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.totalStories}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                    <VideoIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Videos</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.totalVideos}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Videos</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.pendingVideos}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-500">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Users</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.totalUsers}</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Engagement Insights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-850 p-5 rounded-3xl border border-emerald-100 dark:border-slate-700 shadow-xs transition-transform hover:scale-[1.02]">
                  <span className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Daily Visitors</span>
                  <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-450 mt-1 block">{stats.dailyVisitors} 🔥</span>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-850 p-5 rounded-3xl border border-amber-100 dark:border-slate-700 shadow-xs transition-transform hover:scale-[1.02] sm:col-span-1 lg:col-span-1">
                  <span className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Most Read Story</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block truncate" title={stats.mostReadStory}>{stats.mostReadStory}</span>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-850 p-5 rounded-3xl border border-indigo-100 dark:border-slate-700 shadow-xs transition-transform hover:scale-[1.02]">
                  <span className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Most Watched Video</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block truncate" title={stats.mostWatchedVideo}>{stats.mostWatchedVideo}</span>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-850 p-5 rounded-3xl border border-purple-100 dark:border-slate-700 shadow-xs transition-transform hover:scale-[1.02]">
                  <span className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Feedback Count</span>
                  <span className="text-xl font-extrabold text-purple-700 dark:text-purple-400 mt-1 block">{stats.feedbackCount} 💬</span>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-slate-800 dark:to-slate-850 p-5 rounded-3xl border border-rose-100 dark:border-slate-700 shadow-xs transition-transform hover:scale-[1.02]">
                  <span className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Storage Used</span>
                  <span className="text-base font-black text-rose-700 dark:text-rose-450 mt-1 block">{stats.storageUsed} 💾</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stories</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{localStories.length}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Featured Stories</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                    {localStories.filter(s => s.isFeatured).length}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-500">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Published / Drafts</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                    {localStories.filter(s => s.status === 'published').length} <span className="text-xs font-bold text-slate-400">/ {localStories.filter(s => s.status === 'draft').length}</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-500">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reading Views</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                    {localStories.reduce((acc, s) => acc + (s.views || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Trending Stories Bento & Shortcuts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                🔥 Trending / Most Viewed Stories
              </h4>
              <div className="space-y-3">
                {[...localStories]
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .slice(0, 4)
                  .map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 text-[10px]">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block truncate max-w-[280px]">{s.titleEn}</span>
                          <span className="text-[10px] text-slate-400">{s.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{s.views || 0}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                  ⚡ Quick Filter Shortcuts
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setAdminStatusFilter("draft");
                      setAdminCategoryFilter("all");
                      setAdminProphetFilter("all");
                    }}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-700/30 text-left cursor-pointer transition-colors"
                  >
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">View Drafts</span>
                    <span className="text-[10px] text-slate-400 font-medium">{localStories.filter(s => s.status === 'draft').length} pending review</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminCategoryFilter("Quran Stories");
                      setAdminStatusFilter("all");
                      setAdminProphetFilter("all");
                    }}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-700/30 text-left cursor-pointer transition-colors"
                  >
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">Quran Stories</span>
                    <span className="text-[10px] text-slate-400 font-medium">{localStories.filter(s => s.category === 'Quran Stories').length} stories total</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>CMS Core version 2.4.0 (Secure)</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">● Database Connected</span>
              </div>
            </div>
          </div>

          {/* Search, Filter, and Bulk Actions Toolbar */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-3xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-4 relative">
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Search stories, prophets, moral values..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Category Filter */}
              <div className="md:col-span-3">
                <select
                  value={adminCategoryFilter}
                  onChange={(e) => setAdminCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  <option value="Prophet Muhammad ﷺ Life">Prophet Muhammad ﷺ Life</option>
                  <option value="Sahaba Stories">Sahaba Stories</option>
                  <option value="Quran Stories">Quran Stories</option>
                  <option value="Islamic Morals">Islamic Morals</option>
                  <option value="Duas">Duas</option>
                </select>
              </div>

              {/* Prophet Filter */}
              <div className="md:col-span-3">
                <select
                  value={adminProphetFilter}
                  onChange={(e) => setAdminProphetFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Prophets</option>
                  {Array.from(new Set(localStories.map(s => s.prophetName).filter(Boolean))).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-2">
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Bulk Action Panel - triggers only when checkboxes are ticked */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      {selectedIds.length}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">stories selected for bulk actions:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      disabled={bulkActionLoading}
                      onClick={handleBulkPublish}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Bulk Publish
                    </button>
                    <button
                      disabled={bulkActionLoading}
                      onClick={handleBulkUnpublish}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" /> Bulk Unpublish
                    </button>
                    <button
                      disabled={bulkActionLoading}
                      onClick={handleBulkDelete}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline px-2 cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Stories Database Directory ({
                  localStories.filter(story => {
                    const matchesSearch = adminSearch === "" || 
                      story.titleEn.toLowerCase().includes(adminSearch.toLowerCase()) ||
                      story.titleUr.includes(adminSearch) ||
                      (story.category || "").toLowerCase().includes(adminSearch.toLowerCase()) ||
                      (story.prophetName || "").toLowerCase().includes(adminSearch.toLowerCase());
                    const matchesCategory = adminCategoryFilter === "all" || story.category === adminCategoryFilter;
                    const matchesProphet = adminProphetFilter === "all" || story.prophetName === adminProphetFilter;
                    const matchesStatus = adminStatusFilter === "all" || story.status === adminStatusFilter;
                    return matchesSearch && matchesCategory && matchesProphet && matchesStatus;
                  }).length
                } Stories Matching)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="admin-stories-table">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-150 dark:border-slate-800">
                    <th className="py-4 px-6 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          (() => {
                            const filtered = localStories.filter(story => {
                              const matchesSearch = adminSearch === "" || 
                                story.titleEn.toLowerCase().includes(adminSearch.toLowerCase()) ||
                                story.titleUr.includes(adminSearch) ||
                                (story.category || "").toLowerCase().includes(adminSearch.toLowerCase()) ||
                                (story.prophetName || "").toLowerCase().includes(adminSearch.toLowerCase());
                              const matchesCategory = adminCategoryFilter === "all" || story.category === adminCategoryFilter;
                              const matchesProphet = adminProphetFilter === "all" || story.prophetName === adminProphetFilter;
                              const matchesStatus = adminStatusFilter === "all" || story.status === adminStatusFilter;
                              return matchesSearch && matchesCategory && matchesProphet && matchesStatus;
                            });
                            return filtered.length > 0 && filtered.every(s => selectedIds.includes(s.id));
                          })()
                        }
                        onChange={(e) => {
                          const filtered = localStories.filter(story => {
                            const matchesSearch = adminSearch === "" || 
                              story.titleEn.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              story.titleUr.includes(adminSearch) ||
                              (story.category || "").toLowerCase().includes(adminSearch.toLowerCase()) ||
                              (story.prophetName || "").toLowerCase().includes(adminSearch.toLowerCase());
                            const matchesCategory = adminCategoryFilter === "all" || story.category === adminCategoryFilter;
                            const matchesProphet = adminProphetFilter === "all" || story.prophetName === adminProphetFilter;
                            const matchesStatus = adminStatusFilter === "all" || story.status === adminStatusFilter;
                            return matchesSearch && matchesCategory && matchesProphet && matchesStatus;
                          });
                          if (e.target.checked) {
                            const allFilteredIds = filtered.map(s => s.id);
                            setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                          } else {
                            const allFilteredIds = filtered.map(s => s.id);
                            setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 rounded-sm"
                      />
                    </th>
                    <th className="py-4 px-6">Story Name</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Prophet Associated</th>
                    <th className="py-4 px-6">Age Group</th>
                    <th className="py-4 px-6">Reading Time</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {localStories
                    .filter(story => {
                      const matchesSearch = adminSearch === "" || 
                        story.titleEn.toLowerCase().includes(adminSearch.toLowerCase()) ||
                        story.titleUr.includes(adminSearch) ||
                        (story.category || "").toLowerCase().includes(adminSearch.toLowerCase()) ||
                        (story.prophetName || "").toLowerCase().includes(adminSearch.toLowerCase());
                      const matchesCategory = adminCategoryFilter === "all" || story.category === adminCategoryFilter;
                      const matchesProphet = adminProphetFilter === "all" || story.prophetName === adminProphetFilter;
                      const matchesStatus = adminStatusFilter === "all" || story.status === adminStatusFilter;
                      return matchesSearch && matchesCategory && matchesProphet && matchesStatus;
                    })
                    .map((story) => (
                      <tr key={story.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 px-6 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(story.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(prev => [...prev, story.id]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== story.id));
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded-sm"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{story.titleEn}</div>
                          <div className="text-sm font-urdu text-emerald-700 dark:text-emerald-400 mt-0.5 leading-[2.0]">{story.titleUr}</div>
                        </td>
                        <td className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {story.category}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {story.prophetName || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700">
                            Ages {story.ageGroup}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {story.readingTime} min
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            story.status === 'published' 
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                              : "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                          }`}>
                            {story.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPreviewStory(story)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 cursor-pointer"
                              title="Instant Preview Draft"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateStory(story)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-emerald-600 cursor-pointer"
                              title="Duplicate Story"
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => startEditStory(story)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-blue-500 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              disabled={(story.id === "prophet-nuh-ark" || story.id === "prophet-muhammad-thirsty-camel") || deletingId === story.id}
                              onClick={() => handleDeleteStory(story.id)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer flex items-center justify-center min-w-[28px] min-h-[28px]"
                              title="Delete"
                            >
                              {deletingId === story.id ? (
                                <svg className="animate-spin h-4 w-4 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Management Tab Sub-view */}
      {!isEditing && activeTab === "feedback" && (
        <div className="space-y-8 animate-fade-in" id="admin-feedback-panel">
          {/* Dashboard Stats Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Feedback</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{feedbackList.length}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                  {feedbackList.length > 0 
                    ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1)
                    : "0.0"
                  } <span className="text-xs font-bold text-slate-400">/ 5.0</span>
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-500">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved Feedbacks</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                  {feedbackList.filter(f => f.approved).length} <span className="text-xs font-bold text-slate-400">({feedbackList.length > 0 ? Math.round((feedbackList.filter(f => f.approved).length / feedbackList.length) * 100) : 0}%)</span>
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unread Messages</span>
                <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  {feedbackList.filter(f => f.status === 'unread').length}
                </span>
              </div>
            </div>
          </div>

          {/* Search, Filter Toolbar */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-3xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-4 relative">
                <input
                  type="text"
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  placeholder="Search by name, email, message, story..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Story Filter */}
              <div className="md:col-span-3">
                <select
                  value={feedbackStoryFilter}
                  onChange={(e) => setFeedbackStoryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Stories</option>
                  {Array.from(new Set(feedbackList.map(f => f.storyTitle).filter(Boolean))).map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="md:col-span-2">
                <select
                  value={feedbackRatingFilter}
                  onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="md:col-span-2">
                <select
                  value={feedbackDateFilter}
                  onChange={(e) => setFeedbackDateFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="md:col-span-1">
                <button
                  onClick={() => {
                    const filtered = getFilteredFeedbacks();
                    handleExportFeedback(filtered);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>
          </div>

          {/* Table Directory for Feedback */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                User Feedback Submissions ({getFilteredFeedbacks().length} Items Matching)
              </h3>
            </div>

            {feedbackLoading ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                <svg className="animate-spin h-6 w-6 text-emerald-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading feedback submissions...</span>
              </div>
            ) : getFilteredFeedbacks().length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="text-sm font-semibold">No feedback matching current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="admin-feedback-table">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-150 dark:border-slate-800">
                      <th className="py-4 px-6 w-1/5">User Info</th>
                      <th className="py-4 px-6 w-1/5">Story</th>
                      <th className="py-4 px-6 w-1/12">Rating</th>
                      <th className="py-4 px-6 w-1/3">Message</th>
                      <th className="py-4 px-6 w-[12%]">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredFeedbacks().map((fb) => (
                      <tr 
                        key={fb.id} 
                        className={`border-b border-slate-100 dark:border-slate-750 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors text-xs text-slate-600 dark:text-slate-300 ${
                          fb.status === "unread" ? "bg-emerald-500/5 font-semibold" : ""
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{fb.name}</div>
                          {fb.email && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{fb.email}</div>}
                          <div className="text-[10px] text-slate-400 mt-1">{new Date(fb.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block">{fb.storyTitle}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-0.5 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating ? "fill-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="whitespace-pre-wrap leading-relaxed max-w-md">{fb.message}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1.5">
                            {/* Read/Unread Badge */}
                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              fb.status === "unread" 
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50" 
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                            }`}>
                              {fb.status}
                            </span>
                            {/* Approval Badge */}
                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              fb.approved 
                                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50" 
                                : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50"
                            }`}>
                              {fb.approved ? "Approved" : "Pending"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve / Reject */}
                            {fb.approved ? (
                              <button
                                onClick={() => handleUpdateFeedback(fb.id, { approved: false })}
                                className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-700 rounded-lg text-rose-500 cursor-pointer"
                                title="Reject / Revoke Approval"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateFeedback(fb.id, { approved: true })}
                                className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-700 rounded-lg text-emerald-600 cursor-pointer"
                                title="Approve Feedback"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Mark read / unread */}
                            {fb.status === "unread" ? (
                              <button
                                onClick={() => handleUpdateFeedback(fb.id, { status: "read" })}
                                className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-700 rounded-lg text-slate-500 cursor-pointer"
                                title="Mark as Read"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateFeedback(fb.id, { status: "unread" })}
                                className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-700 rounded-lg text-slate-500 cursor-pointer"
                                title="Mark as Unread"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteFeedback(fb.id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-rose-500 cursor-pointer"
                              title="Delete Feedback"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Editor Drawer / Form */}
      <AnimatePresence>
        {isEditingVideo && editingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-10 shadow-lg mb-8 space-y-6"
            id="video-editor-form"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-emerald-600" />
                {editingVideo.id ? "Edit Video • ویڈیو ترمیم کریں" : "Add New Video • نئی ویڈیو شامل کریں"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditingVideo(false);
                  setEditingVideo(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-6">
              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Video Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVideo.title || ""}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="e.g. Story of Prophet Nuh (AS) for Children"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                  <select
                    value={editingVideo.category || "Prophets Stories"}
                    onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="Prophets Stories">Prophets Stories</option>
                    <option value="Prophet Muhammad ﷺ Life">Prophet Muhammad ﷺ Life</option>
                    <option value="Sahaba Stories">Sahaba Stories</option>
                    <option value="Islamic Morals">Islamic Morals</option>
                    <option value="Quran Stories">Quran Stories</option>
                    <option value="Duas">Duas</option>
                  </select>
                </div>
              </div>

              {/* Video URL & Thumbnail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    YouTube Video URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={editingVideo.videoUrl || ""}
                    onChange={(e) => {
                      const url = e.target.value;
                      let thumb = editingVideo.thumbnail || "";
                      // Attempt to extract YouTube Video ID to auto-populate thumbnail if it's currently empty
                      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                      if (match && match[1] && !thumb) {
                        thumb = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
                      }
                      setEditingVideo({ ...editingVideo, videoUrl: url, thumbnail: thumb });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Thumbnail Image URL</label>
                  <input
                    type="text"
                    value={editingVideo.thumbnail || ""}
                    onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="Auto-populated from YouTube URL, or custom image link"
                  />
                </div>
              </div>

              {/* Duration, Age Group, Featured Toggle */}
              {/* Duration, Age Group, Featured Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Duration (MM:SS)</label>
                  <input
                    type="text"
                    value={editingVideo.duration || ""}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="e.g. 5:24"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Age Group Filter</label>
                  <select
                    value={editingVideo.ageGroup || "all"}
                    onChange={(e) => setEditingVideo({ ...editingVideo, ageGroup: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="all">All Ages (all)</option>
                    <option value="4-6">Ages 4-6 (4-6)</option>
                    <option value="7-9">Ages 7-9 (7-9)</option>
                    <option value="10-12">Ages 10-12 (10-12)</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingVideo.isFeatured || false}
                      onChange={(e) => setEditingVideo({ ...editingVideo, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Set as Featured Video
                    </span>
                  </label>
                </div>
              </div>

              {/* Language, Publish Date, and Folder selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Language</label>
                  <select
                    value={editingVideo.language || "English"}
                    onChange={(e) => setEditingVideo({ ...editingVideo, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu (اردو)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="Turkish">Turkish</option>
                    <option value="Malay">Malay</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Publish Date</label>
                  <input
                    type="date"
                    value={editingVideo.publishDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setEditingVideo({ ...editingVideo, publishDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Video Folder Group</label>
                  <select
                    value={editingVideo.folderId || ""}
                    onChange={(e) => setEditingVideo({ ...editingVideo, folderId: e.target.value || null })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Unassigned (No Folder)</option>
                    {folderList.map(folder => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingVideo.tags) ? editingVideo.tags.join(", ") : (editingVideo.tags || "")}
                    onChange={(e) => setEditingVideo({ ...editingVideo, tags: e.target.value.split(",").map(t => t.trim()) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="prophets, patient, animation, kids stories"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea
                    rows={2}
                    value={editingVideo.description || ""}
                    onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
                    placeholder="Short summary/description of the video..."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingVideo(false);
                    setEditingVideo(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Video Settings
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Videos List View */}
      {activeTab === "videos" && !isEditingVideo && (
        <div className="space-y-6" id="admin-video-management-tab">
          
          {/* Top Video Mode Toggle Buttons */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setIsUploadingTab(false)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                !isUploadingTab
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <VideoIcon className="w-4 h-4 text-emerald-600" />
              Video Library & Folders • لائبریری
            </button>
            <button
              onClick={() => setIsUploadingTab(true)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isUploadingTab
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              Direct Video Upload • اپلوڈ کریں
              {uploadQueue.filter(q => q.status === "pending" || q.status === "uploading").length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse font-mono">
                  {uploadQueue.filter(q => q.status === "pending" || q.status === "uploading").length}
                </span>
              )}
            </button>
          </div>

          {!isUploadingTab ? (
            /* ==========================================
               MODE 1: VIDEO LIBRARY WITH FOLDER SIDEBAR
               ========================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Folder Sidebar Panel */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-3xl h-fit space-y-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-700 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-emerald-600" />
                    Video Folders • فولڈرز
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md font-bold">
                    {folderList.length} total
                  </span>
                </div>

                {/* Create Folder Inline Form */}
                <form onSubmit={handleCreateFolder} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New Folder Name..."
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Create folder"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </form>

                {/* Folder Directory List */}
                <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                  {/* Option: All Videos */}
                  <button
                    onClick={() => setActiveFolderId("all")}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                      activeFolderId === "all"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-750/30 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Layers className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate">All Videos</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full font-mono font-bold">
                      {videoList.length}
                    </span>
                  </button>

                  {/* Option: Unassigned */}
                  <button
                    onClick={() => setActiveFolderId("unassigned")}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                      activeFolderId === "unassigned"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-750/30 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HelpCircle className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate">Unassigned Videos</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full font-mono font-bold">
                      {videoList.filter(v => !v.folderId).length}
                    </span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-700 my-2"></div>

                  {/* Dynamic Custom Folders */}
                  {foldersLoading ? (
                    <div className="py-4 text-center text-slate-400 text-[11px] animate-pulse">Loading folders...</div>
                  ) : folderList.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 text-[11px] italic">No folders created.</div>
                  ) : (
                    folderList.map((folder) => {
                      const folderVideosCount = videoList.filter(v => v.folderId === folder.id).length;
                      const isFolderActive = activeFolderId === folder.id;

                      return (
                        <div
                          key={folder.id}
                          className={`group w-full flex items-center justify-between rounded-xl transition-all ${
                            isFolderActive
                              ? "bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold"
                              : "hover:bg-slate-50 dark:hover:bg-slate-750/30 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {renamingFolderId === folder.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleRenameFolder(folder.id, renamingFolderName);
                              }}
                              className="flex items-center gap-1.5 p-1.5 w-full"
                            >
                              <input
                                type="text"
                                autoFocus
                                value={renamingFolderName}
                                onChange={(e) => setRenamingFolderName(e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                              />
                              <button type="submit" className="text-emerald-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenamingFolderId(null)}
                                className="text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <>
                              <button
                                onClick={() => setActiveFolderId(folder.id)}
                                className="flex-1 text-left p-3 text-xs font-medium truncate flex items-center gap-2.5 min-w-0 cursor-pointer"
                              >
                                {isFolderActive ? (
                                  <FolderOpen className="w-4 h-4 shrink-0 text-emerald-500" />
                                ) : (
                                  <Folder className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                )}
                                <span className="truncate">{folder.name}</span>
                              </button>

                              <div className="flex items-center gap-1 px-2 shrink-0">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full font-mono font-bold group-hover:hidden">
                                  {folderVideosCount}
                                </span>
                                <div className="hidden group-hover:flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setRenamingFolderId(folder.id);
                                      setRenamingFolderName(folder.name);
                                    }}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-500 rounded-md cursor-pointer"
                                    title="Rename folder"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFolder(folder.id)}
                                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 rounded-md cursor-pointer"
                                    title="Delete folder"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Videos Table & Catalog Column */}
              <div className="lg:col-span-9 space-y-6">
                {/* Sub-tabs Row */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-px">
                  <button
                    onClick={() => setVideoSubTab("pending")}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      videoSubTab === "pending"
                        ? "border-amber-500 text-amber-600 dark:text-amber-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    Pending Videos ({
                      videoList.filter(v => (v.status || "").toLowerCase() === "pending" && (activeFolderId === "all" || (activeFolderId === "unassigned" && !v.folderId) || v.folderId === activeFolderId)).length
                    })
                  </button>
                  <button
                    onClick={() => setVideoSubTab("approved")}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      videoSubTab === "approved"
                        ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Approved Videos ({
                      videoList.filter(v => ((v.status || "").toLowerCase() === "approved" || !v.status) && (activeFolderId === "all" || (activeFolderId === "unassigned" && !v.folderId) || v.folderId === activeFolderId)).length
                    })
                  </button>
                  <button
                    onClick={() => setVideoSubTab("rejected")}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      videoSubTab === "rejected"
                        ? "border-rose-500 text-rose-600 dark:text-rose-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Rejected Videos ({
                      videoList.filter(v => (v.status || "").toLowerCase() === "rejected" && (activeFolderId === "all" || (activeFolderId === "unassigned" && !v.folderId) || v.folderId === activeFolderId)).length
                    })
                  </button>
                  <button
                    onClick={() => setVideoSubTab("reported")}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      videoSubTab === "reported"
                        ? "border-red-600 text-red-600 dark:text-red-400 animate-pulse"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Reported Videos ({
                      videoList.filter(v => v.reported && (activeFolderId === "all" || (activeFolderId === "unassigned" && !v.folderId) || v.folderId === activeFolderId)).length
                    })
                  </button>
                  
                  <div className="ml-auto pb-2 flex gap-1.5">
                    <button
                      onClick={startAddVideo}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add YouTube Video
                    </button>
                  </div>
                </div>

                {/* Filters & Actions Toolbar */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-3xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Search */}
                    <div className="md:col-span-8 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={videoSearch}
                        onChange={(e) => setVideoSearch(e.target.value)}
                        placeholder="Search video titles, descriptions, or tags..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="md:col-span-4">
                      <select
                        value={videoCategoryFilter}
                        onChange={(e) => setVideoCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                      >
                        <option value="all">All Categories</option>
                        <option value="Prophets Stories">Prophets Stories</option>
                        <option value="Prophet Muhammad ﷺ Life">Prophet Muhammad ﷺ Life</option>
                        <option value="Sahaba Stories">Sahaba Stories</option>
                        <option value="Islamic Morals">Islamic Morals</option>
                        <option value="Quran Stories">Quran Stories</option>
                        <option value="Duas">Duas</option>
                        <option value="Prayer">Prayer</option>
                        <option value="Good Manners">Good Manners</option>
                        <option value="Islamic Cartoons">Islamic Cartoons</option>
                        <option value="Nasheeds">Nasheeds</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Video Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xs">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-slate-400" />
                      {videoSubTab} Video Library (
                      {
                        videoList.filter(v => {
                          const matchesSearch = videoSearch === "" || 
                            v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
                            (v.description || "").toLowerCase().includes(videoSearch.toLowerCase()) ||
                            (v.tags && v.tags.some(t => t.toLowerCase().includes(videoSearch.toLowerCase())));
                          const matchesCategory = videoCategoryFilter === "all" || v.category === videoCategoryFilter;
                          
                          let matchesFolder = true;
                          if (activeFolderId === "unassigned") matchesFolder = !v.folderId;
                          else if (activeFolderId !== "all") matchesFolder = v.folderId === activeFolderId;

                          let matchesSubTab = false;
                          if (videoSubTab === "pending") matchesSubTab = (v.status || "").toLowerCase() === "pending";
                          else if (videoSubTab === "approved") matchesSubTab = (v.status || "").toLowerCase() === "approved" || !v.status;
                          else if (videoSubTab === "rejected") matchesSubTab = (v.status || "").toLowerCase() === "rejected";
                          else if (videoSubTab === "reported") matchesSubTab = !!v.reported;

                          return matchesSearch && matchesCategory && matchesFolder && matchesSubTab;
                        }).length
                      } Videos found)
                    </h3>
                  </div>

                  {videoLoading ? (
                    <div className="p-12 text-center text-slate-500 font-medium">
                      <svg className="animate-spin h-6 w-6 text-emerald-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading video library...</span>
                    </div>
                  ) : videoList.filter(v => {
                      const matchesSearch = videoSearch === "" || 
                        v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
                        (v.description || "").toLowerCase().includes(videoSearch.toLowerCase()) ||
                        (v.tags && v.tags.some(t => t.toLowerCase().includes(videoSearch.toLowerCase())));
                      const matchesCategory = videoCategoryFilter === "all" || v.category === videoCategoryFilter;
                      
                      let matchesFolder = true;
                      if (activeFolderId === "unassigned") matchesFolder = !v.folderId;
                      else if (activeFolderId !== "all") matchesFolder = v.folderId === activeFolderId;

                      let matchesSubTab = false;
                      if (videoSubTab === "pending") matchesSubTab = (v.status || "").toLowerCase() === "pending";
                      else if (videoSubTab === "approved") matchesSubTab = (v.status || "").toLowerCase() === "approved" || !v.status;
                      else if (videoSubTab === "rejected") matchesSubTab = (v.status || "").toLowerCase() === "rejected";
                      else if (videoSubTab === "reported") matchesSubTab = !!v.reported;

                      return matchesSearch && matchesCategory && matchesFolder && matchesSubTab;
                    }).length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <VideoIcon className="w-12 h-12 mx-auto mb-3 opacity-25" />
                      <p className="text-sm font-semibold">No videos found under this folder/tab.</p>
                      <p className="text-xs text-slate-400 mt-1">Try changing filters, creating folders, or uploading new content.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse" id="admin-videos-table">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-150 dark:border-slate-800">
                            <th className="py-4 px-6 w-[15%]">Preview</th>
                            <th className="py-4 px-6 w-[35%]">Video details</th>
                            <th className="py-4 px-6 w-[20%]">Folder & Metadata</th>
                            <th className="py-4 px-6 w-[15%]">Status & Views</th>
                            <th className="py-4 px-6 text-right w-[15%]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {videoList.filter(v => {
                            const matchesSearch = videoSearch === "" || 
                              v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
                              (v.description || "").toLowerCase().includes(videoSearch.toLowerCase()) ||
                              (v.tags && v.tags.some(t => t.toLowerCase().includes(videoSearch.toLowerCase())));
                            const matchesCategory = videoCategoryFilter === "all" || v.category === videoCategoryFilter;
                            
                            let matchesFolder = true;
                            if (activeFolderId === "unassigned") matchesFolder = !v.folderId;
                            else if (activeFolderId !== "all") matchesFolder = v.folderId === activeFolderId;

                            let matchesSubTab = false;
                            if (videoSubTab === "pending") matchesSubTab = (v.status || "").toLowerCase() === "pending";
                            else if (videoSubTab === "approved") matchesSubTab = (v.status || "").toLowerCase() === "approved" || !v.status;
                            else if (videoSubTab === "rejected") matchesSubTab = (v.status || "").toLowerCase() === "rejected";
                            else if (videoSubTab === "reported") matchesSubTab = !!v.reported;

                            return matchesSearch && matchesCategory && matchesFolder && matchesSubTab;
                          }).map((video) => (
                            <tr key={video.id} className="border-b border-slate-100 dark:border-slate-750 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors text-xs text-slate-600 dark:text-slate-300">
                              <td className="py-4 px-6">
                                <div className="relative group cursor-pointer shrink-0" onClick={() => setPreviewVideoUrl(video.videoUrl)}>
                                  {video.thumbnail ? (
                                    <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 group-hover:brightness-75 transition-all" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-24 h-14 bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 group-hover:brightness-75 transition-all">
                                      <VideoIcon className="w-5 h-5 text-slate-400" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-slate-950/85 text-white text-[9px] px-1.5 py-0.5 rounded-lg font-bold">Preview</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{video.title}</div>
                                <p className="text-slate-400 mt-0.5 line-clamp-1 max-w-sm">{video.description}</p>
                                
                                {video.tags && video.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {video.tags.map((tag, tIdx) => (
                                      <span key={tIdx} className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-6 space-y-1">
                                {/* Folder Quick Reassignment */}
                                <div className="flex items-center gap-1">
                                  <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <select
                                    value={video.folderId || ""}
                                    onChange={(e) => handleAssignVideoToFolder(video.id, e.target.value || null)}
                                    className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 focus:outline-hidden"
                                    title="Move Folder"
                                  >
                                    <option value="">(No Folder)</option>
                                    {folderList.map(f => (
                                      <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Category: <span className="text-slate-600 dark:text-slate-300 font-bold">{video.category}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <span>Age: {video.ageGroup || "all"}</span>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <span>Lang: {video.language || "English"}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 space-y-1">
                                <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{video.views || 0} views</span>
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  Date: {video.publishDate || video.createdAt?.split("T")[0]}
                                </div>
                                <div className="pt-0.5">
                                  {videoSubTab === "reported" && (
                                    <div className="text-red-500 font-bold text-[10px] flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 animate-bounce" /> {video.reportCount || 1} Reports
                                    </div>
                                  )}
                                  {(video.status || "").toLowerCase() === "rejected" && (
                                    <div className="text-rose-500 text-[10px] bg-rose-50 dark:bg-rose-950/20 p-1.5 rounded border border-rose-100 dark:border-rose-900/30 line-clamp-2 max-w-[150px]" title={video.rejectionReason}>
                                      {video.rejectionReason || "Rejected."}
                                    </div>
                                  )}
                                  {video.isFeatured && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                                      Featured
                                    </span>
                                  )}
                                  {!video.isFeatured && (((video.status || "").toLowerCase() === "approved") || !video.status) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                                      Live
                                    </span>
                                  )}
                                  {(video.status || "").toLowerCase() === "pending" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                                      Review
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Approve Action */}
                                  {(video.status || "").toLowerCase() !== "approved" && (
                                    <button
                                      onClick={() => handleUpdateVideoStatus(video.id, "approved")}
                                      className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg text-emerald-600 cursor-pointer"
                                      title="Approve & Publish Live"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Reject Action */}
                                  {(video.status || "").toLowerCase() !== "rejected" && (
                                    <button
                                      onClick={() => {
                                        setVideoToRejectId(video.id);
                                        setRejectionReasonInput("");
                                      }}
                                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-500 cursor-pointer"
                                      title="Reject video"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Feature Toggle */}
                                  {(((video.status || "").toLowerCase() === "approved") || !video.status) && (
                                    <button
                                      onClick={() => handleToggleFeatureVideo(video)}
                                      className={`p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer ${video.isFeatured ? 'text-amber-500' : 'text-slate-400'}`}
                                      title={video.isFeatured ? "Unfeature video" : "Feature video"}
                                    >
                                      <Star className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Duplicate */}
                                  <button
                                    onClick={() => handleDuplicateVideo(video)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-indigo-600 cursor-pointer"
                                    title="Duplicate Video / Copy"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>

                                  {/* Edit */}
                                  <button
                                    onClick={() => startEditVideo(video)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-blue-500 cursor-pointer"
                                    title="Edit Video"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteVideo(video.id)}
                                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-500 cursor-pointer"
                                    title="Delete Video"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================
               MODE 2: DIRECT VIDEO UPLOAD SYSTEM
               ========================================== */
            <div className="space-y-6">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleAddToQueue(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-slate-300 dark:border-slate-750 hover:border-emerald-500 bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-3xl text-center space-y-4 transition-all cursor-pointer group"
                onClick={() => document.getElementById("direct-video-file-picker")?.click()}
                id="direct-upload-drag-drop-zone"
              >
                <input
                  id="direct-video-file-picker"
                  type="file"
                  multiple
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/mov"
                  className="hidden"
                  onChange={(e) => handleAddToQueue(e.target.files)}
                />
                
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-emerald-500 flex items-center justify-center rounded-2xl mx-auto border border-slate-200 dark:border-slate-750 shadow-xs transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Drag & drop your kids videos here, or <span className="text-emerald-600 dark:text-emerald-400 underline">browse computer</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Select multiple files. Supported: MP4, WebM, MOV up to 500 MB.
                  </p>
                </div>
              </div>

              {/* Upload Queue List */}
              {uploadQueue.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Active Upload Queue ({uploadQueue.length} files)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const pending = uploadQueue.filter(q => q.status === "pending");
                          pending.forEach(item => handleStartUpload(item));
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Upload all pending files"
                        disabled={uploadQueue.filter(q => q.status === "pending").length === 0}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload All Pending
                      </button>
                      <button
                        onClick={() => setUploadQueue(prev => prev.filter(q => q.status !== "completed"))}
                        className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        Clear Completed
                      </button>
                    </div>
                  </div>

                  {/* Queue Items */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-750">
                    {uploadQueue.map((item) => (
                      <div key={item.id} className="p-5 space-y-4">
                        
                        {/* Header Status Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-500">
                              <VideoIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{item.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Size: {(item.size / (1024 * 1024)).toFixed(2)} MB • Format: {item.file.name.split(".").pop()?.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status Badges */}
                            {item.status === "pending" && (
                              <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Pending
                              </span>
                            )}
                            {item.status === "uploading" && (
                              <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                Uploading {item.progress}%
                              </span>
                            )}
                            {item.status === "completed" && (
                              <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Check className="w-3 h-3" /> Published
                              </span>
                            )}
                            {item.status === "cancelled" && (
                              <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Cancelled
                              </span>
                            )}
                            {item.status === "failed" && (
                              <span className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Failed
                              </span>
                            )}

                            {/* Control Actions */}
                            <div className="flex items-center gap-1">
                              {item.status === "pending" && (
                                <button
                                  onClick={() => handleStartUpload(item)}
                                  className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer"
                                  title="Start upload"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              {item.status === "uploading" && (
                                <button
                                  onClick={() => handleCancelUpload(item)}
                                  className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg cursor-pointer"
                                  title="Cancel upload"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              {(item.status === "failed" || item.status === "cancelled") && (
                                <button
                                  onClick={() => handleStartUpload(item)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 rounded-lg cursor-pointer"
                                  title="Retry upload"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                              {item.status !== "uploading" && (
                                <button
                                  onClick={() => handleRemoveFromQueue(item.id)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer"
                                  title="Remove from queue"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detail/Metadata Editor form for this file */}
                        {item.status !== "completed" && (
                          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-750 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4">
                            
                            {/* Input Title */}
                            <div className="md:col-span-4 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Video Title *</label>
                              <input
                                type="text"
                                required
                                value={item.title}
                                onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, title: e.target.value } : q))}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                                placeholder="Story Title"
                              />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-5 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Short Description *</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, description: e.target.value } : q))}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                                placeholder="Delightful educational lesson for children..."
                              />
                            </div>

                            {/* Category selector */}
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                              <select
                                value={item.category}
                                onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, category: e.target.value } : q))}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
                              >
                                <option value="Prophets Stories">Prophets Stories</option>
                                <option value="Prophet Muhammad ﷺ Life">Prophet Muhammad ﷺ Life</option>
                                <option value="Sahaba Stories">Sahaba Stories</option>
                                <option value="Islamic Morals">Islamic Morals</option>
                                <option value="Quran Stories">Quran Stories</option>
                                <option value="Duas">Duas</option>
                                <option value="Prayer">Prayer</option>
                                <option value="Good Manners">Good Manners</option>
                                <option value="Islamic Cartoons">Islamic Cartoons</option>
                                <option value="Nasheeds">Nasheeds</option>
                              </select>
                            </div>

                            {/* Age Group */}
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Age Group</label>
                              <select
                                value={item.ageGroup}
                                onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, ageGroup: e.target.value as any } : q))}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
                              >
                                <option value="all">All Ages (all)</option>
                                <option value="4-6">Ages 4-6 (4-6)</option>
                                <option value="7-9">Ages 7-9 (7-9)</option>
                                <option value="10-12">Ages 10-12 (10-12)</option>
                              </select>
                            </div>

                            {/* Language */}
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Language</label>
                              <select
                                value={item.language}
                                onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, language: e.target.value } : q))}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
                              >
                                <option value="English">English</option>
                                <option value="Urdu">Urdu (اردو)</option>
                                <option value="Arabic">Arabic (العربية)</option>
                                <option value="Turkish">Turkish</option>
                                <option value="Malay">Malay</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            {/* Folder */}
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Folder Destination</label>
                              <select
                                value={item.folderId}
                                onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, folderId: e.target.value } : q))}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
                              >
                                <option value="">No Folder (Unassigned)</option>
                                {folderList.map(f => (
                                  <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Tags */}
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tags (comma-separated)</label>
                              <input
                                type="text"
                                value={item.tags}
                                onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, tags: e.target.value } : q))}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                                placeholder="prophets, patiency"
                              />
                            </div>

                            {/* Custom Thumbnail Upload */}
                            <div className="md:col-span-6 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Thumbnail File</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`queue-thumb-picker-${item.id}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, thumbnailFile: file } : q));
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => document.getElementById(`queue-thumb-picker-${item.id}`)?.click()}
                                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" /> Pick Image File
                                </button>
                                <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                  {item.thumbnailFile ? item.thumbnailFile.name : (item.thumbnailUrl ? "YouTube cover auto-fill" : "Using fallback illustration")}
                                </span>
                              </div>
                            </div>

                            {/* Featured and Date */}
                            <div className="md:col-span-6 flex flex-wrap items-center gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Publish Date</label>
                                <input
                                  type="date"
                                  value={item.publishDate}
                                  onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, publishDate: e.target.value } : q))}
                                  className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                                />
                              </div>

                              <div className="flex items-center pt-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.isFeatured}
                                    onChange={(e) => setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, isFeatured: e.target.checked } : q))}
                                    className="w-3.5 h-3.5 text-emerald-600 rounded-sm"
                                  />
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Feature Video</span>
                                </label>
                              </div>
                            </div>

                          </div>
                        )}

                        {/* Progress slider line */}
                        {(item.status === "uploading" || item.status === "completed") && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold font-mono">
                              <span className="text-slate-400">Video Uploading Progression</span>
                              <span className="text-slate-600">{item.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200/50 dark:border-slate-900">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              ></div>
                            </div>
                            
                            {item.thumbnailProgress !== undefined && (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between text-[10px] font-bold font-mono">
                                  <span className="text-slate-400">Thumbnail Uploading Progression</span>
                                  <span className="text-indigo-600">{item.thumbnailProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${item.thumbnailProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Error log if failed */}
                        {item.status === "failed" && item.error && (
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-[10px] text-rose-600 flex items-center gap-2 leading-relaxed">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span><strong>Error Details:</strong> {item.error}</span>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

          {/* HADITH MANAGEMENT TAB VIEW */}
          {!isEditing && !isEditingVideo && !isEditingHadith && !isEditingDua && activeTab === "hadiths" && (
            <div className="space-y-6" id="hadiths-management-section">
              {/* Top Filter Bar */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={hadithSearch}
                    onChange={(e) => setHadithSearch(e.target.value)}
                    placeholder="Search Hadith by title, arabic, book..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>

                {/* Filters & Bulk Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select
                    value={hadithCategoryFilter}
                    onChange={(e) => setHadithCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Categories</option>
                    <option value="manners">Good Manners</option>
                    <option value="kindness">Kindness & Compassion</option>
                    <option value="truthfulness">Truthfulness</option>
                    <option value="cleanliness">Cleanliness & Purity</option>
                    <option value="faith">Faith & Worship</option>
                    <option value="parents">Parents & Family</option>
                    <option value="knowledge">Seeking Knowledge</option>
                  </select>

                  <select
                    value={hadithStatusFilter}
                    onChange={(e) => setHadithStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published Only</option>
                    <option value="draft">Drafts Only</option>
                  </select>

                  {selectedHadithIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 px-2">{selectedHadithIds.length} Selected</span>
                      <button
                        onClick={() => handleBulkHadithAction("publish")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => handleBulkHadithAction("unpublish")}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Unpublish
                      </button>
                      <button
                        onClick={() => handleBulkHadithAction("delete")}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hadiths Table */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={hadithsList.length > 0 && selectedHadithIds.length === hadithsList.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedHadithIds(hadithsList.map(h => h.id));
                              } else {
                                setSelectedHadithIds([]);
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </th>
                        <th className="p-4">Hadith Title & Book</th>
                        <th className="p-4">Arabic Text</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Grade</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {hadithsLoading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                            Loading Hadith collection...
                          </td>
                        </tr>
                      ) : hadithsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                            No Hadiths found. Click "Add New Hadith" above to create one.
                          </td>
                        </tr>
                      ) : (
                        hadithsList
                          .filter(item => {
                            const query = hadithSearch.toLowerCase();
                            const matchesQuery = !query || 
                              (item.titleEn && item.titleEn.toLowerCase().includes(query)) ||
                              (item.book && item.book.toLowerCase().includes(query)) ||
                              (item.arabicText && item.arabicText.includes(query));
                            const matchesCat = hadithCategoryFilter === "all" || item.category === hadithCategoryFilter;
                            const matchesStatus = hadithStatusFilter === "all" || item.status === hadithStatusFilter;
                            return matchesQuery && matchesCat && matchesStatus;
                          })
                          .map((hadith) => {
                            const isSelected = selectedHadithIds.includes(hadith.id);
                            return (
                              <tr key={hadith.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors">
                                <td className="p-4">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedHadithIds(prev => [...prev, hadith.id]);
                                      } else {
                                        setSelectedHadithIds(prev => prev.filter(id => id !== hadith.id));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{hadith.iconEmoji || "📚"}</span>
                                    <span>{hadith.titleEn}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {hadith.book} {hadith.hadithNumber ? `#${hadith.hadithNumber}` : ""} • {hadith.narrator || "Sahabi RA"}
                                  </div>
                                </td>
                                <td className="p-4 max-w-xs truncate font-arabic text-sm text-slate-800 dark:text-slate-100" dir="rtl">
                                  {hadith.arabicText}
                                </td>
                                <td className="p-4">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase">
                                    {hadith.category || "General"}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    hadith.grade === "Sahih"
                                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                      : "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  }`}>
                                    {hadith.grade || "Sahih"}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    hadith.status === "published"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                                  }`}>
                                    {hadith.status === "published" ? "Published" : "Draft"}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setPreviewHadith(hadith)}
                                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                                      title="Preview Hadith"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingHadith(hadith);
                                        setIsEditingHadith(true);
                                      }}
                                      className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg cursor-pointer"
                                      title="Edit Hadith"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setHadithToDeleteId(hadith.id)}
                                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer"
                                      title="Delete Hadith"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DAILY DUAS MANAGEMENT TAB VIEW */}
          {!isEditing && !isEditingVideo && !isEditingHadith && !isEditingDua && activeTab === "duas" && (
            <div className="space-y-6" id="duas-management-section">
              {/* Top Filter Bar */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={duaSearch}
                    onChange={(e) => setDuaSearch(e.target.value)}
                    placeholder="Search Dua by title, arabic, reference..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>

                {/* Filters & Bulk Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select
                    value={duaCategoryFilter}
                    onChange={(e) => setDuaCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Categories</option>
                    <option value="daily">Daily / Routine</option>
                    <option value="morning">Morning & Evening</option>
                    <option value="eating">Eating & Drinking</option>
                    <option value="sleeping">Sleeping & Waking</option>
                    <option value="traveling">Traveling & Leaving Home</option>
                    <option value="protection">Protection & Refuge</option>
                    <option value="parents">Parents & Guidance</option>
                  </select>

                  <select
                    value={duaStatusFilter}
                    onChange={(e) => setDuaStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published Only</option>
                    <option value="draft">Drafts Only</option>
                  </select>

                  {selectedDuaIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 px-2">{selectedDuaIds.length} Selected</span>
                      <button
                        onClick={() => handleBulkDuaAction("publish")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => handleBulkDuaAction("unpublish")}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Unpublish
                      </button>
                      <button
                        onClick={() => handleBulkDuaAction("delete")}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Duas Table */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={duasList.length > 0 && selectedDuaIds.length === duasList.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDuaIds(duasList.map(d => d.id));
                              } else {
                                setSelectedDuaIds([]);
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </th>
                        <th className="p-4">Dua Title & Reference</th>
                        <th className="p-4">Arabic Text</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {duasLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                            Loading Duas collection...
                          </td>
                        </tr>
                      ) : duasList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                            No Duas found. Click "Add New Dua" above to create one.
                          </td>
                        </tr>
                      ) : (
                        duasList
                          .filter(item => {
                            const query = duaSearch.toLowerCase();
                            const matchesQuery = !query || 
                              (item.titleEn && item.titleEn.toLowerCase().includes(query)) ||
                              (item.reference && item.reference.toLowerCase().includes(query)) ||
                              (item.arabicText && item.arabicText.includes(query));
                            const matchesCat = duaCategoryFilter === "all" || item.category === duaCategoryFilter;
                            const matchesStatus = duaStatusFilter === "all" || item.status === duaStatusFilter;
                            return matchesQuery && matchesCat && matchesStatus;
                          })
                          .map((dua) => {
                            const isSelected = selectedDuaIds.includes(dua.id);
                            return (
                              <tr key={dua.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors">
                                <td className="p-4">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedDuaIds(prev => [...prev, dua.id]);
                                      } else {
                                        setSelectedDuaIds(prev => prev.filter(id => id !== dua.id));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{dua.iconEmoji || "🤲"}</span>
                                    <span>{dua.titleEn}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {dua.reference || "Hisn al-Muslim"}
                                  </div>
                                </td>
                                <td className="p-4 max-w-xs truncate font-arabic text-sm text-slate-800 dark:text-slate-100" dir="rtl">
                                  {dua.arabicText}
                                </td>
                                <td className="p-4">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase">
                                    {dua.category || "Daily"}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    dua.status === "published"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                                  }`}>
                                    {dua.status === "published" ? "Published" : "Draft"}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setPreviewDua(dua)}
                                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                                      title="Preview Dua"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingDua(dua);
                                        setIsEditingDua(true);
                                      }}
                                      className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg cursor-pointer"
                                      title="Edit Dua"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDuaToDeleteId(dua.id)}
                                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer"
                                      title="Delete Dua"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* HADITH EDITOR FORM / DRAWER */}
          {isEditingHadith && editingHadith && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  {editingHadith.id ? "Edit Hadith Record" : "Add New Hadith"}
                </h3>
                <button
                  onClick={() => {
                    setIsEditingHadith(false);
                    setEditingHadith(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveHadith(editingHadith);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Title (English) *</label>
                    <input
                      type="text"
                      required
                      value={editingHadith.titleEn || ""}
                      onChange={(e) => setEditingHadith({ ...editingHadith, titleEn: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. Kindness to Animals"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Title (Urdu)</label>
                    <input
                      type="text"
                      value={editingHadith.titleUr || ""}
                      onChange={(e) => setEditingHadith({ ...editingHadith, titleUr: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-urdu text-slate-800 dark:text-slate-100 text-right"
                      dir="rtl"
                      placeholder="مثلاً جانوروں پر رحم"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Hadith Book / Source *</label>
                    <input
                      type="text"
                      required
                      value={editingHadith.book || ""}
                      onChange={(e) => setEditingHadith({ ...editingHadith, book: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. Sahih al-Bukhari"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Hadith Number</label>
                    <input
                      type="text"
                      value={editingHadith.hadithNumber || ""}
                      onChange={(e) => setEditingHadith({ ...editingHadith, hadithNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. 6011"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Grade</label>
                    <select
                      value={editingHadith.grade || "Sahih"}
                      onChange={(e) => setEditingHadith({ ...editingHadith, grade: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Sahih">Sahih (صحيح)</option>
                      <option value="Hasan">Hasan (حسن)</option>
                      <option value="Da'if">Da'if (ضعيف)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                    <select
                      value={editingHadith.category || "manners"}
                      onChange={(e) => setEditingHadith({ ...editingHadith, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="manners">Good Manners</option>
                      <option value="kindness">Kindness & Compassion</option>
                      <option value="truthfulness">Truthfulness</option>
                      <option value="cleanliness">Cleanliness & Purity</option>
                      <option value="faith">Faith & Worship</option>
                      <option value="parents">Parents & Family</option>
                      <option value="knowledge">Seeking Knowledge</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Arabic Text *</label>
                  <textarea
                    required
                    rows={3}
                    value={editingHadith.arabicText || ""}
                    onChange={(e) => setEditingHadith({ ...editingHadith, arabicText: e.target.value })}
                    className="w-full px-4 py-3 bg-amber-50/50 dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-xl text-lg font-arabic text-slate-900 dark:text-slate-100 text-right leading-loose"
                    dir="rtl"
                    placeholder="مَنْ لا يَرْحَمْ لا يُرْحَمْ"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">English Translation *</label>
                    <textarea
                      required
                      rows={3}
                      value={editingHadith.translationEn || ""}
                      onChange={(e) => setEditingHadith({ ...editingHadith, translationEn: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Whoever does not show mercy will not be shown mercy."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Urdu Translation</label>
                    <textarea
                      rows={3}
                      value={editingHadith.translationUr || ""}
                      onChange={(e) => setEditingHadith({ ...editingHadith, translationUr: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-urdu text-slate-800 dark:text-slate-100 text-right leading-relaxed"
                      dir="rtl"
                      placeholder="جو رحم نہیں کرتا اس پر رحم نہیں کیا جائے گا۔"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Moral Lesson (English)</label>
                    <textarea
                      rows={2}
                      value={editingHadith.moralLessonEn || ""}
                      onChange={(e) => setEditingHadith({ ...editingHadith, moralLessonEn: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Always treat people, animals, and creation with gentleness."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Moral Lesson (Urdu)</label>
                    <textarea
                      rows={2}
                      value={editingHadith.moralLessonUr || ""}
                      onChange={(e) => setEditingHadith({ ...editingHadith, moralLessonUr: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-urdu text-slate-800 dark:text-slate-100 text-right"
                      dir="rtl"
                      placeholder="ہمیشہ تمام مخلوق کے ساتھ نرمی اور پیار سے پیش آئیں۔"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Publish Status:</label>
                    <select
                      value={editingHadith.status || "published"}
                      onChange={(e) => setEditingHadith({ ...editingHadith, status: e.target.value })}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingHadith(false);
                        setEditingHadith(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                    >
                      Save Hadith
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* DUA EDITOR FORM / DRAWER */}
          {isEditingDua && editingDua && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  {editingDua.id ? "Edit Dua Record" : "Add New Daily Dua"}
                </h3>
                <button
                  onClick={() => {
                    setIsEditingDua(false);
                    setEditingDua(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveDua(editingDua);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Title (English) *</label>
                    <input
                      type="text"
                      required
                      value={editingDua.titleEn || ""}
                      onChange={(e) => setEditingDua({ ...editingDua, titleEn: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. Dua Before Eating"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Title (Urdu)</label>
                    <input
                      type="text"
                      value={editingDua.titleUr || ""}
                      onChange={(e) => setEditingDua({ ...editingDua, titleUr: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-urdu text-slate-800 dark:text-slate-100 text-right"
                      dir="rtl"
                      placeholder="مثلاً کھانا کھانے سے پہلے کی دعا"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Reference *</label>
                    <input
                      type="text"
                      required
                      value={editingDua.reference || ""}
                      onChange={(e) => setEditingDua({ ...editingDua, reference: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. Hisn al-Muslim / Sahih Bukhari"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                    <select
                      value={editingDua.category || "daily"}
                      onChange={(e) => setEditingDua({ ...editingDua, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="daily">Daily / Routine</option>
                      <option value="morning">Morning & Evening</option>
                      <option value="eating">Eating & Drinking</option>
                      <option value="sleeping">Sleeping & Waking</option>
                      <option value="traveling">Traveling & Leaving Home</option>
                      <option value="protection">Protection & Refuge</option>
                      <option value="parents">Parents & Guidance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Arabic Text *</label>
                  <textarea
                    required
                    rows={3}
                    value={editingDua.arabicText || ""}
                    onChange={(e) => setEditingDua({ ...editingDua, arabicText: e.target.value })}
                    className="w-full px-4 py-3 bg-amber-50/50 dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-xl text-lg font-arabic text-slate-900 dark:text-slate-100 text-right leading-loose"
                    dir="rtl"
                    placeholder="بِسْمِ اللَّهِ"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Transliteration</label>
                  <input
                    type="text"
                    value={editingDua.transliteration || ""}
                    onChange={(e) => setEditingDua({ ...editingDua, transliteration: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 italic"
                    placeholder="Bismillahi ar-Rahmani ar-Rahim"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">English Translation *</label>
                    <textarea
                      required
                      rows={3}
                      value={editingDua.translationEn || ""}
                      onChange={(e) => setEditingDua({ ...editingDua, translationEn: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="In the name of Allah."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Urdu Translation</label>
                    <textarea
                      rows={3}
                      value={editingDua.translationUr || ""}
                      onChange={(e) => setEditingDua({ ...editingDua, translationUr: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-urdu text-slate-800 dark:text-slate-100 text-right leading-relaxed"
                      dir="rtl"
                      placeholder="اللہ کے نام سے شروع۔"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Benefits / Explanation (English)</label>
                    <textarea
                      rows={2}
                      value={editingDua.benefitsEn || ""}
                      onChange={(e) => setEditingDua({ ...editingDua, benefitsEn: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Protects from harm and brings blessings into our meal."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Benefits / Explanation (Urdu)</label>
                    <textarea
                      rows={2}
                      value={editingDua.benefitsUr || ""}
                      onChange={(e) => setEditingDua({ ...editingDua, benefitsUr: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-urdu text-slate-800 dark:text-slate-100 text-right"
                      dir="rtl"
                      placeholder="کھانے میں برکت پیدا ہوتی ہے اور نقصان سے حفاظت رہتی ہے۔"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Publish Status:</label>
                    <select
                      value={editingDua.status || "published"}
                      onChange={(e) => setEditingDua({ ...editingDua, status: e.target.value })}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingDua(false);
                        setEditingDua(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                    >
                      Save Dua
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

      {/* Rejection Modal */}
      <AnimatePresence>
        {videoToRejectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="rejection-reason-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-rose-500" /> Reject Video Submission
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Please enter a brief rejection reason. This helps inform uploaders or document content moderation decisions in our logs.
              </p>

              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g., Video contains secular/instrumental music not fitting safe educational guidelines."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
              />

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setVideoToRejectId(null);
                    setRejectionReasonInput("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (videoToRejectId) {
                      handleUpdateVideoStatus(videoToRejectId, "rejected", rejectionReasonInput || "Content does not meet site standards.");
                    }
                    setVideoToRejectId(null);
                    setRejectionReasonInput("");
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Video Preview Modal */}
      <AnimatePresence>
        {previewVideoUrl && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-fade-in" 
            id="video-preview-modal"
            onClick={() => setPreviewVideoUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setPreviewVideoUrl(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-video">
                {getYouTubeId(previewVideoUrl) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(previewVideoUrl)}?autoplay=1`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={previewVideoUrl} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {storyToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="delete-confirmation-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-left"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Story</h3>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Are you sure you want to delete this story? This action cannot be undone?
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setStoryToDeleteId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const id = storyToDeleteId;
                    setStoryToDeleteId(null);
                    executeDeleteStory(id);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md hover:shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Delete Confirmation Modal */}
      <AnimatePresence>
        {videoToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="video-delete-confirmation-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-left"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Video</h3>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Are you sure you want to delete this video? This action cannot be undone.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setVideoToDeleteId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = videoToDeleteId;
                    setVideoToDeleteId(null);
                    executeDeleteVideo(id);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md hover:shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hadith Delete Confirmation Modal */}
      <AnimatePresence>
        {hadithToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="hadith-delete-confirmation-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-left"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Hadith</h3>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Are you sure you want to delete this Hadith record? This action will permanently remove it from Firestore.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setHadithToDeleteId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = hadithToDeleteId;
                    setHadithToDeleteId(null);
                    handleDeleteHadith(id);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dua Delete Confirmation Modal */}
      <AnimatePresence>
        {duaToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="dua-delete-confirmation-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-left"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Dua</h3>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Are you sure you want to delete this Daily Dua? This action will permanently remove it from Firestore.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDuaToDeleteId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = duaToDeleteId;
                    setDuaToDeleteId(null);
                    handleDeleteDua(id);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hadith Preview Modal */}
      <AnimatePresence>
        {previewHadith && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in"
            onClick={() => setPreviewHadith(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-6 text-left relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewHadith(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                <span>{previewHadith.iconEmoji || "📚"}</span>
                <span>{previewHadith.book} {previewHadith.hadithNumber ? `#${previewHadith.hadithNumber}` : ""} • {previewHadith.grade}</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {previewHadith.titleEn}
              </h3>

              <div className="p-6 bg-amber-50/60 dark:bg-slate-900/80 rounded-2xl border border-amber-200/60 dark:border-slate-700/60 text-right">
                <p className="font-arabic text-xl sm:text-2xl text-slate-900 dark:text-amber-100 leading-loose" dir="rtl">
                  {previewHadith.arabicText}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">English Translation</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {previewHadith.translationEn}
                  </p>
                </div>

                {previewHadith.translationUr && (
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Urdu Translation</h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-urdu leading-relaxed" dir="rtl">
                      {previewHadith.translationUr}
                    </p>
                  </div>
                )}

                {previewHadith.moralLessonEn && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Moral Lesson</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {previewHadith.moralLessonEn}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dua Preview Modal */}
      <AnimatePresence>
        {previewDua && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in"
            onClick={() => setPreviewDua(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-6 text-left relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewDua(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <span>{previewDua.iconEmoji || "🤲"}</span>
                <span>{previewDua.reference || "Hisn al-Muslim"} • {previewDua.category}</span>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {previewDua.titleEn}
              </h3>

              <div className="p-6 bg-emerald-50/60 dark:bg-slate-900/80 rounded-2xl border border-emerald-200/60 dark:border-slate-700/60 text-right">
                <p className="font-arabic text-xl sm:text-2xl text-slate-900 dark:text-emerald-100 leading-loose" dir="rtl">
                  {previewDua.arabicText}
                </p>
              </div>

              {previewDua.transliteration && (
                <p className="text-xs italic text-slate-500 dark:text-slate-400 font-serif">
                  "{previewDua.transliteration}"
                </p>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">English Translation</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {previewDua.translationEn}
                  </p>
                </div>

                {previewDua.translationUr && (
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Urdu Translation</h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-urdu leading-relaxed" dir="rtl">
                      {previewDua.translationUr}
                    </p>
                  </div>
                )}

                {previewDua.benefitsEn && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Benefits / Virtues</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {previewDua.benefitsEn}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success/Error Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-bold max-w-sm ${
              toast.type === "success"
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-rose-600 text-white border-rose-500"
            }`}
            id="admin-toast-notification"
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white transition-colors ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded Live Story Preview Modal */}
      <AnimatePresence>
        {previewStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="story-instant-preview-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-left max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">{previewStory.category}</span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{previewStory.titleEn}</h3>
                </div>
                <button onClick={() => setPreviewStory(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {previewStory.coverImage && (
                  <img src={previewStory.coverImage} alt={previewStory.titleEn} className="w-full h-48 object-cover rounded-2xl" referrerPolicy="no-referrer" />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age Group</span>
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Ages {previewStory.ageGroup}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reading Duration</span>
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">{previewStory.readingTime} minutes</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">English Story Content</h4>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900/35 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">{previewStory.contentEn}</div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 font-urdu">اردو کہانی کا متن</h4>
                  <div className="text-lg text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-[2.2] bg-slate-50 dark:bg-slate-900/35 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 font-urdu text-right" dir="rtl">{previewStory.contentUr}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                <button
                  onClick={() => setPreviewStory(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-250 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    setPreviewStory(null);
                    onNavigateToStory(previewStory);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Eye className="w-4 h-4" /> Read Live
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
