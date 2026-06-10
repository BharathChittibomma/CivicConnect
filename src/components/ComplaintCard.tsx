import { Link } from "@tanstack/react-router";
import { StatusBadge } from "./StatusBadge";
import { categoryIcon, categoryLabel, type StatusValue } from "@/lib/civic";
import { MapPin, Clock } from "lucide-react";

interface Props {
  complaint: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: StatusValue;
    image_url: string | null;
    address: string | null;
    created_at: string;
  };
}

export function ComplaintCard({ complaint: c }: Props) {
  return (
    <Link
      to="/complaint/$id"
      params={{ id: c.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/50 hover:shadow-lg"
    >
      {c.image_url ? (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={c.image_url}
            alt={c.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-video grid place-items-center bg-muted text-5xl">
          {categoryIcon(c.category)}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {categoryIcon(c.category)} {categoryLabel(c.category)}
          </span>
          <StatusBadge status={c.status} />
        </div>
        <h3 className="font-display font-semibold leading-snug line-clamp-1">{c.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          {c.address && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.address.slice(0, 30)}</span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            {new Date(c.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
