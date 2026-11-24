const accents = {
  "route scenario": "route",
  "offer comparison": "offer",
  "crew plan": "crew",
  claim: "claim",
};

export function ResultPreview({ payload, example, showLetter = true, heading: Heading = "h2" }) {
  const primary = payload.metrics.at(-1);
  const supporting = payload.metrics.slice(0, -1);
  const share = payload.revenueCostShare;
  return <div className="journey-preview" data-kind={accents[payload.kind]}>
    <header className="journey-photo">
      <div className="journey-photo-content">
        <Heading className="journey-title">{payload.title}</Heading>
        {example && <span className="journey-example">Example inputs</span>}
        <dl className="journey-lead"><dt>{primary[0]}</dt><dd>{primary[1]}</dd></dl>
      </div>
    </header>
    <div className="journey-ledger">
      <dl className="journey-metrics">{supporting.map(([label,value]) =>
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      )}</dl>
      {Number.isFinite(share) && share >= 0 && share <= 1 && <div className="journey-margin">
        <div className="journey-scale" aria-hidden="true"><span style={{width:share*100+"%"}} /></div>
        <p>{Math.round((1-share)*100)}% of revenue kept as profit</p>
      </div>}
      {showLetter && payload.letter && <details><summary>Preview your letter</summary><p className="journey-letter">{payload.letter}</p></details>}
    </div>
  </div>;
}
