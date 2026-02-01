import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  label?: string;
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
}

export const CopyButton: FC<Props> = ({
  value,
  label,
  className,
  variant = "ghost",
  size = "icon",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(label ? `${label} copied!` : "Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("transition-colors", className)}
    >
      {copied ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
};
