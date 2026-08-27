export interface TabDefinition<T extends string> {
  id: T;
  label: string;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: readonly TabDefinition<T>[];
  active: T;
  onSelect: (id: T) => void;
}): JSX.Element {
  return (
    <nav className="lf-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          className={`lf-tab${tab.id === active ? ' lf-tab--active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
