/**
 * User Side Mock Data
 * Isolated static data for User UI (Authentication, Onboarding, Interests, Avatars)
 * Theme: Midnight Plum + Soft Coral
 */

export const MOCK_AVATARS = [
  { id: 'av-1', label: 'Neon Headset', emoji: '🎧', bg: 'linear-gradient(135deg, #FF3385, #8B2FC9)' },
  { id: 'av-2', label: 'Cosmic Star', emoji: '✨', bg: 'linear-gradient(135deg, #8B2FC9, #D896FF)' },
  { id: 'av-3', label: 'Audio Wave', emoji: '🎙️', bg: 'linear-gradient(135deg, #FF4081, #FFA3CC)' },
  { id: 'av-4', label: 'Night Owl', emoji: '🦉', bg: 'linear-gradient(135deg, #260A42, #FF3385)' },
  { id: 'av-5', label: 'Gaming Fox', emoji: '🦊', bg: 'linear-gradient(135deg, #1C0633, #8B2FC9)' },
  { id: 'av-6', label: 'Space Cat', emoji: '🐱‍🚀', bg: 'linear-gradient(135deg, #360E5E, #FF5EAC)' },
  { id: 'av-7', label: 'Zen Panda', emoji: '🐼', bg: 'linear-gradient(135deg, #8B2FC9, #FF4081)' },
  { id: 'av-8', label: 'Cyber Pulse', emoji: '⚡', bg: 'linear-gradient(135deg, #FF3385, #00F5D4)' }
];

export const MOCK_INTEREST_CATEGORIES = [
  {
    id: 'cat-gaming',
    name: 'Gaming & Esports',
    icon: '🎮',
    tags: [
      { id: 'tag-valorant', name: 'Valorant', count: '14.2k' },
      { id: 'tag-minecraft', name: 'Minecraft', count: '28.1k' },
      { id: 'tag-gtav', name: 'GTA V', count: '19.5k' },
      { id: 'tag-apex', name: 'Apex Legends', count: '11.8k' },
      { id: 'tag-roblox', name: 'Roblox', count: '22.4k' },
      { id: 'tag-amongus', name: 'Among Us', count: '8.3k' },
      { id: 'tag-league', name: 'League of Legends', count: '16.9k' },
      { id: 'tag-rpg', name: 'RPG & Story Games', count: '13.1k' }
    ]
  },
  {
    id: 'cat-music',
    name: 'Music & Audio Vibes',
    icon: '🎵',
    tags: [
      { id: 'tag-lofi', name: 'Lo-Fi Chill Beats', count: '31.5k' },
      { id: 'tag-hiphop', name: 'Hip-Hop & Rap', count: '24.7k' },
      { id: 'tag-indie', name: 'Indie & Alternative', count: '18.3k' },
      { id: 'tag-edm', name: 'EDM & DJ Mixes', count: '12.6k' },
      { id: 'tag-kpop', name: 'K-Pop', count: '21.0k' },
      { id: 'tag-rock', name: 'Rock & Metal', count: '15.2k' },
      { id: 'tag-acoustic', name: 'Acoustic / Jam', count: '9.4k' },
      { id: 'tag-podcasts', name: 'Podcasting', count: '10.8k' }
    ]
  },
  {
    id: 'cat-movies',
    name: 'Anime & Cinema',
    icon: '🎬',
    tags: [
      { id: 'tag-anime', name: 'Anime & Manga', count: '35.4k' },
      { id: 'tag-ghibli', name: 'Studio Ghibli', count: '12.1k' },
      { id: 'tag-netflix', name: 'Netflix & Series', count: '26.8k' },
      { id: 'tag-marvel', name: 'Marvel & DC', count: '17.3k' },
      { id: 'tag-scifi', name: 'Sci-Fi & Cyberpunk', count: '11.9k' },
      { id: 'tag-kdrama', name: 'K-Drama', count: '19.2k' },
      { id: 'tag-horror', name: 'Horror & Mystery', count: '14.0k' }
    ]
  },
  {
    id: 'cat-tech',
    name: 'Tech, Code & AI',
    icon: '💻',
    tags: [
      { id: 'tag-coding', name: 'Web Dev & Coding', count: '19.6k' },
      { id: 'tag-ai', name: 'AI & Machine Learning', count: '27.4k' },
      { id: 'tag-uiux', name: 'UI/UX & Product Design', count: '11.2k' },
      { id: 'tag-3dart', name: '3D Art & Blender', count: '7.8k' },
      { id: 'tag-startups', name: 'Startups & Builders', count: '14.5k' },
      { id: 'tag-cybersecurity', name: 'Cybersecurity', count: '8.9k' }
    ]
  },
  {
    id: 'cat-lifestyle',
    name: 'Chill & Late Night Talks',
    icon: '☕',
    tags: [
      { id: 'tag-deeptalks', name: 'Deep Night Talks', count: '41.2k' },
      { id: 'tag-venting', name: 'Safe Venting & Advice', count: '23.0k' },
      { id: 'tag-fitness', name: 'Gym & Fitness Motivation', count: '17.7k' },
      { id: 'tag-travel', name: 'Travel & Backpacking', count: '15.3k' },
      { id: 'tag-coffee', name: 'Coffee & Books', count: '13.8k' },
      { id: 'tag-astrology', name: 'Astrology & Tarot', count: '9.6k' }
    ]
  },
  {
    id: 'cat-learning',
    name: 'Study & Languages',
    icon: '📚',
    tags: [
      { id: 'tag-study', name: 'Silent Study Together', count: '29.1k' },
      { id: 'tag-lang-en', name: 'English Speaking Practice', count: '38.4k' },
      { id: 'tag-lang-es', name: 'Spanish Practice', count: '12.3k' },
      { id: 'tag-lang-ja', name: 'Japanese Study Group', count: '16.7k' },
      { id: 'tag-philosophy', name: 'Philosophy & Debate', count: '10.5k' }
    ]
  }
];

