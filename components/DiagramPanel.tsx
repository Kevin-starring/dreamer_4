'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { select } from 'd3-selection'
import { tree, hierarchy } from 'd3-hierarchy'
import { linkHorizontal } from 'd3-shape'
import { zoom, zoomIdentity } from 'd3-zoom'
import type { ZoomBehavior } from 'd3-zoom'
import 'd3-transition'
import type { TreeNode } from '@/lib/types'
import type { Theme } from '@/lib/useTheme'
import { useLanguage } from '@/components/LanguageProvider'

const PHYSICS_DREAMS = [
  'learn something new',
  'build my own thing',
  'see more of the world',
  'make life feel meaningful',
  'start a business',
  'travel the world',
  'become healthier',
  'write my own story',
]

interface BubblePhys {
  x: number; y: number; vx: number; vy: number
  w: number; h: number; r: number
}

function PhysicsBubbles() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const elemsRef = useRef<(HTMLSpanElement | null)[]>([])
  const phys = useRef<BubblePhys[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let alive = true
    let initialized = false

    const initialize = () => {
      const W = wrap.offsetWidth
      const H = wrap.offsetHeight
      if (!alive || W < 40 || H < 40) return false

      phys.current = elemsRef.current.map(el => {
        const rect = el?.getBoundingClientRect() ?? { width: 120, height: 40 }
        const w = Math.min(rect.width, Math.max(40, W - 12))
        const h = Math.min(rect.height, Math.max(24, H - 12))
        const compact = W < 640
        const r = Math.max(w, h) * (compact ? 0.42 : 0.5) + (compact ? 3 : 10)
        const speed = compact ? 0.85 : 0.5
        return {
          w, h, r,
          x: w / 2 + Math.random() * Math.max(0, W - w),
          y: h / 2 + Math.random() * Math.max(0, H - h),
          vx: (Math.random() < 0.5 ? 1 : -1) * (speed + Math.random() * 0.7),
          vy: (Math.random() < 0.5 ? 1 : -1) * (speed + Math.random() * 0.7),
        }
      })
      initialized = true
      return true
    }

    const tick = () => {
      if (!alive) return
      if (!initialized && !initialize()) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const W = wrap.offsetWidth, H = wrap.offsetHeight
      const bs = phys.current

      for (const b of bs) {
        b.x += b.vx; b.y += b.vy
        if (b.x - b.w / 2 < 0) { b.x = b.w / 2; b.vx = Math.abs(b.vx) }
        if (b.x + b.w / 2 > W) { b.x = W - b.w / 2; b.vx = -Math.abs(b.vx) }
        if (b.y - b.h / 2 < 0) { b.y = b.h / 2; b.vy = Math.abs(b.vy) }
        if (b.y + b.h / 2 > H) { b.y = H - b.h / 2; b.vy = -Math.abs(b.vy) }
      }

      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          const a = bs[i], b = bs[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minD = a.r + b.r
          if (dist < minD && dist > 0) {
            const nx = dx / dist, ny = dy / dist
            const overlap = (minD - dist) / 2
            a.x -= nx * overlap; a.y -= ny * overlap
            b.x += nx * overlap; b.y += ny * overlap
            const relV = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny
            if (relV > 0) {
              a.vx -= relV * nx; a.vy -= relV * ny
              b.vx += relV * nx; b.vy += relV * ny
            }
          }
        }
      }

      bs.forEach((b, i) => {
        const el = elemsRef.current[i]
        if (el) {
          el.style.left = `${b.x - b.w / 2}px`
          el.style.top = `${b.y - b.h / 2}px`
        }
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    const resizeObserver = new ResizeObserver(() => {
      initialized = false
    })
    resizeObserver.observe(wrap)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      alive = false
      resizeObserver.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div ref={wrapRef} className="floating-conversation" aria-hidden="true">
      {PHYSICS_DREAMS.map((text, i) => (
        <span
          key={text}
          ref={el => { elemsRef.current[i] = el }}
          className="float-bubble"
        >
          {text}
        </span>
      ))}
    </div>
  )
}

interface Props {
  data: TreeNode | null
  onNodeClick: (toolId: string, useCase?: string, nodeName?: string) => void
  completedNodes: Set<string>
  loading: boolean
  theme?: Theme
}

const MIN_CANVAS_WIDTH = 900
const MIN_CANVAS_HEIGHT = 520
const MARGIN = { top: 40, right: 200, bottom: 40, left: 160 }

export default function DiagramPanel({ data, onNodeClick, completedNodes, loading, theme = 'dark' }: Props) {
  const { t } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [panelSize, setPanelSize] = useState({ width: MIN_CANVAS_WIDTH, height: MIN_CANVAS_HEIGHT })
  const [zoomLevel, setZoomLevel] = useState(100)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setPanelSize({
        width: Math.max(1, Math.floor(entry.contentRect.width)),
        height: Math.max(1, Math.floor(entry.contentRect.height)),
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current) return
    const svg = select<SVGSVGElement, unknown>(svgRef.current)
    svg.selectAll('*').remove()

    if (!data || loading) return

    const cs = getComputedStyle(document.documentElement)
    const C_ACCENT = cs.getPropertyValue('--accent').trim() || '#7c5cfc'
    const C_LINK = cs.getPropertyValue('--d-link').trim() || '#252540'
    const C_BRANCH = cs.getPropertyValue('--d-branch').trim() || '#1e1e34'
    const C_TEXT = cs.getPropertyValue('--d-text').trim() || '#c8c4e0'
    const C_TEXT_T = cs.getPropertyValue('--d-text-tool').trim() || '#eeeaf8'
    const C_DONE = cs.getPropertyValue('--success').trim() || '#22c55e'

    const effectiveW = Math.max(panelSize.width - 10, MIN_CANVAS_WIDTH)
    const effectiveH = Math.max(panelSize.height - 10, MIN_CANVAS_HEIGHT)
    const innerW = effectiveW - MARGIN.left - MARGIN.right
    const innerH = effectiveH - MARGIN.top - MARGIN.bottom

    const g = svg.append('g')
    const root = hierarchy<TreeNode>(data)
    tree<TreeNode>().size([innerH, innerW])(root)

    const linkGen = linkHorizontal<unknown, { x: number; y: number }>()
      .x(d => (d as { x: number; y: number }).y)
      .y(d => (d as { x: number; y: number }).x)

    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d => linkGen(d as Parameters<typeof linkGen>[0]) ?? '')
      .attr('fill', 'none')
      .attr('stroke', d => {
        const target = d.target.data
        return target.toolId && completedNodes.has(target.name) ? C_DONE : C_LINK
      })
      .attr('stroke-width', 1.5)

    const node = g
      .selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', d => d.data.toolId ? 'node action-node' : 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .style('cursor', d => d.data.toolId ? 'pointer' : 'default')
      .attr('role', d => d.data.toolId ? 'button' : null)
      .attr('tabindex', d => d.data.toolId ? 0 : null)
      .attr('aria-label', d => d.data.toolId ? `${d.data.name}. Show recommended AI tool` : null)
      .on('click', (_, d) => {
        if (d.data.toolId) onNodeClick(d.data.toolId, d.data.useCase, d.data.name)
      })
      .on('keydown', (event, d) => {
        if (d.data.toolId && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onNodeClick(d.data.toolId, d.data.useCase, d.data.name)
        }
      })

    const isCompleted = (d: { data: TreeNode }) => !!d.data.toolId && completedNodes.has(d.data.name)

    node
      .filter(d => !!d.data.toolId)
      .append('rect')
      .attr('class', 'action-node-highlight')
      .attr('x', -17)
      .attr('y', -19)
      .attr('width', d => Math.max(124, d.data.name.length * 6.4 + 45))
      .attr('height', 38)
      .attr('rx', 10)

    node
      .append('circle')
      .attr('class', 'node-dot')
      .attr('r', d => d.depth === 0 ? 14 : d.data.toolId ? 8 : 6)
      .attr('fill', d => {
        if (d.depth === 0) return C_ACCENT
        if (isCompleted(d)) return C_DONE
        if (d.data.toolId) return C_ACCENT
        return C_BRANCH
      })
      .attr('stroke', d => {
        if (isCompleted(d)) return C_DONE
        if (d.data.toolId) return C_ACCENT
        return C_BRANCH
      })
      .attr('stroke-width', 2)

    node
      .filter(d => isCompleted(d))
      .append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#fff')
      .attr('font-weight', '700')
      .attr('pointer-events', 'none')
      .text('✓')

    node
      .filter(d => d.data.feasibility !== undefined)
      .append('text')
      .attr('dy', d => d.depth === 0 ? -20 : -14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', C_DONE)
      .text(d => `${d.data.feasibility}%`)

    node
      .append('text')
      .attr('class', d => d.depth === 0 ? 'node-label node-label--root' : 'node-label')
      .attr('dy', d => d.depth === 0 ? 32 : '0.32em')
      .attr('x', d => d.depth === 0 ? 0 : d.children ? -12 : 12)
      .attr('text-anchor', d => d.depth === 0 ? 'middle' : d.children ? 'end' : 'start')
      .attr('font-size', d => d.depth === 0 ? '13px' : d.data.toolId ? '11px' : '12px')
      .attr('font-weight', d => (d.depth === 0 || !d.data.toolId) ? '600' : '400')
      .attr('fill', d => isCompleted(d) ? C_DONE : d.data.toolId ? C_TEXT_T : C_TEXT)
      .text(d => d.data.name)

    node
      .filter(d => !!d.data.toolId)
      .append('title')
      .text('Click to see AI tool →')

    node
      .filter(d => !!d.data.toolId)
      .on('mouseenter', function (_, d) {
        if (!isCompleted(d)) select(this).select('circle').attr('fill', C_ACCENT + 'cc')
      })
      .on('mouseleave', function (_, d) {
        select(this).select('circle').attr('fill', isCompleted(d) ? C_DONE : C_ACCENT)
      })

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .extent([[0, 0], [panelSize.width, panelSize.height]])
      .filter(event => {
        const target = event.target
        const isActionNode = target instanceof Element && target.closest('.action-node')

        // Keep taps on execution-plan nodes available for selection on touch screens.
        if (event.type !== 'wheel' && isActionNode) return false
        return (!event.ctrlKey || event.type === 'wheel') && !event.button
      })
      .on('zoom', event => {
        g.attr('transform', event.transform.toString())
        setZoomLevel(Math.round(event.transform.k * 100))
      })

    svg.call(zoomBehavior).on('dblclick.zoom', null)
    svg.call(zoomBehavior.transform, zoomIdentity.translate(MARGIN.left, MARGIN.top))
    zoomRef.current = zoomBehavior
  }, [data, onNodeClick, completedNodes, loading, panelSize, theme])

  const zoomAtCenter = useCallback((factor: number) => {
    if (!zoomRef.current || !svgRef.current) return
    select<SVGSVGElement, unknown>(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomRef.current.scaleBy, factor, [panelSize.width / 2, panelSize.height / 2])
  }, [panelSize])

  const handleZoomReset = useCallback(() => {
    if (!zoomRef.current || !svgRef.current) return
    select<SVGSVGElement, unknown>(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomRef.current.transform, zoomIdentity.translate(MARGIN.left, MARGIN.top))
  }, [])

  return (
    <div className="diagram-panel" ref={containerRef}>
      {loading && (
        <div className="diagram-loading">
          <div className="spinner" />
          <p>{t('realizing')}</p>
        </div>
      )}
      {!loading && !data && (
        <div className="diagram-empty">
          <PhysicsBubbles />
          <p className="conversation-hint">{t('roadmapHint')}</p>
        </div>
      )}
      {data && !loading && (
        <>
          <div className="feasibility-legend">
            <span className="feasibility-dot" />
            <span><strong>{t('feasibility')}</strong> {t('feasibilityText')}</span>
          </div>
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => zoomAtCenter(1 / 1.35)} title={t('zoomOut')} aria-label={t('zoomOut')}>-</button>
            <span className="zoom-level">{zoomLevel}%</span>
            <button className="zoom-btn" onClick={() => zoomAtCenter(1.35)} title={t('zoomIn')} aria-label={t('zoomIn')}>+</button>
            <button className="zoom-reset-btn" onClick={handleZoomReset}>{t('reset')}</button>
          </div>
        </>
      )}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: data && !loading ? 'block' : 'none' }}
      />
    </div>
  )
}
