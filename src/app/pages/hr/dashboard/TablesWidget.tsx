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

	return (
		<div
			className={`card ${className}`}
			style={{ height: '524px' }}>
			<div className='card-header border-0 pt-5'>
				<h3 className='card-title align-items-start flex-column'>
					<span className='card-label fw-bold fs-3 mb-1'>Employee Statistics</span>
					<span className='text-muted mt-1 fw-semibold fs-7'>Employee</span>
				</h3>
			</div>

			<div
				className='card-body py-3'
				style={{ maxHeight: '430px', overflowY: 'auto' }}>
				<div className='table-responsive'>
					<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
						<thead>
							<tr className='fw-bold text-muted'>
								<th>No.</th>
								<th>Name</th>
								<th>Role</th>
								<th>Email</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td
										colSpan={12}
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
							) : (
								employeeData.map((employee: any, index: any) => (
									<tr key={index}>
										<td>
											<div className='form-check form-check-sm form-check-custom form-check-solid'>
												{index + 1}
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={`https://files.fggroup.in/` + employee.photo}
														alt={employee.name}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{employee.name}
													</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{employee.mobile}
													</span>
												</div>
											</div>
										</td>
										<td>
											<div className='text-dark fw-bold  d-block fs-6'>
												{employee.position}
											</div>
										</td>
										<td>
											<div className='text-dark fw-bold  d-block fs-6'>
												{employee.email}
											</div>
										</td>
										<td>
											<TableButton
												action='view'
												to={`/hr/employee-detail?employee_id=${employee._id}`}
											/>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				{employeeData.length === 0 && !loading && (
					<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center mt-5'>
						<div>
							<img
								src={errorImg}
								alt='demo'
								width='50%'
							/>
						</div>
						<h5>No records found</h5>
					</div>
				)}
			</div>
		</div>
	)
}

export { TablesWidget }
