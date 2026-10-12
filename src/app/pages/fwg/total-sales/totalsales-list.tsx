import {
	faBuildingColumns,
	faCircleDollarToSlot,
	faDollarSign,
	faDownload,
	faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { StatisticsWidget2 } from '../../../../_metronic/partials/widgets'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup'
import { GetInvoice, GetInvoiceStats } from '../../../Functions/FWG'

const TotalSalesList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [invoiceData, setInvoiceData] = useState<any>([])
	const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
	const [dataInsight, setDataInsight] = useState<any>({})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [loading, setLoading] = useState(false)
	const [selectedBranch, setSelectedBranch] = useState<any>(null)
	const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('default')
	const [salesPersonList, setSalesPersonList] = useState<any[]>([])

	useEffect(() => {
		fetchInvoiceInsightData()
	}, [selectedDateRange])

	useEffect(() => {
		fetchInvoiceData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedFilter,
		selectedBranch,
		selectedSalesPerson,
	])

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

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const fetchInvoiceData = async (page?: number) => {
		setLoading(true)
		try {
			const portalInfo = localStorage.getItem('portal_info')
			const fgGroupInfo = localStorage.getItem('fg_group_info')

			let adminInfo: any = null
			let response: any

			let startDate: Date
			let endDate: Date

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			} else {
				startDate = new Date(0)
				endDate = new Date()
			}

			const commonParams: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				from_date: startDate,
				to_date: endDate,
			}

			if (portalInfo) {
				adminInfo = JSON.parse(portalInfo)
				response = await GetInvoice({
					...commonParams,
					...(searchTerm && { search: searchTerm }),
					...(selectedBranch && { branch_name: selectedBranch }),
					...(selectedSalesPerson !== 'default' && { sales_person: selectedSalesPerson }),
					createdById: adminInfo._id,
				})
			} else if (fgGroupInfo) {
				adminInfo = JSON.parse(fgGroupInfo)
				response = await GetInvoice({
					...commonParams,
					...(searchTerm && { search: searchTerm }),
					...(selectedBranch && { branch_name: selectedBranch }),
					...(selectedSalesPerson !== 'default' && { sales_person: selectedSalesPerson }),
				})
			}

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			let filteredData = response.data

			// Apply selected filter
			if (selectedFilter === 'Paid Amount') {
				filteredData = filteredData.filter((invoice: any) => invoice.paidPayment > 0)
			} else if (selectedFilter === 'Due Amount') {
				filteredData = filteredData.filter((invoice: any) => {
					const dueAmount = invoice.totalPayment - invoice.paidPayment
					return dueAmount > 0
				})
				filteredData = filteredData.filter((invoice: any) => {
					const dueAmount = invoice.totalPayment - invoice.paidPayment
					return dueAmount !== 0
				})
			} else if (selectedFilter === 'Total Amount') {
				filteredData = filteredData.filter((invoice: any) => invoice.totalPayment > 0)
			}

			if (selectedFilter === 'Due Amount') {
				// Remove any invoices with dueAmount equal to 0
				filteredData = filteredData.filter((invoice: any) => {
					const dueAmount = invoice.totalPayment - invoice.paidPayment
					return dueAmount !== 0
				})
			}

			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setInvoiceData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchInvoiceInsightData()
		fetchSalesPersons()
	}, [selectedDateRange, selectedSalesPerson])

	const fetchSalesPersons = async () => {
		try {
			// Allowed sales person admin IDs (environment-based)
			const hostname = window.location.hostname
			let ALLOWED_IDS: string[] = []

			if (hostname === 'admin.fggroup.in') {
				ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d'] // Live
			} else if (hostname === 'admin-dev.fggroup.in') {
				ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d'] // Dev
			} else {
				ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d'] // Local
			}

			const response: any = await GetEmployees({ limit: 1000 })
			if (response.data) {
				const salesPersons = response.data.filter((emp: any) => {
					const adminId = String(emp._id || '')
					const employeeDocId = String(emp.employee?._id || '')

					const isAllowedId = ALLOWED_IDS.includes(adminId) || ALLOWED_IDS.includes(employeeDocId)
					const isSalesPerson = emp.employee?.position === 'Sales Person'
					const branchName = (emp.employee?.branch_name || '').toUpperCase()
					const category = (emp.employee?.category || '').toUpperCase()
					const isFWG = branchName === 'FWG' || category === 'FWG'

					// Show if (Sales Person in FWG) OR (Specially allowed ID)
					return (isSalesPerson && isFWG) || isAllowedId
				})
				setSalesPersonList(salesPersons)
			}
		} catch (error) {
			console.error('Error fetching sales persons:', error)
		}
	}

	const fetchInvoiceInsightData = async () => {
		setLoading(true)
		let startDate: Date
		let endDate: Date

		if (selectedDateRange) {
			;[startDate, endDate] = selectedDateRange
		} else {
			startDate = new Date(0)
			endDate = new Date()
		}
		try {
			const response: any = await GetInvoiceStats({
				invoice_from_date: startDate,
				invoice_to_date: endDate,
				...(selectedSalesPerson !== 'default' && { sales_person: selectedSalesPerson }),
			})
			setDataInsight(response.data[0])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	// const filteredInvoiceData = invoiceData.filter(
	// 	(invoice: any) =>
	// 		invoice.fullName && invoice.fullName.toLowerCase().includes(searchTerm.toLowerCase())
	// )

	// const paginatedSalesData = filteredInvoiceData.slice(
	// 	(pagination.page - 1) * pagination.itemsPerPage,
	// 	pagination.page * pagination.itemsPerPage
	// )

	const downloadExcel = () => {
		const worksheetData = invoiceData?.map((invoice: any, index: number) => {
			return {
				'Invoice No.': invoice?.invoice_number || 'N/A',
				'User Name': invoice?.fullName ? invoice?.fullName : invoice.name || 'N/A',
				Mobile: invoice?.phoneNumber ? invoice?.phoneNumber : invoice?.mobile || 'N/A',
				Email: invoice?.email || 'N/A',
				'Product Name': invoice?.productName || 'N/A',
				'Branch Name': invoice?.branch_name || 'N/A',
				'Sales Person':
					invoice?.sales_person === 'N/A'
						? invoice?.other_sales_person || 'N/A'
						: salesPersonList.find((e: any) => e.employee_id === invoice?.sales_person)
								?.full_name ||
						  invoice?.sales_person ||
						  'N/A',
				'Total Amount': invoice?.totalPayment || 'N/A',
				'Due Amount': invoice?.paidPayment
					? invoice?.totalPayment - invoice?.paidPayment
					: invoice?.totalPayment - invoice?.paidPayment || 'N/A',
				'Paid Amount': invoice?.paidPayment ? invoice?.paidPayment : invoice?.paidPayment || 'N/A',
				'Purchase Date': invoice?.date || 'N/A',
				Notes: invoice?.invoiceNotes || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, 'InvoiceData.xlsx')
	}

	let sortableFields: any
	selectedFilter
		? (sortableFields = [
				{ title: 'Invoice No.', field: 'id' },
				{ title: 'User', field: 'fullName' },
				{ title: 'Services / Product', field: 'productName' },
				{ title: 'Sales Person', field: 'sales_person' },
				...(selectedFilter === 'Paid Amount'
					? [{ title: 'Paid Amount', field: 'paidPayment' }]
					: selectedFilter === 'Due Amount'
					? [{ title: 'Due Amount', field: 'duePayment' }]
					: selectedFilter === 'Total Amount'
					? [{ title: 'Total Amount', field: 'totalPayment' }]
					: [{ title: 'Purchase Date', field: 'date' }]),
				{ title: 'Purchase Date', field: 'date' },
		  ])
		: (sortableFields = [
				{ title: 'Invoice No.', field: 'id' },
				{ title: 'User', field: 'fullName' },
				{ title: 'Services / Product', field: 'productName' },
				{ title: 'Branch Name', field: 'branch_name' },
				{ title: 'Sales Person', field: 'sales_person' },
				{ title: 'Paid Amount', field: 'paidPayment' },
				{ title: 'Total Amount', field: 'totalPayment' },
				{ title: 'Purchase Date', field: 'date' },
		  ])

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const getFilterAmount = (name: string) => {
		if (selectedFilter === name) {
			setSelectedFilter(null)
		} else {
			setSelectedFilter(name)
		}
	}

	return (
		<>
			<style>{`
				.total-sales-table thead th {
					white-space: nowrap !important;
					vertical-align: middle !important;
				}
				.total-sales-table thead th svg {
					vertical-align: middle !important;
					margin-left: 5px !important;
				}
			`}</style>
			<PageTitle breadcrumbs={[]}>Total Sales</PageTitle>
			<div className='row g-5 g-xl-8'>
				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Paid Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faDollarSign}
						color='primary'
						title={dataInsight.total_paid_amount ? dataInsight.total_paid_amount : '0/-'}
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
						title={dataInsight.total_due_amount ? dataInsight.total_due_amount : '0/-'}
						description='Due Amount'
					/>
				</div>
				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Total Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-5 mb-xl-8'
						Icon={faBuildingColumns}
						color='primary'
						title={dataInsight.total_net_amount ? dataInsight.total_net_amount : '0/-'}
						description='Total Amount'
					/>
				</div>
			</div>
			<KTCard>
				<div className='row mx-5 border-0 pt-6'>
					<div className='col-md-3'>
						<div className='card-title'>
							<div className='row'>
								<div className='d-md-block d-none col-md-3'>
									<LengthMenu
										expenseData={invoiceData}
										handleItemsPerPageChange={handleItemsPerPageChange}
									/>
								</div>
							</div>
						</div>
					</div>
					<div className='col-md-9'>
						<div className='card-toolbar d-flex justify-content-end'>
							<TableButton
								action='add'
								to='/fwg/create-invoice'
								text='Create Invoice'
							/>
						</div>
					</div>
					<div className='col-12 row align-items-end mt-4'>
						<div className='col-md-3'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								style={{ width: '100%' }}
							/>
						</div>
						<div className='col-md-1'>
							<button
								className='btn btn-primary w-100'
								onClick={downloadExcel}
								disabled={loading}>
								<FontAwesomeIcon
									icon={faDownload}
									className='fs-3'
								/>
							</button>
						</div>
						<div className='col-md-2'>
							<label className='form-label fw-bold'>Branch Name</label>
							<select
								className='form-select'
								value={selectedBranch || 'default'}
								onChange={(e) =>
									setSelectedBranch(e.target.value === 'default' ? null : e.target.value)
								}>
								<option value='default'>Select Branch</option>
								{['Adajan', 'Vesu', 'Katargam'].map((item: any) => (
									<option
										key={item}
										value={item}>
										{item}
									</option>
								))}
							</select>
						</div>
						<div className='col-md-3'>
							<label className='form-label fw-bold'>Sales Person</label>
							<select
								className='form-select'
								value={selectedSalesPerson}
								onChange={(e) => {
									setSelectedSalesPerson(e.target.value)
									setPagination({ ...pagination, page: 1 })
								}}>
								<option value='default'>All Sales Person</option>
								{salesPersonList.map((item: any) => (
									<option
										key={item._id}
										value={item.employee_id}>
										{item.full_name}
									</option>
								))}
							</select>
						</div>
						<div className='col-md-3 mt-md-0 mt-2'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive total-sales-table'>
						<Table
							data={invoiceData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(invoice: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={invoice._id}>
									<tr
										onClick={() => handleRowClick(invoice._id)}
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
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{invoice.invoice_number}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>{invoice.fullName}</span>
													<span className='text-muted fw-semibold text-muted d-flex fs-7'>
														{invoice.phoneNumber}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{invoice.productName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{invoice.branch_name || '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{invoice.sales_person === 'N/A' ? (
													<div className='d-inline-flex flex-column align-items-start'>
														<span className='fw-bold'>{invoice.other_sales_person}</span>
														<span className='text-muted fs-7'>N/A</span>
													</div>
												) : (
													salesPersonList.find((e: any) => e.employee_id === invoice.sales_person)
														?.full_name ||
													invoice.sales_person ||
													'N/A'
												)}
											</span>
										</td>
										{selectedFilter ? (
											selectedFilter == 'Paid Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{invoice.paidPayment}
													</span>
												</td>
											) : selectedFilter == 'Due Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{invoice.totalPayment - invoice.paidPayment}
													</span>
												</td>
											) : selectedFilter == 'Total Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{invoice.totalPayment}
													</span>
												</td>
											) : (
												''
											)
										) : (
											<>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{invoice.paidPayment}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{invoice.totalPayment}
													</span>
												</td>
											</>
										)}

										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{invoice.date}</span>
										</td>
										<td>
											<TableButton
												action='edit'
												to={`/fwg/sales-list/update-invoice?invoice_id=` + invoice._id}
												backgroundDark={true}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong>{' '}
													<div className='d-flex align-items-center'>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{invoice.fullName}</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{invoice.phoneNumber}
															</span>
														</div>
													</div>
													<br />
													<strong>{sortableFields[1].title}: </strong> {invoice.productName}
													<br />
													<strong>Sales Person: </strong>{' '}
													{invoice.sales_person === 'N/A'
														? `${invoice.other_sales_person} (N/A)`
														: salesPersonList.find(
																(e: any) => e.employee_id === invoice.sales_person
														  )?.full_name ||
														  invoice.sales_person ||
														  '-'}
													<br />
													<strong>{sortableFields[2].title}: </strong> {invoice.paidPayment}
													<br />
													<strong>{sortableFields[3].title}: </strong> {invoice.totalPayment}
													<br />
													<strong>{sortableFields[4].title}: </strong> {invoice.date}
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

export default TotalSalesList
