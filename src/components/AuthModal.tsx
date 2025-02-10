import React, { useState } from 'react';
import { Eye, EyeOff, RefreshCw, Check } from 'lucide-react';
import { signIn, signUp, AuthError, generateStrongPassword, checkPasswordStrength } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Modal } from './Modal';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [''] });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const hasUnsavedChanges = email || password || confirmPassword || fullName || phone;

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordTouched(true);
    setPasswordStrength(checkPasswordStrength(value));
  };

  const generatePassword = () => {
    const newPassword = generateStrongPassword();
    handlePasswordChange(newPassword);
    setConfirmPassword(newPassword);
    setConfirmPasswordTouched(true);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordTouched(true);
  };

  const getPasswordMatchFeedback = () => {
    if (!confirmPasswordTouched) return null;
    if (!confirmPassword) return 'Confirme sua senha';
    return password === confirmPassword ? 
      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
        <Check className="w-4 h-4" /> Senhas conferem
      </span> : 
      <span className="text-red-600 dark:text-red-400">As senhas não conferem</span>;
  };

  const getPasswordStrengthColor = () => {
    if (!passwordTouched) return 'bg-gray-200';
    const colors = [
      'bg-gray-200', // Empty
      'bg-red-500',  // Very Weak
      'bg-orange-500', // Weak
      'bg-yellow-500', // Medium
      'bg-lime-500',   // Strong
      'bg-green-500'   // Very Strong
    ];
    return colors[passwordStrength.score] || colors[0];
  };

  const getPasswordStrengthText = () => {
    if (!passwordTouched) return '';
    const texts = [
      'Muito fraca',
      'Fraca',
      'Média',
      'Forte',
      'Muito forte'
    ];
    return texts[passwordStrength.score] || texts[0];
  };

  const getPasswordStrengthTextColor = () => {
    if (!passwordTouched) return 'text-gray-500';
    const colors = [
      'text-gray-500',
      'text-red-500',
      'text-orange-500',
      'text-yellow-500',
      'text-lime-500',
      'text-green-500'
    ];
    return colors[passwordStrength.score] || colors[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw { message: 'As senhas não coincidem.' };
        }

        if (passwordStrength.score < 3) {
          throw { message: 'Por favor, escolha uma senha mais forte.' };
        }

        await signUp({ email, password, fullName, phone });
        setSuccess('Conta criada com sucesso! Por favor, verifique seu email para ativar sua conta.');
        setMode('login');
      } else if (mode === 'login') {
        const { user } = await signIn(email, password);
        setUser(user);
        onClose();
        navigate('/profile');
      }
    } catch (err) {
      setError((err as AuthError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Recuperar Senha'}
      hasUnsavedChanges={!!hasUnsavedChanges}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefone (opcional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="(00) 00000-0000"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        {mode !== 'forgot' && (
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 pr-24"
                required
              />
              <div className="absolute right-2 top-2 flex space-x-1">
                {mode === 'register' && (
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Gerar senha forte"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && passwordTouched && (
              <>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Força da senha:</span>
                    <span className={getPasswordStrengthTextColor()}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <ul className="text-sm space-y-1">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <li key={index} className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        {feedback === 'Senha forte!' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="w-4 h-4">•</span>
                        )}
                        <span>{feedback}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className={`w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${
                        confirmPasswordTouched && password !== confirmPassword ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-1 text-sm">
                    {getPasswordMatchFeedback()}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === 'register' && (password !== confirmPassword || passwordStrength.score < 3))}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50"
        >
          {loading
            ? 'Carregando...'
            : mode === 'login'
            ? 'Entrar'
            : mode === 'register'
            ? 'Criar Conta'
            : 'Enviar Email de Recuperação'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        {mode === 'login' ? (
          <>
            <button
              onClick={() => setMode('forgot')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Esqueceu sua senha?
            </button>
            <p className="mt-2">
              Não tem uma conta?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Criar conta
              </button>
            </p>
          </>
        ) : mode === 'register' ? (
          <p>
            Já tem uma conta?{' '}
            <button
              onClick={() => setMode('login')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Fazer login
            </button>
          </p>
        ) : (
          <button
            onClick={() => setMode('login')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Voltar ao login
          </button>
        )}
      </div>
    </Modal>
  );
}