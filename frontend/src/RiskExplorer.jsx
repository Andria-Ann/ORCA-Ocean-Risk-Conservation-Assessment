
import { useMemo, useState } from "react";
import "./RiskExplorer.css";

const zones = [
  {
    id: 1,
    name: "Coral Bay",
    region: "Coastal reef",
    temperature: 31.4,
    pollution: 78,
    chlorophyll: 72,
    humanActivity: 85,
    vulnerability: 88,
    investment: 180000,
  },
  {
    id: 2,
    name: "Azure Shelf",
    region: "Continental shelf",
    temperature: 29.2,
    pollution: 55,
    chlorophyll: 61,
    humanActivity: 48,
    vulnerability: 63,
    investment: 120000,
  },
  {
    id: 3,
    name: "Seagrass Point",
    region: "Seagrass habitat",
    temperature: 27.8,
    pollution: 24,
    chlorophyll: 45,
    humanActivity: 32,
    vulnerability: 35,
    investment: 75000,
  },
  {
    id: 4,
    name: "Turtle Cove",
    region: "Marine biodiversity",
    temperature: 30.1,
    pollution: 43,
    chlorophyll: 58,
    humanActivity: 68,
    vulnerability: 71,
    investment: 95000,
  },
];

const factors = [
  { id: "overall", label: "Overall risk", icon: "◈" },
  { id: "temperature", label: "Temperature", icon: "♨" },
  { id: "pollution", label: "Pollution", icon: "≋" },
  { id: "chlorophyll", label: "Chlorophyll", icon: "✳" },
  { id: "humanActivity", label: "Human activity", icon: "⌁" },
];

function riskScore(zone, factor) {
  if (factor === "overall") {
    return Math.round(
      zone.pollution * 0.25 +
      zone.humanActivity * 0.25 +
      zone.vulnerability * 0.30 +
      zone.chlorophyll * 0.10 +
      Math.min(100, Math.max(0, (zone.temperature - 25) * 12.5)) * 0.10
    );
  }

  if (factor === "temperature") {
    return Math.round(Math.min(100, Math.max(0, (zone.temperature - 25) * 12.5)));
  }

  return zone[factor];
}

