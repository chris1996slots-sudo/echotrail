import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Play,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Download,
  X,
  AlertCircle,
  Video,
  ArrowLeft
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { ConfirmDialog } from '../components/ConfirmDialog';
import api from '../services/api';

export function VideoArchivePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState({});
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [apiConfigured, setApiConfigured] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    loadVideos();
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  // Auto-refresh pending/processing videos every 10 seconds (only if API is configured)
  useEffect(() => {
    if (!apiConfigured) return;

    const interval = setInterval(() => {
      // Use functional state update to avoid dependency on videos
      setVideos(currentVideos => {
        const pendingVideos = currentVideos.filter(v => v.status === 'pending' || v.status === 'processing');

        if (pendingVideos.length > 0) {
          // Refresh each pending video
          pendingVideos.forEach(async (video) => {
            if (video.status === 'completed' || video.status === 'failed') return;

            try {
              const updated = await api.refreshVideoStatus(video.id);
              setVideos(prev => prev.map(v => v.id === updated.id ? updated : v));
            } catch (error) {
              // If API is not configured, disable auto-refresh silently
              if (error.message?.includes('API not configured') || error.status === 503) {
                setApiConfigured(false);
              }
              // Don't log other errors in auto-refresh to avoid console spam
            }
          });
        }

        return currentVideos; // Don't modify videos in this update
      });
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [apiConfigured]); // ONLY depend on apiConfigured, NOT on videos!

  const loadVideos = async () => {
    try {
      const data = await api.getVideos();
      setVideos(data);

      // Check if any videos are pending/processing and try to refresh one to test API
      const pendingVideo = data.find(v => v.status === 'pending' || v.status === 'processing');
      if (pendingVideo) {
        // Test if API is configured by trying to refresh
        try {
          await api.refreshVideoStatus(pendingVideo.id);
        } catch (error) {
          // If API not configured, disable auto-refresh immediately
          if (error.message?.includes('API not configured') || error.status === 503) {
            setApiConfigured(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (video) => {
    if (video.status === 'completed' || video.status === 'failed') return;

    setRefreshing(prev => ({ ...prev, [video.id]: true }));
    try {
      const updated = await api.refreshVideoStatus(video.id);
      setVideos(prev => prev.map(v => v.id === updated.id ? updated : v));
    } catch (error) {
      // If API is not configured, disable auto-refresh silently
      if (error.message?.includes('API not configured') || error.status === 503) {
        setApiConfigured(false);
        // Don't log this error - it's expected when API key is missing
      } else {
        console.error('Failed to refresh video:', error);
      }
    } finally {
      setRefreshing(prev => ({ ...prev, [video.id]: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteVideo(id);
      setVideos(prev => prev.filter(v => v.id !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing...';
      default:
        return 'In Queue';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = videos.filter(v => v.status === 'pending' || v.status === 'processing').length;
  const completedCount = videos.filter(v => v.status === 'completed').length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-navy-dark via-navy to-navy-dark py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <FadeIn>
            <Link
              to="/echo-sim"
              className="inline-flex items-center gap-2 text-cream/60 hover:text-gold transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Echo Simulator
            </Link>
          </FadeIn>

          {/* Header */}
          <FadeIn delay={0.05}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold-light/20 mb-4">
                <Film className="w-8 h-8 text-gold" />
              </div>
              <h1 className="text-3xl font-serif text-cream mb-2">Video Archive</h1>
              <p className="text-cream/60">All your generated Echo videos in one place</p>
            </div>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-serif text-gold">{videos.length}</p>
                <p className="text-cream/50 text-sm">Total Videos</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-serif text-green-400">{completedCount}</p>
                <p className="text-cream/50 text-sm">Completed</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-serif text-yellow-400">{pendingCount}</p>
                <p className="text-cream/50 text-sm">In Progress</p>
              </div>
              <div className="glass-card p-4 text-center">
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      // Reload videos from DB
                      const data = await api.getVideos();
                      setVideos(data);

                      // Filter pending videos from fresh data
                      const pendingVideos = data.filter(v => v.status === 'pending' || v.status === 'processing');

                      if (pendingVideos.length > 0) {
                        // Re-enable API check
                        setApiConfigured(true);
                        // Refresh all pending videos
                        for (const video of pendingVideos) {
                          await handleRefresh(video);
                        }
                      }
                    } catch (error) {
                      console.error('Failed to refresh:', error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={`text-cream/60 hover:text-gold transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-6 h-6 mx-auto ${loading ? 'animate-spin' : ''}`} />
                </button>
                <p className="text-cream/50 text-sm mt-1">Refresh All</p>
              </div>
            </div>
          </FadeIn>

          {/* Video Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <FadeIn delay={0.2}>
              <div className="glass-card p-12 text-center">
                <Video className="w-16 h-16 text-cream/30 mx-auto mb-4" />
                <h3 className="text-xl font-serif text-cream mb-2">No Videos Yet</h3>
                <p className="text-cream/50">
                  Generate your first video in the Echo Simulator to see it here.
                </p>
              </div>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <StaggerItem key={video.id} index={index}>
                  <motion.div
                    className="glass-card overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Video Preview / Thumbnail */}
                    <div
                      className="relative aspect-video bg-navy-dark/50 cursor-pointer"
                      onClick={() => video.status === 'completed' && setSelectedVideo(video)}
                    >
                      {video.status === 'completed' && video.videoUrl ? (
                        <>
                          <video
                            src={video.videoUrl}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center">
                              <Play className="w-8 h-8 text-navy-dark ml-1" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {video.status === 'failed' ? (
                            <>
                              <XCircle className="w-12 h-12 text-red-400 mb-2" />
                              <p className="text-red-400 text-sm">Generation Failed</p>
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-12 h-12 text-gold/50 animate-spin mb-2" />
                              <p className="text-cream/50 text-sm">
                                {video.status === 'processing' ? 'Processing...' : 'In Queue...'}
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-cream font-medium truncate flex-1 mr-2">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(video.status)}
                          <span className={`text-xs ${
                            video.status === 'completed' ? 'text-green-400' :
                            video.status === 'failed' ? 'text-red-400' :
                            video.status === 'processing' ? 'text-blue-400' :
                            'text-yellow-400'
                          }`}>
                            {getStatusText(video.status)}
                          </span>
                        </div>
                      </div>

                      <p className="text-cream/50 text-sm line-clamp-2 mb-3">
                        {video.text}
                      </p>

                      <div className="flex items-center justify-between text-xs text-cream/40">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(video.createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          {(video.status === 'pending' || video.status === 'processing') && (
                            <button
                              onClick={() => handleRefresh(video)}
                              disabled={refreshing[video.id]}
                              className="p-1 hover:bg-cream/10 rounded transition-colors"
                              title="Check Status"
                            >
                              <RefreshCw className={`w-4 h-4 ${refreshing[video.id] ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          {video.status === 'completed' && video.videoUrl && (
                            <a
                              href={video.videoUrl}
                              download={`${video.title}.mp4`}
                              className="p-1 hover:bg-cream/10 rounded transition-colors"
                              title="Download"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setConfirmDelete(video)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400/60 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {video.status === 'failed' && video.error && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded text-red-400 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{video.error}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Video Player Modal */}
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              onClick={() => setSelectedVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute -top-12 right-0 text-cream/60 hover:text-cream transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>

                <div className="glass-card overflow-hidden">
                  <video
                    ref={videoRef}
                    src={selectedVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full aspect-video bg-black"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-serif text-cream mb-2">{selectedVideo.title}</h3>
                    <p className="text-cream/60 text-sm">{selectedVideo.text}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-cream/40">
                      <span>{formatDate(selectedVideo.createdAt)}</span>
                      {selectedVideo.videoUrl && (
                        <a
                          href={selectedVideo.videoUrl}
                          download={`${selectedVideo.title}.mp4`}
                          className="flex items-center gap-1 text-gold hover:text-gold-light transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!confirmDelete}
          title="Delete Video"
          message={`Are you sure you want to delete "${confirmDelete?.title}"? This cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      </div>
    </PageTransition>
  );
}

export default VideoArchivePage;
