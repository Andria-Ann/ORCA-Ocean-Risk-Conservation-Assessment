
import { useEffect, useMemo, useState } from "react";
import {
  Globe2,
  Satellite,
  Waves,
  TrendingUp,
  Leaf,
  Wallet,
  Activity,
  Layers3,
  MapPin,
  Download,
  Droplets,
  Thermometer,
  Fish,
  SlidersHorizontal,
  CircleDollarSign,
  Target,
  Menu,
  X,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "leaflet/dist/leaflet.css";
import "./App.css";
import RealDataPanel from "./RealDataPanel.jsx";
import RealCoralMap from "./RealCoralMap.jsx";

const colors = ["#88b9fa", "#67d5a7", "#b7a0fa", "#e9bd69"];

const money = (value) =>
  "₹" +
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

// CSV parser: supports quoted values, commas and line breaks.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;

      row.push(field.trim());

      if (row.some((value) => value !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.trim());

  if (row.some((value) => value !== "")) {
    rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((header, index) =>
    index === 0
      ? header.replace(/^\uFEFF/, "").trim()
      : header.trim()
  );

  return rows.slice(1).map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] ?? "",
      ])
    )
  );
}

function numeric(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function StatCard({ icon: Icon, label, value, note, color }) {
  return (
    <article className="visual-stat" style={{ "--accent": color }}>
      <div className="visual-stat-head">
        <span>{label}</span>
        <Icon size={18} />
      </div>

      <strong>{value}</strong>
      <small>{note}</small>

      <div className="stat-mini-track">
        <i />
      </div>
    </article>
  );
}

function SectionTitle({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="visual-section-title">
      <div>
        <span className="visual-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {Icon && (
        <div className="visual-title-icon">
          <Icon size={21} />
        </div>
      )}
    </div>
  );
}

function ChartTooltip() {
  return {
    background: "#112330",
    border: "1px solid #3b525f",
    borderRadius: 8,
    color: "#e3eef2",
  };
}

function EmptyState({ loading, error, children }) {
  if (loading) {
    return <p>Loading coral-site observations…</p>;
  }

  if (error) {
    return <p className="visual-demo-warning">{error}</p>;
  }

  if (children) return children;

  return <p>No usable coral-site observations were found.</p>;
}

