import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	AddCommission,
	GetCommissions,
	UpdateCommission,
} from '../../../Functions/FGGroup/AccountFunctions'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'

interface Commission {
	_id: string
	branch: string
	sales_person_id: {
		_id: string
		full_name: string
	}
	amount: number
	type: string
	date: string
	createdAt: string
}

const formatDateTime = (dateString?: string) => {
	if (!dateString) return 'N/A'

	return new Date(dateString).toLocaleString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	})
}

const getDefaultDateRange = (): [Date, Date] => {
	const today = new Date()
	return [
		new Date(today.getFullYear(), today.getMonth(), 1),
		new Date(today.getFullYear(), today.getMonth() + 1, 0),
	]
}

const CommissionPage: React.FC = () => {
	const [showForm, setShowForm] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [viewData, setViewData] = useState<Commission | null>(null)
	const [showViewModal, setShowViewModal] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)
	const [salesPersons, setSalesPersons] = useState<any[]>([])
	const [filteredSalesPersons, setFilteredSalesPersons] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)

	const [commissions, setCommissions] = useState<Commission[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [total, setTotal] = useState(0)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(
		getDefaultDateRange()
	)
	const [formData, setFormData] = useState({
		branch: '',
		salesPersonId: '',
		amount: '',
		type: '',
	})

	// Helpers to extract id and name from various API shapes
	const getEmpId = (emp: any) =>
		emp?.employee_id || emp?.employee?._id || emp?._id || emp?.id || emp?.user_id || ''
	const getEmpName = (emp: any) => {
		return (
			emp?.full_name ||
			emp?.employee?.full_name ||
			emp?.employee?.user?.full_name ||
			emp?.user?.full_name ||
			emp?.name ||
			[emp?.first_name, emp?.last_name].filter(Boolean).join(' ') ||
			emp?.employee?.name ||
			emp?.profile?.full_name ||
			'' ||
			''
		)
	}

	// Determine allowed IDs based on hostname (mirrors fgiit-total-sales.tsx approach)
	const getAllowedIds = () => {
		const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
		let ALLOWED_IDS: string[] = []
		if (hostname === 'admin.fggroup.in') {
			ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d']
		} else if (hostname === 'admin-dev.fggroup.in') {
			ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d']
		} else {
			ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d']
		}
		return ALLOWED_IDS
	}

	const getBranchLabel = (branch?: string) => {
		switch (branch) {
			case 'FG Group':
				return 'FGIIT'
			case 'Gomzi Nutrition':
				return 'Gomzi Life Sciences'
			default:
				return branch || 'N/A'
		}
	}

	useEffect(() => {
		const alwaysIncludeIds = getAllowedIds()
		if (formData.branch) {
			const filtered = salesPersons.filter((emp: any) => {
				const branch = (emp.employee?.branch_name || '').toLowerCase()
				const selectedBranch = formData.branch.toLowerCase()

				// Handle specific branch name mappings if necessary
				if (selectedBranch === 'fg group' && (branch === 'fg group' || branch === 'fgiit'))
					return true
				if (selectedBranch === 'gomzi nutrition' && branch === 'gomzi nutrition') return true
				if (selectedBranch === 'fwg' && branch === 'fwg') return true

				return branch === selectedBranch
			})

			// Ensure the two specific employee IDs are always present (match by possible id fields)
			const alwaysIncluded = salesPersons.filter((emp: any) =>
				alwaysIncludeIds.includes(getEmpId(emp))
			)

			let merged = [
				...filtered,
				...alwaysIncluded.filter((a) => !filtered.some((f) => getEmpId(f) === getEmpId(a))),
			]

			// If some alwaysIncludeIds are still missing, add placeholders so they appear in the dropdown
			const presentIds = new Set(merged.map((m: any) => getEmpId(m)))
			const missingIds = alwaysIncludeIds.filter((id) => !presentIds.has(id))
			if (missingIds.length > 0) {
				merged = merged.concat(
					missingIds.map((id) => ({
						employee_id: id,
						__optId: id,
						__optName: `(Employee ${id})`,
					}))
				)
			}

			// Normalize merged items to include consistent id/name accessors
			const normalized = merged.map((emp: any) => ({
				...emp,
				__optId: getEmpId(emp),
				__optName: getEmpName(emp),
			}))

			setFilteredSalesPersons(normalized)
		} else {
			setFilteredSalesPersons([])
		}
	}, [formData.branch, salesPersons])

	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [sort, setSort] = useState('date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
	const [selectedType, setSelectedType] = useState<string | null>(null)

	const handleSearchTermChange: React.Dispatch<React.SetStateAction<string>> = (value) => {
		setSearchTerm(value)
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const buildCommissionParams = (page: number, limit: number) => ({
		page,
		limit,
		...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
		...(selectedBranch ? { branch: selectedBranch } : {}),
		...(selectedType ? { type: selectedType } : {}),
		...(selectedDateRange
			? {
					from_date: selectedDateRange[0].toISOString(),
					to_date: selectedDateRange[1].toISOString(),
			  }
			: {}),
		sort,
		sortOrder,
	})

	const fetchSalesPersons = async () => {
		try {
			const response: any = await GetEmployees({ limit: 1000 })
			if (response.data) {
				const mapped = response.data.map((emp: any) => ({
					...emp,
					employee_id: getEmpId(emp),
					full_name: getEmpName(emp),
				}))
				setSalesPersons(mapped)
			}
		} catch (error) {
			console.error('Error fetching sales persons:', error)
		}
	}

	const fetchCommissions = async () => {
		setLoading(true)
		try {
			const pageSize = 100
			const firstResponse: any = await GetCommissions(buildCommissionParams(1, pageSize))
			const paginationMeta = firstResponse?.metadata?.pagination || {}
			const totalPages = Number(paginationMeta.totalPages || 1)
			let allRows = Array.isArray(firstResponse.data) ? [...firstResponse.data] : []

			for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
				const nextResponse: any = await GetCommissions(buildCommissionParams(currentPage, pageSize))
				if (Array.isArray(nextResponse.data)) {
					allRows = allRows.concat(nextResponse.data)
				}
			}

			setCommissions(allRows)
			setTotal(paginationMeta.total || 0)
		} catch (error) {
			console.error('Error fetching commissions:', error)
			toast.error('Failed to load commissions')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchSalesPersons()
	}, [])

	useEffect(() => {
		fetchCommissions()
	}, [searchTerm, selectedBranch, selectedType, selectedDateRange, sort, sortOrder])

	// Reset pagination to page 1 when any filter changes
	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [selectedBranch, selectedType, selectedDateRange])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}, [searchTerm])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.branch || !formData.salesPersonId || !formData.amount || !formData.type) {
			toast.error('Please fill all fields')
			return
		}

		try {
			const payload = {
				branch: formData.branch,
				sales_person_id: formData.salesPersonId,
				amount: Number(formData.amount),
				type: formData.type,
			}

			let response: any
			if (isEditing && editId) {
				response = await UpdateCommission({ ...payload, id: editId })
			} else {
				response = await AddCommission(payload)
			}

			if (response.status === 200) {
				toast.success(
					isEditing ? 'Commission updated successfully' : 'Commission added successfully'
				)
				fetchCommissions()
				setFormData({ branch: '', salesPersonId: '', amount: '', type: '' })
				setShowForm(false)
				setIsEditing(false)
				setEditId(null)
			} else {
				toast.error(response.message || 'Action failed')
			}
		} catch (error) {
			console.error('Error submitting commission:', error)
			toast.error('Something went wrong')
		}
	}

	const handleEdit = (com: Commission) => {
		setFormData({
			branch: com.branch,
			salesPersonId: com.sales_person_id?._id || '',
			amount: com.amount.toString(),
			type: com.type,
		})
		setEditId(com._id)
		setIsEditing(true)
		setShowForm(true)
	}

	const handleView = (com: Commission) => {
		setViewData(com)
		setShowViewModal(true)
	}

	const downloadExcel = async () => {
		setExporting(true)
		try {
			const pageSize = 100
			const firstResponse: any = await GetCommissions(buildCommissionParams(1, pageSize))
			const paginationMeta = firstResponse?.metadata?.pagination || {}
			const totalPages = Number(paginationMeta.totalPages || 1)
			let allRows = Array.isArray(firstResponse.data) ? [...firstResponse.data] : []

			for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
				const nextResponse: any = await GetCommissions(buildCommissionParams(currentPage, pageSize))
				if (Array.isArray(nextResponse.data)) {
					allRows = allRows.concat(nextResponse.data)
				}
			}

			const worksheetData = allRows.map((item: Commission) => ({
				Brand: getBranchLabel(item.branch),
				'Sales Person': item.sales_person_id?.full_name || 'N/A',
				Type: item.type || 'N/A',
				Amount: item.amount ?? 'N/A',
				Date: formatDateTime(item.createdAt),
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Commissions')
			XLSX.writeFile(workbook, 'CommissionData.xlsx')
		} catch (error) {
			console.error('Error exporting commissions:', error)
			toast.error('Failed to export commissions')
		} finally {
			setExporting(false)
		}
	}

	const columns = [
		{ title: 'Brand', field: 'branch' },
		{ title: 'Sales Person', field: 'salesPerson' },
		{ title: 'Type', field: 'type' },
		{ title: 'Amount', field: 'amount' },
		{ title: 'Date', field: 'date' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Create Commission</PageTitle>

			<div className='d-flex flex-column gap-5'>
				<div className='d-flex justify-content-end'></div>

				{showForm && (
					<KTCard>
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 mb-1'>
									{isEditing ? 'Edit Commission' : 'Add New Commission'}
								</span>
							</h3>
						</div>
						<div className='card-body py-3'>
							<form
								onSubmit={handleSubmit}
								className='row g-3'>
								<div className='col-md-3'>
									<SelectField
										className='col-12'
										name='branch'
										label='Brand'
										htmlFor='branch'
										value={formData.branch}
										onChange={handleInputChange}
										options={[
											{ label: 'FGIIT', value: 'FG Group' },
											{ label: 'FWG', value: 'FWG' },
											{ label: 'Gomzi Life Sciences', value: 'Gomzi Nutrition' },
										]}
									/>
								</div>
								<div className='col-md-3'>
									<SelectField
										className='col-12'
										name='salesPersonId'
										label='Sales Person'
										htmlFor='salesPersonId'
										value={formData.salesPersonId}
										onChange={handleInputChange}
										options={filteredSalesPersons.map((emp) => ({
											label: emp.__optName || emp.full_name || emp.employee?.full_name || 'Unknown',
											value:
												emp.__optId ||
												emp.employee_id ||
												emp.employee?._id ||
												emp._id ||
												emp.id ||
												'',
										}))}
									/>
								</div>
								<div className='col-md-3'>
									<SelectField
										className='col-12'
										name='type'
										label='Type'
										htmlFor='type'
										value={formData.type}
										onChange={handleInputChange}
										options={['Commission', 'Bonus']}
									/>
								</div>
								<div className='col-md-3'>
									<InputField
										className='col-12'
										name='amount'
										label='Amount'
										htmlFor='amount'
										type='number'
										placeholder='Enter Amount'
										value={formData.amount}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-12 d-flex justify-content-end mt-4'>
									<button
										type='submit'
										className='btn btn-success'>
										{isEditing ? 'Update' : 'Submit'}
									</button>
								</div>
							</form>
						</div>
					</KTCard>
				)}

				<KTCard>
					<div className='card-header border-0 pt-5 d-flex align-items-center'>
						<div style={{ marginLeft: 'auto' }}>
							<button
								className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
								onClick={() => {
									setShowForm(!showForm)
									if (showForm) {
										setIsEditing(false)
										setEditId(null)
										setFormData({ branch: '', salesPersonId: '', amount: '', type: '' })
									}
								}}>
								{showForm ? 'Cancel' : 'Create Commission'}
							</button>
						</div>
						<div className='card-toolbar'>
							<div className='d-flex align-items-center gap-3 flex-wrap'>
								<div className='d-flex align-items-center position-relative my-1'>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={setSearchTerm}
									/>
								</div>
								<div className='ms-0'>
									<button
										className='btn btn-primary btn-icon'
										onClick={downloadExcel}
										disabled={loading || exporting}>
										<FontAwesomeIcon
											icon={faDownload}
											className='fs-3'
										/>
									</button>
								</div>
								<div>
									<LengthMenu
										expenseData={commissions}
										handleItemsPerPageChange={handleItemsPerPageChange}
									/>
								</div>
								<div className='w-200px'>
									<select
										name='branch_filter'
										value={selectedBranch || ''}
										onChange={(e) => {
											setSelectedBranch(e.target.value || null)
										}}
										className='form-select inputfield-bg'>
										<option value=''>Select Brand</option>
										<option value='FG Group'>FGIIT</option>
										<option value='FWG'>FWG</option>
										<option value='Gomzi Nutrition'>Gomzi Life Sciences</option>
									</select>
								</div>
								<div className='w-200px'>
									<select
										name='type_filter'
										value={selectedType || ''}
										onChange={(e) => {
											setSelectedType(e.target.value || null)
										}}
										className='form-select inputfield-bg'>
										<option value=''>Select Type</option>
										<option value='Commission'>Commission</option>
										<option value='Bonus'>Bonus</option>
									</select>
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
					<div className='card-body py-3'>
						{(() => {
							const getSortValue = (item: any, field: string) => {
								switch (field) {
									case 'branch':
										return item.branch || ''
									case 'salesPerson':
										return item.sales_person_id?.full_name || ''
									case 'type':
										return item.type || ''
									case 'amount':
										return Number(item.amount || 0)
									case 'date':
										return new Date(item.createdAt).getTime()
									default:
										return ''
								}
							}

							const filteredCommissions = commissions
								.filter((item) => {
									if (selectedBranch && item.branch !== selectedBranch) return false
									if (selectedType && item.type !== selectedType) return false
									if (selectedDateRange) {
										const itemDate = new Date(item.createdAt)
										const [startDate, endDate] = selectedDateRange
										if (itemDate < startDate || itemDate > endDate) return false
									}
									return true
								})
								.sort((a: any, b: any) => {
									const aValue = getSortValue(a, sort)
									const bValue = getSortValue(b, sort)

									if (typeof aValue === 'string') {
										return sortOrder === 'desc'
											? bValue.localeCompare(aValue)
											: aValue.localeCompare(bValue)
									} else {
										return sortOrder === 'desc'
											? (bValue as number) - (aValue as number)
											: (aValue as number) - (bValue as number)
									}
								})

							const paginatedData = filteredCommissions.slice(
								(pagination.page - 1) * pagination.itemsPerPage,
								pagination.page * pagination.itemsPerPage
							)

							const totalPages = Math.ceil(filteredCommissions.length / pagination.itemsPerPage)

							return (
								<>
									<div className='table-responsive'>
										<Table
											data={paginatedData}
											columns={columns}
											sort={sort}
											sortOrder={sortOrder}
											onSortChange={(field, order) => {
												setSort(field)
												setSortOrder(order)
											}}
											loading={loading}
											pagination={pagination}
											setPagination={setPagination}
											visibleDetails={null}
											renderRow={(item, index, actualIndex) => (
												<tr key={item._id}>
													<td className='text-center ps-4'>{actualIndex}</td>
													<td>
														<span className='text-dark fw-bold d-block fs-6'>
															{getBranchLabel(item.branch)}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold text-hover-primary fs-6'>
															{item.sales_person_id?.full_name || 'N/A'}
														</span>
													</td>
													<td>
														<span className='text-muted fw-bold d-block fs-6'>{item.type}</span>
													</td>
													<td>
														<span className='fw-bold d-block fs-6 text-success'>
															₹{item.amount}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold d-block fs-6'>
															{formatDateTime(item.createdAt)}
														</span>
													</td>
													<td className='text-start ps-4'>
														<TableButton
															action='view'
															onClick={() => handleView(item)}
														/>
														<TableButton
															action='edit'
															onClick={() => handleEdit(item)}
														/>
													</td>
												</tr>
											)}
										/>
									</div>
									{filteredCommissions.length > 0 && (
										<UsersListPagination
											totalPages={totalPages}
											currentPage={pagination.page}
											onPageChange={(page) => setPagination({ ...pagination, page })}
										/>
									)}
									{filteredCommissions.length === 0 && !loading && (
										<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
											<b>No records found</b>
										</div>
									)}
								</>
							)
						})()}
					</div>
				</KTCard>
			</div>

			<Modal
				show={showViewModal}
				onHide={() => setShowViewModal(false)}
				centered
				size='lg'>
				<Modal.Header closeButton>
					<Modal.Title>Commission Details</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{viewData && (
						<div className='row g-5'>
							<div className='col-md-6'>
								<label className='fw-bold text-muted d-block'>Date</label>
								<span className='fw-bolder fs-5 text-dark'>
									{formatDateTime(viewData.createdAt)}
								</span>
							</div>
							<div className='col-md-6'>
								<label className='fw-bold text-muted d-block'>Brand</label>
								<span className='fw-bolder fs-5 text-dark'>{getBranchLabel(viewData.branch)}</span>
							</div>
							<div className='col-md-6'>
								<label className='fw-bold text-muted d-block'>Sales Person</label>
								<span className='fw-bolder fs-5 text-dark'>
									{viewData.sales_person_id?.full_name || 'N/A'}
								</span>
							</div>
							<div className='col-md-6'>
								<label className='fw-bold text-muted d-block'>Type</label>
								<span className='fw-bolder fs-5 text-dark'>{viewData.type}</span>
							</div>
							<div className='col-md-6'>
								<label className='fw-bold text-muted d-block'>Amount</label>
								<span className='fw-bolder fs-5 text-success'>₹{viewData.amount}</span>
							</div>
						</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					<button
						className='btn btn-secondary'
						onClick={() => setShowViewModal(false)}>
						Close
					</button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default CommissionPage
