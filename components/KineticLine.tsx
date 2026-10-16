import { Fragment } from "react";

// Splits a line into masked words (or letters, for titles) so each piece can be
// animated or placed on its own. Spaces sit between word wrappers so lines wrap.
export default function KineticLine({ text, className, letters }: { text: string; className: string; letters?: boolean }) {
  const words = text.split(" ");
  return (
    <p className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="word" aria-hidden="true">
            <span className="mask">
              {letters
                ? [...w].map((ch, j) => (
                    <span key={j} className="piece">
                      {ch}
                    </span>
                  ))
                : <span className="piece">{w}</span>}
            </span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </p>
  );
}
