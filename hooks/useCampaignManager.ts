"use client";

import { useEffect, useState } from "react";
import {
  Campaign,
  CampaignStage,
  CampaignWithRelations,
  Creator,
  Post,
  PostPlatform,
} from "@/types/models";
import { createSupabaseClient } from "@/lib/supabaseClient";

type CreateCampaignInput = {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  stage?: CampaignStage;
};

type CreateCreatorInput = {
  name: string;
  industry?: string | null;
  address?: string | null;
  email?: string | null;
};

type CreatePostInput = {
  campaign_id: string;
  creator_id: string;
  platform: PostPlatform;
  link?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export function useCampaignManager() {
  const supabase = createSupabaseClient();

  const [campaigns, setCampaigns] = useState<CampaignWithRelations[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        setCampaigns([]);
        return;
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          posts (
            *,
            creator:creators!posts_creator_id_fkey (*)
          ),
          campaign_creators (
            creator:creators!campaign_creators_creator_id_fkey (*)
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: CampaignWithRelations[] = (data || []).map((campaign: any) => ({
        ...campaign,
        posts: (campaign.posts || []).map((post: any) => ({
          ...post,
          creator: post.creator || null,
        })),
        creators: (campaign.campaign_creators || [])
          .map((row: any) => row.creator)
          .filter(Boolean),
      }));

      setCampaigns(mapped);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching campaigns:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        setCreators([]);
        return;
      }

      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCreators(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching creators:", err);
      setError(err.message);
    }
  };

  const createCampaign = async (
    input: CreateCampaignInput
  ): Promise<Campaign> => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("campaigns")
      .insert([
        {
          user_id: session.user.id,
          name: input.name,
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          stage: input.stage || "Planning",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await fetchCampaigns();
    return data;
  };

  const createCreator = async (input: CreateCreatorInput): Promise<Creator> => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("creators")
      .insert([
        {
          user_id: session.user.id,
          name: input.name,
          industry: input.industry || null,
          address: input.address || null,
          email: input.email || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await fetchCreators();
    return data;
  };

  const linkCreatorToCampaign = async (
    campaignId: string,
    creatorId: string
  ): Promise<void> => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("campaign_creators")
      .upsert(
        [
          {
            user_id: session.user.id,
            campaign_id: campaignId,
            creator_id: creatorId,
          },
        ],
        { onConflict: "campaign_id,creator_id" }
      );

    if (error) throw error;

    await fetchCampaigns();
  };

  const createPost = async (input: CreatePostInput): Promise<Post> => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          user_id: session.user.id,
          campaign_id: input.campaign_id,
          creator_id: input.creator_id,
          platform: input.platform,
          link: input.link || null,
          start_date: input.start_date || null,
          end_date: input.end_date || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await linkCreatorToCampaign(input.campaign_id, input.creator_id);
    await fetchCampaigns();

    return data;
  };

  const updateCampaignStage = async (
    campaignId: string,
    stage: CampaignStage
  ): Promise<void> => {
    const { error } = await supabase
      .from("campaigns")
      .update({
        stage,
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", campaignId);

    if (error) throw error;

    await fetchCampaigns();
  };

  const refreshAll = async () => {
    await Promise.all([fetchCampaigns(), fetchCreators()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    campaigns,
    creators,
    isLoading,
    error,
    createCampaign,
    createCreator,
    createPost,
    linkCreatorToCampaign,
    updateCampaignStage,
    refreshAll,
  };
}