export const MOCK_CURRENT_USER_PREVIEW = {
  id: 'usr-demo-01',
  fullName: 'Alex Morgan',
  username: 'alex_vibes',
  email: 'alex@example.com',
  avatar: '🎧',
  avatarId: 'av-1',
  avatarBg: 'linear-gradient(135deg, #FF3385, #8B2FC9)',
  bio: 'Late night lofi lover • Indie game developer • Always down for good voice chats 🎙️',
  location: 'San Francisco, CA / Online',
  preferredTime: 'Late Nights & Evenings (PST)',
  conversationStyle: 'Casual chill & deep talks',
  languages: ['English (Fluent)', 'Japanese (Learning)'],
  voiceStatus: 'available_to_talk',
  voiceStatusLabel: 'Available to Talk',
  voicePrompt: {
    title: 'What should we talk about late at night?',
    duration: '0:18',
    previewWaves: [45, 80, 95, 65, 90, 100, 75, 50, 85, 70, 90, 55],
    description: 'A quick snippet of my mic vibe, acoustic background music, and favorite chat topics.'
  },
  interests: ['Lo-Fi Chill Beats', 'Valorant', 'Deep Night Talks', 'Web Dev & Coding', 'Anime & Manga', 'Studio Ghibli'],
  interestTagIds: ['tag-lofi', 'tag-valorant', 'tag-deeptalks', 'tag-coding', 'tag-anime', 'tag-ghibli'],
  stats: {
    friendsCount: 12,
    stagesAttended: 18,
    voiceHours: '24h',
    resonanceScore: 96
  },
  completeness: 85,
  isOnboarded: true
};

export const STORAGE_KEY_USER_PROFILE = 'vcf_user_profile';

export const getUserProfile = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) {
      return { ...MOCK_CURRENT_USER_PREVIEW, ...JSON.parse(raw) };
    }
  } catch (e) {
    // fallback
  }
  return MOCK_CURRENT_USER_PREVIEW;
};

export const saveUserProfile = (updatedProfile) => {
  try {
    sessionStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(updatedProfile));
  } catch (e) {
    // ignore
  }
};

