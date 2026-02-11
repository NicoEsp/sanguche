import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Course, CourseStatus } from "@/types/courses";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .in("status", ["coming_soon", "published"] as CourseStatus[])
        .order("order_index", { ascending: true });

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching courses:", error);
        throw error;
      }

      return (data || []) as Course[];
    },
  });
}
