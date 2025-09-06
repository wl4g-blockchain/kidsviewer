import React, { useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (person: any) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, apiHandler } = useAuthStore();
  const t = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    alias: '',
    ageGroup: 'young' as 'preschool' | 'young' | 'older',
    timeLimit: 15,
    questionCount: 3,
    subjects: [
      { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' as const },
      { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' as const },
      { id: 'english', name: 'English', enabled: true, difficulty: 'easy' as const }
    ],
    allowedUrls: ['']
  });

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
      // Filter out empty URLs and convert to new format
      const filteredUrls = formData.allowedUrls
        .filter(url => url.trim() !== '')
        .map(url => ({
          platformName: url.split('/')[2] || 'Unknown Platform',
          url: url,
          difficulty: 'easy' as const,
          maxDailyTime: 30,
          description: 'Custom platform'
        }))
      
      console.log('Creating person profile...', {
        parentalId: currentUser.id,
        personData: {
          alias: formData.alias,
          ageGroup: formData.ageGroup,
          settings: {
            sessionTimeLimit: formData.timeLimit,
            dailyTimeLimit: formData.timeLimit * 4, // 4x session limit as daily limit
            questionCount: formData.questionCount,
            questionsPerDay: formData.questionCount * 3, // 3x session questions as daily limit
            subjects: formData.subjects.filter(subject => subject.enabled),
            allowedUrls: filteredUrls
          }
        }
      })

      const response = await apiHandler.createPerson(currentUser.id, {
        alias: formData.alias,
        ageGroup: formData.ageGroup,
        settings: {
          sessionTimeLimit: formData.timeLimit,
          dailyTimeLimit: formData.timeLimit * 4,
          questionCount: formData.questionCount,
          questionsPerDay: formData.questionCount * 3,
          subjects: formData.subjects.filter(subject => subject.enabled),
          allowedUrls: filteredUrls
        }
      })

      console.log('API response:', response)

      if (response.errcode === "200" && response.data) {
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
        console.error('Failed to create person profile:', response.errmsg)
        setError(response.errmsg || t('parental.createPersonFailed'))
      }
    } catch (error) {
      console.error('Error occurred while creating person profile:', error)
      setError(error instanceof Error ? error.message : t('parental.createPersonError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject =>
        subject.id === subjectId ? { ...subject, enabled: !subject.enabled } : subject
      )
    }))
  }

  const handleUrlChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      allowedUrls: prev.allowedUrls.map((url, i) => i === index ? value : url)
    }))
  }

  const addUrlField = () => {
    setFormData(prev => ({
      ...prev,
      allowedUrls: [...prev.allowedUrls, '']
    }))
  }

  const removeUrlField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allowedUrls: prev.allowedUrls.filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t('parental.addPerson')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Person Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('parental.personName')}
            </label>
            <input
              type="text"
              value={formData.alias}
              onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('parental.personName')}
              required
            />
          </div>

          {/* Age Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('parental.ageGroup')}
            </label>
            <select
              value={formData.ageGroup}
              onChange={(e) => setFormData(prev => ({ ...prev, ageGroup: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="preschool">{t('parental.ageGroups.preschool')}</option>
              <option value="young">{t('parental.ageGroups.young')}</option>
              <option value="older">{t('parental.ageGroups.older')}</option>
            </select>
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('parental.timeLimit')} ({t('time.minutes')})
            </label>
            <select
              value={formData.timeLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10 {t('time.minutes')}</option>
              <option value={15}>15 {t('time.minutes')}</option>
              <option value={20}>20 {t('time.minutes')}</option>
              <option value={30}>30 {t('time.minutes')}</option>
              <option value={45}>45 {t('time.minutes')}</option>
            </select>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('parental.questionCount')}
            </label>
            <select
              value={formData.questionCount}
              onChange={(e) => setFormData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 {t('questions.answer')}</option>
              <option value={2}>2 {t('questions.answer')}</option>
              <option value={3}>3 {t('questions.answer')}</option>
              <option value={5}>5 {t('questions.answer')}</option>
            </select>
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('parental.subjects')}
            </label>
            <div className="space-y-2">
              {formData.subjects.map((subject) => (
                <label key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={subject.enabled}
                    onChange={() => handleSubjectToggle(subject.id)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{subject.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allowed URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('parental.allowedUrls')}
            </label>
            <div className="space-y-2">
              {formData.allowedUrls.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                  {formData.allowedUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrlField(index)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addUrlField}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('parental.addUrl')}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('parental.creatingPerson') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
