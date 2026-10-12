import {
	faBuildingColumns,
	faCircleDollarToSlot,
	faDollarSign,
	faDownload,
	faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
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
import { GetEmployees, getInvoice, GetInvoiceInsights } from '../../../Functions/FGGroup'

type InvoiceCategory = 'Private' | 'FG Group'

const TotalSalesListFgiit: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const amountFilter: string | null = searchParams.get('filter')
	const [searchTerm, setSearchTerm] = useState('')
	const [invoiceData, setInvoiceData] = useState<any>([])
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
	const [selectedBranch, setSelectedBranch] = useState<any>(null)
	const [employees, setEmployees] = useState<any[]>([])
	const [allEmployees, setAllEmployees] = useState<any[]>([])
	const [selectedSalesPerson, setSelectedSalesPerson] = useState<any>('All')

	const fetchInvoiceData = async (page?: number) => {
		setLoading(true)
		try {
			const category: InvoiceCategory = 'FG Group'
			let startDate: Date
			let endDate: Date

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			} else {
				startDate = new Date(0)
				endDate = new Date()
			}

			const buildQuery = (currentPage: number) => ({
				invoice_category: category,
				page: currentPage,
				limit: 100,
				...(searchTerm && { search: searchTerm }),
				...(selectedBranch && { branch_name: selectedBranch }),
				from_date: startDate,
				to_date: endDate,
				sort,
				sortOrder,
			})

			const firstResponse: any = await getInvoice(buildQuery(1))
			const firstPagination = firstResponse?.metadata?.pagination || {}
			const totalPages = Number(firstPagination.totalPages || 1)
			let allInvoiceRows = Array.isArray(firstResponse.data) ? [...firstResponse.data] : []

			for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
				const nextResponse: any = await getInvoice(buildQuery(currentPage))
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
		if (selectedDateRange) {
			fetchInvoiceInsightData()
		}
	}, [selectedDateRange])

	useEffect(() => {
		if (amountFilter) {
			setSelectedFilter(amountFilter)
		}
	}, [amountFilter])

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
			const category: InvoiceCategory = 'FG Group'
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

	const fetchEmployees = async () => {
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
			if (response.data && Array.isArray(response.data)) {
				setAllEmployees(response.data)

				const salesPersons = response.data.filter((emp: any) => {
					const adminId = String(emp._id || '')
					const employeeDocId = String(emp.employee?._id || '')

					const isAllowedId = ALLOWED_IDS.includes(adminId) || ALLOWED_IDS.includes(employeeDocId)
					const isSalesPerson = emp.employee?.position === 'Sales Person'
					const branchName = (emp.employee?.branch_name || '').trim().toLowerCase()
					const isFGGroup = branchName.includes('fg group') || branchName.includes('fgiit')

					// Show if (Sales Person in FG Group) OR (Specially allowed ID)
					return (isSalesPerson && isFGGroup) || isAllowedId
				})
				setEmployees(salesPersons)
			}
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchInvoiceData()
	}, [selectedDateRange, selectedBranch, searchTerm, sort, sortOrder])

	// Reset pagination to page 1 when any filter changes
	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [selectedSalesPerson, selectedBranch, selectedFilter, selectedDateRange])

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
		fetchEmployees()
	}, [])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const getSalesPersonDisplayName = (invoice: any) => {
		if (!invoice) return 'N/A'

		// Handle explicit N/A or missing sales person
		if (invoice?.sales_person === 'N/A' || invoice?.sales_person == null) {
			return invoice?.other_sales_person || 'N/A'
		}

		// Normalize sales_person value (could be an object or string)
		let salesPersonValue: string = ''
		if (typeof invoice.sales_person === 'object') {
			salesPersonValue = String(invoice.sales_person._id || invoice.sales_person.employee_id || '')
		} else {
			salesPersonValue = String(invoice.sales_person)
		}

		const matchedSalesPerson = allEmployees.find((employee: any) => {
			const candidates = [
				String(employee._id || ''),
				String(employee.employee?._id || ''),
				String(employee.employee_id || ''),
				String(employee.employee?.employee_id || ''),
			]
			return candidates.includes(salesPersonValue)
		})

		return (
			matchedSalesPerson?.full_name ||
			matchedSalesPerson?.employee?.full_name ||
			matchedSalesPerson?.employee?.name ||
			matchedSalesPerson?.name ||
			invoice?.other_sales_person ||
			salesPersonValue ||
			'N/A'
		)
	}

	const getSelectedSalesPersonName = (selectedId: string) => {
		const selected = employees.find((emp: any) => {
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
			if (selectedSalesPerson && selectedSalesPerson !== 'All') {
				const selectedName = getSelectedSalesPersonName(selectedSalesPerson)
				if (selectedName && getSalesPersonDisplayName(invoice) !== selectedName) {
					return false
				}
			}

			if (selectedBranch && String(invoice?.branch_name || '') !== String(selectedBranch)) {
				return false
			}

			if (selectedFilter === 'Paid Amount') {
				return Number(invoice?.paid_amount || 0) > 0
			}

			if (selectedFilter === 'Due Amount') {
				return Number(invoice?.net_amount || 0) - Number(invoice?.paid_amount || 0) > 0
			}

			if (selectedFilter === 'Total Amount') {
				return Number(invoice?.net_amount || 0) > 0
			}

			return true
		})
		.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

	const paginatedInvoiceData = filteredInvoiceData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const totalPages = Math.ceil(filteredInvoiceData.length / pagination.itemsPerPage)
	let sortableFields: any

	selectedFilter
		? (sortableFields = [
				{ title: 'Inv No.', field: 'id' },
				{ title: 'Name', field: 'fullName' },
				...(selectedFilter === 'Paid Amount'
					? [{ title: 'Paid', field: 'paid_amount' }]
					: selectedFilter === 'Due Amount'
					? [{ title: 'Due', field: 'duePayment' }]
					: selectedFilter === 'Total Amount'
					? [{ title: 'Total', field: 'net_amount' }]
					: [{ title: 'Date', field: 'date' }]),
				{ title: 'Date', field: 'date' },
		  ])
		: (sortableFields = [
				{ title: 'Inv No.', field: 'id' },
				{ title: 'Name', field: 'name' },
				{ title: 'Sales', field: 'sales_person' },
				{ title: 'Branch', field: 'branch_name' },
				{ title: 'Paid', field: 'paid_amount' },
				{ title: 'Total', field: 'net_amount' },
				{ title: 'Date', field: 'date' },
		  ])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	// const filteredInvoiceData = invoiceData.filter((invoice: any) =>
	// 	invoice?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
	//   );

	//   const paginatedInvoiceData = filteredInvoiceData.slice(
	// 	(pagination.page - 1) * pagination.itemsPerPage,
	// 	pagination.page * pagination.itemsPerPage
	//   );

	// const downloadExcel = () => {
	// 	const worksheetData = invoiceData.map((invoice: any, index: number) => {
	// 		const products = invoice?.items.map((item: any, i: number) => ({
	// 			[`Product ${i + 1} Name`]: item?.item_name || 'N/A',
	// 			[`Product ${i + 1} Quantity`]: item?.quantity || 'N/A',
	// 			[`Product ${i + 1} Amount`]: item?.amount || 'N/A',
	// 			[`Product ${i + 1} Total Amount`]: item?.totalAmount || 'N/A',
	// 		}))
	// 		return {
	// 			'Invoice No.': invoice?.invoice_number || 'N/A',
	// 			'User Name': invoice?.fullName ? invoice?.fullName : invoice.name || 'N/A',
	// 			Mobile: invoice?.phoneNumber ? invoice?.phoneNumber : invoice?.mobile || 'N/A',
	// 			Email: invoice?.email || 'N/A',
	// 			'Total Amount': invoice?.totalPayment
	// 				? invoice?.totalPayment
	// 				: invoice?.totalPayment || 'N/A',
	// 			'Due Amount': invoice?.paidPayment
	// 				? invoice?.totalPayment - invoice?.paidPayment
	// 				: invoice?.totalPayment - invoice?.paidPayment || 'N/A',
	// 			'Paid Amount': invoice?.paidPayment ? invoice?.paidPayment : invoice?.paidPayment || 'N/A',
	// 			'Purchase Date': invoice?.date || 'N/A',
	// 			...Object.assign({}, ...products),
	// 		}
	// 	})

	// 	const worksheet = XLSX.utils.json_to_sheet(worksheetData)
	// 	const workbook = XLSX.utils.book_new()
	// 	XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
	// 	XLSX.writeFile(workbook, 'InvoiceData.xlsx')
	// }

	const downloadExcel = () => {
		const worksheetData = invoiceData?.map((invoice: any, index: number) => {
			const products = invoice?.items.map((item: any, i: number) => ({
				[`Product Name`]: item?.item_name || 'N/A',
				[`Amount`]: item?.amount || 'N/A',
			}))

			return {
				'Invoice No.': invoice?.invoice_number || 'N/A',
				'User Name': invoice?.fullName ? invoice?.fullName : invoice.name || 'N/A',
				Mobile: invoice?.phoneNumber ? invoice?.phoneNumber : invoice?.mobile || 'N/A',
				Email: invoice?.email || 'N/A',
				'Branch Name': invoice?.branch_name || 'N/A',
				'Sales Person': getSalesPersonDisplayName(invoice),
				...Object.assign({}, ...products),
				'Paid Amount': invoice?.paid_amount ? invoice?.paid_amount : invoice?.paid_amount || 'N/A',
				'Purchase Date': invoice?.date || 'N/A',
				Notes: invoice?.note || 'N/A',
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

	return (
		<>
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
						title={dataInsight?.total_paid_amount ?? '0/-'}
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
						title={dataInsight?.total_unpaid_amount ?? '0/-'}
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
						title={dataInsight?.total_amount ?? '0/-'}
						description='Total Amount'
					/>
				</div>
			</div>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='w-100'>
						<div className='d-flex align-items-center gap-3 flex-wrap'>
							<div className='d-flex align-items-center position-relative'>
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
							<div>
								<LengthMenu
									expenseData={filteredInvoiceData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
							<div className='w-200px'>
								<select
									name='branch_name'
									value={selectedBranch || ''}
									onChange={(e) => setSelectedBranch(e.target.value || null)}
									className='form-select inputfield-bg'>
									<option value=''>Select Branch</option>
									<option value='Adajan'>Adajan</option>
									<option value='Vesu'>Vesu</option>
									<option value='Katargam'>Katargam</option>
								</select>
							</div>
							<div className='w-200px'>
								<div className='selectfield-bg mb-0'>
									<select
										name='sales_person'
										value={selectedSalesPerson}
										onChange={(e) => setSelectedSalesPerson(e.target.value)}
										className='form-select inputfield-bg'>
										<option value='All'>All Sales Person</option>
										{employees.map((emp: any) => (
											<option
												key={emp._id}
												value={emp._id ?? emp.employee_id}>
												{emp.full_name}
											</option>
										))}
									</select>
								</div>
							</div>
							<div className='w-250px'>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={paginatedInvoiceData}
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
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.invoice_number}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{item?.fullName ? item?.fullName : item.name}
													</span>
													<span className='text-muted fw-semibold text-muted d-flex fs-7'>
														{item?.phoneNumber ? item?.phoneNumber : item?.mobile}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{getSalesPersonDisplayName(item)}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.branch_name || '-'}
											</span>
										</td>
										{selectedFilter ? (
											selectedFilter == 'Paid Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.paid_amount ? item?.paid_amount : '-'}
													</span>
												</td>
											) : selectedFilter == 'Due Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount ? item.net_amount - item.paid_amount : '-'}
													</span>
												</td>
											) : selectedFilter == 'Total Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount ? item?.net_amount : '-'}
													</span>
												</td>
											) : (
												''
											)
										) : (
											<>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.paid_amount ? item?.paid_amount : '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount ? item?.net_amount : '-'}
													</span>
												</td>
											</>
										)}

										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(item.date).format('YYYY-MM-DD')}
											</span>
										</td>
										<td>
											{item?.fullName ? (
												<TableButton
													action='edit'
													to={`/fgiit/invoice/fwg-update?invoice_id=` + item._id}
												/>
											) : (
												<TableButton
													action='edit'
													to={`/fgiit/invoice/update?invoice_id=` + item._id}
												/>
											)}
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	item.profile_image
																		? `https://files.fggroup.in/${item.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{item.name}</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{item?.mobile || ''}
															</span>
														</div>
													</div>
													<br />
													{getSalesPersonDisplayName(item)}
													<br />
													<strong>{sortableFields[1].title}:</strong> {item.paid_amount}
													<br />
													<strong>{sortableFields[2].title}:</strong> {item.net_amount}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{DayJS(item.date).format('YYYY-MM-DD')}
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

export default TotalSalesListFgiit
