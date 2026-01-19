// In production, use relative URLs (same origin). In development, use localhost
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

class ApiService {
  constructor() {
    this.token = localStorage.getItem('echotrail_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('echotrail_token', token);
    } else {
      localStorage.removeItem('echotrail_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Try to parse JSON, handle non-JSON responses gracefully
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseError) {
        // JSON parsing failed
        const text = await response.text().catch(() => '');
        throw new Error(`Invalid JSON response: ${text || response.statusText}`);
      }
    } else {
      // Non-JSON response
      const text = await response.text().catch(() => '');
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      data = { message: text };
    }

    if (!response.ok) {
      // Include debug info if available
      const errorMessage = data.error || data.message || 'Request failed';
      const error = new Error(errorMessage);
      error.debug = data.debug;
      error.status = response.status;
      throw error;
    }

    return data;
  }

  // Auth
  async register(userData) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async updateLanguage(language) {
    return this.request('/api/auth/language', {
      method: 'PUT',
      body: JSON.stringify({ language }),
    });
  }

  async updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Persona
  async getPersona() {
    return this.request('/api/persona');
  }

  async getLegacyProgress() {
    return this.request('/api/persona/legacy-progress');
  }

  async updateValues(values) {
    return this.request('/api/persona/values', {
      method: 'PUT',
      body: JSON.stringify(values),
    });
  }

  async updateVibe(echoVibe) {
    return this.request('/api/persona/vibe', {
      method: 'PUT',
      body: JSON.stringify({ echoVibe }),
    });
  }

  async addStory(story) {
    return this.request('/api/persona/stories', {
      method: 'POST',
      body: JSON.stringify(story),
    });
  }

  async deleteStory(id) {
    return this.request(`/api/persona/stories/${id}`, { method: 'DELETE' });
  }

