import React, { useEffect, useState } from 'react'
import TableButton from '../../../components/TableButton'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { KTIcon } from '../../../../_metronic/helpers'

type Props = {
	className: string
}

const ExpiredEmployeeTable: React.FC<Props> = ({ className }) => {
	const [employeeData, setEmployeeData] = useState<any>([])
	const [loading, setLoading] = useState(false)

	const fetchEmployeeData = async () => {
		setLoading(true)
		try {
			const response: any = await GetEmployees()
			const today = DayJS().startOf('day')
			
			const filteredData: any = response.data
				.filter((item: any) => {
					if (!item.employee || !item.employee.document || !item.employee.document.length) return false
					return item.employee.document.some((doc: any) => doc.expiry_date)
				})
				.map((item: any) => {
					const documents = item.employee.document || []
					
					// Prioritize HR Agreement over Joining Letter
					let selectedDoc = documents.find((doc: any) => 
						doc.document_type.toLowerCase().includes('agreement') || 
						doc.document_type.toLowerCase().includes('aggriment')
					)
					
					if (!selectedDoc) {
						selectedDoc = documents.find((doc: any) => 
							doc.document_type.toLowerCase().includes('joining letter')
						)
					}
					
					// If neither specifically found, take the one with earliest expiry
					if (!selectedDoc) {
						const docsWithExpiry = documents
							.filter((doc: any) => doc.expiry_date)
							.sort((a: any, b: any) => DayJS(a.expiry_date).diff(DayJS(b.expiry_date)))
						selectedDoc = docsWithExpiry[0]
					}
					
					if (!selectedDoc) return null;

					const expiryMoment = DayJS(selectedDoc.expiry_date).startOf('day')
					const diffDays = expiryMoment.diff(today, 'day')
					
					return {
						_id: item._id,
						name: item.full_name,
						position: item.employee.position,
						joining_date: selectedDoc.joining_date || item.employee.joining_date,
						expiry_date: selectedDoc.expiry_date,
						document_type: selectedDoc.document_type,
						email: item.email,
						photo: item.employee.photo,
						mobile: item.mobile,
						days_diff: diffDays,
						is_expired: diffDays < 0,
					}
				})
				.filter((item: any) => item !== null)
				// Re-applied the 30-day filter or show all based on user request?
				// User's photo shows "2026-03-23" which is today/tomorrow.
				// I'll keep showing all that have an expiry date for now as the screenshot shows many.
			
			// Sort by most expired first
			filteredData.sort((a: any, b: any) => a.days_diff - b.days_diff)
			
			setEmployeeData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [])

	const [searchTerm, setSearchTerm] = useState('')

	const filteredEmployees = employeeData.filter((emp: any) => {
		if (!searchTerm) return true
		const q = searchTerm.toLowerCase()
		return (
			emp.name?.toLowerCase().includes(q) ||
			emp.position?.toLowerCase().includes(q) ||
			emp.document_type?.toLowerCase().includes(q) ||
			emp.mobile?.toString().includes(q)
		)
	})

	const getDocStatusBadge = (daysDiff: number) => {
		if (daysDiff < 0) {
			return (
				<span className='badge badge-light-danger fw-bold fs-8 px-2 py-1'>
					Expired ({Math.abs(daysDiff)}d ago)
				</span>
			)
		}
		if (daysDiff === 0) {
			return <span className='badge badge-light-danger fw-bold fs-8 px-2 py-1'>Expires Today</span>
		}
		if (daysDiff <= 7) {
			return (
				<span className='badge badge-light-warning fw-bold fs-8 px-2 py-1'>
					Expires in {daysDiff}d
				</span>
			)
		}
		if (daysDiff <= 30) {
			return (
				<span className='badge badge-light-primary fw-bold fs-8 px-2 py-1'>
					Expires in {daysDiff}d
				</span>
			)
		}
		return (
			<span className='badge badge-light fw-bold fs-8 px-2 py-1 text-muted'>
				{daysDiff} days left
			</span>
		)
	}

	return (
		<div className={`card ${className}`}>
			{/* Header */}
			<div className='card-header border-0 pt-5 pb-3 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
				<div className='d-flex align-items-center gap-3'>
					<span
						className='symbol symbol-40px'
						style={{
							background: '#fee2e2',
							color: '#dc2626',
							borderRadius: '10px',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '18px',
						}}>
						<i className='bi bi-file-earmark-text-fill'></i>
					</span>
					<div>
						<div className='d-flex align-items-center gap-2'>
							<h3 className='card-title fw-bold fs-4 m-0 text-dark'>Agreement Expiries</h3>
							<span className='badge badge-light-danger fw-bold fs-8 px-2 py-1'>
								{employeeData.length} Records
							</span>
						</div>
						<span className='text-muted fw-semibold fs-7'>
							Employment agreements, contracts & joining documentation status
						</span>
					</div>
				</div>

				<div className='gz-table-search-bar'>
					<i className='bi bi-search gz-table-search-icon'></i>
					<input
						type='text'
						className='gz-table-search-input'
						placeholder='Search employee or document...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							type='button'
							className='gz-table-search-clear'
							onClick={() => setSearchTerm('')}
							title='Clear search'>
							<i className='bi bi-x-lg' style={{ fontSize: '10px' }}></i>
						</button>
					)}
				</div>
			</div>

			{/* Body */}
			<div
				className='card-body py-2 px-6'
				style={{ maxHeight: '500px', overflowY: 'auto' }}>
				<div className='table-responsive'>
					<table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
						<thead>
							<tr className='fw-bolder text-muted text-uppercase fs-8 border-bottom border-gray-200'>
								<th className='ps-2 min-w-40px'>#</th>
								<th className='min-w-220px'>Employee</th>
								<th className='min-w-140px'>Position</th>
								<th className='min-w-160px'>Document Type</th>
								<th className='min-w-120px'>Expiry Date</th>
								<th className='min-w-150px text-center'>Status</th>
								<th className='min-w-80px text-end pe-2'>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[1, 2, 3, 4, 5].map((i) => (
									<tr key={`skel-exp-${i}`}>
										<td className='ps-2'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '18px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='gz-hr-skeleton symbol symbol-40px symbol-circle me-3'></div>
												<div className='d-flex flex-column gap-1'>
													<span className='gz-hr-skeleton d-inline-block' style={{ width: '120px', height: '14px', borderRadius: '4px' }}></span>
													<span className='gz-hr-skeleton d-inline-block' style={{ width: '85px', height: '11px', borderRadius: '4px' }}></span>
												</div>
											</div>
										</td>
										<td>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '90px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '110px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '95px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td className='text-center'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '100px', height: '22px', borderRadius: '6px' }}></span>
										</td>
										<td className='text-end pe-2'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '32px', height: '32px', borderRadius: '6px' }}></span>
										</td>
									</tr>
								))
							) : filteredEmployees.length > 0 ? (
								filteredEmployees.map((employee: any, index: number) => (
									<tr key={employee._id} className='hover-elevate-up'>
										<td className='ps-2'>
											<span className='text-muted fw-semibold fs-7'>{index + 1}</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-40px me-3'>
													{employee.photo ? (
														<img
															src={`https://files.fggroup.in/${employee.photo}`}
															alt={employee.name}
															onError={(e) => {
																const target = e.target as HTMLImageElement
																target.style.display = 'none'
															}}
															className='rounded-circle object-fit-cover'
														/>
													) : (
														<span className='symbol-label bg-light-primary text-primary fw-bold fs-6 rounded-circle'>
															{employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
														</span>
													)}
												</div>
												<div className='d-flex flex-column'>
													<span className='text-dark fw-bold text-hover-primary fs-6 mb-0'>
														{employee.name}
													</span>
													<span className='text-muted fs-8 fw-semibold'>
														{employee.mobile || employee.email || '-'}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-semibold fs-7'>
												{employee.position || 'Employee'}
											</span>
										</td>
										<td>
											<span className='badge badge-light fw-bold fs-8 px-2 py-1 text-gray-700'>
												{employee.document_type || 'Document'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-semibold fs-7'>
												{employee.expiry_date ? DayJS(employee.expiry_date).format('DD MMM YYYY') : '-'}
											</span>
										</td>
										<td className='text-center'>
											{getDocStatusBadge(employee.days_diff)}
										</td>
										<td className='text-end pe-2'>
											<TableButton
												action='view'
												to={`/hr/employee-view?employee_id=${employee._id}`}
											/>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={7} className='text-center py-10'>
										<div className='text-muted fs-7'>
											<i className='bi bi-info-circle me-1'></i>
											{searchTerm ? 'No matching documents found' : 'No expired or expiring documents found'}
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

export { ExpiredEmployeeTable }
