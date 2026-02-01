import { FC, useState } from "react";
import { Launch } from "@/types/launch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2, Download, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { downloadOpenClawZip } from "@/lib/openclawPack";

interface Props {
  launch: Launch;
}

export const RuntimeSettingsEditor: FC<Props> = ({ launch }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [includeApiKey, setIncludeApiKey] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [personality, setPersonality] = useState(launch.personality);
  const [postingFrequency, setPostingFrequency] = useState<string>(
    launch.posting_frequency || "daily_1"
  );
  const [targetCommunity, setTargetCommunity] = useState(
    launch.target_community || ""
  );
  const [allowTokenMention, setAllowTokenMention] = useState(
    launch.allow_token_mention ?? true
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update only runtime settings via Supabase
      const { error } = await supabase
        .from("launches")
        .update({
          personality,
          posting_frequency: postingFrequency,
          target_community: targetCommunity || null,
          allow_token_mention: allowTokenMention,
        })
        .eq("id", launch.id)
        .eq("creator_wallet", launch.creator_wallet);

      if (error) throw error;

      toast.success("Runtime settings saved!");
      queryClient.invalidateQueries({ queryKey: ["launch", launch.id] });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    // Create an updated launch object with current form values
    const updatedLaunch: Partial<Launch> = {
      ...launch,
      personality,
      posting_frequency: postingFrequency as Launch["posting_frequency"],
      target_community: targetCommunity || null,
      allow_token_mention: allowTokenMention,
    };
    await downloadOpenClawZip(updatedLaunch, includeApiKey);
    toast.success("Pack downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Edit & Regenerate Pack
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Edit Runtime Settings
          </DialogTitle>
          <DialogDescription>
            Update your agent's runtime settings and regenerate the OpenClaw pack.
            This does NOT change your Moltbook public bio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Personality */}
          <div className="space-y-2">
            <Label htmlFor="personality">Personality (Runtime)</Label>
            <Textarea
              id="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Agent personality and behavior..."
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {personality.length}/500 characters
            </p>
          </div>

          {/* Posting Frequency */}
          <div className="space-y-2">
            <Label htmlFor="posting-freq">Posting Frequency</Label>
            <Select value={postingFrequency} onValueChange={setPostingFrequency}>
              <SelectTrigger id="posting-freq">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily_1">1 post/day</SelectItem>
                <SelectItem value="daily_2">2 posts/day</SelectItem>
                <SelectItem value="weekly_3">3 posts/week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Community */}
          <div className="space-y-2">
            <Label htmlFor="target-community">Target Community (Optional)</Label>
            <Input
              id="target-community"
              value={targetCommunity}
              onChange={(e) => setTargetCommunity(e.target.value)}
              placeholder="e.g., crypto, memes, tech..."
            />
          </div>

          {/* Allow Token Mention */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="token-mention">Allow Token Mentions</Label>
              <p className="text-xs text-muted-foreground">
                Let the agent mention ${launch.token_symbol} in posts
              </p>
            </div>
            <Switch
              id="token-mention"
              checked={allowTokenMention}
              onCheckedChange={setAllowTokenMention}
            />
          </div>

          {/* Include API Key Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-secondary/30">
            <div className="space-y-0.5">
              <Label htmlFor="include-api">Include API Key in Download</Label>
              <p className="text-xs text-muted-foreground">
                ⚠️ Keep the zip secure if enabled
              </p>
            </div>
            <Switch
              id="include-api"
              checked={includeApiKey}
              onCheckedChange={setIncludeApiKey}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Download Pack
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};