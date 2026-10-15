import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { deleteQuotation, getQuotation } from '../../../Functions/FGGroup/Quotation'

const QuotationList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [quotationData, setQuotationData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [loading, setLoading] = useState(false)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const masterData = localStorage.getItem('admin_type')
	const adminType = localStorage.getItem('admin')

	const fetchQuotationData = async (page?: number) => {
		setLoading(true)

		try {
			const category = adminType === 'Store' ? adminType : 'Gomzi Nutrition'

			let fromDate = ''
			let toDate = ''

			if (selectedDateRange) {
				const [startDate, endDate] = selectedDateRange

				fromDate = DayJS(startDate).format('YYYY-MM-DD')
				toDate = DayJS(endDate).format('YYYY-MM-DD')
			}

			const response: any = await getQuotation({
				quotation_category: category,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				...(searchTerm.trim() && {
					search: searchTerm.trim(),
				}),
				...(fromDate && {
					from_date: fromDate,
				}),
				...(toDate && {
					to_date: toDate,
				}),

				sort,
				sortOrder,
			})

			const metaData: any = response.metadata

			setMetaData(metaData?.pagination || {})
			setQuotationData(response.data || [])
		} catch (error) {
			console.error('Error fetching quotation data:', error)
			toast.error('Error fetching quotation data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchQuotationData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange, searchTerm])

	useEffect(() => {
		if (pagination.page !== 1) {
			setPagination((prev) => ({
				...prev,
				page: 1,
			}))
		}
	}, [searchTerm])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)

		setPagination((prev) => ({
			...prev,
			page: 1,
		}))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleDeleteQuotation = async (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const response: any = await deleteQuotation({ id })
					if (response.status === 200) {
						toast.success('Quotation deleted successfully')
						fetchQuotationData()
					} else {
						toast.error(response.message || 'Failed to delete quotation')
					}
				} catch (error: any) {
					toast.error(error.message || 'Failed to delete quotation')
				}
			}
		})
	}

	const exportToExcel = () => {
		const worksheet = XLSX.utils.json_to_sheet(
			quotationData.map((quotation: any) => ({
				'Quotation Number': quotation.quotation_number,
				Date: DayJS(quotation.date).format('DD/MM/YYYY'),
				'Customer Name': quotation.name,
				Email: quotation.email,
				Mobile: quotation.mobile,
				'Total Amount': quotation.net_amount,
			}))
		)

		const workbook = XLSX.utils.book_new()

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotations')

		XLSX.writeFile(workbook, 'quotations.xlsx')
	}

	const sortableFields = [
		{ title: 'Quotation No.', field: 'quotation_number' },
		{ title: 'Customer', field: 'name' },
		{ title: 'Total Amount', field: 'net_amount' },
		{ title: 'Date', field: 'date' },
	]

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const renderRow = (item: any, index: number, actualIndex: number, isVisible: boolean) => {
		return (
			<React.Fragment key={item._id}>
				<tr
					className='data-row'
					onClick={() => handleRowClick(item._id)}>
					<td className='text-center'>
						<div
							className='d-flex ms-8'
							role='button'>
							<FontAwesomeIcon
								icon={faPlusCircle}
								className='mx-2 ms-5 mb-1 plus-icon'
								style={{ color: '#607D8B', fontSize: '18px' }}
							/>
							<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
						</div>
					</td>
					<td>
						<span className='text-dark fw-bold d-block mb-1 fs-6'>
							{item?.quotation_number || 'N/A'}
						</span>
					</td>
					<td>
						<div className='d-flex align-items-center'>
							<div className='d-flex justify-content-start flex-column'>
								<span className='text-dark fw-bold fs-6'>{item?.name}</span>
								<span className='text-muted fw-semibold text-muted d-flex fs-7'>
									{item?.mobile || ''}
								</span>
							</div>
						</div>
					</td>

					<td>
						<span className='text-dark fw-bold d-block mb-1 fs-6'>{item?.net_amount}</span>
					</td>
					<td>
						<span className='text-dark fw-bold d-block mb-1 fs-6'>
							{DayJS(item?.date).format('YYYY-MM-DD')}
						</span>
					</td>
					<td className='text-nowrap'>
						<div className='d-flex align-items-center text-nowrap'>
							<TableButton
								action='edit'
								to={`/rag/update-quotation?id=${item?._id}`}
								title='Edit'
							/>
							<TableButton
								action='remove'
								onClick={() => handleDeleteQuotation(item?._id)}
								title='Delete'
							/>
						</div>
					</td>
				</tr>
				{isVisible && (
					<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
						<td colSpan={12}>
							<div>
								<strong>Quotation No.:</strong> {item?.quotation_number || 'N/A'}
								<br />
								<div className='d-flex align-items-center'>
									<div className='symbol symbol-45px me-3'>
										<img
											src={toAbsoluteUrl('/media/logos/fgiit-logo.png')}
											alt='User'
											style={{ width: '50px', height: '50px' }}
										/>
									</div>
									<div className='d-flex justify-content-start flex-column'>
										<span className='text-dark fw-bold fs-6'>{item?.name}</span>
										<span className='text-muted fw-semibold text-muted d-flex fs-7'>
											{item?.mobile || ''}
										</span>
									</div>
								</div>
								<br />
								<strong>Total Amount:</strong> {item?.net_amount}
								<br />
								<strong>Date:</strong> {DayJS(item?.date).format('YYYY-MM-DD')}
							</div>
						</td>
					</tr>
				)}
			</React.Fragment>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Quotation List</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex flex-wrap align-items-center gap-3 w-100'>
						{/* 1. Search */}
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								className='me-0'
							/>
						</div>

						{/* 2. Dropdown (show entries per page) */}
						<div>
							<LengthMenu
								expenseData={quotationData}
								handleItemsPerPageChange={handleItemsPerPageChange}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center justify-content-center'
								onClick={exportToExcel}
								disabled={loading || quotationData.length === 0}
								style={{
									width: '38px',
									height: '38px',
									padding: 0,
									borderRadius: '8px',
									fontSize: '14px',
								}}
								title='Download Excel'>
								<FontAwesomeIcon icon={faDownload} />
							</button>
						</div>

						{/* 4. Date Filter */}
						<div className='d-flex align-items-center'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>

						{/* 5. End me Create Quotation */}
						<div className='ms-auto'>
							<TableButton
								action='add'
								to='/rag/create-quotation'
								text='Create Quotation'
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={quotationData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={renderRow}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{quotationData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{quotationData.length > 0 && metaData && (
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

export default QuotationList
