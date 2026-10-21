export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="10" fill="#E11D48" />
      <g fill="#0B0F19">
        <rect x="5" y="13" width="8" height="1.6" rx="0.8" />
        <rect x="19" y="13" width="8" height="1.6" rx="0.8" />
        <rect x="13" y="5" width="1.6" height="8" rx="0.8" />
        <rect x="13" y="19" width="1.6" height="8" rx="0.8" />
      </g>
      <circle cx="4" cy="4" r="2.4" fill="#fff" />
      <circle cx="28" cy="4" r="2.4" fill="#fff" />
      <circle cx="4" cy="28" r="2.4" fill="#fff" />
      <circle cx="28" cy="28" r="2.4" fill="#fff" />
    </svg>
  );
}