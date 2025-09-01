import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from '../i18n/I18nProvider'
import { X, Plus, User, Calendar, Settings, BookOpen, AlertCircle } from 'lucide-react'
import { Person } from '../types'

interface AddPersonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (person: Person) => void
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, apiHandler } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    alias: '',
    ageGroup: 'young' as 'preschool' | 'young' | 'older',
    timeLimit: 15,
    questionCount: 3,
    subjects: [
      { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' },
      { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' },
      { id: 'english', name: 'English', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' }
    ],
    allowedUrls: ['']
  })
  const t = useTranslation()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error message
    if (error) setError(null)
  }

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject =>
        subject.id === subjectId
          ? { ...subject, enabled: !subject.enabled }
          : subject
      )
    }))
  }

  const handleSubjectDifficultyChange = (subjectId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject =>
        subject.id === subjectId
          ? { ...subject, difficulty }
          : subject
      )
    }))
  }

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.allowedUrls]
    newUrls[index] = value
    setFormData(prev => ({ ...prev, allowedUrls: newUrls }))
  }

  const addUrl = () => {
    setFormData(prev => ({ ...prev, allowedUrls: [...prev.allowedUrls, ''] }))
  }

  const removeUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allowedUrls: prev.allowedUrls.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser || currentUser.userType !== 'PARENTAL') {
      setError(t('parental.onlyParentCanAdd'))
      return
    }

    if (!formData.alias.trim()) {
      setError(t('parental.pleaseEnterPersonName'))
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Filter out empty URLs
      const filteredUrls = formData.allowedUrls.filter(url => url.trim() !== '')
      
      console.log('Creating person profile...', {
        parentalId: currentUser.id,
        personData: {
          alias: formData.alias,
          ageGroup: formData.ageGroup,
          settings: {
            timeLimit: formData.timeLimit,
            questionCount: formData.questionCount,
            subjects: formData.subjects.filter(subject => subject.enabled),
            allowedUrls: filteredUrls
          }
        }
      })

      const response = await apiHandler.createPerson(currentUser.id, {
        alias: formData.alias,
        ageGroup: formData.ageGroup,
        settings: {
          timeLimit: formData.timeLimit,
          questionCount: formData.questionCount,
          subjects: formData.subjects.filter(subject => subject.enabled),
          allowedUrls: filteredUrls
        }
      })

      console.log('API response:', response)

      if (response.success && response.data) {
        console.log('Person profile created successfully:', response.data)
        onSuccess(response.data)
        onClose()
        // Reset form
        setFormData({
          alias: '',
          ageGroup: 'young',
          timeLimit: 15,
          questionCount: 3,
          subjects: [
            { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' },
            { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' },
            { id: 'english', name: 'English', enabled: true, difficulty: 'easy' }
          ],
          allowedUrls: ['']
        })
        setError(null)
      } else {
        console.error('Failed to create person profile:', response.error)
        setError(response.error || t('parental.createPersonFailed'))
      }
    } catch (error) {
      console.error('Error occurred while creating person profile:', error)
      setError(error instanceof Error ? error.message : t('parental.createPersonError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('parental.addPerson')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            
            <div>
              <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-2">
                {t('parental.personName')}
              </label>
              <input
                type="text"
                id="alias"
                name="alias"
                required
                value={formData.alias}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter child's name or nickname"
              />
            </div>

            <div>
              <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 mb-2">
                {t('parental.ageGroup')}
              </label>
              <select
                id="ageGroup"
                name="ageGroup"
                required
                value={formData.ageGroup}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="preschool">{t('parental.ageGroups.preschool')}</option>
                <option value="young">{t('parental.ageGroups.young')}</option>
                <option value="older">{t('parental.ageGroups.older')}</option>
              </select>
            </div>
          </div>

          {/* Time Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Time Settings
            </h3>
            
            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-2">
                {t('parental.timeLimit')} ({t('time.minutes')})
              </label>
              <select
                id="timeLimit"
                name="timeLimit"
                required
                value={formData.timeLimit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 {t('time.minutes')}</option>
                <option value={15}>15 {t('time.minutes')}</option>
                <option value={20}>20 {t('time.minutes')}</option>
                <option value={30}>30 {t('time.minutes')}</option>
                <option value={40}>40 {t('time.minutes')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-2">
                {t('parental.questionCount')}
              </label>
              <select
                id="questionCount"
                name="questionCount"
                required
                value={formData.questionCount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={2}>2 questions</option>
                <option value={3}>3 questions</option>
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
              </select>
            </div>
          </div>

          {/* Learning Subjects */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
              Learning Subjects
            </h3>
            
            <div className="space-y-3">
              {formData.subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`subject-${subject.id}`}
                      checked={subject.enabled}
                      onChange={() => handleSubjectToggle(subject.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`subject-${subject.id}`} className="text-sm font-medium text-gray-700">
                      {t(`questions.${subject.id}`)}
                    </label>
                  </div>
                  
                  {subject.enabled && (
                    <select
                      value={subject.difficulty}
                      onChange={(e) => handleSubjectDifficultyChange(subject.id, e.target.value as 'easy' | 'medium' | 'hard')}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="easy">{t('questions.difficulty.easy')}</option>
                      <option value="medium">{t('questions.difficulty.medium')}</option>
                      <option value="hard">{t('questions.difficulty.hard')}</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Allowed URLs */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-orange-600" />
                              {t('parental.allowedUrls')}
            </h3>
            
            <div className="space-y-3">
              {formData.allowedUrls.map((url, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder={t('parental.urlPlaceholder')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData.allowedUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrl(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addUrl}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('parental.addUrl')}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.alias.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.savingToServer')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('parental.addPerson')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 