import React from 'react'

type PaginationProps = {
	totalPages: number
	currentPage: number
	onPageChange: (page: number) => void
}

const UsersListPagination: React.FC<PaginationProps> = ({
	totalPages,
	currentPage,
	onPageChange,
}) => {
	const getPageNumbers = () => {
		const pages = []

		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i)
			}
		} else {
			pages.push(1)
			if (currentPage > 3) {
				pages.push('...')
			}
			if (currentPage > 2 && currentPage < totalPages - 1) {
				pages.push(currentPage - 1)
				pages.push(currentPage)
				pages.push(currentPage + 1)
			} else if (currentPage <= 2) {
				pages.push(2)
				pages.push(3)
			} else {
				pages.push(totalPages - 2)
				pages.push(totalPages - 1)
			}
			if (currentPage < totalPages - 2) {
				pages.push('...')
			}
			pages.push(totalPages)
		}

		return pages
	}

	return (
		<div className='d-flex align-items-center justify-content-end my-2'>
			<div id='kt_table_users_paginate'>
				<ul className='pagination pagination-circle gap-1 m-0 align-items-center'>
					<li className={currentPage === 1 ? 'page-item disabled' : 'page-item'}>
						<button
							className='page-link'
							style={{
								borderRadius: '8px',
								height: '34px',
								minWidth: '34px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '13px',
								fontWeight: 600,
								border: '1px solid #e2e8f0',
							}}
							onClick={() => onPageChange(currentPage - 1)}
							aria-label='Previous'>
							<span aria-hidden='true'>&laquo;</span>
						</button>
					</li>
					{getPageNumbers().map((number, index) => (
						<li
							key={index}
							className={currentPage === number ? 'page-item active' : 'page-item'}>
							{typeof number === 'number' ? (
								<button
									className='page-link'
									style={{
										borderRadius: '8px',
										height: '34px',
										minWidth: '34px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '13px',
										fontWeight: 600,
										border: '1px solid #e2e8f0',
										...(currentPage === number
											? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
											: { backgroundColor: '#ffffff', color: '#334155' }),
									}}
									onClick={() => onPageChange(number)}>
									{number}
								</button>
							) : (
								<span
									className='page-link'
									style={{
										borderRadius: '8px',
										height: '34px',
										minWidth: '34px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '13px',
										border: 'none',
										background: 'transparent',
										color: '#94a3b8',
									}}>
									{number}
								</span>
							)}
						</li>
					))}
					<li className={currentPage === totalPages ? 'page-item disabled' : 'page-item'}>
						<button
							className='page-link'
							style={{
								borderRadius: '8px',
								height: '34px',
								minWidth: '34px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '13px',
								fontWeight: 600,
								border: '1px solid #e2e8f0',
							}}
							onClick={() => onPageChange(currentPage + 1)}
							aria-label='Next'>
							<span aria-hidden='true'>&raquo;</span>
						</button>
					</li>
				</ul>
			</div>
		</div>
	)
}

export default UsersListPagination
