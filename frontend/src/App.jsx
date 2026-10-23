
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import {
  Globe2,
  Satellite,
  Waves,
  ShieldAlert,
  TrendingUp,
  Leaf,
  Wallet,
  Activity,
  Search,
  Layers3,
  MapPin,
  ArrowUpRight,
  RefreshCw,
  Download,
  Droplets,
  Thermometer,
  Fish,
  Crosshair,
  SlidersHorizontal,
  CircleDollarSign,
  Target,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import "./App.css";

// --------------------------------------------------
// DEMO COASTAL DATA
// Replace these illustrative values with real data
// from your Hive / Spark processing pipeline later.
// --------------------------------------------------

const zones = [
  {
    id: 1,
    name: "Kochi Coast",
    lat: 9.9312,
    lng: 76.2673,
    risk: 82,
    pollution: 78,
    biodiversity: 48,
    temp: 29.4,
    chlorophyll: 6.2,
    category: "High",
    issue: "Coastal pollution",
    funding: 28,
  },
  {
    id: 2,
    name: "Alappuzha",
    lat: 9.4981,
    lng: 76.3388,
    risk: 67,
    pollution: 61,
    biodiversity: 72,
    temp: 28.8,
    chlorophyll: 5.1,
    category: "Moderate",
    issue: "Habitat degradation",
    funding: 22,
  },
  {
    id: 3,
    name: "Kollam Coast",
    lat: 8.8932,
    lng: 76.6141,
    risk: 58,
    pollution: 54,
    biodiversity: 69,
    temp: 29.1,
    chlorophyll: 4.7,
    category: "Moderate",
    issue: "Water quality",
    funding: 18,
  },
  {
    id: 4,
    name: "Kozhikode",
    lat: 11.2588,
    lng: 75.7804,
    risk: 73,
    pollution: 70,
    biodiversity: 57,
    temp: 29.7,
    chlorophyll: 5.8,
    category: "High",
    issue: "Marine litter",
    funding: 20,
  },
  {
    id: 5,
    name: "Kannur Coast",
    lat: 11.8745,
    lng: 75.3704,
    risk: 39,
    pollution: 34,
    biodiversity: 83,
    temp: 28.5,
    chlorophyll: 3.9,
    category: "Low",
    issue: "Habitat monitoring",
    funding: 12,
  },
  {
    id: 6,
    name: "Ponnani",
    lat: 10.766,
    lng: 75.9252,
    risk: 64,
    pollution: 57,
    biodiversity: 63,
    temp: 29.0,
    chlorophyll: 4.9,
    category: "Moderate",
    issue: "Estuary pressure",
    funding: 16,
  },
  {
    id: 7,
    name: "Varkala",
    lat: 8.7379,
    lng: 76.7163,
    risk: 45,
    pollution: 39,
    biodiversity: 78,
    temp: 28.7,
    chlorophyll: 4.2,
    category: "Low",
    issue: "Reef and habitat care",
    funding: 10,
  },
  {
    id: 8,
    name: "Kasargod",
    lat: 12.4996,
    lng: 74.9869,
    risk: 52,
    pollution: 43,
    biodiversity: 74,
    temp: 28.6,
    chlorophyll: 4.5,
    category: "Moderate",
    issue: "Coastal erosion",
    funding: 14,
  },
];

const forecastData = [
  { day: "Now", dayNumber: 0, risk: 55, pollution: 49 },
  { day: "Day 7", dayNumber: 7, risk: 59, pollution: 52 },
  { day: "Day 14", dayNumber: 14, risk: 57, pollution: 55 },
  { day: "Day 21", dayNumber: 21, risk: 64, pollution: 57 },
  { day: "Day 30", dayNumber: 30, risk: 68, pollution: 60 },
  { day: "Day 45", dayNumber: 45, risk: 65, pollution: 58 },
  { day: "Day 60", dayNumber: 60, risk: 72, pollution: 63 },
];

const historicalData = [
  { month: "May", temperature: 28.1, pollution: 43 },
  { month: "Jun", temperature: 28.6, pollution: 48 },
  { month: "Jul", temperature: 27.9, pollution: 46 },
  { month: "Aug", temperature: 28.3, pollution: 51 },
  { month: "Sep", temperature: 29.0, pollution: 56 },
  { month: "Oct", temperature: 29.4, pollution: 61 },
];

const colors = ["#ff8588", "#e9bd69", "#67d5a7", "#88b9fa"];

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

const riskColor = (risk) =>
  risk >= 70 ? "#ff8588" : risk >= 50 ? "#e9bd69" : "#67d5a7";

// --------------------------------------------------
// MAP HELPERS
// --------------------------------------------------

function MapResize() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function FlyToZone({ zone }) {
  const map = useMap();

  useEffect(() => {
    if (!zone) return;

    map.flyTo([zone.lat, zone.lng], 10, {
      duration: 0.8,
    });
  }, [map, zone]);

  return null;
}

// --------------------------------------------------
// REUSABLE UI COMPONENTS
// --------------------------------------------------

function StatCard({ icon: Icon, label, value, note, color }) {
  return (
    <article
      className="visual-stat"
      style={{ "--accent": color }}
    >
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

function SectionTitle({
  eyebrow,
  title,
  description,
  icon: Icon,
}) {
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

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

export default function App() {
  const [selectedId, setSelectedId] = useState(1);
  const [mapMode, setMapMode] = useState("street");
  const [mapLayer, setMapLayer] = useState("risk");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [budget, setBudget] = useState(10000000);
  const [horizon, setHorizon] = useState(30);
  const [activeFinance, setActiveFinance] = useState("Allocation");
  const [showHeat, setShowHeat] = useState(true);

  const selected = zones.find((z) => z.id === selectedId) || zones[0];

  const filteredZones = zones.filter((zone) => {
    const matchesFilter =
      filter === "All" || zone.category === filter;

    const matchesSearch = zone.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Interpolate between the nearest forecast observations.
  // These are demo values, not validated predictions.
  const projectedForecast = useMemo(() => {
    const nextPointIndex = forecastData.findIndex(
      (point) => point.dayNumber >= horizon
    );

    if (nextPointIndex === -1) {
      return forecastData[forecastData.length - 1];
    }

    if (nextPointIndex === 0) {
      return forecastData[0];
    }

    const previous = forecastData[nextPointIndex - 1];
    const next = forecastData[nextPointIndex];

    const fraction =
      (horizon - previous.dayNumber) /
      (next.dayNumber - previous.dayNumber);

    return {
      day: `${horizon} days`,
      dayNumber: horizon,
      risk: Math.round(
        previous.risk + fraction * (next.risk - previous.risk)
      ),
      pollution: Math.round(
        previous.pollution +
          fraction * (next.pollution - previous.pollution)
      ),
    };
  }, [horizon]);

  // Allocate the full budget proportionally across all zones.
  const allocation = useMemo(() => {
    const weights = zones.map((zone) => ({
      ...zone,
      weight:
        zone.risk *
        (1 + (100 - zone.biodiversity) / 100),
    }));

    const totalWeight = weights.reduce(
      (sum, zone) => sum + zone.weight,
      0
    );

    const totalBudget = Math.max(0, budget);

    // Round each zone except the last to whole rupees.
    // Give the remaining balance to the final zone so the
    // exported allocations sum exactly to the chosen budget.
    let allocatedSoFar = 0;

    return weights
      .map((zone, index) => {
        let amount;

        if (index === weights.length - 1) {
          amount = totalBudget - allocatedSoFar;
        } else {
          amount = Math.round(
            (totalBudget * zone.weight) / totalWeight
          );
          allocatedSoFar += amount;
        }

        return {
          ...zone,
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [budget]);

  const financePie = [
    { name: "Pollution control", value: 40 },
    { name: "Habitat restoration", value: 30 },
    { name: "Biodiversity", value: 20 },
    { name: "Monitoring", value: 10 },
  ];

  // --------------------------------------------------
  // CSV EXPORT
  // --------------------------------------------------

  function exportAllocation() {
    const rows = [
      [
        "Coastal Zone",
        "Risk Score (demo)",
        "Biodiversity (demo)",
        "Suggested Allocation INR",
      ],
      ...allocation.map((zone) => [
        zone.name,
        zone.risk,
        zone.biodiversity,
        zone.amount,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const safeValue = String(value ?? "");
            return `"${safeValue.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "orca-conservation-allocation-demo.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const streetUrl =
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const satelliteUrl =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="orca-visual-app">
      {/* SIDEBAR */}

      <aside className="visual-sidebar">
        <div className="visual-brand">
          <div className="visual-brand-icon">
            <Waves size={23} />
          </div>

          <div>
            <strong>
              ORCA<span>.</span>
            </strong>
            <small>OCEAN INTELLIGENCE</small>
          </div>
        </div>

        <div className="visual-side-label">
          MISSION CONTROL
        </div>

        <a className="visual-nav active" href="#overview">
          <Globe2 size={17} /> Overview
        </a>

        <a className="visual-nav" href="#geospatial">
          <Satellite size={17} /> Geospatial explorer
        </a>

        <a className="visual-nav" href="#forecast">
          <Activity size={17} /> Risk forecast
        </a>

        <a className="visual-nav" href="#environment">
          <Waves size={17} /> Ocean signals
        </a>

        <a className="visual-nav" href="#finance">
          <Wallet size={17} /> Finance optimizer
        </a>

        <a className="visual-nav" href="#register">
          <Layers3 size={17} /> Risk register
        </a>

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

      {/* MAIN CONTENT */}

      <main className="visual-main">
        <header className="visual-topbar">
          <div>
            <span className="visual-breadcrumb">ORCA /</span>{" "}
            Kerala coastal observatory
          </div>

          <div className="visual-top-right">
            <i /> SYSTEM ONLINE
            <span className="visual-top-sep" />
            ANALYTICS DEMO
          </div>
        </header>

        {/* HERO */}

        <section className="visual-hero" id="overview">
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
              A geospatial decision platform to explore coastal
              risk, compare environmental signals, and plan
              conservation funding across Kerala.
            </p>
          </div>

          <div className="visual-hero-badge">
            <Globe2 size={26} />

            <div>
              <small>OBSERVATION REGION</small>
              <strong>Kerala, India</strong>
              <span>8 coastal monitoring zones</span>
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}

        <section className="visual-stats">
          <StatCard
            icon={MapPin}
            label="ZONES MONITORED"
            value="08"
            note="Illustrative coastal sites"
            color="#6dd8cf"
          />

          <StatCard
            icon={ShieldAlert}
            label="HIGH-RISK ZONES"
            value={zones
              .filter((zone) => zone.risk >= 70)
              .length.toString()
              .padStart(2, "0")}
            note="Based on demo risk scores"
            color="#ff8588"
          />

          <StatCard
            icon={Waves}
            label="AVG. RISK SCORE"
            value={
              Math.round(
                zones.reduce((sum, zone) => sum + zone.risk, 0) /
                  zones.length
              ) + "/100"
            }
            note="Illustrative index"
            color="#e9bd69"
          />

          <StatCard
            icon={Wallet}
            label="PLANNING BUDGET"
            value={money(budget)}
            note="Editable scenario budget"
            color="#b7a0fa"
          />
        </section>

        {/* GEOSPATIAL MAP */}

        <section
          className="visual-panel visual-map-panel"
          id="geospatial"
        >
          <div className="visual-map-header">
            <SectionTitle
              eyebrow="01 / GEOSPATIAL INTELLIGENCE"
              title="Coastal risk explorer"
              description="Select a zone, switch map type, and explore the coastal risk pattern."
              icon={Satellite}
            />

            <div className="visual-map-buttons">
              <button
                className={mapMode === "street" ? "selected" : ""}
                onClick={() => setMapMode("street")}
              >
                <MapPin size={14} /> Street
              </button>

              <button
                className={mapMode === "satellite" ? "selected" : ""}
                onClick={() => setMapMode("satellite")}
              >
                <Satellite size={14} /> Satellite
              </button>
            </div>
          </div>

          <div className="visual-map-tools">
            <div className="visual-search">
              <Search size={15} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search coastal location..."
              />
            </div>

            <div className="visual-filter-group">
              {["All", "High", "Moderate", "Low"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={filter === item ? "selected" : ""}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="visual-heat-toggle">
              <input
                type="checkbox"
                checked={showHeat}
                onChange={(event) =>
                  setShowHeat(event.target.checked)
                }
              />
              Risk halos
            </label>
          </div>

          <div className="visual-map-container">
            <MapContainer
              key={mapMode}
              center={[10.15, 76.05]}
              zoom={7}
              minZoom={5}
              maxZoom={18}
              scrollWheelZoom={true}
              className="orca-leaflet-map"
              preferCanvas={true}
            >
              <MapResize />
              <FlyToZone zone={selected} />

              <TileLayer
                url={
                  mapMode === "street"
                    ? streetUrl
                    : satelliteUrl
                }
                attribution={
                  mapMode === "street"
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    : "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
                }
                maxZoom={19}
              />

              {filteredZones.map((zone) => {
                const metric =
                  mapLayer === "risk"
                    ? zone.risk
                    : mapLayer === "pollution"
                      ? zone.pollution
                      : zone.biodiversity;

                const color =
                  mapLayer === "biodiversity"
                    ? metric >= 70
                      ? "#67d5a7"
                      : metric >= 50
                        ? "#e9bd69"
                        : "#ff8588"
                    : riskColor(metric);

                return (
                  <Fragment key={zone.id}>
                    {showHeat && mapLayer !== "biodiversity" && (
                      <CircleMarker
                        center={[zone.lat, zone.lng]}
                        radius={25 + metric / 3}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.1,
                          opacity: 0.28,
                          weight: 1,
                        }}
                        interactive={false}
                      />
                    )}

                    <CircleMarker
                      center={[zone.lat, zone.lng]}
                      radius={selectedId === zone.id ? 10 : 7}
                      pathOptions={{
                        color:
                          selectedId === zone.id
                            ? "#ffffff"
                            : color,
                        fillColor: color,
                        fillOpacity: 0.95,
                        weight: selectedId === zone.id ? 3 : 2,
                      }}
                      eventHandlers={{
                        click: () => setSelectedId(zone.id),
                      }}
                    >
                      <Popup>
                        <div className="orca-map-popup">
                          <strong>{zone.name}</strong>
                          <span>Risk score: {zone.risk}/100</span>
                          <span>
                            Pollution index: {zone.pollution}/100
                          </span>
                          <span>
                            Biodiversity index: {zone.biodiversity}/100
                          </span>
                          <span>Priority issue: {zone.issue}</span>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </Fragment>
                );
              })}
            </MapContainer>

            <div className="visual-map-overlay visual-map-overlay-top">
              <Crosshair size={14} />
              <span>KERALA COASTAL OBSERVATORY</span>
              <i />
            </div>

            <div className="visual-map-overlay visual-map-overlay-bottom">
              <span>BASEMAP: {mapMode.toUpperCase()}</span>
              <span>DATA: DEMO</span>
            </div>
          </div>

          <div className="visual-layer-row">
            <span>VISUALISE:</span>

            {[
              ["risk", "Risk index"],
              ["pollution", "Pollution"],
              ["biodiversity", "Biodiversity"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMapLayer(key)}
                className={mapLayer === key ? "selected" : ""}
              >
                {label}
              </button>
            ))}

            <span className="visual-map-credit">
              Map tiles supplied by their respective providers
            </span>
          </div>

          {/* SELECTED ZONE AND RANKING */}

          <div className="visual-map-bottom-grid">
            <div className="visual-selected-location">
              <span className="visual-eyebrow">
                SELECTED COASTAL ZONE
              </span>

              <h3>
                <MapPin size={18} /> {selected.name}
              </h3>

              <div className="visual-coordinate">
                {selected.lat.toFixed(4)}° N,{" "}
                {selected.lng.toFixed(4)}° E
              </div>

              <div className="visual-selected-metrics">
                <div>
                  <small>RISK INDEX</small>
                  <strong style={{ color: riskColor(selected.risk) }}>
                    {selected.risk}
                    <small>/100</small>
                  </strong>
                </div>

                <div>
                  <small>POLLUTION</small>
                  <strong>
                    {selected.pollution}
                    <small>/100</small>
                  </strong>
                </div>

                <div>
                  <small>BIODIVERSITY</small>
                  <strong>
                    {selected.biodiversity}
                    <small>/100</small>
                  </strong>
                </div>
              </div>

              <div className="visual-priority-note">
                <ShieldAlert size={15} />
                <span>
                  <strong>Priority signal:</strong> {selected.issue}
                </span>
              </div>
            </div>

            <div className="visual-zone-rank">
              <div className="visual-rank-heading">
                <span>COASTAL RISK RANKING</span>
                <small>DEMO INDEX</small>
              </div>

              {[...zones]
                .sort((a, b) => b.risk - a.risk)
                .slice(0, 5)
                .map((zone, index) => (
                  <button
                    key={zone.id}
                    className="visual-rank-row"
                    onClick={() => setSelectedId(zone.id)}
                  >
                    <span className="visual-rank-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="visual-rank-name">
                      {zone.name}
                      <i>
                        <b
                          style={{
                            width: zone.risk + "%",
                            background: riskColor(zone.risk),
                          }}
                        />
                      </i>
                    </span>

                    <strong style={{ color: riskColor(zone.risk) }}>
                      {zone.risk}
                    </strong>
                  </button>
                ))}
            </div>
          </div>
        </section>

        {/* FORECAST AND ENVIRONMENTAL SIGNALS */}

        <section className="visual-analysis-grid" id="forecast">
          <article className="visual-panel visual-chart-panel">
            <SectionTitle
              eyebrow="02 / SCENARIO ANALYSIS"
              title="Risk forecast explorer"
              description="Explore a demonstration scenario across different time horizons."
              icon={TrendingUp}
            />

            <div className="visual-chart-highlight">
              <div>
                <small>SCENARIO HORIZON</small>
                <strong>{horizon} days</strong>
              </div>

              <div>
                <small>PROJECTED INDEX</small>
                <strong>
                  {projectedForecast.risk}
                  <span>/100</span>
                </strong>
              </div>
            </div>

            <div className="visual-range">
              <div>
                <span>FORECAST HORIZON</span>
                <strong>{horizon} days</strong>
              </div>

              <input
                type="range"
                min="7"
                max="60"
                step="1"
                value={horizon}
                onChange={(event) =>
                  setHorizon(Number(event.target.value))
                }
              />

              <div className="visual-range-labels">
                <span>7 DAYS</span>
                <span>30 DAYS</span>
                <span>60 DAYS</span>
              </div>
            </div>

            <div className="visual-chart">
              <ResponsiveContainer width="100%" height={235}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient
                      id="riskFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ff8588"
                        stopOpacity={0.32}
                      />
                      <stop
                        offset="100%"
                        stopColor="#ff8588"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#243744"
                    strokeDasharray="3 4"
                  />

                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#7f98a7", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#7f98a7", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#112330",
                      border: "1px solid #3b525f",
                      borderRadius: 8,
                      color: "#e3eef2",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#ff8588"
                    fill="url(#riskFill)"
                    strokeWidth={2.5}
                    name="Risk index"
                  />

                  <Line
                    type="monotone"
                    dataKey="pollution"
                    stroke="#e9bd69"
                    strokeWidth={2}
                    dot={false}
                    name="Pollution index"
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 10,
                      color: "#9bb0bc",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="visual-demo-warning">
              Illustrative scenario only — not a scientifically
              validated forecast. Replace with a model trained and
              evaluated on historical environmental data.
            </div>
          </article>

          <article
            className="visual-panel visual-chart-panel"
            id="environment"
          >
            <SectionTitle
              eyebrow="03 / ENVIRONMENTAL TELEMETRY"
              title="Ocean signals"
              description="Compare environmental indicators across the sample observation period."
              icon={Activity}
            />

            <div className="visual-signal-cards">
              <div>
                <Thermometer size={16} />
                <small>AVG. TEMPERATURE</small>
                <strong>{selected.temp}°C</strong>
                <span>Demo value</span>
              </div>

              <div>
                <Droplets size={16} />
                <small>POLLUTION INDEX</small>
                <strong>{selected.pollution}</strong>
                <span>Relative index</span>
              </div>

              <div>
                <Fish size={16} />
                <small>BIODIVERSITY</small>
                <strong>{selected.biodiversity}</strong>
                <span>Relative index</span>
              </div>
            </div>

            <div className="visual-chart-subtitle">
              <span>Environmental signal history</span>
              <small>DEMO SERIES</small>
            </div>

            <div className="visual-chart">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={historicalData}>
                  <CartesianGrid
                    stroke="#243744"
                    strokeDasharray="3 4"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#7f98a7", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    yAxisId="temp"
                    domain={[25, 32]}
                    tick={{ fill: "#7f98a7", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />

                  <YAxis
                    yAxisId="pollution"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fill: "#7f98a7", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={27}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#112330",
                      border: "1px solid #3b525f",
                      borderRadius: 8,
                      color: "#e3eef2",
                    }}
                  />

                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="temperature"
                    stroke="#6dd8cf"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Temperature °C"
                  />

                  <Line
                    yAxisId="pollution"
                    type="monotone"
                    dataKey="pollution"
                    stroke="#e9bd69"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Pollution index"
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 10,
                      color: "#9bb0bc",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="visual-demo-warning">
              Sample series for UI testing. No live sensor, satellite,
              or government data is connected yet.
            </div>
          </article>
        </section>

        {/* FINANCE OPTIMIZER */}

        <section
          className="visual-panel visual-finance-panel"
          id="finance"
        >
          <SectionTitle
            eyebrow="04 / CONSERVATION CAPITAL ALLOCATION"
            title="Finance optimizer"
            description="Model how a conservation budget could be distributed across zones according to relative risk and biodiversity need."
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
                      className={budget === value ? "selected" : ""}
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
                <small>ZONES CONSIDERED</small>
                <strong>{zones.length}</strong>
              </div>

              <div>
                <small>PRIORITY METHOD</small>
                <strong>Risk + need</strong>
              </div>
            </div>
          </div>

          <div className="visual-finance-tabs">
            {["Allocation", "Interventions", "Portfolio mix"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFinance(tab)}
                  className={
                    activeFinance === tab ? "selected" : ""
                  }
                >
                  {tab}
                </button>
              )
            )}
          </div>

          {activeFinance === "Allocation" && (
            <div className="visual-finance-content">
              <div className="visual-allocation-list">
                {allocation.slice(0, 6).map((zone, index) => (
                  <div
                    className="visual-allocation-row"
                    key={zone.id}
                  >
                    <div className="visual-allocation-rank">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="visual-allocation-details">
                      <strong>{zone.name}</strong>

                      <small>
                        {zone.issue} · Risk {zone.risk}/100
                      </small>

                      <div className="visual-allocation-track">
                        <i
                          style={{
                            width: `${
                              budget
                                ? (zone.amount / budget) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="visual-allocation-money">
                      <strong>{money(zone.amount)}</strong>

                      <small>
                        {budget
                          ? (
                              (zone.amount / budget) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                        % of budget
                      </small>
                    </div>

                    <button
                      className="visual-select-button"
                      title={`Select ${zone.name}`}
                      onClick={() => {
                        setSelectedId(zone.id);
                        document
                          .getElementById("geospatial")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="visual-finance-note">
                <Target size={18} />

                <div>
                  <strong>How the demo optimizer works</strong>

                  <p>
                    Funds are weighted by risk score and lower
                    biodiversity score. This is a transparent
                    illustrative heuristic, not a validated economic
                    optimizer. Real funding decisions should also
                    account for intervention costs, feasibility,
                    community needs, ecological benefit and
                    uncertainty.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeFinance === "Interventions" && (
            <div className="visual-interventions">
              {[
                {
                  name: "Pollution control",
                  share: 0.4,
                  icon: Droplets,
                  desc: "Waste interception, water quality monitoring and cleanup.",
                },
                {
                  name: "Habitat restoration",
                  share: 0.3,
                  icon: Leaf,
                  desc: "Mangrove, estuary and coastal habitat restoration.",
                },
                {
                  name: "Biodiversity protection",
                  share: 0.2,
                  icon: Fish,
                  desc: "Species and habitat protection programmes.",
                },
                {
                  name: "Monitoring & research",
                  share: 0.1,
                  icon: Activity,
                  desc: "Field sampling, sensors and data collection.",
                },
              ].map((item) => (
                <div
                  className="visual-intervention-card"
                  key={item.name}
                >
                  <item.icon size={20} />

                  <span>{item.name}</span>

                  <strong>
                    {money(Math.round(budget * item.share))}
                  </strong>

                  <div className="visual-allocation-track">
                    <i style={{ width: `${item.share * 100}%` }} />
                  </div>

                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeFinance === "Portfolio mix" && (
            <div className="visual-portfolio">
              <div className="visual-portfolio-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={financePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={98}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {financePie.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={colors[index]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: "#112330",
                        border: "1px solid #3b525f",
                        borderRadius: 8,
                        color: "#e3eef2",
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{
                        fontSize: 10,
                        color: "#9bb0bc",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="visual-portfolio-breakdown">
                {financePie.map((item, index) => (
                  <div key={item.name}>
                    <i style={{ background: colors[index] }} />
                    <span>{item.name}</span>
                    <strong>
                      {money(
                        Math.round((budget * item.value) / 100)
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="visual-finance-footer">
            <span>
              <i /> SIMULATED FINANCIAL SCENARIO · EDITABLE BUDGET
            </span>

            <button onClick={exportAllocation}>
              <Download size={14} /> Export allocation CSV
            </button>
          </div>
        </section>

        {/* COASTAL RISK REGISTER */}

        <section
          className="visual-panel visual-register-panel"
          id="register"
        >
          <SectionTitle
            eyebrow="05 / PRIORITY REGISTER"
            title="Coastal zone comparison"
            description="Select any location to inspect its metrics on the map."
            icon={SlidersHorizontal}
          />

          <div className="visual-register-grid">
            {filteredZones.map((zone) => (
              <button
                key={zone.id}
                className={`visual-register-card ${
                  selectedId === zone.id ? "chosen" : ""
                }`}
                onClick={() => {
                  setSelectedId(zone.id);
                  document
                    .getElementById("geospatial")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="visual-register-card-top">
                  <span
                    className="visual-zone-dot"
                    style={{ background: riskColor(zone.risk) }}
                  />

                  {zone.category.toUpperCase()}

                  <ArrowUpRight size={14} />
                </div>

                <strong>{zone.name}</strong>

                <div className="visual-register-score">
                  <span>Risk index</span>

                  <b style={{ color: riskColor(zone.risk) }}>
                    {zone.risk}
                    <small>/100</small>
                  </b>
                </div>

                <div className="visual-allocation-track">
                  <i
                    style={{
                      width: `${zone.risk}%`,
                      background: riskColor(zone.risk),
                    }}
                  />
                </div>

                <div className="visual-register-meta">
                  <span>
                    Pollution <b>{zone.pollution}</b>
                  </span>

                  <span>
                    Biodiversity <b>{zone.biodiversity}</b>
                  </span>
                </div>

                <small className="visual-register-issue">
                  {zone.issue}
                </small>
              </button>
            ))}

            {filteredZones.length === 0 && (
              <p className="visual-empty">
                No zones match this search. Try a different location
                or risk level.
              </p>
            )}
          </div>
        </section>

        {/* FOOTER */}

        <footer className="visual-footer">
          <span>
            ORCA · OCEAN RISK & CONSERVATION ASSESSMENT
          </span>

          <span>
            STUDENT PROJECT · DEMO DATA · NOT FOR REAL-WORLD
            FUNDING DECISIONS
          </span>

          <button onClick={() => window.location.reload()}>
            <RefreshCw size={12} /> Reset demo
          </button>
        </footer>
      </main>
    </div>
  );
}
