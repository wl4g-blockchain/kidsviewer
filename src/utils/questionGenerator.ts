import { Question } from '@types'

// Question bank for different subjects and difficulties
const questionBank = {
  math: {
    easy: [
      {
        type: 'calculation',
        content: 'What is 2 + 3?',
        correctAnswer: 5,
        explanation: '2 + 3 = 5'
      },
      {
        type: 'calculation',
        content: 'What is 5 - 2?',
        correctAnswer: 3,
        explanation: '5 - 2 = 3'
      },
      {
        type: 'calculation',
        content: 'What is 2 × 4?',
        correctAnswer: 8,
        explanation: '2 × 4 = 8'
      },
      {
        type: 'multiple-choice',
        content: 'Which number comes after 7?',
        options: ['6', '8', '9', '10'],
        correctAnswer: '8',
        explanation: 'The number after 7 is 8'
      }
    ],
    medium: [
      {
        type: 'calculation',
        content: 'What is 12 ÷ 3?',
        correctAnswer: 4,
        explanation: '12 ÷ 3 = 4'
      },
      {
        type: 'calculation',
        content: 'What is 15 - 7?',
        correctAnswer: 8,
        explanation: '15 - 7 = 8'
      }
    ],
    hard: [
      {
        type: 'calculation',
        content: 'What is 3 × 4 + 2?',
        correctAnswer: 14,
        explanation: '3 × 4 = 12, then 12 + 2 = 14'
      }
    ]
  },
  chinese: {
    easy: [
      {
        type: 'multiple-choice',
        content: 'Which character means "big"?',
        options: ['大', '小', '中', '高'],
        correctAnswer: '大',
        explanation: '大 means "big" in Chinese'
      },
      {
        type: 'multiple-choice',
        content: 'Which character means "small"?',
        options: ['大', '小', '中', '高'],
        correctAnswer: '小',
        explanation: '小 means "small" in Chinese'
      }
    ],
    medium: [
      {
        type: 'fill-blank',
        content: 'Complete the word: 学___ (learning)',
        correctAnswer: '习',
        explanation: '学习 means "learning"'
      }
    ],
    hard: [
      {
        type: 'multiple-choice',
        content: 'Which character is the traditional form of 学?',
        options: ['學', '习', '習', '学'],
        correctAnswer: '學',
        explanation: '學 is the traditional form of 学'
      }
    ]
  },
  english: {
    easy: [
      {
        type: 'multiple-choice',
        content: 'What color is the sky?',
        options: ['Red', 'Blue', 'Green', 'Yellow'],
        correctAnswer: 'Blue',
        explanation: 'The sky is usually blue'
      },
      {
        type: 'multiple-choice',
        content: 'Which animal says "meow"?',
        options: ['Dog', 'Cat', 'Bird', 'Fish'],
        correctAnswer: 'Cat',
        explanation: 'Cats say "meow"'
      }
    ],
    medium: [
      {
        type: 'true-false',
        content: 'The opposite of "hot" is "cold"',
        correctAnswer: true,
        explanation: 'Yes, hot and cold are opposites'
      }
    ],
    hard: [
      {
        type: 'fill-blank',
        content: 'Complete: "The sun ___ in the east"',
        correctAnswer: 'rises',
        explanation: 'The sun rises in the east'
      }
    ]
  }
}

// Generate questions based on subjects, difficulty, and count
export function generateQuestions(subjects: string[], difficulty: string, count: number): Question[] {
  const questions: Question[] = []
  const availableQuestions: Question[] = []

  // Collect all available questions from specified subjects and difficulty
  subjects.forEach(subject => {
    if (questionBank[subject] && questionBank[subject][difficulty]) {
      availableQuestions.push(...questionBank[subject][difficulty])
    }
  })

  // Shuffle and select questions
  const shuffled = shuffleArray([...availableQuestions])
  const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length))

  // Convert to Question interface format
  selectedQuestions.forEach((q, index) => {
    const question: Question = {
      id: `q_${Date.now()}_${index}`,
      type: q.type,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      language: 'en' // Default to English, can be made configurable
    }
    questions.push(question)
  })

  return questions
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get available subjects
export function getAvailableSubjects(): string[] {
  return Object.keys(questionBank)
}

// Get available difficulties
export function getAvailableDifficulties(): string[] {
  return ['easy', 'medium', 'hard']
}

// Validate question parameters
export function validateQuestionParams(subjects: string[], difficulty: string, count: number): boolean {
  const availableSubjects = getAvailableSubjects()
  const availableDifficulties = getAvailableDifficulties()
  
  return (
    subjects.every(subject => availableSubjects.includes(subject)) &&
    availableDifficulties.includes(difficulty) &&
    count > 0 &&
    count <= 20 // Maximum 20 questions at once
  )
} 