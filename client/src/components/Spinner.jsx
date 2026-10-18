const Spinner = ({ size = 18, className = '' }) => (
  <span
    className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 ${className}`}
    style={{ width: size, height: size }}
  />
);

export default Spinner;