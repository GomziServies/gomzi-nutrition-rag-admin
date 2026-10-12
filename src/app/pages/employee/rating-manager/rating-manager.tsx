import { faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import { GetEmployeeRating } from '../../../Functions/FGGroup/Employee'
import { Charts1 } from '../../hr/reports/Charts1'

const EmployeeRatingManager: React.FC = () => {
	const [rattingData, setRattingData] = useState<any>({})
	const [loading, setLoading] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const fetchRatingData = async () => {
		setLoading(true)
		const employeeData: any = localStorage.getItem('fg_group_info')
		const employee = JSON.parse(employeeData)

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
			const response = await GetEmployeeRating({
				admin_id: employee._id,
				from_date: startDate,
				to_date: endDate,
			})
			let data: any = response.data
			setRattingData(data[0])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchRatingData()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Rating</PageTitle>
			<div
				className='accordion card'
				id='kt_accordion_1'>
				<KTCard className='accordion-item'>
					<h2
						className='accordion-header'
						id='kt_accordion_1_header_1'>
						<div className='col-md-4'>
							<button
								className='accordion-button fs-2 fw-bold collapsed'
								type='button'
								data-bs-toggle='collapse'
								data-bs-target='#kt_accordion_1_body_1'
								aria-expanded='false'
								aria-controls='kt_accordion_1_body_1'>
								Rating Manager
							</button>
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
					</h2>
					<div
						id='kt_accordion_1_body_1'
						className='accordion-collapse collapse show'
						aria-labelledby='kt_accordion_1_header_1'
						data-bs-parent='#kt_accordion_1'>
						{Object.keys(rattingData || {}).length === 0 && !loading ? (
							<div className='d-flex text-center w-100 my-5 mb-7 align-content-center justify-content-center mt-5'>
								<b>No records found</b>
							</div>
						) : loading ? (
							<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
								<div
									className='spinner-border text-primary'
									role='status'>
									<span className='visually-hidden'>Loading...</span>
								</div>
							</div>
						) : (
							<div className='px-5 mb-5'>
								<div className='row pb-5 border-bottom justify-content-between align-items-center'>
									<div className='col-md-10 fv-row mb-2 d-flex flex-column'>
										<div className='row mt-6'>
											<div className='col-12 mt-3'>
												<b className='fs-4'>Rating : </b>
												{rattingData?.rating > 0 ? (
													Array.from({ length: rattingData.rating }).map((_, i) => (
														<FontAwesomeIcon
															key={i}
															icon={faStar}
															className='fs-2 text-warning'
															id='rating'
														/>
													))
												) : (
													<span className='ms-3'>
														<b>No rating found</b>
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
								<div className='row justify-content-center'>
									<div className='col-11 d-flex row'></div>
									<div className='col-md-5'>
										<div className='row'>
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
													placeholder='Pending Task'
													type='text'
													className='col-12 fv-row'
													name='ebook_id'
													label='Pending Task :'
													htmlFor='ebook_id'
													value={`${
														parseInt(rattingData?.total_task) -
														parseInt(rattingData?.completed_task)
													}`}
													disabled
												/>
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
							</div>
						)}
					</div>
				</KTCard>
			</div>
		</>
	)
}

export default EmployeeRatingManager
