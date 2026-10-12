import React, { useEffect, useRef, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import { GetRTPConsultancy } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const RTPConsultancy: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [rtpBooking, setRTPBooking] = useState<any[]>([])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchRTPBookingData = async (page?: number) => {
		try {
			const response: FGGroupAPIResponse = await GetRTPConsultancy({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
			})
			const filteredData: any = response.data
			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			setRTPBooking(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchRTPBookingData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchRTPBookingData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredRTPBookingData = rtpBooking.filter((data: any) =>
		data?.user?.first_name.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedRTPBookingData = filteredRTPBookingData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Name', field: 'first_name' },
		{ title: 'Email', field: 'email' },
		{ title: 'Mobile Number', field: 'mobile' },
		{ title: 'Subject', field: 'subject' },
		{ title: 'Date/Time', field: 'createdAt' },
		{ title: 'Message', field: 'message' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>RTP Consultancy Bookings</PageTitle>
			<KTCard>
				<div className='row'>
					<div className='col-12'>
						<div className='d-flex align-items-center justify-content-between mx-5 mt-5'>
							<div className='d-flex'>
								<LengthMenu
									expenseData={rtpBooking}
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
							<TableSort
								sortableFields={sortableFields}
								sort={sort}
								sortOrder={sortOrder}
								onSortChange={handleSortChange}
							/>
							<tbody>
								{paginatedRTPBookingData.map((data: any, index: any) => {
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
													{data?.user?.first_name + ' ' + data?.user?.last_name}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data?.user?.email || '-'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data?.user?.mobile || '-'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.subject || '-'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.message || '-'}
												</span>
											</td>
											<td>
												<TableButton
													action='view'
													to={`/fgiit/rtp-consultancy/view?id=${data._id}`}
												/>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
					{rtpBooking.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{rtpBooking.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(rtpBooking.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default RTPConsultancy
