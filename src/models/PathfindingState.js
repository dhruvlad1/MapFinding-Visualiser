import AStar from "./algorithms/AStar";
import BidirectionalSearch from "./algorithms/BidirectionalSearch";
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
                memoryUsage: 0,
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

    start(algorithm) {
        this.reset();
        this._nodesExplored = 0;

        const algoNames = {
            astar: "A*",
            greedy: "Greedy",
            dijkstra: "Dijkstra",
            bidirectional: "Bidirectional",
        };
        this.metrics = { ...this.metrics, algorithmName: algoNames[algorithm] ?? "A*" };

        switch (algorithm) {
            case "astar":         this.algorithm = new AStar(); break;
            case "greedy":        this.algorithm = new Greedy(); break;
            case "dijkstra":      this.algorithm = new Dijkstra(); break;
            case "bidirectional": this.algorithm = new BidirectionalSearch(); break;
            default:              this.algorithm = new AStar(); break;
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

            let pathLength = 0;
            let node = this.endNode;
            while (node?.parent) {
                pathLength += Math.hypot(
                    node.longitude - node.parent.longitude,
                    node.latitude - node.parent.latitude
                ) * 111;
                node = node.parent;
            }

            this.metrics = {
                ...this.metrics,
                execTime: execTime.toFixed(1),
                nodesExplored: this._nodesExplored,
                pathLength: pathLength.toFixed(2),
                memoryUsage: this.algorithm.openList?.length ?? 0,
            };
        }

        return updatedNodes;
    }
}