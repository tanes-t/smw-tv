export default function SettingsIcon({ size = 18, className = '' }) {
  return (
    <svg
      className={`settings-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.67 3.46 10.3 2h3.4l.63 1.46 1.3.76 1.56-.28 1.7 2.94-1.02 1.22v1.52l1.02 1.22-1.7 2.94-1.56-.28-1.3.76L13.7 16h-3.4l-.63-1.46-1.3-.76-1.56.28-1.7-2.94 1.02-1.22V8.38L5.11 7.16l1.7-2.94 1.56.28 1.3-.76Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.14" r="2.35" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.8 18.2h6.4M10.4 21h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
