import PathfindingAlgorithm from "./PathfindingAlgorithm";

class BeamSearch extends PathfindingAlgorithm {
  constructor(beamWidth = 5) {
    super();
    this.beamWidth = beamWidth;
    this.openList = [];
  }

  start(startNode, endNode) {
    super.start(startNode, endNode);
    this.openList = [this.startNode];
    this.startNode.distanceToEnd = 0;
  }

  nextStep() {
    if (this.openList.length === 0) {
      this.finished = true;
      return [];
    }

    const updatedNodes = [];
    const frontier = [...this.openList];
    this.openList = [];

    const nextCandidates = [];

    for (const currentNode of frontier) {
      currentNode.visited = true;

      const refEdge = currentNode.edges.find(
        (e) => e.getOtherNode(currentNode) === currentNode.referer,
      );
      if (refEdge) refEdge.visited = true;

      if (currentNode.id === this.endNode.id) {
        this.finished = true;
        return [...updatedNodes, currentNode];
      }

      updatedNodes.push(currentNode);

      for (const n of currentNode.neighbors) {
        const neighbor = n.node;
        const edge = n.edge;

        if (neighbor.visited && !edge.visited) {
          edge.visited = true;
          neighbor.referer = currentNode;
          updatedNodes.push(neighbor);
        }

        if (neighbor.visited) continue;

        neighbor.distanceToEnd = Math.hypot(
          neighbor.longitude - this.endNode.longitude,
          neighbor.latitude - this.endNode.latitude,
        );
        neighbor.parent = currentNode;
        neighbor.referer = currentNode;
        nextCandidates.push(neighbor);
      }
    }

    const uniqueCandidates = [];
    const seen = new Set();
    for (const node of nextCandidates) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      uniqueCandidates.push(node);
    }

    uniqueCandidates.sort((a, b) => a.distanceToEnd - b.distanceToEnd);
    this.openList = uniqueCandidates.slice(0, this.beamWidth);

    if (this.openList.length === 0) {
      this.finished = true;
    }

    return updatedNodes;
  }
}

export default BeamSearch;
