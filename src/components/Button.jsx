import '../styles/components.css';

/**
 * Reusable Button component.
 *
 * Props:
 *   children  — Button label / content
 *   type      — 'button' | 'submit' | 'reset'  (default: 'button')
 *   variant   — 'primary' | 'secondary' | 'outline' | 'danger'
 *   size      — 'small' | 'medium' | 'large'
 *   disabled  — Boolean
 *   loading   — Shows a spinner and disables the button
 *   onClick   — Click handler
 *   className — Additional CSS class names
 */
function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...rest
}) {
  const classNames = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    loading ? 'btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? <span className="btn__spinner" /> : children}
    </button>
  );
}

export default Button;
