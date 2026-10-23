
import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./KeralaMap.css";

const coastalZones = [
  {
    id: 1,
    name: "Kasaragod Coast",
    district: "Kasaragod",
    position: [12.42, 74.98],
    pollution: 32,
    temperature: 29,
    chlorophyll: 0.8,
    humanActivity: 38
  },
  {
    id: 2,
    name: "Kannur Coast",
    district: "Kannur",
    position: [11.87, 75.30],
    pollution: 48,
    temperature: 30,
    chlorophyll: 1.1,
    humanActivity: 55
  },
  {
    id: 3,
    name: "Kozhikode Coast",
    district: "Kozhikode",
    position: [11.25, 75.68],
    pollution: 64,
    temperature: 30,
    chlorophyll: 1.4,
    humanActivity: 72
  },
  {
    id: 4,
    name: "Ponnani Coast",
    district: "Malappuram",
    position: [10.75, 75.80],
    pollution: 57,
    temperature: 29,
    chlorophyll: 1.2,
    humanActivity: 61
  },
  {
    id: 5,
    name: "Kochi Coast",
    district: "Ernakulam",
    position: [9.90, 76.15],
    pollution: 78,
    temperature: 31,
    chlorophyll: 1.8,
    humanActivity: 86
  },
  {
    id: 6,
    name: "Alappuzha Coast",
    district: "Alappuzha",
    position: [9.48, 76.25],
    pollution: 51,
    temperature: 30,
    chlorophyll: 1.5,
    humanActivity: 58
  },
  {
    id: 7,
    name: "Kollam Coast",
    district: "Kollam",
    position: [8.88, 76.48],
    pollution: 43,
    temperature: 30,
    chlorophyll: 1.0,
    humanActivity: 49
  },
  {
    id: 8,
    name: "Vizhinjam Coast",
    district: "Thiruvananthapuram",
    position: [8.37, 76.92],
    pollution: 46,
    temperature: 29,
    chlorophyll: 1.3,
    humanActivity: 63
  }
];

const layerOptions = [
  { value: "overall", label: "Overall risk" },
  { value: "pollution", label: "Pollution" },
  { value: "temperature", label: "Temperature" },
  { value: "chlorophyll", label: "Chlorophyll" },
  { value: "humanActivity", label: "Human activity" }
];

function getScore(zone, layer) {
  if (layer === "overall") {
    // Illustrative demo score, not a validated scientific model.
    return Math.round(
      zone.pollution * 0.35 +
      ((zone.temperature - 25) / 10) * 100 * 0.20 +
      Math.min(zone.chlorophyll / 3, 1) * 100 * 0.15 +
      zone.humanActivity * 0.30
    );
  }

  if (layer === "temperature") {
    return Math.max(0, Math.min(100, (zone.temperature - 25) * 10));
  }

  if (layer === "chlorophyll") {
    return Math.max(0, Math.min(100, (zone.chlorophyll / 3) * 100));
  }

  return zone[layer];
}

function getRisk(score) {
  if (score >= 65) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}

function getRiskColor(score) {
  if (score >= 65) return "#D8785D";
  if (score >= 40) return "#D5A94F";
  return "#609B83";
}

function MapFocus({ selectedZone }) {
  const map = useMap();

  if (selectedZone) {
    map.flyTo(selectedZone.position, 9, { duration: 0.8 });
  }

  return null;
}

function Metric({ label, value, unit = "" }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>
        {value}
        {unit}
      </strong>
    </div>
  );
}

