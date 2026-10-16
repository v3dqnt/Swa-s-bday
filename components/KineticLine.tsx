// Splits a line into masked words (or letters, for titles) so GSAP can slide
// each piece out from behind its mask. Spaces stay real text for wrapping.
export default function KineticLine({ text, className, letters }: { text: string; className: string; letters?: boolean }) {
  const words = text.split(" ");
  return (
    <p className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="mask">
            {letters
              ? [...w].map((ch, j) => (
                  <span key={j} className="piece">
                    {ch}
                  </span>
                ))
              : <span className="piece">{w}</span>}
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </p>
  );
}
