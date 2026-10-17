import React, { useEffect, useRef } from 'react'

interface CelebrationConfettiProps {
	type: 'birthday' | 'anniversary'
	triggerCount: number
}

interface Particle {
	x: number
	y: number
	vx: number
	vy: number
	size: number
	color: string
	shape: 'rect' | 'circle' | 'star' | 'ribbon'
	rotation: number
	vRot: number
	opacity: number
	life: number
	maxLife: number
}

const BIRTHDAY_COLORS = [
	'#ec4899', // pink
	'#8b5cf6', // lavender / purple
	'#3b82f6', // blue
	'#f59e0b', // amber
	'#10b981', // emerald
	'#06b6d4', // cyan
	'#f43f5e', // rose
]

const ANNIVERSARY_COLORS = [
	'#f59e0b', // gold
	'#fbbf24', // bright gold
	'#d97706', // amber bronze
	'#fef08a', // champagne
	'#8b5cf6', // royal purple
	'#6366f1', // indigo ribbon
	'#ffffff', // sparkle white
]

export const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({
	type,
	triggerCount,
}) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const animFrameRef = useRef<number | null>(null)

	useEffect(() => {
		// Respect prefers-reduced-motion
		if (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return
		}

		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Fit canvas to parent container
		const rect = canvas.getBoundingClientRect()
		const width = rect.width || 450
		const height = rect.height || 260
		canvas.width = width
		canvas.height = height

		// Origin point: right side where illustration is located (approx 78% width, 55% height)
		const originX = width * 0.78
		const originY = height * 0.55

		const colors = type === 'birthday' ? BIRTHDAY_COLORS : ANNIVERSARY_COLORS
		const particleCount = 48
		const particles: Particle[] = []

		for (let i = 0; i < particleCount; i++) {
			const angle = Math.random() * Math.PI * 2
			const speed = Math.random() * 5 + 2
			const maxLife = Math.random() * 50 + 90 // 90 to 140 frames (~2-3 seconds)

			const shapeRandom = Math.random()
			let shape: 'rect' | 'circle' | 'star' | 'ribbon' = 'rect'
			if (type === 'anniversary') {
				shape = shapeRandom < 0.4 ? 'star' : shapeRandom < 0.7 ? 'ribbon' : 'circle'
			} else {
				shape = shapeRandom < 0.45 ? 'rect' : shapeRandom < 0.75 ? 'circle' : 'star'
			}

			particles.push({
				x: originX + (Math.random() - 0.5) * 30,
				y: originY + (Math.random() - 0.5) * 30,
				vx: Math.cos(angle) * speed * (Math.random() * 0.8 + 0.6),
				vy: Math.sin(angle) * speed - (Math.random() * 4 + 2), // initial upward burst
				size: Math.random() * 6 + 4,
				color: colors[Math.floor(Math.random() * colors.length)],
				shape,
				rotation: Math.random() * 360,
				vRot: (Math.random() - 0.5) * 12,
				opacity: 1,
				life: 0,
				maxLife,
			})
		}

		const render = () => {
			ctx.clearRect(0, 0, width, height)
			let alive = 0

			for (const p of particles) {
				p.life++
				if (p.life >= p.maxLife) continue
				alive++

				// Physics
				p.x += p.vx
				p.y += p.vy
				p.vy += 0.12 // gravity
				p.vx *= 0.985 // drag
				p.rotation += p.vRot

				// Fade out near end of life
				const remaining = p.maxLife - p.life
				if (remaining < 30) {
					p.opacity = remaining / 30
				}

				ctx.save()
				ctx.translate(p.x, p.y)
				ctx.rotate((p.rotation * Math.PI) / 180)
				ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
				ctx.fillStyle = p.color

				if (p.shape === 'circle') {
					ctx.beginPath()
					ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
					ctx.fill()
				} else if (p.shape === 'star') {
					// 4-pointed sparkle star
					ctx.beginPath()
					const s = p.size
					ctx.moveTo(0, -s)
					ctx.quadraticCurveTo(0, 0, s, 0)
					ctx.quadraticCurveTo(0, 0, 0, s)
					ctx.quadraticCurveTo(0, 0, -s, 0)
					ctx.quadraticCurveTo(0, 0, 0, -s)
					ctx.fill()
				} else if (p.shape === 'ribbon') {
					// Long fluttering ribbon
					ctx.fillRect(-p.size * 0.3, -p.size * 1.4, p.size * 0.6, p.size * 2.8)
				} else {
					// Regular confetti rectangle
					ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7)
				}

				ctx.restore()
			}

			if (alive > 0) {
				animFrameRef.current = requestAnimationFrame(render)
			} else {
				ctx.clearRect(0, 0, width, height)
			}
		}

		animFrameRef.current = requestAnimationFrame(render)

		return () => {
			if (animFrameRef.current) {
				cancelAnimationFrame(animFrameRef.current)
			}
		}
	}, [type, triggerCount])

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: 8,
				borderRadius: 'inherit',
			}}
		/>
	)
}
