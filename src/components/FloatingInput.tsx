import type { InputHTMLAttributes, ReactNode, Ref } from 'react'

interface FloatingInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  id: string
  label: string
  icon: ReactNode
  trailing?: ReactNode
  ref?: Ref<HTMLInputElement>
}

// The label sits inside the field and floats up on focus or when filled. The CSS needs
// `:placeholder-shown` to know whether the field is empty, so a single space stands in for a
// placeholder — nothing is rendered, and no hard-coded copy ships.
export function FloatingInput({
  id,
  label,
  icon,
  trailing,
  className,
  ref,
  ...inputProps
}: FloatingInputProps) {
  return (
    <div className="float-field">
      <span className="float-field__icon" aria-hidden="true">
        {icon}
      </span>
      <input
        {...inputProps}
        ref={ref}
        id={id}
        placeholder=" "
        className={`input float-field__input${trailing ? ' float-field__input--trailing' : ''}${className ? ` ${className}` : ''}`}
      />
      <label className="float-field__label" htmlFor={id}>
        {label}
      </label>
      {trailing}
    </div>
  )
}
