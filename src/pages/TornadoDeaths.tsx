import { useMemo, useState } from "react";
import { SEO } from "@/components/site/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import USHeatMap from "@/components/site/USHeatMap";

type StateRow = { state: string; deaths: number; perMillion: number; share: number };

const STATES: StateRow[] = [
  { state: "Alabama", deaths: 314, perMillion: 62.5, share: 21.5 },
  { state: "Missouri", deaths: 222, perMillion: 36.1, share: 15.2 },
  { state: "Tennessee", deaths: 134, perMillion: 19.4, share: 9.2 },
  { state: "Mississippi", deaths: 128, perMillion: 43.2, share: 8.8 },
  { state: "Kentucky", deaths: 126, perMillion: 28.0, share: 8.6 },
  { state: "Oklahoma", deaths: 95, perMillion: 24.0, share: 6.5 },
  { state: "Arkansas", deaths: 78, perMillion: 25.9, share: 5.3 },
  { state: "Texas", deaths: 56, perMillion: 1.9, share: 3.8 },
  { state: "Georgia", deaths: 52, perMillion: 4.9, share: 3.6 },
  { state: "North Carolina", deaths: 37, perMillion: 3.5, share: 2.5 },
  { state: "Illinois", deaths: 33, perMillion: 2.6, share: 2.3 },
  { state: "Iowa", deaths: 30, perMillion: 9.4, share: 2.1 },
  { state: "Louisiana", deaths: 26, perMillion: 5.6, share: 1.8 },
  { state: "Indiana", deaths: 25, perMillion: 3.7, share: 1.7 },
  { state: "Ohio", deaths: 15, perMillion: 1.3, share: 1.0 },
  { state: "Florida", deaths: 14, perMillion: 0.7, share: 1.0 },
  { state: "South Carolina", deaths: 12, perMillion: 2.3, share: 0.8 },
  { state: "Virginia", deaths: 11, perMillion: 1.3, share: 0.8 },
  { state: "New York", deaths: 10, perMillion: 0.5, share: 0.7 },
  { state: "Kansas", deaths: 9, perMillion: 3.1, share: 0.6 },
  { state: "Minnesota", deaths: 6, perMillion: 1.1, share: 0.4 },
  { state: "Michigan", deaths: 6, perMillion: 0.6, share: 0.4 },
  { state: "North Dakota", deaths: 5, perMillion: 6.4, share: 0.3 },
  { state: "Massachusetts", deaths: 3, perMillion: 0.4, share: 0.2 },
  { state: "Montana", deaths: 2, perMillion: 1.8, share: 0.1 },
  { state: "Wisconsin", deaths: 2, perMillion: 0.3, share: 0.1 },
  { state: "Nebraska", deaths: 2, perMillion: 1.0, share: 0.1 },
  { state: "Maryland", deaths: 2, perMillion: 0.3, share: 0.1 },
  { state: "Colorado", deaths: 1, perMillion: 0.2, share: 0.1 },
  { state: "New Hampshire", deaths: 1, perMillion: 0.7, share: 0.1 },
  { state: "West Virginia", deaths: 1, perMillion: 0.6, share: 0.1 },
  { state: "South Dakota", deaths: 1, perMillion: 1.1, share: 0.1 },
  { state: "Pennsylvania", deaths: 1, perMillion: 0.1, share: 0.1 },
  { state: "Delaware", deaths: 1, perMillion: 1.0, share: 0.1 },
];

const LOCATIONS = [
  { label: "Mobile / manufactured home", deaths: 541, share: 37.0 },
  { label: "Permanent home", deaths: 491, share: 33.6 },
  { label: "Permanent building (non-home)", deaths: 181, share: 12.4 },
  { label: "Vehicle", deaths: 109, share: 7.5 },
  { label: "Unknown", deaths: 103, share: 7.0 },
  { label: "Outdoors", deaths: 35, share: 2.4 },
];

const STRENGTHS = [
  { label: "EF4 · 166–200 mph", deaths: 506, share: 34.6 },
  { label: "EF3 · 136–165 mph", deaths: 408, share: 27.9 },
  { label: "EF5 · 200+ mph", deaths: 326, share: 22.3 },
  { label: "EF2 · 111–135 mph", deaths: 162, share: 11.1 },
  { label: "EF1 · 86–110 mph", deaths: 53, share: 3.6 },
  { label: "EF0 · 65–85 mph", deaths: 4, share: 0.3 },
];

