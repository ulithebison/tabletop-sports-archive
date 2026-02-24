"use client";

import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import type { FdfGame, FdfTeam, PlayerGameStats, WinProbabilitySnapshot, WPAnalytics } from "@/lib/fdf/types";
import { generateGameHeadline } from "@/lib/fdf/headline-generator";
import { ShareableGameCard } from "./ShareableGameCard";
import { Download, Copy, Share2, Image } from "lucide-react";

interface GameCardExportProps {
  game: FdfGame;
  homeTeam: FdfTeam;
  awayTeam: FdfTeam;
  playerStats: PlayerGameStats[];
  wpSnapshots: WinProbabilitySnapshot[];
  wpAnalytics: WPAnalytics;
  mvp: PlayerGameStats | null;
}

export function GameCardExport({
  game,
  homeTeam,
  awayTeam,
  playerStats,
  wpSnapshots,
  wpAnalytics,
  mvp,
}: GameCardExportProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<"social" | "instagram">("social");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headline = generateGameHeadline(game, homeTeam, awayTeam, wpAnalytics);

  const topPlayers = {
    home: playerStats.filter((p) => p.teamId === homeTeam.id).slice(0, 5),
    away: playerStats.filter((p) => p.teamId === awayTeam.id).slice(0, 5),
  };

  const wpMiniData = wpSnapshots.map((s) => ({
    driveNumber: s.afterDriveNumber,
    homeWP: s.homeWinProbability,
  }));

  const cardWidth = format === "social" ? 1200 : 1080;
  const cardHeight = format === "social" ? 630 : 1080;
  const previewScale = Math.min(600 / cardWidth, 400 / cardHeight);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setLoading(true);
    setError(null);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: cardWidth,
        height: cardHeight,
        pixelRatio: 2,
        cacheBust: true,
        fontEmbedCSS: '',
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (e) {
      setError("Failed to generate image. Please try again.");
      console.error("Image generation failed:", e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cardWidth, cardHeight]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: cardWidth,
        height: cardHeight,
        pixelRatio: 2,
        cacheBust: true,
        fontEmbedCSS: '',
      });
      const link = document.createElement("a");
      link.download = `fdf-${awayTeam.abbreviation}-vs-${homeTeam.abbreviation}-${game.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      setError("Download failed. Please try again.");
      console.error("Download failed:", e);
    } finally {
      setLoading(false);
    }
  }, [cardWidth, cardHeight, awayTeam.abbreviation, homeTeam.abbreviation, game.id]);

  const handleCopy = useCallback(async () => {
    const blob = await generateImage();
    if (!blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setError(null);
    } catch {
      setError("Copy to clipboard not supported in this browser.");
    }
  }, [generateImage]);

  const handleShare = useCallback(async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File(
      [blob],
      `fdf-${awayTeam.abbreviation}-vs-${homeTeam.abbreviation}.png`,
      { type: "image/png" },
    );
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${awayTeam.abbreviation} vs ${homeTeam.abbreviation} - FDF Game`,
        });
      } else {
        setError("Sharing not supported on this device.");
      }
    } catch (e) {
      // User cancelled share — not an error
      if ((e as DOMException)?.name !== "AbortError") {
        setError("Share failed.");
      }
    }
  }, [generateImage, awayTeam.abbreviation, homeTeam.abbreviation]);

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function";

  return (
    <div
      className="rounded-lg p-4 space-y-4"
      style={{ backgroundColor: "var(--fdf-bg-card)", border: "1px solid var(--fdf-border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image size={14} style={{ color: "var(--fdf-accent)" }} />
          <h3
            className="text-xs font-bold font-fdf-mono uppercase tracking-wider"
            style={{ color: "var(--fdf-accent)" }}
          >
            Game Card
          </h3>
        </div>

        {/* Format toggle */}
        <div className="flex gap-1">
          {(["social", "instagram"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className="px-3 py-1 rounded text-[10px] font-fdf-mono font-bold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: format === f ? "var(--fdf-accent)" : "transparent",
                color: format === f ? "#000" : "var(--fdf-text-muted)",
                border: `1px solid ${format === f ? "var(--fdf-accent)" : "var(--fdf-border)"}`,
              }}
            >
              {f === "social" ? "1200×630" : "1080×1080"}
            </button>
          ))}
        </div>
      </div>

      {/* Preview (scaled down) */}
      <div
        className="overflow-hidden rounded-md flex justify-center"
        style={{ backgroundColor: "#0a0a0f" }}
      >
        <div
          style={{
            transform: `scale(${previewScale})`,
            transformOrigin: "top center",
            width: cardWidth,
            height: cardHeight,
            marginBottom: -(cardHeight * (1 - previewScale)),
          }}
        >
          <ShareableGameCard
            ref={cardRef}
            game={game}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            headline={headline}
            topPlayers={topPlayers}
            wpMiniData={wpMiniData}
            mvp={mvp}
            format={format}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-fdf-mono font-bold transition-colors"
          style={{
            backgroundColor: "var(--fdf-accent)",
            color: "#000",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Download size={14} />
          {loading ? "Exporting..." : "Download PNG"}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-fdf-mono font-medium transition-colors"
          style={{
            color: "var(--fdf-text-secondary)",
            border: "1px solid var(--fdf-border)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Copy size={14} />
          Copy
        </button>

        {canShare && (
          <button
            type="button"
            onClick={handleShare}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-fdf-mono font-medium transition-colors"
            style={{
              color: "var(--fdf-text-secondary)",
              border: "1px solid var(--fdf-border)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Share2 size={14} />
            Share
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs font-fdf-mono" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
