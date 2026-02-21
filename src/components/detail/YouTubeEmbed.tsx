interface YouTubeEmbedProps {
  url: string | null;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/,
    /youtube\.com\/embed\/([^&?/\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  if (!url) return null;
  const videoId = getYouTubeId(url);
  if (!videoId) return null;

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: "1px solid var(--color-border-subtle)" }}
    >
      <div className="relative" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Game video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
