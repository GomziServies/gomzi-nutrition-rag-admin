import { faBriefcase, faCircleDollarToSlot, faDumbbell, faHeadset, faUtensils } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetExercisePlan, GetExpenses, GetInvoiceStats } from '../../../Functions/FWG'
import { FWGListsWidget1 } from './FWGListsWidget1'
import { FWGListsWidget4 } from './FWGListsWidget4'
import { FWGMixedWidget8 } from './FWGMixedWidget8'

const DashboardWrapper = () => {
	const [invoiceData, setInvoiceData] = useState<any>([])
	const [expenseData, setExpenseData] = useState<any>([])
	const [exercisePlan, setExercisePlan] = useState<number>(0)
	const [fwgSubAdminShow, setFwgSubAdminShow] = useState('')

	const fetchInvoiceData = async () => {
		try {
			const response: any = await GetInvoiceStats()
			setInvoiceData(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchExpenseData = async () => {
		try {
			const response: any = await GetExpenses()
			setExpenseData(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchExercisePlan = async () => {
		try {
			const response: any = await GetExercisePlan()
			setExercisePlan(response.data.length)
		} catch (error: any) {
			console.error(error)
		}
	}

	// Calculate sums
	const totalAmount = invoiceData.reduce(
		(sum: any, invoice: any) => sum + parseFloat(invoice.total_net_amount),
		0
	)

	const totalPaidAmount = invoiceData.reduce(
		(sum: any, invoice: any) => sum + parseFloat(invoice.total_paid_amount),
		0
	)

	const totalExpenseAmount = invoiceData.reduce(
		(sum: number, invoice: any) => sum + parseFloat(invoice.total_due_amount),
		0
	)

	// Format the total amounts with commas
	const formattedTotalAmount = { totalAmount, totalPaidAmount, totalExpenseAmount }

	useEffect(() => {
		const portalAdminLogin = localStorage.getItem('fwg_portal')
		if (portalAdminLogin === 'fwg_portal') {
			setFwgSubAdminShow(portalAdminLogin)
		}
		fetchInvoiceData()
		fetchExpenseData()
		fetchExercisePlan()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Dashboard</PageTitle>
			<div className='row g-5 g-xl-5'>
				<div className='col-lg-4'>
					<FWGListsWidget1
						formattedTotalAmount={formattedTotalAmount}
						exercisePlan={exercisePlan}
					/>
				</div>

				<div className='col-md-4'>
					<FWGMixedWidget8
						className='card'
						chartColor='primary'
						chartHeight='150px'
					/>
				</div>
				{fwgSubAdminShow === 'fwg_portal' ? (
					<></>
				) : (
					<div className='col-md-4'>
						<FWGListsWidget4
							className='card'
							chartColor='info'
							chartHeight='150px'
						/>
					</div>
				)}

				<div className='col-lg-4'>
					<div className='card mb-xl-8'>
						<div>
							<div className='card-header border-0 pt-5'>
								<h3 className='card-title align-items-start flex-column'>
									<span className='card-label fw-bold text-dark'>Feature & plan</span>
								</h3>
							</div>

							<div className='card-body pt-5'>
								<Link to='/fwg/features'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faBriefcase}
													className='text-primary fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Features</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/plan-bundle-list'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faBriefcase}
													className='text-primary fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Plan Bundle</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/membership-plan'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faBriefcase}
													className='text-primary fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Membership Plan</div>
											</div>
										</div>
									</div>
								</Link>

								<div className='card-header border-0 p-0'>
									<h3 className='card-title align-items-start flex-column'>
										<span className='card-label fw-bold text-dark'>Complaint Assistant</span>
									</h3>
								</div>

								<Link to='/fwg/complaint-assistant-fwg'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faHeadset}
													className='text-primary fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Complaint Assistant</div>
											</div>
										</div>
									</div>
								</Link>
							</div>
						</div>
					</div>
				</div>

				<div className='col-lg-4'>
					<div className='card mb-xl-8'>
						<div>
							<div className='card-header border-0 pt-5'>
								<h3 className='card-title align-items-start flex-column'>
									<span className='card-label fw-bold text-dark'>General Diet</span>
								</h3>
							</div>

							<div className='card-body pt-5'>
								<Link to='/fwg/food-details'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faUtensils}
													className='text-info fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Food</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/food-time'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faUtensils}
													className='text-info fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Food Time</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/food-category'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faUtensils}
													className='text-info fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Food Category</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/food-bundle'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faUtensils}
													className='text-info fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Food Bundle</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/diet-details'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faUtensils}
													className='text-info fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Diet</div>
											</div>
										</div>
									</div>
								</Link>
							</div>
						</div>
					</div>
				</div>

				<div className='col-lg-4'>
					<div className='card mb-xl-8'>
						<div>
							<div className='card-header border-0 pt-5'>
								<h3 className='card-title align-items-start flex-column'>
									<span className='card-label fw-bold text-dark'>General Exercise</span>
								</h3>
							</div>

							<div className='card-body pt-5'>
								<Link to='/fwg/exercise-details'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faDumbbell}
													className='text-primary fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Exercise</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/exercise-bundle'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faDumbbell}
													className='text-primary fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Exercise Bundle</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/exercise-plan'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faDumbbell}
													className='text-primary fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Exercise Plan</div>
											</div>
										</div>
									</div>
								</Link>

								<Link to='/fwg/exercise-approve'>
									<div className='d-flex align-items-sm-center mb-7'>
										<div className='symbol symbol-50px me-5'>
											<span className='symbol-label'>
												<FontAwesomeIcon
													icon={faDumbbell}
													className='text-primary fs-3'
												/>
											</span>
										</div>
										<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
											<div className='flex-grow-1 me-2'>
												<div className='text-gray-800  fs-6 fw-bold'>Exercise Approve</div>
											</div>
										</div>
									</div>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { DashboardWrapper }
