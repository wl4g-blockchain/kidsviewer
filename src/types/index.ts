// User types
export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  userType: 'PARENTAL' | 'PERSON';
  createdAt: Date;
  updatedAt: Date;
}

export interface Parental extends User {
  userType: 'PARENTAL';
  controlPassword: string;
  persons: Person[];
}

export interface Person extends User {
  userType: 'PERSON';
  parentalId: string;
  alias: string;
  ageGroup: 'preschool' | 'young' | 'older' | 'teen'; // 2-4, 4-6, 6-12, 12-14
  settings: PersonSettings;
  statistics: PersonStatistics;
}

// Platform management
export interface Platform {
  id: string;
  nameEN: string;
  nameCN: string;
  url: string;
  description?: string;
  ageGroups: ('preschool' | 'young' | 'older' | 'teen')[]; // Suitable age groups
  createdAt: Date;
  updatedAt: Date;
}

// Base question interface - shared properties
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  subject: string;
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'; // Expanded to 5 levels
  content: string;
  options?: string[];
  correctAnswer: string | number;
  language: string;
}

// Question template - stored in database with i18n explanations
export interface QuestionTemplate extends BaseQuestion {
  explanationEN?: string; // English explanation
  explanationCN?: string; // Chinese explanation
  ageGroups: ('preschool' | 'young' | 'older' | 'teen')[]; // Suitable age groups
  tags: string[]; // Additional tags for filtering
  createdAt: Date;
  updatedAt: Date;
}

// Person settings
export interface PersonSettings {
  // Time limits
  perTimeLimitMinutes: number; // Per watching session (e.g., 15, 30, 45)
  dailyTimeLimitMinutes: number; // Total allowed per day (e.g., 120, 180)

  // Question settings
  questionCount: number; // Number of questions to unlock per session
  questionsPerDay: number; // Maximum questions per day

  // Platform and question settings
  platformIds: string[]; // IDs of allowed platforms
  subjects: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  enabled: boolean;
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
}

// Question instance - used during quiz sessions with dynamic explanation
export interface Question extends BaseQuestion {
  explanation?: string; // Dynamic explanation based on current language
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'calculation';

// Person statistics
export interface PersonStatistics {
  dailyUsage: DailyUsage[];
  questionStats: QuestionStats;
  learningProgress: LearningProgress;
}

export interface DailyUsage {
  date: string;
  totalTime: number; // minutes
  sessions: Session[];
}

export interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  questionsAnswered: number;
  questionsCorrect: number;
}

export interface QuestionStats {
  totalAnswered: number;
  totalCorrect: number;
  accuracyRate: number;
  subjectPreference: Record<string, number>;
  repeatedQuestions: RepeatedQuestion[];
}

export interface RepeatedQuestion {
  questionId: string;
  attempts: number;
  correctAttempts: number;
  lastAttempted: Date;
  forgettingCurve: number; // 0-1, higher means better retention
}

export interface LearningProgress {
  subjects: Record<string, SubjectProgress>;
  overallScore: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface SubjectProgress {
  subject: string;
  questionsAnswered: number;
  accuracyRate: number;
  currentLevel: number;
  maxLevel: number;
}

// API response types
export interface ApiResponse<T = any> {
  errcode: string; // "200" for success, "4xxx" for business errors, "5xxx" for system errors
  errmsg: string; // Error message or "ok" for success
  data?: T; // Optional data payload
}

// Watching session response types
export interface WatchingSessionResponse {
  watchingToken: string;
  sessionTimeLimit: number; // Minutes allowed for this session
  remainingDailyTime: number; // Minutes remaining today
}

export interface WatchingStatusResponse {
  remainingTime: number; // Minutes remaining in current session
  remainingDailyTime: number; // Minutes remaining today
  questions?: Question[]; // Questions if needed
  dailyTimeExceeded?: boolean; // Whether daily total time limit is exceeded
}

// App state types
export interface AppState {
  currentUser: User | null;
  currentPerson: Person | null;
  isLocked: boolean;
  remainingTime: number;
  currentQuestions: Question[];
  sessionStartTime: Date | null;
}

// App settings types
export interface AppSettings {
  language: 'en' | 'zh';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    screenReader: boolean;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
  updates: {
    autoUpdate: boolean;
    betaChannel: boolean;
  };
}

// App information types
export interface AppInfo {
  version: string;
  buildType: 'development' | 'production';
  platform: string;
  buildDate: string;
  commitHash?: string;
}
