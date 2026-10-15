import React, { useEffect, useState } from 'react'

const SearchFilter: React.FC<{
	searchTerm: string
	style?: React.CSSProperties
	placeholder?: string
	setSearchTerm: React.Dispatch<React.SetStateAction<string>>
	className?: string
}> = ({ searchTerm, setSearchTerm, style, placeholder = 'Search...', className = '' }) => {
	const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

	useEffect(() => {
		const handler = setTimeout(() => {
			setSearchTerm(localSearchTerm)
		}, 700)

		return () => {
			clearTimeout(handler)
		}
	}, [localSearchTerm, setSearchTerm])

	return (
		<div
			className={`gz-top-search-bar gz-search-filter-box ${className}`.trim()}
			style={{
				width: '100%',
				height: '38px',
				minHeight: '38px',
				borderRadius: '10px',
				padding: '0 12px',
				background: '#ffffff',
				border: '1px solid #ded8d2',
				display: 'flex',
				alignItems: 'center',
				boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
				...style,
			}}>
			<i
				className='bi bi-search gz-top-search-icon'
				style={{
					fontSize: '13.5px',
					color: '#9ca3af',
					marginRight: '8px',
					flexShrink: 0,
				}}></i>
			<input
				type='text'
				data-kt-user-table-filter='search'
				className='gz-top-search-input gz-search-filter-input'
				placeholder={placeholder}
				value={localSearchTerm}
				onChange={(e) => setLocalSearchTerm(e.target.value)}
				style={{
					border: 'none',
					outline: 'none',
					background: 'transparent',
					backgroundColor: 'transparent',
					boxShadow: 'none',
					padding: 0,
					margin: 0,
					height: '100%',
					minHeight: 0,
					fontSize: '13px',
					color: '#0f172a',
					width: '100%',
					flex: 1,
					borderRadius: 0,
				}}
			/>
			{localSearchTerm && (
				<button
					type='button'
					className='gz-table-search-clear gz-search-filter-clear'
					onClick={() => {
						setLocalSearchTerm('')
						setSearchTerm('')
					}}
					title='Clear search'>
					<i className='bi bi-x-lg' style={{ fontSize: '10px' }}></i>
				</button>
			)}
		</div>
	)
}

export default SearchFilter
