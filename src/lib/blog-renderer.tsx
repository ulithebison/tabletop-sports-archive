/* eslint-disable @next/next/no-img-element */
import React from "react";

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match: **bold**, *italic*, [text](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold**
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      nodes.push(<em key={key++}>{match[4]}</em>);
    } else if (match[5]) {
      // [text](url)
      nodes.push(
        <a
          key={key++}
          href={match[7]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors"
          style={{ color: "var(--color-text-link)" }}
        >
          {match[6]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function BlogBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n\n+/);

  return (
    <div className="space-y-5">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // ![alt](url) — markdown image
        const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
          return (
            <figure key={i} className="my-6">
              <img
                src={imgMatch[2]}
                alt={imgMatch[1]}
                className="w-full rounded-md"
                loading="lazy"
              />
              {imgMatch[1] && (
                <figcaption
                  className="text-xs mt-2 text-center"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {imgMatch[1]}
                </figcaption>
              )}
            </figure>
          );
        }

        // Bare URL that's an image
        if (IMAGE_EXT.test(trimmed) && /^https?:\/\//.test(trimmed)) {
          return (
            <figure key={i} className="my-6">
              <img
                src={trimmed}
                alt=""
                className="w-full rounded-md"
                loading="lazy"
              />
            </figure>
          );
        }

        // Regular paragraph — handle line breaks within
        const lines = trimmed.split(/\n/);
        return (
          <p
            key={i}
            className="text-base leading-relaxed"
            style={{
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-lora)",
            }}
          >
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
