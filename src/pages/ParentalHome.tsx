import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Plus, Settings, BarChart3, Users, Clock, BookOpen, Shield, X, Calendar, TrendingUp, Trophy, Trash2 } from 'lucide-react';
import { Person } from '../types';
import { AddPersonModal } from '../components/AddPersonModal';

export const ParentalHome: React.FC = () => {
  const { currentUser, apiHandler, switchToPerson } = useAuthStore();
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [watchingHistory, setWatchingHistory] = useState<
    {
      date: string;
      platform: string;
      watchedMinutes: number;
      questionsAnswered: number;
      questionsCorrect: number;
    }[]
  >([]);
  const t = useTranslation();

  useEffect(() => {
    if (currentUser?.userType === 'PARENTAL') {
      loadPersons();
    }
  }, [currentUser]);

  const loadPersons = async () => {
    try {
      const response = await apiHandler.getPersons(currentUser!.id.toString());
      if (response.errcode === '200' && response.data) {
        setPersons(response.data);
      }
    } catch (error) {
      console.error('Failed to load persons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalUsage = () => {
    return persons.reduce((total, person) => {
      const today = person.statistics.dailyUsage.find(usage => usage.date === new Date().toISOString().split('T')[0]);
      return total + (today?.totalTime || 0);
    }, 0);
  };

  const getTotalQuestions = () => {
    return persons.reduce((total, person) => {
      return total + person.statistics.questionStats.totalAnswered;
    }, 0);
  };

  const getAverageAccuracy = () => {
    if (persons.length === 0) return 0;
    const totalAccuracy = persons.reduce((total, person) => {
      return total + person.statistics.questionStats.accuracyRate;
    }, 0);
    return Math.round(totalAccuracy / persons.length);
  };

  const handleAddPersonSuccess = (newPerson: Person) => {
    setPersons(prev => [...prev, newPerson]);
  };

  // Switch to person protection view handler
  const handleSwitchToPersonView = (person: Person) => {
    switchToPerson(person);
    // Page will automatically navigate to /person-page via routing
  };

  // Handle Progress button click
  const handleShowProgress = async (person: Person) => {
    setSelectedPerson(person);
    setIsLoading(true);

    try {
      const response = await apiHandler.getWatchingHistory(person.id.toString(), 7);
      if (response.errcode === '200' && response.data) {
        setWatchingHistory(response.data);
      } else {
        setWatchingHistory([]);
      }
    } catch (error) {
      console.error('Failed to load watching history:', error);
      setWatchingHistory([]);
    } finally {
      setIsLoading(false);
      setShowProgressModal(true);
    }
  };

  // Handle Settings button click
  const handleShowSettings = (person: Person) => {
    setSelectedPerson(person);
    setShowSettingsModal(true);
  };

  // Handle settings update
  const handleUpdateSettings = async (settings: Partial<Person['settings']>) => {
    if (!selectedPerson) return;

    try {
      const response = await apiHandler.updatePersonSettings(selectedPerson.id.toString(), settings);
      if (response.errcode === '200' && response.data) {
        // Update local state
        setPersons(prev => prev.map(p => (p.id === selectedPerson.id ? response.data! : p)));
        setShowSettingsModal(false);
        setSelectedPerson(null);
      } else {
        throw new Error(response.errmsg || t('parental.updateSettingsFailed'));
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      //alert(t('parental.updateSettingsFailed'));
    }
  };

  // Handle delete person
  const handleShowDeleteModal = (person: Person) => {
    setSelectedPerson(person);
    setShowDeleteModal(true);
  };

  const handleDeletePerson = async () => {
    if (!selectedPerson) return;

    try {
      const response = await apiHandler.deletePerson(selectedPerson.id.toString());
      if (response.errcode === '200') {
        // Update local state by removing the deleted person
        setPersons(prev => prev.filter(p => p.id !== selectedPerson.id));
        setShowDeleteModal(false);
        setSelectedPerson(null);
      } else {
        throw new Error(response.errmsg || t('parental.deletePersonFailed'));
      }
    } catch (error) {
      console.error('Failed to delete person:', error);
      //alert(t('parental.deletePersonFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl mb-6 kids-pulse-element">
          <span className="text-3xl">👑</span>
        </div>
        <h1 className="text-4xl font-black text-gradient mb-3">{t('parental.dashboard')}</h1>
        <p className="text-lg text-gray-600">{t('parental.dashboardSubtitle')}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{persons.length}</div>
          <div className="text-sm text-gray-600">{t('parental.statsPersons')}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{getTotalUsage()}</div>
          <div className="text-sm text-gray-600">{t('parental.statsMinutesToday')}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{getTotalQuestions()}</div>
          <div className="text-sm text-gray-600">{t('parental.statsQuestionsAnswered')}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-full mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{getAverageAccuracy()}%</div>
          <div className="text-sm text-gray-600">{t('parental.statsAverageAccuracy')}</div>
        </div>
      </div>

      {/* Persons List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">{t('parental.yourPersons')}</h2>
            <button
              onClick={() => setShowAddPersonModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('parental.addPerson')}
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {persons.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('parental.noPersonsAdded')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('parental.addFirstPersonDesc')}</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddPersonModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('parental.addPerson')}
                </button>
              </div>
            </div>
          ) : (
            persons.map(person => (
              <div key={person.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {person.alias.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{person.alias}</h3>
                      <p className="text-sm text-gray-500">
                        {t(`parental.ageGroups.${person.ageGroup}`)} • {person.settings.perTimeLimitMinutes} {t('time.minutes')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSwitchToPersonView(person)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {t('parental.enterMinorProtectionView')}
                    </button>
                    <button
                      onClick={() => handleShowProgress(person)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {t('parental.progress')}
                    </button>
                    <button
                      onClick={() => handleShowSettings(person)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {t('parental.settings')}
                    </button>
                    <button
                      onClick={() => handleShowDeleteModal(person)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.delete')}
                    </button>
                  </div>
                </div>

                {/* Person Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{person.statistics.questionStats.totalAnswered}</div>
                    <div className="text-sm text-gray-500">{t('parental.questions')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{person.statistics.questionStats.accuracyRate}%</div>
                    <div className="text-sm text-gray-500">{t('parental.accuracy')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{t('parental.levels.' + person.statistics.learningProgress.level)}</div>
                    <div className="text-sm text-gray-500">{t('parental.level')}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('parental.dailyReports')}</h3>
          <p className="text-gray-600 mb-4">{t('parental.dailyReportsDesc')}</p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
            {t('parental.viewReports')}
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('parental.learningProgress')}</h3>
          <p className="text-gray-600 mb-4">{t('parental.learningProgressDesc')}</p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200">
            {t('parental.viewProgress')}
          </button>
        </div>
      </div>

      {/* Add Person Modal */}
      <AddPersonModal isOpen={showAddPersonModal} onClose={() => setShowAddPersonModal(false)} onSuccess={handleAddPersonSuccess} />

      {/* Progress Modal */}
      {showProgressModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                {t('parental.watchingHistoryFor', { name: selectedPerson.alias })}
              </h2>
              <button onClick={() => setShowProgressModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {watchingHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">
                        {watchingHistory.reduce((sum, h) => sum + h.watchedMinutes, 0)}
                      </div>
                      <div className="text-sm text-blue-800">{t('parental.totalWatchingTime')}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {watchingHistory.reduce((sum, h) => sum + h.questionsAnswered, 0)}
                      </div>
                      <div className="text-sm text-green-800">{t('parental.questionsAnswered')}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(
                          (watchingHistory.reduce((sum, h) => sum + h.questionsCorrect, 0) /
                            Math.max(
                              watchingHistory.reduce((sum, h) => sum + h.questionsAnswered, 0),
                              1
                            )) *
                            100
                        )}
                        %
                      </div>
                      <div className="text-sm text-purple-800">{t('parental.correctRate')}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {watchingHistory.map((record, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-900">{record.platform}</div>
                              <div className="text-sm text-gray-600">{record.date}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{record.watchedMinutes} {t('time.minutes')}</div>
                            <div className="text-sm text-gray-600">
                              {t('parental.answeredQuestions')}: {record.questionsCorrect}/{record.questionsAnswered}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">{t('parental.noWatchingHistory')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-blue-600" />
                {t('parental.editSettingsFor', { name: selectedPerson.alias })}
              </h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const settings = {
                  timeLimit: parseInt(formData.get('timeLimit') as string),
                  questionCount: parseInt(formData.get('questionCount') as string),
                };
                handleUpdateSettings(settings);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('parental.timeLimit')} ({t('time.minutes')})</label>
                <input
                  type="number"
                  name="timeLimit"
                  defaultValue={selectedPerson.settings.perTimeLimitMinutes}
                  min="5"
                  max="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('parental.questionCount')}</label>
                <input
                  type="number"
                  name="questionCount"
                  defaultValue={selectedPerson.settings.questionCount}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  {t('parental.saveSettings')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Trash2 className="w-6 h-6 mr-2 text-red-600" />
                {t('parental.deletePerson')}
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                {t('parental.deletePersonConfirmation', { name: selectedPerson.alias })}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  {t('parental.deletePersonWarning')}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeletePerson}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
