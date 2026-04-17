import AStar from "./algorithms/AStar";
import BeamSearch from "./algorithms/BeamSearch";
import BidirectionalSearch from "./algorithms/BidirectionalSearch";
import BranchAndBound from "./algorithms/BranchAndBound";
import Dijkstra from "./algorithms/Dijkstra";
import Greedy from "./algorithms/Greedy";
import PathfindingAlgorithm from "./algorithms/PathfindingAlgorithm";

export default class PathfindingState {
  static _instance;

  constructor() {
    if (!PathfindingState._instance) {
      this.endNode = null;
      this.graph = null;
      this.finished = false;
      this.algorithm = new PathfindingAlgorithm();
      this._startTime = 0;
      this._nodesExplored = 0;
      this.metrics = {
        algorithmName: "",
        execTime: 0,
        nodesExplored: 0,
        pathLength: 0,
        nodesPerSecond: 0,
      };
      PathfindingState._instance = this;
    }

    return PathfindingState._instance;
  }

  get startNode() {
    return this.graph.startNode;
  }

  getNode(id) {
    return this.graph?.getNode(id);
  }

  reset() {
    this.finished = false;
    if (!this.graph) return;
    for (const key of this.graph.nodes.keys()) {
      this.graph.nodes.get(key).reset();
    }
  }

  start(algorithm, options = {}) {
    this.reset();
    this._nodesExplored = 0;

    const algoNames = {
      astar: "A*",
      greedy: "Greedy",
      dijkstra: "Dijkstra",
      bidirectional: "Bidirectional",
      branchbound: "Branch and Bound",
      beamsearch: "Beam Search",
    };
    this.metrics = {
      ...this.metrics,
      algorithmName: algoNames[algorithm] ?? "A*",
      nodesPerSecond: 0,
    };

    switch (algorithm) {
      case "astar":
        this.algorithm = new AStar();
        break;
      case "greedy":
        this.algorithm = new Greedy();
        break;
      case "dijkstra":
        this.algorithm = new Dijkstra();
        break;
      case "bidirectional":
        this.algorithm = new BidirectionalSearch();
        break;
      case "branchbound":
        this.algorithm = new BranchAndBound();
        break;
      case "beamsearch":
        this.algorithm = new BeamSearch(options.beamWidth ?? 5);
        break;
      default:
        this.algorithm = new AStar();
        break;
    }

    this.algorithm.start(this.startNode, this.endNode);
    this._startTime = performance.now();
  }

  nextStep() {
    const updatedNodes = this.algorithm.nextStep();
    this._nodesExplored += updatedNodes.length;

    if (this.algorithm.finished || updatedNodes.length === 0) {
      this.finished = true;
      const execTime = performance.now() - this._startTime;
      const nodesPerSecond =
        execTime > 0 ? (this._nodesExplored / (execTime / 1000)).toFixed(1) : 0;

      let pathLength = 0;

      if (
        this.metrics.algorithmName === "Bidirectional" &&
        this.algorithm.meetingNode
      ) {
        const meetingNode = this.algorithm.meetingNode;

        let node = meetingNode;
        while (node?.parent) {
          pathLength +=
            Math.hypot(
              node.longitude - node.parent.longitude,
              node.latitude - node.parent.latitude,
            ) * 111;
          node = node.parent;
        }

        let branchNode = meetingNode;
        let nextNode = meetingNode.prevParent;
        while (nextNode) {
          pathLength +=
            Math.hypot(
              branchNode.longitude - nextNode.longitude,
              branchNode.latitude - nextNode.latitude,
            ) * 111;
          branchNode = nextNode;
          nextNode = branchNode.parent;
        }
      } else {
        let node = this.endNode;
        while (node?.parent) {
          pathLength +=
            Math.hypot(
              node.longitude - node.parent.longitude,
              node.latitude - node.parent.latitude,
            ) * 111;
          node = node.parent;
        }
      }

      this.metrics = {
        ...this.metrics,
        execTime: execTime.toFixed(1),
        nodesExplored: this._nodesExplored,
        pathLength: pathLength.toFixed(2),
        nodesPerSecond,
      };
    }

    return updatedNodes;
  }
}