export const MOCK_DISCOVER_PEOPLE = [
  {
    id: 'usr-disc-01',
    fullName: 'Maya Chen',
    username: 'maya_beats',
    avatar: '✨',
    avatarBg: 'linear-gradient(135deg, #8B2FC9, #D896FF)',
    status: 'available_to_talk',
    statusLabel: 'Available to Talk',
    matchScore: 98,
    bio: 'Late-night Lo-Fi producer and chill conversationalist. Let’s talk soundtrack design or debate anime endings.',
    category: 'cat-music',
    interests: ['Lo-Fi Chill Beats', 'Anime & Manga', 'Deep Night Talks', 'Studio Ghibli'],
    preferredTime: 'Late Nights & Weekends (JST / PST)',
    conversationStyle: 'Warm, thoughtful & music-focused',
    languages: ['English (Fluent)', 'Japanese (Native)'],
    voicePrompt: {
      title: 'My favorite anime soundtrack...',
      duration: '0:18',
      previewWaves: [40, 75, 95, 60, 85, 100, 70, 45, 90, 65, 80, 50],
      description: 'Talking about Joe Hisaishi chords and why rainy night beats bring creative clarity.'
    },
    stats: {
      friendsCount: 24,
      stagesAttended: 32,
      voiceHours: '42h'
    },
    location: 'Tokyo / Online',
    isOnline: true
  },
  {
    id: 'usr-disc-02',
    fullName: 'Liam Thorne',
    username: 'liam_codes',
    avatar: '⚡',
    avatarBg: 'linear-gradient(135deg, #FF3385, #00F5D4)',
    status: 'available_to_talk',
    statusLabel: 'Available to Talk',
    matchScore: 95,
    bio: 'Building open-source AI audio tools and playing Valorant on weekends. Looking for tech brainstorm buddies.',
    category: 'cat-tech',
    interests: ['Web Dev & Coding', 'AI & Machine Learning', 'Valorant', 'Startups & Builders'],
    preferredTime: 'Evening European & US hours (CET)',
    conversationStyle: 'Curious, tech-focused & fast-paced',
    languages: ['English (Fluent)', 'German (Native)'],
    voicePrompt: {
      title: 'Why I love building late at night...',
      duration: '0:22',
      previewWaves: [50, 85, 60, 95, 70, 90, 100, 80, 65, 75, 85, 40],
      description: 'The magic of late-night coding flows, good coffee, and breakthrough engineering insights.'
    },
    stats: {
      friendsCount: 19,
      stagesAttended: 27,
      voiceHours: '36h'
    },
    location: 'Berlin / Online',
    isOnline: true
  },
  {
    id: 'usr-disc-03',
    fullName: 'Sarah Jenkins',
    username: 'sarah_talks',
    avatar: '🦉',
    avatarBg: 'linear-gradient(135deg, #260A42, #FF3385)',
    status: 'in_room',
    statusLabel: 'In Lo-Fi Stage',
    matchScore: 92,
    bio: 'Psychology graduate passionate about deep life talks, philosophy, and mindful coffee chats.',
    category: 'cat-lifestyle',
    interests: ['Deep Night Talks', 'Philosophy & Debate', 'Coffee & Books', 'Safe Venting & Advice'],
    preferredTime: 'Late Afternoons & Evenings (GMT)',
    conversationStyle: 'Empathetic, deep listener & philosophical',
    languages: ['English (Fluent)', 'French (Conversational)'],
    voicePrompt: {
      title: 'The best piece of advice I received...',
      duration: '0:25',
      previewWaves: [35, 60, 80, 70, 90, 85, 75, 95, 60, 70, 55, 30],
      description: 'Reflections on embracing uncertainty and finding meaningful connections through real conversation.'
    },
    stats: {
      friendsCount: 31,
      stagesAttended: 44,
      voiceHours: '58h'
    },
    location: 'London / Online',
    isOnline: true
  },
  {
    id: 'usr-disc-04',
    fullName: 'Kai Takahashi',
    username: 'kai_val',
    avatar: '🦊',
    avatarBg: 'linear-gradient(135deg, #1C0633, #8B2FC9)',
    status: 'available_to_talk',
    statusLabel: 'Available to Talk',
    matchScore: 89,
    bio: 'Immortal rank Valorant player, synthwave enthusiast, and indie game dev. Let’s queue up or hang in voice.',
    category: 'cat-gaming',
    interests: ['Valorant', 'Apex Legends', 'Lo-Fi Chill Beats', '3D Art & Blender'],
    preferredTime: 'Evenings & Late Night Ranked (EST)',
    conversationStyle: 'Energetic, gamer camaraderie & chill laughs',
    languages: ['English (Native)', 'Japanese (Conversational)'],
    voicePrompt: {
      title: 'Clutch moments and gaming focus...',
      duration: '0:15',
      previewWaves: [60, 90, 100, 85, 70, 95, 80, 60, 90, 75, 85, 50],
      description: 'Why communication in high-stakes matches is what separates good teams from great ones.'
    },
    stats: {
      friendsCount: 28,
      stagesAttended: 21,
      voiceHours: '49h'
    },
    location: 'Toronto / Online',
    isOnline: true
  },
  {
    id: 'usr-disc-05',
    fullName: 'Elena Rostova',
    username: 'elena_polyglot',
    avatar: '📚',
    avatarBg: 'linear-gradient(135deg, #FF4081, #FFA3CC)',
    status: 'online',
    statusLabel: 'Online',
    matchScore: 88,
    bio: 'Language enthusiast practicing English, Spanish & Japanese. Friendly listener who loves learning new cultures.',
    category: 'cat-learning',
    interests: ['English Speaking Practice', 'Spanish Practice', 'Japanese Study Group', 'Travel & Backpacking'],
    preferredTime: 'Mornings & Weekends (CET)',
    conversationStyle: 'Patient, culturally curious & supportive',
    languages: ['English (Fluent)', 'Spanish (Fluent)', 'Russian (Native)', 'Japanese (Beginner)'],
    voicePrompt: {
      title: 'How learning 4 languages changed me...',
      duration: '0:20',
      previewWaves: [45, 70, 85, 90, 75, 80, 65, 85, 90, 70, 60, 40],
      description: 'Every language is a different personality. Here is why speaking with real people beats books.'
    },
    stats: {
      friendsCount: 22,
      stagesAttended: 19,
      voiceHours: '33h'
    },
    location: 'Madrid / Online',
    isOnline: true
  },
  {
    id: 'usr-disc-06',
    fullName: 'Dante Rivera',
    username: 'dante_cinema',
    avatar: '🎬',
    avatarBg: 'linear-gradient(135deg, #360E5E, #FF5EAC)',
    status: 'available_to_talk',
    statusLabel: 'Available to Talk',
    matchScore: 86,
    bio: 'Cinematographer and sci-fi nerd. Always ready to discuss Blade Runner, A24 movies, and creative filmmaking.',
    category: 'cat-movies',
    interests: ['Sci-Fi & Cyberpunk', 'Netflix & Series', 'Studio Ghibli', 'Horror & Mystery'],
    preferredTime: 'Late Nights & Midnight Talks (CST)',
    conversationStyle: 'Analytical, visual storytelling & cinematic banter',
    languages: ['English (Native)', 'Spanish (Conversational)'],
    voicePrompt: {
      title: 'My top 3 cinema moments of all time...',
      duration: '0:24',
      previewWaves: [55, 80, 95, 70, 85, 90, 100, 75, 60, 85, 70, 45],
      description: 'Dissecting visual framing, atmospheric lighting, and sound design in modern science fiction.'
    },
    stats: {
      friendsCount: 16,
      stagesAttended: 25,
      voiceHours: '31h'
    },
    location: 'Austin / Online',
    isOnline: true
  },
  {
    id: 'usr-disc-07',
    fullName: 'Zoe Martinez',
    username: 'zoe_vibe',
    avatar: '🐼',
    avatarBg: 'linear-gradient(135deg, #8B2FC9, #FF4081)',
    status: 'available_to_talk',
    statusLabel: 'Available to Talk',
    matchScore: 84,
    bio: 'Acoustic guitar player, cozy study sessions, and late-night talks about the universe. Good vibes only.',
    category: 'cat-music',
    interests: ['Acoustic / Jam', 'Lo-Fi Chill Beats', 'Silent Study Together', 'Coffee & Books'],
    preferredTime: 'Afternoons & Late Evenings (PST)',
    conversationStyle: 'Calm, musical & wholesome',
    languages: ['English (Native)'],
    voicePrompt: {
      title: 'Acoustic jam snippet...',
      duration: '0:16',
      previewWaves: [40, 65, 80, 90, 70, 85, 95, 75, 60, 80, 65, 35],
      description: 'Strumming some mellow chords on my acoustic while the sun sets over the bay.'
    },
    stats: {
      friendsCount: 20,
      stagesAttended: 15,
      voiceHours: '28h'
    },
    location: 'San Francisco / Online',
    isOnline: true
  },
  {
    id: 'usr-disc-08',
    fullName: 'Arjun Mehta',
    username: 'arjun_builds',
    avatar: '🐱‍🚀',
    avatarBg: 'linear-gradient(135deg, #FF3385, #8B2FC9)',
    status: 'online',
    statusLabel: 'Online',
    matchScore: 82,
    bio: 'Product designer & indie founder. Love talking about design systems, UI micro-interactions, and new ideas.',
    category: 'cat-tech',
    interests: ['UI/UX & Product Design', 'Startups & Builders', '3D Art & Blender', 'Deep Night Talks'],
    preferredTime: 'Evenings & Weekends (IST / GMT)',
    conversationStyle: 'Design-centric, visionary & constructive',
    languages: ['English (Fluent)', 'Hindi (Native)'],
    voicePrompt: {
      title: 'Why simplicity in product design matters...',
      duration: '0:19',
      previewWaves: [50, 75, 85, 65, 90, 80, 95, 70, 85, 60, 75, 40],
      description: 'Why tactile micro-interactions and audio feedback create deeper emotional bonds in apps.'
    },
    stats: {
      friendsCount: 25,
      stagesAttended: 38,
      voiceHours: '46h'
    },
    location: 'Bengaluru / Online',
    isOnline: true
  }
];

