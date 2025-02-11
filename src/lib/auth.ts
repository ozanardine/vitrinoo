import { supabase } from './supabase';

export type AuthError = {
  message: string;
};

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export async function signUp({ email, password, fullName, phone }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        throw { message: 'Este email já está cadastrado. Por favor, use outro email ou faça login.' };
      }
      throw { message: 'Erro ao criar conta. Por favor, tente novamente.' };
    }

    return data;
  } catch (err: any) {
    if (err.message) throw err;
    throw { message: 'Erro ao criar conta. Por favor, tente novamente.' };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw { message: 'Email ou senha incorretos.' };
      }
      throw { message: error.message };
    }

    return data;
  } catch (err: any) {
    throw { message: err.message || 'Erro ao fazer login. Por favor, tente novamente.' };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw { message: 'Erro ao sair. Por favor, tente novamente.' };
  }
}

export async function updateProfile(userId: string, data: { 
  fullName?: string;
  phone?: string;
  email?: string;
}) {
  const updates: any = {};
  
  if (data.fullName) updates.full_name = data.fullName;
  if (data.phone) updates.phone = data.phone;

  const { error: updateError } = await supabase.auth.updateUser({
    data: updates,
  });

  if (updateError) {
    throw { message: 'Erro ao atualizar perfil. Por favor, tente novamente.' };
  }

  // If email is being updated, handle it separately
  if (data.email) {
    const { error: emailError } = await supabase.auth.updateUser({
      email: data.email,
    });

    if (emailError) {
      throw { message: 'Erro ao atualizar email. Por favor, tente novamente.' };
    }
  }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  // First verify current password
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw { message: 'Usuário não encontrado.' };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    throw { message: 'Senha atual incorreta.' };
  }

  // Update to new password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw { message: 'Erro ao atualizar senha. Por favor, tente novamente.' };
  }
}

export function generateStrongPassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  
  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*()_+'[Math.floor(Math.random() * 12)]; // special

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('A senha deve ter pelo menos 8 caracteres');
  } else {
    score += Math.min(2, Math.floor(password.length / 8));
  }

  // Character variety checks
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Adicione letras maiúsculas');
  
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Adicione letras minúsculas');
  
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Adicione números');
  
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Adicione caracteres especiais');

  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    score--;
    feedback.push('Evite caracteres repetidos');
  }

  if (/^(?=.*password|.*123|.*abc).*$/i.test(password)) {
    score--;
    feedback.push('Evite padrões comuns');
  }

  return {
    score: Math.max(0, Math.min(5, score)),
    feedback: feedback.length ? feedback : ['Senha forte!'],
  };
}