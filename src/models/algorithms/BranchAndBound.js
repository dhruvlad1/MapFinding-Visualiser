import PathfindingAlgorithm from "./PathfindingAlgorithm";

class BranchAndBound extends PathfindingAlgorithm {
  constructor() {
    super();
    this.openList = [];
  }

  start(startNode, endNode) {
    super.start(startNode, endNode);
    this.openList = [startNode];
    this.startNode.distanceFromStart = 0;
  }

  nextStep() {
    if (this.openList.length === 0) {
      this.finished = true;
      return [];
    }

    const updatedNodes = [];
    const currentNode = this.openList.reduce(
      (acc, current) =>
        current.distanceFromStart < acc.distanceFromStart ? current : acc,
      this.openList[0],
    );
    this.openList.splice(this.openList.indexOf(currentNode), 1);
    currentNode.visited = true;

    const refEdge = currentNode.edges.find(
      (e) => e.getOtherNode(currentNode) === currentNode.referer,
    );
    if (refEdge) refEdge.visited = true;

    if (currentNode.id === this.endNode.id) {
      this.finished = true;
      this.openList = [];
      return [currentNode];
    }

    for (const n of currentNode.neighbors) {
      const neighbor = n.node;
      const edge = n.edge;

      if (neighbor.visited && !edge.visited) {
        edge.visited = true;
        neighbor.referer = currentNode;
        updatedNodes.push(neighbor);
      }

      if (neighbor.visited) continue;

      const newCost = currentNode.distanceFromStart + edge.weight;

      if (
        this.openList.includes(neighbor) &&
        newCost >= neighbor.distanceFromStart
      ) {
        continue;
      }

      if (!this.openList.includes(neighbor)) {
        this.openList.push(neighbor);
      }

      neighbor.distanceFromStart = newCost;
      neighbor.parent = currentNode;
      neighbor.referer = currentNode;
    }

    return [...updatedNodes, currentNode];
  }
}

export default BranchAndBound;