export default function App() {
  const [budget, setBudget] = useState(10000000);

  const [activeFinance, setActiveFinance] = useState("Allocation");

  const [interventionShares, setInterventionShares] = useState([
    40,
    30,
    20,
    10,
  ]);

  const [activePage, setActivePage] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [coralSites, setCoralSites] = useState([]);
  const [coralLoading, setCoralLoading] = useState(true);
  const [coralError, setCoralError] = useState("");

  // Load the real coral-site CSV from the public folder.
  useEffect(() => {
    let cancelled = false;

    async function loadCoralData() {
      try {
        const response = await fetch(
          "/data/coral_risk_by_site.csv"
        );

        if (!response.ok) {
          throw new Error(
            "Could not load coral_risk_by_site.csv. Check that the file exists in frontend/public/data/."
          );
        }

        const csvText = await response.text();
        const records = parseCSV(csvText);

        if (!records.length) {
          throw new Error(
            "The coral-site CSV contains no data rows."
          );
        }

        if (!cancelled) {
          setCoralSites(records);
          setCoralError("");
        }
      } catch (error) {
        if (!cancelled) {
          setCoralError(
            error.message || "Unable to load coral-site data."
          );
        }
      } finally {
        if (!cancelled) {
          setCoralLoading(false);
        }
      }
    }

    loadCoralData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Convert the numeric CSV columns into usable numbers.
  const realSites = useMemo(
    () =>
      coralSites
        .filter((site) => site.site_name)
        .map((site) => ({
          ...site,
          temperature: numeric(site.avg_temperature_c),
          bleaching: numeric(site.avg_bleaching_percent),
          heatStress: numeric(site.avg_dhw_stress),
          maxHeatStress: numeric(site.max_dhw_stress),
          observations: numeric(site.observation_count),
          dissolvedOxygen: numeric(site.avg_dissolved_oxygen),
          ph: numeric(site.avg_ph),
          chlorophyll: numeric(site.avg_chlorophyll_a),
          turbidity: numeric(site.avg_turbidity),
        })),
    [coralSites]
  );

  const pageTitles = {
    overview: "Overview",
    geospatial: "Geospatial Explorer",
    intelligence: "Ocean Intelligence",
    finance: "Finance & Allocation",
    register: "Coastal Risk Register",
  };

  const navigation = [
    { id: "overview", label: "Overview", icon: Globe2 },
    {
      id: "geospatial",
      label: "Geospatial Explorer",
      icon: Satellite,
    },
    {
      id: "intelligence",
      label: "Ocean Intelligence",
      icon: Activity,
    },
    {
      id: "finance",
      label: "Finance & Allocation",
      icon: Wallet,
    },
    {
      id: "register",
      label: "Coastal Risk Register",
      icon: Layers3,
    },
  ];

  const validTemperatures = realSites
    .map((site) => site.temperature)
    .filter(Number.isFinite);

  const validBleaching = realSites
    .map((site) => site.bleaching)
    .filter(Number.isFinite);

  const highestTemperature = validTemperatures.length
    ? Math.max(...validTemperatures)
    : null;

  const highestBleaching = validBleaching.length
    ? Math.max(...validBleaching)
    : null;

  // Illustrative allocation weighted by observed average bleaching.
  const allocation = useMemo(() => {
    const sites = realSites.filter(
      (site) =>
        Number.isFinite(site.bleaching) &&
        site.bleaching >= 0
    );

    if (!sites.length) return [];

    const totalScore = sites.reduce(
      (sum, site) => sum + site.bleaching,
      0
    );

    const totalBudget = Math.max(0, Number(budget) || 0);
    let allocatedSoFar = 0;

    return sites
      .map((site, index) => {
        const isLast = index === sites.length - 1;

        const amount = isLast
          ? totalBudget - allocatedSoFar
          : Math.round(
              totalScore > 0
                ? (totalBudget * site.bleaching) / totalScore
                : totalBudget / sites.length
            );

        allocatedSoFar += amount;

        return {
          ...site,
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [budget, realSites]);

  const interventionItems = [
    {
      name: "Pollution control",
      icon: Droplets,
      desc: "Waste interception, water-quality monitoring and cleanup.",
    },
    {
      name: "Habitat restoration",
      icon: Leaf,
      desc: "Mangrove, estuary and coastal habitat restoration.",
    },
    {
      name: "Biodiversity protection",
      icon: Fish,
      desc: "Species and habitat protection programmes.",
    },
    {
      name: "Monitoring & research",
      icon: Activity,
      desc: "Field sampling, sensors and data collection.",
    },
  ];

  // The portfolio chart uses the intervention slider values.
  const financePie = [
    {
      name: "Pollution control",
      value: interventionShares[0],
    },
    {
      name: "Habitat restoration",
      value: interventionShares[1],
    },
    {
      name: "Biodiversity",
      value: interventionShares[2],
    },
    {
      name: "Monitoring",
      value: interventionShares[3],
    },
  ];

  const interventionTotal = interventionShares.reduce(
    (sum, share) => sum + share,
    0
  );

  const interventionRemaining = 100 - interventionTotal;

  function goToPage(page) {
    setActivePage(page);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateInterventionShare(index, value) {
    setInterventionShares((previous) =>
      previous.map((share, i) =>
        i === index ? Number(value) : share
      )
    );
  }

  function resetInterventions() {
    setInterventionShares([40, 30, 20, 10]);
  }

  function downloadCSV(filename, rows) {
    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportAllocation() {
    const rows = [
      [
        "Coral site",
        "Average temperature C",
        "Average bleaching percent",
        "Average DHW",
        "Maximum DHW",
        "Observations",
        "Scenario allocation INR",
        "Allocation method",
      ],
      ...allocation.map((site) => [
        site.site_name,
        site.temperature,
        site.bleaching,
        site.heatStress,
        site.maxHeatStress,
        site.observations,
        site.amount,
        "Illustrative weighting by average bleaching",
      ]),
    ];

    downloadCSV(
      "orca-coral-site-allocation-scenario.csv",
      rows
    );
  }

  function exportInterventionPlan() {
    const rows = [
      ["Intervention", "Allocation percentage", "Budget INR"],
      ...interventionItems.map((item, index) => [
        item.name,
        interventionShares[index],
        Math.round(
          (budget * interventionShares[index]) / 100
        ),
      ]),
      [
        "Unallocated budget",
        interventionRemaining,
        Math.round(
          (budget * interventionRemaining) / 100
        ),
      ],
    ];

    downloadCSV("orca-intervention-scenario.csv", rows);
  }

  const sortedSites = useMemo(
    () =>
      [...realSites].sort((a, b) => {
        const bleachingA = Number.isFinite(a.bleaching)
          ? a.bleaching
          : -Infinity;

        const bleachingB = Number.isFinite(b.bleaching)
          ? b.bleaching
          : -Infinity;

        return bleachingB - bleachingA;
      }),
    [realSites]
  );

  const siteChartData = sortedSites.filter(
    (site) =>
      Number.isFinite(site.bleaching) ||
      Number.isFinite(site.maxHeatStress)
  );

  return (
    <div className="orca-visual-app">
      {drawerOpen && (
        <button
          className="visual-drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`visual-sidebar ${drawerOpen ? "drawer-open" : ""}`}
      >
        <div className="visual-brand">
          <div className="visual-brand-icon">
            <Waves size={23} />
          </div>

          <div className="visual-brand-text">
            <strong>
              ORCA<span>.</span>
            </strong>
            <small>OCEAN INTELLIGENCE</small>
          </div>

          <button
            className="visual-drawer-close"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="visual-side-label">MISSION CONTROL</div>

        <nav className="visual-navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`visual-nav ${
                activePage === id ? "active" : ""
              }`}
              aria-current={
                activePage === id ? "page" : undefined
              }
              onClick={() => goToPage(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="visual-sidebar-bottom">
          <div className="visual-online">
            <i /> DEMO ENVIRONMENT
          </div>

          <p>
            Big Data pipeline
            <br />
            <strong>Ready for integration</strong>
          </p>

          <small>Hadoop · Hive · Spark</small>
        </div>
      </aside>

      <main className="visual-main">
        <header className="visual-topbar">
          <div className="visual-top-left">
            <button
              className="visual-menu-button"
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div>
              <span className="visual-breadcrumb">ORCA /</span>{" "}
              {pageTitles[activePage]}
            </div>
          </div>

          <div className="visual-top-right">
            <i /> SYSTEM ONLINE
            <span className="visual-top-sep" />
            ANALYTICS DEMO
          </div>
        </header>

        {/* OVERVIEW */}
        <section
          className="visual-hero"
          id="overview"
          hidden={activePage !== "overview"}
        >
          <div>
            <div className="visual-eyebrow">
              <span /> OCEAN RISK & CONSERVATION ASSESSMENT
            </div>

            <h1>
              Understand the ocean.
              <br />
              <em>Fund what matters.</em>
            </h1>

            <p>
              A marine conservation decision platform for exploring
              coral observations, comparing environmental signals
              and modelling potential conservation funding scenarios.
            </p>
          </div>

          <div className="visual-hero-badge">
            <Globe2 size={26} />

            <div>
              <small>OBSERVATION REGION</small>
              <strong>Gulf of Mannar & Palk Bay</strong>
              <span>Coral-site dataset</span>
            </div>
          </div>
        </section>

        <section
          className="visual-stats"
          hidden={activePage !== "overview"}
        >
          <StatCard
            icon={MapPin}
            label="CORAL SITES"
            value={
              coralLoading
                ? "…"
                : String(realSites.length).padStart(2, "0")
            }
            note="Records in coral-site CSV"
            color="#6dd8cf"
          />

          <StatCard
            icon={Thermometer}
            label="HIGHEST AVG. TEMP."
            value={
              highestTemperature === null
                ? "—"
                : `${highestTemperature.toFixed(2)}°C`
            }
            note="Recorded site average"
            color="#88b9fa"
          />

          <StatCard
            icon={Activity}
            label="HIGHEST AVG. BLEACHING"
            value={
              highestBleaching === null
                ? "—"
                : `${highestBleaching.toFixed(1)}%`
            }
            note="Recorded site average"
            color="#b7a0fa"
          />

          <StatCard
            icon={Wallet}
            label="PLANNING BUDGET"
            value={money(budget)}
            note="Editable scenario budget"
            color="#e9bd69"
          />
        </section>

        <div hidden={activePage !== "overview"}>
          <RealDataPanel active={activePage === "overview"} />
        </div>

        {/* GEOSPATIAL EXPLORER */}
        <section
          className="visual-panel visual-map-panel"
          id="geospatial"
          hidden={activePage !== "geospatial"}
        >
          <RealCoralMap />
        </section>

        {/* OCEAN INTELLIGENCE */}
        <section
          className="visual-analysis-grid"
          id="intelligence"
          hidden={activePage !== "intelligence"}
          style={{
            display:
              activePage === "intelligence" ? "grid" : "none",
            gridTemplateColumns: "minmax(0, 1fr)",
            width: "100%",
            maxWidth: "none",
            minWidth: 0,
          }}
        >
          <article
            className="visual-panel visual-chart-panel"
            style={{
              width: "100%",
              maxWidth: "none",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            <SectionTitle
              eyebrow="02 / REAL DATA"
              title="Coral-site observations"
              description="Recorded measurements from coral_risk_by_site.csv. These are observations, not predictions."
              icon={Activity}
            />

            <EmptyState
              loading={coralLoading}
              error={coralError}
            >
              {realSites.length === 0 ? (
                <p>No coral-site observations were found.</p>
              ) : (
                <>
                  <div className="visual-signal-cards">
                    <div>
                      <Waves size={16} />
                      <small>MONITORED SITES</small>
                      <strong>{realSites.length}</strong>
                      <span>CSV records</span>
                    </div>

                    <div>
                      <Thermometer size={16} />
                      <small>HIGHEST SITE TEMP.</small>
                      <strong>
                        {highestTemperature === null
                          ? "—"
                          : `${highestTemperature.toFixed(2)}°C`}
                      </strong>
                      <span>Recorded average</span>
                    </div>

                    <div>
                      <Activity size={16} />
                      <small>HIGHEST AVG. BLEACHING</small>
                      <strong>
                        {highestBleaching === null
                          ? "—"
                          : `${highestBleaching.toFixed(1)}%`}
                      </strong>
                      <span>Recorded site average</span>
                    </div>
                  </div>

                  <div
                    className="visual-register-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      width: "100%",
                    }}
                  >
                    {sortedSites.map((site) => (
                      <article
                        className="visual-register-card"
                        key={site.site_name}
                      >
                        <div className="visual-register-card-top">
                          <span className="visual-zone-dot" />
                          CORAL OBSERVATION
                        </div>

                        <strong>{site.site_name}</strong>

                        <div className="visual-register-meta">
                          <span>
                            Temp.{" "}
                            <b>
                              {Number.isFinite(site.temperature)
                                ? `${site.temperature.toFixed(2)}°C`
                                : "—"}
                            </b>
                          </span>

                          <span>
                            Bleaching{" "}
                            <b>
                              {Number.isFinite(site.bleaching)
                                ? `${site.bleaching.toFixed(1)}%`
                                : "—"}
                            </b>
                          </span>
                        </div>

                        <div className="visual-register-meta">
                          <span>
                            Avg. DHW{" "}
                            <b>
                              {Number.isFinite(site.heatStress)
                                ? site.heatStress.toFixed(2)
                                : "—"}
                            </b>
                          </span>

                          <span>
                            Max DHW{" "}
                            <b>
                              {Number.isFinite(site.maxHeatStress)
                                ? site.maxHeatStress.toFixed(2)
                                : "—"}
                            </b>
                          </span>
                        </div>

                        <small className="visual-register-issue">
                          {site.bleaching_screen ||
                            "Screening label unavailable"}
                        </small>
                      </article>
                    ))}
                  </div>

                  <article className="visual-panel visual-overview-chart-card">
                    <div className="visual-overview-card-heading">
                      <div>
                        <h3>Bleaching and heat-stress comparison</h3>
                        <p>
                          Recorded site averages; values are not a
                          forecast.
                        </p>
                      </div>

                      <TrendingUp size={18} />
                    </div>

                    <div className="visual-chart">
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={siteChartData}>
                          <CartesianGrid
                            stroke="#dce8f2"
                            strokeDasharray="3 4"
                          />

                          <XAxis
                            dataKey="site_name"
                            tick={{
                              fill: "#66819a",
                              fontSize: 10,
                            }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                            height={75}
                          />

                          <YAxis
                            yAxisId="bleaching"
                            tick={{
                              fill: "#66819a",
                              fontSize: 10,
                            }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                              value: "Bleaching (%)",
                              angle: -90,
                              position: "insideLeft",
                              fill: "#66819a",
                            }}
                          />

                          <YAxis
                            yAxisId="dhw"
                            orientation="right"
                            tick={{
                              fill: "#66819a",
                              fontSize: 10,
                            }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                              value: "Maximum DHW",
                              angle: 90,
                              position: "insideRight",
                              fill: "#66819a",
                            }}
                          />

                          <Tooltip contentStyle={ChartTooltip()} />

                          <Line
                            yAxisId="bleaching"
                            type="monotone"
                            dataKey="bleaching"
                            name="Average bleaching (%)"
                            stroke="#88b9fa"
                            strokeWidth={2.5}
                            connectNulls
                            dot={{ r: 3 }}
                          />

                          <Line
                            yAxisId="dhw"
                            type="monotone"
                            dataKey="maxHeatStress"
                            name="Maximum DHW"
                            stroke="#67bfa2"
                            strokeWidth={2.5}
                            connectNulls
                            dot={{ r: 3 }}
                          />

                          <Legend
                            wrapperStyle={{
                              fontSize: 11,
                              color: "#66819a",
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </article>

                  <div className="visual-demo-warning">
                    These are measurements from the CSV, not live
                    readings, a validated overall risk score or a
                    future prediction.
                  </div>
                </>
              )}
            </EmptyState>
          </article>
        </section>

        {/* FINANCE & ALLOCATION */}
        <section
          className="visual-panel visual-finance-panel"
          id="finance"
          hidden={activePage !== "finance"}
        >
          <SectionTitle
            eyebrow="04 / CONSERVATION CAPITAL ALLOCATION"
            title="Finance optimizer"
            description="Explore a transparent budget scenario using observed coral bleaching. This is a demonstration rule, not a validated funding recommendation."
            icon={CircleDollarSign}
          />

          <div className="visual-finance-top">
            <div className="visual-budget-control">
              <label htmlFor="orca-budget">
                SCENARIO BUDGET (INR)
              </label>

              <div className="visual-budget-input">
                <span>₹</span>
                <input
                  id="orca-budget"
                  type="number"
                  min="0"
                  step="100000"
                  value={budget}
                  onChange={(event) =>
                    setBudget(
                      Math.max(0, Number(event.target.value) || 0)
                    )
                  }
                />
              </div>

              <div className="visual-budget-presets">
                {[2500000, 5000000, 10000000, 25000000].map(
                  (value) => (
                    <button
                      key={value}
                      className={
                        budget === value ? "selected" : ""
                      }
                      onClick={() => setBudget(value)}
                    >
                      {value >= 10000000
                        ? `₹${value / 10000000} Cr`
                        : `₹${value / 100000} L`}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="visual-finance-summary">
              <div>
                <small>PLANNING BUDGET</small>
                <strong>{money(budget)}</strong>
              </div>

              <div>
                <small>CORAL SITES CONSIDERED</small>
                <strong>
                  {coralLoading ? "…" : allocation.length}
                </strong>
              </div>

              <div>
                <small>ALLOCATION PROXY</small>
                <strong>Avg. bleaching</strong>
              </div>
            </div>
          </div>

          <div className="visual-finance-tabs">
            {[
              "Allocation",
              "Interventions",
              "Portfolio mix",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFinance(tab)}
                className={
                  activeFinance === tab ? "selected" : ""
                }
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ALLOCATION */}
          {activeFinance === "Allocation" && (
            <div className="visual-finance-content">
              <div className="visual-allocation-list">
                {coralLoading ? (
                  <p>Loading coral-site data…</p>
                ) : coralError ? (
                  <p className="visual-demo-warning">
                    {coralError}
                  </p>
                ) : allocation.length === 0 ? (
                  <p>
                    No usable bleaching measurements are available.
                  </p>
                ) : (
                  allocation.map((site, index) => (
                    <div
                      className="visual-allocation-row"
                      key={site.site_name}
                    >
                      <div className="visual-allocation-rank">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="visual-allocation-details">
                        <strong>{site.site_name}</strong>

                        <small>
                          Average bleaching:{" "}
                          {Number.isFinite(site.bleaching)
                            ? `${site.bleaching.toFixed(1)}%`
                            : "—"}
                          {" · "}
                          Average DHW:{" "}
                          {Number.isFinite(site.heatStress)
                            ? site.heatStress.toFixed(2)
                            : "—"}
                        </small>

                        <div className="visual-allocation-track">
                          <i
                            style={{
                              width: `${
                                budget > 0
                                  ? Math.min(
                                      100,
                                      (site.amount / budget) * 100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="visual-allocation-money">
                        <strong>{money(site.amount)}</strong>

                        <small>
                          {budget > 0
                            ? (
                                (site.amount / budget) *
                                100
                              ).toFixed(1)
                            : "0.0"}
                          % of budget
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="visual-finance-note">
                <Target size={18} />

                <div>
                  <strong>How this scenario is calculated</strong>
                  <p>
                    The budget is distributed proportionally using
                    recorded average coral bleaching at each site.
                    This is an illustrative calculation, not a
                    validated funding optimizer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INTERVENTION SIMULATOR */}
          {activeFinance === "Interventions" && (
            <div className="visual-interventions orca-intervention-simulator">
              <div className="orca-simulator-heading">
                <div>
                  <span className="orca-simulator-eyebrow">
                    CONSERVATION SCENARIO LAB
                  </span>

                  <h3>Design your funding strategy</h3>

                  <p>
                    Adjust the funding share for each intervention
                    and see how your proposed budget changes instantly.
                  </p>
                </div>

                <button
                  type="button"
                  className="orca-simulator-reset"
                  onClick={resetInterventions}
                >
                  <RefreshCw size={14} />
                  Reset
                </button>
              </div>

              <div className="orca-simulator-summary">
                <div>
                  <span>Total scenario budget</span>
                  <strong>{money(budget)}</strong>
                </div>

                <div>
                  <span>Allocated</span>
                  <strong>{interventionTotal}%</strong>
                </div>

                <div>
                  <span>Unallocated</span>

                  <strong
                    className={
                      interventionRemaining < 0
                        ? "orca-budget-warning"
                        : ""
                    }
                  >
                    {interventionRemaining}%
                  </strong>
                </div>
              </div>

              <div className="orca-budget-balance">
                <div className="orca-budget-balance-track">
                  <i
                    style={{
                      width: `${Math.min(
                        Math.max(interventionTotal, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <p>
                  {interventionRemaining === 0
                    ? "Your scenario allocates the entire budget."
                    : interventionRemaining > 0
                      ? `${interventionRemaining}% of the budget remains unallocated.`
                      : `${Math.abs(interventionRemaining)}% over budget.`}
                </p>
              </div>

              <div className="orca-intervention-list">
                {interventionItems.map((item, index) => {
                  const share = interventionShares[index];
                  const amount = Math.round(
                    (budget * share) / 100
                  );
                  const Icon = item.icon;

                  return (
                    <article
                      className="orca-intervention-item"
                      key={item.name}
                    >
                      <div className="orca-intervention-icon">
                        <Icon size={21} />
                      </div>

                      <div className="orca-intervention-main">
                        <div className="orca-intervention-title">
                          <div>
                            <h4>{item.name}</h4>
                            <p>{item.desc}</p>
                          </div>

                          <strong>{money(amount)}</strong>
                        </div>

                        <div className="orca-intervention-slider-row">
                          <input
                            aria-label={`${item.name} allocation percentage`}
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={share}
                            onChange={(event) =>
                              updateInterventionShare(
                                index,
                                event.target.value
                              )
                            }
                          />

                          <label>{share}%</label>
                        </div>

                        <div className="orca-intervention-track">
                          <i style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="orca-simulator-footer">
                <div>
                  <strong>Scenario interpretation</strong>

                  <p>
                    {interventionRemaining === 0
                      ? "All funds are assigned across the four intervention categories."
                      : interventionRemaining > 0
                        ? "Some funds remain unallocated and may be reserved for future needs."
                        : "Your proposed percentages exceed the available budget."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={exportInterventionPlan}
                >
                  <Download size={15} />
                  Export scenario CSV
                </button>
              </div>

              <p className="orca-simulator-disclaimer">
                Illustrative planning scenario only. Funding
                percentages, costs and ecological outcomes are not
                validated estimates.
              </p>
            </div>
          )}

          {/* PORTFOLIO MIX */}
          {activeFinance === "Portfolio mix" && (
            <div className="visual-portfolio">
              <div className="visual-portfolio-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={financePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {financePie.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={colors[index % colors.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => `${value}%`}
                      contentStyle={ChartTooltip()}
                    />

                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{
                        fontSize: 10,
                        color: "#66819a",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="visual-portfolio-breakdown">
                {financePie.map((item, index) => (
                  <div key={item.name}>
                    <i
                      style={{
                        background: colors[index % colors.length],
                      }}
                    />

                    <span>{item.name}</span>

                    <strong>
                      {money(
                        Math.round((budget * item.value) / 100)
                      )}
                    </strong>

                    <small>{item.value}%</small>
                  </div>
                ))}

                <div>
                  <i style={{ background: "#d5deeb" }} />

                  <span>Unallocated budget</span>

                  <strong>
                    {money(
                      Math.round(
                        (budget * interventionRemaining) / 100
                      )
                    )}
                  </strong>

                  <small>{interventionRemaining}%</small>
                </div>
              </div>

              <p className="visual-demo-warning">
                This portfolio mix is controlled by the Interventions
                sliders. Percentages are scenario inputs, not measured
                conservation expenditure.
              </p>
            </div>
          )}

          <div className="visual-finance-footer">
            <span>
              <i /> SIMULATED FINANCIAL SCENARIO · EDITABLE BUDGET
            </span>

            <button onClick={exportAllocation}>
              <Download size={14} />
              Export allocation CSV
            </button>
          </div>
        </section>

        {/* COASTAL RISK REGISTER */}
        <section
          className="visual-panel visual-register-panel"
          id="register"
          hidden={activePage !== "register"}
        >
          <SectionTitle
            eyebrow="05 / REAL CORAL OBSERVATIONS"
            title="Coral-site risk register"
            description="Compare recorded bleaching and heat-stress measurements. Screening labels come from the dataset; no invented overall risk score is shown."
            icon={SlidersHorizontal}
          />

          <EmptyState
            loading={coralLoading}
            error={coralError}
          >
            {realSites.length === 0 ? (
              <p>No coral-site observations were found.</p>
            ) : (
              <>
                <div className="visual-register-grid">
                  {sortedSites.map((site) => (
                    <article
                      className="visual-register-card"
                      key={site.site_name}
                    >
                      <div className="visual-register-card-top">
                        <span className="visual-zone-dot" />
                        CORAL OBSERVATION
                      </div>

                      <strong>{site.site_name}</strong>

                      <div className="visual-register-score">
                        <span>Avg. bleaching</span>

                        <b>
                          {Number.isFinite(site.bleaching)
                            ? `${site.bleaching.toFixed(1)}%`
                            : "—"}
                        </b>
                      </div>

                      <div className="visual-allocation-track">
                        <i
                          style={{
                            width: `${
                              Number.isFinite(site.bleaching)
                                ? Math.max(
                                    0,
                                    Math.min(100, site.bleaching)
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <div className="visual-register-meta">
                        <span>
                          Temp.{" "}
                          <b>
                            {Number.isFinite(site.temperature)
                              ? `${site.temperature.toFixed(2)}°C`
                              : "—"}
                          </b>
                        </span>

                        <span>
                          Avg. DHW{" "}
                          <b>
                            {Number.isFinite(site.heatStress)
                              ? site.heatStress.toFixed(2)
                              : "—"}
                          </b>
                        </span>
                      </div>

                      <div className="visual-register-meta">
                        <span>
                          Max DHW{" "}
                          <b>
                            {Number.isFinite(site.maxHeatStress)
                              ? site.maxHeatStress.toFixed(2)
                              : "—"}
                          </b>
                        </span>

                        <span>
                          Observations{" "}
                          <b>
                            {Number.isFinite(site.observations)
                              ? site.observations
                              : "—"}
                          </b>
                        </span>
                      </div>

                      <small className="visual-register-issue">
                        {site.bleaching_screen ||
                          site.heat_stress_screen ||
                          "Screening label unavailable"}
                      </small>
                    </article>
                  ))}
                </div>

                <div className="visual-demo-warning">
                  Measurements are sourced from
                  coral_risk_by_site.csv. Bleaching alone is not a
                  complete measure of ecosystem risk and does not
                  predict future conditions.
                </div>
              </>
            )}
          </EmptyState>
        </section>

        {/* FOOTER */}
        <footer className="visual-footer">
          <span>
            ORCA · OCEAN RISK & CONSERVATION ASSESSMENT
          </span>

          <span>
            STUDENT PROJECT · OBSERVATIONAL DATA · SCENARIO FUNDING ONLY
          </span>

          <button onClick={() => window.location.reload()}>
            <RefreshCw size={12} />
            Reset demo
          </button>
        </footer>
      </main>
    </div>
  );
}
