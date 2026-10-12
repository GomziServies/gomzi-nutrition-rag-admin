import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetFranchise, UpdateFranchise } from '../../../Functions/FGGroup'
import TableButton from '../../../components/TableButton'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const FranchiseList: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [franchiseData, setFranchiseData] = useState([])
	const [updateShow, setUpdateShow] = useState(false)
	const [updateData, setUpdateData] = useState({
		_id: '',
		branch_code: '',
		franchise_name: '',
	})
	const [loading, setLoading] = useState(false);

	const fetchData = async () => {
		setLoading(true);
		try {
			const franchise: any = await GetFranchise()
			setFranchiseData(franchise.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false);
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handleUpdateData = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				franchise_id: updateData._id,
				franchise_name: updateData.franchise_name,
				branch_code: updateData.branch_code,
			}
			await UpdateFranchise(payload)
			toast.success('Franchise details Update Successfully')
			setUpdateShow(false)

			setUpdateData({
				_id: '',
				franchise_name: '',
				branch_code: '',
			})

			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
		fetchData()
	}

	const handleSetData = (data: any) => {
		setUpdateShow(true)
		setUpdateData(data)
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredFeaturesData = franchiseData.filter(
		(franchiseData: any) =>
			franchiseData.franchise_name &&
			franchiseData.franchise_name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedFeaturesData = filteredFeaturesData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Franchise List</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-branch_code'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
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
									<th>Franchise Name</th>
									<th>Branch Code</th>
									<th>CreatedAt</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{loading ? (
									<tr>
										<td colSpan={5} className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div className="spinner-border text-primary" role="status">
													<span className="visually-hidden">Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									paginatedFeaturesData.map((data: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1;
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark ms-6 fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.franchise_name}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.branch_code}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
													</span>
												</td>
												<td>
													<TableButton
														action="edit"
														onClick={() => handleSetData(data)}
													/>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
					{franchiseData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{franchiseData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(franchiseData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard >

			<Modal
				centered
				show={updateShow}
				onHide={() => setUpdateShow(false)}>
				<div className='modal-header pb-0 border-0 justify-content-end'>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => setUpdateShow(false)}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y mx-3 pt-0 pb-5'>
					<div className='text-center mb-13'>
						<h2 className='mb-3'>Edit Franchise</h2>
					</div>
					<div>
						<div className='mb-5'>
							<InputField
								placeholder='Enter Franchise Name'
								type='text'
								className='mb-7 w-100 fv-row'
								name='franchise_name'
								label='Enter Franchise Name'
								htmlFor='franchise_name'
								value={updateData.franchise_name}
								onChange={handleInputUpdateChange}
							/>
						</div>
						<div className=''>
							<InputField
								placeholder='Enter Branch Code'
								type='text'
								className='w-100 fv-row'
								name='branch_code'
								label='Enter Branch Code'
								htmlFor='branch_code'
								value={updateData.branch_code}
								onChange={handleInputUpdateChange}
							/>
						</div>
					</div>
				</div>
				<div className='modal-footer justify-content-end'>
					<TableButton
						action="edit"
						onClick={handleUpdateData}
						text={isSubmitting ? 'Please wait, Updating...' : 'Update'}
						showIcon={false}
						disabled={isSubmitting}
						backgroundDark={true}
						className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
					/>
				</div>
			</Modal>
		</>
	)
}

export default FranchiseList
