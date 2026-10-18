const FilterBar = ({ children, className = '' }) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>
);

export const FilterSelect = ({ value, onChange, options, placeholder = 'All' }) => (
  <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="input">
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

export default FilterBar;