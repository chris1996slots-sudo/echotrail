import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  Heart,
  Briefcase,
  GraduationCap,
  Users,
  Star,
  Save,
  CheckCircle2,
  Camera,
  Upload,
  Image as ImageIcon,
  User as UserIcon,
  Home,
  Globe,
  Sparkles,
  Mountain,
  Music,
  Utensils,
  Award,
  Target,
  Lightbulb,
  Clock,
  X,
  Tag,
  Edit3,
  Palette,
  Eye,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Volume2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Video,
  RefreshCw,
  Info,
  Shield
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import { LegacyScoreCard } from '../components/LegacyScore';
import { ValueStore } from '../components/ValueStore';
import { ConfirmDialog } from '../components/ConfirmDialog';
import api from '../services/api';

const storyCategories = [
  { id: 'childhood', label: 'Childhood Memories', icon: Star, prompt: 'Share a defining moment from your childhood...' },
  { id: 'family', label: 'Family Stories', icon: Users, prompt: 'Tell us about a meaningful family tradition or moment...' },
  { id: 'career', label: 'Career Journey', icon: Briefcase, prompt: 'Describe a pivotal moment in your professional life...' },
  { id: 'education', label: 'Life Lessons', icon: GraduationCap, prompt: 'What is the most important lesson life has taught you?' },
  { id: 'love', label: 'Love & Relationships', icon: Heart, prompt: 'Share a story about love or a meaningful relationship...' },
  { id: 'wisdom', label: 'Wisdom to Share', icon: BookOpen, prompt: 'What advice would you give to your descendants?' },
  { id: 'home', label: 'Home & Places', icon: Home, prompt: 'Describe a place that holds special meaning to you...' },
  { id: 'travel', label: 'Travel Adventures', icon: Globe, prompt: 'Share a memorable travel experience or adventure...' },
  { id: 'challenges', label: 'Overcoming Challenges', icon: Mountain, prompt: 'Tell us about a difficult time and how you overcame it...' },
  { id: 'hobbies', label: 'Passions & Hobbies', icon: Music, prompt: 'What activities bring you joy and fulfillment?' },
  { id: 'food', label: 'Food & Traditions', icon: Utensils, prompt: 'Share a recipe or food memory that means something to you...' },
  { id: 'achievements', label: 'Proud Moments', icon: Award, prompt: 'What accomplishment are you most proud of?' },
  { id: 'dreams', label: 'Dreams & Goals', icon: Target, prompt: 'What dreams have you pursued or wish you had pursued?' },
  { id: 'beliefs', label: 'Faith & Beliefs', icon: Sparkles, prompt: 'What spiritual or philosophical beliefs guide your life?' },
  { id: 'ideas', label: 'Big Ideas', icon: Lightbulb, prompt: 'Share an idea or insight that changed how you see the world...' },
  { id: 'era', label: 'Historical Moments', icon: Clock, prompt: 'What historical events have you witnessed or been part of?' },
];

const interviewChapters = [
  {
    id: 'childhood',
    title: 'Childhood & Early Years',
    icon: '💒',
    description: 'Your formative years and earliest memories',
    questions: [
      { id: 'childhood_memory', question: 'What is your earliest childhood memory?', placeholder: 'Describe the first memory you can recall...' },
      { id: 'childhood_home', question: 'What was your childhood home like?', placeholder: 'Describe the place where you grew up...' },
      { id: 'childhood_friend', question: 'Who was your best friend as a child?', placeholder: 'Tell us about your closest childhood companion...' },
      { id: 'childhood_dream', question: 'What did you dream of becoming when you grew up?', placeholder: 'Share your childhood aspirations...' },
      { id: 'childhood_lesson', question: 'What important lesson did you learn as a child?', placeholder: 'Describe a formative lesson from your early years...' },
    ],
  },
  {
    id: 'family',
    title: 'Family & Heritage',
    icon: '👨‍👩‍👧‍👦',
    description: 'Your roots and family connections',
    questions: [
      { id: 'family_tradition', question: 'What family tradition means the most to you?', placeholder: 'Describe a cherished family custom...' },
      { id: 'family_parent', question: 'What did you learn from your parents?', placeholder: 'Share wisdom passed down from your parents...' },
      { id: 'family_heritage', question: 'What aspects of your heritage are you most proud of?', placeholder: 'Tell us about your cultural background...' },
      { id: 'family_reunion', question: 'Describe a memorable family gathering.', placeholder: 'Share a special moment with your extended family...' },
      { id: 'family_recipe', question: 'Is there a family recipe or dish that holds special meaning?', placeholder: 'Tell us about food traditions in your family...' },
    ],
  },
  {
    id: 'love',
    title: 'Love & Relationships',
    icon: '💕',
    description: 'Matters of the heart',
    questions: [
      { id: 'love_first', question: 'Tell us about your first love.', placeholder: 'Share memories of young love...' },
      { id: 'love_partner', question: 'How did you meet your life partner?', placeholder: 'Describe how you found your significant other...' },
      { id: 'love_lesson', question: 'What has love taught you?', placeholder: 'Share wisdom gained from relationships...' },
      { id: 'love_advice', question: 'What advice would you give about finding lasting love?', placeholder: 'Share your insights on relationships...' },
      { id: 'love_moment', question: 'What is the most romantic moment of your life?', placeholder: 'Describe a moment that made your heart soar...' },
    ],
  },
  {
    id: 'career',
    title: 'Career & Achievements',
    icon: '💼',
    description: 'Your professional journey',
    questions: [
      { id: 'career_choice', question: 'Why did you choose your career path?', placeholder: 'Explain what drew you to your profession...' },
      { id: 'career_proud', question: 'What professional achievement are you most proud of?', placeholder: 'Share your greatest career accomplishment...' },
      { id: 'career_mentor', question: 'Who was your most influential mentor?', placeholder: 'Describe someone who guided your career...' },
      { id: 'career_challenge', question: 'What was your biggest professional challenge?', placeholder: 'Tell us about a difficult work situation you overcame...' },
      { id: 'career_advice', question: 'What career advice would you give to young people?', placeholder: 'Share wisdom for those starting their journey...' },
    ],
  },
  {
    id: 'challenges',
    title: 'Challenges & Growth',
    icon: '🏔️',
    description: 'Overcoming adversity',
    questions: [
      { id: 'challenges_hardest', question: 'What was the hardest thing you ever had to do?', placeholder: 'Share a moment that tested your limits...' },
      { id: 'challenges_failure', question: 'Tell us about a failure that taught you something.', placeholder: 'Describe how setback became growth...' },
      { id: 'challenges_fear', question: 'What fear have you had to overcome?', placeholder: 'Share how you faced something you were afraid of...' },
      { id: 'challenges_strength', question: 'Where do you find strength in difficult times?', placeholder: 'Tell us what keeps you going when things are hard...' },
      { id: 'challenges_regret', question: 'What is one thing you wish you had done differently?', placeholder: 'Reflect on a decision or path not taken...' },
    ],
  },
  {
    id: 'wisdom',
    title: 'Wisdom & Beliefs',
    icon: '🦉',
    description: 'Your philosophy of life',
    questions: [
      { id: 'wisdom_belief', question: 'What do you believe in most strongly?', placeholder: 'Describe a core belief that guides your life...' },
      { id: 'wisdom_meaning', question: 'What gives your life meaning?', placeholder: 'Share what makes your life feel purposeful...' },
      { id: 'wisdom_learned', question: 'What is the most important lesson life has taught you?', placeholder: 'Share the wisdom years have brought you...' },
      { id: 'wisdom_truth', question: 'What truth do you wish you had known earlier?', placeholder: 'Share insight you wish you had sooner...' },
      { id: 'wisdom_advice', question: 'What advice would you give to your younger self?', placeholder: 'If you could speak to young you, what would you say...' },
    ],
  },
  {
    id: 'joy',
    title: 'Joy & Passions',
    icon: '✨',
    description: 'What makes your heart sing',
    questions: [
      { id: 'joy_happiest', question: 'What is the happiest moment of your life?', placeholder: 'Describe pure joy you have experienced...' },
      { id: 'joy_hobby', question: 'What hobby or activity brings you the most joy?', placeholder: 'Tell us what you love to do...' },
      { id: 'joy_laugh', question: 'What never fails to make you laugh?', placeholder: 'Share what brings humor to your life...' },
      { id: 'joy_grateful', question: 'What are you most grateful for?', placeholder: 'Express what you appreciate most in life...' },
      { id: 'joy_simple', question: 'What simple pleasure do you cherish?', placeholder: 'Share a small thing that brings big happiness...' },
    ],
  },
  {
    id: 'adventures',
    title: 'Adventures & Experiences',
    icon: '🌍',
    description: 'Your journey through the world',
    questions: [
      { id: 'adventures_travel', question: 'What is your most memorable travel experience?', placeholder: 'Share an adventure that changed you...' },
      { id: 'adventures_risk', question: 'What is the biggest risk you ever took?', placeholder: 'Tell us about a leap of faith...' },
      { id: 'adventures_unexpected', question: 'What unexpected experience changed your perspective?', placeholder: 'Share a surprise that opened your eyes...' },
      { id: 'adventures_bucket', question: 'What is still on your bucket list?', placeholder: 'Tell us what you still dream of doing...' },
      { id: 'adventures_story', question: 'What adventure story do you love to tell?', placeholder: 'Share your favorite tale from your journeys...' },
    ],
  },
  {
    id: 'legacy',
    title: 'Legacy & Future',
    icon: '🌟',
    description: 'What you leave behind',
    questions: [
      { id: 'legacy_remembered', question: 'How do you want to be remembered?', placeholder: 'Imagine the words spoken about you by those who love you...' },
      { id: 'legacy_gift', question: 'What gift do you want to leave for future generations?', placeholder: 'Share what you hope to pass down...' },
      { id: 'legacy_impact', question: 'How have you tried to make the world better?', placeholder: 'Tell us about your contribution to the world...' },
      { id: 'legacy_message', question: 'What message do you want your great-grandchildren to know?', placeholder: 'Speak directly to future generations...' },
      { id: 'legacy_proud', question: 'What about your life are you most proud of?', placeholder: 'Share what fills you with pride...' },
    ],
  },
  {
    id: 'essence',
    title: 'Your Essence',
    icon: '💫',
    description: 'The core of who you are',
    questions: [
      { id: 'essence_describe', question: 'In three words, how would you describe yourself?', placeholder: 'Capture your essence in just three words...' },
      { id: 'essence_unique', question: 'What makes you uniquely you?', placeholder: 'Share what sets you apart from everyone else...' },
      { id: 'essence_superpower', question: 'What do you consider your superpower?', placeholder: 'Tell us about your greatest strength...' },
      { id: 'essence_weakness', question: 'What is your greatest weakness, and how have you dealt with it?', placeholder: 'Share honestly about your struggles...' },
      { id: 'essence_final', question: 'If this was your last chance to speak, what would you say?', placeholder: 'Leave your final words of wisdom...' },
    ],
  },
];

// Age categories for avatar photos
const ageCategories = [
  { id: 'child', label: 'Child (0-12)' },
  { id: 'teen', label: 'Teenager (13-19)' },
  { id: 'young', label: 'Young Adult (20-35)' },
  { id: 'middle', label: 'Middle Age (36-55)' },
  { id: 'mature', label: 'Mature (56-70)' },
  { id: 'senior', label: 'Senior (70+)' },
];

// Occasion categories for avatar photos
const occasionCategories = [
  { id: 'casual', label: 'Casual' },
  { id: 'professional', label: 'Professional' },
  { id: 'formal', label: 'Formal/Celebration' },
  { id: 'vacation', label: 'Vacation' },
  { id: 'celebration', label: 'Party/Event' },
  { id: 'sports', label: 'Sports/Hobby' },
  { id: 'family', label: 'Family' },
  { id: 'special', label: 'Special Occasion' },
];

