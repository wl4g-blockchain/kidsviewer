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
  ageGroup: 'preschool' | 'young' | 'older'; // 2-4, 4-6, 6-12
  settings: PersonSettings;
  statistics: PersonStatistics;
}

// Person settings
export interface PersonSettings {
  // Time limits
  sessionTimeLimit: number; // Minutes per watching session (e.g., 15, 30, 45)
  dailyTimeLimit: number; // Total minutes allowed per day (e.g., 120, 180)
  
  // Question settings
  questionCount: number; // Number of questions to unlock per session
  questionsPerDay: number; // Maximum questions per day
  
  // Subject and content settings
  subjects: Subject[];
  allowedUrls: {
    platformName: string;
    url: string;
    difficulty: 'easy' | 'medium' | 'hard';
    maxDailyTime: number; // Platform-specific daily time limit
    description?: string;
  }[];
}

export interface Subject {
  id: string;
  name: string;
  enabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Question types
export interface Question {
  id: string;
  type: QuestionType;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  language: string;
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
  dailyTimeExceeded?: boolean; // Whether daily time limit is exceeded
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
