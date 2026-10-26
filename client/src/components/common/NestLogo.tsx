// The Raptor Nest logo, drawn in the current text color so it works on the
// navy header, light pages and dark mode alike (e.g. className="h-10 text-lasa-white")
function NestLogo({ className = '' }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="The Raptor Nest logo"
      className={`inline-block aspect-[4/3] shrink-0 bg-current ${className}`}
      style={{
        maskImage: 'url(/brand/nest.svg)',
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
  )
}

export default NestLogo
