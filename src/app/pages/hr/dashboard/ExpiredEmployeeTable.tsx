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

return (
		<div
			className={`card ${className}`}
			style={{ height: '524px' }}>
			<div className='card-header border-0 pt-5'>
				<div className='d-flex align-items-start flex-column'>
					<h3 className='card-label fw-bold fs-2 mb-1'>Employee Documents</h3>
					<span className='text-muted fw-semibold fs-7'>HR Agreement / Joining Letter per employee</span>
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
								<th className='min-w-150px'>Document</th>
								<th className='min-w-150px'>Joining Date</th>
								<th className='min-w-150px'>Expire In</th>
								<th className='min-w-100px text-end rounded-end'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={6} className='text-center'>
										<div className='d-flex justify-content-center align-items-center my-10'>
											<div className='spinner-border text-primary' role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</div>
									</td>
								</tr>
							) : employeeData.length > 0 ? (
								employeeData.map((employee: any, index: number) => (
									<tr key={employee._id} className='hover-elevate-up'>
										<td className='ps-4'>
											<span className='text-dark fw-bold mb-1 fs-6'>{index + 1}</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													{employee.photo ? (
														<img
															src={`https://files.fggroup.in/${employee.photo}`}
															alt={employee.name}
															className='rounded-circle'
														/>
													) : (
														<div className='symbol-label fs-3 bg-light-primary text-primary fw-bold'>
															{employee.name.charAt(0)}
														</div>
													)}
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold text-hover-primary fs-6'>
														{employee.name}
													</span>
													<span className='text-muted fw-semibold d-block fs-7'>{employee.mobile}</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>
												{employee.position}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>
												{employee.document_type}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>
												{employee.joining_date ? DayJS(employee.joining_date).format('DD MMM YYYY') : '-'}
											</span>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-dark fw-bold fs-6'>
													{DayJS(employee.expiry_date).format('DD MMM YYYY')}
												</span>
												<span className={`fw-bold fs-7 ${employee.is_expired ? 'text-danger' : 'text-primary'}`}>
													{employee.days_diff < 0 
														? `${Math.abs(employee.days_diff)} Days Expired` 
														: `${employee.days_diff} days`}
												</span>
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
									<td colSpan={6} className='text-center py-10'>
										<div className='text-muted fs-6 fw-semibold'>No expired documents found</div>
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
