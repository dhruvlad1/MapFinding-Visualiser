import { useEffect, useRef, useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { ALGO_COLORS } from "../config";

const ALGO_KEY_MAP = {
  "A*": "astar",
  Greedy: "greedy",
  Dijkstra: "dijkstra",
  Bidirectional: "bidirectional",
  "Branch and Bound": "branchbound",
  "Beam Search": "beamsearch",
  "Hill Climbing": "hillclimbing",
};

function HUDRow({ label, value, accent }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 3 }}>
      <Typography sx={{ fontSize: 10, color: "#6b7fa0", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "monospace",
          color: accent ?? "#e8f0fa",
          letterSpacing: 0.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/**
 * LiveHUD — shown while a pathfinding algorithm is actively running.
 * Props:
 *   visible      – boolean, whether to show the HUD
 *   pathfinding  – ref to PathfindingState singleton (reads live metrics)
 *   algorithmKey – current algorithm key string (e.g. "astar")
 *   isRunningAll – boolean, whether "Run All" mode is active
 *   runAllIndex  – current index in the run-all sequence (0-based)
 *   runAllTotal  – total number of algorithms in run-all sequence
 */
export default function LiveHUD({
  visible,
  pathfinding,
  algorithmKey,
  isRunningAll,
  runAllIndex,
  runAllTotal,
}) {
  const [nodesExplored, setNodesExplored] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setNodesExplored(0);
      setElapsedMs(0);
      startTimeRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    function tick() {
      const ps = pathfinding?.current;
      if (ps) {
        setNodesExplored(ps._nodesExplored ?? 0);
      }
      if (startTimeRef.current != null) {
        setElapsedMs(performance.now() - startTimeRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, pathfinding]);

  if (!visible) return null;

  const algoName = pathfinding?.current?.metrics?.algorithmName ?? algorithmKey ?? "—";
  const colorKey = ALGO_KEY_MAP[algoName] ?? algorithmKey;
  const accentRgb = ALGO_COLORS[colorKey] ?? [70, 183, 128];
  const accentCss = `rgb(${accentRgb.join(",")})`;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 28,
        left: 20,
        zIndex: 1200,
        minWidth: 200,
        borderRadius: 2.5,
        background: "linear-gradient(135deg, rgba(12,16,30,0.92) 0%, rgba(22,27,48,0.92) 100%)",
        border: `1px solid rgba(${accentRgb.join(",")},0.35)`,
        backdropFilter: "blur(10px)",
        boxShadow: `0 4px 24px rgba(0,0,0,0.45), 0 0 12px rgba(${accentRgb.join(",")},0.12)`,
        px: 2,
        py: 1.5,
        pointerEvents: "none",
        animation: "hudFadeIn 0.25s ease",
        "@keyframes hudFadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* Header: algorithm name + optional run-all badge */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.8}>
        <Stack direction="row" alignItems="center" spacing={0.8}>
          {/* Pulsing dot */}
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: accentCss,
              boxShadow: `0 0 6px 2px rgba(${accentRgb.join(",")},0.6)`,
              animation: "pulse 1.2s ease-in-out infinite",
              "@keyframes pulse": {
                "0%,100%": { opacity: 1 },
                "50%": { opacity: 0.35 },
              },
            }}
          />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: accentCss, letterSpacing: 0.3 }}>
            {algoName}
          </Typography>
        </Stack>

        {isRunningAll && (
          <Box
            sx={{
              fontSize: 9,
              fontWeight: 800,
              color: "#0a0e18",
              backgroundColor: accentCss,
              borderRadius: 999,
              px: 0.9,
              py: 0.1,
              lineHeight: "16px",
              letterSpacing: 0.5,
            }}
          >
            {runAllIndex + 1}/{runAllTotal}
          </Box>
        )}
      </Stack>

      <Box sx={{ borderTop: `1px solid rgba(${accentRgb.join(",")},0.15)`, pt: 0.8 }}>
        <Stack spacing={0.4}>
          <HUDRow label="Elapsed" value={`${(elapsedMs / 1000).toFixed(2)} s`} accent={accentCss} />
          <HUDRow label="Nodes Explored" value={nodesExplored.toLocaleString()} />
        </Stack>
      </Box>
    </Box>
  );
}
