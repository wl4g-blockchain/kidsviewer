// User types
export interface User {
  id: string
  email: string
  phone?: string
  name: string
  userType: 'parent' | 'child'
  createdAt: Date
  updatedAt: Date
}

export interface Parent extends User {
  userType: 'parent'
  controlPassword: string
  children: Child[]
}

export interface Child extends User {
  userType: 'child'
  parentId: string
  alias: string
  ageGroup: 'preschool' | 'young' | 'older' // 2-4, 4-6, 6-12
  settings: ChildSettings
  statistics: ChildStatistics
}

// Child settings
export interface ChildSettings {
  timeLimit: number // minutes: 10, 15, 20, 30, 40
  questionCount: number // number of questions to unlock
  subjects: Subject[]
  allowedUrls: string[] // parent-set video platform URLs
}

export interface Subject {
  id: string
  name: string
  enabled: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

// Question types
export interface Question {
  id: string
  type: QuestionType
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  content: string
  options?: string[]
  correctAnswer: string | number
  explanation?: string
  language: string
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'calculation'

// Child statistics
export interface ChildStatistics {
  dailyUsage: DailyUsage[]
  questionStats: QuestionStats
  learningProgress: LearningProgress
}

export interface DailyUsage {
  date: string
  totalTime: number // minutes
  sessions: Session[]
}

export interface Session {
  id: string
  startTime: Date
  endTime: Date
  duration: number // minutes
  questionsAnswered: number
  questionsCorrect: number
}

export interface QuestionStats {
  totalAnswered: number
  totalCorrect: number
  accuracyRate: number
  subjectPreference: Record<string, number>
  repeatedQuestions: RepeatedQuestion[]
}

export interface RepeatedQuestion {
  questionId: string
  attempts: number
  correctAttempts: number
  lastAttempted: Date
  forgettingCurve: number // 0-1, higher means better retention
}

export interface LearningProgress {
  subjects: Record<string, SubjectProgress>
  overallScore: number
  level: 'beginner' | 'intermediate' | 'advanced'
}

export interface SubjectProgress {
  subject: string
  questionsAnswered: number
  accuracyRate: number
  currentLevel: number
  maxLevel: number
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// App state types
export interface AppState {
  currentUser: User | null
  currentChild: Child | null
  isLocked: boolean
  remainingTime: number
  currentQuestions: Question[]
  sessionStartTime: Date | null
} 