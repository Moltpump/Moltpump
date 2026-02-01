import { FC, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
}

export const ImageUpload: FC<Props> = ({ value, onChange }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onChange(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const removeImage = () => {
    onChange(null);
    setPreview(null);
  };

  if (preview) {
    return (
      <Card className="relative overflow-hidden border-border bg-secondary">
        <CardContent className="p-0">
          <div className="relative aspect-square w-full max-w-[200px]">
            <img
              src={preview}
              alt="Token preview"
              className="h-full w-full object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex aspect-square max-w-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 p-4 transition-colors hover:border-primary/50 hover:bg-secondary",
        isDragActive && "border-primary bg-primary/5"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {isDragActive ? (
          <Upload className="h-6 w-6 text-primary" />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? "Drop here" : "Upload Image"}
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
      </div>
    </div>
  );
};
