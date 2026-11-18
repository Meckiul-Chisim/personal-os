/**
 * The Personal OS logo. It loads /favicon.svg, so the browser tab icon and the app share
 * one source file: edit public/favicon.svg and both change together.
 */
export function Logo({ size = 38, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      className={`po-logo ${className}`.trim()}
      src="/favicon.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}
