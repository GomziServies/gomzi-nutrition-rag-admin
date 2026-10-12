import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SelectField from '../../../components/SelectField'
import UsersListPagination from '../../../components/TablePagination'
import {
	AssignFranchise,
	GetAssignedMembershipPlan,
	GetAssignFranchise,
	GetUser,
	WithdrawFranchise,
} from '../../../Functions/FWG'
import TableButton from '../../../components/TableButton'

const FranchiseUser: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [salesData, setSalesData] = useState<any[]>([])
	const [assignData, setAssignData] = useState<any>({})
	const [planData, setPlanData] = useState<any>({})
	const [show, setShow] = useState(false)
	const [assignPlanIdData, setAssignPlanIdData] = useState<any>('')
	const [assignOptionData, setAssignOptionData] = useState<any[]>([{ name: '', user_id: '' }])
	const [loading, setLoading] = useState(false)
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const franchise_id: any = searchParams.get('franchise_id')

	const fetchData = async () => {
		setLoading(true)
		try {
			const franchiseResponse: any = await GetAssignedMembershipPlan({ franchise_id })
			setPlanData(franchiseResponse.data[0])
			setAssignPlanIdData(franchiseResponse.data[0]._id)

			const userResponse: any = await GetUser()
			setAssignOptionData(
				userResponse.data.map((el: any) => ({
					name: el.firstName + ' ' + el.lastName,
					user_id: el._id,
				}))
			)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchAssignData = async () => {
		setLoading(true)
		try {
			const responseData: any = await GetAssignFranchise()
			const filteredData = responseData.data.filter((item: any) => {
				return item.franchise_assign_plan.some((data: any) => data.franchise_id === franchise_id)
			})

			setSalesData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
		fetchAssignData()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		if (name === 'user_id') {
			const selectedUser = assignOptionData.find((option) => option?.name === value)
			setAssignData((prevData: any) => ({
				...prevData,
				[name]: selectedUser?.user_id || '',
			}))
		} else {
			setAssignData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleAddFranchise = async () => {
		const payload = {
			user_id: assignData.user_id,
			franchise_assign_plan_id: assignPlanIdData,
		}

		try {
			await AssignFranchise(payload)
			fetchAssignData()
			setShow(false)
			toast.success('Franchise assigned successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error('Error assigning franchise:', error)
		}
	}

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredSalesData = salesData.filter((sale: any) =>
		sale?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedSalesData = filteredSalesData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleDeleteFeature = async (_id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await WithdrawFranchise({ user_assign_franchise_id: _id })
					toast.success('Franchise Deleted Successfully')
					fetchAssignData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Franchise Details</PageTitle>
			<div className='card mt-10 pt-5'>
				<div className='card-header border-0'>
					<div className='card-title'>
						<div className='d-flex align-items-center position-relative my-1'>
							<KTIcon
								iconName='magnifier'
								className='fs-1 position-absolute ms-6'
							/>
							<input
								type='text'
								data-kt-user-table-filter='search'
								className='form-control form-control-solid w-250px ps-14'
								placeholder='Search user'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action="assign"
							text="Assign"
							backgroundDark={true}
							onClick={() => setShow(true)}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Name</th>
									<th>Plan</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
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
									paginatedSalesData.map((data: any, index: any) => (
										<tr key={index}>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{index + 1}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.user?.firstName + ' ' + data?.user?.lastName}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data?.franchise_assign_plan[0]?.membership_plan?.name}
												</span>
											</td>
											<td>
												<TableButton
													action="remove"
													text="Withdraw"
													onClick={() => handleDeleteFeature(data._id)}
												/>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
					{salesData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{salesData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(salesData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
			<Modal
				centered
				show={show}
				onHide={() => setShow(false)}
				className='modal'>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							onClick={() => setShow(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'
							data-bs-dismiss='modal'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y mx-3 pt-0 pb-15'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Assign Franchise</h2>
						</div>
						<div className='mb-10'>
							<label
								htmlFor='dfsf'
								className='fw-bold fs-6 mb-2'>
								Franchise:{' '}
								{planData?.franchise_user?.firstName + ' ' + planData?.franchise_user?.lastName}
							</label>
						</div>
						<div className='mb-7'>
							<SelectField
								className='col-12 fv-row mb-7'
								label='Membership Plan'
								name='franchise_assign_plan_id'
								value={assignData.membership_plan}
								onChange={handleInputChange}
								htmlFor='Type'
								options={['Premium']}
							/>
						</div>
						<div className='mb-7'>
							<SelectField
								className='col-12 fv-row mb-7'
								label='Users'
								name='user_id'
								value={assignData.user}
								onChange={handleInputChange}
								htmlFor='Type'
								options={assignOptionData.map((option) => option?.name)}
							/>
						</div>
						<div className='mt-7 text-end'>
							<button
								type='button'
								className='btn btn-success'
								onClick={handleAddFranchise}>
								Add
							</button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default FranchiseUser
