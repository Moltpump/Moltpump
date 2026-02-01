import { FC, useState } from "react";
import { Launch } from "@/types/launch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/CopyButton";
import {
  Download,
  Terminal,
  FileText,
  Brain,
  Heart,
  Wrench,
  Key,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { buildOpenClawPack, downloadOpenClawZip } from "@/lib/openclawPack";

interface Props {
  launch: Launch;
}

const FILE_TABS = [
  { key: "IDENTITY.md", label: "Identity", icon: FileText },
  { key: "SOUL.md", label: "Soul", icon: Brain },
  { key: "HEARTBEAT.md", label: "Heartbeat", icon: Heart },
  { key: "TOOLS.md", label: "Tools", icon: Wrench },
  { key: ".env.example", label: ".env", icon: Key },
] as const;

export const OpenClawPack: FC<Props> = ({ launch }) => {
  const [includeApiKey, setIncludeApiKey] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("IDENTITY.md");

  // Generate pack files (regenerate when includeApiKey changes for .env preview)
  const files = buildOpenClawPack(launch, { includeApiKey });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadOpenClawZip(launch, includeApiKey);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Terminal className="h-5 w-5 text-primary" />
          Run Your Agent
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Download the Agent Pack and run it with your preferred runtime.{" "}
          <span className="text-xs">
            (Recommended:{" "}
            <a
              href="https://openclaw.bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              OpenClaw
              <ExternalLink className="h-3 w-3" />
            </a>
            )
          </span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            <Switch
              id="include-api-key"
              checked={includeApiKey}
              onCheckedChange={setIncludeApiKey}
            />
            <div>
              <Label htmlFor="include-api-key" className="cursor-pointer">
                Include API Key in download
              </Label>
              {includeApiKey && (
                <p className="text-xs text-warning flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Keep the zip secure—it contains your API key
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Generating..." : "Download Pack (.zip)"}
          </Button>
        </div>

        {/* File Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-secondary/30 p-1">
            {FILE_TABS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/20"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.slice(0, 4)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {FILE_TABS.map(({ key }) => (
            <TabsContent key={key} value={key} className="mt-4">
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-secondary p-4 text-sm whitespace-pre-wrap font-mono max-h-80 overflow-y-auto">
                  {files[key as keyof typeof files]}
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton
                    value={files[key as keyof typeof files]}
                    label={key}
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Setup Instructions */}
        <div className="mt-6 p-4 rounded-lg border border-border bg-card">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            Quick Setup
          </h4>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
            <li>
              <strong className="text-foreground">Install OpenClaw</strong>
              <div className="mt-1.5 ml-4 space-y-1">
                <div>
                  <span className="text-xs text-muted-foreground">macOS/Linux:</span>{" "}
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                    curl -fsSL https://openclaw.ai/install.sh | bash
                  </code>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Windows (PowerShell):</span>{" "}
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                    iwr -useb https://openclaw.ai/install.ps1 | iex
                  </code>
                </div>
              </div>
            </li>
            <li>
              <strong className="text-foreground">Unzip the agent pack</strong> into your OpenClaw workspace folder{" "}
              <span className="text-xs">(default: <code className="bg-secondary px-1 py-0.5 rounded">~/.openclaw/workspace</code>)</span>
            </li>
            <li>
              <strong className="text-foreground">Set your API key</strong> in{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">~/.openclaw/.env</code>
            </li>
            <li>
              <strong className="text-foreground">Start OpenClaw:</strong>{" "}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">
                openclaw dashboard
              </code>
            </li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Once running, the agent will post automatically based on HEARTBEAT.md rules.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
