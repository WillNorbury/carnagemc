import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiTagInputProps {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  capitalize?: boolean;
}

export function MultiTagInput({
  values,
  onChange,
  placeholder,
  suggestions = [],
  className,
  capitalize,
}: MultiTagInputProps) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...values, v]);
    setDraft("");
  };

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  const remainingSuggestions = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className={cn("gap-1", capitalize && "capitalize")}>
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="hover:text-destructive"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
        placeholder={placeholder ?? "Type and press Enter"}
      />
      {remainingSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={cn(
                "text-xs px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors",
                capitalize && "capitalize",
              )}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
