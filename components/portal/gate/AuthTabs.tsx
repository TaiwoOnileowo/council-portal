interface Tab {
  label: string;
  active: boolean;
  onClick?: () => void;
}

interface AuthTabsProps {
  tabs: Tab[];
}

export default function AuthTabs({ tabs }: AuthTabsProps) {
  return (
    <div className="flex border-b border-portal-border mb-8">
      {tabs.map((tab) =>
        tab.onClick ? (
          <button
            key={tab.label}
            onClick={tab.onClick}
            className={`pb-3 px-1 mr-8 last:mr-0 text-[15px] font-medium transition-colors ${
              tab.active
                ? "border-b-2 border-portal-accent text-portal-text"
                : "text-portal-muted hover:text-portal-text2"
            }`}
          >
            {tab.label}
          </button>
        ) : (
          <span
            key={tab.label}
            className="pb-3 px-1 text-[15px] font-medium border-b-2 border-portal-accent text-portal-text"
          >
            {tab.label}
          </span>
        )
      )}
    </div>
  );
}
