import { useState } from "react";
import {
  mediaService,
  MediaEntityType,
  MediaContentType,
} from "@/api/services/media.service";
import { useAuthStore } from "@/store/authStore";

interface UploadPhotoResult {
  objectName: string;
  readUrl: string;
}

interface UseUploadPhotoReturn {
  uploadPhoto: (
    entityType: MediaEntityType,
    entityId: string,
    fileUri: string,
    mimeType?: string,
  ) => Promise<UploadPhotoResult>;
  isUploading: boolean;
  uploadError: string | null;
  clearUploadError: () => void;
}

/**
 * Hook para subir fotos de perfil (usuario o mascota) a GCS en 3 pasos:
 *   1. Pide signed upload URL al backend
 *   2. Sube el binario directo a GCS
 *   3. Confirma la subida al backend
 *
 * Uso:
 *   const { uploadPhoto, isUploading } = useUploadPhoto();
 *   const { readUrl } = await uploadPhoto("user", user.id, fileUri, "image/jpeg");
 */
export function useUploadPhoto(): UseUploadPhotoReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadPhoto = async (
    entityType: MediaEntityType,
    entityId: string,
    fileUri: string,
    mimeType?: string,
  ): Promise<UploadPhotoResult> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Determinar content type — solo se aceptan jpeg, png y webp
      const contentType = resolveContentType(mimeType);

      // Paso 1 — Obtener signed upload URL
      console.log("[Upload] Paso 1 — pidiendo signed URL:", {
        entityType,
        entityId,
        contentType,
      });
      const { upload_url, object_name } = await mediaService.getSignedUploadUrl(
        entityType,
        entityId,
        contentType,
      );
      console.log("[Upload] Paso 1 OK — object_name:", object_name);

      // Paso 2 — Subir binario directo a GCS
      console.log("[Upload] Paso 2 — subiendo a GCS:", upload_url);
      await mediaService.uploadToGCS(upload_url, fileUri, contentType);
      console.log("[Upload] Paso 2 OK — subida exitosa");

      // Paso 3 — Confirmar al backend y obtener read URL
      console.log("[Upload] Paso 3 — confirmando al backend");
      const { read_url } = await mediaService.confirmPhoto(
        entityType,
        entityId,
        object_name,
      );
      console.log("[Upload] Paso 3 OK — read_url:", read_url);

      // Si es foto de usuario, actualizar el store con el nuevo object_name
      // para que profile_photo_url esté disponible en toda la app
      if (entityType === "user") {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setUser({
            ...currentUser,
            profile_photo_url: object_name,
          });
        }
      }

      return { objectName: object_name, readUrl: read_url };
    } catch (err: any) {
      console.log(
        "[Upload] ERROR:",
        err?.response?.status,
        err?.response?.data,
        err?.message,
      );
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Error al subir la foto";
      setUploadError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const clearUploadError = () => setUploadError(null);

  return { uploadPhoto, isUploading, uploadError, clearUploadError };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convierte el mimeType del ImagePicker al ContentType aceptado por el backend.
 * Fallback a image/jpeg si no se reconoce.
 */
function resolveContentType(mimeType?: string): MediaContentType {
  switch (mimeType) {
    case "image/png":
      return "image/png";
    case "image/webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}
