import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Assessment, ChevronRight, Close, DeleteSweep } from "@mui/icons-material";

const SIDEBAR_WIDTH = 370;

function formatMetric(value, suffix = "") {
  if (value == null || value === "") return "—";
  return `${value}${suffix}`;
}

function getNodesPerSecond(metrics) {
  if (metrics?.nodesPerSecond != null && metrics.nodesPerSecond !== "") {
    return metrics.nodesPerSecond;
  }
  const execMs = Number.parseFloat(metrics?.execTime ?? 0);
  const explored = Number.parseFloat(metrics?.nodesExplored ?? 0);
  if (!Number.isFinite(execMs) || execMs <= 0 || !Number.isFinite(explored)) {
    return "—";
  }
  return (explored / (execMs / 1000)).toFixed(1);
}

// A single metric row inside a card
function MetricRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        py: 0.35,
      }}
    >
      <Typography sx={{ fontSize: 11, color: "#8a9bb5" }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, color: "#e8f0fa", fontWeight: 600, fontFamily: "monospace" }}>
        {value}
      </Typography>
    </Box>
  );
}

// Color pill + algo name badge
function AlgoBadge({ color, label }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: `rgb(${color.join(",")})`,
          boxShadow: `0 0 6px 1px rgba(${color.join(",")},0.55)`,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: `rgb(${color.join(",")})`,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

// A card for one saved algorithm run
function ComparisonCard({ comparison, isLatest }) {
  const { color, label, metrics } = comparison;
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid rgba(${color.join(",")},${isLatest ? "0.45" : "0.2"})`,
        backgroundColor: `rgba(${color.join(",")},0.06)`,
        p: 1.5,
        position: "relative",
        transition: "border-color 0.2s",
      }}
    >
      {isLatest && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 10,
            fontSize: 9,
            fontWeight: 700,
            color: `rgb(${color.join(",")})`,
            letterSpacing: 1,
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          latest
        </Box>
      )}
      <AlgoBadge color={color} label={label} />
      <Divider sx={{ borderColor: `rgba(${color.join(",")},0.15)`, my: 0.9 }} />
      <MetricRow label="Exec. time" value={formatMetric(metrics.execTime, " ms")} />
      <MetricRow label="Nodes explored" value={formatMetric(metrics.nodesExplored)} />
      <MetricRow label="Path length" value={formatMetric(metrics.pathLength, " km")} />
      <MetricRow label="Memory (nodes)" value={formatMetric(metrics.memoryUsage)} />
      <MetricRow label="Nodes / sec" value={formatMetric(getNodesPerSecond(metrics))} />
    </Box>
  );
}

const MetricsSidebar = ({
  visible,
  savedComparisons = [],
  onClearComparisons,
}) => {
  const [open, setOpen] = useState(false);
  const hasSaved = savedComparisons.length > 0;

  // Auto-open the sidebar when the first result arrives
  useEffect(() => {
    if (hasSaved) setOpen(true);
  }, [hasSaved]);

  if (!visible) return null;

  return (
    <>
      {/* Collapsed tab to re-open */}
      {!open && (
        <Tooltip title="Open results panel" placement="left">
          <IconButton
            onClick={() => setOpen(true)}
            size="large"
            sx={{
              position: "fixed",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1301,
              width: 44,
              height: 44,
              color: "#ffffff",
              backgroundColor: "#1f2230",
              border: "1px solid rgba(255,255,255,0.18)",
              "&:hover": { backgroundColor: "#2a2e41" },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Tooltip>
      )}

      <Drawer
        anchor="right"
        open={open}
        variant="persistent"
        sx={{
          zIndex: 1300,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            maxWidth: "92vw",
            background:
              "linear-gradient(180deg, rgba(18,22,38,0.98) 0%, rgba(11,13,22,0.98) 100%)",
            color: "#f4f7fb",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Assessment sx={{ color: "#46B780", fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
              Algorithm Results
            </Typography>
            {hasSaved && (
              <Box
                sx={{
                  backgroundColor: "#46B780",
                  color: "#0a0e18",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  px: 0.9,
                  py: 0.1,
                  lineHeight: "16px",
                }}
              >
                {savedComparisons.length}
              </Box>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {hasSaved && (
              <Tooltip title="Clear all results">
                <IconButton
                  onClick={onClearComparisons}
                  size="small"
                  sx={{ color: "#8a9bb5", "&:hover": { color: "#f87171" } }}
                  aria-label="Clear all algorithm results"
                >
                  <DeleteSweep fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              onClick={() => setOpen(false)}
              size="small"
              sx={{ color: "#8a9bb5" }}
              aria-label="Close results sidebar"
            >
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* Scrollable results area */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {!hasSaved ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 12, color: "#a5bbcc" }}>
                Run an algorithm to see its results here.
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#5a6880" }}>
                Each run is automatically saved with a unique color. Change your start or end point to reset.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {/* Show most-recent first */}
              {[...savedComparisons].reverse().map((comparison, idx) => (
                <ComparisonCard
                  key={comparison.id}
                  comparison={comparison}
                  isLatest={idx === 0}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Legend footer */}
        {hasSaved && (
          <>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
            <Box sx={{ px: 2, py: 1.2, flexShrink: 0 }}>
              <Typography sx={{ fontSize: 10, color: "#5a6880", lineHeight: 1.5 }}>
                Colors are fixed per algorithm. Select a new start point to clear all results.
              </Typography>
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
};

export default MetricsSidebar;