// Voice recording prompts - Each should take about 30 seconds to read naturally
const voicePrompts = [
  "Hello, my name is [your name]. I'm creating this voice recording for my digital legacy. I want future generations to hear my real voice and feel connected to me. This is my way of staying present in the lives of those I love, even when I can't be there in person. Thank you for listening to my story.",
  "Let me tell you about a valuable lesson I've learned. Throughout my life, I've discovered that kindness is the most powerful force we have. Small acts of compassion create ripples that touch countless lives. When you treat others with respect and empathy, you not only brighten their day but also enrich your own soul. Always choose kindness, even when it's difficult.",
  "Family is the foundation of everything meaningful in my life. The bonds we share, the memories we create together, and the unconditional love we give each other are treasures beyond measure. Through good times and challenges, family has been my anchor. I hope you always cherish these connections and nurture the relationships that matter most.",
  "To my grandchildren and future generations, I want you to know how deeply I love you. Even if we've never met, you carry a piece of me within you. I've lived, learned, laughed, and loved so that your path might be a little brighter. Dream big, stay curious, and never forget that you come from a family that believes in you with all their hearts.",
  "Here's some wisdom I want to share with you. Life moves quickly, so treasure every moment. Don't hold onto grudges because they only weigh you down. Forgive freely, love generously, and always make time for the people who matter. Remember that success isn't measured by wealth or status, but by the positive impact you have on others.",
];

