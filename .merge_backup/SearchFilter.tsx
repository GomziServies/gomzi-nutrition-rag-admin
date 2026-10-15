import React, { useEffect, useRef, useState } from 'react'

const SearchFilter: React.FC<{
	searchTerm: string
	style?: React.CSSProperties
	setSearchTerm: React.Dispatch<React.SetStateAction<string>> | ((term: string) => void) | any
	placeholder?: string
	className?: string
}> = ({ searchTerm, setSearchTerm, style, placeholder = 'Search...', className }) => {
	const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
	const setSearchTermRef = useRef(setSearchTerm)

	useEffect(() => {
		setSearchTermRef.current = setSearchTerm
	}, [setSearchTerm])

	useEffect(() => {
		setLocalSearchTerm(searchTerm)
	}, [searchTerm])

	useEffect(() => {
		if (localSearchTerm === searchTerm) return

		const handler = setTimeout(() => {
			setSearchTermRef.current(localSearchTerm)
		}, 700)

		return () => {
			clearTimeout(handler)
		}
	}, [localSearchTerm, searchTerm])

	const [isFocused, setIsFocused] = useState(false)

	return (
		<div
			className={`position-relative d-inline-block ${className !== undefined ? className : 'me-3'}`}
			style={{ width: style?.width || '260px' }}>
			<div
				className='search-filter-box d-flex align-items-center position-relative'
				style={{
					border: `1px solid ${isFocused ? '#1E3A5F' : '#DFE7F0'}`,
					borderRadius: '8px',
					height: '38px',
					backgroundColor: '#ffffff',
					boxShadow: isFocused
						? '0 0 0 0.22rem rgba(30, 58, 95, 0.15)'
						: '0 1px 2px rgba(0, 0, 0, 0.04)',
					transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
					overflow: 'hidden',
					...style,
				}}>
				<svg
					width='15'
					height='15'
					viewBox='0 0 24 24'
					fill='none'
					stroke={isFocused ? '#1E3A5F' : '#94a3b8'}
					strokeWidth='2.2'
					strokeLinecap='round'
					strokeLinejoin='round'
					style={{
						position: 'absolute',
						left: '12px',
						top: '50%',
						transform: 'translateY(-50%)',
						pointerEvents: 'none',
						zIndex: 5,
						transition: 'stroke 0.15s ease',
					}}>
					<circle cx='11' cy='11' r='8' />
					<line x1='21' y1='21' x2='16.65' y2='16.65' />
				</svg>
				<input
					type='text'
					data-kt-user-table-filter='search'
					className={`search-filter-input gz-no-override border-0 bg-transparent py-0 ${
						localSearchTerm ? 'pe-8' : 'pe-3'
					}`}
					style={{
						fontSize: '13px',
						fontWeight: 500,
						color: '#172B4D',
						backgroundColor: 'transparent',
						border: 'none',
						boxShadow: 'none',
						outline: 'none',
						width: '100%',
						height: '100%',
						paddingLeft: '38px',
						paddingRight: localSearchTerm ? '32px' : '12px',
						margin: 0,
					}}
					placeholder={placeholder}
					value={localSearchTerm}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					onChange={(e) => setLocalSearchTerm(e.target.value)}
				/>
				{localSearchTerm && (
					<button
						type='button'
						className='search-filter-clear-btn'
						style={{
							position: 'absolute',
							right: '8px',
							top: '50%',
							transform: 'translateY(-50%)',
							width: '22px',
							height: '22px',
							background: 'none',
							border: 'none',
							padding: 0,
							margin: 0,
							zIndex: 5,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: '#94a3b8',
							cursor: 'pointer',
							outline: 'none',
							boxShadow: 'none',
							transition: 'color 0.15s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = '#1E3A5F'
							e.currentTarget.style.transform = 'translateY(-50%)'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = '#94a3b8'
							e.currentTarget.style.transform = 'translateY(-50%)'
						}}
						onClick={() => {
							setLocalSearchTerm('')
							setSearchTermRef.current('')
						}}
						title='Clear search'>
						<svg
							width='14'
							height='14'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2.2'
							strokeLinecap='round'
							strokeLinejoin='round'>
							<line x1='18' y1='6' x2='6' y2='18'></line>
							<line x1='6' y1='6' x2='18' y2='18'></line>
						</svg>
					</button>
				)}
			</div>
		</div>
	)
}

export default SearchFilter
