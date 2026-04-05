import { useState, useCallback } from "react";
import { paymentService } from "@/api/services/payment.service";
import { SavedPaymentMethod } from "@/types/payment.types";

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
      setCards(data);
    } catch (e: any) {
      console.error(
        "[useSavedCards] Error:",
        e?.response?.status,
        e?.response?.data,
      );
      setError(e?.response?.data?.detail || "Error al cargar tarjetas");
    } finally {
      setLoading(false);
    }
  }, []);

  return { cards, loading, error, fetchCards };
}
