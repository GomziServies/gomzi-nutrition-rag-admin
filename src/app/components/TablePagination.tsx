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
	const safeItemsPerPage = Math.max(1, Math.floor(Number(itemsPerPage) || 10))
	const safeTotalPages = Math.max(0, Math.floor(Number(totalPages) || 0))
	const safePage = Math.min(
		Math.max(1, Math.floor(Number(currentPage) || 1)),
		Math.max(1, safeTotalPages)
	)

	if (safeTotalPages <= 0) return null

	const changePage = (nextPage: number) => {
		if (nextPage < 1 || nextPage > safeTotalPages || nextPage === safePage) return
		onPageChange(nextPage)
	}

	const getPaginationItems = (page: number, total: number): (number | '...')[] => {
		if (total <= 4) {
			return Array.from({ length: total }, (_, i) => i + 1)
		}
		if (page <= 3) {
			return [1, 2, 3, '...', total]
		}
		if (page >= total - 2) {
			return [1, '...', total - 2, total - 1, total]
		}
		return [1, '...', page - 1, page, page + 1, '...', total]
	}

	const pageItems = getPaginationItems(safePage, safeTotalPages)

	const parsedTotal = Number(totalRecords)
	const displayTotal =
		totalRecords !== undefined && isFinite(parsedTotal)
			? Math.max(0, Math.floor(parsedTotal))
			: safeTotalPages * safeItemsPerPage
	const displayStart = displayTotal === 0 ? 0 : (safePage - 1) * safeItemsPerPage + 1
	const displayEnd = Math.min(safePage * safeItemsPerPage, displayTotal)

	return (
		<div
			className='gz-inv-pagination'
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '16px 24px',
				borderTop: '1px solid #E4EAF2',
				background: '#FFFFFF',
				fontSize: '13px',
				color: '#71809A',
				flexWrap: 'wrap',
				gap: '12px',
				width: '100%',
			}}>
			{/* Left: Showing count (x-y of z) */}
			<div style={{ color: '#556987', fontSize: '13px', textAlign: 'left', fontWeight: 500 }}>
				Showing <strong>{displayStart}</strong>–<strong>{displayEnd}</strong> of <strong>{displayTotal}</strong> {entityName}
			</div>

			{/* Right: Numbered pagination group */}
			<div
				className='gz-inv-pages-group'
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '6px',
					marginLeft: 'auto',
				}}>
				<button
					type='button'
					className='gz-inv-page-num'
					disabled={safePage <= 1}
					onClick={() => changePage(safePage - 1)}
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
						cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
						opacity: safePage <= 1 ? 0.4 : 1,
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
					const isActive = safePage === item
					return (
						<button
							key={item}
							type='button'
							className={`gz-inv-page-num ${isActive ? 'active' : ''}`}
							onClick={() => changePage(item)}
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
					disabled={safePage >= safeTotalPages}
					onClick={() => changePage(safePage + 1)}
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
						cursor: safePage >= safeTotalPages ? 'not-allowed' : 'pointer',
						opacity: safePage >= safeTotalPages ? 0.4 : 1,
						transition: 'all 0.15s ease',
					}}>
					<FontAwesomeIcon icon={faAngleRight} />
				</button>
			</div>
		</div>
	)
}

export default UsersListPagination
