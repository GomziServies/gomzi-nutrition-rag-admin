import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'

type PaginationProps = {
	totalPages: number
	currentPage: number
	onPageChange: (page: number) => void
	totalRecords?: number
	itemsPerPage?: number
	entityName?: string
}

const UsersListPagination: React.FC<PaginationProps> = ({
	totalPages,
	currentPage,
	onPageChange,
	totalRecords,
	itemsPerPage = 10,
	entityName = 'records',
}) => {
	if (totalPages <= 0) return null

	const getPaginationItems = (page: number, total: number): (number | '...')[] => {
		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1)
		}
		if (page <= 4) {
			return [1, 2, 3, 4, 5, '...', total]
		}
		if (page >= total - 3) {
			return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
		}
		return [1, '...', page - 1, page, page + 1, '...', total]
	}

	const pageItems = getPaginationItems(currentPage, totalPages)

	const fallbackTotal = totalPages * itemsPerPage
	const displayTotal = totalRecords !== undefined ? totalRecords : fallbackTotal
	const displayStart = displayTotal === 0 ? 0 : Math.max(1, (currentPage - 1) * itemsPerPage + 1)
	const displayEnd = Math.min(currentPage * itemsPerPage, displayTotal)

	return (
		<div
			className='gz-inv-pagination'
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
				width: '100%',
			}}>
			{/* Left: Showing count (x-y of z) */}
			<div style={{ flex: '1 1 0', minWidth: '160px', color: '#556987', fontSize: '13px', textAlign: 'left' }}>
				Showing <strong>{displayStart}</strong>–<strong>{displayEnd}</strong> of <strong>{displayTotal}</strong> {entityName}
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
					disabled={currentPage <= 1}
					onClick={() => onPageChange(currentPage - 1)}
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
						cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
						opacity: currentPage <= 1 ? 0.4 : 1,
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
					const isActive = currentPage === item
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
					disabled={currentPage >= totalPages}
					onClick={() => onPageChange(currentPage + 1)}
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
						cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
						opacity: currentPage >= totalPages ? 0.4 : 1,
						transition: 'all 0.15s ease',
					}}>
					<FontAwesomeIcon icon={faAngleRight} />
				</button>
			</div>

			{/* Right: Page X of Y */}
			<div style={{ flex: '1 1 0', minWidth: '160px', color: '#71809A', fontSize: '13px', fontWeight: 500, textAlign: 'right' }}>
				Page {currentPage} of {totalPages}
			</div>
		</div>
	)
}

export default UsersListPagination
