import {
	faBuildingColumns,
	faCircleDollarToSlot,
	faDollarSign,
	faDownload,
	faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { StatisticsWidget2 } from '../../../../_metronic/partials/widgets'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	deleteInvoice,
	GetAdminUsers,
	getInvoice,
	GetInvoiceInsights,
} from '../../../Functions/FGGroup'

const GlsInvestorInvoiceList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [invoiceData, setInvoiceData] = useState<any>([])
	const [branchesData, setBranchesData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [loading, setLoading] = useState(false)
	const [dataInsight, setDataInsight] = useState<any>({})
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const adminType = localStorage.getItem('admin')

	const minDate = new Date('2024-06-05T00:00:00Z')

	const fetchInvoiceData = async (page?: number, store?: any, createdById?: string) => {
		setLoading(true)
		try {
			const category = adminType === 'Store' ? adminType : 'Gomzi Nutrition'

			let startDate: Date
			let endDate: Date

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			} else {
				startDate = minDate // Enforce minimum start date
				endDate = new Date() // End with the current date
			}

			if (startDate < minDate) {
				startDate = minDate
			}

			const response: any = await getInvoice({
				invoice_category: store || category,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				...(searchTerm && { search: searchTerm }),
				from_date: startDate,
				to_date: endDate,
				sort,
				sortOrder,
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			let filteredData = response.data

			// Filter data based on the `createdById`
			if (createdById) {
				filteredData = filteredData.filter((item: any) => item.createdById === createdById)
			}

			// Apply other filters based on selectedFilter
			if (selectedFilter === 'Paid Amount') {
				filteredData = filteredData.filter((invoice: any) => invoice?.paid_amount > 0)
			} else if (selectedFilter === 'Due Amount') {
				filteredData = filteredData.filter((invoice: any) => {
					const dueAmount = invoice?.net_amount - invoice?.paid_amount
					return dueAmount > 0
				})
			} else if (selectedFilter === 'Total Amount') {
				filteredData = filteredData.filter((invoice: any) => invoice?.net_amount > 0)
			}

			// Sort filtered data by date
			filteredData.sort(
				(a: any, b: any) => new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime()
			)

			setInvoiceData(filteredData) // Set the filtered and sorted data
		} catch (error) {
			console.error('Error fetching invoice data:', error)
		}
		setLoading(false)
	}

	const fetchAdminsData = async () => {
		setLoading(true)
		try {
			const response: any = await GetAdminUsers()
			const data = response.data
			const filterData = data.filter((item: any) => item.type === 'Store')
			setBranchesData(filterData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		if (selectedDateRange) {
			fetchInvoiceInsightData()
		}
	}, [selectedDateRange])

	const fetchInvoiceInsightData = async () => {
		let startDate: Date
		let endDate: Date

		if (selectedDateRange) {
			;[startDate, endDate] = selectedDateRange
		} else {
			startDate = minDate
			endDate = new Date()
		}

		if (startDate < minDate) {
			startDate = minDate
		}

		setLoading(true)
		try {
			const category: any = adminType == 'Store' ? adminType : 'Gomzi Nutrition'
			const response: any = await GetInvoiceInsights({
				invoice_category: category,
				from_date: startDate,
				to_date: endDate,
			})
			setDataInsight(response.data[0])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchInvoiceData()
		fetchAdminsData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange, selectedFilter])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchInvoiceData()
		}
	}, [searchTerm])

	useEffect(() => {
		fetchInvoiceInsightData()
	}, [])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination({ ...pagination, page: 1 })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleSetStoreInvoice = (createdById: any) => {
		if (createdById === 'default') {
			fetchInvoiceData()
		} else {
			fetchInvoiceData(0, 'Store', createdById)
		}
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	let sortableFields: any

	selectedFilter
		? (sortableFields = [
				{ title: 'Invoice No.', field: 'id' },
				{ title: 'User', field: 'fullName' },
				...(selectedFilter === 'Paid Amount'
					? [{ title: 'Paid Amount', field: 'paid_amount' }]
					: selectedFilter === 'Due Amount'
					? [{ title: 'Due Amount', field: 'duePayment' }]
					: selectedFilter === 'Total Amount'
					? [{ title: 'Total Amount', field: 'net_amount' }]
					: [{ title: 'Purchase Date', field: 'date' }]),
				{ title: 'Purchase Date', field: 'date' },
		  ])
		: (sortableFields = [
				{ title: 'Invoice No.', field: 'id' },
				{ title: 'User', field: 'fullName' },
				{ title: 'Total Amount', field: 'net_amount' },
				{ title: 'Paid Amount', field: 'paid_amount' },
				{ title: 'Due Amount', field: 'duePayment' },
				{ title: 'Purchase Date', field: 'date' },
		  ])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const downloadExcel = () => {
		const worksheetData = invoiceData.map((invoice: any, index: number) => {
			const products = invoice?.items.map((item: any, i: number) => ({
				[`Product ${i + 1} Name`]: item?.item_name || 'N/A',
				[`Product ${i + 1} Quantity`]: item?.quantity || 'N/A',
				[`Product ${i + 1} Amount`]: item?.amount || 'N/A',
				[`Product ${i + 1} Total Amount`]: item?.totalAmount || 'N/A',
			}))
			return {
				'Invoice No.': invoice?.invoice_number || 'N/A',
				'User Name': invoice?.fullName ? invoice?.fullName : invoice.name || 'N/A',
				Mobile: invoice?.phoneNumber ? invoice?.phoneNumber : invoice?.mobile || 'N/A',
				Email: invoice?.email || 'N/A',
				'Total Amount': invoice?.net_amount ? invoice?.net_amount : invoice?.net_amount || 'N/A',
				'Due Amount': invoice?.paid_amount
					? invoice?.net_amount - invoice?.paid_amount
					: invoice?.net_amount - invoice?.paid_amount || 'N/A',
				'Paid Amount': invoice?.paid_amount ? invoice?.paid_amount : invoice?.paid_amount || 'N/A',
				'Purchase Date': invoice?.date || 'N/A',
				...Object.assign({}, ...products),
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, 'InvoiceData.xlsx')
	}

	const getFilterAmount = (name: string) => {
		if (selectedFilter === name) {
			setSelectedFilter(null)
		} else {
			setSelectedFilter(name)
		}
	}

	const removeInvoice = async (id: string) => {
		try {
			const { value: confirmText } = await Swal.fire({
				title: `Are you sure?`,
				text: `This action cannot be undone. Invoice will remove.`,
				icon: 'question',
				input: 'text',
				inputPlaceholder: 'Write "confirm" here to remove invoice',
				showCancelButton: true,
				confirmButtonText: 'Remove',
				showCloseButton: true,
				inputValidator: (value) => {
					if (!value || value.trim().toLowerCase() !== 'confirm') {
						return 'Please type "confirm" to remove the invoice.'
					}
				},
			})
			if (confirmText && confirmText.trim().toLowerCase() === 'confirm') {
				await deleteInvoice({ id: id })
				toast.success('Invoice removed successfully')
				fetchInvoiceData()
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Total Sales</PageTitle>
			<div className='row g-5 g-xl-8'>
				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Total Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-5 mb-xl-8'
						Icon={faBuildingColumns}
						color='primary'
						title={dataInsight?.total_amount ? dataInsight?.total_amount : '0/-'}
						description='Total Amount'
					/>
				</div>

				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Paid Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faDollarSign}
						color='primary'
						title={dataInsight?.total_paid_amount ? dataInsight?.total_paid_amount : '0/-'}
						description='Paid Amount'
					/>
				</div>

				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Due Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faCircleDollarToSlot}
						color='primary'
						title={dataInsight?.total_unpaid_amount ? dataInsight?.total_unpaid_amount : '0/-'}
						description='Due Amount'
					/>
				</div>
			</div>
			<KTCard>
				<div className='row mx-5 border-0 pt-6'>
					<div className='col-md-5'>
						<div className='card-title'>
							<div className='row'>
								<div className='col-md-6 mx-4'>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={setSearchTerm}
									/>
								</div>
								<div className='d-md-block d-none col-md-3'>
									<LengthMenu
										expenseData={invoiceData}
										handleItemsPerPageChange={handleItemsPerPageChange}
									/>
								</div>
								<div className='col-md-2'>
									<button
										className='btn btn-primary'
										onClick={downloadExcel}
										disabled={loading}>
										<FontAwesomeIcon
											icon={faDownload}
											className='fs-3'
										/>
									</button>
								</div>
							</div>
						</div>
					</div>
					<div className='col-md-7'>
						<div className='card-toolbar d-flex justify-content-end'>
							<div className='d-flex align-items-center gap-3'>
								{adminType !== 'Store' && adminType !== 'GLS_Investor' && (
									<div style={{ minWidth: '200px' }}>
										<select
											name='Select Store'
											className='form-select'
											onChange={(e) => handleSetStoreInvoice(e.target.value)}>
											<option value='default'>Select Store</option>
											{branchesData.map((item: any) => (
												<option
													key={item._id}
													value={item._id}>
													{item.full_name}
												</option>
											))}
										</select>
									</div>
								)}
								<div style={{ minWidth: '250px' }}>
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										rightValue='0'
									/>
								</div>
								{adminType !== 'GLS_Investor' && (
									<TableButton
										action='add'
										to='/rag/create-invoice'
										text='Create Invoice'
									/>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={invoiceData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
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
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td className='text-center'>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{item?.invoice_number}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold fs-6'>{item?.name}</span>
													<span className='text-muted fw-semibold d-flex fs-7'>
														{item?.mobile || ''}
													</span>
												</div>
											</div>
										</td>

										{selectedFilter ? (
											selectedFilter == 'Paid Amount' ? (
												<td className='text-center'>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{item?.paid_amount}
													</span>
												</td>
											) : selectedFilter == 'Due Amount' ? (
												<td className='text-center'>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{item?.net_amount - item?.paid_amount}
													</span>
												</td>
											) : selectedFilter == 'Total Amount' ? (
												<td className='text-center'>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{item?.net_amount}
													</span>
												</td>
											) : (
												''
											)
										) : (
											<>
												<td className='text-center'>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{item?.net_amount}
													</span>
												</td>
												<td className='text-center'>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{item?.paid_amount}
													</span>
												</td>
												<td className='text-center'>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{item?.net_amount - item?.paid_amount}
													</span>
												</td>
											</>
										)}
										<td className='text-center'>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{DayJS(item?.date).format('DD-MM-YYYY')}
											</span>
										</td>
										<td>
											{adminType === 'GLS_Investor' && (
												<TableButton
													action='view'
													to={`/gls-investor/document-view?type=invoice&id=` + item?._id}
												/>
											)}
											{adminType !== 'GLS_Investor' && (
												<>
													<TableButton
														action='edit'
														to={`/rag/update-invoice?invoice_id=` + item?._id}
													/>
													<TableButton
														action='remove'
														onClick={() => removeInvoice(item?._id)}
													/>
												</>
											)}
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>Invoice No.:</strong> {item?.invoice_number}
													<br />
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	item?.profile_image
																		? `https://files.fggroup.in/${item?.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{item?.name}</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{item?.mobile || ''}
															</span>
														</div>
													</div>
													<br />
													<strong>Total Amount:</strong> {item?.net_amount}
													<br />
													<strong>Paid Amount:</strong> {item?.paid_amount}
													<br />
													<strong>Due Amount:</strong> {item?.net_amount - item?.paid_amount}
													<br />
													<strong>Date:</strong> {DayJS(item?.date).format('YYYY-MM-DD')}
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
					{invoiceData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{invoiceData.length > 0 && (
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

export default GlsInvestorInvoiceList
