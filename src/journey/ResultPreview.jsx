export function ResultPreview({ payload, example, showLetter = true }) {
  return <div className="journey-preview">
    <p className="journey-caption">{example ? "Example inputs" : "Your result"}</p>
    <dl>{payload.metrics.map(([label, value]) =>
      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
    )}</dl>
    {showLetter && payload.letter && <details><summary>Preview your letter</summary><p className="journey-letter">{payload.letter}</p></details>}
  </div>;
}
