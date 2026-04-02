import { Database } from "@/lib/database.types";

// Existing models
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// New models
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type Creator = Database["public"]["Tables"]["creators"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type CampaignCreator =
  Database["public"]["Tables"]["campaign_creators"]["Row"];

export type CampaignStage = Database["public"]["Enums"]["campaign_stage"];
export type PostPlatform = Database["public"]["Enums"]["post_platform"];

// Existing extended UI type
export type User = Profile & {
  email: string;
  tasks_created: number;
};

export type CampaignWithRelations = Campaign & {
  posts: Array<
    Post & {
      creator: Creator | null;
    }
  >;
  creators: Creator[];
};