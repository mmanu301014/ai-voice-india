export const CREATOR_MODES = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'Youtube',
    suggestedStyle: 'Storytelling',
    suggestedSpeed: 1.0,
    suggestedPitch: 0.0,
    description: 'Engaging, clear, and balanced cadence ideal for tutorials, essays, and narrations.',

  },
  {
    id: 'reels',
    name: 'Instagram / Reels',
    icon: 'Smartphone',
    tag: 'Shorts & Viral',
    suggestedStyle: 'Friendly',
    suggestedSpeed: 1.1,
    suggestedPitch: 0.05,
    description: 'Energetic, punchy, and fast-paced delivery designed to hook viewers in the first 3 seconds.',
    creatorTip: 'Tip: 1.1x speed creates snappy pacing that keeps retention high on short-form vertical feeds.'
  },
  {
    id: 'story',
    name: 'Story',
    icon: 'BookOpen',
    tag: 'Audiobooks & Tales',
    suggestedStyle: 'Storytelling',
    suggestedSpeed: 0.95,
    suggestedPitch: -0.05,
    description: 'Immersive, expressive, and warm voice acting perfect for mythological, folk, and fiction narratives.',
    creatorTip: 'Tip: 0.95x speed with slightly deeper pitch builds suspense and atmospheric depth.'
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'GraduationCap',
    tag: 'Courses & Lessons',
    suggestedStyle: 'Educational',
    suggestedSpeed: 1.0,
    suggestedPitch: 0.0,
    description: 'Articulate, calm, and instructive tone for EdTech, study guides, and online courses.',
    creatorTip: 'Tip: Clear pronunciation ensures complex scientific and technical terms are easily understood.'
  },
  {
    id: 'news',
    name: 'News',
    icon: 'Radio',
    tag: 'Broadcast & Bulletins',
    suggestedStyle: 'News',
    suggestedSpeed: 1.05,
    suggestedPitch: 0.0,
    description: 'Authoritative, direct, and crisp delivery suitable for bulletins, podcasts, and daily updates.',
    creatorTip: 'Tip: Professional intonation conveys credibility and urgency for daily briefings.'
  },
  {
    id: 'ad',
    name: 'Advertisement',
    icon: 'Megaphone',
    tag: 'Commercials & Promos',
    suggestedStyle: 'Advertisement',
    suggestedSpeed: 1.1,
    suggestedPitch: 0.05,
    description: 'Persuasive, upbeat, and memorable vocal presence for product promotions and sponsor spots.',
    creatorTip: 'Tip: Energetic voice modulation inspires customer trust and drives strong calls-to-action.'
  }
];

export const VOICE_STYLES = [
  { id: 'Natural', name: 'Natural', desc: 'Everyday conversational regional Indian delivery' },
  { id: 'Friendly', name: 'Friendly', desc: 'Warm, approachable, and welcoming tone' },
  { id: 'Storytelling', name: 'Storytelling', desc: 'Expressive modulation and dramatic pacing' },
  { id: 'Professional', name: 'Professional', desc: 'Polished, corporate, and trustworthy executive speech' },
  { id: 'News', name: 'News', desc: 'Crisp, articulate broadcast journalism delivery' },
  { id: 'Advertisement', name: 'Advertisement', desc: 'Upbeat, commercial, and persuasive sales presentation' },
  { id: 'Educational', name: 'Educational', desc: 'Clear, patient instructional pacing' },
  { id: 'Energetic', name: 'Energetic', desc: 'High enthusiasm and dynamic inflection' },
  { id: 'Calm', name: 'Calm', desc: 'Gentle, soothing, and relaxing cadence' }
];
