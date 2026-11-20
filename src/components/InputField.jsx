import '../styles/components.css';

/**
 * Reusable InputField component with label, validation error, and
 * accessibility attributes.
 *
 * Props:
 *   label       — Text label displayed above the input
 *   id          — Unique HTML id (also used for htmlFor)
 *   type        — Input type (default: 'text')
 *   value       — Controlled value
 *   onChange     — Change handler
 *   placeholder — Placeholder text
 *   error       — Validation error message (empty = no error)
 *   required    — Adds a red asterisk and the required attribute
 *   disabled    — Disables the input
 *   className   — Additional CSS class names
 */
function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <div className={`input-field ${error ? 'input-field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="input-field__label">
          {label}
          {required && <span className="input-field__required">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="input-field__input"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="input-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default InputField;
