import buildingBlocks from '../assets/building-blocks_structure.json'

export type BuildingBlockNode = {
    name: string
    type: string
    path: string
    children?: BuildingBlockNode[]
}

export const parseBuildingBlocks = (data: BuildingBlockNode): BuildingBlockNode => {
    const parseNode = (node: BuildingBlockNode): BuildingBlockNode => {
        const { name, type, path, children } = node
        const parsedNode: BuildingBlockNode = { name, type, path }
        if (children && children.length > 0) {
            parsedNode.children = children.map(parseNode)
        }
        return parsedNode
    }

    return parseNode(data)
}

export const getBuildingBlocks = (): BuildingBlockNode => {
    return parseBuildingBlocks(buildingBlocks)
}