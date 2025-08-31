import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@stores/authStore'
import { useTranslation } from '@i18n/I18nProvider'
import { Play, Pause, Lock, Unlock, Clock, BookOpen, Trophy } from 'lucide-react'
import { Question } from '@types'

export const ChildViewer: React.FC = () => {
  const { currentUser, apiHandler } = useAuthStore()
  const [isLocked, setIsLocked] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const t = useTranslation()

  useEffect(() => {
    if (currentUser?.userType === 'child') {
      initializeSession()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentUser])

  const initializeSession = async () => {
    if (!currentUser) return

    const child = currentUser
    const timeLimit = child.settings.timeLimit * 60 // Convert to seconds
    setRemainingTime(timeLimit)
    setSessionStartTime(new Date())

    // Start timer
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          lockSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const lockSession = async () => {
    setIsLocked(true)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Generate questions for unlock
    try {
      const enabledSubjects = currentUser.settings.subjects
        .filter(subject => subject.enabled)
        .map(subject => subject.id)
      
      const response = await apiHandler.getQuestions(
        enabledSubjects,
        'easy', // Start with easy questions
        currentUser.settings.questionCount
      )

      if (response.success && response.data) {
        setCurrentQuestions(response.data)
        setCurrentQuestionIndex(0)
      }
    } catch (error) {
      console.error('Failed to generate questions:', error)
    }
  }

  const handleAnswerSubmit = async () => {
    if (!currentQuestions[currentQuestionIndex]) return

    const question = currentQuestions[currentQuestionIndex]
    const correct = userAnswer.toString() === question.correctAnswer.toString()
    
    setIsCorrect(correct)
    setShowResult(true)

    // Submit answer to API
    try {
      await apiHandler.submitAnswer(question.id, userAnswer, correct)
    } catch (error) {
      console.error('Failed to submit answer:', error)
    }

    // Wait a moment then move to next question or unlock
    setTimeout(() => {
      if (correct) {
        if (currentQuestionIndex < currentQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1)
          setUserAnswer('')
          setShowResult(false)
        } else {
          unlockSession()
        }
      } else {
        setUserAnswer('')
        setShowResult(false)
      }
    }, 2000)
  }

  const unlockSession = () => {
    setIsLocked(false)
    setCurrentQuestions([])
    setCurrentQuestionIndex(0)
    setUserAnswer('')
    setShowResult(false)
    
    // Restart session
    initializeSession()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentQuestion = () => {
    return currentQuestions[currentQuestionIndex]
  }

  if (!currentUser || currentUser.userType !== 'child') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. This page is for children only.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('child.viewer')}
        </h1>
        <p className="text-gray-600">
          Welcome back, {currentUser.alias}! Ready to learn and have fun?
        </p>
      </div>

      {/* Time Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-medium text-gray-700">
              {t('child.timeRemaining')}
            </span>
          </div>
          <div className="text-4xl font-bold text-blue-600">
            {formatTime(remainingTime)}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {Math.ceil(remainingTime / 60)} {t('time.minutes')} remaining
          </div>
        </div>
      </div>

      {/* Video Area */}
      {!isLocked ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-gray-600">Video content will appear here</p>
              <p className="text-sm text-gray-500 mt-2">
                You can watch videos for {currentUser.settings.timeLimit} {t('time.minutes')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Locked State - Questions */
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('child.unlockToContinue')}
            </h2>
            <p className="text-gray-600">
              Answer {currentQuestions.length - currentQuestionIndex} more questions to continue watching
            </p>
          </div>

          {currentQuestions.length > 0 && (
            <div className="max-w-2xl mx-auto">
              {/* Question Progress */}
              <div className="flex items-center justify-center space-x-2 mb-6">
                {currentQuestions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index < currentQuestionIndex
                        ? 'bg-green-500'
                        : index === currentQuestionIndex
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Current Question */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {t(`questions.${getCurrentQuestion()?.subject}`)}
                  </span>
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {t(`questions.difficulty.${getCurrentQuestion()?.difficulty}`)}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                  {getCurrentQuestion()?.content}
                </h3>

                {/* Answer Input */}
                {getCurrentQuestion()?.type === 'multiple-choice' && getCurrentQuestion()?.options ? (
                  <div className="space-y-3">
                    {getCurrentQuestion()?.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setUserAnswer(option)}
                        className={`w-full p-3 text-left rounded-lg border transition-colors duration-200 ${
                          userAnswer === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={t('questions.answer')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}

                {/* Submit Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={!userAnswer}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    {t('common.submit')}
                  </button>
                </div>
              </div>

              {/* Result Display */}
              {showResult && (
                <div className={`text-center p-4 rounded-lg ${
                  isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className="text-lg font-medium mb-2">
                    {isCorrect ? t('questions.correct') : t('questions.incorrect')}
                  </div>
                  {getCurrentQuestion()?.explanation && (
                    <div className="text-sm">
                      <strong>{t('questions.explanation')}:</strong> {getCurrentQuestion()?.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
          Your Learning Progress
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentUser.statistics.questionStats.totalAnswered}
            </div>
            <div className="text-sm text-gray-600">{t('child.questionsRemaining')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentUser.statistics.questionStats.accuracyRate}%
            </div>
            <div className="text-sm text-gray-600">{t('child.accuracy')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {currentUser.statistics.learningProgress.level}
            </div>
            <div className="text-sm text-gray-600">{t('child.level')}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 