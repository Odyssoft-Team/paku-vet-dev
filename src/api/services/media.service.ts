import { CONFIG } from "@/constants/config";
import { storage } from "@/utils/storage";
import { API_ENDPOINTS } from "../endpoints";

export type MediaEntityType = "user" | "pet";
export type MediaContentType = "image/jpeg" | "image/png" | "image/webp";

// ── Tipos de respuesta ──────────────────────────────────────────────────────

interface SignedUploadResponse {
  upload_url: string;
  object_name: string;
  content_type: MediaContentType;
  expires_in: number;
}

interface ConfirmPhotoResponse {
  object_name: string;
  read_url: string;
  expires_in: number;
}

interface SignedReadResponse {
  read_url: string;
  expires_in: number;
}

// ── Helper: fetch autenticado con MEDIA_API_URL ─────────────────────────────
// Usa su propia base URL (MEDIA_API_URL) independiente del apiClient,
// para que cambiar la URL de media no afecte al resto de la app.

async function mediaFetch<T>(path: string, body: object): Promise<T> {
  const token = await storage.getItem<string>(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  const url = `${CONFIG.MEDIA_API_URL}${path}`;

  console.log("[Media] POST", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log("[Media] Error", response.status, errorData);
    throw Object.assign(new Error(`Media request failed: ${response.status}`), {
      response: { status: response.status, data: errorData },
    });
  }

  return response.json();
}

// ── Servicio ────────────────────────────────────────────────────────────────

export const mediaService = {
  /**
   * Paso 1 — Pide una URL firmada al backend para subir el archivo a GCS.
   */
  async getSignedUploadUrl(
    entityType: MediaEntityType,
    entityId: string,
    contentType: MediaContentType,
  ): Promise<SignedUploadResponse> {
    return mediaFetch<SignedUploadResponse>(API_ENDPOINTS.MEDIA.SIGNED_UPLOAD, {
      entity_type: entityType,
      entity_id: entityId,
      content_type: contentType,
    });
  },

  /**
   * Paso 2 — Sube el archivo binario DIRECTO a GCS usando la URL firmada.
   * No pasa por el backend ni lleva token de autorización.
   */
  async uploadToGCS(
    uploadUrl: string,
    fileUri: string,
    contentType: MediaContentType,
  ): Promise<void> {
    const fileBlob = await fetch(fileUri).then((r) => r.blob());

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: fileBlob,
    });

    if (!response.ok) {
      throw new Error(
        `GCS upload failed: ${response.status} ${response.statusText}`,
      );
    }
  },

  /**
   * Paso 3 — Confirma al backend que la subida fue exitosa.
   */
  async confirmPhoto(
    entityType: MediaEntityType,
    entityId: string,
    objectName: string,
  ): Promise<ConfirmPhotoResponse> {
    return mediaFetch<ConfirmPhotoResponse>(API_ENDPOINTS.MEDIA.CONFIRM_PHOTO, {
      entity_type: entityType,
      entity_id: entityId,
      object_name: objectName,
    });
  },

  /**
   * Obtiene una URL firmada de lectura para mostrar una imagen guardada.
   */
  async getSignedReadUrl(objectName: string): Promise<string> {
    const data = await mediaFetch<SignedReadResponse>(
      API_ENDPOINTS.MEDIA.SIGNED_READ,
      {
        object_name: objectName,
      },
    );
    return data.read_url;
  },
};
