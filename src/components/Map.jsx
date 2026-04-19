import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl";
import maplibregl from "maplibre-gl";
import { PathLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "deck.gl";
import { TripsLayer } from "@deck.gl/geo-layers";
import { createGeoJSONCircle } from "../helpers";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getBoundingBoxFromPolygon,
  getMapGraph,
  getNearestNode,
  getNearestNodeFromGraph,
} from "../services/MapService";
import PathfindingState from "../models/PathfindingState";
import Interface from "./Interface";
import {
  ALGO_COLORS,
  COMPARISON_COLORS,
  INITIAL_COLORS,
  INITIAL_VIEW_STATE,
  MAP_STYLE,
} from "../config";
import useSmoothStateChange from "../hooks/useSmoothStateChange";
import MetricsSidebar from "./MetricsSidebar";

const METERS_PER_DEGREE_LAT = 111320;
const COMPARISON_PATH_LANE_OFFSET_METERS = 5;

function getAlternatingLaneOffset(index) {
  if (index === 0) return 0;
  const laneNumber = Math.ceil(index / 2);
  return index % 2 === 1 ? -laneNumber : laneNumber;
}

function offsetSegmentPath(path, offsetMeters) {
  if (!Array.isArray(path) || path.length < 2 || offsetMeters === 0)
    return path;

  const [start, end] = path;
  if (!start || !end) return path;

  const avgLatRadians = ((start[1] + end[1]) / 2) * (Math.PI / 180);
  const metersPerDegreeLon = Math.max(
    100,
    METERS_PER_DEGREE_LAT * Math.cos(avgLatRadians),
  );

  const dxMeters = (end[0] - start[0]) * metersPerDegreeLon;
  const dyMeters = (end[1] - start[1]) * METERS_PER_DEGREE_LAT;
  const segmentLength = Math.hypot(dxMeters, dyMeters);

  if (segmentLength === 0) return path;

  // Shift each segment along its perpendicular vector to create side-by-side lanes.
  const normalX = -dyMeters / segmentLength;
  const normalY = dxMeters / segmentLength;

  const deltaLon = (normalX * offsetMeters) / metersPerDegreeLon;
  const deltaLat = (normalY * offsetMeters) / METERS_PER_DEGREE_LAT;

  return [
    [start[0] + deltaLon, start[1] + deltaLat],
    [end[0] + deltaLon, end[1] + deltaLat],
  ];
}

