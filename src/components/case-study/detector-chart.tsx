import { ad8317Datasheet, detectorReadings } from "@/data/detector-bench-test";

type DetectorChartProps = {
  caption?: string;
};

const WIDTH = 640;
const HEIGHT = 380;
const PAD = { top: 48, right: 24, bottom: 56, left: 76 };
const X_MIN = -55;
const X_MAX = -10;
const Y_MIN = 0.4;
const Y_MAX = 1.6;
const X_TICKS = [-55, -50, -45, -40, -35, -30, -25, -20, -15, -10];
const Y_TICKS = [0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6];

function x(dbm: number) {
  return PAD.left + ((dbm - X_MIN) / (X_MAX - X_MIN)) * (WIDTH - PAD.left - PAD.right);
}

function y(volts: number) {
  return PAD.top + ((Y_MAX - volts) / (Y_MAX - Y_MIN)) * (HEIGHT - PAD.top - PAD.bottom);
}

// Data lives in a typed module because next-mdx-remote strips JS expressions (arrays, negatives) from MDX props.
export function DetectorChart({ caption }: DetectorChartProps) {
  const { label: datasheetLabel, slopeVoltsPerDb, interceptDbm } = ad8317Datasheet;
  const points = detectorReadings;
  const datasheetAt = (dbm: number) => slopeVoltsPerDb * (dbm - interceptDbm);

  return (
    <figure className="cs-figure">
      <svg
        className="cs-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Detector output voltage against input power: measured points compared with ${datasheetLabel}`}
      >
        <g className="cs-chart-legend" transform={`translate(${PAD.left}, 20)`}>
          <line x1={0} y1={0} x2={22} y2={0} className="cs-chart-ref" />
          <text x={30} y={4}>{datasheetLabel}</text>
          <circle cx={360} cy={0} r={5} className="cs-chart-point" />
          <text x={372} y={4}>Measured</text>
        </g>

        {Y_TICKS.map((tick) => (
          <g key={`y${tick}`}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className="cs-chart-grid" />
            <text x={PAD.left - 10} y={y(tick) + 4} textAnchor="end" className="cs-chart-tick">
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        {X_TICKS.map((tick) => (
          <text key={`x${tick}`} x={x(tick)} y={HEIGHT - PAD.bottom + 20} textAnchor="middle" className="cs-chart-tick">
            {tick}
          </text>
        ))}
        <text x={(PAD.left + WIDTH - PAD.right) / 2} y={HEIGHT - 10} textAnchor="middle" className="cs-chart-axis">
          Input power (dBm)
        </text>
        <text
          transform={`translate(18, ${(PAD.top + HEIGHT - PAD.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="cs-chart-axis"
        >
          VOUT (V)
        </text>

        <line
          x1={x(X_MIN)}
          y1={y(datasheetAt(X_MIN))}
          x2={x(X_MAX)}
          y2={y(datasheetAt(X_MAX))}
          className="cs-chart-ref"
        />

        {points.map((point) => (
          <g key={point.dbm}>
            <circle cx={x(point.dbm)} cy={y(point.volts)} r={6} className="cs-chart-point">
              <title>
                {`${point.dbm} dBm: measured ${point.volts.toFixed(3)} V, datasheet ${datasheetAt(point.dbm).toFixed(3)} V`}
              </title>
            </circle>
          </g>
        ))}
      </svg>
      {caption ? <figcaption className="cs-figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}
