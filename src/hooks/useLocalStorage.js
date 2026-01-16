import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Default persona structure
const defaultPersona = {
  lifeStories: [],
  avatarImages: [],
  voiceSamples: [],
  currentStep: 0,
  humor: 50,
  empathy: 50,
  tradition: 50,
  adventure: 50,
  wisdom: 50,
  creativity: 50,
  patience: 50,
  optimism: 50,
  coreValues: [],
  lifePhilosophy: '',
  avatarStyle: 'realistic',
  backgroundType: 'office',
  echoVibe: 'compassionate',
  legacyScore: 0,
  // Voice and Avatar IDs (from external APIs)
  elevenlabsVoiceId: null,
  elevenlabsVoiceName: null,
  heygenAvatarId: null,
  heygenAvatarName: null,
};

export function useEchoTrailStorage() {
  const [user, setUserState] = useState(() => {
    try {
      const item = window.localStorage.getItem('echotrail_user');
      const token = window.localStorage.getItem('echotrail_token');
      // Only return user if both user data AND token exist
      if (item && token) {
        return JSON.parse(item);
      }
      // Clear orphaned user data if token is missing
      if (item && !token) {
        window.localStorage.removeItem('echotrail_user');
      }
      return null;
    } catch {
      return null;
    }
  });

  const [persona, setPersonaState] = useState(() => {
    try {
      const item = window.localStorage.getItem('echotrail_persona');
      return item ? { ...defaultPersona, ...JSON.parse(item) } : defaultPersona;
    } catch {
      return defaultPersona;
    }
  });

  const [memories, setMemoriesState] = useState(() => {
    try {
      const item = window.localStorage.getItem('echotrail_memories');
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  const [timeCapsules, setTimeCapsulesState] = useState(() => {
    try {
      const item = window.localStorage.getItem('echotrail_timecapsules');
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  const [wisdomChats, setWisdomChatsState] = useState(() => {
    try {
      const item = window.localStorage.getItem('echotrail_wisdom_chats');
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  const [subscription, setSubscriptionState] = useState(() => {
    try {
      const item = window.localStorage.getItem('echotrail_subscription');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const syncInProgress = useRef(false);
  const saveTimeout = useRef({});

  // Helper to save to localStorage
  const saveToLocal = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  };

  // Set user and save to localStorage
  const setUser = useCallback((value) => {
    const newValue = value instanceof Function ? value(user) : value;
    setUserState(newValue);
    saveToLocal('echotrail_user', newValue);
  }, [user]);

  // Debounced save to database for persona
  const savePersonaToDb = useCallback(async (personaData) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return;

    try {
      // Save values
      await api.updateValues({
        humor: personaData.humor,
        empathy: personaData.empathy,
        tradition: personaData.tradition,
        adventure: personaData.adventure,
        wisdom: personaData.wisdom,
        creativity: personaData.creativity,
        patience: personaData.patience,
        optimism: personaData.optimism,
        coreValues: personaData.coreValues,
        lifePhilosophy: personaData.lifePhilosophy,
      });

      // Save vibe
      if (personaData.echoVibe) {
        await api.updateVibe(personaData.echoVibe);
      }

      // Save avatar settings
      if (personaData.avatarStyle || personaData.backgroundType) {
        await api.updateAvatarSettings({
          avatarStyle: personaData.avatarStyle,
          backgroundType: personaData.backgroundType,
        });
      }
    } catch (error) {
      console.error('Failed to save persona to database:', error);
    }
  }, [user]);

  // Set persona with database sync
  const setPersona = useCallback((value) => {
    const newValue = value instanceof Function ? value(persona) : value;
    setPersonaState(newValue);
    saveToLocal('echotrail_persona', newValue);

    // Debounce database save
    if (saveTimeout.current.persona) {
      clearTimeout(saveTimeout.current.persona);
    }
    saveTimeout.current.persona = setTimeout(() => {
      savePersonaToDb(newValue);
    }, 1000);
  }, [persona, savePersonaToDb]);

  // Save new story to database
  const addStory = useCallback(async (storyData) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const savedStory = await api.addStory(storyData);
      setPersonaState(prev => ({
        ...prev,
        lifeStories: [savedStory, ...(prev.lifeStories || [])],
      }));
      saveToLocal('echotrail_persona', {
        ...persona,
        lifeStories: [savedStory, ...(persona.lifeStories || [])],
      });
      return savedStory;
    } catch (error) {
      console.error('Failed to save story:', error);
      return null;
    }
  }, [user, persona]);

  // Delete story from database
  const deleteStory = useCallback(async (storyId) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return;

    try {
      await api.deleteStory(storyId);
      setPersonaState(prev => ({
        ...prev,
        lifeStories: prev.lifeStories.filter(s => s.id !== storyId),
      }));
      saveToLocal('echotrail_persona', {
        ...persona,
        lifeStories: persona.lifeStories.filter(s => s.id !== storyId),
      });
    } catch (error) {
      console.error('Failed to delete story:', error);
    }
  }, [user, persona]);

  // Update story in database
  const updateStory = useCallback(async (storyId, content) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const updatedStory = await api.updateStory(storyId, content);
      setPersonaState(prev => ({
        ...prev,
        lifeStories: prev.lifeStories.map(s => s.id === storyId ? { ...s, content } : s),
      }));
      saveToLocal('echotrail_persona', {
        ...persona,
        lifeStories: persona.lifeStories.map(s => s.id === storyId ? { ...s, content } : s),
      });
      return updatedStory;
    } catch (error) {
      console.error('Failed to update story:', error);
      return null;
    }
  }, [user, persona]);

  // Save memory to database
  const addMemory = useCallback(async (memoryData) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const savedMemory = await api.createMemory(memoryData);
      const newMemories = [savedMemory, ...memories];
      setMemoriesState(newMemories);
      saveToLocal('echotrail_memories', newMemories);
      return savedMemory;
    } catch (error) {
      console.error('Failed to save memory:', error);
      return null;
    }
  }, [user, memories]);

  // Update memory in database
  const updateMemory = useCallback(async (memoryId, memoryData) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const updatedMemory = await api.updateMemory(memoryId, memoryData);
      const newMemories = memories.map(m => m.id === memoryId ? updatedMemory : m);
      setMemoriesState(newMemories);
      saveToLocal('echotrail_memories', newMemories);
      return updatedMemory;
    } catch (error) {
      console.error('Failed to update memory:', error);
      return null;
    }
  }, [user, memories]);

  // Delete memory from database
  const deleteMemory = useCallback(async (memoryId) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return;

    try {
      await api.deleteMemory(memoryId);
      const newMemories = memories.filter(m => m.id !== memoryId);
      setMemoriesState(newMemories);
      saveToLocal('echotrail_memories', newMemories);
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  }, [user, memories]);

  // Set memories (for local updates without DB sync)
  const setMemories = useCallback((value) => {
    const newValue = value instanceof Function ? value(memories) : value;
    setMemoriesState(newValue);
    saveToLocal('echotrail_memories', newValue);
  }, [memories]);

  // Save time capsule to database
  const addTimeCapsule = useCallback(async (capsuleData) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const savedCapsule = await api.createTimeCapsule(capsuleData);
      const newCapsules = [savedCapsule, ...timeCapsules];
      setTimeCapsulesState(newCapsules);
      saveToLocal('echotrail_timecapsules', newCapsules);
      return savedCapsule;
    } catch (error) {
      console.error('Failed to save time capsule:', error);
      return null;
    }
  }, [user, timeCapsules]);

  // Delete time capsule from database
  const deleteTimeCapsule = useCallback(async (capsuleId) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return;

    try {
      await api.deleteTimeCapsule(capsuleId);
      const newCapsules = timeCapsules.filter(c => c.id !== capsuleId);
      setTimeCapsulesState(newCapsules);
      saveToLocal('echotrail_timecapsules', newCapsules);
    } catch (error) {
      console.error('Failed to delete time capsule:', error);
    }
  }, [user, timeCapsules]);

  // Set time capsules (for local updates)
  const setTimeCapsules = useCallback((value) => {
    const newValue = value instanceof Function ? value(timeCapsules) : value;
    setTimeCapsulesState(newValue);
    saveToLocal('echotrail_timecapsules', newValue);
  }, [timeCapsules]);

  // Set wisdom chats
  const setWisdomChats = useCallback((value) => {
    const newValue = value instanceof Function ? value(wisdomChats) : value;
    setWisdomChatsState(newValue);
    saveToLocal('echotrail_wisdom_chats', newValue);
  }, [wisdomChats]);

  // Set subscription
  const setSubscription = useCallback((value) => {
    const newValue = value instanceof Function ? value(subscription) : value;
    setSubscriptionState(newValue);
    saveToLocal('echotrail_subscription', newValue);
  }, [subscription]);

  // Upload avatar image
  const uploadAvatar = useCallback(async (imageData, label, setActive = false, echoVibe = 'compassionate') => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const savedAvatar = await api.uploadAvatar(imageData, label, setActive, echoVibe);

      setPersonaState(prev => {
        const updatedImages = setActive || prev.avatarImages.length === 0
          ? prev.avatarImages.map(img => ({ ...img, isActive: false }))
          : prev.avatarImages;

        return {
          ...prev,
          avatarImages: [...updatedImages, savedAvatar],
          avatarImage: setActive || prev.avatarImages.length === 0 ? imageData : prev.avatarImage,
          activeAvatarId: setActive || prev.avatarImages.length === 0 ? savedAvatar.id : prev.activeAvatarId,
        };
      });

      return savedAvatar;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      return null;
    }
  }, [user]);

  // Update avatar
  const updateAvatar = useCallback(async (avatarId, data) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const updatedAvatar = await api.updateAvatar(avatarId, data);

      setPersonaState(prev => {
        let updatedImages = prev.avatarImages;

        // If setting active, deactivate others
        if (data.isActive) {
          updatedImages = updatedImages.map(img => ({
            ...img,
            isActive: img.id === avatarId,
          }));
        } else {
          updatedImages = updatedImages.map(img =>
            img.id === avatarId ? { ...img, ...updatedAvatar } : img
          );
        }

        const activeImage = updatedImages.find(img => img.isActive);

        return {
          ...prev,
          avatarImages: updatedImages,
          avatarImage: activeImage?.imageData || prev.avatarImage,
          activeAvatarId: activeImage?.id || prev.activeAvatarId,
        };
      });

      return updatedAvatar;
    } catch (error) {
      console.error('Failed to update avatar:', error);
      return null;
    }
  }, [user]);

  // Delete avatar
  const deleteAvatar = useCallback(async (avatarId) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return;

    try {
      await api.deleteAvatar(avatarId);

      setPersonaState(prev => {
        const deletedImage = prev.avatarImages.find(img => img.id === avatarId);
        let updatedImages = prev.avatarImages.filter(img => img.id !== avatarId);

        // If deleted was active, make first remaining active
        if (deletedImage?.isActive && updatedImages.length > 0) {
          updatedImages = updatedImages.map((img, index) => ({
            ...img,
            isActive: index === 0,
          }));
        }

        const activeImage = updatedImages.find(img => img.isActive);

        return {
          ...prev,
          avatarImages: updatedImages,
          avatarImage: activeImage?.imageData || null,
          activeAvatarId: activeImage?.id || null,
        };
      });
    } catch (error) {
      console.error('Failed to delete avatar:', error);
    }
  }, [user]);

  // Upload voice sample
  const uploadVoiceSample = useCallback(async (audioData, label, duration, prompt) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const savedSample = await api.uploadVoiceSample(audioData, label, duration, prompt);

      setPersonaState(prev => ({
        ...prev,
        voiceSamples: [savedSample, ...(prev.voiceSamples || [])],
      }));

      return savedSample;
    } catch (error) {
      console.error('Failed to upload voice sample:', error);
      return null;
    }
  }, [user]);

  // Update voice sample
  const updateVoiceSample = useCallback(async (sampleId, data) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return null;

    try {
      const updated = await api.updateVoiceSample(sampleId, data);

      setPersonaState(prev => ({
        ...prev,
        voiceSamples: prev.voiceSamples.map(s =>
          s.id === sampleId ? { ...s, ...updated } : s
        ),
      }));

      return updated;
    } catch (error) {
      console.error('Failed to update voice sample:', error);
      return null;
    }
  }, [user]);

  // Delete voice sample
  const deleteVoiceSample = useCallback(async (sampleId) => {
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token) return;

    try {
      await api.deleteVoiceSample(sampleId);

      setPersonaState(prev => ({
        ...prev,
        voiceSamples: prev.voiceSamples.filter(s => s.id !== sampleId),
      }));
    } catch (error) {
      console.error('Failed to delete voice sample:', error);
    }
  }, [user]);

  // Calculate legacy score
  const calculateLegacyScore = useCallback(() => {
    let score = 0;

    if (user) score += 10;
    if (persona.lifeStories?.length > 0) score += Math.min(persona.lifeStories.length * 5, 30);
    if (persona.avatarImages?.length > 0) score += 10;
    const hasCustomValues = [persona.humor, persona.empathy, persona.tradition, persona.adventure,
      persona.wisdom, persona.creativity, persona.patience, persona.optimism].some(v => v !== 50);
    if (hasCustomValues) score += 15;
    if (persona.echoVibe !== 'compassionate') score += 5;
    if (memories.length > 0) score += Math.min(memories.length * 5, 15);
    if (timeCapsules.length > 0) score += Math.min(timeCapsules.length * 5, 10);
    if (wisdomChats.length > 0) score += 5;

    return Math.min(score, 100);
  }, [user, persona, memories, timeCapsules, wisdomChats]);

  // Load all data from database when user logs in
  const syncFromDatabase = useCallback(async () => {
    // Check for valid token before attempting sync
    const token = localStorage.getItem('echotrail_token');
    if (!user || !token || syncInProgress.current) return;

    syncInProgress.current = true;
    setIsLoading(true);

    try {
      // Fetch all data in parallel
      const [personaData, memoriesData, capsulesData, wisdomData] = await Promise.all([
        api.getPersona().catch(() => null),
        api.getMemories().catch(() => []),
        api.getTimeCapsules().catch(() => []),
        api.getWisdomChats().catch(() => []),
      ]);

      // Update persona
      if (personaData) {
        const activeImage = personaData.avatarImages?.find(img => img.isActive);
        const mergedPersona = {
          ...defaultPersona,
          ...personaData,
          avatarImage: activeImage?.imageData || null,
          activeAvatarId: activeImage?.id || null,
        };
        setPersonaState(mergedPersona);
        saveToLocal('echotrail_persona', mergedPersona);
      }

      // Update memories
      if (memoriesData) {
        setMemoriesState(memoriesData);
        saveToLocal('echotrail_memories', memoriesData);
      }

      // Update time capsules
      if (capsulesData) {
        setTimeCapsulesState(capsulesData);
        saveToLocal('echotrail_timecapsules', capsulesData);
      }

      // Update wisdom chats
      if (wisdomData) {
        setWisdomChatsState(wisdomData);
        saveToLocal('echotrail_wisdom_chats', wisdomData);
      }

      setIsSynced(true);
    } catch (error) {
      console.error('Failed to sync from database:', error);
    } finally {
      setIsLoading(false);
      syncInProgress.current = false;
    }
  }, [user]);

  // Sync when user changes
  useEffect(() => {
    if (user && !isSynced) {
      syncFromDatabase();
    }
    if (!user) {
      setIsSynced(false);
    }
  }, [user, isSynced, syncFromDatabase]);

  // Reset all data
  const resetAll = useCallback(() => {
    setUserState(null);
    setPersonaState(defaultPersona);
    setMemoriesState([]);
    setTimeCapsulesState([]);
    setWisdomChatsState([]);
    setSubscriptionState(null);
    setIsSynced(false);

    window.localStorage.removeItem('echotrail_user');
    window.localStorage.removeItem('echotrail_token');
    window.localStorage.removeItem('echotrail_persona');
    window.localStorage.removeItem('echotrail_memories');
    window.localStorage.removeItem('echotrail_timecapsules');
    window.localStorage.removeItem('echotrail_wisdom_chats');
    window.localStorage.removeItem('echotrail_subscription');
  }, []);

  return {
    // State
    user,
    persona,
    memories,
    timeCapsules,
    wisdomChats,
    subscription,
    isLoading,
    isSynced,
    legacyScore: calculateLegacyScore(),

    // Basic setters
    setUser,
    setPersona,
    setMemories,
    setTimeCapsules,
    setWisdomChats,
    setSubscription,

    // Database-synced operations
    addStory,
    updateStory,
    deleteStory,
    addMemory,
    updateMemory,
    deleteMemory,
    addTimeCapsule,
    deleteTimeCapsule,
    uploadAvatar,
    updateAvatar,
    deleteAvatar,
    uploadVoiceSample,
    updateVoiceSample,
    deleteVoiceSample,

    // Utilities
    syncFromDatabase,
    resetAll,
  };
}
