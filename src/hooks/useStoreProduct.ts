import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/api/services/store.service";

export const useStoreProduct = (productId: string, petId?: string) => {
  return useQuery({
    queryKey: ["storeProduct", productId, petId],
    queryFn: () => storeService.getProduct(productId, petId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
};