export default function KeralaMap() {
  const [layer, setLayer] = useState("overall");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(5);

  const selectedZone =
    coastalZones.find((zone) => zone.id === selectedId) ??
    coastalZones[0];

  const enrichedZones = useMemo(
    () =>
      coastalZones.map((zone) => {
        const score = getScore(zone, layer);

        return {
          ...zone,
          score,
          risk: getRisk(score),
          color: getRiskColor(score)
        };
      }),
    [layer]
  );

  const visibleZones = enrichedZones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(search.toLowerCase()) ||
      zone.district.toLowerCase().includes(search.toLowerCase());

    const matchesRisk =
      riskFilter === "All" || zone.risk === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const activeZone =
    enrichedZones.find((zone) => zone.id === selectedId) ??
    enrichedZones[0];

  const highRiskCount = enrichedZones.filter(
    (zone) => zone.risk === "High"
  ).length;

  return (
    <div className="orca-map-page">
      <header className="map-page-header">
        <div>
          <div className="eyebrow">MARINE INTELLIGENCE / KERALA</div>
          <h1>Ocean Risk Explorer</h1>
          <p>
            Explore coastal conditions, environmental pressures
            and marine conservation priorities.
          </p>
        </div>

        <div className="demo-status">
          <span className="status-dot" />
          DEMO DATA
        </div>
      </header>

      <section className="map-summary-grid">
        <Metric label="Coastal zones" value={coastalZones.length} />
        <Metric label="High-risk zones*" value={highRiskCount} />
        <Metric
          label="Selected zone score*"
          value={activeZone.score}
          unit="/100"
        />
      </section>

      <div className="map-workspace">
        <section className="map-panel">
          <div className="map-toolbar">
            <div>
              <h2>Kerala coastline</h2>
              <p>Choose a marker to inspect a zone</p>
            </div>

            <label className="layer-select">
              <span>Map layer</span>
              <select
                value={layer}
                onChange={(event) => setLayer(event.target.value)}
              >
                {layerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="map-canvas">
            <MapContainer
              center={[10.15, 76.05]}
              zoom={7}
              minZoom={6}
              maxZoom={13}
              scrollWheelZoom={true}
              className="kerala-leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFocus selectedZone={activeZone} />

              {visibleZones.map((zone) => (
                <CircleMarker
                  key={zone.id}
                  center={zone.position}
                  radius={zone.id === selectedId ? 12 : 8}
                  pathOptions={{
                    color: "#FFFFFF",
                    weight: zone.id === selectedId ? 4 : 2,
                    fillColor: zone.color,
                    fillOpacity: 0.95
                  }}
                  eventHandlers={{
                    click: () => setSelectedId(zone.id)
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>{zone.name}</strong>
                      <span>{zone.district} district</span>
                      <b style={{ color: zone.color }}>
                        {zone.risk} risk · {zone.score}/100*
                      </b>
                      <button
                        onClick={() => setSelectedId(zone.id)}
                      >
                        View zone details
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <div className="map-legend">
            <span><i className="legend-dot low" /> Low</span>
            <span><i className="legend-dot moderate" /> Moderate</span>
            <span><i className="legend-dot high" /> High</span>
            <span className="legend-note">*Illustrative scores</span>
          </div>
        </section>

        <aside className="zone-panel">
          <div className="zone-panel-heading">
            <div>
              <div className="eyebrow">ZONE INTELLIGENCE</div>
              <h2>Explore a zone</h2>
            </div>
            <span className="zone-number">
              {String(activeZone.id).padStart(2, "0")}
            </span>
          </div>

          <input
            className="zone-search"
            placeholder="Search coast or district..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="risk-filter-row">
            {["All", "Low", "Moderate", "High"].map((risk) => (
              <button
                key={risk}
                className={
                  riskFilter === risk ? "filter-chip active" : "filter-chip"
                }
                onClick={() => setRiskFilter(risk)}
              >
                {risk}
              </button>
            ))}
          </div>

          <div className="zone-list">
            {visibleZones.map((zone) => (
              <button
                key={zone.id}
                className={
                  zone.id === selectedId
                    ? "zone-list-item selected"
                    : "zone-list-item"
                }
                onClick={() => setSelectedId(zone.id)}
              >
                <span
                  className="zone-list-dot"
                  style={{ background: zone.color }}
                />
                <span className="zone-list-text">
                  <strong>{zone.name}</strong>
                  <small>{zone.district}</small>
                </span>
                <span className="zone-list-score">{zone.score}</span>
              </button>
            ))}

            {visibleZones.length === 0 && (
              <p className="empty-state">
                No zones match those filters.
              </p>
            )}
          </div>

          <div className="selected-zone-details">
            <div className="selected-zone-title">
              <div>
                <span className="eyebrow">SELECTED LOCATION</span>
                <h3>{activeZone.name}</h3>
              </div>
              <span
                className="risk-pill"
                style={{
                  color: activeZone.color,
                  background: `${activeZone.color}1A`
                }}
              >
                {activeZone.risk}
              </span>
            </div>

            <div className="details-grid">
              <Metric
                label="Pollution index"
                value={activeZone.pollution}
                unit="/100"
              />
              <Metric
                label="Temperature"
                value={activeZone.temperature}
                unit="°C"
              />
              <Metric
                label="Chlorophyll"
                value={activeZone.chlorophyll}
                unit="*"
              />
              <Metric
                label="Human activity"
                value={activeZone.humanActivity}
                unit="/100"
              />
            </div>

            <div className="zone-insight">
              <strong>What to investigate</strong>
              <p>
                {activeZone.pollution >= 65
                  ? "Pollution is elevated in this demo scenario. Prioritise checking verified pollution measurements and potential sources."
                  : "Compare verified pollution, temperature and habitat observations before assigning conservation priorities."}
              </p>
            </div>

            <p className="data-disclaimer">
              All environmental values and risk classifications are
              simulated for interface testing. They do not describe
              actual conditions at these locations. Chlorophyll units
              are not yet specified.
            </p>
          </div>
        </aside>
      </div>

      <footer className="map-footer">
        <span>ORCA · Ocean Risk & Conservation Assessment</span>
        <span>Kerala coastal prototype · OpenStreetMap</span>
      </footer>
    </div>
  );
}
