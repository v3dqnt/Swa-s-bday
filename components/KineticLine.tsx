import { Fragment } from "react";

/** Plain text of a line, without *highlight* markers. */
export const plain = (text: string) => text.replaceAll("*", "");

// Splits a line into masked words (or letters, for titles) so each piece can be
// animated or placed on its own. Spaces sit between word wrappers so lines wrap.
// Words wrapped in *asterisks* get a highlighter bar behind them.
export default function KineticLine({ text, className, letters }: { text: string; className: string; letters?: boolean }) {
  const words = text.split(" ");
  return (
    <p className={className} aria-label={plain(text)}>
      {words.map((raw, i) => {
        const hl = raw.includes("*");
        const w = plain(raw);
        return (
          <Fragment key={i}>
            <span className={`word${hl ? " hl" : ""}`} aria-hidden="true">
              {hl && <span className="hl-bg" />}
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
        );
      })}
    </p>
  );
}
