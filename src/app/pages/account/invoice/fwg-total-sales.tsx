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
	const [allEmployees, setAllEmployees] = useState<any[]>([])

	useEffect(() => {
		fetchInvoiceInsightData()
	}, [selectedDateRange])

	useEffect(() => {
		fetchInvoiceData()
	}, [selectedDateRange, selectedBranch, searchTerm, sort, sortOrder])

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

	// Reset pagination to page 1 when any filter changes
	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [selectedSalesPerson, selectedBranch, selectedFilter, selectedDateRange])

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
					createdById: adminInfo._id,
				})
			} else if (fgGroupInfo) {
				adminInfo = JSON.parse(fgGroupInfo)
				response = await GetInvoice({
					...commonParams,
					...(searchTerm && { search: searchTerm }),
					...(selectedBranch && { branch_name: selectedBranch }),
				})
			}

			const buildQuery = (currentPage: number) => ({
				...commonParams,
				page: currentPage,
				limit: 100,
				...(searchTerm && { search: searchTerm }),
				...(selectedBranch && { branch_name: selectedBranch }),
			})

			const firstResponse: any = await GetInvoice({
				...buildQuery(1),
				...(portalInfo && { createdById: adminInfo._id }),
			})
			const firstPagination = firstResponse?.metadata?.pagination || {}
			const totalPages = Number(firstPagination.totalPages || 1)
			let allInvoiceRows = Array.isArray(firstResponse.data) ? [...firstResponse.data] : []

			for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
				const nextResponse: any = await GetInvoice({
					...buildQuery(currentPage),
					...(portalInfo && { createdById: adminInfo._id }),
				})
				if (Array.isArray(nextResponse.data)) {
					allInvoiceRows = allInvoiceRows.concat(nextResponse.data)
				}
			}

			setMetaData(firstPagination)
			setInvoiceData(allInvoiceRows)
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
				setAllEmployees(response.data)

				const salesPersons = response.data.filter((emp: any) => {
					const adminId = String(emp._id || '')
					const employeeDocId = String(emp.employee?._id || '')

					const isAllowedId = ALLOWED_IDS.includes(adminId) || ALLOWED_IDS.includes(employeeDocId)
					const isSalesPerson = emp.employee?.position === 'Sales Person'
					const isFWG = (emp.employee?.branch_name || '').toLowerCase().includes('fwg')

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
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const getSelectedSalesPersonName = (selectedId: string) => {
		const selected = salesPersonList.find((emp: any) => {
			const candidates = [
				String(emp._id || ''),
				String(emp.employee?._id || ''),
				String(emp.employee_id || ''),
				String(emp.employee?.employee_id || ''),
			]
			return candidates.includes(String(selectedId).trim())
		})
		return selected?.full_name || selected?.name || ''
	}

	const filteredInvoiceData = [...invoiceData]
		.filter((invoice: any) => {
			if (selectedSalesPerson && selectedSalesPerson !== 'default') {
				const selectedName = getSelectedSalesPersonName(selectedSalesPerson)
				if (selectedName && getSalesPersonDisplayName(invoice) !== selectedName) {
					return false
				}
			}

			if (selectedBranch && String(invoice?.branch_name || '') !== String(selectedBranch)) {
				return false
			}

			if (selectedFilter === 'Paid Amount') {
				return Number(invoice?.paidPayment || 0) > 0
			}

			if (selectedFilter === 'Due Amount') {
				return Number(invoice?.totalPayment || 0) - Number(invoice?.paidPayment || 0) > 0
			}

			if (selectedFilter === 'Total Amount') {
				return Number(invoice?.totalPayment || 0) > 0
			}

			return true
		})
		.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

	const paginatedInvoiceData = filteredInvoiceData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const totalPages = Math.ceil(filteredInvoiceData.length / pagination.itemsPerPage)

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
				'Sales Person': getSalesPersonDisplayName(invoice),
				'Total Amount': invoice?.totalPayment
					? invoice?.totalPayment
					: invoice?.totalPayment || 'N/A',
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
				{ title: 'Inv No.', field: 'id' },
				{ title: 'Name', field: 'fullName' },
				{ title: 'Sales', field: 'sales_person' },
				{ title: 'Product', field: 'productName' },
				...(selectedFilter === 'Paid Amount'
					? [{ title: 'Paid', field: 'paidPayment' }]
					: selectedFilter === 'Due Amount'
					? [{ title: 'Due', field: 'duePayment' }]
					: selectedFilter === 'Total Amount'
					? [{ title: 'Total', field: 'totalPayment' }]
					: [{ title: 'Date', field: 'date' }]),
				{ title: 'Date', field: 'date' },
		  ])
		: (sortableFields = [
				{ title: 'Inv No.', field: 'id' },
				{ title: 'Name', field: 'fullName' },
				{ title: 'Sales', field: 'sales_person' },
				{ title: 'Product', field: 'productName' },
				{ title: 'Branch', field: 'branch_name' },
				{ title: 'Paid', field: 'paidPayment' },
				{ title: 'Total', field: 'totalPayment' },
				{ title: 'Date', field: 'date' },
		  ])

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const getSalesPersonDisplayName = (invoice: any) => {
		if (invoice?.sales_person === 'N/A') {
			return invoice?.other_sales_person || 'N/A'
		}

		const salesPersonValue = invoice?.sales_person
		const matchedSalesPerson = allEmployees.find((employee: any) => {
			const candidateIds = [
				String(employee?._id || ''),
				String(employee?.employee?._id || ''),
				String(employee?.employee_id || ''),
				String(employee?.employee?.employee_id || ''),
			]
			return candidateIds.includes(String(salesPersonValue))
		})

		return (
			matchedSalesPerson?.full_name ||
			matchedSalesPerson?.employee?.full_name ||
			matchedSalesPerson?.employee?.name ||
			matchedSalesPerson?.name ||
			salesPersonValue ||
			'N/A'
		)
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
					className='col-lg-4'
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
					className='col-lg-4'
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
					className='col-lg-4'
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
				<div className='card-header border-0 pt-6'>
					<div className='w-100'>
						<div className='d-flex align-items-center gap-3 flex-wrap pb-1'>
							<div>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
							</div>
							<div className='ms-0'>
								<button
									className='btn btn-primary btn-icon'
									onClick={downloadExcel}
									disabled={loading}>
									<FontAwesomeIcon
										icon={faDownload}
										className='fs-3'
									/>
								</button>
							</div>
							<div className='mb-0'>
								<LengthMenu
									expenseData={filteredInvoiceData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
							<div>
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
							<div>
								<select
									name='Select Sales Person'
									className='form-select'
									value={selectedSalesPerson}
									onChange={(e) => setSelectedSalesPerson(e.target.value)}>
									<option value='default'>Select Sales Person</option>
									{salesPersonList.map((item: any) => (
										<option
											key={item._id || item.employee?._id || item.employee_id}
											value={
												item._id ||
												item.employee?._id ||
												item.employee_id ||
												item.employee?.employee_id
											}>
											{item.full_name ||
												item.employee?.full_name ||
												item.employee?.name ||
												'Unnamed'}
										</option>
									))}
								</select>
							</div>
							<div>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive total-sales-table'>
						<Table
							data={paginatedInvoiceData}
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
												{getSalesPersonDisplayName(invoice)}
											</span>
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
													<strong>Sales Person: </strong> {getSalesPersonDisplayName(invoice)}
													<br />
													<strong>{sortableFields[1].title}: </strong> {invoice.productName}
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
					{filteredInvoiceData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{filteredInvoiceData.length > 0 && (
						<UsersListPagination
							totalPages={totalPages}
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