export function PersonaPage({ onNavigate }) {
  const location = useLocation();
  const { persona, setPersona, user, addStory, updateStory, deleteStory, uploadAvatar, updateAvatar, deleteAvatar, uploadVoiceSample, deleteVoiceSample, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'avatar');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentStory, setCurrentStory] = useState('');
  const [customStoryTitle, setCustomStoryTitle] = useState('');
  const [showCustomStory, setShowCustomStory] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [interviewAnswers, setInterviewAnswers] = useState({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Avatar upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    age: '',
    occasion: '',
  });
  const [uploadErrors, setUploadErrors] = useState({});
  const fileInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const canvasRef = useRef(null);

  // Voice recording state
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [recordedPrompts, setRecordedPrompts] = useState([]); // Track which prompts have been recorded in this session
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Voice memo upload state
  const [showVoiceMemoModal, setShowVoiceMemoModal] = useState(false);
  const [voiceMemoFile, setVoiceMemoFile] = useState(null);
  const [voiceMemoDuration, setVoiceMemoDuration] = useState(0);
  const [voiceMemoUploading, setVoiceMemoUploading] = useState(false);
  const [voiceMemoError, setVoiceMemoError] = useState('');
  const voiceMemoInputRef = useRef(null);

  // Avatar processing state (Step 5 completion)
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingError, setProcessingError] = useState(null);

  // Camera states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCreatingVoiceClone, setIsCreatingVoiceClone] = useState(false);
  const [voiceCloneError, setVoiceCloneError] = useState(null);
  const [voiceCloneSuccess, setVoiceCloneSuccess] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Avatar edit/delete state
  const [editingAvatar, setEditingAvatar] = useState(null);
  const [deletingAvatar, setDeletingAvatar] = useState(null);
  const [editAvatarForm, setEditAvatarForm] = useState({ label: '' });
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // LiveAvatar video upload state
  // Training video (2 minutes)
  const [trainingVideo, setTrainingVideo] = useState(null);
  const [trainingVideoUrl, setTrainingVideoUrl] = useState(null);
  const [trainingVideoPreview, setTrainingVideoPreview] = useState(null);
  const [isUploadingTraining, setIsUploadingTraining] = useState(false);
  // Consent video (short statement)
  const [consentVideo, setConsentVideo] = useState(null);
  const [consentVideoUrl, setConsentVideoUrl] = useState(null);
  const [consentVideoPreview, setConsentVideoPreview] = useState(null);
  const [isUploadingConsent, setIsUploadingConsent] = useState(false);
  // General state
  const [isCreatingLiveAvatar, setIsCreatingLiveAvatar] = useState(false);
  const [liveAvatarError, setLiveAvatarError] = useState(null);
  const [liveAvatarStatus, setLiveAvatarStatus] = useState(null);
  const [activeVideoType, setActiveVideoType] = useState('training'); // 'training' or 'consent'
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecordingTime, setVideoRecordingTime] = useState(0);
  const videoInputRef = useRef(null);
  const videoRecorderRef = useRef(null);
  const videoStreamRef = useRef(null);
  const videoTimerRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const recordedVideoRef = useRef(null);

  // Simli Face Upload state
  const [simliFaceImage, setSimliFaceImage] = useState(null);
  const [simliFacePreview, setSimliFacePreview] = useState(null);
  const [isUploadingSimliFace, setIsUploadingSimliFace] = useState(false);
  const [simliFaceStatus, setSimliFaceStatus] = useState(null);
  const [simliFaceError, setSimliFaceError] = useState(null);
  const simliFaceInputRef = useRef(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast state
  const [toast, setToast] = useState(null);

  // Story editing state
  const [editingStory, setEditingStory] = useState(null);
  const [editingStoryContent, setEditingStoryContent] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const tabs = [
    { id: 'avatar', label: 'My Avatar' },
    { id: 'stories', label: 'Life Stories' },
    { id: 'interview', label: 'Deep Interview' },
    { id: 'values', label: 'Value Store' },
  ];

  // Real background images
  const backgrounds = [
    {
      id: 'beach',
      label: 'Beach',
      preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop'
    },
    {
      id: 'library',
      label: 'Library',
      preview: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1920&h=1080&fit=crop'
    },
    {
      id: 'nature',
      label: 'Nature',
      preview: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop'
    },
    {
      id: 'home',
      label: 'Cozy Home',
      preview: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&h=300&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1920&h=1080&fit=crop'
    },
    {
      id: 'custom',
      label: 'Custom Image',
      preview: null,
      fullUrl: null
    },
  ];

  // Avatar creation step flow (3 steps - Create Avatar on last step sends to ElevenLabs + HeyGen)
  const avatarSteps = [
    { id: 'photos', label: 'Photos', icon: Camera, description: 'Upload your photos' },
    { id: 'voice', label: 'Voice', icon: Mic, description: 'Record your voice' },
    { id: 'vibe', label: 'Vibe', icon: Heart, description: 'Choose your echo vibe' },
  ];

  // Echo Vibe options
  const vibeOptions = [
    { id: 'compassionate', label: 'Compassionate', icon: '💕', description: 'Warm, nurturing, and deeply caring', color: 'from-pink-500 to-rose-500' },
    { id: 'strict', label: 'Strict', icon: '🛡️', description: 'Firm, principled, and focused on growth', color: 'from-blue-500 to-indigo-500' },
    { id: 'storyteller', label: 'Storyteller', icon: '📖', description: 'Narrative-driven and wise', color: 'from-amber-500 to-orange-500' },
    { id: 'wise', label: 'Wise Mentor', icon: '✨', description: 'Thoughtful and philosophical', color: 'from-purple-500 to-violet-500' },
    { id: 'playful', label: 'Playful', icon: '😊', description: 'Light-hearted and fun', color: 'from-green-500 to-emerald-500' },
    { id: 'adventurous', label: 'Adventurous', icon: '🧭', description: 'Bold and encouraging', color: 'from-cyan-500 to-teal-500' },
  ];

  const [selectedVibe, setSelectedVibe] = useState('compassionate');

  const [avatarStep, setAvatarStep] = useState(0);

  // Handle step navigation with automatic processing
  const handleNextStep = async () => {
    const currentStepId = avatarSteps[avatarStep].id;

    // Step 0 (Photos): Check if we should create HeyGen Photo Avatar
    if (currentStepId === 'photos') {
      const avatarImages = persona.avatarImages || [];
      const activeImage = avatarImages.find(img => img.isActive || img.id === persona.activeAvatarId);
      const hasHeyGenAvatar = persona.heygenAvatarId;

      // If user has an active image but no HeyGen avatar yet, create it
      if (activeImage && !hasHeyGenAvatar) {
        try {
          setIsProcessingAvatar(true);
          setProcessingStep('Creating talking avatar with lip sync...');

          const avatarResult = await api.createPhotoAvatar(
            activeImage.imageData,
            `${user.firstName}'s Avatar`
          );

          if (avatarResult.success) {
            setPersona(prev => ({
              ...prev,
              heygenAvatarId: avatarResult.avatarId,
              heygenAvatarName: avatarResult.avatarName,
            }));
            setProcessingComplete(true);
            setTimeout(() => {
              setProcessingComplete(false);
              setIsProcessingAvatar(false);
              setProcessingStep('');
            }, 2000);
          } else {
            setIsProcessingAvatar(false);
            setProcessingStep('');
            showToast('Avatar creation failed. You can continue anyway.');
          }
        } catch (err) {
          console.error('HeyGen avatar creation failed:', err);
          setIsProcessingAvatar(false);
          setProcessingStep('');
          showToast('Avatar creation failed. You can continue anyway.');
        }
        return; // Wait for processing to complete before moving to next step
      }
    }

    // Step 1 (Voice): Check if we should create voice clone
    if (currentStepId === 'voice') {
      const hasVoiceSamples = persona.voiceSamples && persona.voiceSamples.length >= 3;
      const hasVoiceClone = persona.elevenlabsVoiceId;

      // If user has voice samples but no voice clone yet, create it
      if (hasVoiceSamples && !hasVoiceClone) {
        try {
          setIsProcessingAvatar(true);
          setProcessingStep('Creating voice clone...');

          const voiceResult = await api.createVoiceClone(
            `${user.firstName}'s Voice`,
            `Voice clone for ${user.firstName} ${user.lastName}`
          );

          if (voiceResult.success) {
            setPersona(prev => ({
              ...prev,
              elevenlabsVoiceId: voiceResult.voiceId,
              elevenlabsVoiceName: voiceResult.voiceName,
            }));
            setProcessingComplete(true);
            setTimeout(() => {
              setProcessingComplete(false);
              setIsProcessingAvatar(false);
              setProcessingStep('');
            }, 2000);
          } else {
            setIsProcessingAvatar(false);
            setProcessingStep('');
            showToast('Voice clone creation failed. You can continue anyway.');
          }
        } catch (err) {
          console.error('Voice clone creation failed:', err);
          setIsProcessingAvatar(false);
          setProcessingStep('');
          showToast('Voice clone creation failed. You can continue anyway.');
        }
        return; // Wait for processing to complete before moving to next step
      }
    }

    // Move to next step
    setAvatarStep(prev => prev + 1);
  };

  const avatarStyles = [
    { id: 'realistic', label: 'Realistic', description: 'Lifelike digital twin', icon: '🎭' },
    { id: 'enhanced', label: 'Enhanced', description: 'Polished & refined look', icon: '✨' },
    { id: 'cartoon', label: 'Cartoon', description: 'Animated style avatar', icon: '🎨' },
    { id: 'artistic', label: 'Artistic', description: 'Painterly illustration', icon: '🖼️' },
    { id: 'anime', label: 'Anime', description: 'Japanese animation style', icon: '🌸' },
    { id: 'pixar', label: '3D Pixar', description: 'Pixar-like 3D render', icon: '🎬' },
  ];

  const selectAvatarStyle = (styleId) => {
    setPersona(prev => ({
      ...prev,
      avatarStyle: styleId,
    }));
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      showToast('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const saveVoiceSample = async () => {
    if (!audioBlob) return;

    setSaving(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        const prompt = voicePrompts[selectedPrompt];
        const label = `Recording ${(persona.voiceSamples?.length || 0) + 1}`;

        await uploadVoiceSample(base64Audio, label, recordingTime, prompt);

        // Mark this prompt as recorded
        const newRecordedPrompts = [...recordedPrompts, selectedPrompt];
        setRecordedPrompts(newRecordedPrompts);

        // Find next unrecorded prompt
        const nextUnrecordedPrompt = voicePrompts.findIndex((_, index) => !newRecordedPrompts.includes(index));

        if (nextUnrecordedPrompt !== -1) {
          // Move to next unrecorded prompt
          setSelectedPrompt(nextUnrecordedPrompt);
          resetRecording();
          setShowSaveConfirm(true);
          setTimeout(() => setShowSaveConfirm(false), 2000);
        } else {
          // All prompts recorded, close modal
          setShowVoiceModal(false);
          resetRecording();
          setRecordedPrompts([]);
          setSelectedPrompt(0);
          setShowSaveConfirm(true);
          setTimeout(() => setShowSaveConfirm(false), 2000);
        }
        setSaving(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Failed to save voice sample:', error);
      setSaving(false);
    }
  };

  const handleDeleteVoiceSample = (sampleId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Voice Recording',
      message: 'Are you sure you want to delete this voice recording? This action cannot be undone.',
      onConfirm: async () => {
        setSaving(true);
        await deleteVoiceSample(sampleId);
        setSaving(false);
      },
    });
  };

  // Handle voice memo file selection
  const handleVoiceMemoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('audio/')) {
      setVoiceMemoError('Please select an audio file (MP3, WAV, etc.)');
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setVoiceMemoError('File size must be less than 100MB');
      return;
    }

    // Get duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      const duration = Math.floor(audio.duration);
      if (duration < 300) { // 5 minutes = 300 seconds
        setVoiceMemoError(`Recording must be at least 5 minutes. Current: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
        URL.revokeObjectURL(audio.src);
        return;
      }
      setVoiceMemoDuration(duration);
      setVoiceMemoFile(file);
      setVoiceMemoError('');
      URL.revokeObjectURL(audio.src);
    };
    audio.onerror = () => {
      setVoiceMemoError('Could not read audio file');
      URL.revokeObjectURL(audio.src);
    };

    // Reset input
    if (e.target) e.target.value = '';
  };

  // Upload voice memo
  const handleVoiceMemoUpload = async () => {
    if (!voiceMemoFile) return;

    setVoiceMemoUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await saveVoiceSample(
          reader.result,
          `Book Reading (${Math.floor(voiceMemoDuration / 60)} min)`,
          'Reading from a book for voice cloning',
          voiceMemoDuration
        );
        setVoiceMemoFile(null);
        setVoiceMemoDuration(0);
        setShowVoiceMemoModal(false);
        setVoiceMemoUploading(false);
      };
      reader.readAsDataURL(voiceMemoFile);
    } catch (error) {
      console.error('Failed to upload voice memo:', error);
      setVoiceMemoError('Failed to upload. Please try again.');
      setVoiceMemoUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      if (trainingVideoPreview) URL.revokeObjectURL(trainingVideoPreview);
      if (consentVideoPreview) URL.revokeObjectURL(consentVideoPreview);
    };
  }, [audioUrl, trainingVideoPreview, consentVideoPreview]);

  // Fetch LiveAvatar status on mount
  useEffect(() => {
    const fetchLiveAvatarStatus = async () => {
      try {
        const status = await api.getLiveAvatarStatus();
        setLiveAvatarStatus(status);
      } catch (error) {
        console.error('Failed to fetch LiveAvatar status:', error);
      }
    };
    fetchLiveAvatarStatus();
  }, []);

  // Fetch Simli Face status on mount
  useEffect(() => {
    if (activeTab === 'simliface') {
      fetchSimliFaceStatus();
    }
  }, [activeTab]);

  // Handle tab navigation from location state
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Cleanup camera stream when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // LiveAvatar video functions
  const handleVideoFileSelect = (e, videoType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('video/')) {
      setLiveAvatarError('Please select a video file (MP4, WebM, etc.)');
      return;
    }

    // Check file size (max 200MB)
    if (file.size > 200 * 1024 * 1024) {
      setLiveAvatarError('Video file too large. Maximum size is 200MB.');
      return;
    }

    setLiveAvatarError(null);
    const previewUrl = URL.createObjectURL(file);

    if (videoType === 'consent') {
      if (consentVideoPreview) URL.revokeObjectURL(consentVideoPreview);
      setConsentVideo(file);
      setConsentVideoPreview(previewUrl);
    } else {
      if (trainingVideoPreview) URL.revokeObjectURL(trainingVideoPreview);
      setTrainingVideo(file);
      setTrainingVideoPreview(previewUrl);
    }

    // Reset file input
    if (e.target) e.target.value = '';
  };

  const startVideoRecording = async (videoType) => {
    try {
      setActiveVideoType(videoType);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      videoStreamRef.current = stream;

      // Show preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      videoRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const previewUrl = URL.createObjectURL(blob);

        if (videoType === 'consent') {
          if (consentVideoPreview) URL.revokeObjectURL(consentVideoPreview);
          setConsentVideo(blob);
          setConsentVideoPreview(previewUrl);
        } else {
          if (trainingVideoPreview) URL.revokeObjectURL(trainingVideoPreview);
          setTrainingVideo(blob);
          setTrainingVideoPreview(previewUrl);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVideo(true);
      setVideoRecordingTime(0);

      videoTimerRef.current = setInterval(() => {
        setVideoRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start video recording:', error);
      setLiveAvatarError('Could not access camera/microphone. Please check your permissions.');
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && isRecordingVideo) {
      videoRecorderRef.current.stop();
      setIsRecordingVideo(false);
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
      }
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    }
  };

  const resetVideo = (videoType) => {
    if (videoType === 'consent') {
      if (consentVideoPreview) URL.revokeObjectURL(consentVideoPreview);
      setConsentVideo(null);
      setConsentVideoPreview(null);
      setConsentVideoUrl(null);
    } else {
      if (trainingVideoPreview) URL.revokeObjectURL(trainingVideoPreview);
      setTrainingVideo(null);
      setTrainingVideoPreview(null);
      setTrainingVideoUrl(null);
    }
    setVideoRecordingTime(0);
    setLiveAvatarError(null);
  };

  const resetAllVideos = () => {
    resetVideo('training');
    resetVideo('consent');
  };

  const uploadAndCreateLiveAvatar = async () => {
    if (!trainingVideo) {
      setLiveAvatarError('Please select or record a training video first.');
      return;
    }
    if (!consentVideo) {
      setLiveAvatarError('Please select or record a consent video first.');
      return;
    }

    setLiveAvatarError(null);

    try {
      // Upload training video
      setIsUploadingTraining(true);
      const trainingReader = new FileReader();
      const trainingData = await new Promise((resolve, reject) => {
        trainingReader.onloadend = () => resolve(trainingReader.result);
        trainingReader.onerror = reject;
        trainingReader.readAsDataURL(trainingVideo);
      });

      const trainingResult = await api.uploadLiveAvatarVideo(trainingData, 'training');
      setTrainingVideoUrl(trainingResult.videoUrl);
      setIsUploadingTraining(false);

      // Upload consent video
      setIsUploadingConsent(true);
      const consentReader = new FileReader();
      const consentData = await new Promise((resolve, reject) => {
        consentReader.onloadend = () => resolve(consentReader.result);
        consentReader.onerror = reject;
        consentReader.readAsDataURL(consentVideo);
      });

      const consentResult = await api.uploadLiveAvatarVideo(consentData, 'consent');
      setConsentVideoUrl(consentResult.videoUrl);
      setIsUploadingConsent(false);

      // Create LiveAvatar with both videos
      setIsCreatingLiveAvatar(true);
      const avatarResult = await api.createLiveAvatar(
        trainingResult.videoUrl,
        consentResult.videoUrl,
        `${user.firstName}'s Avatar`
      );

      // Update status
      setLiveAvatarStatus({
        ...liveAvatarStatus,
        hasCustomAvatar: true,
        customAvatarStatus: 'in_progress',
        customAvatarName: avatarResult.avatarName
      });

      showToast('Video Avatar training started! This may take a few hours.', 'success');
      resetAllVideos();
    } catch (error) {
      console.error('Failed to create LiveAvatar:', error);
      setLiveAvatarError(error.message || 'Failed to create Video Avatar. Please try again.');
    } finally {
      setIsUploadingTraining(false);
      setIsUploadingConsent(false);
      setIsCreatingLiveAvatar(false);
    }
  };

  const refreshLiveAvatarStatus = async () => {
    try {
      const status = await api.getLiveAvatarStatus();
      setLiveAvatarStatus(status);

      // If we have an avatar in progress, check its detailed status
      if (status.hasCustomAvatar && status.customAvatarStatus === 'in_progress') {
        const persona = await api.getPersona();
        if (persona.liveavatarId) {
          const avatarStatus = await api.checkLiveAvatarStatus(persona.liveavatarId);
          if (avatarStatus.status === 'ready') {
            setLiveAvatarStatus(prev => ({ ...prev, customAvatarStatus: 'ready' }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh LiveAvatar status:', error);
    }
  };

  // Handle file selection - show modal for metadata
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result);
        setUploadForm({ name: '', age: '', occasion: '' });
        setUploadErrors({});
        setShowUploadModal(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (e.target) e.target.value = '';
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      setShowCameraModal(true);

      // Set video source after modal opens
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Failed to access camera:', err);
      alert('Failed to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCapturedPhoto(null);
  };

  const capturePhoto = () => {
    if (cameraVideoRef.current && canvasRef.current) {
      const video = cameraVideoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');

      // Flip the image horizontally to un-mirror it
      // (video preview is mirrored for selfie mode, but capture should be normal)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoData);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const usePhoto = () => {
    setPendingImage(capturedPhoto);
    setUploadForm({ name: '', age: '', occasion: '' });
    setUploadErrors({});
    stopCamera();
    setShowUploadModal(true);
  };

  // Validate and submit the avatar upload
  const handleAvatarSubmit = async () => {
    const errors = {};
    if (!uploadForm.age) errors.age = 'Please select an age group';
    if (!uploadForm.occasion) errors.occasion = 'Please select an occasion';

    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors);
      return;
    }

    setSaving(true);
    const isFirst = (persona.avatarImages?.length || 0) === 0;

    // Build label from metadata
    const ageCat = ageCategories.find(a => a.id === uploadForm.age);
    const occasionCat = occasionCategories.find(o => o.id === uploadForm.occasion);
    const labelParts = [];
    if (uploadForm.name) labelParts.push(uploadForm.name);
    labelParts.push(ageCat?.label || uploadForm.age);
    labelParts.push(occasionCat?.label || uploadForm.occasion);
    const imageLabel = labelParts.join(' • ');

    // Save to database with metadata including echo vibe
    const saved = await uploadAvatar(pendingImage, imageLabel, isFirst, selectedVibe);

    if (saved) {
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 2000);
    }

    // Close modal and reset
    setShowUploadModal(false);
    setPendingImage(null);
    setUploadForm({ name: '', age: '', occasion: '' });
    setSaving(false);
  };

  // Cancel upload
  const handleUploadCancel = () => {
    setShowUploadModal(false);
    setPendingImage(null);
    setUploadForm({ name: '', age: '', occasion: '' });
    setUploadErrors({});
  };

  const selectActiveAvatar = async (imageId) => {
    setSaving(true);
    const result = await updateAvatar(imageId, { isActive: true });
    if (result) {
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 2000);
    }
    setSaving(false);
  };

  const deleteAvatarImage = async (imageId) => {
    setSaving(true);
    await deleteAvatar(imageId);
    setDeletingAvatar(null);
    setSaving(false);
  };

  // Simli Face Upload Handlers
  const fetchSimliFaceStatus = async () => {
    try {
      const status = await api.getSimliFaceStatus();
      setSimliFaceStatus(status);
    } catch (error) {
      console.error('Failed to fetch Simli face status:', error);
    }
  };

  const handleSimliFaceSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSimliFaceError('Please select an image file (JPG, PNG, etc.)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSimliFaceError('Image file is too large. Maximum size is 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSimliFaceImage(reader.result);
        setSimliFacePreview(reader.result);
        setSimliFaceError(null);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (e.target) e.target.value = '';
  };

  const handleSimliFaceUpload = async () => {
    if (!simliFaceImage) {
      setSimliFaceError('Please select an image first');
      return;
    }

    setIsUploadingSimliFace(true);
    setSimliFaceError(null);

    try {
      const faceName = `${user.firstName}_face`;
      const result = await api.createSimliFace(simliFaceImage, faceName);

      if (result.success) {
        showToast('Custom face created successfully! It will be used in your next live chat.', 'success');
        await fetchSimliFaceStatus();
        setSimliFaceImage(null);
        setSimliFacePreview(null);
      } else {
        throw new Error(result.error || 'Failed to create custom face');
      }
    } catch (error) {
      console.error('Simli face upload error:', error);
      setSimliFaceError(error.message || 'Failed to upload face. Please try again.');
    } finally {
      setIsUploadingSimliFace(false);
    }
  };

  const resetSimliFace = () => {
    setSimliFaceImage(null);
    setSimliFacePreview(null);
    setSimliFaceError(null);
  };

  const updateAvatarLabel = async (imageId, newLabel) => {
    // Debounce label updates
    await updateAvatar(imageId, { label: newLabel });
  };

  // Open edit modal for an avatar
  const openEditAvatarModal = (avatar) => {
    setEditingAvatar(avatar);
    setEditAvatarForm({ label: avatar.label || '' });
  };

  // Save avatar edits
  const handleSaveAvatarEdit = async () => {
    if (!editingAvatar) return;
    setIsUpdatingAvatar(true);
    await updateAvatar(editingAvatar.id, { label: editAvatarForm.label });
    setIsUpdatingAvatar(false);
    setEditingAvatar(null);
  };

  // Confirm delete avatar
  const handleConfirmDeleteAvatar = async () => {
    if (!deletingAvatar) return;
    await deleteAvatarImage(deletingAvatar.id);
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersona(prev => ({
          ...prev,
          backgroundImage: reader.result,
          backgroundType: 'custom',
        }));
        setShowSaveConfirm(true);
        setTimeout(() => setShowSaveConfirm(false), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectBackground = (bgId) => {
    if (bgId === 'custom') return;
    setPersona(prev => ({
      ...prev,
      backgroundType: bgId,
      backgroundImage: null,
    }));
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  // Create voice clone directly from voice samples
  const handleCreateVoiceClone = async () => {
    setIsCreatingVoiceClone(true);
    setVoiceCloneError(null);
    setVoiceCloneSuccess(false);

    try {
      const voiceResult = await api.createVoiceClone(
        `${user.firstName}'s Voice`,
        `Voice clone for ${user.firstName} ${user.lastName}`
      );

      if (voiceResult.success) {
        setPersona(prev => ({
          ...prev,
          elevenlabsVoiceId: voiceResult.voiceId,
          elevenlabsVoiceName: voiceResult.voiceName,
        }));
        setVoiceCloneSuccess(true);
        setTimeout(() => setVoiceCloneSuccess(false), 5000);
      } else {
        setVoiceCloneError(voiceResult.error || 'Failed to create voice clone');
      }
    } catch (error) {
      console.error('Voice clone error:', error);
      setVoiceCloneError(error.message || 'Failed to create voice clone');
    } finally {
      setIsCreatingVoiceClone(false);
    }
  };

  // Handle avatar creation completion (Step 6 - Preview)
  const handleAvatarCreation = async () => {
    setIsProcessingAvatar(true);
    setProcessingError(null);
    setProcessingComplete(false);

    const voiceSamples = persona.voiceSamples || [];
    const hasVoiceSamples = voiceSamples.length > 0;
    const avatarImages = persona.avatarImages || [];
    const activeImage = avatarImages.find(img => img.isActive || img.id === persona.activeAvatarId);

    try {
      // Step 1: Create voice clone if samples exist and not already created
      if (hasVoiceSamples && !persona.elevenlabsVoiceId) {
        setProcessingStep('Creating your voice clone...');
        try {
          const voiceResult = await api.createVoiceClone(
            `${user.firstName}'s Voice`,
            `Voice clone for ${user.firstName} ${user.lastName}`
          );
          if (voiceResult.success) {
            // Update persona with voice clone info
            setPersona(prev => ({
              ...prev,
              elevenlabsVoiceId: voiceResult.voiceId,
              elevenlabsVoiceName: voiceResult.voiceName,
            }));
          }
        } catch (voiceError) {
          console.error('Voice clone error:', voiceError);
          // Log debug info if available
          if (voiceError.debug) {
            console.error('Voice clone debug info:', voiceError.debug);
          }
          // Continue even if voice clone fails - don't block the whole process
        }
      }

      // Step 2: Create HeyGen Photo Avatar if image exists and not already created
      let avatarCreationWarning = null;
      if (activeImage && !persona.heygenAvatarId) {
        setProcessingStep('Creating talking avatar with lip sync...');
        try {
          const avatarResult = await api.createPhotoAvatar(
            activeImage.imageData,
            `${user.firstName}'s Avatar`
          );
          if (avatarResult.success) {
            // Update persona with HeyGen avatar info
            setPersona(prev => ({
              ...prev,
              heygenAvatarId: avatarResult.avatarId,
              heygenAvatarName: avatarResult.avatarName,
            }));
          } else {
            avatarCreationWarning = avatarResult.error || 'Failed to create talking avatar';
          }
        } catch (avatarError) {
          console.error('HeyGen avatar error:', avatarError);
          if (avatarError.debug) {
            console.error('HeyGen avatar debug info:', avatarError.debug);
          }
          avatarCreationWarning = avatarError.message || 'Failed to create talking avatar. You can try again later on My Persona page.';
        }
      }

      // Step 3: Save avatar settings and mark setup as complete
      setProcessingStep('Saving avatar settings...');
      await api.updateAvatarSettings({
        avatarStyle: persona.avatarStyle,
        backgroundType: persona.backgroundType,
        avatarSetupComplete: true,
      });

      // Update local state
      setPersona(prev => ({
        ...prev,
        avatarSetupComplete: true,
      }));

      // Step 4: Complete
      setProcessingStep('Finalizing your digital avatar...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for UX

      setProcessingComplete(true);
      setProcessingStep('');

      // Show warning if avatar creation failed but rest succeeded
      if (avatarCreationWarning) {
        setProcessingError(`Note: ${avatarCreationWarning}`);
      }

      // Auto-close after success - stay on My Persona page
      setTimeout(() => {
        setIsProcessingAvatar(false);
        setProcessingComplete(false);
        setProcessingError(null);
        setAvatarStep(0); // Reset to first step for creating another avatar
      }, avatarCreationWarning ? 5000 : 2000); // Longer delay if there's a warning

    } catch (error) {
      console.error('Avatar creation error:', error);
      setProcessingError(error.message || 'Failed to create avatar. Please try again.');
      setProcessingStep('');
    }
  };

  const handleSaveStory = async () => {
    if (!currentStory.trim()) return;

    // For custom stories, require a title
    if (showCustomStory && !customStoryTitle.trim()) return;

    // For category stories, require a selected category
    if (!showCustomStory && !selectedCategory) return;

    setSaving(true);
    const storyData = showCustomStory
      ? {
          category: 'custom',
          question: customStoryTitle.trim(),
          content: currentStory,
        }
      : {
          category: selectedCategory,
          content: currentStory,
        };

    const saved = await addStory(storyData);

    if (saved) {
      setCurrentStory('');
      setSelectedCategory(null);
      setCustomStoryTitle('');
      setShowCustomStory(false);
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 2000);
    }
    setSaving(false);
  };

  const handleDeleteStory = async (storyId) => {
    setSaving(true);
    await deleteStory(storyId);
    setSaving(false);
  };

  const handleUpdateStory = async (storyId) => {
    if (!editingStoryContent.trim()) return;
    setSaving(true);
    await updateStory(storyId, editingStoryContent.trim());
    setEditingStory(null);
    setEditingStoryContent('');
    setSaving(false);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Group stories by category
  const groupedStories = (persona.lifeStories || []).reduce((acc, story) => {
    const cat = story.category || 'interview';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(story);
    return acc;
  }, {});

  const handleInterviewAnswer = (answer) => {
    if (!selectedChapter) return;
    const chapter = interviewChapters.find(c => c.id === selectedChapter);
    const questionId = chapter.questions[questionIndex].id;
    setInterviewAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = async () => {
    if (!selectedChapter) return;
    const chapter = interviewChapters.find(c => c.id === selectedChapter);

    if (questionIndex < chapter.questions.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      // Save all answers from this chapter to database
      setSaving(true);

      const answersToSave = chapter.questions.filter(q => interviewAnswers[q.id]);

      for (const q of answersToSave) {
        await addStory({
          category: 'interview',
          chapterId: selectedChapter,
          chapterTitle: chapter.title,
          questionId: q.id,
          question: q.question,
          content: interviewAnswers[q.id],
        });
      }

      setSaving(false);

      // Reset and go back to chapter selection
      setSelectedChapter(null);
      setQuestionIndex(0);
      setInterviewAnswers({});
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 2000);
    }
  };

  const handlePrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex(prev => prev - 1);
    }
  };

  const getChapterProgress = (chapterId) => {
    const chapter = interviewChapters.find(c => c.id === chapterId);
    const answered = persona.lifeStories?.filter(s => s.chapterId === chapterId).length || 0;
    return { answered, total: chapter?.questions.length || 5 };
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'avatar':
        const avatarImages = persona.avatarImages || [];
        const hasImages = avatarImages.length > 0;
        const currentStepData = avatarSteps[avatarStep];
        const selectedBackground = backgrounds.find(b => b.id === persona.backgroundType) || backgrounds[0];
        const selectedStyle = avatarStyles.find(s => s.id === persona.avatarStyle) || avatarStyles[0];
        const activeAvatar = avatarImages.find(img => img.isActive || persona.activeAvatarId === img.id);

        // Render step content
        const renderAvatarStepContent = () => {
          switch (avatarSteps[avatarStep].id) {
            case 'photos':
              return (
                <div className="space-y-6">
                  {/* Photo Gallery */}
                  <div className="bg-navy-dark/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-cream font-medium">Your Photos</h4>
                      <span className="text-cream/40 text-xs">{avatarImages.length}/10 Photos</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {/* Existing Photos */}
                      {avatarImages.map((img) => (
                        <motion.div
                          key={img.id}
                          className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            persona.activeAvatarId === img.id
                              ? 'border-gold ring-2 ring-gold/30'
                              : 'border-gold/20 hover:border-gold/50'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => selectActiveAvatar(img.id)}
                        >
                          <img
                            src={img.imageData || img.image}
                            alt={img.label}
                            className="w-full h-full object-cover"
                          />
                          {/* Label */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                            <p className="text-cream text-xs text-center truncate">{img.label || 'No Label'}</p>
                          </div>
                          {/* Active Badge */}
                          {(img.isActive || persona.activeAvatarId === img.id) && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-gold rounded-full">
                              <span className="text-navy text-xs font-medium">Active</span>
                            </div>
                          )}
                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newLabel = prompt('New name:', img.label || '');
                                if (newLabel !== null) updateAvatarLabel(img.id, newLabel);
                              }}
                              className="w-7 h-7 bg-navy/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-gold/80 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cream" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Delete Photo',
                                  message: 'Are you sure you want to delete this photo? This action cannot be undone.',
                                  onConfirm: () => deleteAvatarImage(img.id),
                                });
                              }}
                              className="w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        </motion.div>
                      ))}

                      {/* Add New Photo - Upload Button */}
                      {avatarImages.length < 10 && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-gold/30 hover:border-gold/50 bg-navy-light/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-navy-light/50">
                          <Upload className="w-8 h-8 text-gold/50 mb-2" />
                          <span className="text-cream/50 text-sm">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            ref={fileInputRef}
                          />
                        </label>
                      )}

                      {/* Add New Photo - Camera Button */}
                      {avatarImages.length < 10 && (
                        <button
                          onClick={startCamera}
                          className="aspect-square rounded-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 bg-purple-500/10 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-purple-500/20"
                        >
                          <Camera className="w-8 h-8 text-purple-400/70 mb-2" />
                          <span className="text-purple-300/70 text-sm">Camera</span>
                        </button>
                      )}
                    </div>

                    {/* Info about required tags */}
                    <div className="mt-4 pt-4 border-t border-gold/10">
                      <div className="flex items-center gap-2 text-cream/50 text-sm">
                        <Tag className="w-4 h-4" />
                        <span>Each photo requires age group and occasion when uploading</span>
                      </div>
                    </div>
                  </div>

                  {!hasImages && (
                    <div className="text-center p-6 bg-gold/10 rounded-xl border border-gold/20">
                      <Camera className="w-12 h-12 text-gold/60 mx-auto mb-3" />
                      <p className="text-cream/70">Upload at least one photo to continue</p>
                    </div>
                  )}
                </div>
              );

            case 'voice':
              const voiceSamples = persona.voiceSamples || [];
              const hasVoiceSamples = voiceSamples.length > 0;

              return (
                <div className="space-y-6">
                  <p className="text-cream/60 text-sm text-center">
                    Record voice samples to create your personalized AI voice clone
                  </p>

                  {/* Voice Samples Gallery */}
                  <div className="bg-navy-dark/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-cream font-medium">Your Voice Recordings</h4>
                      <span className="text-cream/40 text-xs">{voiceSamples.length}/5 Samples</span>
                    </div>

                    {voiceSamples.length > 0 ? (
                      <div className="space-y-3">
                        {voiceSamples.map((sample, index) => (
                          <motion.div
                            key={sample.id}
                            className="flex items-center gap-4 p-4 bg-navy-light/30 rounded-xl border border-gold/20"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                              <Volume2 className="w-6 h-6 text-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-cream font-medium">{sample.label}</p>
                              <p className="text-cream/50 text-sm truncate">
                                {sample.prompt || 'Custom recording'}
                              </p>
                              <p className="text-cream/30 text-xs mt-1">
                                Duration: {formatTime(sample.duration || 0)}
                              </p>
                            </div>
                            <motion.button
                              onClick={() => handleDeleteVoiceSample(sample.id)}
                              className="p-2 rounded-full hover:bg-red-500/20 text-cream/50 hover:text-red-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="w-5 h-5" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-gold/20 rounded-xl">
                        <Mic className="w-12 h-12 text-gold/40 mx-auto mb-3" />
                        <p className="text-cream/50">No voice recordings yet</p>
                        <p className="text-cream/30 text-sm mt-1">Record samples to train your voice clone</p>
                      </div>
                    )}

                    {/* Add Recording Buttons */}
                    {voiceSamples.length < 5 && (
                      <div className="mt-4 space-y-3">
                        <motion.button
                          onClick={() => setShowVoiceModal(true)}
                          className="w-full p-4 border-2 border-dashed border-gold/30 hover:border-gold/50 rounded-xl flex items-center justify-center gap-3 text-cream/70 hover:text-cream transition-all"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Mic className="w-5 h-5" />
                          <span>Record Voice Sample</span>
                        </motion.button>

                        <motion.button
                          onClick={() => setShowVoiceMemoModal(true)}
                          className="w-full p-4 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/50 rounded-xl flex items-center justify-center gap-3 text-emerald-400/70 hover:text-emerald-400 transition-all bg-emerald-500/5"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Upload className="w-5 h-5" />
                          <span>Upload Book Reading (5+ min)</span>
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Voice Samples Info */}
                  {hasVoiceSamples && !persona.elevenlabsVoiceId && (
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="text-emerald-400 font-medium">{voiceSamples.length} Voice Sample{voiceSamples.length !== 1 ? 's' : ''} Ready</p>
                          <p className="text-emerald-300/60 text-sm">Ready to create your voice clone</p>
                        </div>
                      </div>

                      {/* Create Voice Clone Button */}
                      <motion.button
                        onClick={handleCreateVoiceClone}
                        disabled={isCreatingVoiceClone}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isCreatingVoiceClone ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating Voice Clone...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Create Voice Clone
                          </>
                        )}
                      </motion.button>

                      {voiceCloneError && (
                        <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                          <p className="text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {voiceCloneError}
                          </p>
                        </div>
                      )}

                      {voiceCloneSuccess && (
                        <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                          <p className="text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Voice clone created successfully!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice Clone Status - Show if already created */}
                  {persona.elevenlabsVoiceId && (
                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="text-green-400 font-medium">Voice Clone Active</p>
                        <p className="text-green-300/60 text-sm">Your AI will speak in your voice</p>
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  <div className="bg-gold/10 rounded-xl p-4 border border-gold/20">
                    <h5 className="text-gold font-medium mb-2">Tips for better voice cloning:</h5>
                    <ul className="text-cream/60 text-sm space-y-1">
                      <li>• Record in a quiet environment</li>
                      <li>• Speak clearly and at your natural pace</li>
                      <li>• Record at least 3 samples for best results</li>
                      <li>• Each recording should be 10-30 seconds</li>
                    </ul>
                  </div>

                  {!hasVoiceSamples && (
                    <div className="text-center p-4 bg-navy-dark/50 rounded-xl">
                      <p className="text-cream/50 text-sm">
                        Voice samples are optional but recommended for a personalized experience
                      </p>
                    </div>
                  )}
                </div>
              );

            case 'vibe':
              return (
                <div className="space-y-6">
                  <p className="text-cream/60 text-sm text-center">
                    Choose the personality style for your AI echo
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vibeOptions.map((vibe) => (
                      <motion.button
                        key={vibe.id}
                        onClick={() => setSelectedVibe(vibe.id)}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                          selectedVibe === vibe.id
                            ? 'border-gold bg-gold/10'
                            : 'border-gold/20 hover:border-gold/40 bg-navy-light/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${vibe.color} flex items-center justify-center mb-3`}>
                          <span className="text-2xl">{vibe.icon}</span>
                        </div>
                        <h4 className="text-cream font-medium">{vibe.label}</h4>
                        <p className="text-cream/50 text-sm mt-1">{vibe.description}</p>
                        {selectedVibe === vibe.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-navy" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Vibe Preview */}
                  <div className="bg-navy-dark/30 rounded-xl p-5">
                    <p className="text-cream/50 text-sm mb-3">Preview message:</p>
                    <p className="text-cream italic">
                      {selectedVibe === 'compassionate' && "I'm here for you, always. Whatever you're going through, know that you carry the strength of our family within you."}
                      {selectedVibe === 'strict' && "Remember what I've always taught you: discipline creates freedom. Let's look at this situation practically."}
                      {selectedVibe === 'storyteller' && "Let me tell you a story that might help. When I was about your age, something similar happened..."}
                      {selectedVibe === 'wise' && "Consider this carefully, as all meaningful decisions deserve reflection. There's wisdom to be found in every challenge."}
                      {selectedVibe === 'playful' && "Hey there, sunshine! Life's thrown you a curveball, huh? Well, let's figure this out together!"}
                      {selectedVibe === 'adventurous' && "This is an opportunity in disguise! Every challenge is a chance to grow. Let me share what I learned..."}
                    </p>
                  </div>
                </div>
              );

            
            default:
              return null;
          }
        };

        return (
          <div className="space-y-6">
            {/* Avatar Gallery Preview - Only shown when avatar setup wizard is complete */}
            {activeAvatar && persona.avatarSetupComplete && (
              <FadeIn>
                <div className="glass-card p-6 border-gold/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif text-cream">Your Digital Avatar</h3>
                  </div>

                  {/* Active Avatar with Settings */}
                  {activeAvatar && (
                    <div className="mb-6">
                      {/* Avatar Info Row */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gold/40">
                          <img
                            src={activeAvatar.imageData || activeAvatar.image}
                            alt={activeAvatar.label || 'Active Avatar'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs font-medium rounded-full">Active</span>
                            <span className="text-cream font-medium">{activeAvatar.label || 'Unnamed Avatar'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-navy-light/50 text-cream/60 text-xs rounded">
                              {avatarStyles.find(s => s.id === persona.avatarStyle)?.label || 'Realistic'}
                            </span>
                            <span className="px-2 py-0.5 bg-navy-light/50 text-cream/60 text-xs rounded">
                              {backgrounds.find(b => b.id === persona.backgroundType)?.label || 'Beach'}
                            </span>
                            <span className="px-2 py-0.5 bg-navy-light/50 text-cream/60 text-xs rounded flex items-center gap-1">
                              <span className="text-xs">{vibeOptions.find(v => v.id === (activeAvatar.echoVibe || 'compassionate'))?.icon}</span>
                              {vibeOptions.find(v => v.id === (activeAvatar.echoVibe || 'compassionate'))?.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Avatar Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {persona.elevenlabsVoiceId && (
                      <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Voice Clone Active
                      </span>
                    )}
                    {persona.heygenAvatarId && (
                      <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Talking Avatar Active
                      </span>
                    )}
                  </div>

                  {/* Edit/Delete Actions for Active Avatar */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => openEditAvatarModal(activeAvatar)}
                      className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-gold/20 text-cream/70 hover:text-gold rounded-lg text-sm transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Name
                    </button>
                    <button
                      onClick={() => setDeletingAvatar(activeAvatar)}
                      className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-red-500/20 text-cream/70 hover:text-red-400 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>

                  {/* Other Avatars (if more than 1) */}
                  {avatarImages.length > 1 && (
                    <div className="border-t border-gold/20 pt-4">
                      <p className="text-cream/50 text-sm mb-3">Switch to another avatar:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {avatarImages.filter(img => !(img.isActive || persona.activeAvatarId === img.id)).map((img) => (
                          <motion.button
                            key={img.id}
                            onClick={() => selectActiveAvatar(img.id)}
                            className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 border-gold/20 hover:border-gold/50 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <img
                              src={img.imageData || img.image}
                              alt={img.label}
                              className="w-full h-full object-cover"
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>
            )}

            {/* Create New Avatar Section */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-serif text-cream mb-6">
                {hasImages ? 'Create New Avatar' : 'Create Your First Avatar'}
              </h3>

            {/* Step Progress Header */}
            <div className="flex items-center justify-center mb-2 overflow-x-auto pb-2">
              <div className="flex items-center gap-1 min-w-max">
                {avatarSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === avatarStep;
                  const isCompleted = index < avatarStep;
                  return (
                    <div key={step.id} className="flex items-center">
                      <motion.button
                        onClick={() => setAvatarStep(index)}
                        className={`flex flex-col items-center ${isActive || isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                        whileHover={isActive || isCompleted ? { scale: 1.05 } : {}}
                      >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-gold text-navy'
                            : isCompleted
                            ? 'bg-gold/30 text-gold'
                            : 'bg-navy-light/50 text-cream/40'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                          ) : (
                            <Icon className="w-5 h-5 md:w-6 md:h-6" />
                          )}
                        </div>
                        <span className={`mt-1 text-[10px] md:text-xs font-medium whitespace-nowrap ${
                          isActive ? 'text-gold' : isCompleted ? 'text-cream/70' : 'text-cream/40'
                        }`}>
                          {step.label}
                        </span>
                      </motion.button>
                      {index < avatarSteps.length - 1 && (
                        <div className={`w-4 md:w-8 h-0.5 mx-1 flex-shrink-0 ${
                          index < avatarStep ? 'bg-gold/50' : 'bg-navy-light/50'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Step Title */}
            <div className="text-center py-4 border-b border-gold/10">
              <h3 className="text-2xl font-serif text-cream">{currentStepData.description}</h3>
              <p className="text-cream/50 text-sm mt-1">Step {avatarStep + 1} of {avatarSteps.length}</p>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={avatarStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderAvatarStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-gold/10">
              {avatarStep > 0 ? (
                <motion.button
                  onClick={() => setAvatarStep(prev => prev - 1)}
                  className="btn-secondary flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </motion.button>
              ) : (
                <div />
              )}

              {avatarStep < avatarSteps.length - 1 ? (
                <motion.button
                  onClick={handleNextStep}
                  disabled={avatarStep === 0 && !hasImages}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleAvatarCreation}
                  className="btn-primary flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Complete Setup
                </motion.button>
              )}
            </div>

            {/* Processing Modal */}
            <AnimatePresence>
              {isProcessingAvatar && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-navy-dark border-2 border-gold/30 rounded-2xl p-8 max-w-md w-full mx-4 text-center"
                  >
                    {processingComplete ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                          className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-12 h-12 text-green-400" />
                        </motion.div>
                        <h3 className="text-2xl font-serif text-cream mb-2">Avatar Created!</h3>
                        <p className="text-cream/60">Your digital echo is ready to speak.</p>
                      </>
                    ) : processingError ? (
                      <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                          <X className="w-12 h-12 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-serif text-cream mb-2">Creation Failed</h3>
                        <p className="text-cream/60 mb-6">{processingError}</p>
                        <div className="flex gap-4 justify-center">
                          <motion.button
                            onClick={() => {
                              setIsProcessingAvatar(false);
                              setProcessingError(null);
                            }}
                            className="btn-secondary"
                            whileHover={{ scale: 1.05 }}
                          >
                            Close
                          </motion.button>
                          <motion.button
                            onClick={handleAvatarCreation}
                            className="btn-primary"
                            whileHover={{ scale: 1.05 }}
                          >
                            Try Again
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                          <div className="absolute inset-0 border-4 border-gold/20 rounded-full" />
                          <motion.div
                            className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-gold" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-serif text-cream mb-2">Creating Your Avatar</h3>
                        <p className="text-cream/60 mb-4">{processingStep || 'Please wait...'}</p>
                        <div className="space-y-3 text-left bg-navy-light/30 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            {(persona.voiceSamples?.length || 0) > 0 ? (
                              processingStep.includes('voice') ? (
                                <Loader2 className="w-5 h-5 text-gold animate-spin" />
                              ) : processingStep.includes('Saving') || processingStep.includes('Finalizing') ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-cream/30 rounded-full" />
                              )
                            ) : (
                              <div className="w-5 h-5 border-2 border-cream/20 rounded-full" />
                            )}
                            <span className={`text-sm ${(persona.voiceSamples?.length || 0) > 0 ? 'text-cream' : 'text-cream/40'}`}>
                              Voice Clone {(persona.voiceSamples?.length || 0) > 0 ? `(${persona.voiceSamples.length} samples)` : '(no samples)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {processingStep.includes('Saving') ? (
                              <Loader2 className="w-5 h-5 text-gold animate-spin" />
                            ) : processingStep.includes('Finalizing') ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-cream/30 rounded-full" />
                            )}
                            <span className="text-cream text-sm">Avatar Settings</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {processingStep.includes('Finalizing') ? (
                              <Loader2 className="w-5 h-5 text-gold animate-spin" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-cream/30 rounded-full" />
                            )}
                            <span className="text-cream text-sm">Finalize</span>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        );

      case 'stories':
        return (
          <div className="space-y-8">
            <div className="text-center mb-4">
              <p className="text-cream/60 text-sm">
                Select a category to share your story. The more stories you add, the richer your echo becomes.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {storyCategories.map((cat) => {
                const Icon = cat.icon;
                const storiesInCategory = persona.lifeStories?.filter(s => s.category === cat.id).length || 0;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setShowCustomStory(false);
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedCategory === cat.id && !showCustomStory
                        ? 'border-gold bg-gold/10'
                        : storiesInCategory > 0
                        ? 'border-gold/40 bg-gold/5'
                        : 'border-gold/20 hover:border-gold/40 bg-navy-light/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 ${selectedCategory === cat.id && !showCustomStory ? 'text-gold' : storiesInCategory > 0 ? 'text-gold/70' : 'text-gold/50'}`} />
                      {storiesInCategory > 0 && (
                        <span className="text-xs text-gold bg-gold/20 px-1.5 py-0.5 rounded-full">{storiesInCategory}</span>
                      )}
                    </div>
                    <h4 className="text-cream font-medium text-xs leading-tight">{cat.label}</h4>
                  </motion.button>
                );
              })}
              {/* Custom Story Button */}
              <motion.button
                onClick={() => {
                  setShowCustomStory(true);
                  setSelectedCategory(null);
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  showCustomStory
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Edit3 className={`w-5 h-5 ${showCustomStory ? 'text-purple-400' : 'text-purple-400/60'}`} />
                  {(persona.lifeStories?.filter(s => s.category === 'custom').length || 0) > 0 && (
                    <span className="text-xs text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded-full">
                      {persona.lifeStories?.filter(s => s.category === 'custom').length}
                    </span>
                  )}
                </div>
                <h4 className="text-cream font-medium text-xs leading-tight">Write Your Own</h4>
              </motion.button>
            </div>

            <AnimatePresence>
              {selectedCategory && !showCustomStory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <p className="text-cream/60 italic">
                    {storyCategories.find(c => c.id === selectedCategory)?.prompt}
                  </p>
                  <textarea
                    value={currentStory}
                    onChange={(e) => setCurrentStory(e.target.value)}
                    placeholder="Begin writing your story..."
                    className="input-field min-h-[200px] resize-none"
                  />
                  <div className="flex justify-end gap-4">
                    <motion.button
                      onClick={() => {
                        setSelectedCategory(null);
                        setCurrentStory('');
                      }}
                      className="btn-secondary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleSaveStory}
                      disabled={!currentStory.trim()}
                      className="btn-primary flex items-center disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Story
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Custom Story Form */}
              {showCustomStory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 className="w-5 h-5 text-purple-400" />
                      <h4 className="text-purple-300 font-medium">Write Your Own Story</h4>
                    </div>
                    <p className="text-cream/60 text-sm">
                      Share any story, memory, or reflection that's meaningful to you. Give it a title so you can easily find it later.
                    </p>
                  </div>

                  <div>
                    <label className="text-cream/70 text-sm mb-1 block">Story Title / Question</label>
                    <input
                      type="text"
                      value={customStoryTitle}
                      onChange={(e) => setCustomStoryTitle(e.target.value)}
                      placeholder="e.g., My first trip abroad, How I met my best friend..."
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="text-cream/70 text-sm mb-1 block">Your Story</label>
                    <textarea
                      value={currentStory}
                      onChange={(e) => setCurrentStory(e.target.value)}
                      placeholder="Begin writing your story..."
                      className="input-field min-h-[200px] resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <motion.button
                      onClick={() => {
                        setShowCustomStory(false);
                        setCurrentStory('');
                        setCustomStoryTitle('');
                      }}
                      className="btn-secondary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleSaveStory}
                      disabled={!currentStory.trim() || !customStoryTitle.trim()}
                      className="btn-primary flex items-center disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Story
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {persona.lifeStories?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif text-cream">Your Stories</h3>
                <div className="space-y-3">
                  {Object.entries(groupedStories).map(([categoryId, stories]) => {
                    const category = categoryId === 'custom'
                      ? { label: 'Custom Stories', icon: Edit3 }
                      : storyCategories.find(c => c.id === categoryId) ||
                        interviewChapters.find(c => c.id === categoryId) ||
                        { label: 'Interview', icon: BookOpen };
                    const Icon = category?.icon || BookOpen;
                    const isExpanded = expandedCategories[categoryId] !== false;
                    const isCustom = categoryId === 'custom';

                    return (
                      <div key={categoryId} className="glass-card overflow-hidden">
                        {/* Category Header - Accordion */}
                        <motion.button
                          onClick={() => toggleCategory(categoryId)}
                          className={`w-full flex items-center justify-between p-4 hover:bg-gold/5 transition-colors ${isCustom ? 'bg-purple-500/5' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCustom ? 'bg-purple-500/20' : 'bg-gold/10'}`}>
                              <Icon className={`w-5 h-5 ${isCustom ? 'text-purple-400' : 'text-gold'}`} />
                            </div>
                            <div className="text-left">
                              <p className="text-cream font-medium">{category?.label || category?.title || 'Interview'}</p>
                              <p className="text-cream/50 text-xs">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-cream/50" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-cream/50" />
                          )}
                        </motion.button>

                        {/* Stories List */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gold/10"
                            >
                              {stories.map((story) => (
                                <div key={story.id} className="p-4 border-b border-gold/5 last:border-b-0">
                                  {editingStory === story.id ? (
                                    /* Edit Mode */
                                    <div className="space-y-3">
                                      {story.question && (
                                        <p className="text-gold/70 text-sm italic">"{story.question}"</p>
                                      )}
                                      <textarea
                                        value={editingStoryContent}
                                        onChange={(e) => setEditingStoryContent(e.target.value)}
                                        className="w-full px-4 py-3 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50 min-h-[120px] resize-none"
                                        placeholder="Your story..."
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <motion.button
                                          onClick={() => {
                                            setEditingStory(null);
                                            setEditingStoryContent('');
                                          }}
                                          className="px-3 py-1.5 text-cream/50 hover:text-cream text-sm"
                                          whileHover={{ scale: 1.02 }}
                                        >
                                          Cancel
                                        </motion.button>
                                        <motion.button
                                          onClick={() => handleUpdateStory(story.id)}
                                          disabled={saving}
                                          className="px-4 py-1.5 bg-gold text-navy rounded-lg text-sm font-medium flex items-center gap-2"
                                          whileHover={{ scale: 1.02 }}
                                        >
                                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                          Save
                                        </motion.button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* View Mode */
                                    <div>
                                      {story.question && (
                                        <p className="text-gold/70 text-sm italic mb-2">"{story.question}"</p>
                                      )}
                                      <p className="text-cream/80">{story.content}</p>
                                      <div className="flex items-center justify-between mt-3">
                                        <p className="text-cream/40 text-xs">
                                          {new Date(story.createdAt).toLocaleDateString('de-DE')}
                                        </p>
                                        <div className="flex gap-2">
                                          <motion.button
                                            onClick={() => {
                                              setEditingStory(story.id);
                                              setEditingStoryContent(story.content);
                                            }}
                                            className="p-1.5 text-cream/30 hover:text-gold"
                                            whileHover={{ scale: 1.1 }}
                                          >
                                            <Edit3 className="w-4 h-4" />
                                          </motion.button>
                                          <motion.button
                                            onClick={() => handleDeleteStory(story.id)}
                                            className="p-1.5 text-cream/30 hover:text-red-400"
                                            whileHover={{ scale: 1.1 }}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </motion.button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'interview':
        // Chapter selection view
        if (!selectedChapter) {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-serif text-cream mb-2">Deep Interview Chapters</h3>
                <p className="text-cream/60 text-sm">
                  Select a chapter to explore. Each chapter contains 5 thoughtful questions to help capture your story.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {interviewChapters.map((chapter) => {
                  const progress = getChapterProgress(chapter.id);
                  const isComplete = progress.answered === progress.total;
                  return (
                    <motion.button
                      key={chapter.id}
                      onClick={() => {
                        setSelectedChapter(chapter.id);
                        setQuestionIndex(0);
                        setInterviewAnswers({});
                      }}
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        isComplete
                          ? 'border-green-500/50 bg-green-500/10'
                          : progress.answered > 0
                          ? 'border-gold/50 bg-gold/10'
                          : 'border-gold/20 hover:border-gold/40 bg-navy-light/30'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{chapter.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-cream font-medium mb-1">{chapter.title}</h4>
                          <p className="text-cream/50 text-sm mb-3">{chapter.description}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-gold'}`}
                                style={{ width: `${(progress.answered / progress.total) * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs ${isComplete ? 'text-green-400' : 'text-cream/40'}`}>
                              {progress.answered}/{progress.total}
                            </span>
                          </div>
                        </div>
                        {isComplete && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Overall Progress */}
              <div className="bg-navy-dark/30 rounded-xl p-4 mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cream/60 text-sm">Overall Progress</span>
                  <span className="text-gold text-sm font-medium">
                    {interviewChapters.reduce((acc, ch) => acc + getChapterProgress(ch.id).answered, 0)} / 50 questions
                  </span>
                </div>
                <div className="h-2 bg-navy-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-light transition-all"
                    style={{
                      width: `${(interviewChapters.reduce((acc, ch) => acc + getChapterProgress(ch.id).answered, 0) / 50) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }

        // Question view within a chapter
        const currentChapter = interviewChapters.find(c => c.id === selectedChapter);
        const currentQuestion = currentChapter.questions[questionIndex];
        const currentAnswer = interviewAnswers[currentQuestion.id] || '';

        return (
          <div className="max-w-2xl mx-auto">
            {/* Chapter Header */}
            <div className="flex items-center gap-3 mb-6">
              <motion.button
                onClick={() => {
                  setSelectedChapter(null);
                  setQuestionIndex(0);
                  setInterviewAnswers({});
                }}
                className="p-2 rounded-lg hover:bg-navy-light/50 text-cream/60 hover:text-cream transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentChapter.icon}</span>
                <div>
                  <h3 className="text-lg font-serif text-cream">{currentChapter.title}</h3>
                  <p className="text-cream/40 text-xs">Question {questionIndex + 1} of {currentChapter.questions.length}</p>
                </div>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {currentChapter.questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === questionIndex
                      ? 'w-8 bg-gold'
                      : index < questionIndex || interviewAnswers[currentChapter.questions[index].id]
                      ? 'bg-gold/50'
                      : 'bg-gold/20'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={questionIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="text-center mb-8"
              >
                <h3 className="text-2xl font-serif text-cream mb-2">
                  {currentQuestion.question}
                </h3>
              </motion.div>
            </AnimatePresence>

            <textarea
              value={currentAnswer}
              onChange={(e) => handleInterviewAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="input-field min-h-[200px] resize-none mb-6"
            />

            <div className="flex justify-between">
              {questionIndex > 0 ? (
                <motion.button
                  onClick={handlePrevQuestion}
                  className="btn-secondary flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => {
                    setSelectedChapter(null);
                    setQuestionIndex(0);
                    setInterviewAnswers({});
                  }}
                  className="btn-secondary flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Chapters
                </motion.button>
              )}

              <motion.button
                onClick={handleNextQuestion}
                disabled={!currentAnswer.trim()}
                className="btn-primary flex items-center disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {questionIndex === currentChapter.questions.length - 1 ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Complete Chapter
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        );

      case 'liveavatar':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-4">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-serif text-cream mb-2">Create Your Video Avatar</h3>
              <p className="text-cream/60 text-sm max-w-lg mx-auto">
                Upload two videos to create your personalized AI avatar that can speak with your voice and likeness.
              </p>
            </div>

            {/* Current Status Card */}
            {liveAvatarStatus && (
              <div className="bg-navy-dark/30 rounded-xl p-5 border border-gold/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-cream font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-gold" />
                    Avatar Status
                  </h4>
                  <button
                    onClick={refreshLiveAvatarStatus}
                    className="text-cream/50 hover:text-gold transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {liveAvatarStatus.hasCustomAvatar ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-cream/60 text-sm">Avatar Name:</span>
                      <span className="text-cream">{liveAvatarStatus.customAvatarName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cream/60 text-sm">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        liveAvatarStatus.customAvatarStatus === 'ready'
                          ? 'bg-green-500/20 text-green-400'
                          : liveAvatarStatus.customAvatarStatus === 'training'
                          ? 'bg-amber-500/20 text-amber-400'
                          : liveAvatarStatus.customAvatarStatus === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {liveAvatarStatus.customAvatarStatus === 'ready' ? '✓ Ready' :
                         liveAvatarStatus.customAvatarStatus === 'training' ? '⏳ Training' :
                         liveAvatarStatus.customAvatarStatus === 'failed' ? '✗ Failed' :
                         '🕐 Pending'}
                      </span>
                    </div>
                    {liveAvatarStatus.customAvatarStatus === 'ready' && (
                      <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                        <p className="text-green-400 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Your Video Avatar is ready! Go to Echo Sim → Live Conversation to use it.
                        </p>
                      </div>
                    )}
                    {liveAvatarStatus.customAvatarStatus === 'training' && (
                      <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                        <p className="text-amber-400 text-sm flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Your avatar is being trained. This may take a few hours.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-cream/50 text-sm">No custom avatar yet. Create one below!</p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {liveAvatarError && (
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {liveAvatarError}
                </p>
              </div>
            )}

            {/* Recording in progress overlay */}
            {isRecordingVideo && (
              <div className="bg-navy-dark/30 rounded-xl p-5 border border-purple-500/50">
                <div className="mb-4">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                    <video
                      ref={videoPreviewRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                        Recording {activeVideoType === 'consent' ? 'Consent' : 'Training'}: {formatTime(videoRecordingTime)}
                      </span>
                    </div>
                    {activeVideoType === 'training' && videoRecordingTime < 120 && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${(videoRecordingTime / 120) * 100}%` }}
                          />
                        </div>
                        <p className="text-white/70 text-xs text-center mt-1">
                          {videoRecordingTime < 15 ? 'Listening phase...' :
                           videoRecordingTime < 105 ? 'Talking phase - speak naturally!' :
                           'Idle phase - stay still...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-center">
                  <motion.button
                    onClick={stopVideoRecording}
                    className="px-8 py-3 bg-red-500 text-white rounded-xl flex items-center gap-2 hover:bg-red-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Square className="w-5 h-5" />
                    Stop Recording
                  </motion.button>
                </div>
              </div>
            )}

            {/* Two Video Upload Sections */}
            {!isRecordingVideo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Training Video Section */}
                <div className="bg-navy-dark/30 rounded-xl p-5 border border-gold/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Video className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-cream font-medium">Training Video</h4>
                      <p className="text-cream/50 text-xs">2 minutes: 15s listen, 90s talk, 15s idle</p>
                    </div>
                    {trainingVideoPreview && (
                      <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto" />
                    )}
                  </div>

                  {trainingVideoPreview ? (
                    <div className="space-y-3">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <video
                          src={trainingVideoPreview}
                          className="w-full h-full object-cover"
                          controls
                        />
                        <button
                          onClick={() => resetVideo('training')}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      {isUploadingTraining && (
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading training video...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col items-center justify-center p-4 bg-navy-light/30 rounded-lg border-2 border-dashed border-gold/30 hover:border-gold/50 cursor-pointer transition-all">
                        <Upload className="w-6 h-6 text-gold/50 mb-1" />
                        <span className="text-cream text-xs font-medium">Upload</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoFileSelect(e, 'training')}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => startVideoRecording('training')}
                        className="flex flex-col items-center justify-center p-4 bg-purple-500/20 rounded-lg border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 transition-all"
                      >
                        <Camera className="w-6 h-6 text-purple-400 mb-1" />
                        <span className="text-cream text-xs font-medium">Record</span>
                      </button>
                    </div>
                  )}

                  {/* Training video guidelines */}
                  <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                    <p className="text-cream/60 text-xs leading-relaxed">
                      <span className="text-purple-400 font-medium">Structure:</span> Start with 15s of listening silence,
                      then talk naturally for 90s, end with 15s silent idle. Good lighting and clear audio are essential.
                    </p>
                  </div>
                </div>

                {/* Consent Video Section */}
                <div className="bg-navy-dark/30 rounded-xl p-5 border border-gold/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-cream font-medium">Consent Video</h4>
                      <p className="text-cream/50 text-xs">Short statement granting permission</p>
                    </div>
                    {consentVideoPreview && (
                      <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto" />
                    )}
                  </div>

                  {consentVideoPreview ? (
                    <div className="space-y-3">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <video
                          src={consentVideoPreview}
                          className="w-full h-full object-cover"
                          controls
                        />
                        <button
                          onClick={() => resetVideo('consent')}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      {isUploadingConsent && (
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading consent video...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col items-center justify-center p-4 bg-navy-light/30 rounded-lg border-2 border-dashed border-gold/30 hover:border-gold/50 cursor-pointer transition-all">
                        <Upload className="w-6 h-6 text-gold/50 mb-1" />
                        <span className="text-cream text-xs font-medium">Upload</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoFileSelect(e, 'consent')}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => startVideoRecording('consent')}
                        className="flex flex-col items-center justify-center p-4 bg-indigo-500/20 rounded-lg border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/50 transition-all"
                      >
                        <Camera className="w-6 h-6 text-indigo-400 mb-1" />
                        <span className="text-cream text-xs font-medium">Record</span>
                      </button>
                    </div>
                  )}

                  {/* Consent script */}
                  <div className="mt-4 p-3 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                    <p className="text-cream/60 text-xs leading-relaxed">
                      <span className="text-indigo-400 font-medium">Say this:</span> "I, [your name], authorize the use of
                      my likeness and voice for creating a digital avatar for EchoTrail."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            {!isRecordingVideo && (trainingVideoPreview || consentVideoPreview) && (
              <div className="flex justify-center">
                <motion.button
                  onClick={uploadAndCreateLiveAvatar}
                  disabled={!trainingVideo || !consentVideo || isUploadingTraining || isUploadingConsent || isCreatingLiveAvatar}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl flex items-center gap-2 hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isUploadingTraining ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading Training Video...
                    </>
                  ) : isUploadingConsent ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading Consent Video...
                    </>
                  ) : isCreatingLiveAvatar ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting Avatar Training...
                    </>
                  ) : !trainingVideo || !consentVideo ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Upload Both Videos
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Video Avatar
                    </>
                  )}
                </motion.button>
              </div>
            )}

            {/* Requirements Info */}
            {!isRecordingVideo && !trainingVideoPreview && !consentVideoPreview && (
              <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl p-5 border border-purple-500/20">
                <h4 className="text-cream font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-400" />
                  Video Avatar Requirements
                </h4>
                <ul className="space-y-2 text-cream/60 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">1.</span>
                    <span><strong className="text-cream">Training Video (2 min):</strong> Shows your face and voice for AI learning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">2.</span>
                    <span><strong className="text-cream">Consent Video:</strong> Verbal permission for avatar creation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">3.</span>
                    <span>Good lighting, clear audio, face the camera directly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">4.</span>
                    <span>Training typically takes a few hours after upload</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        );

      case 'values':
        return <ValueStore />;

      default:
        return null;
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-8">
      <div className="max-w-7xl mx-auto px-4">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-cream mb-2">
                Build Your Persona
              </h1>
              <p className="text-cream/60">
                Welcome back, <span className="text-gold">{user?.firstName}</span>. Let's continue shaping your digital essence.
              </p>
            </div>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FadeIn delay={0.1}>
              <div className="glass-card p-1 mb-6">
                <div className="flex">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gold/20 text-gold'
                          : 'text-cream/60 hover:text-cream'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {tab.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="glass-card p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderTabContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </FadeIn>
          </div>

          <div className="space-y-6">
            <FadeIn delay={0.3}>
              <LegacyScoreCard />
            </FadeIn>

            <FadeIn delay={0.4}>
              <motion.button
                onClick={() => onNavigate('echo-sim')}
                className="w-full glass-card-hover p-6 text-left"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-lg font-serif text-cream mb-2">Ready to Test?</h3>
                <p className="text-cream/60 text-sm mb-4">
                  See your digital persona in action with the Echo Simulator.
                </p>
                <span className="text-gold text-sm flex items-center">
                  Launch Echo Sim
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              </motion.button>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Save Confirmation Toast */}
      <AnimatePresence>
        {showSaveConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gold text-navy px-6 py-3 rounded-full flex items-center shadow-lg z-50"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span className="font-medium">Saved to your legacy!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleUploadCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-dark border border-gold/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif text-cream">Photo Details</h3>
                <button
                  onClick={handleUploadCancel}
                  className="p-2 rounded-lg hover:bg-navy-light/50 text-cream/60 hover:text-cream transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview */}
              {pendingImage && (
                <div className="mb-6">
                  <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border-2 border-gold/30">
                    <img
                      src={pendingImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Name (Optional) */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Name / Title <span className="text-cream/40">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Wedding 2015, Grandpa at 30..."
                    className="input-field"
                  />
                </div>

                {/* Age Category (Required) */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Age Group <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ageCategories.map((age) => (
                      <motion.button
                        key={age.id}
                        type="button"
                        onClick={() => {
                          setUploadForm(prev => ({ ...prev, age: age.id }));
                          setUploadErrors(prev => ({ ...prev, age: null }));
                        }}
                        className={`p-2.5 rounded-lg border-2 text-left text-sm transition-all ${
                          uploadForm.age === age.id
                            ? 'border-gold bg-gold/20 text-cream'
                            : 'border-gold/20 hover:border-gold/40 text-cream/70'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {age.label}
                      </motion.button>
                    ))}
                  </div>
                  {uploadErrors.age && (
                    <p className="text-red-400 text-xs mt-1">{uploadErrors.age}</p>
                  )}
                </div>

                {/* Occasion Category (Required) */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Occasion <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {occasionCategories.map((occasion) => (
                      <motion.button
                        key={occasion.id}
                        type="button"
                        onClick={() => {
                          setUploadForm(prev => ({ ...prev, occasion: occasion.id }));
                          setUploadErrors(prev => ({ ...prev, occasion: null }));
                        }}
                        className={`p-2.5 rounded-lg border-2 text-left text-sm transition-all ${
                          uploadForm.occasion === occasion.id
                            ? 'border-gold bg-gold/20 text-cream'
                            : 'border-gold/20 hover:border-gold/40 text-cream/70'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {occasion.label}
                      </motion.button>
                    ))}
                  </div>
                  {uploadErrors.occasion && (
                    <p className="text-red-400 text-xs mt-1">{uploadErrors.occasion}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleUploadCancel}
                  className="flex-1 btn-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAvatarSubmit}
                  disabled={saving}
                  className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recording Modal */}
      <AnimatePresence>
        {showVoiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!isRecording) {
                setShowVoiceModal(false);
                resetRecording();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-dark border border-gold/30 rounded-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-serif text-cream">Record Voice Samples</h3>
                  <p className="text-cream/50 text-sm">
                    Recording {recordedPrompts.length + 1} of {voicePrompts.length}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!isRecording) {
                      setShowVoiceModal(false);
                      resetRecording();
                      setRecordedPrompts([]);
                      setSelectedPrompt(0);
                    }
                  }}
                  disabled={isRecording}
                  className="p-2 rounded-lg hover:bg-navy-light/50 text-cream/60 hover:text-cream transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="flex gap-1 mb-4">
                {voicePrompts.map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      recordedPrompts.includes(index)
                        ? 'bg-green-500'
                        : selectedPrompt === index
                        ? 'bg-gold'
                        : 'bg-navy-light/50'
                    }`}
                  />
                ))}
              </div>

              {/* Current Prompt Display */}
              <div className="mb-6">
                <label className="block text-cream/70 text-sm mb-2">
                  Read this prompt aloud (~30 seconds):
                </label>
                <div className="p-4 rounded-xl bg-navy-light/30 border border-gold/20">
                  <p className="text-cream text-sm leading-relaxed">
                    {voicePrompts[selectedPrompt]}
                  </p>
                </div>

                {/* Quick Prompt Navigation */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {voicePrompts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isRecording && !audioBlob) setSelectedPrompt(index);
                      }}
                      disabled={isRecording || audioBlob}
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                        recordedPrompts.includes(index)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : selectedPrompt === index
                          ? 'bg-gold text-navy'
                          : 'bg-navy-light/50 text-cream/60 hover:bg-navy-light hover:text-cream'
                      } disabled:opacity-50`}
                    >
                      {recordedPrompts.includes(index) ? '✓' : index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recording Interface */}
              <div className="text-center py-6">
                {/* Timer Display */}
                <div className="text-4xl font-mono text-gold mb-6">
                  {formatTime(recordingTime)}
                </div>

                {/* Recording Button */}
                <div className="flex items-center justify-center gap-4">
                  {!audioBlob ? (
                    <>
                      {isRecording ? (
                        <motion.button
                          onClick={stopRecording}
                          className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <Square className="w-8 h-8 text-white" />
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={startRecording}
                          className="w-20 h-20 rounded-full bg-gold flex items-center justify-center shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Mic className="w-8 h-8 text-navy" />
                        </motion.button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Playback Controls */}
                      <motion.button
                        onClick={togglePlayback}
                        className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 text-gold" />
                        ) : (
                          <Play className="w-6 h-6 text-gold ml-1" />
                        )}
                      </motion.button>
                      <motion.button
                        onClick={resetRecording}
                        className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Hidden audio element for playback */}
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                )}

                {/* Status Text */}
                <p className="text-cream/50 text-sm mt-4">
                  {isRecording
                    ? 'Recording... Click to stop'
                    : audioBlob
                    ? 'Review your recording or re-record'
                    : 'Click to start recording'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={() => {
                    setShowVoiceModal(false);
                    resetRecording();
                    setRecordedPrompts([]);
                    setSelectedPrompt(0);
                  }}
                  disabled={isRecording}
                  className="flex-1 btn-secondary disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {recordedPrompts.length > 0 ? 'Done' : 'Cancel'}
                </motion.button>
                <motion.button
                  onClick={saveVoiceSample}
                  disabled={!audioBlob || saving}
                  className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? (
                    <>Saving...</>
                  ) : recordedPrompts.length + 1 >= voicePrompts.length ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save & Finish
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save & Next
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Memo Upload Modal */}
      <AnimatePresence>
        {showVoiceMemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!voiceMemoUploading) {
                setShowVoiceMemoModal(false);
                setVoiceMemoFile(null);
                setVoiceMemoDuration(0);
                setVoiceMemoError('');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-dark border border-gold/30 rounded-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif text-cream">Upload Book Reading</h3>
                <button
                  onClick={() => {
                    if (!voiceMemoUploading) {
                      setShowVoiceMemoModal(false);
                      setVoiceMemoFile(null);
                      setVoiceMemoDuration(0);
                      setVoiceMemoError('');
                    }
                  }}
                  disabled={voiceMemoUploading}
                  className="p-2 rounded-lg hover:bg-navy-light/50 text-cream/60 hover:text-cream transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <div className="mb-6 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-emerald-300 text-sm">
                  Upload a recording of yourself reading from a book. This helps create a more accurate voice clone.
                  The recording must be at least <strong>5 minutes</strong> long.
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={voiceMemoInputRef}
                onChange={handleVoiceMemoSelect}
                accept="audio/*"
                className="hidden"
              />

              {/* Upload Area */}
              <div className="text-center py-6">
                {voiceMemoError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{voiceMemoError}</p>
                  </div>
                )}

                {!voiceMemoFile ? (
                  <motion.button
                    onClick={() => voiceMemoInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center gap-3 text-cream/70 hover:text-cream transition-all bg-emerald-500/5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Upload className="w-10 h-10 text-emerald-400" />
                    <span className="text-lg">Click to select audio file</span>
                    <span className="text-cream/40 text-sm">MP3, WAV, M4A, etc. (max 100MB)</span>
                  </motion.button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Mic className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-cream font-medium truncate">{voiceMemoFile.name}</p>
                          <p className="text-emerald-400 text-sm">
                            Duration: {Math.floor(voiceMemoDuration / 60)}:{(voiceMemoDuration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setVoiceMemoFile(null);
                            setVoiceMemoDuration(0);
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-cream/50 text-sm">
                      File ready to upload
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={() => {
                    setShowVoiceMemoModal(false);
                    setVoiceMemoFile(null);
                    setVoiceMemoDuration(0);
                    setVoiceMemoError('');
                  }}
                  disabled={voiceMemoUploading}
                  className="flex-1 btn-secondary disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleVoiceMemoUpload}
                  disabled={!voiceMemoFile || voiceMemoUploading}
                  className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {voiceMemoUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Upload Recording
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Avatar Modal */}
      <AnimatePresence>
        {editingAvatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingAvatar(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-navy-light rounded-2xl p-6 max-w-md w-full border border-gold/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif text-cream">Edit Avatar</h3>
                <button
                  onClick={() => setEditingAvatar(null)}
                  className="p-2 hover:bg-navy rounded-lg text-cream/50 hover:text-cream transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar Preview */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gold/30">
                  <img
                    src={editingAvatar.imageData || editingAvatar.image}
                    alt={editingAvatar.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-cream/70 text-sm mb-2">Avatar Name</label>
                  <input
                    type="text"
                    value={editAvatarForm.label}
                    onChange={(e) => setEditAvatarForm({ label: e.target.value })}
                    placeholder="Enter avatar name..."
                    className="input-field w-full"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingAvatar(null)}
                  className="flex-1 px-4 py-3 bg-navy hover:bg-navy-dark text-cream rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvatarEdit}
                  disabled={isUpdatingAvatar}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {isUpdatingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Avatar Confirmation Modal */}
      <AnimatePresence>
        {deletingAvatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeletingAvatar(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-navy-light rounded-2xl p-6 max-w-md w-full border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-cream">Delete Avatar</h3>
                  <p className="text-cream/50 text-sm">This action cannot be undone</p>
                </div>
              </div>

              {/* Avatar Preview */}
              <div className="flex items-center gap-4 p-4 bg-navy/50 rounded-xl mb-6">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gold/20">
                  <img
                    src={deletingAvatar.imageData || deletingAvatar.image}
                    alt={deletingAvatar.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-cream font-medium">{deletingAvatar.label || 'Unnamed Avatar'}</p>
                  {(deletingAvatar.isActive || persona.activeAvatarId === deletingAvatar.id) && (
                    <span className="text-gold text-xs">Currently Active</span>
                  )}
                </div>
              </div>

              <p className="text-cream/70 text-sm mb-6">
                Are you sure you want to delete this avatar? All associated data will be permanently removed.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingAvatar(null)}
                  className="flex-1 px-4 py-3 bg-navy hover:bg-navy-dark text-cream rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteAvatar}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete Avatar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy-dark/95 backdrop-blur-lg flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-dark border border-gold/20 rounded-2xl p-6 max-w-2xl w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-serif text-cream">Take Photo</h2>
                </div>
                <button
                  onClick={stopCamera}
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Camera Preview */}
              <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden mb-4">
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain scale-x-[-1]"
                  />
                )}

                {/* Hidden canvas for capturing */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {capturedPhoto ? (
                  <>
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-3 bg-navy-light border border-gold/20 text-cream rounded-xl hover:bg-gold/10 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Retake
                    </button>
                    <button
                      onClick={usePhoto}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Use Photo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center shadow-lg shadow-purple-500/50"
                  >
                    <Camera className="w-8 h-8" />
                  </button>
                )}
              </div>

              {/* Tip */}
              <div className="mt-4 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <p className="text-purple-300/70 text-sm text-center">
                  {capturedPhoto
                    ? 'Review your photo and use it or retake if needed'
                    : 'Position yourself in the frame and click the camera button to capture'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        type="danger"
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 bg-red-500/90 text-white"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
