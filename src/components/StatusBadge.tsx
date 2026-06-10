import { STATUS_META, type StatusValue } from "@/lib/civic";
import { cn } from "@/lib/utils";

const toneClasses: Record<string, string> = {
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-info/15 text-info border-info/30",
  success: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status, className }: { status: StatusValue; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[meta.tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function StatusProgress({ status }: { status: StatusValue }) {
  const step = STATUS_META[status].step;
  const steps: { key: StatusValue; label: string }[] = [
    { key: "PENDING", label: "Reported" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "RESOLVED", label: "Resolved" },
  ];
  return (
    <ol className="flex items-center w-full">
      {steps.map((s, i) => {
        const reached = STATUS_META[s.key].step <= step;
        return (
          <li key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold",
                  reached
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border",
                )}
              >
                {i + 1}
              </div>
              <span className={cn("text-xs", reached ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 -mt-5",
                  STATUS_META[steps[i + 1].key].step <= step ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
