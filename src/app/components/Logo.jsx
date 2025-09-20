export default function Logo({ size = 28, className = "" }) {
  return (
    <div
      className={`inline-flex items-center justify-center text-[--color-accent] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* simple gear-mark */}
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 8.5a3.5 3.5 0 1 1 0 7.001A3.5 3.5 0 0 1 12 8.5Zm8.49 2.306a8.1 8.1 0 0 1 .02 2.388l2.06 1.6a.7.7 0 0 1 .16.92l-1.95 3.378a.7.7 0 0 1-.85.315l-2.44-.99a8.6 8.6 0 0 1-2.06 1.196l-.37 2.6a.7.7 0 0 1-.69.597h-3.9a.7.7 0 0 1-.69-.597l-.37-2.6A8.6 8.6 0 0 1 6.51 19.4l-2.44.99a.7.7 0 0 1-.85-.315L1.27 16.7a.7.7 0 0 1 .16-.92l2.06-1.6a8.1 8.1 0 0 1 .02-2.388l-2.08-1.62a.7.7 0 0 1-.16-.92l1.95-3.378a.7.7 0 0 1 .85-.315l2.44.99A8.6 8.6 0 0 1 8.51 3.91l.37-2.6A.7.7 0 0 1 9.57.713h3.9a.7.7 0 0 1 .69.597l.37 2.6a8.6 8.6 0 0 1 2.06 1.196l2.44-.99a.7.7 0 0 1 .85.315l1.95 3.378a.7.7 0 0 1-.16.92l-2.06 1.6Z"/>
      </svg>
    </div>
  );
}
