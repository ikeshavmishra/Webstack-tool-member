function TextField({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-xs font-semibold tracking-[0.06em] text-text-200 uppercase">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-12 rounded-2xl border border-white/10 bg-white/3 px-4 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/60 focus:bg-white/6 focus:ring-4 focus:ring-brand-500/20"
      />
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </label>
  )
}

export default TextField
