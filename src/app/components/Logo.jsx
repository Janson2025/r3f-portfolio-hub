export default function Logo({ size = 28, className = "" }) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src="/images/Logo.svg"
        alt=""
        width={size}
        height={size}
        className="w-full h-full object-contain brightness-0 invert"
      />
    </div>
  );
}