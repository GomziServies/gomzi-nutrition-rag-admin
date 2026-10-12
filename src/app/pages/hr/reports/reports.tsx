import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { GetEmployeeRating, GetEmployees } from '../../../Functions/FGGroup/Employee'
import { Charts1 } from './Charts1'

const HRReports: React.FC = () => {
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
	const [employeeData, setEmployeeData] = useState<any>([{ name: '', id: '' }])
	const [loading, setLoading] = useState(false)

	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_id: any = searchParams.get('employee_id')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const fetchEmployeeData = async (page?: number) => {
		try {
			const response = await GetEmployees()
			const filteredData: any = response.data
			setEmployeeData(
				filteredData.map((el: any) => ({
					name: el?.full_name,
					id: el?._id,
					position: el?.employee?.position,
				}))
			)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [])

	const [rattingData, setRattingData] = useState<any>([])
	const fetchRattingData = async () => {
		setLoading(true)
		try {
			let startDate: any
			let endDate: any

			if (selectedDateRange) {
				startDate = new Date(selectedDateRange[0])
				startDate.setHours(0, 0, 0, 0)

				endDate = new Date(selectedDateRange[1])
				endDate.setHours(23, 59, 59, 999)
			} else {
				const now = new Date()
				// Get of This month
				// startDate = new Date(now.getFullYear(), now.getMonth(), 1)
				// endDate = new Date()

				// Get of last month
				startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
				endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
			}

			if (selectedEmployee) {
				const response = await GetEmployeeRating({
					admin_id: selectedEmployee.id,
					from_date: startDate,
					to_date: endDate,
				})
				const data: any = response.data
				setRattingData(data)
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchRattingData()
	}, [selectedEmployee, selectedDateRange])

	const handleEmployeeSelect = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		if (event.target instanceof HTMLSelectElement) {
			const selectedName = event.target.value

			if (selectedName === 'Select Employee') {
				setSelectedEmployee(null)
			} else {
				const selectedEmployeeObj = employeeData.find((el: any) => el.name === selectedName)
				setSelectedEmployee(selectedEmployeeObj)
			}
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Task Report</PageTitle>
			<KTCard className='p-5'>
				<div className='row justify-content-between'>
					<div className='col-md-4'>
						<h2>Task Report</h2>
					</div>
					<div className='col-md-4'>
						<div className='fv-row'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								leftValue='-270px'
								lastMonth={true}
							/>
						</div>
					</div>
					<div className='col-md-4'>
						<div className='fv-row'>
							<SelectField
								className='fv-row m-0'
								label='Select Employee'
								name='employee'
								showLabel={false}
								value={selectedEmployee?.name}
								onChange={handleEmployeeSelect}
								htmlFor='employee'
								options={employeeData.map((el: any) => el.name)}
							/>
						</div>
					</div>
				</div>
				<div className=''>
					<div className='pb-5'>
						{loading ? (
							<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
								<div
									className='spinner-border text-primary'
									role='status'>
									<span className='visually-hidden'>Loading...</span>
								</div>
							</div>
						) : (
							<>
								{selectedEmployee ? (
									rattingData ? (
										<div className='row justify-content-center'>
											<div className='col-md-5 mb-5'>
												<div className='row'>
													<div className='col-md-12 fv-row'>
														<InputField
															placeholder='Position'
															type='text'
															className='col-12 fv-row'
															name='name'
															label='Name :'
															htmlFor='name'
															value={selectedEmployee?.name}
															disabled
														/>
													</div>
													{/* <div className='col-md-12 fv-row'>
														<InputField
															placeholder='Position'
															type='text'
															className='col-12 fv-row'
															name='position'
															label='Position :'
															htmlFor='position'
															value={selectedEmployee?.position}
															disabled
														/>
													</div> */}
													<div className='col-md-12 fv-row'>
														<InputField
															placeholder='Total Task'
															type='text'
															className='col-12 fv-row'
															name='ebook_id'
															label='Total Task :'
															htmlFor='ebook_id'
															value={rattingData?.total_task}
															disabled
														/>
													</div>
													<div className='col-md-12 fv-row'>
														<InputField
															placeholder='Completed Task'
															type='text'
															className='col-12 fv-row'
															name='ebook_id'
															label='Completed Task :'
															htmlFor='ebook_id'
															value={rattingData?.completed_task}
															disabled
														/>
													</div>
													<div className='col-md-12 fv-row'>
														<InputField
															placeholder='Completed Task'
															type='text'
															className='col-12 fv-row'
															name='late_completed'
															label='Late Completed Task :'
															htmlFor='late_completed'
															value={rattingData?.late_completed}
															disabled
														/>
													</div>
													<div className='col-md-12 fv-row'>
														<InputField
															placeholder='Pending Task'
															type='text'
															className='col-12 fv-row'
															name='ebook_id'
															label='Pending Task :'
															htmlFor='ebook_id'
															value={`${
																parseInt(rattingData?.pending_task)
															}`}
															disabled
														/>
													</div>
													<div className='col-md-12 fv-row'>
														<label htmlFor='rating'>
															<b>Rating : </b>
														</label>
														{rattingData?.rating > 0 ? (
															<span>{' ' + rattingData.rating + '%'}</span>
														) : (
															<span className='ms-3'>
																<b>No rating found</b>
															</span>
														)}
													</div>
												</div>
											</div>

											<div className='col-md-7 d-flex justify-content-center align-items-center'>
												<Charts1
													rattingData={rattingData}
													className=' mb-xl-8'
												/>
											</div>
										</div>
									) : (
										<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
											<b>No Data found</b>
										</div>
									)
								) : (
									<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
										<h2>Select Employee</h2>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</KTCard>
		</>
	)
}

export default HRReports
