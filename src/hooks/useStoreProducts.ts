import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/api/services/store.service";

export const useStoreProducts = (
  slug: string,
  petId?: string,
  species?: string,
) => {
  return useQuery({
    queryKey: ["storeProducts", slug, petId, species],
    queryFn: () =>
      storeService.getProductsByCategory(slug, { pet_id: petId, species }),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
};
