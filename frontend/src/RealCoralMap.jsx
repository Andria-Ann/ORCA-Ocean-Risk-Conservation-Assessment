
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  Tooltip,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./RealCoralMap.css";

// CSV parser that supports quoted fields and commas inside quotes.
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
      row.push(field.trim());
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;

      row.push(field.trim());

      if (row.some(value => value !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field.trim());

    if (row.some(value => value !== "")) {
      rows.push(row);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(header => header.trim());

  return rows.slice(1).map(values =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        (values[index] ?? "").trim()
      ])
    )
  );
}

const metrics = {
  bleaching: {
    label: "Average bleaching",
    key: "avg_bleaching_percent",
    unit: "%",
    color: "#e58b77"
  },
  stress: {
    label: "Average heat stress (DHW)",
    key: "avg_dhw_stress",
    unit: " DHW",
    color: "#d9a441"
  },
  temperature: {
    label: "Average temperature",
    key: "avg_temperature_c",
    unit: " °C",
    color: "#739ad0"
  },
  anomaly: {
    label: "Temperature anomaly",
    key: "avg_temperature_anomaly",
    unit: " °C",
    color: "#8b82c8"
  }
};

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const refreshMap = () => {
      requestAnimationFrame(() => {
        map.invalidateSize({
          animate: false,
          pan: false
        });
      });
    };

    let observer;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(refreshMap);
      observer.observe(container);
    }

    refreshMap();

    const timer1 = setTimeout(refreshMap, 300);
    const timer2 = setTimeout(refreshMap, 800);

    window.addEventListener("resize", refreshMap);

    return () => {
      observer?.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", refreshMap);
    };
  }, [map]);

  return null;
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "—";
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed.toFixed(digits) : "—";
}

function getScreenColor(screen) {
  const value = String(screen ?? "").toLowerCase();

  if (value.includes("high") || value.includes("severe")) {
    return "#d95f70";
  }

  if (value.includes("moderate") || value.includes("elevated")) {
    return "#d9a441";
  }

  if (value.includes("low")) {
    return "#399b80";
  }

  return "#8b82c8";
}

