import { useEffect, useState } from "react";

const MetricRow = ({ label, value, unit }) => {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#A8AFB3" }}>{label}</span>
            <span style={{ fontSize: 14, color: "#46B780", fontWeight: "bold" }}>
                {value ?? "—"}{value != null && unit ? ` ${unit}` : ""}
            </span>
        </div>
    );
};

const MetricsOverlay = ({ metrics, visible }) => {
    const [displayed, setDisplayed] = useState(null);

    useEffect(() => {
        if (metrics) setDisplayed(metrics);
    }, [metrics]);

    if (!visible || !displayed) return null;

    return (
        <div style={{
            position: "absolute",
            bottom: 32,
            right: 16,
            zIndex: 1000,
            backgroundColor: "#1E1F2E",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "14px 18px",
            minWidth: 220,
            color: "#fff",
            fontFamily: "monospace",
            pointerEvents: "none",
        }}>
            <p style={{ fontSize: 11, color: "#A8AFB3", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Performance Metrics
            </p>
            <MetricRow label="Algorithm" value={displayed.algorithmName} unit="" />
            <MetricRow label="Exec. time" value={displayed.execTime} unit="ms" />
            <MetricRow label="Nodes explored" value={displayed.nodesExplored} unit="" />
            <MetricRow label="Path length" value={displayed.pathLength} unit="km" />
            <MetricRow label="Memory (nodes)" value={displayed.memoryUsage} unit="" />
        </div>
    );
};

export default MetricsOverlay;