import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionData } from '../components/providers/AuthProvider';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Users, Plus, Trash2, ArrowLeft, Building, Edit } from 'lucide-react';

interface SubAccount {
  id: string;
  name: string;
  email: string;
  userType: number;
  createDate: string;
}

interface TenantInfo {
  id: string;
  name: string;
  familyName?: string;
  createDate: string;
}

export const SubAccountManagement: React.FC = () => {
  const { data: session } = useSessionData();
  const { isDark } = useThemeStore();
  const t = useTranslation();
  const navigate = useNavigate();

  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SubAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if current user is main account (userType = 1)
  const isMainAccount = Number(session?.user?.userType) === 1;

  useEffect(() => {
    fetchTenantInfo();
    if (isMainAccount) {
      fetchSubAccounts();
    } else {
      setLoading(false);
    }
  }, [isMainAccount]);

  const fetchTenantInfo = async () => {
    try {
      const response = await fetch('/api/v1/tenant/info');
      if (response.ok) {
        const data = await response.json();
        setTenantInfo(data);
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error);
    }
  };

  const fetchSubAccounts = async () => {
    try {
      const response = await fetch('/api/v1/tenant/sub-accounts');
      if (response.ok) {
        const data = await response.json();
        setSubAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching sub accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubAccount = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert(t('subAccount.fillAllFields'));
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/v1/tenant/sub-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Refresh sub account list
        await fetchSubAccounts();
        // Reset form
        setFormData({ name: '', email: '', password: '' });
        setIsDialogOpen(false);
        alert(t('subAccount.createSuccess'));
      } else {
        const error = await response.json();
        alert(error.error || t('subAccount.createFailed'));
      }
    } catch (error) {
      console.error('Error creating sub account:', error);
      alert(t('subAccount.createFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubAccount = (account: SubAccount) => {
    setEditingAccount(account);
    setEditFormData({
      name: account.name,
      email: account.email,
      password: '',
      confirmPassword: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubAccount = async () => {
    if (!editingAccount) return;

    if (!editFormData.name || !editFormData.email) {
      alert(t('subAccount.fillAllFields'));
      return;
    }

    // If password is provided, check if passwords match
    if (editFormData.password && editFormData.password !== editFormData.confirmPassword) {
      alert(t('subAccount.passwordMismatch'));
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/v1/tenant/sub-accounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingAccount.id,
          name: editFormData.name,
          email: editFormData.email,
          password: editFormData.password || undefined, // Only send password if provided
        }),
      });

      if (response.ok) {
        // Refresh sub account list
        await fetchSubAccounts();
        // Reset form and close dialog
        setEditFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setEditingAccount(null);
        setIsEditDialogOpen(false);
        alert(t('subAccount.updateSuccess'));
      } else {
        const error = await response.json();
        alert(error.error || t('subAccount.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating sub account:', error);
      alert(t('subAccount.updateFailed'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubAccount = async (accountId: string) => {
    if (!confirm(t('subAccount.confirmDelete'))) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/tenant/sub-accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh sub account list
        await fetchSubAccounts();
        alert(t('subAccount.subAccountDeleted'));
      } else {
        const error = await response.json();
        alert(error.error || t('subAccount.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting sub account:', error);
    }
  };

  if (!isMainAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t('common.accessDenied')}</h1>
          <p className="text-gray-600">{t('subAccount.onlyMainAccountCanManage')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t('navigation.home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto py-6 space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('subAccount.title')}
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('subAccount.description')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Sub Account Management Card */}
          <div className={`rounded-2xl shadow-lg border-2 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-6 w-6 text-blue-500" />
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('subAccount.title')}
                </h2>
              </div>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('subAccount.description')}
              </p>

              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('subAccount.addSubAccount')}</span>
                </button>
              </div>

              {loading ? (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('common.loading')}
                </p>
              ) : subAccounts.length > 0 ? (
                <div className="space-y-3">
                  {subAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {account.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {account.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(account.createDate).toLocaleDateString()}
                        </div>
                        {account.userType === 2 && (
                          <>
                            <button
                              onClick={() => handleEditSubAccount(account)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title={t('subAccount.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubAccount(account.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('subAccount.noSubAccounts')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tenant Information Card */}
          <div className={`rounded-2xl shadow-lg border-2 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-6 w-6 text-green-500" />
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('subAccount.tenantInfo.title')}
                </h2>
              </div>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('subAccount.tenantInfo.description')}
              </p>

              {tenantInfo ? (
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('subAccount.tenantInfo.tenantName')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tenantInfo.name}
                    </p>
                  </div>
                  {tenantInfo.familyName && (
                    <div>
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('subAccount.tenantInfo.familyName')}
                      </label>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tenantInfo.familyName}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('subAccount.tenantInfo.createDate')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(tenantInfo.createDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('common.loading')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Sub Account Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('subAccount.addSubAccount')}
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('subAccount.createNewSubAccount')}
              </p>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('subAccount.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('subAccount.enterName')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('subAccount.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('subAccount.enterEmail')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('subAccount.password')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={t('subAccount.enterPassword')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddSubAccount}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isCreating ? t('subAccount.creating') : t('subAccount.create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub Account Dialog */}
      {isEditDialogOpen && editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('subAccount.editSubAccount')}
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('subAccount.updateSubAccount')}
              </p>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('subAccount.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder={t('subAccount.enterName')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('subAccount.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder={t('subAccount.enterEmail')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('subAccount.newPassword')} <span className="text-gray-500">({t('common.optional')})</span>
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder={t('subAccount.enterNewPassword')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                {editFormData.password && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('subAccount.confirmPassword')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={editFormData.confirmPassword}
                      onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                      placeholder={t('subAccount.enterConfirmPassword')}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingAccount(null);
                    setEditFormData({ name: '', email: '', password: '', confirmPassword: '' });
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleUpdateSubAccount}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? t('subAccount.updating') : t('subAccount.updateSubAccount')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
