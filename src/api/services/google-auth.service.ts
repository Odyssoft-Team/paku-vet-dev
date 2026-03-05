import { getApp } from "@react-native-firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { SocialAuthError } from "@/types/auth.types";

/**
 * Ejecuta el flujo completo de Google Sign-In y retorna el Firebase ID Token.
 * Este token luego se envía al backend Paku en POST /auth/social.
 *
 * Flujo:
 *  1. Google OAuth nativo (GoogleSignin.signIn)
 *  2. Firebase valida la credencial (signInWithCredential)
 *  3. Se obtiene el Firebase ID Token para enviar al backend
 */
export async function getGoogleIdToken(): Promise<string> {
  // Verificar que Play Services esté disponible (Android)
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Cerrar sesión silenciosa previa para forzar el selector de cuentas
  // Así el usuario siempre puede elegir con qué cuenta ingresar
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignorar si no había sesión activa
  }

  const signInResult = await GoogleSignin.signIn();

  if (!signInResult.data?.idToken) {
    throw new Error("No se obtuvo idToken de Google");
  }

  // API modular v22: GoogleAuthProvider.credential() como función
  const googleCredential = GoogleAuthProvider.credential(
    signInResult.data.idToken,
  );

  // API modular v22: getAuth(getApp()) en lugar de auth()
  const firebaseAuth = getAuth(getApp());
  const userCredential = await signInWithCredential(
    firebaseAuth,
    googleCredential,
  );

  // API modular v22: getIdToken() como función sobre el user
  const firebaseIdToken = await userCredential.user.getIdToken();

  return firebaseIdToken;
}

/**
 * Cierra sesión de Google en el dispositivo.
 * Llamar al hacer logout de la app para limpiar el estado de Google Sign-In.
 */
export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
    const firebaseAuth = getAuth(getApp());
    await signOut(firebaseAuth);
  } catch {
    // Ignorar errores de logout de Google (el usuario ya está deslogueado de Paku)
  }
}

/**
 * Mapea los errores de Google Sign-In a mensajes legibles.
 */
export function getGoogleSignInErrorMessage(error: any): string {
  if (error instanceof SocialAuthError) {
    return error.message;
  }

  // Log detallado para debugging
  console.log(
    "🔴 Google Sign-In error completo:",
    JSON.stringify(
      {
        code: error?.code,
        message: error?.message,
        name: error?.name,
      },
      null,
      2,
    ),
  );

  const code = error?.code;
  switch (code) {
    case statusCodes.SIGN_IN_CANCELLED:
      return ""; // Usuario canceló, no mostrar error
    case statusCodes.IN_PROGRESS:
      return ""; // Ya hay un sign-in en curso
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return "Google Play Services no está disponible en este dispositivo.";
    default:
      return "No se pudo iniciar sesión con Google. Intenta de nuevo.";
  }
}
