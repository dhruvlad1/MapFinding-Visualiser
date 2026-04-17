import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Assessment, ChevronRight, Close } from "@mui/icons-material";
import { COMPARISON_COLORS } from "../config";

const SIDEBAR_WIDTH = 390;

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

function rgbArrayToHex(color) {
  if (!Array.isArray(color) || color.length < 3) return "#46b780";
  return `#${toHex(color[0])}${toHex(color[1])}${toHex(color[2])}`;
}

function hexToRgbArray(hex) {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return [70, 183, 128];
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function formatMetric(value, suffix = "") {
  if (value == null || value === "") return "-";
  return `${value}${suffix}`;
}

function sortComparisons(savedComparisons) {
  return [...savedComparisons].sort((a, b) => {
    const aName = a?.metrics?.algorithmName ?? a?.label ?? "";
    const bName = b?.metrics?.algorithmName ?? b?.label ?? "";
    return aName.localeCompare(bName);
  });
}

const MetricsSidebar = ({
  metrics,
  visible,
  savedComparisons = [],
  onSaveComparison,
  onClearComparisons,
  selectedColor = [70, 183, 128],
  onSelectedColorChange,
}) => {
  const [open, setOpen] = useState(false);
  const hasSaved = savedComparisons.length > 0;

  useEffect(() => {
    if (visible) setOpen(true);
  }, [visible]);

  const rows = useMemo(
    () => sortComparisons(savedComparisons),
    [savedComparisons],
  );

  if (!visible) return null;

  return (
    <>
      {!open ? (
        <Tooltip title="Open comparison sidebar" placement="left">
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
              "&:hover": {
                backgroundColor: "#2a2e41",
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Tooltip>
      ) : null}

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
              "linear-gradient(180deg, rgba(20,25,40,0.97) 0%, rgba(14,16,24,0.97) 100%)",
            color: "#f4f7fb",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
          },
        }}
      >
        <Stack sx={{ height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Assessment sx={{ color: "#46B780", fontSize: 20 }} />
              <Typography
                sx={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}
              >
                Algorithm Comparison
              </Typography>
            </Stack>
            <IconButton
              onClick={() => setOpen(false)}
              size="small"
              sx={{ color: "#c9d4e3" }}
              aria-label="Close comparison sidebar"
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

          <Box sx={{ p: 2, pt: 1.5 }}>
            {metrics ? (
              <Stack spacing={1.1} sx={{ mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#a5bbcc",
                    textTransform: "uppercase",
                  }}
                >
                  Current run
                </Typography>
                <Typography
                  sx={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}
                >
                  {metrics.algorithmName}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#b8c2d3" }}>
                  Time: {formatMetric(metrics.execTime, " ms")}
                  {" • "}Nodes: {formatMetric(metrics.nodesExplored)}
                  {" • "}Path: {formatMetric(metrics.pathLength, " km")}
                </Typography>
                <Stack spacing={0.8}>
                  <Typography sx={{ fontSize: 12, color: "#b8c2d3" }}>
                    Saved path color
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {COMPARISON_COLORS.map((color) => {
                      const isActive =
                        selectedColor[0] === color[0] &&
                        selectedColor[1] === color[1] &&
                        selectedColor[2] === color[2];

                      return (
                        <IconButton
                          key={`swatch-${color.join("-")}`}
                          onClick={() => onSelectedColorChange?.(color)}
                          size="small"
                          sx={{
                            width: 22,
                            height: 22,
                            border: isActive
                              ? "2px solid #ffffff"
                              : "1px solid rgba(255,255,255,0.35)",
                            backgroundColor: `rgb(${color.join(",")})`,
                            "&:hover": {
                              backgroundColor: `rgb(${color.join(",")})`,
                            },
                          }}
                        />
                      );
                    })}
                    <Box
                      component="input"
                      type="color"
                      aria-label="Select comparison path color"
                      value={rgbArrayToHex(selectedColor)}
                      onChange={(e) =>
                        onSelectedColorChange?.(hexToRgbArray(e.target.value))
                      }
                      sx={{
                        width: 28,
                        height: 28,
                        p: 0,
                        border: "1px solid rgba(255,255,255,0.35)",
                        borderRadius: 1,
                        backgroundColor: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={onSaveComparison}
                    disabled={!metrics}
                    sx={{
                      textTransform: "none",
                      backgroundColor: "#46B780",
                      "&:hover": { backgroundColor: "#39a16e" },
                    }}
                  >
                    Save current algorithm
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onClearComparisons}
                    disabled={!hasSaved}
                    sx={{
                      textTransform: "none",
                      borderColor: "rgba(255,255,255,0.2)",
                      color: "#f4f7fb",
                    }}
                  >
                    Clear saved
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={1} sx={{ mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#a5bbcc",
                    textTransform: "uppercase",
                  }}
                >
                  Current run
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#b8c2d3" }}>
                  Run an algorithm, then save it to compare metrics side by
                  side.
                </Typography>
              </Stack>
            )}
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

          <Box sx={{ p: 2, pt: 1.5, overflowY: "auto" }}>
            <Typography
              sx={{
                fontSize: 12,
                color: "#a5bbcc",
                textTransform: "uppercase",
                mb: 1.2,
              }}
            >
              Saved comparisons
            </Typography>

            {!hasSaved ? (
              <Typography sx={{ fontSize: 12, color: "#b8c2d3" }}>
                No saved algorithm runs yet.
              </Typography>
            ) : (
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "#ebf0f7",
                    px: 1,
                    py: 0.8,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Algorithm</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell align="right">Nodes</TableCell>
                    <TableCell align="right">Path</TableCell>
                    <TableCell align="right">Memory</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((comparison) => (
                    <TableRow key={comparison.id}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 9,
                              height: 9,
                              borderRadius: "50%",
                              backgroundColor: `rgb(${comparison.color.join(",")})`,
                              flexShrink: 0,
                            }}
                          />
                          <span>{comparison.label}</span>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        {formatMetric(comparison.metrics.execTime, " ms")}
                      </TableCell>
                      <TableCell align="right">
                        {formatMetric(comparison.metrics.nodesExplored)}
                      </TableCell>
                      <TableCell align="right">
                        {formatMetric(comparison.metrics.pathLength, " km")}
                      </TableCell>
                      <TableCell align="right">
                        {formatMetric(comparison.metrics.memoryUsage)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </Stack>
      </Drawer>
    </>
  );
};

export default MetricsSidebar;
