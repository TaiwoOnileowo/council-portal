interface Props {
  step: number;
  totalSteps: number;
}

export default function StepIndicator({ step, totalSteps }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                step >= s ? "bg-portal-accent" : "bg-portal-border"
              }`}
            />
            {i < totalSteps - 1 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  step > s ? "bg-portal-accent" : "bg-portal-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-portal-muted ml-1">
        Step {step} of {totalSteps}
      </span>
    </div>
  );
}