const DEADLIEST = [
  { date: "May 22, 2011", state: "MO", counties: "Jasper (Joplin)", ef: "EF5", deaths: 158 },
  { date: "Apr 27, 2011", state: "AL", counties: "Marion/Franklin/Lawrence/Limestone/Madison", ef: "EF5", deaths: 72 },
  { date: "Apr 27, 2011", state: "AL", counties: "Tuscaloosa/Jefferson", ef: "EF4", deaths: 64 },
  { date: "Dec 10, 2021", state: "KY", counties: "Graves (Mayfield) + Hopkins, Muhlenberg, Caldwell, Marshall, Fulton, Lyon", ef: "EF4", deaths: 57 },
  { date: "Apr 27, 2011", state: "AL", counties: "DeKalb", ef: "EF5", deaths: 25 },
  { date: "May 20, 2013", state: "OK", counties: "Cleveland (Moore)", ef: "EF5", deaths: 24 },
  { date: "Apr 27, 2011", state: "MS", counties: "Monroe/Marion", ef: "EF5", deaths: 23 },
  { date: "Mar 03, 2019", state: "AL", counties: "Lee (Beauregard)", ef: "EF4", deaths: 23 },
  { date: "Feb 05, 2008", state: "TN", counties: "Sumner-Macon", ef: "EF3", deaths: 22 },
  { date: "Apr 27, 2011", state: "AL", counties: "St. Clair/Calhoun", ef: "EF4", deaths: 22 },
  { date: "May 10, 2008", state: "OK", counties: "Ottawa (Picher) + Newton-Barry (MO)", ef: "EF4", deaths: 21 },
  { date: "Apr 27, 2011", state: "GA", counties: "Catoosa/Hamilton/Bradley", ef: "EF4", deaths: 20 },
  { date: "Mar 03, 2020", state: "TN", counties: "Putnam (Cookeville)", ef: "EF4", deaths: 19 },
  { date: "May 16, 2025", state: "KY", counties: "Laurel / Pulaski", ef: "EF4", deaths: 18 },
  { date: "Mar 24, 2023", state: "MS", counties: "Sharkey/Humphreys (Rolling Fork)", ef: "EF4", deaths: 17 },
  { date: "Apr 27, 2014", state: "AR", counties: "Pulaski-White (Mayflower-Vilonia)", ef: "EF4", deaths: 16 },
  { date: "Dec 11, 2021", state: "KY", counties: "Warren (Bowling Green)", ef: "EF3", deaths: 16 },
  { date: "Apr 27, 2011", state: "AL", counties: "Jackson/DeKalb/Dade", ef: "EF4", deaths: 14 },
  { date: "Feb 05, 2008", state: "AR", counties: "Pope-Izard", ef: "EF4", deaths: 13 },
  { date: "Apr 27, 2011", state: "AL", counties: "Fayette/Walker", ef: "EF4", deaths: 13 },
  { date: "Apr 16, 2011", state: "NC", counties: "Bertie", ef: "EF3", deaths: 12 },
  { date: "Mar 02, 2012", state: "IN", counties: "Washington/Clark/Scott/Jefferson (Henryville)", ef: "EF4", deaths: 11 },
  { date: "Jan 22, 2017", state: "GA", counties: "Brooks/Cook/Berrien", ef: "EF3", deaths: 11 },
  { date: "Apr 24, 2010", state: "MS", counties: "Yazoo/Holmes/Choctaw", ef: "EF4", deaths: 10 },
  { date: "Mar 02, 2012", state: "KY", counties: "Menifee/Morgan/Lawrence", ef: "EF3", deaths: 10 },
  { date: "Apr 28, 2014", state: "MS", counties: "Winston (Louisville)", ef: "EF4", deaths: 10 },
  { date: "Dec 26, 2015", state: "TX", counties: "Dallas (Garland)", ef: "EF4", deaths: 10 },
  { date: "May 25, 2008", state: "IA", counties: "Butler (Parkersburg)", ef: "EF5", deaths: 9 },
  { date: "May 24, 2011", state: "OK", counties: "Canadian/Logan (El Reno-Piedmont)", ef: "EF5", deaths: 9 },
  { date: "Dec 23, 2015", state: "MS", counties: "Marshall-Benton-Tippah", ef: "EF4", deaths: 9 },
  { date: "Mar 31, 2023", state: "TN", counties: "McNairy", ef: "EF3", deaths: 9 },
  { date: "May 25, 2024", state: "TX", counties: "Cooke (Valley View)", ef: "EF3", deaths: 7 },
  { date: "Jan 12, 2023", state: "AL", counties: "Autauga", ef: "EF3", deaths: 7 },
  { date: "Jun 05, 2010", state: "OH", counties: "Wood/Ottawa", ef: "EF4", deaths: 7 },
  { date: "Oct 09, 2024", state: "FL", counties: "St. Lucie", ef: "EF3", deaths: 6 },
  { date: "Mar 05, 2022", state: "IA", counties: "Madison (Winterset)", ef: "EF4", deaths: 6 },
];

const Stat = ({ value, label }: { value: string; label: string }) => (
  <Card className="p-5">
    <div className="text-3xl md:text-4xl font-bold font-display">{value}</div>
    <div className="text-xs md:text-sm text-muted-foreground mt-1">{label}</div>
  </Card>
);

// green → yellow → red heat scale
const heatColor = (t: number) => {
  const clamped = Math.max(0, Math.min(1, t));
  const hue = (1 - clamped) * 120; // 120 green → 0 red
  return `hsl(${hue} 70% 45%)`;
};

