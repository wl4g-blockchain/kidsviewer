import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { X, Check } from 'lucide-react';
import { useSessionData } from './providers/AuthProvider';
import { Platform } from '../types';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (person: any) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { data: session } = useSessionData();
  const t = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [formData, setFormData] = useState({
    alias: '',
    ageGroup: 'young' as 'preschool' | 'young' | 'older',
    perTimeLimitMinutes: 15,
    questionCount: 3,
    selectedPlatformIds: [] as string[],
    subjects: [
      { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' },
      { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' },
      { id: 'english', name: 'English', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' },
    ] as { id: string; name: string; enabled: boolean; difficulty: 'easy' | 'medium' | 'hard' }[],
  });

  // Get current user from session
  const currentUser = session?.user;

  // Load available platforms
  useEffect(() => {
    if (isOpen) {
      loadPlatforms();
    }
  }, [isOpen]);

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      const result = await response.json();
      
      if (result.errcode === '200' && result.data) {
        setAvailablePlatforms(result.data);
      } else {
        console.error('Failed to load platforms:', result.errmsg);
        // Fallback to empty array
        setAvailablePlatforms([]);
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
      // Fallback to empty array
      setAvailablePlatforms([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || currentUser.userType !== 1) {
      setError('只有家长可以添加人员');
      return;
    }

    if (!formData.alias.trim()) {
      setError('请输入人员姓名');
      return;
    }

    if (formData.selectedPlatformIds.length === 0) {
      setError('请至少选择一个平台');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const personData = {
        userId: currentUser.id,
        parentalId: currentUser.id,
        name: formData.alias,
        alias: formData.alias,
        ageGroup: formData.ageGroup,
        settings: {
          perTimeLimitMinutes: formData.perTimeLimitMinutes,
          dailyTimeLimitMinutes: formData.perTimeLimitMinutes * 4, // 4x session limit as daily limit
          questionCount: formData.questionCount,
          questionsPerDay: formData.questionCount * 3, // 3x session questions as daily limit
          subjects: formData.subjects.filter(subject => subject.enabled).map(s => ({
            ...s,
            id: Math.floor(Math.random() * 1000000)
          })),
          platformIds: formData.selectedPlatformIds.map(id => parseInt(id)),
        },
      };

      const response = await fetch('/api/persons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personData),
      });
      const result = await response.json();
      
      if (result.errcode === '200' && result.data) {
        onSuccess(result.data);
        onClose();
        // Reset form
        setFormData({
          alias: '',
          ageGroup: 'young',
          perTimeLimitMinutes: 15,
          questionCount: 3,
          selectedPlatformIds: [],
          subjects: [
            { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' },
            { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' },
            { id: 'english', name: 'English', enabled: true, difficulty: 'easy' as 'easy' | 'medium' | 'hard' },
          ],
        });
        setError(null);
      } else {
        throw new Error(result.errmsg || '创建人员失败');
      }
    } catch (error) {
      console.error('Error occurred while creating person profile:', error);
      setError(error instanceof Error ? error.message : '创建人员失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject => (subject.id === subjectId ? { ...subject, enabled: !subject.enabled } : subject)),
    }));
  };

  const handleSubjectDifficultyChange = (subjectId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject => (subject.id === subjectId ? { ...subject, difficulty } : subject)),
    }));
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatformIds: prev.selectedPlatformIds.includes(platformId)
        ? prev.selectedPlatformIds.filter(id => id !== platformId)
        : [...prev.selectedPlatformIds, platformId],
    }));
  };

  // Filter platforms by age group
  const getFilteredPlatforms = () => {
    return availablePlatforms.filter(platform => platform.ageGroups.includes(formData.ageGroup));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t('parental.addPerson')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('parental.personName')}</label>
            <input
              type="text"
              value={formData.alias}
              onChange={e => setFormData(prev => ({ ...prev, alias: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('parental.personName')}
              required
            />
          </div>

          {/* Age Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('parental.ageGroup')}</label>
            <select
              value={formData.ageGroup}
              onChange={e => setFormData(prev => ({ ...prev, ageGroup: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="preschool">{t('parental.ageGroups.preschool')}</option>
              <option value="young">{t('parental.ageGroups.young')}</option>
              <option value="older">{t('parental.ageGroups.older')}</option>
            </select>
          </div>

          {/* Session Time Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('parental.sessionTimeLimit')} ({t('time.minutes')})
            </label>
            <select
              value={formData.perTimeLimitMinutes}
              onChange={e => setFormData(prev => ({ ...prev, perTimeLimitMinutes: parseInt(e.target.value) }))}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('parental.questionCount')}</label>
            <select
              value={formData.questionCount}
              onChange={e => setFormData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 {t('questions.answer')}</option>
              <option value={2}>2 {t('questions.answer')}</option>
              <option value={3}>3 {t('questions.answer')}</option>
              <option value={5}>5 {t('questions.answer')}</option>
            </select>
          </div>

          {/* Subjects with Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('parental.subjects')}</label>
            <div className="space-y-4">
              {formData.subjects.map(subject => (
                <div key={subject.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={subject.enabled}
                        onChange={() => handleSubjectToggle(subject.id)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                    </label>
                  </div>

                  {subject.enabled && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Difficulty Level</label>
                      <div className="flex space-x-2">
                        {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                          <button
                            key={difficulty}
                            type="button"
                            onClick={() => handleSubjectDifficultyChange(subject.id, difficulty)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              subject.difficulty === difficulty
                                ? difficulty === 'easy'
                                  ? 'bg-green-500 text-white'
                                  : difficulty === 'medium'
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Platforms for{' '}
              {formData.ageGroup === 'preschool' ? 'Preschool (2-4)' : formData.ageGroup === 'young' ? 'Young (4-6)' : 'Older (6-12)'}
            </label>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {getFilteredPlatforms().length === 0 ? (
                <p className="text-gray-500 text-sm">No platforms available for this age group</p>
              ) : (
                getFilteredPlatforms().map(platform => (
                  <div
                    key={platform.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectedPlatformIds.includes(platform.id.toString())
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handlePlatformToggle(platform.id.toString())}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                              formData.selectedPlatformIds.includes(platform.id.toString()) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}
                          >
                            {formData.selectedPlatformIds.includes(platform.id.toString()) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{platform.nameEN}</h4>
                            <p className="text-sm text-gray-600">{platform.nameCN}</p>
                          </div>
                        </div>
                        {/* Platform difficulty and time limits are now managed at Person level */}
                        {platform.description && <p className="text-xs text-gray-500 mt-1">{platform.description}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {formData.selectedPlatformIds.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">{formData.selectedPlatformIds.length} platform(s) selected</p>
            )}
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
  );
};
