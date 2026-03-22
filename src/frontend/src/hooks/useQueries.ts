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
    }: { name: string; format: string; values: string[] }) => {
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

export function useRenameSeries() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newName }: { id: bigint; newName: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.renameSeries(id, newName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series"] }),
  });
}

export function useGetUserSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["userSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveUserSettings(settings);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userSettings"] }),
  });
}
