/* eslint-disable jsx-a11y/anchor-is-valid */
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import { GetAllocation, RemoveAllocation, UpdateAllocation } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const AllocateExam: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const exam_id: any = searchParams.get('allocate_id')
	const examTitle: any = searchParams.get('exam_title')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [examData, setExamData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>('')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [sort, setSort] = useState('updatedAt')
	const [updateShow, setUpdateShow] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [updateData, setUpdateData] = useState({
		start_time: '',
		_id: '',
	})
	const isFirstRender = useRef(true);

	const fetchData = async (page?: number) => {
		try {
			const skip = (pagination.page - 1) * pagination.itemsPerPage
			const response = await GetAllocation({
				exam_id: exam_id,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				...(searchTerm && {search_user: searchTerm}),
				sort,
				sortOrder,
				// skip: skip,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			const filteredData: any = response.data
			setExamData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}
	const sortableFields = [
		{ title: 'Name', field: 'first_name' },
		{ title: 'Mobile', field: 'mobile' },
		{ title: 'Email', field: 'email' },
		{ title: 'Exam Time', field: 'createdAt' },
	]

	const removeUserFromExam = (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
		}).then((result) => {
			if (result.isConfirmed) {
				const payload: any = {
					exam_id: exam_id,
					allocation_id: id,
				}

				RemoveAllocation(payload)
					.then(() => {
						Swal.fire('Success!', `Remove User remove from exam!.`, 'success')
						fetchData()
					})
					.catch((error) => {
						Swal.fire('Error!', 'There was an error updating the status.', 'error')
						console.error(error)
					})
			}
		})
	}

	const showModal = (data: any) => {
		setUpdateData(data)
		setUpdateShow(true)
	}

	const handleUpdateData = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				exam_id: exam_id,
				attendees: { _id: updateData._id, start_time: updateData.start_time },
			}
			await UpdateAllocation(payload)
			toast.success('Feature Update Successfully')
			setIsSubmitting(false)
			setUpdateShow(false)
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Students User Details</PageTitle>
			<KTCard className='pb-5'>
				<div className='card-header border-0 pt-6 mx-5 p-0'>
					<div className='d-flex justify-content-between p-2'>
						<InputField
							placeholder='Exam Title'
							type='text'
							className='w-100 fv-row'
							name='examTitle'
							label='Exam Title'
							htmlFor='examTitle'
							value={examTitle}
							onChange={handleInputUpdateChange}
							disabled
							marginRemove={true}
						/>
					</div>
				</div>
				<div className='card-header border-0 pt-6 mx-5 p-0'>
					<div className='d-flex justify-content-between p-2'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<LengthMenu
							expenseData={examData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar px-md-2'>
						<TableButton
							action='view'
							to={`/fgiit/exam-question?exam_id=${exam_id}`}
							text='View Exam'
							backgroundDark={true}
						/>
						<TableButton
							action='add'
							to={'/fgiit/allocate-exam-add?exam_id=' + exam_id}
							text='Add User'
						/>
					</div>
				</div>
				<div className='card-body py-4'>
					<table
						id='kt_table_users'
						className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
						<TableSort
							sortableFields={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
						/>
						<tbody>
							{examData.map((data: any, index: any) => {
								const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
								return (
									<tr key={data.id}>
										<td className='text-center'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.user.first_name} {data.user.last_name}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.user.mobile}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.user.email}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(data.start_time || data.updatedAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											{data?.attempt_information?.is_completed ? (
												<TableButton
													action='view'
													text='Result'
													to={`/fgiit/exam-result?exam_id=${data.exam_id}&allocation_id=${data._id}`}
												/>
											) : (
												<>
													<TableButton
														action='edit'
														onClick={() => showModal(data)}
													/>
												</>
											)}
											<TableButton
												action='remove'
												onClick={() => removeUserFromExam(data._id)}
											/>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
				{examData.length === 0 && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
						<b>No records found</b>
					</div>
				)}
				<div className='me-3'>
					<UsersListPagination
						totalPages={metaData?.totalPages}
						currentPage={pagination.page}
						onPageChange={handlePageChange}
					/>
				</div>
			</KTCard>
			<Modal
				centered
				show={updateShow}
				onHide={() => setUpdateShow(false)}>
				<div className='modal-header justify-content-between'>
					<h2 className='fw-bolder'>Allocation Time</h2>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => setUpdateShow(false)}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y'>
					<div className='mb-3'>
						<InputField
							placeholder='Date and time'
							type='datetime-local'
							className='mb-7 w-100 fv-row'
							name='start_time'
							label='Date and time'
							htmlFor='start_time'
							value={DayJS(updateData.start_time).format('YYYY-MM-DDTHH:mm')}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='edit'
							onClick={handleUpdateData}
							text={isSubmitting ? 'Please wait, Updating' : 'Update'}
							showIcon={false}
							disabled={isSubmitting}
							backgroundDark={true}
							className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default AllocateExam
