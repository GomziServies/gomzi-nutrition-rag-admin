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
		<div className='row mt-4'>
			<div className='col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start'></div>
			<div className='col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end'>
				<div id='kt_table_users_paginate'>
					<ul className='pagination'>
						<li className={currentPage === 1 ? 'page-item disabled' : 'page-item'}>
							<button
								className='page-link'
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
										onClick={() => onPageChange(number)}>
										{number}
									</button>
								) : (
									<span className='page-link'>{number}</span>
								)}
							</li>
						))}
						<li className={currentPage === totalPages ? 'page-item disabled' : 'page-item'}>
							<button
								className='page-link'
								onClick={() => onPageChange(currentPage + 1)}
								aria-label='Next'>
								<span aria-hidden='true'>&raquo;</span>
							</button>
						</li>
					</ul>
				</div>
			</div>
		</div>
	)
}

export default UsersListPagination
