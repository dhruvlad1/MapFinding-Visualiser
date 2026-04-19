import PathfindingAlgorithm from "./PathfindingAlgorithm";

class HillClimbing extends PathfindingAlgorithm {
  constructor() {
    super();
    this.currentNode = null;
  }

  start(startNode, endNode) {
    super.start(startNode, endNode);
    this.currentNode = this.startNode;
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

    node.visited = true;
    const refEdge = node.edges.find(
      (e) => e.getOtherNode(node) === node.referer,
    );
    if (refEdge) refEdge.visited = true;

    // Found end node
    if (node.id === this.endNode.id) {
      this.currentNode = null;
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

    if (bestNeighbor && bestNeighbor.distanceToEnd < node.distanceToEnd) {
      bestNeighbor.parent = node;
      bestNeighbor.referer = node;
      this.currentNode = bestNeighbor;
    } else {
      // No improving move means local optimum (or dead end) was reached.
      this.currentNode = null;
      this.finished = true;
    }

    return updatedNodes;
  }
}

export default HillClimbing;
