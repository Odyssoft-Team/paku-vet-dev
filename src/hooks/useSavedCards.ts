import { useState, useCallback } from "react";
import { paymentService } from "@/api/services/payment.service";
import type { SavedPaymentMethod } from "@/types/payment.types";

/**
 * Hook para listar las tarjetas guardadas del usuario.
 *
 * Usa GET /wallet/cards del backend principal de Paku.
 * La respuesta tiene campos propios del wallet (brand, last4, exp_month, exp_year)
 * que mapeamos directamente a SavedPaymentMethod.
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

      // El wallet devuelve campos ya normalizados (brand, last4, exp_month, exp_year)
      const mapped: SavedPaymentMethod[] = (data as any[]).map((card) => ({
        id: card.payment_method_id ?? card.id, // crd_test_xxx de Culqi
        brand: (card.brand ?? "").toLowerCase(),
        last4: card.last4 ?? card.last_four ?? "",
        exp_month: card.exp_month ?? 0,
        exp_year: card.exp_year ?? 0,
      }));

      setCards(mapped);
    } catch (e: any) {
      console.error("[useSavedCards] Error:", e?.message, e);
      setError(e?.message || "Error al cargar tarjetas");
    } finally {
      setLoading(false);
    }
  }, []);

  return { cards, loading, error, fetchCards };
}
