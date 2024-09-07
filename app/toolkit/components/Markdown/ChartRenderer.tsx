import Chart from "chart.js/auto";
import { memo, useEffect, useRef, useState } from "react";

export const ChartRenderer = memo(({ config }: { config: string }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseConfig = (configString: string) => {
      try {
        // Create a new Function that returns the parsed config
        const configFunction = new Function(`return (${configString})`);
        const parsedConfig = configFunction();

        // Disable animations
        parsedConfig.options = {
          ...parsedConfig.options,
          animation: false,
          transitions: {
            active: {
              animation: {
                duration: 0,
              },
            },
          },
        };
        return parsedConfig;
      } catch (e) {
        console.error("Error parsing config", e);
        setError("Invalid configuration");
        return null;
      }
    };

    const createOrUpdateChart = (parsedConfig: any) => {
      if (!chartRef.current) return;

      const ctx = chartRef.current.getContext("2d");
      if (!ctx) return;

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      try {
        chartInstanceRef.current = new Chart(ctx, parsedConfig);
      } catch (e) {
        setError("Error creating chart");
      }
    };

    const parsedConfig = parseConfig(config);
    if (parsedConfig) {
      createOrUpdateChart(parsedConfig);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [config]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return <canvas ref={chartRef} />;
});
