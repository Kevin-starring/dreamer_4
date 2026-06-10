'use client'

import { useState, useCallback, useEffect, useRef, memo } from 'react'
import dynamic from 'next/dynamic'
import DreamInput from '@/components/DreamInput'
import ToolPanel from '@/components/ToolPanel'
import PlanEditorPanel from '@/components/PlanEditorPanel'
import SchedulePanel from '@/components/SchedulePanel'
import AccountPanel from '@/components/AccountPanel'
import type { DecomposeResponse, Tool, TreeNode } from '@/lib/types'
import toolsData from '@/data/tools.json'

const DiagramPanel = dynamic(() => import('@/components/DiagramPanel'), { ssr: false })
const MemoDiagramPanel = memo(DiagramPanel)

const tools: Tool[] = toolsData as Tool[]

/** Returns the names of all leaf nodes that have a toolId */
function getLeafNames(node: TreeNode): string[] {
  if (!node.children || node.children.length === 0) {
    return node.toolId ? [node.name] : []
  }
  return node.children.flatMap(getLeafNames)
}

export default function Home() {
  const [dream, setDream] = useState('')
  const [treeData, setTreeData] = useState<TreeNode | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [selectedUseCase, setSelectedUseCase] = useState<string | undefined>(undefined)
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null)
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cacheNote, setCacheNote] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  // Stable ref so toggleComplete closure doesn't stale-capture dream
  const dreamRef = useRef(dream)
  useEffect(() => { dreamRef.current = dream }, [dream])

  const handleSubmit = async () => {
    if (!dream.trim() || loading) return
    setLoading(true)
    setError(null)
    setCacheNote(null)
    setSelectedTool(null)
    setSelectedUseCase(undefined)
    setSelectedNodeName(null)
    setShowEditor(false)
    setShowSchedule(false)

    try {
      const res = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream: dream.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong. Try again.')
        return
      }

      const data: DecomposeResponse = await res.json()
      setTreeData(data.root)
      if (data.note) setCacheNote(data.note)

      // Load saved progress for this dream from localStorage
      const key = `dreamer_${dream.trim().toLowerCase()}`
      try {
        const saved = localStorage.getItem(key)
        setCompletedNodes(saved ? new Set(JSON.parse(saved)) : new Set())
      } catch {
        setCompletedNodes(new Set())
      }

    } catch {
      setError('Connection error. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNodeClick = useCallback((toolId: string, useCase?: string, nodeName?: string) => {
    const found = tools.find(t => t.id === toolId)
    setSelectedTool(found ?? null)
    setSelectedUseCase(useCase)
    setSelectedNodeName(nodeName ?? null)
  }, [])

  const toggleComplete = useCallback((nodeName: string) => {
    setCompletedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeName)) next.delete(nodeName)
      else next.add(nodeName)
      try {
        const key = `dreamer_${dreamRef.current.trim().toLowerCase()}`
        localStorage.setItem(key, JSON.stringify([...next]))
      } catch { /* localStorage unavailable */ }
      return next
    })
  }, [])

  const handleTreeUpdate = useCallback((newTree: TreeNode) => {
    setTreeData(newTree)
    setSelectedTool(null)
    setSelectedUseCase(undefined)
    setSelectedNodeName(null)
    setShowSchedule(false)
  }, [])

  // Progress calculation
  const leafNames = treeData ? getLeafNames(treeData) : []
  const totalSteps = leafNames.length
  const completedSteps = leafNames.filter(n => completedNodes.has(n)).length
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const hasRoadmap = !!treeData

  return (
    <div className={`app ${hasRoadmap ? 'app--roadmap' : 'app--conversation'}`}>
      <header className="header">
        <div className="header-content">
          <h1>{hasRoadmap ? <>Dream <span>Realizer</span></> : <>What do you <span>dream</span> about?</>}</h1>
          <p>{hasRoadmap ? 'Your dream is becoming a practical plan.' : 'Say it naturally. We will turn it into steps you can start.'}</p>
        </div>
        <div className="header-actions">
          {hasRoadmap && <span className="roadmap-status">Roadmap ready</span>}
          <AccountPanel />
        </div>
      </header>

      <DreamInput
        value={dream}
        onChange={setDream}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {cacheNote && (
        <div className="cache-note">{cacheNote}</div>
      )}

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {treeData && totalSteps > 0 && (
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Progress</span>
            <span className="progress-steps">{completedSteps} / {totalSteps} steps done</span>
            <span className="progress-pct">{progressPct}%</span>
            <button
              className={`edit-plan-btn ${showEditor ? 'edit-plan-btn--active' : ''}`}
              onClick={() => {
                setShowEditor(v => !v)
                setShowSchedule(false)
              }}
            >
              {showEditor ? '▲ End Edit' : '✏️ Edit Plan'}
            </button>
            <button
              className={`edit-plan-btn ${showSchedule ? 'edit-plan-btn--active' : ''}`}
              onClick={() => {
                setShowSchedule(v => !v)
                setShowEditor(false)
              }}
            >
              {showSchedule ? '▲ Close Schedule' : 'Schedule'}
            </button>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {treeData && showEditor && (
        <PlanEditorPanel
          treeData={treeData}
          dream={dream}
          onTreeUpdate={handleTreeUpdate}
        />
      )}

      {treeData && showSchedule && (
        <SchedulePanel treeData={treeData} dream={dream} />
      )}

      <main className="main">
        <MemoDiagramPanel
          data={treeData}
          onNodeClick={handleNodeClick}
          completedNodes={completedNodes}
          loading={loading}
          theme="light"
        />
        <ToolPanel
          tool={selectedTool}
          useCase={selectedUseCase}
          nodeName={selectedNodeName}
          dream={dream}
          isCompleted={selectedNodeName ? completedNodes.has(selectedNodeName) : false}
          onToggleComplete={toggleComplete}
        />
      </main>
    </div>
  )
}
