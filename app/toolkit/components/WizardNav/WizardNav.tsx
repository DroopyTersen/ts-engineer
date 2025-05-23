import { Button } from "~/shadcn/components/ui/button";

export type WizardStep = {
  id: string;
  name: string;
};

type WizardNavProps = {
  steps: WizardStep[];
  currentStep: string;
  onChange: (stepId: string) => void;
};

export function WizardNav({ steps, currentStep, onChange }: WizardNavProps) {
  return (
    <nav aria-label="Progress">
      <ol
        role="list"
        className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0"
      >
        {steps.map((step, stepIdx) => {
          const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
          const status: "active" | "inactive" =
            stepIdx === currentStepIndex ? "active" : "inactive";

          return (
            <StepItem
              key={step.name}
              step={step}
              status={status}
              onChange={onChange}
              isLastStep={stepIdx === steps.length - 1}
            />
          );
        })}
      </ol>
    </nav>
  );
}

type StepItemProps = {
  step: WizardStep;
  status: "active" | "inactive";
  onChange: (stepId: string) => void;
  isLastStep: boolean;
};

function StepItem({ step, status, onChange, isLastStep }: StepItemProps) {
  let buttonClass = "group flex items-center my-4 w-full hover:bg-transparent ";
  let circleClass =
    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ";
  let textClass = "ml-4 text-sm font-medium ";
  let liClass = "relative md:flex md:flex-1";
  let circleTextClass = "text-slate-900";

  if (status === "active") {
    buttonClass += "";
    circleClass += "bg-slate-900 group-hover:bg-slate-800";
    circleTextClass = "text-white";
    textClass += "text-gray-900";
  } else {
    circleClass += "border-2 border-gray-300 group-hover:border-gray-400";
    textClass += "text-gray-500 group-hover:text-gray-900";
  }

  return (
    <li className={liClass}>
      <Button
        variant="ghost"
        className={buttonClass}
        onClick={() => onChange(step.id)}
        {...(status === "active" ? { "aria-current": "step" } : {})}
      >
        <span className="flex items-center px-2 py-0 text-sm font-medium">
          <span className={circleClass}>
            <span className={circleTextClass}>{step.id}</span>
          </span>
          <span className={textClass}>{step.name}</span>
        </span>
        {!isLastStep && <ArrowSeparator />}
      </Button>
    </li>
  );
}

function ArrowSeparator() {
  return (
    <div
      className="absolute right-0 top-0 hidden h-full w-5 md:block"
      aria-hidden="true"
    >
      <svg
        className="h-full w-full text-gray-300"
        viewBox="0 0 22 80"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 -2L20 40L0 82"
          vectorEffect="non-scaling-stroke"
          stroke="currentcolor"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
