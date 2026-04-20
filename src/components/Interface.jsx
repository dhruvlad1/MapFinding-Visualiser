import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Button,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Fade,
  Tooltip,
  Drawer,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Menu,
} from "@mui/material";
import { PlayArrow, Settings, Pause, AllInclusive } from "@mui/icons-material";
import Slider from "./Slider";
import { LOCATIONS } from "../config";


const Interface = forwardRef(
  (
    {
      canStart,
      started,
      animationEnded,
      playbackOn,
      time,
      maxTime,
      settings,
      loading,
      timeChanged,
      placeEnd,
      changeRadius,
      changeAlgorithm,
      setPlaceEnd,
      setSettings,
      startPathfinding,
      toggleAnimation,
      clearPath,
      changeLocation,
      startRunAll,
      isRunningAll,
    },
    ref,
  ) => {
    const [sidebar, setSidebar] = useState(false);
    const [snack, setSnack] = useState({
      open: false,
      message: "",
      type: "error",
    });
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const rightDown = useRef(false);
    const leftDown = useRef(false);

    // Expose showSnack to parent from ref
    useImperativeHandle(ref, () => ({
      showSnack(message, type = "error") {
        setSnack({ open: true, message, type });
      },
    }));

    function closeSnack() {
      setSnack({ ...snack, open: false });
    }

    // Start pathfinding or toggle playback
    function handlePlay() {
      if (!canStart) return;
      if (!started && time === 0) {
        startPathfinding();
        return;
      }
      toggleAnimation();
    }

    function closeMenu() {
      setMenuAnchor(null);
    }

    window.onkeydown = (e) => {
      if (
        e.code === "ArrowRight" &&
        !rightDown.current &&
        !leftDown.current &&
        (!started || animationEnded)
      ) {
        rightDown.current = true;
        toggleAnimation(false, 1);
      } else if (
        e.code === "ArrowLeft" &&
        !leftDown.current &&
        !rightDown.current &&
        animationEnded
      ) {
        leftDown.current = true;
        toggleAnimation(false, -1);
      }
    };

    window.onkeyup = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handlePlay();
      } else if (e.code === "ArrowRight" && rightDown.current) {
        rightDown.current = false;
        toggleAnimation(false, 1);
      } else if (e.code === "ArrowLeft" && animationEnded && leftDown.current) {
        leftDown.current = false;
        toggleAnimation(false, 1);
      } else if (e.code === "KeyR" && (animationEnded || !started)) clearPath();
    };

    return (
      <>
        <div className="nav-top">
          <div className="side slider-container">
            <Typography id="playback-slider" gutterBottom>
              Animation playback
            </Typography>
            <Slider
              disabled={!animationEnded}
              value={animationEnded ? time : maxTime}
              min={animationEnded ? 0 : -1}
              max={maxTime}
              onChange={(e) => {
                timeChanged(Number(e.target.value));
              }}
              className="slider"
              aria-labelledby="playback-slider"
            />
          </div>
          <IconButton
            disabled={!canStart}
            onClick={handlePlay}
            style={{ backgroundColor: "#46B780", width: 60, height: 60 }}
            size="large"
          >
            {!started || (animationEnded && !playbackOn) ? (
              <PlayArrow
                style={{ color: "#fff", width: 26, height: 26 }}
                fontSize="inherit"
              />
            ) : (
              <Pause
                style={{ color: "#fff", width: 26, height: 26 }}
                fontSize="inherit"
              />
            )}
          </IconButton>
          {/* Run All Algorithms button */}
          <Tooltip title={isRunningAll ? "Running all algorithms…" : "Run all algorithms & compare"}>
            <span>
              <IconButton
                disabled={!canStart || (started && !animationEnded) || isRunningAll}
                onClick={startRunAll}
                size="large"
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#2A2B37",
                  border: isRunningAll
                    ? "1.5px solid rgba(70,183,128,0.7)"
                    : "1px solid rgba(255,255,255,0.1)",
                  transition: "border-color 0.3s",
                  "&:hover": { backgroundColor: "#353648" },
                  "&.Mui-disabled": { opacity: 0.4 },
                }}
              >
                <AllInclusive
                  sx={{
                    color: isRunningAll ? "#46B780" : "#fff",
                    width: 22,
                    height: 22,
                    animation: isRunningAll ? "spin 1.4s linear infinite" : "none",
                    "@keyframes spin": {
                      from: { transform: "rotate(0deg)" },
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
          <div className="side">
            <Button
              disabled={!animationEnded && started}
              onClick={clearPath}
              style={{
                color: "#fff",
                backgroundColor: "#404156",
                paddingInline: 30,
                paddingBlock: 7,
              }}
              variant="contained"
            >
              Clear path
            </Button>
          </div>
        </div>

        <div className="point-controls">
          <Button
            onClick={() => {
              setPlaceEnd(false);
            }}
            style={{
              color: "#fff",
              backgroundColor: !placeEnd ? "#46B780" : "#404156",
              paddingInline: 20,
              paddingBlock: 6,
              textTransform: "none",
            }}
            variant="contained"
            disabled={!animationEnded && started}
          >
            Select start point
          </Button>
          <Button
            onClick={() => {
              setPlaceEnd(true);
            }}
            style={{
              color: "#fff",
              backgroundColor: placeEnd ? "#46B780" : "#404156",
              paddingInline: 20,
              paddingBlock: 6,
              textTransform: "none",
            }}
            variant="contained"
            disabled={!animationEnded && started}
          >
            Select end point
          </Button>
        </div>

        <div className="nav-right">
          <Tooltip title="Open settings">
            <IconButton
              onClick={() => {
                setSidebar(true);
              }}
              style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }}
              size="large"
            >
              <Settings
                style={{ color: "#fff", width: 24, height: 24 }}
                fontSize="inherit"
              />
            </IconButton>
          </Tooltip>
        </div>

        <div className="loader-container">
          <Fade
            in={loading}
            style={{
              transitionDelay: loading ? "50ms" : "0ms",
            }}
            unmountOnExit
          >
            <CircularProgress color="inherit" />
          </Fade>
        </div>

        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={snack.open}
          autoHideDuration={4000}
          onClose={closeSnack}
        >
          <Alert
            onClose={closeSnack}
            severity={snack.type}
            style={{ width: "100%", color: "#fff" }}
          >
            {snack.message}
          </Alert>
        </Snackbar>

        <div className="mobile-controls">
          <Button
            onClick={() => {
              setPlaceEnd(false);
            }}
            style={{
              color: "#fff",
              backgroundColor: !placeEnd ? "#46B780" : "#404156",
              paddingInline: 20,
              paddingBlock: 7,
            }}
            variant="contained"
          >
            Select start
          </Button>
          <Button
            onClick={() => {
              setPlaceEnd(true);
            }}
            style={{
              color: "#fff",
              backgroundColor: placeEnd ? "#46B780" : "#404156",
              paddingInline: 20,
              paddingBlock: 7,
            }}
            variant="contained"
          >
            Select end
          </Button>
        </div>

        <Drawer
          className="side-drawer"
          anchor="left"
          open={sidebar}
          onClose={() => {
            setSidebar(false);
          }}
        >
          <div className="sidebar-container">
            <FormControl variant="filled">
              <InputLabel style={{ fontSize: 14 }} id="algo-select">
                Algorithm
              </InputLabel>
              <Select
                labelId="algo-select"
                value={settings.algorithm}
                onChange={(e) => {
                  changeAlgorithm(e.target.value);
                }}
                required
                style={{
                  backgroundColor: "#404156",
                  color: "#fff",
                  width: "100%",
                  paddingLeft: 1,
                }}
                inputProps={{
                  MenuProps: {
                    MenuListProps: { sx: { backgroundColor: "#404156" } },
                  },
                }}
                size="small"
                disabled={!animationEnded && started}
              >
                <MenuItem value={"astar"}>A* algorithm</MenuItem>
                <MenuItem value={"greedy"}>Greedy algorithm</MenuItem>
                <MenuItem value={"dijkstra"}>
                  Dijkstra&apos;s algorithm
                </MenuItem>
                <MenuItem value={"bidirectional"}>
                  Bidirectional Search algorithm
                </MenuItem>
                <MenuItem value={"branchbound"}>
                  Branch and Bound algorithm
                </MenuItem>
                <MenuItem value={"beamsearch"}>Beam Search algorithm</MenuItem>
                <MenuItem value={"hillclimbing"}>
                  Hill Climbing algorithm
                </MenuItem>
              </Select>
            </FormControl>

            <div>
              <Button
                id="locations-button"
                aria-controls={menuOpen ? "locations-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? "true" : undefined}
                onClick={(e) => {
                  setMenuAnchor(e.currentTarget);
                }}
                variant="contained"
                disableElevation
                style={{
                  backgroundColor: "#404156",
                  color: "#fff",
                  textTransform: "none",
                  fontSize: 16,
                  paddingBlock: 8,
                  justifyContent: "start",
                }}
              >
                Locations
              </Button>
              <Menu
                id="locations-menu"
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={() => {
                  setMenuAnchor(null);
                }}
                MenuListProps={{
                  "aria-labelledby": "locations-button",
                  sx: {
                    backgroundColor: "#404156",
                  },
                }}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                {LOCATIONS.map((location) => (
                  <MenuItem
                    key={location.name}
                    onClick={() => {
                      closeMenu();
                      changeLocation(location);
                    }}
                  >
                    {location.name}
                  </MenuItem>
                ))}
              </Menu>
            </div>

            <div className="side slider-container">
              <Typography id="area-slider">
                Area radius: {settings.radius}km (
                {(settings.radius / 1.609).toFixed(1)}mi)
              </Typography>
              <Slider
                disabled={started && !animationEnded}
                min={2}
                max={20}
                step={1}
                value={settings.radius}
                onChangeCommited={() => {
                  changeRadius(settings.radius);
                }}
                onChange={(e) => {
                  setSettings({ ...settings, radius: Number(e.target.value) });
                }}
                className="slider"
                aria-labelledby="area-slider"
                style={{ marginBottom: 1 }}
                marks={[
                  {
                    value: 2,
                    label: "2km",
                  },
                  {
                    value: 20,
                    label: "20km",
                  },
                ]}
              />
            </div>

            <div className="side slider-container">
              <Typography id="speed-slider">Animation speed</Typography>
              <Slider
                min={1}
                max={30}
                value={settings.speed}
                onChange={(e) => {
                  setSettings({ ...settings, speed: Number(e.target.value) });
                }}
                className="slider"
                aria-labelledby="speed-slider"
                style={{ marginBottom: 1 }}
              />
            </div>

            {settings.algorithm === "beamsearch" && (
              <div className="side slider-container">
                <Typography id="beam-width-slider">
                  Beam width: {settings.beamWidth}
                </Typography>
                <Slider
                  disabled={started && !animationEnded}
                  min={2}
                  max={25}
                  step={1}
                  value={settings.beamWidth}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      beamWidth: Number(e.target.value),
                    });
                  }}
                  className="slider"
                  aria-labelledby="beam-width-slider"
                  style={{ marginBottom: 1 }}
                  marks={[
                    {
                      value: 2,
                      label: "2",
                    },
                    {
                      value: 25,
                      label: "25",
                    },
                  ]}
                />
              </div>
            )}



            <div className="shortcuts-container">
              <Typography
                style={{
                  color: "#A8AFB3",
                  textTransform: "uppercase",
                  fontSize: 14,
                }}
              >
                Shortcuts
              </Typography>

              <div className="shortcut">
                <p>SPACE</p>
                <p>Start/Stop animation</p>
              </div>
              <div className="shortcut">
                <p>R</p>
                <p>Clear path</p>
              </div>
              <div className="shortcut">
                <p>Arrows</p>
                <p>Animation playback</p>
              </div>
            </div>
          </div>
        </Drawer>
      </>
    );
  },
);

Interface.displayName = "Interface";

export default Interface;