const HeatBar = ({ rows, valueKey }: { rows: StateRow[]; valueKey: "deaths" | "perMillion" }) => {
  const max = Math.max(...rows.map((r) => r[valueKey]));
  const sorted = [...rows].sort((a, b) => b[valueKey] - a[valueKey]);
  return (
    <div className="space-y-1.5">
      {sorted.map((r) => {
        const t = r[valueKey] / max;
        return (
          <div key={r.state} className="flex items-center gap-3 text-sm">
            <div className="w-32 md:w-40 shrink-0 text-muted-foreground">{r.state}</div>
            <div className="flex-1 h-6 rounded bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{ width: `${Math.max(2, t * 100)}%`, background: heatColor(t) }}
              />
            </div>
            <div className="w-16 text-right tabular-nums font-medium">
              {valueKey === "deaths" ? r.deaths : r.perMillion.toFixed(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TornadoDeaths = () => {
  const [mode, setMode] = useState<"perMillion" | "deaths">("perMillion");
  const sortedRankings = useMemo(() => [...STATES].sort((a, b) => b.deaths - a.deaths), []);

  return (
    <main className="min-h-screen px-4 md:px-8 py-10 md:py-14 max-w-6xl mx-auto">
      <SEO
        title="Where Tornadoes Kill (2008–2025) | CarnageMC"
        description="A data look at 1,461 U.S. tornado deaths from 2008–2025: by state, EF strength, and where victims were."
        path="/weather/tornado-deaths"
      />

      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Weather · Safety</div>
      <h1 className="text-4xl md:text-6xl font-bold font-display mb-4">Where Tornadoes Kill</h1>
      <p className="text-base md:text-lg text-muted-foreground max-w-3xl mb-10">
        Tornadoes killed 1,461 people in the United States from 2008–2025. This page shows where those deaths
        happened, how strong the tornadoes were, and where people were when they died. The clearest pattern is also
        the most fixable: most victims were in mobile homes.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12">
        <Stat value="1,461" label="Tornado deaths, 2008–2025" />
        <Stat value="37%" label="Died in a mobile / manufactured home" />
        <Stat value="553" label="Deadliest year (2011)" />
        <Stat value="158" label="Deadliest tornado (Joplin 2011)" />
      </div>

      <section className="mb-14">
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Tornado Deaths by State</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
          Green is safest, red is deadliest. The default view adjusts for population, so a small state with many
          deaths still stands out. Switch to total deaths to see raw counts.
        </p>
        <div className="flex gap-2 mb-5">
          <Button
            size="sm"
            variant={mode === "perMillion" ? "default" : "outline"}
            onClick={() => setMode("perMillion")}
          >
            Per Million Residents
          </Button>
          <Button size="sm" variant={mode === "deaths" ? "default" : "outline"} onClick={() => setMode("deaths")}>
            Total Deaths
          </Button>
        </div>
        <Card className="p-4 md:p-6">
          <HeatBar rows={STATES} valueKey={mode} />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
            <span>Fewer deaths</span>
            <div className="flex-1 mx-3 h-2 rounded" style={{ background: "linear-gradient(90deg, hsl(120 70% 45%), hsl(60 70% 45%), hsl(0 70% 45%))" }} />
            <span>More deaths</span>
          </div>
        </Card>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">State Rankings</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
          Per million residents adjusts for state size. Alabama, Mississippi and Arkansas lead either way, the heart
          of Dixie Alley.
        </p>
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Deaths ▼</TableHead>
                <TableHead className="text-right">Per Million</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRankings.map((r) => (
                <TableRow key={r.state}>
                  <TableCell className="font-medium">{r.state}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.deaths}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.perMillion.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.share.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Deaths by Where People Were</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
          Mobile homes are far and away the most dangerous place to be. A basement or interior room of a sturdy
          building is the safest.
        </p>
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Where People Were</TableHead>
                <TableHead className="text-right">Deaths ▼</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOCATIONS.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.deaths}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.share.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Deaths by Tornado Strength</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
          The strongest tornadoes (EF4 and EF5) are rare but cause most deaths. EF0–EF1 tornadoes still kill.
        </p>
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strength</TableHead>
                <TableHead className="text-right">Deaths ▼</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STRENGTHS.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.deaths}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.share.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Deadliest Individual Tornadoes</h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
          The single tornadoes that killed the most people, including the 2011 Joplin EF5, the deadliest U.S.
          tornado in modern records.
        </p>
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Counties Hit</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead className="text-right">Deaths ▼</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEADLIEST.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                  <TableCell>{r.state}</TableCell>
                  <TableCell className="text-sm">{r.counties}</TableCell>
                  <TableCell>{r.ef}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{r.deaths}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="text-sm text-muted-foreground border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground mb-2">Sources & Method</h3>
        <p>
          Data: NOAA{" "}
          <a
            href="https://www.spc.noaa.gov/climo/torn/fatalmap.php"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Storm Prediction Center annual killer-tornado statistics
          </a>{" "}
          (STATIJ reports), 2008–2025. Per-capita figures use 2020 U.S. Census state populations.
        </p>
      </section>
    </main>
  );
};

export default TornadoDeaths;
