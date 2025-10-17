import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type Event = Database["public"]["Tables"]["events"]["Row"];

interface OccurrencesResult {
  occurrences: Event[];
  isFirstSession: boolean;
}

export const useOccurrences = (currentEvent: Event | null) => {
  return useQuery({
    queryKey: ["occurrences", currentEvent?.id],
    queryFn: async (): Promise<OccurrencesResult> => {
      if (!currentEvent?.event_name) {
        return { occurrences: [], isFirstSession: false };
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("event_name", currentEvent.event_name)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching occurrences:", error);
        throw error;
      }

      const occurrences = data || [];

      // Compute isFirstSession flag
      const isFirstSession = occurrences[0]?.id === currentEvent?.id;

      return { occurrences, isFirstSession };
    },
    enabled: !!currentEvent?.event_name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