export default function RealCoralMap() {
  const [sites, setSites] = useState([]);
  const [mapType, setMapType] = useState("ocean");
  const [metric, setMetric] = useState("bleaching");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the actual coral monitoring CSV.
  useEffect(() => {
    let cancelled = false;

    async function loadCoralData() {
      try {
        const response = await fetch("/data/coral_risk_by_site.csv");

        if (!response.ok) {
          throw new Error(
            "Could not load the coral CSV. Check frontend/public/data/coral_risk_by_site.csv."
          );
        }

        const csvText = await response.text();
        const rows = parseCSV(csvText).filter(row => row.site_name);

        if (!rows.length) {
          throw new Error(
            "The coral CSV loaded, but no monitoring-site records were found."
          );
        }

        if (!cancelled) {
          setSites(rows);
          setSelected(rows[0].site_name);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "An unexpected error occurred while loading coral data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCoralData();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentMetric = metrics[metric];

  // Sort sites by the currently selected real CSV measurement.
  const sortedSites = useMemo(() => {
    return [...sites].sort((a, b) => {
      const aValue = Number(a[currentMetric.key]);
      const bValue = Number(b[currentMetric.key]);

      const safeA = Number.isFinite(aValue) ? aValue : -Infinity;
      const safeB = Number.isFinite(bValue) ? bValue : -Infinity;

      return safeB - safeA;
    });
  }, [sites, currentMetric.key]);

  const selectedSite = sites.find(
    site => site.site_name === selected
  );

  const tileLayers = {
    ocean: {
      name: "Ocean Atlas",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles © Esri"
    },
    satellite: {
      name: "Satellite Explorer",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Imagery © Esri"
    },
    street: {
      name: "Street Map",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  };

  return (
    <section className="coral-explorer">
      <div className="coral-heading">
        <div>
          <span className="coral-eyebrow">
            REAL DATA · SPARK CSV
          </span>

          <h2>Coral monitoring explorer</h2>

          <p>
            Explore coral monitoring measurements from the supplied
            dataset, compare site-level indicators, and inspect recorded
            environmental conditions.
          </p>
        </div>

        <span className="coral-count">
          {sites.length} monitoring sites
        </span>
      </div>

      {loading && (
        <div className="coral-loading">
          Loading coral monitoring data...
        </div>
      )}

      {error && (
        <div className="coral-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="coral-controls">
            <label>
              Map style

              <select
                value={mapType}
                onChange={event => setMapType(event.target.value)}
              >
                <option value="ocean">Ocean Atlas</option>
                <option value="satellite">Satellite Explorer</option>
                <option value="street">Street Map</option>
              </select>
            </label>

            <label>
              Compare measurement

              <select
                value={metric}
                onChange={event => setMetric(event.target.value)}
              >
                {Object.entries(metrics).map(([key, item]) => (
                  <option value={key} key={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="coral-map-layout">
            <div className="coral-map">
              <MapContainer
                key={mapType}
                center={[9.5, 79.0]}
                zoom={7}
                scrollWheelZoom
                className="coral-leaflet-map"
              >
                <MapResizer />

                <TileLayer
                  attribution={tileLayers[mapType].attribution}
                  url={tileLayers[mapType].url}
                  maxZoom={19}
                  keepBuffer={4}
                />

                <Popup position={[9.5, 79.0]}>
                  <strong>Study-region overview</strong>
                  <br />
                  {tileLayers[mapType].name}
                  <br />
                  Select a monitoring site from the panel to inspect
                  its actual CSV measurements.
                </Popup>
              </MapContainer>

              <div className="coral-map-note">
                Regional overview · Gulf of Mannar / Palk Bay
              </div>
            </div>

            <aside className="coral-site-panel">
              <h3>Site measurements</h3>

              <p className="coral-muted">
                Ranked by {currentMetric.label.toLowerCase()}.
                Choose a site to view its measurements.
              </p>

              <div className="coral-site-list">
                {sortedSites.map((site, index) => {
                  const isSelected = selected === site.site_name;

                  return (
                    <button
                      type="button"
                      key={site.site_name}
                      className={`coral-site-option ${
                        isSelected ? "selected" : ""
                      }`}
                      aria-pressed={isSelected}
                      onClick={() => setSelected(site.site_name)}
                    >
                      <span
                        className="coral-rank-dot"
                        style={{
                          background: currentMetric.color
                        }}
                      />

                      <span className="coral-site-name">
                        <strong>{site.site_name}</strong>

                        <small>
                          Rank {index + 1} · CSV measurement
                        </small>
                      </span>

                      <strong className="coral-site-value">
                        {formatNumber(site[currentMetric.key])}
                        {currentMetric.unit}
                      </strong>
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>

          {selectedSite && (
            <div className="coral-detail">
              <div>
                <span className="coral-eyebrow">
                  SELECTED MONITORING SITE
                </span>

                <h3>{selectedSite.site_name}</h3>

                <p>
                  {formatNumber(selectedSite.observation_count, 0)}{" "}
                  observations in the supplied summary.
                </p>
              </div>

              <div className="coral-detail-grid">
                <div>
                  <span>Avg. temperature</span>
                  <strong>
                    {formatNumber(selectedSite.avg_temperature_c)} °C
                  </strong>
                </div>

                <div>
                  <span>Temperature anomaly</span>
                  <strong>
                    {formatNumber(selectedSite.avg_temperature_anomaly)} °C
                  </strong>
                </div>

                <div>
                  <span>Avg. heat stress</span>
                  <strong>
                    {formatNumber(selectedSite.avg_dhw_stress)} DHW
                  </strong>
                </div>

                <div>
                  <span>Maximum heat stress</span>
                  <strong>
                    {formatNumber(selectedSite.max_dhw_stress)} DHW
                  </strong>
                </div>

                <div>
                  <span>Avg. bleaching</span>
                  <strong>
                    {formatNumber(selectedSite.avg_bleaching_percent)}%
                  </strong>
                </div>

                <div>
                  <span>Maximum bleaching</span>
                  <strong>
                    {formatNumber(selectedSite.max_bleaching_percent)}%
                  </strong>
                </div>

                <div>
                  <span>Dissolved oxygen</span>
                  <strong>
                    {formatNumber(selectedSite.avg_dissolved_oxygen)}
                  </strong>
                </div>

                <div>
                  <span>Average pH</span>
                  <strong>
                    {formatNumber(selectedSite.avg_ph)}
                  </strong>
                </div>

                <div>
                  <span>Heat-stress screen</span>
                  <strong
                    style={{
                      color: getScreenColor(selectedSite.heat_stress_screen)
                    }}
                  >
                    {selectedSite.heat_stress_screen || "—"}
                  </strong>
                </div>

                <div>
                  <span>Bleaching screen</span>
                  <strong
                    style={{
                      color: getScreenColor(selectedSite.bleaching_screen)
                    }}
                  >
                    {selectedSite.bleaching_screen || "—"}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <p className="coral-disclaimer">
            Location note: the supplied CSV does not contain coordinates
            for individual monitoring sites. The map therefore shows the
            wider study region only; it does not assign fabricated marker
            locations to the sites. Rankings compare the selected
            measurement and are not a validated ecological risk score.
          </p>
        </>
      )}
    </section>
  );
}
