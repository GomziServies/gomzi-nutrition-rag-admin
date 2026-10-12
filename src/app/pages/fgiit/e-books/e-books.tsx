import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import { GetEBooks } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const E_Books: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')
	const [EbookData, setEbookData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [loading, setLoading] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const fetchEbookData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const response = await GetEBooks({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			// Filter books based on the selected date range, if applicable
			const filteredData: any = response.data.filter((book: any) => {
				const bookDate = new Date(book.createdAt)
				if (startDate && endDate) {
					return bookDate >= startDate && bookDate <= endDate
				}
				return true // If no date range is selected, return all data
			})

			setEbookData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchEbookData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange])
	
	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchEbookData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}
	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}
	const filteredEbookData = EbookData.filter((ebook: any) =>
		ebook.ebook_title.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'E-Book ID', field: '_id' },
		{ title: 'Title', field: 'ebook_title' },
		{ title: 'Price', field: 'amount' },
		{ title: 'Created date', field: 'createdAt' },
	]

	const handleCopy = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('ID copied to clipboard!')
			})
			.catch((err) => {
				console.error('Failed to copy ID: ', err)
				toast.success('Failed to copy ID!')
			})
	}

	const handleKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>, id: string) => {
		if (event.key === 'Enter' || event.key === ' ') {
			handleCopy(id)
		}
	}
	return (
		<>
			<PageTitle breadcrumbs={[]}>E-Books</PageTitle>
			<KTCard>
				<div className='d-flex justify-content-between m-5 mx-8'>
					<div className='d-flex pt-1'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div className='mt-1'>
							<LengthMenu
								expenseData={EbookData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='d-flex align-items-center position-relative my-2'>
						<div className='col-md-6 me-5'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<div className='modal-footer justify-content-end'>
							<TableButton
								action='add'
								to='/fgiit/e-book-add'
								text='Add E-Book'
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
								disableSortFields={['_id']}
							/>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									filteredEbookData.map((data: any, index: any) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={data._id}>
												<td className='text-center'>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td
													onClick={() => handleCopy(data?._id)}
													onKeyPress={(event) => handleKeyPress(event, data?._id)}
													role='button'
													tabIndex={0}>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<div className='d-flex'>
															<FontAwesomeIcon
																icon={faCopy}
																className='fs-3 me-2 text-success'
															/>
															{data?._id}
														</div>
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{data.ebook_title}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{'₹' + data.amount}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
													</span>
												</td>

												<td>
													<TableButton
														action='view'
														to={`/fgiit/e-book-view?book_id=${data._id}`}
													/>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{EbookData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{EbookData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default E_Books
