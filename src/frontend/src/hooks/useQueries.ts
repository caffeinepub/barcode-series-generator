import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BarcodeSeries } from "../backend.d";
import { useActor } from "./useActor";

export function useListSeries() {
  const { actor, isFetching } = useActor();
  return useQuery<BarcodeSeries[]>({
    queryKey: ["series"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSeries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSeries() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      format,
      values,
    }: {
      name: string;
      format: string;
      values: string[];
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createSeries(name, format, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series"] }),
  });
}

export function useDeleteSeries() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteSeries(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series"] }),
  });
}
