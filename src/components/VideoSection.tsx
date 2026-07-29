import React, { useState, useEffect } from "react";
import { Video } from "../types";
import { 
  Play, Clock, Search, Sparkles, Filter, PlayCircle, X, ExternalLink, Calendar, ChevronRight, Eye,
  AlertTriangle, UploadCloud, Check, CheckCircle, ThumbsUp, Plus, Heart, Info, Flag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Language, getTranslation } from "../lib/translations";

interface VideoSectionProps {
  darkMode: boolean;
  language?: Language;
}

export default function VideoSection({ darkMode, language = "en" }: VideoSectionProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeAgeFilter, setActiveAgeFilter] = useState<string>("all");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Video submission states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionModerationAlert, setSubmissionModerationAlert] = useState<string | null>(null);
  
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitDescription, setSubmitDescription] = useState("");
  const [submitCategory, setSubmitCategory] = useState("Prophets Stories");
  const [submitAgeGroup, setSubmitAgeGroup] = useState("all");
  const [submitVideoUrl, setSubmitVideoUrl] = useState("");
  const [submitThumbnail, setSubmitThumbnail] = useState("");
  const [submitUploaderName, setSubmitUploaderName] = useState("");
  const [submitUploaderEmail, setSubmitUploaderEmail] = useState("");
  const [submitDuration, setSubmitDuration] = useState("");

  // Video reporting states
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportedStatus, setReportedStatus] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos");
      if (res.ok) {
        const data = await res.json();
        // Publicly we only show approved videos
        setVideos(data.filter((vid: Video) => !vid.status || vid.status === "approved"));
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract clean YouTube ID and embed URL
  const getYouTubeId = (url: string) => {
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
  };

  const getEmbedUrl = (url: string) => {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }
    return url;
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Client Submission] Triggered video submission form.");
    
    // 1. Client-side field validations
    const titleVal = (submitTitle || "").trim();
    const descVal = (submitDescription || "").trim();
    const urlVal = (submitVideoUrl || "").trim();
    const nameVal = (submitUploaderName || "").trim();
    const emailVal = (submitUploaderEmail || "").trim();
    const categoryVal = (submitCategory || "").trim();
    const ageGroupVal = (submitAgeGroup || "all").trim();
    const durationVal = (submitDuration || "").trim();

    console.log("[Client Submission] Fields to validate:", {
      titleVal,
      descVal,
      urlVal,
      nameVal,
      emailVal,
      categoryVal,
      ageGroupVal,
      durationVal
    });

    if (!titleVal || titleVal.length < 3 || titleVal.length > 150) {
      alert("Validation Error: Video Title is required and must be between 3 and 150 characters.");
      console.warn("[Client Submission] Validation failed on Video Title.");
      return;
    }

    if (!descVal || descVal.length < 5 || descVal.length > 1000) {
      alert("Validation Error: Short Description is required and must be between 5 and 1000 characters.");
      console.warn("[Client Submission] Validation failed on Short Description.");
      return;
    }

    if (!urlVal) {
      alert("Validation Error: YouTube URL or Shorts URL is required.");
      console.warn("[Client Submission] Validation failed: Empty URL.");
      return;
    }

    // Extract YouTube ID
    const extractedId = getYouTubeId(urlVal);
    console.log(`[Client Submission] Extracted YouTube Video ID: "${extractedId}"`);
    if (!extractedId) {
      alert("Validation Error: Invalid YouTube or YouTube Shorts URL. Please verify the URL and try again.");
      console.warn("[Client Submission] Validation failed: Invalid YouTube URL structure.");
      return;
    }

    if (!nameVal || nameVal.length < 2) {
      alert("Validation Error: Your Name is required and must be at least 2 characters.");
      console.warn("[Client Submission] Validation failed on Submitter Name.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmissionModerationAlert(null);

      // Auto-extract thumbnail if empty
      let thumb = submitThumbnail.trim();
      if (!thumb) {
        thumb = `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`;
      }

      const payload = {
        title: titleVal,
        description: descVal,
        youtubeUrl: urlVal,
        videoUrl: urlVal, // Compatibility
        youtubeVideoId: extractedId,
        category: categoryVal,
        ageGroup: ageGroupVal,
        thumbnail: thumb,
        submittedBy: nameVal,
        uploaderName: nameVal, // Compatibility
        email: emailVal,
        uploaderEmail: emailVal, // Compatibility
        duration: durationVal || "5:00"
      };

      console.log("[Client Submission] Sending POST to /api/videos/submit with payload:", payload);

      const res = await fetch("/api/videos/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("[Client Submission] Received response from server:", res.status, data);

      if (res.ok) {
        setSubmissionSuccess(true);
        console.log("[Client Submission] Video submitted successfully!");
        
        // Reset form fields
        setSubmitTitle("");
        setSubmitDescription("");
        setSubmitCategory("Prophets Stories");
        setSubmitAgeGroup("all");
        setSubmitVideoUrl("");
        setSubmitThumbnail("");
        setSubmitUploaderName("");
        setSubmitUploaderEmail("");
        setSubmitDuration("");
        
        // Refresh video lists
        fetchVideos();
      } else {
        console.error("[Client Submission] Server returned an error:", data.error);
        alert(data.error || "Submission failed. Please check inputs and try again.");
      }
    } catch (err: any) {
      console.error("[Client Submission] Network or unexpected error:", err);
      alert("An unexpected error occurred: " + err.message);
    } finally {
      console.log("[Client Submission] Submission sequence finalized. Exiting loading state.");
      setIsSubmitting(false);
    }
  };

  const handleReportVideo = async (videoId: string) => {
    try {
      setReportingId(videoId);
      const res = await fetch(`/api/videos/${videoId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setReportedStatus({ ...reportedStatus, [videoId]: true });
      }
    } catch (err) {
      console.error("Error reporting video:", err);
    } finally {
      setReportingId(null);
    }
  };

  const categories = ["all", "Prophets Stories", "Islamic Morals", "Quran Stories", "Duas"];
  const ageGroups = [
    { value: "all", label: "All Ages" },
    { value: "4-6", label: "Ages 4-6" },
    { value: "7-9", label: "Ages 7-9" },
    { value: "10-12", label: "Ages 10-12" }
  ];

  const filteredVideos = videos.filter(vid => {
    const matchesSearch = searchQuery === "" || 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || vid.category === activeCategory;
    const matchesAge = activeAgeFilter === "all" || vid.ageGroup === activeAgeFilter || vid.ageGroup === "all";

    return matchesSearch && matchesCategory && matchesAge;
  });

  const featuredVideo = videos.find(vid => vid.isFeatured) || videos[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="video-section-container">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 inline-block">
          🎥 Ummah Kids Academy Videos
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
          Watch & Learn Beautiful Values
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
          High-quality, handpicked Islamic educational animations and stories designed specifically for kids. Perfect for visual learning!
        </p>
        
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              setIsSubmitModalOpen(true);
              setSubmissionSuccess(false);
              setSubmissionModerationAlert(null);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Share a Kids Video • ویڈیو جمع کروائیں
          </button>
          <a
            href="#video-search-input"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-750 transition-all"
          >
            Browse Library
          </a>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-emerald-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold">Loading kids video library...</span>
        </div>
      ) : (
        <>
          {/* Featured Video Widescreen Banner */}
          {featuredVideo && !searchQuery && activeCategory === "all" && activeAgeFilter === "all" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-14 overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-6 shadow-sm"
              id="featured-video-banner"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Banner Thumbnail (Click to play) */}
                <div className="lg:col-span-7 relative aspect-video rounded-2xl overflow-hidden group shadow-lg">
                  <img 
                    src={featuredVideo.thumbnail} 
                    alt={featuredVideo.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center group-hover:bg-black/35 transition-colors cursor-pointer" onClick={() => setSelectedVideo(featuredVideo)}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
                    </div>
                  </div>
                  {/* Duration Badge */}
                  <span className="absolute bottom-4 right-4 px-3 py-1 bg-black/75 backdrop-blur-xs text-white rounded-lg text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredVideo.duration}
                  </span>
                  {/* Featured Badge */}
                  <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-extrabold shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured Video
                  </span>
                </div>

                {/* Banner Content */}
                <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                      {featuredVideo.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      Age {featuredVideo.ageGroup === 'all' ? 'All ages' : featuredVideo.ageGroup}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                    {featuredVideo.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
                    {featuredVideo.description}
                  </p>
                  <button 
                    onClick={() => setSelectedVideo(featuredVideo)}
                    className="mt-2 w-fit px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 dark:shadow-none hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="w-5 h-5 fill-white" />
                    Watch Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search, Filters and Sorting Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 mb-10 shadow-2xs space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Search input */}
              <div className="md:col-span-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search video titles or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 text-slate-850 dark:text-slate-105 focus:outline-hidden text-sm"
                  id="video-search-input"
                />
              </div>

              {/* Age Filters dropdown */}
              <div className="md:col-span-6 flex gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  Filter ages:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ageGroups.map((age) => (
                    <button
                      key={age.value}
                      onClick={() => setActiveAgeFilter(age.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        activeAgeFilter === age.value
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-750"
                      }`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category horizontal scrolling filters */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-2">Categories:</span>
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer capitalize ${
                      activeCategory === cat
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Videos Grid List */}
          {filteredVideos.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-850 p-8">
              <Play className="w-12 h-12 text-slate-350 mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-350">No videos found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No videos match your search criteria. Try choosing a different category or clearing the search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredVideos.map((vid, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={vid.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-750 hover:border-emerald-500/30 dark:hover:border-emerald-400/20 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group h-full"
                >
                  {/* Card Image Thumbnail */}
                  <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => setSelectedVideo(vid)}>
                    <img 
                      src={vid.thumbnail} 
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-350"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white rounded-md text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {vid.duration}
                    </span>
                    {/* Age Badge */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-bold">
                      Age {vid.ageGroup === 'all' ? 'All' : vid.ageGroup}
                    </span>
                  </div>

                  {/* Card Info Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                      {vid.category}
                    </span>
                    <h4 
                      onClick={() => setSelectedVideo(vid)}
                      className="text-base font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer leading-snug transition-colors line-clamp-1"
                    >
                      {vid.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2 flex-1">
                      {vid.description}
                    </p>
                    <div className="border-t border-slate-50 dark:border-slate-700/50 mt-4 pt-3 flex items-center justify-between">
                      <button 
                        onClick={() => setSelectedVideo(vid)}
                        className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group/btn cursor-pointer"
                      >
                        Watch Animation
                        <ChevronRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Video Player Overlay Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-black/85 backdrop-blur-sm"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-800"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
                    {selectedVideo.category} • Age {selectedVideo.ageGroup === 'all' ? 'All ages' : selectedVideo.ageGroup}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold truncate max-w-[280px] sm:max-w-[500px]">
                    {selectedVideo.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player body */}
              <div className="relative aspect-video bg-black flex-1 w-full">
                <iframe
                  src={getEmbedUrl(selectedVideo.videoUrl)}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>

              {/* Video Player Meta details */}
              <div className="p-6 bg-slate-950 space-y-2 overflow-y-auto max-h-[160px] scrollbar-thin scrollbar-thumb-slate-800 text-left">
                <p className="text-xs text-slate-350 leading-relaxed">
                  {selectedVideo.description}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider items-center">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Duration: {selectedVideo.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Added: {new Date(selectedVideo.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                  <a 
                    href={selectedVideo.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1 text-emerald-400 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in YouTube
                  </a>

                  {/* Report Button */}
                  <button
                    disabled={!!reportedStatus[selectedVideo.id] || reportingId === selectedVideo.id}
                    onClick={() => handleReportVideo(selectedVideo.id)}
                    className={`flex items-center gap-1.5 font-bold transition-all ml-auto ${
                      reportedStatus[selectedVideo.id]
                        ? "text-amber-500 cursor-default"
                        : "text-slate-500 hover:text-rose-500 cursor-pointer"
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${reportedStatus[selectedVideo.id] ? "fill-amber-500 text-amber-500" : ""}`} />
                    {reportingId === selectedVideo.id ? (
                      "Reporting..."
                    ) : reportedStatus[selectedVideo.id] ? (
                      "Reported to Moderator"
                    ) : (
                      "Report Video"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Video Submission Modal */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="user-submit-video-modal" onClick={() => setIsSubmitModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-150 dark:border-slate-700 text-left max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-emerald-600" /> Share a Kids Video • ویڈیو جمع کروائیں
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Submit children-safe Islamic animations/lessons. Every video is verified by our AI and admin team.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success / Auto-rejection states */}
              {submissionSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Submitted Successfully!</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-355 max-w-md mx-auto leading-relaxed">
                    Thank you! Your video has been submitted successfully and is waiting for Admin approval.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setIsSubmitModalOpen(false);
                        setSubmissionSuccess(false);
                      }}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Done • مکمل
                    </button>
                  </div>
                </div>
              ) : submissionModerationAlert ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-550 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-rose-600 dark:text-rose-400">Submission Blocked by Moderation Filters</h4>
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-350 rounded-xl max-w-md mx-auto leading-relaxed text-left space-y-2 border border-rose-100 dark:border-rose-900/40">
                    <span className="font-bold block text-rose-850 dark:text-rose-300">Flagged Reason:</span>
                    <p>{submissionModerationAlert}</p>
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Our AI auto-moderator has detected content that does not meet Ummah Kids website rules (e.g., secular/instrumental music, incorrect topic, or sensitive content). Please edit and submit a compliant video.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSubmissionModerationAlert(null)}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-xl hover:bg-slate-200"
                    >
                      Try Again • دوبارہ کوشش کریں
                    </button>
                    <button
                      onClick={() => setIsSubmitModalOpen(false)}
                      className="px-5 py-2.5 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-100"
                    >
                      Close • بند کریں
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitVideo} className="space-y-5">
                  {/* General Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Video Title / عنوان <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={submitTitle}
                        onChange={(e) => setSubmitTitle(e.target.value)}
                        placeholder="e.g., Story of Prophet Ibrahim (AS)"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 text-sm text-slate-850 dark:text-slate-105 placeholder-slate-400 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Category / زمرہ
                      </label>
                      <select
                        value={submitCategory}
                        onChange={(e) => setSubmitCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 text-sm text-slate-855 dark:text-slate-105 focus:outline-hidden"
                      >
                        <option value="Prophets Stories">Prophets Stories</option>
                        <option value="Islamic Morals">Islamic Morals</option>
                        <option value="Quran Stories">Quran Stories</option>
                        <option value="Duas">Duas</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        YouTube URL / لنک <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={submitVideoUrl}
                        onChange={(e) => setSubmitVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 text-sm text-slate-855 dark:text-slate-105 placeholder-slate-400 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Age Group / عمر کا گروپ
                      </label>
                      <select
                        value={submitAgeGroup}
                        onChange={(e) => setSubmitAgeGroup(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 text-sm text-slate-855 dark:text-slate-105 focus:outline-hidden"
                      >
                        <option value="all">All Ages</option>
                        <option value="4-6">Ages 4-6</option>
                        <option value="7-9">Ages 7-9</option>
                        <option value="10-12">Ages 10-12</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Duration (e.g. 5:20) / دورانیہ
                      </label>
                      <input
                        type="text"
                        value={submitDuration}
                        onChange={(e) => setSubmitDuration(e.target.value)}
                        placeholder="e.g., 4:35"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 text-sm text-slate-855 dark:text-slate-105 placeholder-slate-400 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Custom Thumbnail Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={submitThumbnail}
                        onChange={(e) => setSubmitThumbnail(e.target.value)}
                        placeholder="Leave blank to auto-generate from YouTube"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 text-sm text-slate-855 dark:text-slate-105 placeholder-slate-400 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Short Description / تفصیل <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      value={submitDescription}
                      onChange={(e) => setSubmitDescription(e.target.value)}
                      placeholder="Briefly summarize what this video teaches children..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 text-sm text-slate-855 dark:text-slate-105 placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>

                  {/* Submitter Info */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Submitter Details (Keep informed on review status)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <input
                          type="text"
                          required
                          value={submitUploaderName}
                          onChange={(e) => setSubmitUploaderName(e.target.value)}
                          placeholder="Your Name / آپ کا نام *"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <input
                          type="email"
                          value={submitUploaderEmail}
                          onChange={(e) => setSubmitUploaderEmail(e.target.value)}
                          placeholder="Your Email (Optional)"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(false)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                    >
                      Cancel • منسوخ کریں
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Moderating Video...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" /> Submit Video
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
