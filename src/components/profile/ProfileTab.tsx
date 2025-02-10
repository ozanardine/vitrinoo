import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Store } from '../../lib/types';
import { updateProfile, updatePassword, checkPasswordStrength } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';

interface ProfileTabProps {
  store: Store;
  onStoreUpdate: () => void;
}

interface AlertMessage {
  type: 'success' | 'error';
  text: string;
}

export function ProfileTab({ store, onStoreUpdate }: ProfileTabProps) {
  const { user, setUser } = useStore();
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userProfile, setUserProfile] = useState({
    fullName: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || ''
  });

  // Atualiza o estado quando o usuário mudar
  useEffect(() => {
    setUserProfile({
      fullName: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || ''
    });
  }, [user]);

  const showAlert = (message: AlertMessage) => {
    setAlert(message);
    setTimeout(() => setAlert(null), 5000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
        email: userProfile.email !== user?.email ? userProfile.email : undefined,
        data: {
          full_name: userProfile.fullName,
          name: userProfile.fullName, // Mantemos ambos para compatibilidade
          phone: userProfile.phone
        }
      });

      if (error) throw error;
      
      if (updatedUser) {
        setUser(updatedUser);
      }

      showAlert({
        type: 'success',
        text: 'Perfil atualizado com sucesso!'
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { score } = checkPasswordStrength(passwordForm.newPassword);
      
      if (score < 3) {
        throw new Error('A nova senha não é forte o suficiente.');
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('As senhas não coincidem.');
      }

      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);

      showAlert({
        type: 'success',
        text: 'Senha atualizada com sucesso!'
      });
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {alert && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          alert.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100' 
            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100'
        }`}>
          {alert.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{alert.text}</span>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Dados do Perfil</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome Completo</label>
            <input
              type="text"
              value={userProfile.fullName}
              onChange={(e) => setUserProfile({ ...userProfile, fullName: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              type="tel"
              value={userProfile.phone}
              onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              Alterar Senha
            </button>
          </div>
        </form>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Alterar Senha</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-2 text-gray-500"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Alterar Senha'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}