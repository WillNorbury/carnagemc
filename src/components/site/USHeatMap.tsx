import { ComposableMap, Geographies, Geography } from "react-simple-maps";

type Row = { state: string; deaths: number; perMillion: number };

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const heatColor = (t: number) => {
  const clamped = Math.max(0, Math.min(1, t));
  const hue = (1 - clamped) * 120;
  return `hsl(${hue} 70% 45%)`;
};

interface Props {
  rows: Row[];
  valueKey: "deaths" | "perMillion";
}

const USHeatMap = ({ rows, valueKey }: Props) => {
  const lookup = new Map(rows.map((r) => [r.state.toLowerCase(), r]));
  const max = Math.max(...rows.map((r) => r[valueKey]));

  return (
    <div className="w-full">
      <ComposableMap projection="geoAlbersUsa" width={975} height={610} style={{ width: "100%", height: "auto" }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name: string = geo.properties.name;
              const row = lookup.get(name.toLowerCase());
              const v = row ? row[valueKey] : 0;
              const t = max > 0 ? v / max : 0;
              const fill = row ? heatColor(t) : "hsl(var(--muted))";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="hsl(var(--background))"
                  strokeWidth={0.75}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", filter: "brightness(1.15)" },
                    pressed: { outline: "none" },
                  }}
                >
                  <title>
                    {name}: {row ? (valueKey === "deaths" ? `${row.deaths} deaths` : `${row.perMillion.toFixed(1)} per million`) : "no data"}
                  </title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};

export default USHeatMap;