export const MOCK_LIVE_VOICE_SPACES = [
  {
    id: 'space-01',
    title: 'Late Night Lo-Fi & Deep Talks ☕',
    description: 'Chill open stage discussing favorite tracks, life reflections, and night creativity.',
    topic: 'Chill & Late Night Talks',
    category: 'cat-lifestyle',
    tag: '#LoFiBeats',
    host: {
      id: 'usr-disc-01',
      name: 'Maya Chen',
      fullName: 'Maya Chen',
      username: 'maya_chords',
      avatar: '✨',
      avatarBg: 'linear-gradient(135deg, #8B2FC9, #D896FF)'
    },
    speakers: [
      { name: 'Maya', avatar: '✨', isSpeaking: true },
      { name: 'Sarah', avatar: '🦉', isSpeaking: false },
      { name: 'Alex', avatar: '🎧', isSpeaking: false }
    ],
    listenersCount: 14,
    participantCount: 14,
    maxSeats: 20,
    capacity: 20,
    isLive: true,
    status: 'active',
    access: 'Public • Anyone Access',
    accessType: 'anyone'
  },
  {
    id: 'space-02',
    title: 'Valorant Ranked & Game Night Hangout 🎮',
    description: 'Looking for 2 more friendly teammates for ranked games. Microphone required!',
    topic: 'Gaming & Esports',
    category: 'cat-gaming',
    tag: '#Valorant',
    host: {
      id: 'usr-disc-04',
      name: 'Kai Takahashi',
      fullName: 'Kai Takahashi',
      username: 'kai_val',
      avatar: '🦊',
      avatarBg: 'linear-gradient(135deg, #1C0633, #8B2FC9)'
    },
    speakers: [
      { name: 'Kai', avatar: '🦊', isSpeaking: true },
      { name: 'Liam', avatar: '⚡', isSpeaking: true },
      { name: 'Zoe', avatar: '🐼', isSpeaking: false }
    ],
    listenersCount: 9,
    participantCount: 9,
    maxSeats: 15,
    capacity: 15,
    isLive: true,
    status: 'active',
    access: 'Public • Open Stage',
    accessType: 'anyone'
  },
  {
    id: 'space-03',
    title: 'Designers & Indie Builders Audio Lab 💻',
    description: 'Sharing feedback on new project UI, design tokens, and voice-first interaction patterns.',
    topic: 'Tech, Code & AI',
    category: 'cat-tech',
    tag: '#UIUX',
    host: {
      id: 'usr-disc-08',
      name: 'Arjun Mehta',
      fullName: 'Arjun Mehta',
      username: 'arjun_designs',
      avatar: '🐱‍🚀',
      avatarBg: 'linear-gradient(135deg, #FF3385, #8B2FC9)'
    },
    speakers: [
      { name: 'Arjun', avatar: '🐱‍🚀', isSpeaking: true },
      { name: 'Liam', avatar: '⚡', isSpeaking: false }
    ],
    listenersCount: 11,
    participantCount: 11,
    maxSeats: 18,
    capacity: 18,
    isLive: true,
    status: 'active',
    access: 'Public • Anyone Access',
    accessType: 'anyone'
  },
  {
    id: 'space-04',
    title: 'Psychology & Modern Philosophy Book Club 📚',
    description: 'Private deep-dive discussion on cognitive biases and stoicism. Selected cohort members only.',
    topic: 'Chill & Late Night Talks',
    category: 'cat-lifestyle',
    tag: '#DeepTalks',
    host: {
      id: 'usr-disc-03',
      name: 'Sarah Jenkins',
      fullName: 'Sarah Jenkins',
      username: 'sarah_talks',
      avatar: '🦉',
      avatarBg: 'linear-gradient(135deg, #260A42, #FF3385)'
    },
    speakers: [
      { name: 'Sarah', avatar: '🦉', isSpeaking: true },
      { name: 'Alex', avatar: '🎧', isSpeaking: false }
    ],
    listenersCount: 4,
    participantCount: 4,
    maxSeats: 10,
    capacity: 10,
    isLive: true,
    status: 'active',
    access: 'Invite Only',
    accessType: 'invite_only'
  },
  {
    id: 'space-05',
    title: 'French & Japanese Language Practice Lounge 🗣️',
    description: 'Selected language exchange partners practicing conversational fluency and pronunciation.',
    topic: 'Study & Languages',
    category: 'cat-learning',
    tag: '#LangExchange',
    host: {
      id: 'usr-disc-07',
      name: 'Zoe Martinez',
      fullName: 'Zoe Martinez',
      username: 'zoe_ambient',
      avatar: '🐼',
      avatarBg: 'linear-gradient(135deg, #8B2FC9, #FF4081)'
    },
    speakers: [
      { name: 'Zoe', avatar: '🐼', isSpeaking: false }
    ],
    listenersCount: 0,
    participantCount: 0,
    maxSeats: 15,
    capacity: 15,
    isLive: false,
    status: 'scheduled',
    scheduledFor: 'Today, 9:00 PM',
    access: 'Invite Only',
    accessType: 'invite_only'
  },
  {
    id: 'space-06',
    title: 'Weekend Casual Chit-Chat & Tech Trends ☕',
    description: 'Open microphone community hangout to chat about AI, web tools, design, and weekend plans.',
    topic: 'Tech, Code & AI',
    category: 'cat-tech',
    tag: '#TechTrends',
    host: {
      id: 'usr-disc-02',
      name: 'Liam Thorne',
      fullName: 'Liam Thorne',
      username: 'liam_codes',
      avatar: '⚡',
      avatarBg: 'linear-gradient(135deg, #FF3385, #00F5D4)'
    },
    speakers: [
      { name: 'Liam', avatar: '⚡', isSpeaking: false }
    ],
    listenersCount: 0,
    participantCount: 0,
    maxSeats: 50,
    capacity: 50,
    isLive: false,
    status: 'scheduled',
    scheduledFor: 'Tomorrow, 7:00 PM',
    access: 'Public • Anyone Access',
    accessType: 'anyone'
  },
  {
    id: 'space-invite-lofi',
    title: 'Late Night Lo-Fi Talks ☕',
    description: 'Cozy private acoustic audio hangout to listen to soft beats, share night thoughts, and chat with friends.',
    topic: 'Chill & Late Night Talks',
    category: 'cat-lifestyle',
    tag: '#LoFiTalks',
    host: {
      id: 'usr-disc-07',
      name: 'Zoe Martinez',
      fullName: 'Zoe Martinez',
      username: 'zoe_ambient',
      avatar: '🐼',
      avatarBg: 'linear-gradient(135deg, #8B2FC9, #FF4081)'
    },
    speakers: [
      { name: 'Zoe', avatar: '🐼', isSpeaking: true },
      { name: 'Maya', avatar: '✨', isSpeaking: false }
    ],
    listenersCount: 3,
    participantCount: 5,
    maxSeats: 12,
    capacity: 12,
    isLive: true,
    status: 'active',
    access: 'Invite Only',
    accessType: 'invite_only',
    invitedUsers: [
      { id: 'usr-demo-01', username: 'alex_vibes', fullName: 'Alex Morgan' }
    ]
  },
  {
    id: 'space-locked-demo',
    title: 'Private Founder & Creator Circle 🔒',
    description: 'Exclusive private mastermind session for designated creators only.',
    topic: 'Tech, Code & AI',
    category: 'cat-tech',
    tag: '#PrivateCircle',
    host: {
      id: 'usr-disc-02',
      name: 'Liam Thorne',
      fullName: 'Liam Thorne',
      username: 'liam_codes',
      avatar: '⚡',
      avatarBg: 'linear-gradient(135deg, #FF3385, #00F5D4)'
    },
    speakers: [
      { name: 'Liam', avatar: '⚡', isSpeaking: true }
    ],
    listenersCount: 2,
    participantCount: 3,
    maxSeats: 8,
    capacity: 8,
    isLive: true,
    status: 'active',
    access: 'Invite Only',
    accessType: 'invite_only',
    invitedUsers: [] // Current user (Alex Morgan / usr-demo-01) is NOT invited
  },
  {
    id: 'space-ended-demo',
    title: 'Morning Acoustic Jam & Coffee Wrap-Up ☕',
    description: 'This morning live audio room has successfully concluded.',
    topic: 'Music & Audio Vibes',
    category: 'cat-music',
    tag: '#CoffeeJam',
    host: {
      id: 'usr-disc-01',
      name: 'Maya Chen',
      fullName: 'Maya Chen',
      username: 'maya_chords',
      avatar: '✨',
      avatarBg: 'linear-gradient(135deg, #8B2FC9, #D896FF)'
    },
    speakers: [],
    listenersCount: 0,
    participantCount: 0,
    maxSeats: 25,
    capacity: 25,
    isLive: false,
    status: 'ended',
    access: 'Public • Open Stage',
    accessType: 'anyone'
  },
  {
    id: 'space-closed-demo',
    title: 'Archived Community Town Hall',
    description: 'This room has been closed by moderators or organizers.',
    topic: 'Chill & Late Night Talks',
    category: 'cat-lifestyle',
    tag: '#TownHall',
    host: {
      id: 'usr-disc-03',
      name: 'Sarah Jenkins',
      fullName: 'Sarah Jenkins',
      username: 'sarah_talks',
      avatar: '🦉',
      avatarBg: 'linear-gradient(135deg, #260A42, #FF3385)'
    },
    speakers: [],
    listenersCount: 0,
    participantCount: 0,
    maxSeats: 30,
    capacity: 30,
    isLive: false,
    status: 'closed',
    access: 'Public • Open Stage',
    accessType: 'anyone'
  }
];

