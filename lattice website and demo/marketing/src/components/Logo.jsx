export default function Logo({ size = 30 }) {
  return (
    <img
      src="/brand/logo-new.png"
      alt="Lattice logo"
      width={size}
      height={size}
      className="rounded-lg object-cover"
      style={{ width: size, height: size }}
    />
  );
}