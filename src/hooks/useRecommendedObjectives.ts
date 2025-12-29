import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAssessmentData } from "./useAssessmentData";
import { useUserProgressObjectives } from "./useUserProgressObjectives";
import { useUserProfile } from "./useUserProfile";
import { RECOMMENDED_OBJECTIVES, RecommendedObjectiveTemplate, getDomainLabel } from "@/utils/recommendedObjectives";
import { DomainKey, Gap, NeutralArea, SeniorityLevel } from "@/utils/scoring";
import { toast } from "sonner";

export interface GeneratedObjective extends RecommendedObjectiveTemplate {
  domainLabel: string;
  reason: "gap" | "neutral";
}

interface UseRecommendedObjectivesReturn {
  recommendedObjectives: GeneratedObjective[];
  isLoading: boolean;
  dismissObjective: (objectiveKey: string) => Promise<void>;
  isDismissing: boolean;
}

/**
 * Hook that generates personalized objective recommendations based on user's assessment
 * 
 * Rules:
 * - If global score <= 2: Show max 4 objectives
 * - If global score >= 3: Show max 3 objectives
 * - Gaps (score < 3) get priority over neutral areas (3-4)
 * - Already incorporated or dismissed objectives are filtered out
 */
export function useRecommendedObjectives(): UseRecommendedObjectivesReturn {
  const { profile, loading: profileLoading } = useUserProfile();
  const profileId = profile?.id;
  
  const { result: assessmentResult, loading: assessmentLoading } = useAssessmentData();
  const { data: userObjectives = [], isLoading: userObjectivesLoading } = useUserProgressObjectives(profileId);
  
  const queryClient = useQueryClient();

  // Fetch dismissed objectives
  const { data: dismissedObjectives = [], isLoading: dismissedLoading } = useQuery({
    queryKey: ['dismissed-objectives', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('dismissed_recommended_objectives')
        .select('objective_key')
        .eq('user_id', profileId);
      
      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching dismissed objectives:', error);
        return [];
      }
      
      return data.map(d => d.objective_key);
    },
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async (objectiveKey: string) => {
      if (!profileId) throw new Error('No profile ID');
      
      const { error } = await supabase
        .from('dismissed_recommended_objectives')
        .insert({ user_id: profileId, objective_key: objectiveKey });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dismissed-objectives', profileId] });
      toast.success('Objetivo descartado');
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('Error dismissing objective:', error);
      toast.error('Error al descartar objetivo');
    }
  });

  const dismissObjective = async (objectiveKey: string) => {
    await dismissMutation.mutateAsync(objectiveKey);
  };

  // Generate recommended objectives based on assessment
  const recommendedObjectives = useMemo<GeneratedObjective[]>(() => {
    if (!assessmentResult) return [];
    
    const { gaps = [], neutralAreas = [], nivel, promedioGlobal } = assessmentResult;
    const userLevel = nivel as SeniorityLevel;
    
    // Use promedioGlobal from assessment (global average score)
    const globalAverage = promedioGlobal ?? 3;
    
    // Determine max objectives based on global score
    const maxObjectives = globalAverage <= 2 ? 4 : 3;
    
    // Get objective keys already in user's objectives (incorporated)
    const incorporatedKeys = new Set(
      userObjectives
        .filter(obj => obj.objective_id) // Has reference to a template
        .map(obj => {
          // Try to find matching template key
          const template = RECOMMENDED_OBJECTIVES.find(t => {
            // Match by title as fallback since objective_id references progress_objectives, not our templates
            return t.title === obj.title;
          });
          return template?.key;
        })
        .filter(Boolean)
    );
    
    // Also filter by title match for custom objectives that came from recommendations
    const incorporatedTitles = new Set(userObjectives.map(obj => obj.title));
    
    // Filter function to check if objective should be shown
    const shouldShowObjective = (obj: RecommendedObjectiveTemplate): boolean => {
      // Check if dismissed
      if (dismissedObjectives.includes(obj.key)) return false;
      
      // Check if already incorporated by key or title
      if (incorporatedKeys.has(obj.key)) return false;
      if (incorporatedTitles.has(obj.title)) return false;
      
      // Check if matches user level
      if (!obj.targetLevels.includes(userLevel)) return false;
      
      return true;
    };
    
    const results: GeneratedObjective[] = [];
    
    // First: Add objectives for gaps (priority)
    for (const gap of gaps) {
      const domainKey = gap.key as DomainKey;
      const matchingObjectives = RECOMMENDED_OBJECTIVES.filter(
        obj => obj.domainKey === domainKey && shouldShowObjective(obj)
      );
      
      for (const obj of matchingObjectives) {
        if (results.length >= maxObjectives) break;
        results.push({
          ...obj,
          domainLabel: getDomainLabel(domainKey),
          reason: "gap",
          // Override timeframe to "now" for gaps
          suggestedTimeframe: "now"
        });
      }
      
      if (results.length >= maxObjectives) break;
    }
    
    // Second: Add objectives for neutral areas (if space left)
    if (results.length < maxObjectives) {
      for (const neutral of neutralAreas) {
        const domainKey = neutral.key as DomainKey;
        const matchingObjectives = RECOMMENDED_OBJECTIVES.filter(
          obj => obj.domainKey === domainKey && shouldShowObjective(obj)
        );
        
        for (const obj of matchingObjectives) {
          if (results.length >= maxObjectives) break;
          
          // Check if we already have this objective from gaps
          if (results.some(r => r.key === obj.key)) continue;
          
          results.push({
            ...obj,
            domainLabel: getDomainLabel(domainKey),
            reason: "neutral",
            // Override timeframe to "soon" for neutral areas
            suggestedTimeframe: "soon"
          });
        }
        
        if (results.length >= maxObjectives) break;
      }
    }
    
    // Sort by priority (lower = higher priority), then by reason (gaps first)
    results.sort((a, b) => {
      if (a.reason !== b.reason) {
        return a.reason === "gap" ? -1 : 1;
      }
      return a.priority - b.priority;
    });
    
    return results.slice(0, maxObjectives);
  }, [assessmentResult, userObjectives, dismissedObjectives]);

  const isLoading = profileLoading || assessmentLoading || userObjectivesLoading || dismissedLoading;

  return {
    recommendedObjectives,
    isLoading,
    dismissObjective,
    isDismissing: dismissMutation.isPending,
  };
}