  async updateStory(id, content) {
    return this.request(`/api/persona/stories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  // Memories
  async getMemories() {
    return this.request('/api/memories');
  }

  async createMemory(memory) {
    return this.request('/api/memories', {
      method: 'POST',
      body: JSON.stringify(memory),
    });
  }

  async updateMemory(id, memory) {
    return this.request(`/api/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memory),
    });
  }

  async deleteMemory(id) {
    return this.request(`/api/memories/${id}`, { method: 'DELETE' });
  }

  // Time Capsules
  async getTimeCapsules() {
    return this.request('/api/time-capsules');
  }

  async createTimeCapsule(capsule) {
    return this.request('/api/time-capsules', {
      method: 'POST',
      body: JSON.stringify(capsule),
    });
  }

  async updateTimeCapsule(id, capsule) {
    return this.request(`/api/time-capsules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(capsule),
    });
  }

  async deleteTimeCapsule(id) {
    return this.request(`/api/time-capsules/${id}`, { method: 'DELETE' });
  }

  // Wisdom Chat
  async getWisdomChats() {
    return this.request('/api/wisdom/chat');
  }

  async sendWisdomMessage(message, options = {}) {
    return this.request('/api/wisdom/chat', {
      method: 'POST',
      body: JSON.stringify({ message, ...options }),
    });
  }

  // Text-to-Speech with voice clone
  async textToSpeech(text) {
    const response = await fetch(`${API_URL}/api/ai/voice/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      credentials: 'include',
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'TTS failed');
    }

    return response.blob();
  }

  async clearWisdomChat() {
    return this.request('/api/wisdom/chat', { method: 'DELETE' });
  }

  // AI Services
  async generateText(prompt, context) {
    return this.request('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    });
  }

  async generateEchoResponse(message) {
    return this.request('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: message }),
    });
  }

  async synthesizeVoice(text, voiceId) {
    return this.request('/api/ai/voice/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId }),
    });
  }

  async getVoices() {
    return this.request('/api/ai/voice/list');
  }

  async generateAvatar(text) {
    return this.request('/api/ai/avatar/generate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getAvatarStatus(videoId) {
    return this.request(`/api/ai/avatar/status/${videoId}`);
  }

  async getAvatars() {
    return this.request('/api/ai/avatar/list');
  }

  // HeyGen Photo Avatar
  async createPhotoAvatar(imageData, name) {
    return this.request('/api/ai/avatar/create-photo-avatar', {
      method: 'POST',
      body: JSON.stringify({ imageData, name }),
    });
  }

  async getPhotoAvatarStatus() {
    return this.request('/api/ai/avatar/photo-status');
  }

  async refreshPhotoAvatar() {
    return this.request('/api/ai/avatar/refresh-talking-photo', {
      method: 'POST',
    });
  }

  // HeyGen Streaming Avatar
  async getStreamingToken() {
    return this.request('/api/ai/avatar/streaming/token', {
      method: 'POST',
    });
  }

  async getStreamingConfig() {
    return this.request('/api/ai/avatar/streaming/config');
  }

  // Avatar Images
  async uploadAvatar(imageData, label, setActive = false, echoVibe = 'compassionate') {
    return this.request('/api/persona/avatar', {
      method: 'POST',
      body: JSON.stringify({ imageData, label, setActive, echoVibe }),
    });
  }

  async updateAvatar(id, data) {
    return this.request(`/api/persona/avatar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAvatar(id) {
    return this.request(`/api/persona/avatar/${id}`, { method: 'DELETE' });
  }

  async updateAvatarSettings(settings) {
    return this.request('/api/persona/avatar-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Voice Samples
  async getVoiceSamples() {
    return this.request('/api/persona/voice-samples');
  }

  async uploadVoiceSample(audioData, label, duration, prompt) {
    return this.request('/api/persona/voice-samples', {
      method: 'POST',
      body: JSON.stringify({ audioData, label, duration, prompt }),
    });
  }

  async updateVoiceSample(id, data) {
    return this.request(`/api/persona/voice-samples/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVoiceSample(id) {
    return this.request(`/api/persona/voice-samples/${id}`, { method: 'DELETE' });
  }

  // Voice Cloning
  async getVoiceCloneStatus() {
    return this.request('/api/ai/voice/clone/status');
  }

  async createVoiceClone(name, description) {
    return this.request('/api/ai/voice/clone', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteVoiceClone() {
    return this.request('/api/ai/voice/clone', { method: 'DELETE' });
  }

  // Support Chat
  async getSupportChat() {
    return this.request('/api/support/chat');
  }

  async sendSupportMessage(content) {
    return this.request('/api/support/chat/message', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async closeSupportChat() {
    return this.request('/api/support/chat/close', { method: 'POST' });
  }

  // Admin - Support
  async getAdminSupportChats(status = 'open') {
    return this.request(`/api/support/admin/chats?status=${status}`);
  }

  async getAdminSupportChat(id) {
    return this.request(`/api/support/admin/chats/${id}`);
  }

  async sendAdminSupportMessage(chatId, content) {
    return this.request(`/api/support/admin/chats/${chatId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async closeAdminSupportChat(chatId) {
    return this.request(`/api/support/admin/chats/${chatId}/close`, { method: 'POST' });
  }

  async reopenAdminSupportChat(chatId) {
    return this.request(`/api/support/admin/chats/${chatId}/reopen`, { method: 'POST' });
  }

  async archiveAdminSupportChat(chatId) {
    return this.request(`/api/support/admin/chats/${chatId}/archive`, { method: 'POST' });
  }

  async deleteAdminSupportChat(chatId) {
    return this.request(`/api/support/admin/chats/${chatId}`, { method: 'DELETE' });
  }

  // Support Avatar Settings
  async getSupportAvatar() {
    return this.request('/api/admin/support-avatar');
  }

  async updateSupportAvatar(name, imageUrl) {
    return this.request('/api/admin/support-avatar', {
      method: 'PUT',
      body: JSON.stringify({ name, imageUrl }),
    });
  }

  // Support Quick Replies
  async getSupportQuickReplies() {
    return this.request('/api/admin/support-quick-replies');
  }

  async updateSupportQuickReplies(replies) {
    return this.request('/api/admin/support-quick-replies', {
      method: 'PUT',
      body: JSON.stringify({ replies }),
    });
  }

  // Admin - User Details
  async getAdminUserDetails(userId) {
    return this.request(`/api/admin/users/${userId}/details`);
  }

  // Referral System
  async getMyReferral() {
    return this.request('/api/referral/my-referral');
  }

  async getMyReferrals() {
    return this.request('/api/referral/my-referrals');
  }

  async validateReferralCode(code) {
    return this.request(`/api/referral/validate/${code}`);
  }

  // Admin - Referral Settings
  async getAdminReferralSettings() {
    return this.request('/api/admin/referral/settings');
  }

  async updateAdminReferralSettings(settings) {
    return this.request('/api/admin/referral/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getAdminReferralStats() {
    return this.request('/api/admin/referral/stats');
  }

  async getAdminReferralList() {
    return this.request('/api/admin/referral/list');
  }

  // =====================
  // Avatar IV API (Photo → Video with Voice Clone)
  // =====================

  async generateAvatarIV(text, videoTitle) {
    return this.request('/api/ai/avatar/iv/generate', {
      method: 'POST',
      body: JSON.stringify({ text, videoTitle }),
    });
  }

  async getAvatarIVStatus(videoId) {
    return this.request(`/api/ai/avatar/iv/status/${videoId}`);
  }

  // =====================
  // LiveAvatar API (Real-Time Interactive Avatar)
  // =====================

  async getLiveAvatarSession() {
    return this.request('/api/ai/liveavatar/session', {
      method: 'POST',
    });
  }

  async startLiveAvatarSession(sessionToken) {
    return this.request('/api/ai/liveavatar/start', {
      method: 'POST',
      body: JSON.stringify({ sessionToken }),
    });
  }

  async getLiveAvatarAvatars() {
    return this.request('/api/ai/liveavatar/avatars');
  }

  async getLiveAvatarStatus() {
    return this.request('/api/ai/liveavatar/status');
  }

  async uploadLiveAvatarVideo(videoData, videoType = 'training') {
    return this.request('/api/ai/liveavatar/upload-video', {
      method: 'POST',
      body: JSON.stringify({ videoData, videoType }),
    });
  }

  async createLiveAvatar(trainingVideoUrl, consentVideoUrl, name) {
    return this.request('/api/ai/liveavatar/create-avatar', {
      method: 'POST',
      body: JSON.stringify({ trainingVideoUrl, consentVideoUrl, name }),
    });
  }

  async checkLiveAvatarStatus(avatarId) {
    return this.request(`/api/ai/liveavatar/avatar-status/${avatarId}`);
  }

  async stopLiveAvatarSession(sessionToken, sessionId) {
    return this.request('/api/ai/liveavatar/stop', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, sessionId }),
    });
  }

  // =====================
  // Video Archive API
  // =====================

  async getVideos() {
    return this.request('/api/ai/videos');
  }

  async createVideoEntry(title, text, videoId, provider = 'heygen') {
    return this.request('/api/ai/videos', {
      method: 'POST',
      body: JSON.stringify({ title, text, videoId, provider }),
    });
  }

  async updateVideoStatus(videoId, data) {
    return this.request(`/api/ai/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVideo(id) {
    return this.request(`/api/ai/videos/${id}`, { method: 'DELETE' });
  }

  async refreshVideoStatus(id) {
    return this.request(`/api/ai/videos/${id}/refresh`, { method: 'POST' });
  }

  // =====================
  // Simli API (Real-Time Avatar with Voice Clone)
  // =====================

  async getSimliSession() {
    return this.request('/api/ai/simli/session', {
      method: 'POST',
    });
  }

  async startSimliSession(faceId) {
    return this.request('/api/ai/simli/start', {
      method: 'POST',
      body: JSON.stringify({ faceId }),
    });
  }

  async getSimliFaces() {
    return this.request('/api/ai/simli/faces');
  }

  async getSimliStatus() {
    return this.request('/api/ai/simli/status');
  }

  async getSimliTTS(text, voiceId, voiceSettings = null) {
    return this.request('/api/ai/simli/tts', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId, voiceSettings }),
    });
  }

  async createSimliFace(imageData, faceName) {
    return this.request('/api/ai/simli/create-face', {
      method: 'POST',
      body: JSON.stringify({ imageData, faceName }),
    });
  }

  async getSimliFaceStatus() {
    return this.request('/api/ai/simli/face-status');
  }

  // =====================
  // Family Tree API
  // =====================

  async getFamilyMembers() {
    return this.request('/api/family');
  }

  async getFamilyMember(id) {
    return this.request(`/api/family/${id}`);
  }

  async createFamilyMember(data) {
    return this.request('/api/family', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFamilyMember(id, data) {
    return this.request(`/api/family/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFamilyMember(id) {
    return this.request(`/api/family/${id}`, {
      method: 'DELETE',
    });
  }

  // =====================
  // NOTIFICATIONS API
  // =====================

  async getNotifications(unreadOnly = false) {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    return this.request(`/api/notifications${params}`);
  }

  async markNotificationAsRead(id) {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/api/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(id) {
    return this.request(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin notification routes
  async sendNotification(userIds, data) {
    return this.request('/api/notifications/admin/send', {
      method: 'POST',
      body: JSON.stringify({ userIds, ...data }),
    });
  }

  async broadcastNotification(data) {
    return this.request('/api/notifications/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNotificationTemplates() {
    return this.request('/api/notifications/admin/templates');
  }

  // ===== Echo Timeline =====
  async getTimelineEvents() {
    return this.request('/api/timeline');
  }

  async createTimelineEvent(data) {
    return this.request('/api/timeline', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTimelineEvent(id, data) {
    return this.request(`/api/timeline/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTimelineEvent(id) {
    return this.request(`/api/timeline/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== Echo Duet =====
  async getEchoDuets() {
    return this.request('/api/duets');
  }

  async createEchoDuet(data) {
    return this.request('/api/duets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEchoDuet(id) {
    return this.request(`/api/duets/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== Wisdom Cards =====
  async getWisdomCards() {
    return this.request('/api/wisdom-cards');
  }

  async getTodayWisdomCard() {
    return this.request('/api/wisdom-cards/today');
  }

  async createWisdomCard(data) {
    return this.request('/api/wisdom-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markWisdomCardAsRead(id) {
    return this.request(`/api/wisdom-cards/${id}/read`, {
      method: 'PATCH',
    });
  }

  async generateWisdomCard() {
    return this.request('/api/wisdom-cards/generate', {
      method: 'POST',
    });
  }

  // ===== Echo Games =====
  async getGameProgress() {
    return this.request('/api/games/progress');
  }

  async getGameSessions() {
    return this.request('/api/games/sessions');
  }

  async createGameSession(data) {
    return this.request('/api/games/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAchievements() {
    return this.request('/api/games/achievements');
  }

  // Helper methods for games (using existing Persona Stories and Memories APIs)
  async getLifeStories() {
    const persona = await this.getPersona();
    return persona?.lifeStories || [];
  }

  async getMemoryAnchors() {
    return this.getMemories();
  }
}

export const api = new ApiService();
export default api;
