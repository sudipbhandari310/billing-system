const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
    <div>
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
  </div>
);

export default PageHeader;