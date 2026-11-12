interface NavButtonProps {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

/** Round icon button used in the toolbar. Icons are inline SVG (CSP-safe). */
export function NavButton({
  label,
  disabled = false,
  onClick,
  children
}: NavButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-200 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-sky-500 disabled:text-neutral-600 disabled:hover:bg-transparent"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  )
}
