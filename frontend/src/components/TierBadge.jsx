const TIER_LABELS = {
  1: 'Tier 1 · Mild',
  2: 'Tier 2 · Moderate',
  3: 'Tier 3 · High',
};

export default function TierBadge({ tier }) {
  return (
    <span className={`badge tier-${tier}`}>
      <span className="dot" />
      {TIER_LABELS[tier] || `Tier ${tier}`}
    </span>
  );
}
