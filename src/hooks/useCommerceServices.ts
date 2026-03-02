import { useState, useEffect } from "react";
import {
  commerceService,
  GetServicesParams,
} from "@/api/services/commerce.service";
import { CommerceService } from "@/types/commerce.types";

interface UseCommerceServicesResult {
  baseServices: CommerceService[];
  addonServices: CommerceService[];
  allServices: CommerceService[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCommerceServices = (
  params: GetServicesParams,
): UseCommerceServicesResult => {
  const [allServices, setAllServices] = useState<CommerceService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await commerceService.getServices(params);
      setAllServices(data.filter((s) => s.is_active));
    } catch (e: any) {
      setError(e.response?.data?.detail || "Error al cargar servicios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [params.species, params.breed]);

  return {
    baseServices: allServices.filter((s) => s.type === "base"),
    addonServices: allServices.filter((s) => s.type === "addon"),
    allServices,
    isLoading,
    error,
    refetch: fetch,
  };
};
