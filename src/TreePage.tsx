import './App.css'
import buildingBlocks from '../building-blocks_structure.json'
import { useState } from 'react'
import { type BuildingBlockNode } from './BuildingBlockNode'
import {Link} from "react-router-dom";

function TreePage() {
    const root = buildingBlocks as BuildingBlockNode
    const topLevel = Array.isArray(root.children) ? root.children : []

    const collectCollapsiblePaths = (nodes: BuildingBlockNode[]): Set<string> => {
        const paths = new Set<string>()
        const walk = (items: BuildingBlockNode[]) => {
            for (const item of items) {
                if (Array.isArray(item.children) && item.children.length > 0 && item.path) {
                    paths.add(item.path)
                    walk(item.children)
                }
            }
        }

        walk(nodes)
        return paths
    }

    const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => collectCollapsiblePaths(topLevel))

    const toggleNode = (path: string) => {
        setCollapsedPaths((prev) => {
            const next = new Set(prev)
            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
            }
            return next
        })
    }

    const renderTree = (nodes: BuildingBlockNode[]) => {
        if (nodes.length === 0) {
            return null
        }

        return (
            <ul>
                {nodes.map((node) => {
                    const hasChildren = Array.isArray(node.children) && node.children.length > 0
                    const isCollapsed = hasChildren && node.path ? collapsedPaths.has(node.path) : false
                    const isExpanded = hasChildren && !isCollapsed

                    return (
                        <li key={node.path || node.name}>
                            {hasChildren && node.path ? (
                                <button type="button" onClick={() => toggleNode(node.path)} aria-expanded={isExpanded}>
                                    {isExpanded ? '[-]' : '[+]'}
                                </button>
                            ) : null}{' '}
                            <strong>{node.name}</strong> <span>({node.type})</span>
                            {node.path ? <div>{node.path}</div> : null}
                            {isExpanded && Array.isArray(node.children) ? renderTree(node.children) : null}
                        </li>
                    )
                })}
            </ul>
        )
    }

    return (
        <main>
            <h1>Building Blocks</h1>
            {topLevel.length === 0 ? <p>No entries found.</p> : renderTree(topLevel)}
            <Link to='/'>Go back</Link>
        </main>
    )
}
export default TreePage