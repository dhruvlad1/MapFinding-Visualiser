import PathfindingAlgorithm from "./PathfindingAlgorithm";

class HillClimbing extends PathfindingAlgorithm {
  constructor() {
    super();
    this.currentNode = null;
    this.openList = []; // exposed for memory tracking
  }

  start(startNode, endNode) {
    super.start(startNode, endNode);
    this.currentNode = this.startNode;
    this.openList = [this.startNode];
    this.startNode.distanceToEnd = Math.hypot(
      this.startNode.longitude - this.endNode.longitude,
      this.startNode.latitude - this.endNode.latitude,
    );
  }

  nextStep() {
    if (!this.currentNode) {
      this.finished = true;
      return [];
    }

    const updatedNodes = [];
    const node = this.currentNode;

    // Ensure the current node always has its heuristic computed.
    if (!node.distanceToEnd) {
      node.distanceToEnd = Math.hypot(
        node.longitude - this.endNode.longitude,
        node.latitude - this.endNode.latitude,
      );
    }

    node.visited = true;
    const refEdge = node.edges.find(
      (e) => e.getOtherNode(node) === node.referer,
    );
    if (refEdge) refEdge.visited = true;

    // Found end node
    if (node.id === this.endNode.id) {
      this.currentNode = null;
      this.openList = [];
      this.finished = true;
      return [node];
    }

    updatedNodes.push(node);

    let bestNeighbor = null;

    for (const n of node.neighbors) {
      const neighbor = n.node;
      const edge = n.edge;

      // Fill edges that are not marked on the map
      if (neighbor.visited && !edge.visited) {
        edge.visited = true;
        neighbor.referer = node;
        updatedNodes.push(neighbor);
      }

      if (neighbor.visited) continue;

      neighbor.distanceToEnd = Math.hypot(
        neighbor.longitude - this.endNode.longitude,
        neighbor.latitude - this.endNode.latitude,
      );

      if (
        !bestNeighbor ||
        neighbor.distanceToEnd < bestNeighbor.distanceToEnd
      ) {
        bestNeighbor = neighbor;
      }
    }

    // Move to the best neighbour unconditionally.
    // Hill climbing stops only when truly stuck (no unvisited neighbours).
    if (bestNeighbor) {
      bestNeighbor.parent = node;
      bestNeighbor.referer = node;
      this.currentNode = bestNeighbor;
      this.openList = [bestNeighbor]; // one candidate in frontier at all times
    } else {
      // No unvisited neighbours — local optimum or dead end reached.
      this.currentNode = null;
      this.openList = [];
      this.finished = true;
    }

    return updatedNodes;
  }
}

export default HillClimbing;