function Map() {
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [selectionRadius, setSelectionRadius] = useState([]);
  const [tripsData, setTripsData] = useState([]);
  const [started, setStarted] = useState();
  const [time, setTime] = useState(0);
  const [animationEnded, setAnimationEnded] = useState(false);
  const [playbackOn, setPlaybackOn] = useState(false);
  const [playbackDirection, setPlaybackDirection] = useState(1);
  const [fadeRadiusReverse, setFadeRadiusReverse] = useState(false);
  const [placeEnd, setPlaceEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    algorithm: "astar",
    radius: 4,
    speed: 5,
    beamWidth: 5,
  });
  const [colors, setColors] = useState(INITIAL_COLORS);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [metrics, setMetrics] = useState(null);
  const [savedComparisons, setSavedComparisons] = useState([]);
  const ui = useRef();
  const fadeRadius = useRef();
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const timer = useRef(0);
  const waypoints = useRef([]);
  const state = useRef(new PathfindingState());
  const traceNode = useRef(null);
  const traceNode2 = useRef(null);
  const selectionRadiusOpacity = useSmoothStateChange(
    0,
    0,
    1,
    400,
    fadeRadius.current,
    fadeRadiusReverse,
  );

  const savedComparisonSegments = useMemo(
    () =>
      savedComparisons.flatMap((comparison, index) => {
        const laneBaseIndex = comparison.laneIndex ?? index;
        const laneOffset =
          getAlternatingLaneOffset(laneBaseIndex) *
          COMPARISON_PATH_LANE_OFFSET_METERS;

        return comparison.segments.map((segment) => ({
          ...segment,
          path: offsetSegmentPath(segment.path, laneOffset),
        }));
      }),
    [savedComparisons],
  );

  async function mapClick(e, _info, radius = null) {
    if (started && !animationEnded) return;

    setFadeRadiusReverse(false);
    fadeRadius.current = true;
    clearPath();

    let loadingHandle;

    try {
      // Check loading state early
      if (loading && placeEnd) {
        ui.current.showSnack("Please wait for all data to load.", "info");
        return;
      }

      loadingHandle = setTimeout(() => {
        setLoading(true);
      }, 300);

      // Place end node
      if (placeEnd) {
        if (e.layer?.id !== "selection-radius") {
          ui.current.showSnack(
            "Please select a point inside the radius.",
            "info",
          );
          return;
        }

        const node = state.current.graph
          ? getNearestNodeFromGraph(
              state.current.graph,
              e.coordinate[1],
              e.coordinate[0],
            )
          : await getNearestNode(e.coordinate[1], e.coordinate[0]);
        if (!node) {
          ui.current.showSnack(
            "No path was found in the vicinity, please try another location.",
          );
          return;
        }

        const realEndNode = state.current.getNode(node.id);
        setEndNode(node);

        if (!realEndNode) {
          ui.current.showSnack("An error occurred. Please try again.");
          return;
        }
        state.current.endNode = realEndNode;

        return;
      }

      // New start point selected — clear previous comparison results.
      setSavedComparisons([]);
      setMetrics(null);

      // Fetch nearest node for start node
      const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
      if (!node) {
        ui.current.showSnack(
          "No path was found in the vicinity, please try another location.",
        );
        return;
      }

      setStartNode(node);
      setEndNode(null);
      const circle = createGeoJSONCircle(
        [node.lon, node.lat],
        radius ?? settings.radius,
      );
      setSelectionRadius([{ contour: circle }]);
      setPlaceEnd(true);

      // Fetch nodes inside the radius
      const graph = await getMapGraph(
        getBoundingBoxFromPolygon(circle),
        node.id,
      );
      state.current.graph = graph;
      clearPath();
    } catch (error) {
      console.error("Map click error:", error);
      ui.current.showSnack(
        "Network error: Could not fetch map data (Overpass API rate limit). Please try again later.",
      );
    } finally {
      if (loadingHandle) clearTimeout(loadingHandle);
      setLoading(false);
    }
  }

  // Start new pathfinding animation
  function startPathfinding() {
    setFadeRadiusReverse(true);
    setMetrics(null);
    setTimeout(() => {
      clearPath();
      state.current.start(settings.algorithm, {
        beamWidth: settings.beamWidth,
      });
      setStarted(true);
    }, 400);
  }

  // Start or pause already running animation
  function toggleAnimation(loop = true, direction = 1) {
    if (time === 0 && !animationEnded) return;
    setPlaybackDirection(direction);
    if (animationEnded) {
      if (loop && time >= timer.current) {
        setTime(0);
      }
      setStarted(true);
      setPlaybackOn(!playbackOn);
      return;
    }
    setStarted(!started);
    if (started) {
      previousTimeRef.current = null;
    }
  }

  function clearPath() {
    setStarted(false);
    setPlaybackOn(false);
    setTripsData([]);
    setTime(0);
    state.current.reset();
    waypoints.current = [];
    timer.current = 0;
    previousTimeRef.current = null;
    traceNode.current = null;
    traceNode2.current = null;
    setAnimationEnded(false);
  }

  // Auto-save a comparison entry when the animation finishes.
  // Uses the fixed per-algorithm color from ALGO_COLORS.
  function saveComparison(completedMetrics, currentWaypoints) {
    const routeSegments = currentWaypoints
      .filter((segment) => segment.color === "route")
      .map((segment) => ({
        path: segment.path.map(([longitude, latitude]) => [
          longitude,
          latitude,
        ]),
      }));

    if (routeSegments.length === 0) return;

    const color =
      ALGO_COLORS[settings.algorithm] ?? COMPARISON_COLORS[0];

    setSavedComparisons((current) => {
      const existingIndex = current.findIndex(
        (item) => item.metrics.algorithmName === completedMetrics.algorithmName,
      );

      const laneIndex =
        existingIndex === -1
          ? current.length
          : (current[existingIndex].laneIndex ?? existingIndex);

      const snapshot = {
        id: `${Date.now()}-${completedMetrics.algorithmName}`,
        color,
        label: completedMetrics.algorithmName,
        laneIndex,
        metrics: { ...completedMetrics },
        segments: routeSegments.map((segment) => ({ ...segment, color })),
      };

      if (existingIndex === -1) {
        return [...current, snapshot];
      }

      const next = [...current];
      next[existingIndex] = snapshot;
      return next;
    });
  }

  function clearSavedComparisons() {
    setSavedComparisons([]);
  }

  // Progress animation by one step
  function animateStep(newTime) {
    const updatedNodes = state.current.nextStep();
    for (const updatedNode of updatedNodes) {
      updateWaypoints(updatedNode, updatedNode.referer);
    }

    // Found end but waiting for animation to end
    if (state.current.finished && !animationEnded) {
      // Render route differently for bidirectional
      if (settings.algorithm === "bidirectional") {
        if (!traceNode.current) traceNode.current = updatedNodes[0];
        const parentNode = traceNode.current.parent;
        updateWaypoints(
          parentNode,
          traceNode.current,
          "route",
          Math.max(Math.log2(settings.speed), 1),
        );
        traceNode.current = parentNode ?? traceNode.current;

        if (!traceNode2.current) {
          traceNode2.current = updatedNodes[0];
          traceNode2.current.parent = traceNode2.current.prevParent;
        }
        const parentNode2 = traceNode2.current.parent;
        updateWaypoints(
          parentNode2,
          traceNode2.current,
          "route",
          Math.max(Math.log2(settings.speed), 1),
        );
        traceNode2.current = parentNode2 ?? traceNode2.current;
        setAnimationEnded(
          time >= timer.current && parentNode == null && parentNode2 == null,
        );
      } else {
        if (!traceNode.current) traceNode.current = state.current.endNode;
        const parentNode = traceNode.current.parent;
        updateWaypoints(
          parentNode,
          traceNode.current,
          "route",
          Math.max(Math.log2(settings.speed), 1),
        );
        traceNode.current = parentNode ?? traceNode.current;
        setAnimationEnded(time >= timer.current && parentNode == null);
      }
    }

    // Animation progress
    if (previousTimeRef.current != null && !animationEnded) {
      const deltaTime = newTime - previousTimeRef.current;
      setTime((prevTime) => prevTime + deltaTime * playbackDirection);
    }

    // Playback progress
    if (previousTimeRef.current != null && animationEnded && playbackOn) {
      const deltaTime = newTime - previousTimeRef.current;
      if (time >= timer.current && playbackDirection !== -1) {
        setPlaybackOn(false);
      }
      setTime((prevTime) =>
        Math.max(
          Math.min(prevTime + deltaTime * 2 * playbackDirection, timer.current),
          0,
        ),
      );
    }
  }

  // Animation callback
  function animate(newTime) {
    for (let i = 0; i < settings.speed; i++) {
      animateStep(newTime);
    }

    previousTimeRef.current = newTime;
    requestRef.current = requestAnimationFrame(animate);
  }

  // Add new node to the waypoitns property and increment timer
  function updateWaypoints(
    node,
    refererNode,
    color = "path",
    timeMultiplier = 1,
  ) {
    if (!node || !refererNode) return;
    const distance = Math.hypot(
      node.longitude - refererNode.longitude,
      node.latitude - refererNode.latitude,
    );
    const timeAdd = distance * 50000 * timeMultiplier;

    waypoints.current = [
      ...waypoints.current,
      {
        path: [
          [refererNode.longitude, refererNode.latitude],
          [node.longitude, node.latitude],
        ],
        timestamps: [timer.current, timer.current + timeAdd],
        color, // timestamp: timer.current + timeAdd
      },
    ];

    timer.current += timeAdd;
    setTripsData(() => waypoints.current);
  }

  function changeLocation(location) {
    setViewState({
      ...viewState,
      longitude: location.longitude,
      latitude: location.latitude,
      zoom: 13,
      transitionDuration: 1,
      transitionInterpolator: new FlyToInterpolator(),
    });
  }

  function changeSettings(newSettings) {
    setSettings(newSettings);
    const items = { settings: newSettings, colors };
    localStorage.setItem("path_settings", JSON.stringify(items));
  }

  function changeColors(newColors) {
    setColors(newColors);
    const items = { settings, colors: newColors };
    localStorage.setItem("path_settings", JSON.stringify(items));
  }

  function changeAlgorithm(algorithm) {
    clearPath();
    changeSettings({ ...settings, algorithm });
  }

  function changeRadius(radius) {
    changeSettings({ ...settings, radius });
    if (startNode) {
      mapClick({ coordinate: [startNode.lon, startNode.lat] }, {}, radius);
    }
  }

  useEffect(() => {
    if (!started) return;
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [started, time, animationEnded, playbackOn]);

  useEffect(() => {
    // Stop the RAF loop once the route and playback are done.
    if (animationEnded && !playbackOn && started) {
      setStarted(false);
      previousTimeRef.current = null;
    }
  }, [animationEnded, playbackOn, started]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((res) => {
      changeLocation(res.coords);
    });

    const settings = localStorage.getItem("path_settings");
    if (!settings) return;
    const items = JSON.parse(settings);

    setSettings((current) => ({ ...current, ...items.settings }));
    setColors(items.colors);
  }, []);

  useEffect(() => {
    if (animationEnded) {
      const completedMetrics = { ...state.current.metrics };
      setMetrics(completedMetrics);
      // Auto-save this run to the comparison sidebar immediately.
      saveComparison(completedMetrics, waypoints.current);
    }
  }, [animationEnded]);

  return (
    <>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <DeckGL
          viewState={viewState}
          controller={{ doubleClickZoom: false, keyboard: false }}
          onClick={mapClick}
          onViewStateChange={({ viewState: nextViewState }) => {
            setViewState(nextViewState);
          }}
        >
          <PolygonLayer
            id={"selection-radius"}
            data={selectionRadius}
            pickable={true}
            stroked={true}
            getPolygon={(d) => d.contour}
            getFillColor={[80, 210, 0, 10]}
            getLineColor={[9, 142, 46, 175]}
            getLineWidth={3}
            opacity={selectionRadiusOpacity}
          />
          <TripsLayer
            id={"pathfinding-layer"}
            data={tripsData}
            opacity={1}
            widthMinPixels={3}
            widthMaxPixels={5}
            fadeTrail={false}
            currentTime={time}
            getColor={(d) => colors[d.color]}
            /** Create a nice glowy effect that absolutely kills the performance  */
            // getColor={(d) => {
            //     if(d.color !== "path") return colors[d.color];
            //     const color = colors[d.color];
            //     const delta = Math.abs(time - d.timestamp);
            //     return color.map(c => Math.max((c * 1.6) - delta * 0.1, c));
            // }}
            updateTriggers={{
              getColor: [colors.path, colors.route],
            }}
          />
          <PathLayer
            id="saved-comparison-routes"
            data={savedComparisonSegments}
            getPath={(d) => d.path}
            getColor={(d) => d.color}
            widthMinPixels={4}
            rounded={true}
            billboard={false}
            opacity={0.9}
            updateTriggers={{ getColor: [savedComparisons.length] }}
          />
          <ScatterplotLayer
            id="start-end-points"
            data={[
              ...(startNode
                ? [
                    {
                      coordinates: [startNode.lon, startNode.lat],
                      color: colors.startNodeFill,
                      lineColor: colors.startNodeBorder,
                    },
                  ]
                : []),
              ...(endNode
                ? [
                    {
                      coordinates: [endNode.lon, endNode.lat],
                      color: colors.endNodeFill,
                      lineColor: colors.endNodeBorder,
                    },
                  ]
                : []),
            ]}
            pickable={true}
            opacity={1}
            stroked={true}
            filled={true}
            radiusScale={1}
            radiusMinPixels={7}
            radiusMaxPixels={20}
            lineWidthMinPixels={1}
            lineWidthMaxPixels={3}
            getPosition={(d) => d.coordinates}
            getFillColor={(d) => d.color}
            getLineColor={(d) => d.lineColor}
          />
          <MapGL
            reuseMaps
            mapLib={maplibregl}
            mapStyle={MAP_STYLE}
            doubleClickZoom={false}
          />
        </DeckGL>
      </div>
      <Interface
        ref={ui}
        canStart={startNode && endNode}
        started={started}
        animationEnded={animationEnded}
        playbackOn={playbackOn}
        time={time}
        startPathfinding={startPathfinding}
        toggleAnimation={toggleAnimation}
        clearPath={clearPath}
        timeChanged={setTime}
        changeLocation={changeLocation}
        maxTime={timer.current}
        settings={settings}
        setSettings={changeSettings}
        changeAlgorithm={changeAlgorithm}
        colors={colors}
        setColors={changeColors}
        loading={loading}
        placeEnd={placeEnd}
        setPlaceEnd={setPlaceEnd}
        changeRadius={changeRadius}
      />
      <MetricsSidebar
        metrics={metrics}
        visible={animationEnded || savedComparisons.length > 0}
        savedComparisons={savedComparisons}
        onClearComparisons={clearSavedComparisons}
      />
    </>
  );
}

export default Map;
