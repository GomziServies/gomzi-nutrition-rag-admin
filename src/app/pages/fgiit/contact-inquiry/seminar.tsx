import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetSeminarRegistrations } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const SeminarRegistration: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [seminarData, setSeminarData] = useState<any[]>([])

	const fetchSeminarData = async () => {
		try {
			const response: FGGroupAPIResponse = await GetSeminarRegistrations()
			const filteredData: any = response.data
			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
			setSeminarData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchSeminarData()
	}, [])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredFoodTimeData = seminarData.filter((data: any) =>
		data.seminar_title.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedSeminar = filteredFoodTimeData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Seminar Registration Bookings</PageTitle>
			<KTCard>
				<div className='row'>
					<div className='col-12'>
						<div className='d-flex align-items-center justify-content-between mt-5'>
							<div className='ms-5 d-flex'>
								<LengthMenu
									expenseData={seminarData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Name</th>
									<th>Email</th>
									<th>Mobile</th>
									<th>Seminar</th>
									<th>Date/Time</th>
									<th className='ps-4 rounded-end'>Requested At</th>
								</tr>
							</thead>
							<tbody>
								{paginatedSeminar
								.slice()
								.reverse()
								.map((data: any, index: any) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1

									return (
										<tr key={actualIndex}>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.name}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.email}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.mobile}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.seminar_title || '-'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.date_slot || '-'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</span>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
					{seminarData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{seminarData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(seminarData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default SeminarRegistration