function getRiskLabel(score) {
  if (score >= 70) return "High risk";
  if (score >= 40) return "Moderate";
  return "Lower risk";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function RiskExplorer() {
  const [factor, setFactor] = useState("overall");
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const rankedZones = useMemo(() => {
    return zones
      .map((zone) => ({
        ...zone,
        score: riskScore(zone, factor),
      }))
      .sort((a, b) => b.score - a.score);
  }, [factor]);

  const filteredZones = rankedZones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(search.toLowerCase()) ||
      zone.region.toLowerCase().includes(search.toLowerCase());

    const matchesRisk =
      riskFilter === "all" ||
      (riskFilter === "high" && zone.score >= 70) ||
      (riskFilter === "moderate" && zone.score >= 40 && zone.score < 70) ||
      (riskFilter === "low" && zone.score < 40);

    return matchesSearch && matchesRisk;
  });

  const selectedZone =
    rankedZones.find((zone) => zone.id === selectedId) || rankedZones[0];

  const highRiskCount = rankedZones.filter((zone) => zone.score >= 70).length;
  const averageRisk = Math.round(
    rankedZones.reduce((total, zone) => total + zone.score, 0) /
    rankedZones.length
  );

  return (
    <div className="risk-explorer">
      <div className="risk-page-heading">
        <div>
          <div className="eyebrow">ORCA / ANALYTICS MODULE</div>
          <h2>Ocean Risk Explorer</h2>
          <p>
            Explore environmental pressures and identify marine areas
            that may need conservation attention.
          </p>
        </div>
        <span className="sample-label">
          <span /> SIMULATED DATA
        </span>
      </div>

      <div className="explorer-notice">
        <span className="notice-icon">ⓘ</span>
        <p>
          <strong>Demonstration mode.</strong> All locations, measurements,
          risk scores and costs below are illustrative. They are not live
          observations or validated scientific risk estimates.
        </p>
      </div>

      <section className="explorer-stats">
        <article className="explorer-stat">
          <span className="stat-icon stat-blue">◎</span>
          <span className="stat-label">SAMPLE ZONES</span>
          <strong>{zones.length}</strong>
          <small>Available for exploration</small>
        </article>

        <article className="explorer-stat">
          <span className="stat-icon stat-green">↗</span>
          <span className="stat-label">HIGH-RISK ZONES</span>
          <strong>{highRiskCount}</strong>
          <small>Under the selected risk model</small>
        </article>

        <article className="explorer-stat">
          <span className="stat-icon stat-blue">◈</span>
          <span className="stat-label">AVERAGE RISK INDEX</span>
          <strong>{averageRisk}<small> / 100</small></strong>
          <small>Across the sample zones</small>
        </article>
      </section>

      <section className="explorer-panel">
        <div className="explorer-panel-heading">
          <div>
            <span className="eyebrow">ENVIRONMENTAL VARIABLES</span>
            <h3>Choose a risk factor</h3>
            <p>The rankings and scores update when you change the factor.</p>
          </div>
        </div>

        <div className="factor-grid">
          {factors.map((item) => (
            <button
              key={item.id}
              className={`factor-button ${factor === item.id ? "factor-active" : ""}`}
              onClick={() => setFactor(item.id)}
            >
              <span className="factor-icon">{item.icon}</span>
              <span>{item.label}</span>
              {factor === item.id && <span className="factor-check">✓</span>}
            </button>
          ))}
        </div>
      </section>

      <div className="explorer-main-grid">
        <section className="explorer-panel zone-explorer-panel">
          <div className="explorer-panel-heading">
            <div>
              <span className="eyebrow">ZONE COMPARISON</span>
              <h3>Marine risk rankings</h3>
            </div>
            <span className="result-count">{filteredZones.length} zones</span>
          </div>

          <div className="zone-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search marine zones..."
              aria-label="Search marine zones"
            />
          </div>

          <div className="risk-filter-row">
            <label htmlFor="risk-filter">Risk category</label>
            <select
              id="risk-filter"
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              <option value="high">High risk</option>
              <option value="moderate">Moderate</option>
              <option value="low">Lower risk</option>
            </select>
          </div>

          <div className="ranked-zone-list">
            {filteredZones.map((zone, index) => (
              <button
                key={zone.id}
                className={`ranked-zone ${selectedId === zone.id ? "ranked-zone-active" : ""}`}
                onClick={() => setSelectedId(zone.id)}
              >
                <span className="zone-rank">{String(index + 1).padStart(2, "0")}</span>

                <span className="ranked-zone-info">
                  <strong>{zone.name}</strong>
                  <small>{zone.region}</small>
                  <span className="risk-meter">
                    <span
                      className={
                        zone.score >= 70
                          ? "meter-high"
                          : zone.score >= 40
                            ? "meter-medium"
                            : "meter-low"
                      }
                      style={{ width: `${zone.score}%` }}
                    />
                  </span>
                </span>

                <span className="ranked-zone-score">
                  <strong>{zone.score}</strong>
                  <small>{getRiskLabel(zone.score)}</small>
                </span>
              </button>
            ))}

            {filteredZones.length === 0 && (
              <div className="empty-zones">
                No zones match these filters. Try another search or category.
              </div>
            )}
          </div>
        </section>

        <section className="explorer-panel selected-zone-panel">
          <div className="zone-detail-banner">
            <div className="detail-watermark">◈</div>
            <span className="eyebrow">SELECTED MARINE ZONE</span>
            <h3>{selectedZone.name}</h3>
            <p>{selectedZone.region}</p>
            <div className="detail-score">
              <strong>{selectedZone.score}</strong>
              <span>/ 100</span>
            </div>
            <span
              className={`detail-risk-pill ${
                selectedZone.score >= 70
                  ? "detail-high"
                  : selectedZone.score >= 40
                    ? "detail-medium"
                    : "detail-low"
              }`}
            >
              {getRiskLabel(selectedZone.score)}
            </span>
          </div>

          <div className="detail-content">
            <span className="eyebrow">ENVIRONMENTAL PROFILE</span>
            <h4>Pressure indicators</h4>

            <div className="indicator-row">
              <div><span>Temperature</span><strong>{selectedZone.temperature}°C</strong></div>
              <div className="indicator-track"><span style={{ width: `${Math.min(100, selectedZone.temperature / 40 * 100)}%` }} /></div>
            </div>

            <div className="indicator-row">
              <div><span>Pollution pressure</span><strong>{selectedZone.pollution}/100</strong></div>
              <div className="indicator-track"><span style={{ width: `${selectedZone.pollution}%` }} /></div>
            </div>

            <div className="indicator-row">
              <div><span>Chlorophyll index</span><strong>{selectedZone.chlorophyll}/100</strong></div>
              <div className="indicator-track"><span style={{ width: `${selectedZone.chlorophyll}%` }} /></div>
            </div>

            <div className="indicator-row">
              <div><span>Human activity</span><strong>{selectedZone.humanActivity}/100</strong></div>
              <div className="indicator-track"><span style={{ width: `${selectedZone.humanActivity}%` }} /></div>
            </div>

            <div className="indicator-row">
              <div><span>Ecosystem vulnerability</span><strong>{selectedZone.vulnerability}/100</strong></div>
              <div className="indicator-track"><span style={{ width: `${selectedZone.vulnerability}%` }} /></div>
            </div>

            <div className="investment-preview">
              <span className="investment-icon">↗</span>
              <div>
                <small>ILLUSTRATIVE INTERVENTION BUDGET</small>
                <strong>{formatCurrency(selectedZone.investment)}</strong>
              </div>
            </div>

            <p className="detail-footnote">
              Scores use demo values and simplified calculations for interface
              testing. They require real data and scientific validation before use.
            </p>
          </div>
        </section>
      </div>

      <footer className="explorer-footer">
        <span>ORCA · Ocean Risk & Conservation Assessment</span>
        <span>Exploration mode · Not a live monitoring service</span>
      </footer>
    </div>
  );
}

export default RiskExplorer;
