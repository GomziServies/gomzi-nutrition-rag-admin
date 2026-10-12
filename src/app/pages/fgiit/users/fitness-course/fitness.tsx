import { faEye, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import UsersListPagination from '../../../../components/TablePagination'
import { AddFood, GetFood, UpdateFood } from '../../../../Functions/FWG'
import TableButton from '../../../../components/TableButton'

const UserFitnessCourses: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')
	const [foodData, setFoodData] = useState<any>([])
	const [isEditMode, setIsEditMode] = useState(false)
	const [editFoodId, setEditFoodId] = useState<string | null>(null)
	const [foodAddData, setFoodAddData] = useState({
		CourseID: '',
		CourseName: '',
		Currency: '',
		Amount: '',
	})

	const [foodtimeData, setFoodTimeData] = useState([
		{
			no: 1,
			FullName: 'Jenil Narola',
			Email: 'jeneelnarola@gmail.com',
			Mobile: '9033886684',
			Date: '26/09/2021 07:43:04 PM',
		},
		{
			no: 2,
			FullName: 'Smit Luvani',
			Email: 'svluvani@gmail.com',
			Mobile: '9999999999',
			Date: '27/09/2021 08:27:21 PM',
		},
		{
			no: 3,
			FullName: 'ABC Name',
			Email: 'drsunera13@gmail.com',
			Mobile: '8866842520',
			Date: '02/10/2021 01:39:49 PM',
		},
		{
			no: 4,
			FullName: 'yash sutariya',
			Email: 'N/A',
			Mobile: '8758742696',
			Date: '21/10/2021 01:33:42 PM',
		},
		{
			no: 5,
			FullName: 'Mr. Jenil Tester',
			Email: 'jenilnarola@gmail.com',
			Mobile: '9033849692',
			Date: '04/11/2021 12:36:35 PM',
		},
	])

	const [selectedSubject, setSelectedSubject] = useState('')
	const [statusChecked, setStatusChecked] = useState(false)

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFoodAddData({ ...foodAddData, [name]: value })
	}

	const fetchData = async () => {
		try {
			const auth: any = await GetFood()
			setFoodData(auth.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const handleAddFood = async () => {
		try {
			const data: any = {
				food_name: foodAddData.CourseID,
				calories: foodAddData.CourseName,
				carbs: foodAddData.Currency,
				protein: foodAddData.Amount,
			}

			if (isEditMode && editFoodId) {
				data.id = editFoodId
				await UpdateFood(data)
				toast.success('Fitness Updated Successfully')
			} else {
				await AddFood(data)
				toast.success('Fitness Added Successfully')
			}

			setFoodAddData({
				CourseID: '',
				CourseName: '',
				Currency: '',
				Amount: '',
			})

			setIsEditMode(false)
			setEditFoodId(null)
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredFoodTimeData = foodtimeData.filter((foodtime) =>
		foodtime.FullName.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedFoodTimeData = filteredFoodTimeData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}
	return (
		<>
			<PageTitle breadcrumbs={[]}>User Diet Prefrence</PageTitle>
			<KTCard>
				<div className='row'>
					<div className='col-12'>
						<div className='d-flex align-items-center justify-content-between mt-5'>
							<div className='ms-5 d-flex'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
							</div>
							<div className='me-5'>
								<LengthMenu
									expenseData={foodtimeData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						</div>
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
									<th>Full Name</th>
									<th>Email</th>
									<th>Mobile</th>
									<th>Date</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody>
								{paginatedFoodTimeData
								.slice()
								.reverse()
								.map((foodtime, index) => (
									<tr key={foodtime.no}>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{index + 1}
											</span>
										</td>
										<td>
											<span
												className='text-dark fw-bold  d-block mb-1 fs-6'
												data-bs-toggle='modal'
												data-bs-target='#kt_modal_food_time'>
												{foodtime.FullName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodtime.Email}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodtime.Mobile}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodtime.Date}
											</span>
										</td>
										<td>
											<TableButton
												action="view"
												to='/fgiit/fitness-view'
												backgroundDark={true}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{foodtimeData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{foodtimeData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(foodtimeData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<div
				className='modal fade'
				id='kt_modal_food_time'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-650px'>
					<div className='modal-content'>
						<div className='modal-header justify-content-between'>
							<h2 className='fw-bolder'>Fitness Plan</h2>
							<div
								className='btn btn-sm btn-icon btn-active-color-primary'
								data-bs-dismiss='modal'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</div>
						</div>
						<div className='modal-body scroll-y'>
							<div className='row'>
								<InputField
									placeholder='Course ID'
									type='text'
									className='col-12 fv-row mb-7'
									name='CourseID'
									label='Course ID [for developer]'
									htmlFor='CourseID'
									value={foodAddData.CourseID}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Course Name'
									type='number'
									className='col-12 fv-row mb-7'
									name='CourseName'
									label='Course Name'
									htmlFor='CourseName'
									value={foodAddData.CourseName}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Currency'
									type='number'
									className='col-12 fv-row mb-7'
									name='Currency'
									label='Currency (Contact developer to change currency)'
									htmlFor='Currency'
									value={foodAddData.Currency}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Amount'
									type='number'
									className='col-12 fv-row mb-7'
									name='Amount'
									label='Amount'
									htmlFor='Amount'
									value={foodAddData.Amount}
									onChange={handleInputChange}
								/>
							</div>
						</div>
						<div className='modal-footer justify-content-end'>
							<TableButton
								action={isEditMode ? 'edit' : 'add'}
								onClick={handleAddFood}
								text={isEditMode ? 'Update' : 'Save Changes'}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export default UserFitnessCourses
