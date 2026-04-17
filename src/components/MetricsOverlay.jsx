import { Button } from "@mui/material";

const MetricRow = ({ label, value, unit }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 12, color: "#A8AFB3" }}>{label}</span>
      <span style={{ fontSize: 14, color: "#46B780", fontWeight: "bold" }}>
        {value ?? "—"}
        {value != null && unit ? ` ${unit}` : ""}
      </span>
    </div>
  );
};

const MetricsOverlay = ({
  metrics,
  visible,
  savedComparisons = [],
  onSaveComparison,
  onClearComparisons,
}) => {
  if (!visible) return null;

  const hasSavedComparisons = savedComparisons.length > 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        right: 16,
        zIndex: 1000,
        backgroundColor: "#1E1F2E",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "14px 18px",
        minWidth: 280,
        maxWidth: 360,
        maxHeight: "70vh",
        overflow: "auto",
        color: "#fff",
        fontFamily: "monospace",
        pointerEvents: "none",
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: "#A8AFB3",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 12,
        }}
      >
        Comparison Metrics
      </p>

      {metrics ? (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>Current run</span>
            <Button
              size="small"
              variant="contained"
              onClick={onSaveComparison}
              disabled={!metrics}
              style={{
                backgroundColor: "#46B780",
                color: "#fff",
                fontSize: 11,
                textTransform: "none",
                pointerEvents: "all",
              }}
            >
              Save current algorithm
            </Button>
          </div>
          <MetricRow label="Algorithm" value={metrics.algorithmName} unit="" />
          <MetricRow label="Exec. time" value={metrics.execTime} unit="ms" />
          <MetricRow
            label="Nodes explored"
            value={metrics.nodesExplored}
            unit=""
          />
          <MetricRow label="Path length" value={metrics.pathLength} unit="km" />
          <MetricRow
            label="Memory (nodes)"
            value={metrics.memoryUsage}
            unit=""
          />
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "#A8AFB3" }}>
            Run an algorithm to capture metrics.
          </span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700 }}>Saved runs</span>
        <Button
          size="small"
          variant="outlined"
          onClick={onClearComparisons}
          disabled={!hasSavedComparisons}
          style={{
            borderColor: "rgba(255,255,255,0.25)",
            color: "#fff",
            fontSize: 11,
            textTransform: "none",
            pointerEvents: "all",
          }}
        >
          Clear saved
        </Button>
      </div>

      {!hasSavedComparisons ? (
        <div style={{ fontSize: 12, color: "#A8AFB3" }}>
          Saved routes will appear here for side-by-side comparison.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {savedComparisons.map((comparison) => (
            <div
              key={comparison.id}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "10px 12px",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: `rgb(${comparison.color.join(", ")})`,
                    flex: "0 0 auto",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {comparison.label}
                </span>
              </div>
              <MetricRow
                label="Exec. time"
                value={comparison.metrics.execTime}
                unit="ms"
              />
              <MetricRow
                label="Nodes explored"
                value={comparison.metrics.nodesExplored}
                unit=""
              />
              <MetricRow
                label="Path length"
                value={comparison.metrics.pathLength}
                unit="km"
              />
              <MetricRow
                label="Memory (nodes)"
                value={comparison.metrics.memoryUsage}
                unit=""
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MetricsOverlay;
