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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
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

  // Persona
  async getPersona() {
    return this.request('/api/persona');
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

  async synthesizeVoice(text, voiceId) {
    return this.request('/api/ai/voice/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId }),
    });
  }

  async getVoices() {
    return this.request('/api/ai/voice/list');
  }

  async generateAvatar(text, avatarId) {
    return this.request('/api/ai/avatar/generate', {
      method: 'POST',
      body: JSON.stringify({ text, avatarId }),
    });
  }

  async getAvatarStatus(videoId) {
    return this.request(`/api/ai/avatar/status/${videoId}`);
  }

  async getAvatars() {
    return this.request('/api/ai/avatar/list');
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
}

export const api = new ApiService();
export default api;
