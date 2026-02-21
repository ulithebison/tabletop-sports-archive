import { Download } from "lucide-react";
import type { Game } from "@/lib/types";

interface DownloadLinksProps {
  game: Game;
}

export function DownloadLinks({ game }: DownloadLinksProps) {
  const downloads = [
    { name: game.download_1_name, url: game.download_1_url },
    { name: game.download_2_name, url: game.download_2_url },
    { name: game.download_3_name, url: game.download_3_url },
  ].filter((d) => d.url);

  if (downloads.length === 0) return null;

  return (
    <div
      className="p-5 rounded-md"
      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
    >
      <h3 className="section-label mb-4" style={{ fontSize: "0.7rem" }}>
        Downloads
      </h3>
      <div className="flex flex-col gap-2">
        {downloads.map((d, i) => (
          <a
            key={i}
            href={d.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded transition-colors text-sm font-heading uppercase tracking-wide"
            style={{
              background: "var(--color-bg-muted)",
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-text-secondary)",
            }}
          >
            <Download size={14} style={{ color: "var(--color-accent-primary)" }} />
            {d.name || `Download ${i + 1}`}
          </a>
        ))}
      </div>
    </div>
  );
}