// Session Storage Group Voice Helpers (Frontend-only demo session persistence)
const SESSION_ROOMS_KEY = 'vcf_session_group_voice_rooms';

export function getSessionRooms() {
  try {
    const raw = sessionStorage.getItem(SESSION_ROOMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.some(r => r.id === 'space-invite-lofi')) {
          const lofiRoom = MOCK_LIVE_VOICE_SPACES.find(r => r.id === 'space-invite-lofi');
          if (lofiRoom) {
            parsed.unshift(lofiRoom);
            sessionStorage.setItem(SESSION_ROOMS_KEY, JSON.stringify(parsed));
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    // fallback to static
  }
  return MOCK_LIVE_VOICE_SPACES;
}

export function saveSessionRoom(newRoom) {
  try {
    const current = getSessionRooms();
    const updated = [newRoom, ...current.filter(r => r.id !== newRoom.id)];
    sessionStorage.setItem(SESSION_ROOMS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [newRoom, ...MOCK_LIVE_VOICE_SPACES];
  }
}

export function updateSessionRoomStatus(roomId, newStatus) {
  try {
    const current = getSessionRooms();
    const updated = current.map(r => r.id === roomId ? { ...r, status: newStatus } : r);
    sessionStorage.setItem(SESSION_ROOMS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return MOCK_LIVE_VOICE_SPACES;
  }
}

export const MOCK_DISCOVER_TOPIC_HUBS = [
  { id: 'cat-lifestyle', name: 'Late Night Talks', icon: '☕', talkersCount: '41.2k', activeStages: 8, badge: 'Popular' },
  { id: 'cat-music', name: 'Lo-Fi & Music Vibes', icon: '🎵', talkersCount: '31.5k', activeStages: 6, badge: 'Trending' },
  { id: 'cat-gaming', name: 'Gaming & Esports', icon: '🎮', talkersCount: '28.1k', activeStages: 9, badge: 'Active' },
  { id: 'cat-movies', name: 'Anime & Cinema', icon: '🎬', talkersCount: '35.4k', activeStages: 5, badge: 'New' },
  { id: 'cat-tech', name: 'Tech, Code & AI', icon: '💻', talkersCount: '27.4k', activeStages: 7, badge: 'Hot' },
  { id: 'cat-learning', name: 'Languages & Study', icon: '📚', talkersCount: '38.4k', activeStages: 4, badge: 'Cozy' }
];

// Mock Friend Requests (User-Side)
export const MOCK_INCOMING_REQUESTS = [
  {
    id: 'req-inc-01',
    user: MOCK_DISCOVER_PEOPLE[0], // Maya Chen
    createdAt: '25m ago',
    personalNote: 'Hey Alex! Loved your voice intro about late night talks. We both enjoy Lo-Fi beats and anime, would love to hang in voice!'
  },
  {
    id: 'req-inc-02',
    user: MOCK_DISCOVER_PEOPLE[2], // Sarah Jenkins
    createdAt: '2h ago',
    personalNote: 'Saw we both love deep talks and late night philosophy. Let’s connect!'
  },
  {
    id: 'req-inc-03',
    user: MOCK_DISCOVER_PEOPLE[3], // Kai Takahashi
    createdAt: 'Yesterday',
    personalNote: 'Down to queue Valorant or just chill in an audio lounge sometime.'
  }
];

export const MOCK_INITIAL_SENT_REQUESTS = [
  {
    id: 'req-sent-01',
    user: MOCK_DISCOVER_PEOPLE[1], // Liam Thorne
    createdAt: '4h ago',
    status: 'pending'
  }
];

// Initial Connected Friends (User-Side)
export const MOCK_INITIAL_FRIENDS = [
  MOCK_DISCOVER_PEOPLE[6], // Zoe Martinez (usr-disc-07) - Available to talk
  MOCK_DISCOVER_PEOPLE[7]  // Arjun Mehta (usr-disc-08) - Online
];

// Deterministic Call History & Voice Activity (User-Side)
export const MOCK_CALL_HISTORY = [
  {
    id: 'call-hist-01',
    userId: 'usr-disc-07', // Zoe Martinez
    user: MOCK_DISCOVER_PEOPLE[6],
    type: 'outgoing',
    status: 'completed',
    duration: 522, // 8m 42s
    formattedDuration: '08:42',
    timestamp: '12 min ago',
    exactDate: 'Today, 1:48 PM',
    roomType: 'Direct 1-to-1 Audio Lounge',
    quality: 'HD Voice • 48kHz Stereo'
  },
  {
    id: 'call-hist-02',
    userId: 'usr-disc-08', // Arjun Mehta
    user: MOCK_DISCOVER_PEOPLE[7],
    type: 'incoming',
    status: 'completed',
    duration: 860, // 14m 20s
    formattedDuration: '14:20',
    timestamp: 'Today, 11:40 AM',
    exactDate: 'Today, 11:40 AM',
    roomType: 'Direct 1-to-1 Audio Lounge',
    quality: 'HD Voice • 48kHz Stereo'
  },
  {
    id: 'call-hist-03',
    userId: 'usr-disc-01', // Maya Chen
    user: MOCK_DISCOVER_PEOPLE[0],
    type: 'incoming',
    status: 'missed',
    duration: 0,
    formattedDuration: 'No connection',
    timestamp: 'Today, 09:15 AM',
    exactDate: 'Today, 9:15 AM',
    roomType: 'Direct 1-to-1 Audio Lounge',
    quality: 'Unanswered'
  },
  {
    id: 'call-hist-04',
    userId: 'usr-disc-02', // Liam Thorne
    user: MOCK_DISCOVER_PEOPLE[1],
    type: 'outgoing',
    status: 'declined',
    duration: 0,
    formattedDuration: 'No connection',
    timestamp: 'Yesterday, 6:30 PM',
    exactDate: 'Yesterday, 6:30 PM',
    roomType: 'Direct 1-to-1 Audio Lounge',
    quality: 'Declined by recipient'
  },
  {
    id: 'call-hist-05',
    userId: 'usr-disc-03', // Sarah Jenkins
    user: MOCK_DISCOVER_PEOPLE[2],
    type: 'incoming',
    status: 'completed',
    duration: 154, // 2m 34s
    formattedDuration: '02:34',
    timestamp: 'Yesterday, 3:12 PM',
    exactDate: 'Yesterday, 3:12 PM',
    roomType: 'Direct 1-to-1 Audio Lounge',
    quality: 'HD Voice • 48kHz Stereo'
  },
  {
    id: 'call-hist-06',
    userId: 'usr-disc-04', // Kai Takahashi
    user: MOCK_DISCOVER_PEOPLE[3],
    type: 'outgoing',
    status: 'completed',
    duration: 1380, // 23m 00s
    formattedDuration: '23:00',
    timestamp: 'Sep 30, 9:45 PM',
    exactDate: 'Sep 30, 2026, 9:45 PM',
    roomType: 'Direct 1-to-1 Audio Lounge',
    quality: 'HD Voice • 48kHz Stereo'
  }
];



