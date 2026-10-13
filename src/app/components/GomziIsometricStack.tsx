import React from 'react'

export const GomziIsometricStack: React.FC<{ className?: string }> = ({ className }) => {
	return (
		<div className={`gz-iso-stack-wrapper ${className || ''}`}>
			<svg
				viewBox='0 0 340 220'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'
				className='gz-iso-svg'>
				<defs>
					<linearGradient id='topPlateGrad' x1='120' y1='30' x2='220' y2='90' gradientUnits='userSpaceOnUse'>
						<stop offset='0%' stopColor='#FFFFFF' stopOpacity='0.95' />
						<stop offset='100%' stopColor='#E2E8F0' stopOpacity='0.85' />
					</linearGradient>
					<linearGradient id='midPlateGrad' x1='110' y1='65' x2='230' y2='125' gradientUnits='userSpaceOnUse'>
						<stop offset='0%' stopColor='#F8FAFC' stopOpacity='0.9' />
						<stop offset='100%' stopColor='#E2E8F0' stopOpacity='0.8' />
					</linearGradient>
					<linearGradient id='copperTop' x1='130' y1='105' x2='210' y2='145' gradientUnits='userSpaceOnUse'>
						<stop offset='0%' stopColor='#1E3A8A' />
						<stop offset='100%' stopColor='#0F172A' />
					</linearGradient>
					<linearGradient id='copperLeft' x1='130' y1='145' x2='170' y2='190' gradientUnits='userSpaceOnUse'>
						<stop offset='0%' stopColor='#0F172A' />
						<stop offset='100%' stopColor='#020617' />
					</linearGradient>
					<linearGradient id='copperRight' x1='170' y1='145' x2='210' y2='190' gradientUnits='userSpaceOnUse'>
						<stop offset='0%' stopColor='#1E293B' />
						<stop offset='100%' stopColor='#0F172A' />
					</linearGradient>
					<filter id='softShadow' x='80' y='160' width='180' height='60' filterUnits='userSpaceOnUse'>
						<feGaussianBlur stdDeviation='10' />
					</filter>
				</defs>

				{/* Ground shadow */}
				<ellipse cx='170' cy='190' rx='65' ry='16' fill='#CBD5E1' opacity='0.5' filter='url(#softShadow)' />

				{/* Lower shadow layer */}
				<path d='M170 185 L220 160 L170 135 L120 160 Z' fill='#E2E8F0' opacity='0.6' />

				{/* BASE CUBE - Dark Slate Navy Core */}
				{/* Top face of core */}
				<path d='M170 120 L212 142 L170 164 L128 142 Z' fill='url(#copperTop)' stroke='#2563EB' strokeWidth='0.8' />
				{/* Left face of core */}
				<path d='M128 142 L170 164 L170 196 L128 174 Z' fill='url(#copperLeft)' />
				{/* Right face of core */}
				<path d='M170 164 L212 142 L212 174 L170 196 Z' fill='url(#copperRight)' />

				{/* GOMZI Symbol on Core (stylized cobalt chevron mark) */}
				<path
					d='M146 163 L158 156 L158 170 L146 177 Z'
					fill='#2563EB'
					opacity='0.9'
				/>
				<path
					d='M158 156 L170 163 L170 177 L158 170 Z'
					fill='#60A5FA'
				/>

				{/* MIDDLE FLOATING SLAB */}
				<path d='M170 78 L225 106 L170 134 L115 106 Z' fill='url(#midPlateGrad)' stroke='#CBD5E1' strokeWidth='1' />
				<path d='M115 106 L170 134 L170 139 L115 111 Z' fill='#94A3B8' opacity='0.6' />
				<path d='M170 134 L225 106 L225 111 L170 139 Z' fill='#64748B' opacity='0.6' />

				{/* TOP GLASS SLAB */}
				<path d='M170 32 L230 62 L170 92 L110 62 Z' fill='url(#topPlateGrad)' stroke='#CBD5E1' strokeWidth='1' />
				<path d='M110 62 L170 92 L170 97 L110 67 Z' fill='#94A3B8' opacity='0.7' />
				<path d='M170 92 L230 62 L230 67 L170 97 Z' fill='#64748B' opacity='0.7' />

				{/* Small top accent gem */}
				<path d='M170 20 L185 28 L170 36 L155 28 Z' fill='#EFF6FF' stroke='#2563EB' strokeWidth='0.8' />

				{/* CALLOUT LINES & LABELS (matching reference: Products, Operations, People, Growth) */}
				{/* Line 1: Products */}
				<path d='M205 52 L248 52' stroke='#2563EB' strokeWidth='1' strokeDasharray='2 2' />
				<circle cx='205' cy='52' r='2.5' fill='#2563EB' />
				<circle cx='248' cy='52' r='1.5' fill='#2563EB' />
				<text x='254' y='55' fill='#0F172A' fontSize='10.5' fontWeight='600' fontFamily='Inter, sans-serif'>
					Products
				</text>

				{/* Line 2: Operations */}
				<path d='M200 95 L248 95' stroke='#2563EB' strokeWidth='1' strokeDasharray='2 2' />
				<circle cx='200' cy='95' r='2.5' fill='#2563EB' />
				<circle cx='248' cy='95' r='1.5' fill='#2563EB' />
				<text x='254' y='98' fill='#0F172A' fontSize='10.5' fontWeight='600' fontFamily='Inter, sans-serif'>
					Operations
				</text>

				{/* Line 3: People */}
				<path d='M195 138 L248 138' stroke='#2563EB' strokeWidth='1' strokeDasharray='2 2' />
				<circle cx='195' cy='138' r='2.5' fill='#2563EB' />
				<circle cx='248' cy='138' r='1.5' fill='#2563EB' />
				<text x='254' y='141' fill='#0F172A' fontSize='10.5' fontWeight='600' fontFamily='Inter, sans-serif'>
					People
				</text>

				{/* Line 4: Growth */}
				<path d='M190 180 L248 180' stroke='#2563EB' strokeWidth='1' strokeDasharray='2 2' />
				<circle cx='190' cy='180' r='2.5' fill='#2563EB' />
				<circle cx='248' cy='180' r='1.5' fill='#2563EB' />
				<text x='254' y='183' fill='#0F172A' fontSize='10.5' fontWeight='600' fontFamily='Inter, sans-serif'>
					Growth
				</text>
			</svg>
		</div>
	)
}
