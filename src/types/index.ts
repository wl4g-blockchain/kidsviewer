// User types
export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  userType: "PARENTAL" | "PERSON";
  createdAt: Date;
  updatedAt: Date;
}

export interface Parental extends User {
  userType: "PARENTAL";
  controlPassword: string;
  persons: Person[];
}

export interface Person extends User {
  userType: "PERSON";
  parentalId: string;
  alias: string;
  ageGroup: "preschool" | "young" | "older"; // 2-4, 4-6, 6-12
  settings: PersonSettings;
  statistics: PersonStatistics;
}

// Person settings
export interface PersonSettings {
  timeLimit: number; // minutes: 10, 15, 20, 30, 40
  questionCount: number; // number of questions to unlock
  subjects: Subject[];
  allowedUrls: string[]; // parental-set video platform URLs
}

export interface Subject {
  id: string;
  name: string;
  enabled: boolean;
  difficulty: "easy" | "medium" | "hard";
}

// Question types
export interface Question {
  id: string;
  type: QuestionType;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  content: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  language: string;
}

export type QuestionType =
  | "multiple-choice"
  | "true-false"
  | "fill-blank"
  | "calculation";

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
  level: "beginner" | "intermediate" | "advanced";
}

export interface SubjectProgress {
  subject: string;
  questionsAnswered: number;
  accuracyRate: number;
  currentLevel: number;
  maxLevel: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
