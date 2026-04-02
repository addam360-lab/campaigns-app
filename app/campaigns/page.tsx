"use client";

import { useMemo, useState } from "react";
import { useCampaignManager } from "@/hooks/useCampaignManager";
import { CampaignStage, Creator, PostPlatform } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Users,
  Megaphone,
  CalendarDays,
  Link as LinkIcon,
} from "lucide-react";

const campaignStages: CampaignStage[] = [
  "Planning",
  "Ready",
  "Active",
  "Completed",
  "Cancelled",
];

const postPlatforms: PostPlatform[] = ["YouTube", "Instagram", "TikTok"];

export default function CampaignsPage() {
  const {
    campaigns,
    creators,
    isLoading,
    error,
    createCampaign,
    createCreator,
    createPost,
    linkCreatorToCampaign,
    updateCampaignStage,
  } = useCampaignManager();

  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isCreatorDialogOpen, setIsCreatorDialogOpen] = useState(false);
  const [postCampaignId, setPostCampaignId] = useState<string | null>(null);
  const [linkCampaignId, setLinkCampaignId] = useState<string | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    stage: "Planning" as CampaignStage,
  });

  const [creatorForm, setCreatorForm] = useState({
    name: "",
    industry: "",
    address: "",
    email: "",
  });

  const [postForm, setPostForm] = useState({
    creator_id: "",
    platform: "YouTube" as PostPlatform,
    link: "",
    start_date: "",
    end_date: "",
  });

  const [linkCreatorId, setLinkCreatorId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const availableCreatorsForLink = useMemo(() => {
    if (!linkCampaignId) return creators;
    const campaign = campaigns.find((c) => c.campaign_id === linkCampaignId);
    if (!campaign) return creators;

    const linkedIds = new Set(campaign.creators.map((c) => c.creator_id));
    return creators.filter((creator) => !linkedIds.has(creator.creator_id));
  }, [creators, campaigns, linkCampaignId]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await createCampaign({
        name: campaignForm.name,
        start_date: campaignForm.start_date || null,
        end_date: campaignForm.end_date || null,
        stage: campaignForm.stage,
      });

      setCampaignForm({
        name: "",
        start_date: "",
        end_date: "",
        stage: "Planning",
      });
      setIsCampaignDialogOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleCreateCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await createCreator({
        name: creatorForm.name,
        industry: creatorForm.industry || null,
        address: creatorForm.address || null,
        email: creatorForm.email || null,
      });

      setCreatorForm({
        name: "",
        industry: "",
        address: "",
        email: "",
      });
      setIsCreatorDialogOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCampaignId) return;
    setFormError(null);

    try {
      await createPost({
        campaign_id: postCampaignId,
        creator_id: postForm.creator_id,
        platform: postForm.platform,
        link: postForm.link || null,
        start_date: postForm.start_date || null,
        end_date: postForm.end_date || null,
      });

      setPostForm({
        creator_id: "",
        platform: "YouTube",
        link: "",
        start_date: "",
        end_date: "",
      });
      setPostCampaignId(null);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleLinkCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCampaignId || !linkCreatorId) return;
    setFormError(null);

    try {
      await linkCreatorToCampaign(linkCampaignId, linkCreatorId);
      setLinkCreatorId("");
      setLinkCampaignId(null);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  };

  const stageVariant = (stage: CampaignStage) => {
    switch (stage) {
      case "Completed":
        return "default";
      case "Cancelled":
        return "destructive";
      case "Active":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Manage campaigns, creators, and posts.
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreatorDialogOpen} onOpenChange={setIsCreatorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                New Creator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Creator</DialogTitle>
                <DialogDescription>
                  Add a creator you can link to campaigns and posts.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCreator} className="space-y-4">
                <div>
                  <Label htmlFor="creator-name">Name</Label>
                  <Input
                    id="creator-name"
                    value={creatorForm.name}
                    onChange={(e) =>
                      setCreatorForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="creator-industry">Industry</Label>
                  <Input
                    id="creator-industry"
                    value={creatorForm.industry}
                    onChange={(e) =>
                      setCreatorForm((prev) => ({
                        ...prev,
                        industry: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="creator-address">Address</Label>
                  <Input
                    id="creator-address"
                    value={creatorForm.address}
                    onChange={(e) =>
                      setCreatorForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="creator-email">Email</Label>
                  <Input
                    id="creator-email"
                    type="email"
                    value={creatorForm.email}
                    onChange={(e) =>
                      setCreatorForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <Button type="submit" className="w-full">
                  Save Creator
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
                <DialogDescription>
                  Add a campaign and set its schedule and stage.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Name</Label>
                  <Input
                    id="campaign-name"
                    value={campaignForm.name}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Stage</Label>
                  <Select
                    value={campaignForm.stage}
                    onValueChange={(value: CampaignStage) =>
                      setCampaignForm((prev) => ({ ...prev, stage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="campaign-start">Start Date</Label>
                  <Input
                    id="campaign-start"
                    type="datetime-local"
                    value={campaignForm.start_date}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="campaign-end">End Date</Label>
                  <Input
                    id="campaign-end"
                    type="datetime-local"
                    value={campaignForm.end_date}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                  />
                </div>

                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <Button type="submit" className="w-full">
                  Save Campaign
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading campaigns…</p>
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Megaphone className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-muted-foreground">No campaigns yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.campaign_id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(campaign.start_date)} → {formatDate(campaign.end_date)}
                      </span>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={stageVariant(campaign.stage)}>{campaign.stage}</Badge>
                    <Select
                      value={campaign.stage}
                      onValueChange={(value: CampaignStage) =>
                        updateCampaignStage(campaign.campaign_id, value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {campaignStages.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog
                    open={postCampaignId === campaign.campaign_id}
                    onOpenChange={(open) =>
                      setPostCampaignId(open ? campaign.campaign_id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Post</DialogTitle>
                        <DialogDescription>
                          Add a post for {campaign.name}.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleCreatePost} className="space-y-4">
                        <div>
                          <Label>Creator</Label>
                          <Select
                            value={postForm.creator_id}
                            onValueChange={(value) =>
                              setPostForm((prev) => ({ ...prev, creator_id: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select creator" />
                            </SelectTrigger>
                            <SelectContent>
                              {creators.map((creator) => (
                                <SelectItem
                                  key={creator.creator_id}
                                  value={creator.creator_id}
                                >
                                  {creator.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Platform</Label>
                          <Select
                            value={postForm.platform}
                            onValueChange={(value: PostPlatform) =>
                              setPostForm((prev) => ({ ...prev, platform: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {postPlatforms.map((platform) => (
                                <SelectItem key={platform} value={platform}>
                                  {platform}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="post-link">Link</Label>
                          <Input
                            id="post-link"
                            type="url"
                            value={postForm.link}
                            onChange={(e) =>
                              setPostForm((prev) => ({ ...prev, link: e.target.value }))
                            }
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="post-start">Start Date</Label>
                          <Input
                            id="post-start"
                            type="datetime-local"
                            value={postForm.start_date}
                            onChange={(e) =>
                              setPostForm((prev) => ({
                                ...prev,
                                start_date: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="post-end">End Date</Label>
                          <Input
                            id="post-end"
                            type="datetime-local"
                            value={postForm.end_date}
                            onChange={(e) =>
                              setPostForm((prev) => ({
                                ...prev,
                                end_date: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {formError && <p className="text-sm text-red-500">{formError}</p>}
                        <Button type="submit" className="w-full">
                          Save Post
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={linkCampaignId === campaign.campaign_id}
                    onOpenChange={(open) =>
                      setLinkCampaignId(open ? campaign.campaign_id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="mr-2 h-4 w-4" />
                        Link Creator
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Link Creator</DialogTitle>
                        <DialogDescription>
                          Link an existing creator to {campaign.name}.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleLinkCreator} className="space-y-4">
                        <div>
                          <Label>Creator</Label>
                          <Select value={linkCreatorId} onValueChange={setLinkCreatorId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select creator" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCreatorsForLink.map((creator: Creator) => (
                                <SelectItem
                                  key={creator.creator_id}
                                  value={creator.creator_id}
                                >
                                  {creator.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {formError && <p className="text-sm text-red-500">{formError}</p>}
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={!availableCreatorsForLink.length}
                        >
                          Link Creator
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Creators</h3>
                  {campaign.creators.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No creators linked.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {campaign.creators.map((creator) => (
                        <Badge key={creator.creator_id} variant="secondary">
                          {creator.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">Posts</h3>
                  {campaign.posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No posts added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {campaign.posts.map((post) => (
                        <div
                          key={post.post_id}
                          className="rounded-md border p-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{post.platform}</Badge>
                            <span className="text-muted-foreground">
                              Creator: {post.creator?.name || "Unknown"}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1 text-muted-foreground">
                            <div>
                              Start: {formatDate(post.start_date)}
                            </div>
                            <div>
                              End: {formatDate(post.end_date)}
                            </div>
                            {post.link && (
                              <a
                                href={post.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <LinkIcon className="h-4 w-4" />
                                {post.link}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}