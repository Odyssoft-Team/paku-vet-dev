import { useState, useCallback } from "react";
import { paymentService } from "@/api/services/payment.service";
import {
  SavedPaymentMethod,
  toSavedPaymentMethod,
} from "@/types/payment.types";

/**
 * Hook para listar las tarjetas guardadas del usuario.
 *
 * Las tarjetas en Culqi se identifican por su ID (crd_test_xxx).
 * La UI usa SavedPaymentMethod como tipo interno (igual que antes),
 * adaptando los campos de SavedCard de Culqi vía toSavedPaymentMethod().
 */
export function useSavedCards() {
  const [cards, setCards] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.listCards();
      console.log("[useSavedCards] Tarjetas cargadas:", JSON.stringify(data));
      // Convertir SavedCard[] de Culqi al formato interno de la UI
      setCards(data.map(toSavedPaymentMethod));
    } catch (e: any) {
      console.error("[useSavedCards] Error:", e?.message, e);
      setError(e?.message || "Error al cargar tarjetas");
    } finally {
      setLoading(false);
    }
  }, []);

  return { cards, loading, error, fetchCards };
}
