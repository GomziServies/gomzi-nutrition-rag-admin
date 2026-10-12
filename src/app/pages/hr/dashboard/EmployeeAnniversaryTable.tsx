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
		
		// Create anniversary date for current year
		const anniversaryThisYear = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate())
		
		// If anniversary has passed this year, set to next year
		const nextAnniversary = anniversaryThisYear < today ? 
			new Date(today.getFullYear() + 1, joinDate.getMonth(), joinDate.getDate()) : 
			anniversaryThisYear
		
		// Calculate difference in days
		const diffTime = nextAnniversary.getTime() - today.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		
		return diffDays
	}

	return (
		<div
			className={`card ${className}`}
			style={{ height: '524px' }}>
			{/* Enhanced Header */}
			<div className='card-header border-0 pt-5'>
				<div className='d-flex align-items-start flex-column'>
					<h3 className='card-label fw-bold fs-2 mb-1'>All Employees - Work Anniversaries</h3>
					<span className='text-muted fw-semibold fs-7'>Upcoming Work Anniversaries</span>
				</div>
			</div>

			<div
				className='card-body py-3'
				style={{ maxHeight: '430px', overflowY: 'auto' }}>
				<div className='table-responsive'>
					<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
						<thead>
							<tr className='fw-bold text-muted'>
								<th className='ps-4 min-w-50px rounded-start'>No.</th>
								<th className='min-w-200px'>Employee</th>
								<th className='min-w-120px'>Position</th>
								<th className='min-w-120px'>Joining Date</th>
								<th className='min-w-150px text-center'>Years Served</th>
								<th className='min-w-120px text-center'>Anniversary In</th>
								<th className='min-w-100px text-end rounded-end'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td
										colSpan={7}
										className='text-center'>
										<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
											<div
												className='spinner-border text-primary'
												role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</div>
									</td>
								</tr>
							) : employeeData.length > 0 ? (
								employeeData.map((employee: any, index: number) => (
									<tr
										key={employee._id}
										className='hover-elevate-up'>
										<td className='ps-4'>
											<div className='form-check form-check-sm form-check-custom form-check-solid'>
												<span className='text-dark fw-bold fs-6'>{index + 1}</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={`https://files.fggroup.in/${employee.photo}`}
														alt={employee.name}
														onError={(e) => {
															const target = e.target as HTMLImageElement
															target.src = 'https://via.placeholder.com/150' // fallback image
														}}
														className='rounded-circle'
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold fs-6'>{employee.name}</span>
													<span className='text-muted fw-semibold d-block fs-7'>
														{employee.mobile}
													</span>
												</div>
											</div>
										</td>
										<td>
											<div className='text-dark fw-bold d-block fs-6'>{employee.position}</div>
										</td>
										<td>
											<div className='text-dark fw-bold d-block fs-6'>
												{DayJS(employee.joining_date).format('DD MMM YYYY')}
											</div>
										</td>
										<td className='text-center'>
											<span className='badge badge-light-info fs-7 fw-semibold'>
												{employee.years_of_service}{' '}
												{employee.years_of_service === 1 ? 'Year' : 'Years'}
											</span>
										</td>
										<td className='text-center'>
											<div className='d-flex flex-column align-items-center'>
												<span
													className={getBadgeClass(
														employee.joining_date,
														employee.has_upcoming_anniversary
													)}>
													{employee.has_upcoming_anniversary
														? daysUntilAnniversary(employee.joining_date)
														: `${getDaysUntilNextAnniversary(employee.joining_date)} days`}
												</span>
												{!employee.is_anniversary_today && employee.has_upcoming_anniversary && (
													<small className='text-muted mt-1'>
														Completing{' '}
														{getNextAnniversaryYear(
															employee.joining_date,
															employee.years_of_service
														)}{' '}
														years
													</small>
												)}
											</div>
										</td>
										<td className='text-end'>
											<TableButton
												action='view'
												to={`/hr/employee-view?employee_id=${employee._id}`}
											/>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={7}
										className='text-center'>
										<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center mt-5'>
											<div className='symbol symbol-100px mb-5'>
												<KTIcon
													iconName='crown'
													className='fs-5x text-muted opacity-50'
												/>
											</div>
											<h4 className='text-muted'>No employees found</h4>
											<p className='text-muted fs-6'>There are no employees in the system</p>
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