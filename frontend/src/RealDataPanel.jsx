
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Waves,
  Leaf,
  CircleDollarSign,
  Lightbulb,
  ArrowUpRight,
  CheckCircle2,
  Database
} from "lucide-react";
import "./RealDataPanel.css";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '"' && quoted && text[i + 1] === '"') {
      field += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);

      if (row.some(v => v.trim() !== "")) rows.push(row);

      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some(v => v.trim() !== "")) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map(h => h.trim());

  return rows.slice(1).map(values =>
    Object.fromEntries(
      headers.map((h, i) => [h, (values[i] ?? "").trim()])
    )
  );
}

const number = value => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return NaN;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const compact = value =>
  Number.isFinite(value)
    ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "—";

const formatFixed = (value, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

function InsightCard({
  icon: Icon,
  label,
  title,
  description,
  tone = "blue"
}) {
  return (
    <article className={`intelligence-card intelligence-${tone}`}>
      <div className="intelligence-icon">
        <Icon size={21} />
      </div>
      <div className="intelligence-content">
        <span className="intelligence-label">{label}</span>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </article>
  );
}

export default function RealDataPanel({ active }) {
  const [data, setData] = useState({
    coral: [],
    production: [],
    clusters: [],
    economics: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const files = [
          "coral_risk_by_site.csv",
          "clustered_data.csv",
          "cluster_summary.csv",
          "plastic_gdp_year_summary.csv"
        ];

        const results = await Promise.all(
          files.map(async file => {
            const response = await fetch(`/data/${file}`);

            if (!response.ok) {
              throw new Error(`Could not load ${file}`);
            }

            return parseCSV(await response.text());
          })
        );

        if (!cancelled) {
          setData({
            coral: results[0],
            production: results[1],
            clusters: results[2],
            economics: results[3]
          });
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load team analytics.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const production = useMemo(() => {
    return data.production
      .map(r => ({
        ...r,
        year: number(r.Year),
        tonnes: number(r["Global plastics production (million tonnes)"])
      }))
      .filter(r => Number.isFinite(r.year) && Number.isFinite(r.tonnes))
      .sort((a, b) => a.year - b.year);
  }, [data.production]);

  const latestYear = production.length
    ? Math.max(...production.map(r => r.year))
    : null;

  const latestProduction = production.filter(r => r.year === latestYear);

  const latestProductionValue = latestProduction.length
    ? latestProduction[latestProduction.length - 1].tonnes
    : NaN;

  const coral = useMemo(() => {
    return data.coral.map(r => ({
      ...r,
      bleaching: number(r.avg_bleaching_percent),
      temperature: number(r.avg_temperature_c),
      stress: number(r.avg_dhw_stress),
      maxStress: number(r.max_dhw_stress),
      anomaly: number(r.avg_temperature_anomaly),
      observations: number(r.observation_count)
    }));
  }, [data.coral]);

  const sortedBleaching = useMemo(
    () => [...coral].filter(r => Number.isFinite(r.bleaching))
      .sort((a, b) => b.bleaching - a.bleaching),
    [coral]
  );

  const sortedStress = useMemo(
    () => [...coral].filter(r => Number.isFinite(r.maxStress))
      .sort((a, b) => b.maxStress - a.maxStress),
    [coral]
  );

  const sortedClusters = useMemo(
    () => [...data.clusters].sort(
      (a, b) =>
        number(b.Average_Production) - number(a.Average_Production)
    ),
    [data.clusters]
  );

  const highestBleaching = sortedBleaching[0];
  const highestStress = sortedStress[0];
  const highestCluster = sortedClusters[0];

  const economy = useMemo(() => {
    if (!data.economics.length) return null;

    return [...data.economics].sort(
      (a, b) => number(b.Year) - number(a.Year)
    )[0];
  }, [data.economics]);

  // Generate transparent findings from the loaded data.
  // These are descriptive insights, not a trained prediction model.
  const insights = useMemo(() => {
    const results = [];

    if (highestBleaching) {
      results.push({
        id: "bleaching",
        icon: Waves,
        label: "CORAL MONITORING",
        title: `${highestBleaching.site_name}: highest average bleaching`,
        description:
          `The recorded site average is ${formatFixed(highestBleaching.bleaching, 1)}%. ` +
          "Prioritize reviewing its monitoring history and environmental measurements before choosing a response.",
        tone: "coral"
      });
    }

    if (highestStress) {
      results.push({
        id: "heat",
        icon: Activity,
        label: "HEAT-STRESS SCREEN",
        title: `${highestStress.site_name}: highest maximum DHW`,
        description:
          `The recorded maximum heat-stress value is ${formatFixed(highestStress.maxStress, 2)} DHW. ` +
          "Review heat exposure alongside bleaching observations; this indicator alone does not establish the cause of bleaching.",
        tone: "amber"
      });
    }

    if (highestCluster) {
      results.push({
        id: "cluster",
        icon: TrendingUp,
        label: "CLUSTERING OUTPUT",
        title: `${highestCluster.Production_Cluster || "Top cluster"} has the highest average`,
        description:
          `The cluster summary reports an average production of ${compact(number(highestCluster.Average_Production))} million tonnes ` +
          `across ${compact(number(highestCluster.Number_of_Records))} records. ` +
          "Use the cluster label to compare historical production groups, not to infer local ocean pollution.",
        tone: "lavender"
      });
    }

    if (Number.isFinite(latestProductionValue)) {
      results.push({
        id: "production",
        icon: Database,
        label: "GLOBAL PLASTIC PRODUCTION",
        title: `Latest available year: ${latestYear}`,
        description:
          `The latest year represented in the clustered dataset records ${compact(latestProductionValue)} million tonnes. ` +
          "This is a historical observation, not a future forecast or a direct measure of coastal plastic waste.",
        tone: "blue"
      });
    }

    if (economy) {
      const waste = number(economy.avg_plastic_waste_kg_person_day);
      const mismanaged = number(economy.avg_mismanaged_waste_per_person);

      results.push({
        id: "economy",
        icon: CircleDollarSign,
        label: "WASTE & ECONOMICS",
        title: `Country-year summary for ${economy.Year}`,
        description:
          `Average plastic waste: ${formatFixed(waste, 3)} kg/person/day. ` +
          `Average mismanaged waste: ${formatFixed(mismanaged, 4)} per person, in the dataset's reported units. ` +
          "These descriptive averages do not establish that GDP causes waste levels.",
        tone: "green"
      });
    }

    return results;
  }, [
    highestBleaching,
    highestStress,
    highestCluster,
    latestProductionValue,
    latestYear,
    economy
  ]);

  const priorities = useMemo(() => {
    const items = [];

    if (highestBleaching) {
      items.push({
        title: "Review the highest-bleaching site",
        detail:
          `${highestBleaching.site_name} has the highest recorded site-average bleaching in this summary. ` +
          "Validate the source observations and compare heat stress, oxygen, and pH before recommending an intervention."
      });
    }

    if (highestStress) {
      items.push({
        title: "Cross-check heat exposure",
        detail:
          `${highestStress.site_name} has the highest recorded maximum DHW value. ` +
          "Check the observation period, data quality, and relevant ecological guidance before escalating a response."
      });
    }

    if (sortedClusters.length > 0) {
      items.push({
        title: "Use clusters to guide further investigation",
        detail:
          "Compare production groups with separate coastal waste and monitoring evidence. Global production clusters alone cannot identify where marine cleanup funding will be most effective."
      });
    }

    if (items.length === 0) {
      items.push({
        title: "Load and validate monitoring data",
        detail:
          "Confirm the input CSVs are complete before deriving conservation priorities."
      });
    }

    return items;
  }, [highestBleaching, highestStress, sortedClusters]);

  if (!active) return null;

  if (loading) {
    return (
      <section className="real-data-panel">
        <p>Loading team analytics…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="real-data-panel">
        <h2>Team analytics</h2>
        <p className="real-data-error">
          {error}. Check that the CSV files exist in frontend/public/data.
        </p>
      </section>
    );
  }

  return (
    <section className="real-data-panel">
      <div className="real-data-heading">
        <div>
          <span className="real-data-eyebrow">
            ORCA / CONNECTED ANALYTICS
          </span>
          <h2>Insights from team data</h2>
          <p>
            Real CSV outputs, descriptive findings, and transparent
            conservation decision support.
          </p>
        </div>

        <span className="real-data-status">
          ● CSV data loaded
        </span>
      </div>

      <div className="real-data-kpis">
        <article>
          <span>Coral sites</span>
          <strong>{data.coral.length}</strong>
          <small>Spark site summaries</small>
        </article>

        <article>
          <span>Production records</span>
          <strong>{data.production.length}</strong>
          <small>Clustered observations</small>
        </article>

        <article>
          <span>Latest production</span>
          <strong>{latestYear ?? "—"}</strong>
          <small>
            {Number.isFinite(latestProductionValue)
              ? `${compact(latestProductionValue)} million tonnes`
              : "No year data"}
          </small>
        </article>

        <article>
          <span>GDP comparison</span>
          <strong>{economy?.Year ?? "—"}</strong>
          <small>
            {economy
              ? `${economy.country_year_records || "—"} country-year records`
              : "No summary available"}
          </small>
        </article>
      </div>

      {/* NEW: Rule-based intelligence brief */}
      <section className="orca-intelligence">
        <div className="orca-intelligence-heading">
          <div className="orca-intelligence-title-icon">
            <Lightbulb size={23} />
          </div>

          <div>
            <span className="real-data-eyebrow">
              ORCA / DATA INTERPRETATION
            </span>
            <h3>Intelligence brief</h3>
            <p>
              Findings generated from the currently loaded team datasets.
            </p>
          </div>
        </div>

        <div className="intelligence-grid">
          {insights.map(item => (
            <InsightCard
              key={item.id}
              icon={item.icon}
              label={item.label}
              title={item.title}
              description={item.description}
              tone={item.tone}
            />
          ))}
        </div>

        <div className="orca-priority-panel">
          <div className="orca-priority-heading">
            <div>
              <span className="real-data-eyebrow">
                DECISION SUPPORT
              </span>
              <h3>Suggested conservation priorities</h3>
            </div>

            <span className="orca-rule-badge">
              <CheckCircle2 size={14} />
              Data-driven rules
            </span>
          </div>

          <p className="orca-priority-intro">
            These are investigation priorities based on observed
            measurements, not an automated funding decision or a
            validated ecological risk prediction.
          </p>

          <div className="orca-priority-list">
            {priorities.map((item, index) => (
              <article className="orca-priority-item" key={item.title}>
                <div className="orca-priority-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <h4>{item.title}</h4>
                  <p>{item.detail}</p>
                </div>

                <ArrowUpRight size={18} className="orca-priority-arrow" />
              </article>
            ))}
          </div>
        </div>

        <div className="orca-intelligence-footnote">
          <AlertTriangle size={16} />
          <p>
            Interpretation limits: the brief summarizes available CSV
            values. It does not prove causation, forecast future events,
            validate ecological risk categories, or determine real-world
            conservation budgets. Funding recommendations require
            intervention costs, effectiveness evidence, location data,
            and a defined budget.
          </p>
        </div>
      </section>

      <div className="real-data-grid">
        <article className="real-data-card">
          <h3>Global plastic production</h3>
          <p>Historical observations · million tonnes</p>

          <div className="real-data-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={production}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce8e9" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10 }}
                  minTickGap={28}
                />
                <YAxis tick={{ fontSize: 10 }} width={45} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="tonnes"
                  name="Million tonnes"
                  stroke="#579b89"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <small className="real-data-note">
            Historical data, not a future forecast.
          </small>
        </article>

        <article className="real-data-card">
          <h3>Coral bleaching by site</h3>
          <p>Average bleaching percentage in the Spark summary</p>

          <div className="real-data-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedBleaching} margin={{ left: -12, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce8e9" />
                <XAxis
                  dataKey="site_name"
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                  height={65}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar
                  dataKey="bleaching"
                  name="Average bleaching (%)"
                  fill="#8aabdf"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <small className="real-data-note">
            Site names and measurements come from the supplied dataset.
          </small>
        </article>

        <article className="real-data-card">
          <h3>Plastic production clusters</h3>
          <p>Summary of the clustering output</p>

          <div className="real-data-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.clusters} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce8e9" />
                <XAxis
                  dataKey="Production_Cluster"
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar
                  dataKey="Average_Production"
                  name="Average (million tonnes)"
                  fill="#b5a1e6"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="real-data-card">
          <h3>Coral site observations</h3>
          <p>Measured summaries and screening labels from the CSV</p>

          <div className="real-data-table-wrap">
            <table className="real-data-table">
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Temp °C</th>
                  <th>Bleaching</th>
                  <th>Screen</th>
                </tr>
              </thead>

              <tbody>
                {sortedBleaching.map(site => (
                  <tr key={site.site_name}>
                    <td>{site.site_name}</td>
                    <td>{formatFixed(site.temperature)}</td>
                    <td>{formatFixed(site.bleaching, 1)}%</td>
                    <td>{site.bleaching_screen || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {economy && (
        <p className="real-data-footnote">
          GDP/plastic-waste summary for {economy.Year}: average plastic
          waste {economy.avg_plastic_waste_kg_person_day} kg/person/day;
          average mismanaged waste {economy.avg_mismanaged_waste_per_person}
          {" "}per person in the dataset's reported units. These are summary
          statistics, not proof of causation.
        </p>
      )}
    </section>
  );
}
