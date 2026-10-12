/* eslint-disable jsx-a11y/anchor-is-valid */
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import { CreateBatch, GetStudentBatches } from '../../../Functions/FGGroup'

const StudentBatch: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [userData, setUserData] = useState<any>([])
	const [showModal, setShowModal] = useState(false)
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [metaData, setMetaData] = useState<any>()
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [batchData, setBatchData] = useState<any>({})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetStudentBatches({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			setUserData(response.data)

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true)

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

	const addBatch = async () => {
		try {
			const response = await CreateBatch({
				batch_name: batchData.batch_name,
				batch_start_date: DayJS(batchData.batch_start_date).format('YYYY/MM/DD'),
				batch_end_date: DayJS(batchData.batch_end_date).format('YYYY/MM/DD'),
			})
			setUserData([...userData, response.data])
			setBatchData({})
			setShowModal(false)
			toast.success('Batch added successfully!')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleInputChange = (event: any) => {
		const { name, value } = event.target
		setBatchData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Batch Name', field: 'batch_name' },
		{ title: 'Start Date', field: 'batch_start_date' },
		{ title: 'End Date', field: 'batch_end_date' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Students User Details</PageTitle>
			<KTCard className='pb-5'>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<LengthMenu
							expenseData={userData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							onClick={() => setShowModal(true)}
							text='Add Batch'
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
								userData.map((user: any, index: any) => (
									<tr key={user.id}>
										<td>
											<span className='text-dark fw-bold ms-6  d-block mb-1 fs-6'>{index + 1}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{user.batch_name}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{user.batch_start_date ? DayJS(user.batch_start_date).format('DD/MM/YYYY') : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{user.batch_end_date ? DayJS(user.batch_end_date).format('DD/MM/YYYY') : '-'}
											</span>
										</td>
										<td className='text-center'>
											<TableButton
												action='view'
												to={`/fgiit/student-batch-add?batch_id=${user._id}`}
											/>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				{userData.length === 0 && !loading && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
						<b>No records found</b>
					</div>
				)}
				{!loading && (
					<UsersListPagination
						totalPages={metaData?.totalPages}
						currentPage={pagination.page}
						onPageChange={handlePageChange}
					/>
				)}
			</KTCard>

			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Student Batch View</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<InputField
							placeholder='Batch Name'
							type='text'
							className='fv-row mb-7'
							name='batch_name'
							label='Batch Name'
							htmlFor='batch_name'
							value={batchData.batch_name}
							onChange={handleInputChange}
						/>
					</div>
					<div className='modal-body scroll-y'>
						<InputField
							placeholder='Start Date'
							type='date'
							className='fv-row mb-7'
							name='batch_start_date'
							label='Start Date'
							htmlFor='batch_start_date'
							value={batchData.batch_start_date}
							onChange={handleInputChange}
						/>
					</div>
					<div className='modal-body scroll-y'>
						<InputField
							placeholder='End Date'
							type='date'
							className='fv-row mb-7'
							name='batch_end_date'
							label='End Date'
							htmlFor='batch_end_date'
							value={batchData.batch_end_date}
							onChange={handleInputChange}
						/>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='add'
							onClick={addBatch}
							text='Add'
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default StudentBatch
