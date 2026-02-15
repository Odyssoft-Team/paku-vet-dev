import { useQuery } from "@tanstack/react-query";
import { pakuSpaService } from "@/api/services/paku-spa.service";

export const useSpaServices = () => {
  return useQuery({
    queryKey: ["spaServices"], // Identificador único de la caché
    queryFn: pakuSpaService.getSpaServices, // La función que llama a la API
    staleTime: 1000 * 60 * 5, // Los datos se consideran "frescos" por 5 min
  });
};
