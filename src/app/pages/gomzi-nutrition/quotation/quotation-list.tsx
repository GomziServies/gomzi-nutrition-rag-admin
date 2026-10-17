import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { PlusIcon } from '../../../components/animated-icons'
import { deleteQuotation, getQuotation } from '../../../Functions/FGGroup/Quotation'
import '../common-management.css'

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
							className='d-flex align-items-center justify-content-center'
							role='button'>
							<FontAwesomeIcon
								icon={faPlusCircle}
								className='me-2 plus-icon'
								style={{ color: '#607D8B', fontSize: '15px' }}
							/>
							<span className='text-muted fw-bold fs-7'>{actualIndex}</span>
						</div>
					</td>
					<td>
						<span className='gz-mgmt-pill info' style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12.5px', letterSpacing: '0.03em' }}>
							#{item?.quotation_number || 'N/A'}
						</span>
					</td>
					<td>
						<div className='gz-mgmt-identity-cell'>
							<div className='avatar'>
								{(item?.name || 'Q').charAt(0).toUpperCase()}
							</div>
							<div className='info'>
								<span className='name'>{item?.name || 'Unnamed Client'}</span>
								<span className='sub'>{item?.mobile || item?.email || '-'}</span>
							</div>
						</div>
					</td>
					<td>
						<span className='fw-bold' style={{ color: '#172B4D', fontSize: '14.5px' }}>
							₹{Number(item?.net_amount || 0).toLocaleString('en-IN')}
						</span>
					</td>
					<td>
						<span className='text-muted fs-7'>
							{item?.date ? DayJS(item.date).format('DD MMM YYYY') : '-'}
						</span>
					</td>
					<td className='text-nowrap'>
						<div className='d-flex align-items-center text-nowrap gap-2'>
							<TableButton
								action='edit'
								to={`/rag/update-quotation?id=${item?._id}`}
								title='Edit Quotation'
							/>
							<TableButton
								action='remove'
								onClick={() => handleDeleteQuotation(item?._id)}
								title='Delete Quotation'
							/>
						</div>
					</td>
				</tr>
				{isVisible && (
					<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
						<td colSpan={12} className='p-6 bg-light'>
							<div className='p-4 rounded-3 bg-white border'>
								<div className='d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom'>
									<div>
										<span className='text-muted fs-8 text-uppercase fw-bolder'>Quotation Number</span>
										<h4 className='fw-bolder mb-0 text-primary'>#{item?.quotation_number || 'N/A'}</h4>
									</div>
									<span className='badge badge-light-primary fs-7'>
										{DayJS(item?.date).format('DD MMMM YYYY')}
									</span>
								</div>
								<div className='row g-4'>
									<div className='col-md-6'>
										<span className='text-muted fs-8 text-uppercase fw-bolder d-block mb-1'>Customer Details</span>
										<div className='fw-bold text-dark fs-6'>{item?.name}</div>
										<div className='text-muted fs-7'>{item?.mobile || 'No Phone'} • {item?.email || 'No Email'}</div>
									</div>
									<div className='col-md-6 text-md-end'>
										<span className='text-muted fs-8 text-uppercase fw-bolder d-block mb-1'>Estimated Value</span>
										<div className='fw-bolder text-dark fs-4'>₹{Number(item?.net_amount || 0).toLocaleString('en-IN')}</div>
									</div>
								</div>
							</div>
						</td>
					</tr>
				)}
			</React.Fragment>
		)
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Quotations</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span className='current'>Quotations</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Quotations</h1>
					<p className='gz-mgmt-subtitle'>Manage client price estimates, commercial proposals, and convert them to invoices</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					{masterData === 'MASTER' && (
						<button
							type='button'
							className='gz-mgmt-export-btn'
							onClick={exportToExcel}
							disabled={loading || quotationData.length === 0}
							title='Export to Excel'>
							<FontAwesomeIcon icon={faDownload} />
							<span>Export</span>
						</button>
					)}
					<Link to='/rag/create-quotation' className='gz-mgmt-btn-primary'>
						<PlusIcon size={14} strokeWidth={3.6} />
						<span>Create Quotation</span>
					</Link>
				</div>
			</div>

			<div className='gz-mgmt-card'>
				<div className='gz-mgmt-toolbar'>
					<div className='gz-mgmt-toolbar-left'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>
						<LengthMenu
							expenseData={quotationData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
						<button
							type='button'
							className='gz-mgmt-export-btn'
							onClick={exportToExcel}
							disabled={loading || quotationData.length === 0}
							title='Download Excel'>
							<FontAwesomeIcon icon={faDownload} />
							<span>Export</span>
						</button>
						<div className='d-flex align-items-center'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
					<div className='gz-mgmt-toolbar-right'>
						<Link to='/rag/create-quotation' className='gz-mgmt-btn-primary'>
							<PlusIcon size={14} strokeWidth={3.6} />
							<span>Create Quotation</span>
						</Link>
					</div>
				</div>

				<div className='card-body p-0'>
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
						<div className='text-center py-12 text-muted'>
							<i className='bi bi-file-earmark-text fs-2x mb-3 d-block text-muted opacity-50'></i>
							<b>No quotation records found</b>
							<div className='fs-7 mt-1'>Create your first client quotation to get started.</div>
						</div>
					)}
					{quotationData.length > 0 && metaData && (
						<div className='px-6 py-4' style={{ borderTop: '1px solid #F1F5F9' }}>
							<UsersListPagination
								totalPages={metaData?.totalPages}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
								totalRecords={metaData?.totalRecords || quotationData.length}
								itemsPerPage={pagination.itemsPerPage}
								entityName='quotations'
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default QuotationList
