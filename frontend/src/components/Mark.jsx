/** Brand mark: a three-node research graph glyph. */
export default function Mark({ size = 26, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="16" r="5.5" fill="var(--accent)" />
      <circle
        cx="22"
        cy="10"
        r="5.5"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
      />
      <circle
        cx="22"
        cy="22"
        r="5.5"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
      />
      <path
        d="M14 14 L19 11 M14 18 L19 21"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
