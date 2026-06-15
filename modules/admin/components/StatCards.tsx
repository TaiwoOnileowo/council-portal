type StatDef = {
  label: string;
  value: string;
  sub?: string;
};
function StatCard({ stat }: { stat: StatDef }) {
  return (
    <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 flex flex-col justify-between min-h-[120px] hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-medium text-portal-muted">
          {stat.label}
        </span>
      </div>
      <div>
        <div className="flex items-center gap-3">
          <div
            className="w-[3px] rounded-full flex-shrink-0 bg-portal-accent"
            style={{ height: "36px" }}
          />
          <span className="font-heading text-[26px] sm:text-[30px] font-extrabold text-portal-text leading-none tabular-nums">
            {stat.value}
          </span>
        </div>
        {stat.sub && (
          <p className="text-[11px] text-portal-muted mt-2 ml-[15px]">
            {stat.sub}
          </p>
        )}
      </div>
    </div>
  );
}

const DEMO_STATS: StatDef[] = [
  {
    label: "Total Students",
    value: "1,248",
    sub: "registered on portal",
  },
  {
    label: "Total Vendors",
    value: "12",
    sub: "transport",
  },
  {
    label: "Top Vendor",
    value: "Tranex Bus",
    sub: "847 bookings",
  },
  {
    label: "Total Bookings",
    value: "3,421",
    sub: "across all vendors",
  },
];
const StatCards = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
      {DEMO_STATS.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
};

export default StatCards;
