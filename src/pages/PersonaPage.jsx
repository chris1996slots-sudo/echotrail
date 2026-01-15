import { useState, useRef } from 'react';
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
  Eye
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import { LegacyScoreCard } from '../components/LegacyScore';
import { ValueStore } from '../components/ValueStore';
import { EchoVibe } from '../components/EchoVibe';

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
  { id: 'child', label: 'Kind (0-12)' },
  { id: 'teen', label: 'Teenager (13-19)' },
  { id: 'young', label: 'Jung (20-35)' },
  { id: 'middle', label: 'Mittleres Alter (36-55)' },
  { id: 'mature', label: 'Reif (56-70)' },
  { id: 'senior', label: 'Senior (70+)' },
];

// Occasion categories for avatar photos
const occasionCategories = [
  { id: 'casual', label: 'Alltag' },
  { id: 'professional', label: 'Beruflich' },
  { id: 'formal', label: 'Formal/Feierlich' },
  { id: 'vacation', label: 'Urlaub' },
  { id: 'celebration', label: 'Feier/Event' },
  { id: 'sports', label: 'Sport/Hobby' },
  { id: 'family', label: 'Familie' },
  { id: 'special', label: 'Besonderer Anlass' },
];

export function PersonaPage({ onNavigate }) {
  const { persona, setPersona, user, addStory, deleteStory, uploadAvatar, updateAvatar, deleteAvatar, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('stories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentStory, setCurrentStory] = useState('');
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

  const tabs = [
    { id: 'avatar', label: 'My Avatar' },
    { id: 'stories', label: 'Life Stories' },
    { id: 'interview', label: 'Deep Interview' },
    { id: 'values', label: 'Value Store' },
    { id: 'vibe', label: 'Echo Vibe' },
  ];

  // Real background images
  const backgrounds = [
    {
      id: 'beach',
      label: 'Am Strand',
      preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop'
    },
    {
      id: 'library',
      label: 'Bibliothek',
      preview: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1920&h=1080&fit=crop'
    },
    {
      id: 'nature',
      label: 'In der Natur',
      preview: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop'
    },
    {
      id: 'home',
      label: 'Gemütliches Zuhause',
      preview: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&h=300&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1920&h=1080&fit=crop'
    },
    {
      id: 'custom',
      label: 'Eigenes Bild',
      preview: null,
      fullUrl: null
    },
  ];

  // Avatar creation step flow
  const avatarSteps = [
    { id: 'photos', label: 'Fotos', icon: Camera, description: 'Lade deine Fotos hoch' },
    { id: 'background', label: 'Hintergrund', icon: ImageIcon, description: 'Wähle einen Hintergrund' },
    { id: 'style', label: 'Stil', icon: Palette, description: 'Wähle deinen Avatar-Stil' },
    { id: 'preview', label: 'Vorschau', icon: Eye, description: 'Schau dir dein Ergebnis an' },
  ];

  const [avatarStep, setAvatarStep] = useState(0);

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

  // Validate and submit the avatar upload
  const handleAvatarSubmit = async () => {
    const errors = {};
    if (!uploadForm.age) errors.age = 'Bitte wähle eine Altersgruppe';
    if (!uploadForm.occasion) errors.occasion = 'Bitte wähle einen Anlass';

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

    // Save to database with metadata
    const saved = await uploadAvatar(pendingImage, imageLabel, isFirst);

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
    setSaving(false);
  };

  const updateAvatarLabel = async (imageId, newLabel) => {
    // Debounce label updates
    await updateAvatar(imageId, { label: newLabel });
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

  const handleSaveStory = async () => {
    if (!currentStory.trim() || !selectedCategory) return;

    setSaving(true);
    const storyData = {
      category: selectedCategory,
      content: currentStory,
    };

    const saved = await addStory(storyData);

    if (saved) {
      setCurrentStory('');
      setSelectedCategory(null);
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

        // Render step content
        const renderAvatarStepContent = () => {
          switch (avatarSteps[avatarStep].id) {
            case 'photos':
              return (
                <div className="space-y-6">
                  {/* Photo Gallery */}
                  <div className="bg-navy-dark/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-cream font-medium">Deine Fotos</h4>
                      <span className="text-cream/40 text-xs">{avatarImages.length}/10 Fotos</span>
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
                            <p className="text-cream text-xs text-center truncate">{img.label || 'Kein Label'}</p>
                          </div>
                          {/* Active Badge */}
                          {(img.isActive || persona.activeAvatarId === img.id) && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-gold rounded-full">
                              <span className="text-navy text-xs font-medium">Aktiv</span>
                            </div>
                          )}
                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newLabel = prompt('Neuer Name:', img.label || '');
                                if (newLabel !== null) updateAvatarLabel(img.id, newLabel);
                              }}
                              className="w-7 h-7 bg-navy/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-gold/80 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cream" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Foto wirklich löschen?')) deleteAvatarImage(img.id);
                              }}
                              className="w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        </motion.div>
                      ))}

                      {/* Add New Photo Button */}
                      {avatarImages.length < 10 && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-gold/30 hover:border-gold/50 bg-navy-light/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-navy-light/50">
                          <Plus className="w-10 h-10 text-gold/50 mb-2" />
                          <span className="text-cream/50 text-sm">Foto hinzufügen</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            ref={fileInputRef}
                          />
                        </label>
                      )}
                    </div>

                    {/* Info about required tags */}
                    <div className="mt-4 pt-4 border-t border-gold/10">
                      <div className="flex items-center gap-2 text-cream/50 text-sm">
                        <Tag className="w-4 h-4" />
                        <span>Beim Hochladen werden Altersgruppe und Anlass abgefragt</span>
                      </div>
                    </div>
                  </div>

                  {!hasImages && (
                    <div className="text-center p-6 bg-gold/10 rounded-xl border border-gold/20">
                      <Camera className="w-12 h-12 text-gold/60 mx-auto mb-3" />
                      <p className="text-cream/70">Lade mindestens ein Foto hoch, um fortzufahren</p>
                    </div>
                  )}
                </div>
              );

            case 'background':
              return (
                <div className="space-y-6">
                  <p className="text-cream/60 text-sm text-center">
                    Wähle einen Hintergrund für dein sprechendes Avatar-Video
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {backgrounds.map((bg) => (
                      <motion.button
                        key={bg.id}
                        onClick={() => bg.id === 'custom' ? null : selectBackground(bg.id)}
                        className={`relative h-40 rounded-xl overflow-hidden border-2 transition-all ${
                          persona.backgroundType === bg.id
                            ? 'border-gold ring-2 ring-gold/30'
                            : 'border-gold/20 hover:border-gold/40'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {bg.id === 'custom' ? (
                          <label className="w-full h-full flex flex-col items-center justify-center bg-navy-light cursor-pointer">
                            {persona.backgroundImage && persona.backgroundType === 'custom' ? (
                              <img
                                src={persona.backgroundImage}
                                alt="Custom background"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <>
                                <Upload className="w-10 h-10 text-gold/50 mb-2" />
                                <span className="text-cream/60 text-sm">Eigenes Bild</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBackgroundUpload}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <img
                            src={bg.preview}
                            alt={bg.label}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <span className="text-cream font-medium">{bg.label}</span>
                        </div>
                        {persona.backgroundType === bg.id && (
                          <div className="absolute top-3 right-3 w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-navy" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              );

            case 'style':
              return (
                <div className="space-y-6">
                  <p className="text-cream/60 text-sm text-center">
                    Wähle den Stil für deinen sprechenden Avatar
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {avatarStyles.map((style) => (
                      <motion.button
                        key={style.id}
                        onClick={() => selectAvatarStyle(style.id)}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                          persona.avatarStyle === style.id
                            ? 'border-gold bg-gold/10'
                            : 'border-gold/20 hover:border-gold/40 bg-navy-light/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-4xl mb-3 block">{style.icon}</span>
                        <h4 className="text-cream font-medium">{style.label}</h4>
                        <p className="text-cream/50 text-sm mt-1">{style.description}</p>
                        {persona.avatarStyle === style.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-navy" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              );

            case 'preview':
              return (
                <div className="space-y-6">
                  {/* Main Preview */}
                  <div
                    className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-gold/30 shadow-xl"
                    style={{
                      backgroundImage: persona.backgroundType === 'custom' && persona.backgroundImage
                        ? `url(${persona.backgroundImage})`
                        : selectedBackground.preview
                        ? `url(${selectedBackground.preview})`
                        : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Overlay for better visibility */}
                    <div className="absolute inset-0 bg-black/20" />

                    {/* Avatar in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gold/60 shadow-2xl">
                          {persona.avatarImage ? (
                            <img
                              src={persona.avatarImage}
                              alt="Avatar preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-navy-dark flex items-center justify-center">
                              <UserIcon className="w-16 h-16 text-gold/30" />
                            </div>
                          )}
                        </div>
                        {/* Active Photo Label */}
                        {persona.activeAvatarId && avatarImages.find(img => img.id === persona.activeAvatarId)?.label && (
                          <span className="mt-3 px-4 py-1.5 bg-navy/80 backdrop-blur text-cream rounded-full text-sm">
                            {avatarImages.find(img => img.id === persona.activeAvatarId)?.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Style Badge */}
                    <div className="absolute top-4 right-4 px-4 py-2 bg-navy/80 backdrop-blur rounded-full border border-gold/30">
                      <span className="text-cream flex items-center gap-2">
                        <span className="text-xl">{selectedStyle.icon}</span>
                        <span className="font-medium">{selectedStyle.label}</span>
                      </span>
                    </div>

                    {/* Background Label */}
                    <div className="absolute bottom-4 left-4 px-4 py-2 bg-navy/80 backdrop-blur rounded-full border border-gold/30">
                      <span className="text-cream text-sm">
                        <ImageIcon className="w-4 h-4 inline mr-2" />
                        {selectedBackground.label}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-navy-dark/30 rounded-xl p-5">
                    <h4 className="text-cream font-medium mb-4">Zusammenfassung</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-navy-light/30 rounded-lg">
                        <Camera className="w-6 h-6 text-gold mx-auto mb-2" />
                        <p className="text-cream/50 text-xs">Fotos</p>
                        <p className="text-cream font-medium">{avatarImages.length}</p>
                      </div>
                      <div className="p-3 bg-navy-light/30 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-gold mx-auto mb-2" />
                        <p className="text-cream/50 text-xs">Hintergrund</p>
                        <p className="text-cream font-medium text-sm">{selectedBackground.label}</p>
                      </div>
                      <div className="p-3 bg-navy-light/30 rounded-lg">
                        <Palette className="w-6 h-6 text-gold mx-auto mb-2" />
                        <p className="text-cream/50 text-xs">Stil</p>
                        <p className="text-cream font-medium text-sm">{selectedStyle.label}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-cream/50 text-center text-sm">
                    Dein Avatar wird animiert und spricht deine Weisheiten
                  </p>
                </div>
              );

            default:
              return null;
          }
        };

        return (
          <div className="space-y-6">
            {/* Step Progress Header */}
            <div className="flex items-center justify-between mb-2">
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
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gold text-navy'
                          : isCompleted
                          ? 'bg-gold/30 text-gold'
                          : 'bg-navy-light/50 text-cream/40'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        isActive ? 'text-gold' : isCompleted ? 'text-cream/70' : 'text-cream/40'
                      }`}>
                        {step.label}
                      </span>
                    </motion.button>
                    {index < avatarSteps.length - 1 && (
                      <div className={`w-12 md:w-20 h-0.5 mx-2 ${
                        index < avatarStep ? 'bg-gold/50' : 'bg-navy-light/50'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Step Title */}
            <div className="text-center py-4 border-b border-gold/10">
              <h3 className="text-2xl font-serif text-cream">{currentStepData.description}</h3>
              <p className="text-cream/50 text-sm mt-1">Schritt {avatarStep + 1} von {avatarSteps.length}</p>
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
                  Zurück
                </motion.button>
              ) : (
                <div />
              )}

              {avatarStep < avatarSteps.length - 1 ? (
                <motion.button
                  onClick={() => setAvatarStep(prev => prev + 1)}
                  disabled={avatarStep === 0 && !hasImages}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Weiter
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => onNavigate('echo-sim')}
                  className="btn-primary flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Avatar testen
                </motion.button>
              )}
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
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedCategory === cat.id
                        ? 'border-gold bg-gold/10'
                        : storiesInCategory > 0
                        ? 'border-gold/40 bg-gold/5'
                        : 'border-gold/20 hover:border-gold/40 bg-navy-light/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 ${selectedCategory === cat.id ? 'text-gold' : storiesInCategory > 0 ? 'text-gold/70' : 'text-gold/50'}`} />
                      {storiesInCategory > 0 && (
                        <span className="text-xs text-gold bg-gold/20 px-1.5 py-0.5 rounded-full">{storiesInCategory}</span>
                      )}
                    </div>
                    <h4 className="text-cream font-medium text-xs leading-tight">{cat.label}</h4>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {selectedCategory && (
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
            </AnimatePresence>

            {persona.lifeStories?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif text-cream">Your Stories</h3>
                <StaggerContainer className="space-y-3">
                  {persona.lifeStories.map((story) => {
                    const category = storyCategories.find(c => c.id === story.category);
                    const Icon = category?.icon || BookOpen;
                    return (
                      <StaggerItem key={story.id}>
                        <motion.div
                          className="glass-card p-4 flex items-start gap-4"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-cream/80 line-clamp-2">{story.content}</p>
                            <p className="text-cream/40 text-xs mt-2">
                              {category?.label || 'Interview'} • {new Date(story.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <motion.button
                            onClick={() => handleDeleteStory(story.id)}
                            className="text-cream/30 hover:text-red-400 p-2"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
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

      case 'values':
        return <ValueStore />;

      case 'vibe':
        return <EchoVibe />;

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
                <h3 className="text-xl font-serif text-cream">Foto Details</h3>
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
                    Name / Titel <span className="text-cream/40">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Hochzeit 2015, Opa mit 30..."
                    className="input-field"
                  />
                </div>

                {/* Age Category (Required) */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Altersgruppe <span className="text-red-400">*</span>
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
                    Anlass <span className="text-red-400">*</span>
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
                  Abbrechen
                </motion.button>
                <motion.button
                  onClick={handleAvatarSubmit}
                  disabled={saving}
                  className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? (
                    <>Speichern...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Speichern
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
