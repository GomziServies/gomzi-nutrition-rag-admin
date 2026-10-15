import React, { useEffect, useState } from 'react'
import TableButton from '../../../components/TableButton'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { KTIcon } from '../../../../_metronic/helpers'

type Props = {
	className: string
}

const EmployeeAnniversaryTable: React.FC<Props> = ({ className }) => {
	const [employeeData, setEmployeeData] = useState<any>([])
	const [loading, setLoading] = useState(false)

	const fetchEmployeeData = async () => {
		setLoading(true)
		try {
			const response: any = await GetEmployees()
			// Remove the filter to show all employees
			const filteredData: any = response.data
				.filter((item: any) => {
					// Filter out employees without joining date
					return item.employee && item.employee.joining_date
				})
				.map((item: any) => {
					// Calculate years of service
					const joiningDate = new Date(item.employee.joining_date)
					const today = new Date()
					
					// Check if anniversary has passed this year
					const anniversaryThisYear = new Date(today.getFullYear(), joiningDate.getMonth(), joiningDate.getDate())
					const hasAnniversaryPassed = anniversaryThisYear <= today
					
					// Calculate years of service
					let yearsOfService = today.getFullYear() - joiningDate.getFullYear()
					if (!hasAnniversaryPassed) {
						yearsOfService -= 1
					}
					
					// Check if anniversary is today
					const isAnniversaryToday = anniversaryThisYear.getDate() === today.getDate() && 
						anniversaryThisYear.getMonth() === today.getMonth() && 
						anniversaryThisYear.getFullYear() === today.getFullYear()
					
					// Calculate next anniversary date
					const nextAnniversary = anniversaryThisYear < today ? 
						new Date(today.getFullYear() + 1, joiningDate.getMonth(), joiningDate.getDate()) : 
						anniversaryThisYear
					
					// Calculate difference in days
					const diffTime = nextAnniversary.getTime() - today.getTime()
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
					
					return {
						_id: item._id,
						name: item.full_name,
						position: item.employee.position,
						joining_date: item.employee.joining_date,
						email: item.email,
						photo: item.employee.photo,
						mobile: item.mobile,
						years_of_service: yearsOfService >= 0 ? yearsOfService : 0,
						is_anniversary_today: isAnniversaryToday,
						days_until_anniversary: diffDays,
						has_upcoming_anniversary: diffDays <= 30 && diffDays >= 0 || isAnniversaryToday
					}
				})
			
			// Sort by upcoming anniversaries first, then by name
			filteredData.sort((a: any, b: any) => {
				// Prioritize employees with upcoming anniversaries (within 30 days or today)
				if (a.has_upcoming_anniversary && !b.has_upcoming_anniversary) return -1
				if (!a.has_upcoming_anniversary && b.has_upcoming_anniversary) return 1
				
				// If both have upcoming anniversaries, sort by days until anniversary (ascending)
				if (a.has_upcoming_anniversary && b.has_upcoming_anniversary) {
					return a.days_until_anniversary - b.days_until_anniversary
				}
				
				// If neither have upcoming anniversaries, sort by days until anniversary (ascending)
				if (!a.has_upcoming_anniversary && !b.has_upcoming_anniversary) {
					return a.days_until_anniversary - b.days_until_anniversary
				}
				
				return 0
			})
			
			setEmployeeData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [])

	// Function to calculate days until anniversary
	const daysUntilAnniversary = (joiningDate: string) => {
		if (!joiningDate) return ''
		
		const joinDate = new Date(joiningDate)
		const today = new Date()
		
		// Create anniversary date for current year
		const anniversaryThisYear = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate())
		
		// If anniversary has passed this year, set to next year
		const nextAnniversary = anniversaryThisYear < today ? 
			new Date(today.getFullYear() + 1, joinDate.getMonth(), joinDate.getDate()) : 
			anniversaryThisYear
		
		// Calculate difference in days
		const diffTime = nextAnniversary.getTime() - today.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		
		// Check if anniversary is today
		const isAnniversaryToday = anniversaryThisYear.getDate() === today.getDate() && 
			anniversaryThisYear.getMonth() === today.getMonth() && 
			anniversaryThisYear.getFullYear() === today.getFullYear()
		
		if (isAnniversaryToday) return 'Today'
		if (diffDays === 1) return 'Tomorrow'
		return `${diffDays} days`
	}
	
	// Function to get badge class based on days until anniversary
	const getBadgeClass = (joiningDate: string, hasUpcomingAnniversary: boolean) => {
		if (!joiningDate) return 'badge badge-light-secondary fs-7 fw-semibold'
		
		// If no upcoming anniversary, show gray badge
		if (!hasUpcomingAnniversary) return 'badge badge-light-primary fs-7 fw-semibold'
		
		const joinDate = new Date(joiningDate)
		const today = new Date()
		
		// Create anniversary date for current year
		const anniversaryThisYear = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate())
		
		// If anniversary has passed this year, set to next year
		const nextAnniversary = anniversaryThisYear < today ? 
			new Date(today.getFullYear() + 1, joinDate.getMonth(), joinDate.getDate()) : 
			anniversaryThisYear
		
		// Calculate difference in days
		const diffTime = nextAnniversary.getTime() - today.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		
		// Check if anniversary is today
		const isAnniversaryToday = anniversaryThisYear.getDate() === today.getDate() && 
			anniversaryThisYear.getMonth() === today.getMonth() && 
			anniversaryThisYear.getFullYear() === today.getFullYear()
		
		// Return badge class based on urgency
		if (isAnniversaryToday) return 'badge badge-light-danger fs-7 fw-semibold' // Today - urgent (red)
		if (diffDays <= 3) return 'badge badge-light-warning fs-7 fw-semibold' // Within 3 days - warning (yellow)
		if (diffDays <= 7) return 'badge badge-light-primary fs-7 fw-semibold' // Within 7 days - info (blue)
		return 'badge badge-light-success fs-7 fw-semibold' // More than 7 days - success (green)
	}
	
	// Function to get the next anniversary year
	const getNextAnniversaryYear = (joiningDate: string, yearsOfService: number) => {
		if (!joiningDate) return ''
		
		const joinDate = new Date(joiningDate)
		const today = new Date()
		
		// Create anniversary date for current year
		const anniversaryThisYear = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate())
		
		// If anniversary has passed this year, they're completing current years + 1
		// Otherwise, they're completing current years
		const hasAnniversaryPassed = anniversaryThisYear <= today
		
		return hasAnniversaryPassed ? yearsOfService + 1 : yearsOfService
	}
	
	// Function to get days until next anniversary for employees without upcoming anniversaries
	const getDaysUntilNextAnniversary = (joiningDate: string) => {
		if (!joiningDate) return ''

		const joinDate = new Date(joiningDate)
		const today = new Date()

		const anniversaryThisYear = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate())
		const nextAnniversary =
			anniversaryThisYear < today
				? new Date(today.getFullYear() + 1, joinDate.getMonth(), joinDate.getDate())
				: anniversaryThisYear

		const diffTime = nextAnniversary.getTime() - today.getTime()
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
	}

	const [searchTerm, setSearchTerm] = useState('')

	const filteredEmployees = employeeData.filter((emp: any) => {
		if (!searchTerm) return true
		const q = searchTerm.toLowerCase()
		return (
			emp.name?.toLowerCase().includes(q) ||
			emp.position?.toLowerCase().includes(q) ||
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
							background: '#fef3c7',
							color: '#d97706',
							borderRadius: '10px',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '18px',
						}}>
						<i className='bi bi-award-fill'></i>
					</span>
					<div>
						<div className='d-flex align-items-center gap-2'>
							<h3 className='card-title fw-bold fs-4 m-0 text-dark'>Work Anniversaries</h3>
							<span className='badge badge-light-warning fw-bold fs-8 px-2 py-1'>
								{employeeData.length} Records
							</span>
						</div>
						<span className='text-muted fw-semibold fs-7'>
							Upcoming milestone celebrations & years served
						</span>
					</div>
				</div>

				<div className='gz-table-search-bar'>
					<i className='bi bi-search gz-table-search-icon'></i>
					<input
						type='text'
						className='gz-table-search-input'
						placeholder='Search employee or role...'
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
								<th className='min-w-120px'>Joining Date</th>
								<th className='min-w-120px text-center'>Tenure</th>
								<th className='min-w-140px text-center'>Milestone In</th>
								<th className='min-w-80px text-end pe-2'>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[1, 2, 3, 4, 5].map((i) => (
									<tr key={`skel-ann-${i}`}>
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
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '95px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td className='text-center'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '60px', height: '22px', borderRadius: '6px' }}></span>
										</td>
										<td className='text-center'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '75px', height: '22px', borderRadius: '6px' }}></span>
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
											<span className='text-dark fw-semibold fs-7'>
												{DayJS(employee.joining_date).format('DD MMM YYYY')}
											</span>
										</td>
										<td className='text-center'>
											<span className='badge badge-light-primary fw-bold fs-8 px-2 py-1'>
												{employee.years_of_service}{' '}
												{employee.years_of_service === 1 ? 'Year' : 'Years'}
											</span>
										</td>
										<td className='text-center'>
											<div className='d-flex flex-column align-items-center gap-1'>
												<span className={getBadgeClass(employee.joining_date, employee.has_upcoming_anniversary)}>
													{employee.is_anniversary_today ? (
														<span>🎉 Today!</span>
													) : employee.has_upcoming_anniversary ? (
														daysUntilAnniversary(employee.joining_date)
													) : (
														`${getDaysUntilNextAnniversary(employee.joining_date)} days`
													)}
												</span>
												{!employee.is_anniversary_today && employee.has_upcoming_anniversary && (
													<span className='text-muted fs-9 fw-semibold'>
														Completing {getNextAnniversaryYear(employee.joining_date, employee.years_of_service)} years
													</span>
												)}
											</div>
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

export { EmployeeAnniversaryTable }