import { faCopy, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetBooks } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const Books: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [bookData, setBookData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [currentPage, setCurrentPage] = useState(1)

	const fetchBookData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			}

			// Adjust endDate to the end of the day for inclusive range if set
			if (endDate) {
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const response = await GetBooks({
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
				return true // Return all data if no date range is selected
			})

			setBookData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchBookData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchBookData()
		}
	}, [searchTerm])

	// useEffect(() => {
	// 	// Function to get page from URL hash
	// 	const getPageFromHash = () => {
	// 		const hash = window.location.hash
	// 		const pageMatch = hash.match(/page=(\d+)/)
	// 		return pageMatch ? parseInt(pageMatch[1], 10) : 1
	// 	}

	// 	// Initialize page number from URL hash
	// 	const initialPage = getPageFromHash()
	// 	setPagination((prev) => ({ ...prev, page: initialPage }))
	// 	setCurrentPage(initialPage) // Update the local page state
	// 	fetchBookData(initialPage) // Fetch data for the initial page
	// }, [])

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
		// window.location.hash = `page=${page}` // Update the URL hash
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
		// window.location.hash = 'page=1' // Update the URL hash
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
		// window.location.hash = 'page=1' // Update the URL hash
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Book ID', field: '_id' },
		{ title: 'Title', field: 'book_title' },
		{ title: 'Price', field: 'amount' },
		{ title: 'Created date', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

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
		<div>
			<PageTitle breadcrumbs={[]}>Books</PageTitle>
			<KTCard>
				<div className='row justify-content-between my-7 mx-5'>
					<div className='col-sm-6 col-12 d-flex'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>

						<div>
							<LengthMenu
								expenseData={bookData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='col-sm-6 col-12 mt-sm-0 mt-7 d-flex justify-content-end position-relative'>
						<div className='col-md-6 mt-md-3 mt-2 me-5'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<div className='modal-footer justify-content-end'>
							<TableButton
								action='add'
								to='/fgiit/books/book-add'
								text='Add Book'
							/>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={bookData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							disableSortFields={['cover_image']}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr
										onClick={() => handleRowClick(data._id)}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold  ms-6 mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
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
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={`https://files.fggroup.in/${data.cover_image}`}
														alt={data.book_title}
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{data.book_title}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												₹ {data.amount}
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
												to={`/fgiit/books/book-view?book_id=${data._id}`}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[1].title}: </strong>{' '}
													<img
														src={`https://files.fggroup.in/${data.cover_image}`}
														alt={data.book_title}
														className='fs-3 text-primary'
														style={{ width: '65px', height: '65px', borderRadius: '20%' }}
													/>
													<br />
													<strong>{sortableFields[0].title}: </strong> {data.book_title}
													<br />
													<strong>{sortableFields[2].title}: </strong> ₹ {data.amount}
													<br />
													<strong>{sortableFields[3].title}: </strong>{' '}
													{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
													<br />
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{bookData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{bookData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</div>
	)
}

export default Books
