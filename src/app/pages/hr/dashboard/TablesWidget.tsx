/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react'
import TableButton from '../../../components/TableButton'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import errorImg from './fixed-404.jpg'

type Props = {
	className: string
}

const TablesWidget: React.FC<Props> = ({ className }) => {
	const [employeeData, setEmployeeData] = useState<any>([])
	const [loading, setLoading] = useState(false)

	const fetchEmployeeData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetEmployees()
			const filteredData: any = response.data.map((item: any) => ({
				_id: item._id,
				name: item.full_name,
				position: item.employee.position,
				salary: item.employee.salary,
				account_detail: item.employee.account_details,
				email: item.email,
				photo: item.employee.photo,
				address: item.employee.address,
				mobile: item.mobile,
				account_details: item.employee.account_details,
			}))
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
			emp.email?.toLowerCase().includes(q) ||
			emp.mobile?.toString().includes(q)
		)
	})

	return (
		<div className={`card ${className}`}>
			{/* Header */}
			<div className='card-header border-0 pt-5 pb-3 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
				<div className='d-flex align-items-center gap-3'>
					<span
						className='symbol symbol-40px'
						style={{
							background: '#eff6ff',
							color: '#2563eb',
							borderRadius: '10px',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '18px',
						}}>
						<i className='bi bi-person-lines-fill'></i>
					</span>
					<div>
						<div className='d-flex align-items-center gap-2'>
							<h3 className='card-title fw-bold fs-4 m-0 text-dark'>Employee Directory</h3>
							<span className='badge badge-light-primary fw-bold fs-8 px-2 py-1'>
								{employeeData.length} Staff
							</span>
						</div>
						<span className='text-muted fw-semibold fs-7'>
							Active team members, roles & contact details
						</span>
					</div>
				</div>

				<div className='gz-table-search-bar'>
					<i className='bi bi-search gz-table-search-icon'></i>
					<input
						type='text'
						className='gz-table-search-input'
						placeholder='Search by name, role, email...'
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
								<th className='min-w-160px'>Role / Designation</th>
								<th className='min-w-200px'>Email Address</th>
								<th className='min-w-80px text-end pe-2'>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[1, 2, 3, 4, 5].map((i) => (
									<tr key={`skel-dir-${i}`}>
										<td className='ps-2'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '18px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='gz-hr-skeleton symbol symbol-40px symbol-circle me-3'></div>
												<div className='d-flex flex-column gap-1'>
													<span className='gz-hr-skeleton d-inline-block' style={{ width: '130px', height: '14px', borderRadius: '4px' }}></span>
													<span className='gz-hr-skeleton d-inline-block' style={{ width: '90px', height: '11px', borderRadius: '4px' }}></span>
												</div>
											</div>
										</td>
										<td>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '100px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '140px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td className='text-end pe-2'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '32px', height: '32px', borderRadius: '6px' }}></span>
										</td>
									</tr>
								))
							) : filteredEmployees.length > 0 ? (
								filteredEmployees.map((employee: any, index: number) => (
									<tr key={employee._id || index} className='hover-elevate-up'>
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
														{employee.mobile || '-'}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-semibold fs-7'>
												{employee.position || 'Staff'}
											</span>
										</td>
										<td>
											<span className='text-muted fw-semibold fs-7'>
												{employee.email || '-'}
											</span>
										</td>
										<td className='text-end pe-2'>
											<TableButton
												action='view'
												to={`/hr/employee-detail?employee_id=${employee._id}`}
											/>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5} className='text-center py-10'>
										<div className='text-muted fs-7'>
											<i className='bi bi-info-circle me-1'></i>
											{searchTerm ? 'No matching employees found' : 'No employee records found'}
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

export { TablesWidget }
