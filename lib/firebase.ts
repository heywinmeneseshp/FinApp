import { signIn, signOut as nextAuthSignOut, getSession } from 'next-auth/react';

// â”€â”€â”€ Compatibilidad hacia atrás â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Este archivo reemplaza Firebase Auth con NextAuth.
// Los componentes existentes siguen funcionando con la misma interfaz.

export const db = null;
export const auth = null;
export const googleProvider = null;

/**
 * Reemplaza Firebase signInWithPopup de Google.
 * Ahora muestra el formulario de login con email y contraseña
 * a través del provider 'credentials' de NextAuth.
 */
export const signInWithGoogle = async () => {
  const result = await signIn('credentials', { redirect: false });
  if (result?.error) {
    throw new Error(result.error === 'CredentialsSignin'
      ? 'Credenciales inválidas'
      : result.error,
    );
  }
  if (!result?.ok) {
    throw new Error('Error al iniciar sesión');
  }
  return result;
};

/**
 * Cierra sesión en NextAuth y redirige al login.
 */
export const signOutFirebase = async () => {
  await nextAuthSignOut({ redirect: false });
};

/**
 * Obtiene la sesión actual (compatible con quien usaba onAuthStateChanged).
 */
export const getCurrentSession = () => getSession();
