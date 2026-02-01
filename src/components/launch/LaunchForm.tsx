import React, { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { LaunchFormData } from "@/types/launch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ImageUpload } from "./ImageUpload";
import { Rocket, Globe, Twitter, Send, Coins, Settings2 } from "lucide-react";

interface Props {
  form: UseFormReturn<LaunchFormData>;
  onSubmit: (data: LaunchFormData) => void;
  isLoading: boolean;
}

export const LaunchForm: FC<Props> = ({ form, onSubmit, isLoading }) => {
  const personalityLength = form.watch("personality")?.length || 0;
  const bioLength = form.watch("moltbookBio")?.length || 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Required Fields */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Rocket className="h-5 w-5 text-primary" />
              Agent + Token Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="agentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., CryptoBot"
                        className="input-focus"
                        maxLength={32}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>1-32 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tokenName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., CryptoBot Token"
                        className="input-focus"
                        maxLength={32}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>1-32 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tokenSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Symbol *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., CBOT"
                      className="bg-secondary/50 border-border uppercase input-focus"
                      maxLength={10}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    1-10 characters, letters and numbers only
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tokenDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your token for Pump.fun..."
                      className="min-h-[80px] bg-secondary/50 border-border resize-none input-focus"
                      maxLength={1000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This description appears on Pump.fun
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Moltbook Bio - NEW */}
            <FormField
              control={form.control}
              name="moltbookBio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moltbook Bio (public) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='One-line bio for Moltbook - e.g. "The #1 agent of $MOLT"'
                      className="input-focus"
                      maxLength={120}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Shown publicly on Moltbook. Keep it short. (1–120 chars)
                    </FormDescription>
                    <span
                      className={`text-xs ${
                        bioLength > 100
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                    >
                      {bioLength}/120
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Agent Personality - for runtime only */}
            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Personality *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your agent's personality, traits, and how it should interact..."
                      className="min-h-[120px] bg-secondary/50 border-border resize-none input-focus"
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>
                      Used in your Agent Pack to control posting behavior. Not shown on Moltbook.
                    </FormDescription>
                    <span
                      className={`text-xs ${
                        personalityLength > 450
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                    >
                      {personalityLength}/500
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Advanced Posting Settings - Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced" className="border-border">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Settings2 className="h-4 w-4 text-primary" />
                    Advanced (Posting)
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="postingFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posting Frequency *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-secondary/50 border-border input-focus">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily_1">1 post/day</SelectItem>
                            <SelectItem value="daily_2">2 posts/day</SelectItem>
                            <SelectItem value="weekly_3">3 posts/week</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often the agent will post on Moltbook
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetCommunity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Community (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., crypto, memes, tech..."
                            className="input-focus"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Focus posts on a specific community or topic
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowTokenMention"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-secondary/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Allow Token Mentions
                          </FormLabel>
                          <FormDescription>
                            If off, the agent avoids mentioning the token.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <FormField
              control={form.control}
              name="imageFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Image (Optional)</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Dev Buy Amount */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Coins className="h-5 w-5 text-primary" />
              Initial Buy (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="devBuyAmountSol"
              render={({ field }) => {
                const [inputValue, setInputValue] = React.useState(
                  field.value ? String(field.value) : ""
                );
                
                return (
                  <FormItem>
                    <FormLabel>Amount of SOL to buy at launch</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          className="bg-secondary/50 border-border pr-14 input-focus"
                          value={inputValue}
                          onChange={(e) => {
                            // Allow typing freely - accept digits, dots, and commas
                            const val = e.target.value.replace(/[^0-9.,]/g, "");
                            setInputValue(val);
                          }}
                          onBlur={() => {
                            // Parse on blur - handle both comma and dot
                            const normalized = inputValue.replace(",", ".");
                            const parsed = parseFloat(normalized);
                            if (isNaN(parsed) || parsed < 0) {
                              field.onChange(0);
                              setInputValue("");
                            } else if (parsed > 85) {
                              field.onChange(85);
                              setInputValue("85");
                            } else {
                              field.onChange(parsed);
                              setInputValue(parsed > 0 ? String(parsed) : "");
                            }
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          SOL
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Buy tokens as the creator when launching (0.00001 - 85 SOL). Leave empty or 0 to skip.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Optional Links */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Globe className="h-5 w-5 text-primary" />
              Social Links (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://yourproject.com"
                      className="input-focus"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="xUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />X (Twitter)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://x.com/yourproject"
                      className="input-focus"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Telegram
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://t.me/yourproject"
                      className="input-focus"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="space-y-2">
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 btn-primary-glow text-primary-foreground font-bold text-lg py-7"
            disabled={isLoading}
          >
            <Rocket className="h-5 w-5" />
            {isLoading ? "Launching..." : "Launch Agent + Token"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Non-custodial — you sign with your wallet. No seed phrases.
          </p>
        </div>
      </form>
    </Form>
  );
};