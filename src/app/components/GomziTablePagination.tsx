import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'

export interface GomziTablePaginationProps {
	totalRecords?: number
	page: number
	itemsPerPage?: number
	totalPages?: number
	onPageChange: (page: number) => void
	entityName?: string
	className?: string
}

export const GomziTablePagination: React.FC<GomziTablePaginationProps> = ({
	totalRecords,
	page,
	itemsPerPage = 10,
	totalPages: passedTotalPages,
	onPageChange,
	entityName = 'records',
	className = '',
}) => {
	const totalPages = passedTotalPages || (totalRecords ? Math.max(1, Math.ceil(totalRecords / itemsPerPage)) : 1)
	if (totalRecords !== undefined && totalRecords <= 0) return null

	const currentStart = totalRecords !== undefined ? Math.min((page - 1) * itemsPerPage + 1, totalRecords) : null
	const currentEnd = totalRecords !== undefined ? Math.min(page * itemsPerPage, totalRecords) : null

	const getPaginationItems = (currentPage: number, total: number): (number | '...')[] => {
		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1)
		}
		if (currentPage <= 4) {
			return [1, 2, 3, 4, 5, '...', total]
		}
		if (currentPage >= total - 3) {
			return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
		}
		return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total]
	}

	const pageItems = getPaginationItems(page, totalPages)

	return (
		<div
			className={`gz-inv-pagination ${className}`}
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '18px 24px',
				borderTop: '1px solid #E4EAF2',
				background: '#FFFFFF',
				fontSize: '13px',
				color: '#71809A',
				flexWrap: 'wrap',
				gap: '16px',
			}}>
			{/* Left: Showing count */}
			<div style={{ color: '#556987', fontSize: '13px' }}>
				{totalRecords !== undefined ? (
					<>
						Showing <strong>{currentStart}</strong>–<strong>{currentEnd}</strong> of <strong>{totalRecords}</strong> {entityName}
					</>
				) : (
					<>
						Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong>
					</>
				)}
			</div>

			{/* Middle: Numbered pagination group */}
			<div
				className='gz-inv-pages-group'
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '6px',
				}}>
				<button
					type='button'
					className='gz-inv-page-num'
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
					title='Previous page'
					aria-label='Previous page'
					style={{
						width: '34px',
						height: '34px',
						borderRadius: '9px',
						border: '1px solid #E4EAF2',
						background: '#FFFFFF',
						color: '#172B4D',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: page <= 1 ? 'not-allowed' : 'pointer',
						opacity: page <= 1 ? 0.4 : 1,
						transition: 'all 0.15s ease',
					}}>
					<FontAwesomeIcon icon={faAngleLeft} />
				</button>

				{pageItems.map((item, idx) => {
					if (item === '...') {
						return (
							<span
								key={`dots-${idx}`}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									minWidth: '24px',
									height: '34px',
									color: '#94A3B8',
									fontWeight: 700,
									fontSize: '14px',
									userSelect: 'none',
								}}>
								…
							</span>
						)
					}
					const isActive = page === item
					return (
						<button
							key={item}
							type='button'
							className={`gz-inv-page-num ${isActive ? 'active' : ''}`}
							onClick={() => onPageChange(item)}
							style={{
								width: '34px',
								height: '34px',
								borderRadius: '9px',
								border: isActive ? '1px solid #172B4D' : '1px solid #E4EAF2',
								background: isActive ? '#172B4D' : '#FFFFFF',
								color: isActive ? '#FFFFFF' : '#142447',
								fontWeight: 600,
								fontSize: '13px',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								boxShadow: isActive ? '0 2px 6px rgba(23, 43, 77, 0.2)' : 'none',
								transition: 'all 0.15s ease',
							}}>
							{item}
						</button>
					)
				})}

				<button
					type='button'
					className='gz-inv-page-num'
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}
					title='Next page'
					aria-label='Next page'
					style={{
						width: '34px',
						height: '34px',
						borderRadius: '9px',
						border: '1px solid #E4EAF2',
						background: '#FFFFFF',
						color: '#172B4D',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: page >= totalPages ? 'not-allowed' : 'pointer',
						opacity: page >= totalPages ? 0.4 : 1,
						transition: 'all 0.15s ease',
					}}>
					<FontAwesomeIcon icon={faAngleRight} />
				</button>
			</div>

			{/* Right: Page X of Y */}
			<div style={{ color: '#71809A', fontSize: '13px', fontWeight: 500 }}>
				Page {page} of {totalPages}
			</div>
		</div>
	)
}

export default GomziTablePagination
