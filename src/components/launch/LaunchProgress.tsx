import { FC } from "react";
import { LaunchStep } from "@/types/launch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileCode,
  Pen,
  Loader2,
  Bot,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RetryableStep = "uploading_metadata" | "building_tx" | "awaiting_signature" | "confirming" | "registering_agent";

interface Props {
  currentStep: LaunchStep;
  error?: string;
  failedStep?: RetryableStep;
  onRetry?: () => void;
  onRetryMoltbook?: () => void;
}

const steps = [
  { id: "uploading_metadata", label: "Uploading to IPFS", icon: Upload },
  { id: "building_tx", label: "Building Transaction", icon: FileCode },
  { id: "awaiting_signature", label: "Awaiting Signature", icon: Pen },
  { id: "confirming", label: "Confirming on Solana", icon: Loader2 },
  { id: "registering_agent", label: "Registering Agent", icon: Bot },
] as const;

const getStepStatus = (
  stepId: string,
  currentStep: LaunchStep,
  failedStep?: RetryableStep
): "pending" | "active" | "complete" | "error" => {
  const stepOrder = steps.findIndex((s) => s.id === stepId);
  const currentOrder = steps.findIndex((s) => s.id === currentStep);

  if (currentStep === "error" && failedStep) {
    const failedOrder = steps.findIndex((s) => s.id === failedStep);
    if (stepOrder < failedOrder) return "complete";
    if (stepOrder === failedOrder) return "error";
    return "pending";
  }

  if (currentStep === "error") {
    if (stepOrder < currentOrder) return "complete";
    if (stepOrder === currentOrder) return "error";
    return "pending";
  }

  if (currentStep === "success") return "complete";
  if (stepOrder < currentOrder) return "complete";
  if (stepOrder === currentOrder) return "active";
  return "pending";
};

const getRetryLabel = (failedStep?: RetryableStep): string => {
  switch (failedStep) {
    case "uploading_metadata":
      return "Retry Upload";
    case "building_tx":
      return "Rebuild Transaction";
    case "awaiting_signature":
      return "Retry Signing";
    case "confirming":
      return "Retry Confirmation";
    case "registering_agent":
      return "Retry Moltbook";
    default:
      return "Retry";
  }
};

export const LaunchProgress: FC<Props> = ({ currentStep, error, failedStep, onRetry, onRetryMoltbook }) => {
  return (
    <Card className="border-border bg-card glow-primary">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          {currentStep === "success"
            ? "🎉 Launch Successful!"
            : currentStep === "error"
            ? "Launch Failed"
            : "Launching Your Agent..."}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id, currentStep, failedStep);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center gap-4">
                {/* Step indicator */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    status === "complete" &&
                      "border-primary bg-primary text-primary-foreground",
                    status === "active" &&
                      "border-primary bg-primary/10 text-primary",
                    status === "pending" && "border-muted bg-muted text-muted-foreground",
                    status === "error" &&
                      "border-destructive bg-destructive/10 text-destructive"
                  )}
                >
                  {status === "complete" ? (
                    <Check className="h-5 w-5" />
                  ) : status === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : status === "active" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Step label */}
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-medium",
                      status === "complete" && "text-primary",
                      status === "active" && "text-foreground",
                      status === "pending" && "text-muted-foreground",
                      status === "error" && "text-destructive"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message and retry */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {getRetryLabel(failedStep)}
                </Button>
              )}
              {failedStep === "registering_agent" && onRetryMoltbook && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetryMoltbook}
                  className="gap-2"
                >
                  <Bot className="h-4 w-4" />
                  Retry Moltbook Only
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
