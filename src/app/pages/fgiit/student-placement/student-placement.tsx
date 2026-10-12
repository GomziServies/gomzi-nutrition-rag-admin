import { faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	GetPlacementRequest,
	SchedulePlacementInterview,
} from '../../../Functions/FGGroup/StudentPlacement'

const StudentPlacement = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [submissionData, setSubmissionData] = useState([])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [selectedRequestId, setSelectedRequestId] = useState<any>(null)
	const [placementData, setPlacementData] = useState<any>({})
	const [updatePlacementData, setUpdatePlacementData] = useState<any>({})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetPlacementRequest({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			let filteredData: any = response.data
			setSubmissionData(filteredData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		if (searchTerm) {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		} else {
			fetchData()
		}
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, searchTerm])

	const isFirstRender = useRef(true)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleInputChange = (event: any) => {
		const { name, value } = event.target
		setPlacementData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleUpdateInputChange = (event: any) => {
		const { name, value } = event.target
		setUpdatePlacementData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const addPlacementInterview = async () => {
		try {
			await SchedulePlacementInterview({
				placement_request_id: selectedRequestId,
				interview_scheduled_at: DayJS(placementData.interview_scheduled_at).format(
					'YYYY/MM/DD HH:mm'
				),
				contact_person_name: placementData.contact_person_name,
				contact_person_mobile: placementData.contact_person_mobile,
				contact_person_email: placementData.contact_person_email,
			})
			setPlacementData({})
			setShowModal(false)
			fetchData()
			setSelectedRequestId(null)
			toast.success('Placement Interview added successfully!')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message)
		}
	}

	const updatePlacementInterview = async () => {
		try {
			await SchedulePlacementInterview({
				placement_request_id: selectedRequestId,
				interview_scheduled_at: DayJS(updatePlacementData.interview_scheduled_at).format(
					'YYYY/MM/DD HH:mm'
				),
				contact_person_name: updatePlacementData.contact_person_name,
				contact_person_mobile: updatePlacementData.contact_person_mobile,
				contact_person_email: updatePlacementData.contact_person_email,
			})
			setUpdatePlacementData({})
			setShowUpdateModal(false)
			fetchData()
			setSelectedRequestId(null)
			toast.success('Placement Interview Updated successfully!')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message)
		}
	}

	const sortableFields = [
		{ title: 'User', field: 'first_name' },
		{ title: 'Interested Job roles', field: 'interested_job_roles' },
		{ title: 'Chosen Pin Code', field: 'chosen_pin_code' },
		{ title: 'Interview Scheduled At', field: 'interview_scheduled_at' },
		{ title: 'Contact Person', field: 'contact_person_name' },
		{ title: 'Is Interview Attended', field: 'is_interview_attended' },
		{ title: 'Is Job Role Confirmed', field: 'is_job_role_confirmed' },
		{ title: 'User Feedback', field: 'user_feedback' },
		{ title: 'Created At', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const [expandedDescription, setExpandedDescription] = useState<{ [key: number]: boolean }>({})

	const toggleDescription = (index: number) => {
		setExpandedDescription((prevState) => ({
			...prevState,
			[index]: !prevState[index],
		}))
	}

	const truncateString = (str: any, num: any) => {
		if (!str || typeof str !== 'string') {
			return ''
		}
		if (str.length <= num) {
			return str
		}
		return str.slice(0, num) + '...'
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Project Submission</PageTitle>

			<KTCard className='mt-4'>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<LengthMenu
							expenseData={submissionData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={submissionData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={item._id}>
									<tr
										onClick={() => handleRowClick(item._id)}
										className='data-row'>
										<td className='text-center'>
											<FontAwesomeIcon
												icon={faPlusCircle}
												className='mx-1 mb-1 plus-icon'
												style={{ color: '#607D8B', fontSize: '18px' }}
											/>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={
															item.user_id.profile_image
																? `https://files.fggroup.in/${item.user_id.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{item.user_id.first_name + ' ' + item.user_id.last_name}
													</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{(item.user_id.country_code + ' ' || '') + item.user_id.mobile}
													</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{item.user_id.email}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.interested_job_roles.length > 0 ? (
													<ul>
														{item.interested_job_roles.map((data: any) => {
															return <li>{data}</li>
														})}
													</ul>
												) : (
													item.interested_job_roles
												)}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.chosen_pin_code}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(item?.interview_scheduled_at).format('DD/MM/YYYY hh:mm A')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item?.contact_person_name}
											</span>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item?.contact_person_mobile}
											</span>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item?.contact_person_email}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.is_interview_attended === true ? 'Yes' : 'No'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.is_job_role_confirmed === true ? 'Yes' : 'No'}
											</span>
										</td>
										<td>
											<span
												className='text-dark fw-bold text-hover-primary d-md-block d-none mb-1 fs-6'
												onClick={() => toggleDescription(index)}
												title={item.user_feedback}
												style={{ cursor: 'pointer' }}>
												{item.user_feedback
													? expandedDescription[index]
														? item.user_feedback
														: truncateString(item.user_feedback, 40)
													: '-'}
											</span>
										</td>
										<td
											style={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												maxWidth: '100px',
											}}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											{item.interview_scheduled_at ? (
												<TableButton
													action='edit'
													onClick={() => {
														setSelectedRequestId(item._id)
														setUpdatePlacementData({
															...item,
															interview_scheduled_at: DayJS(item.interview_scheduled_at).format(
																'YYYY-MM-DD HH:mm'
															),
														})
														setShowUpdateModal(true)
													}}
												/>
											) : (
												<TableButton
													action='add'
													showIcon={false}
													text='Schedule Interview'
													onClick={() => {
														setSelectedRequestId(item._id)
														setShowModal(true)
													}}
												/>
											)}
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {item.name}
													<br />
													<strong>{sortableFields[1].title}:</strong> {item.email}
													<br />
													<strong>{sortableFields[2].title}:</strong> {item.mobile}
													<br />
													<strong>{sortableFields[3].title}:</strong> {item.subject}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													<span className='text-dark  mb-1 fs-6'></span>
													<br />
													<strong>{sortableFields[5].title}:</strong>{' '}
													{DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{submissionData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{submissionData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Schedule Placement Interview</h2>
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
							placeholder='Interview Scheduled Date'
							type='datetime-local'
							className='fv-row mb-7'
							name='interview_scheduled_at'
							label='Interview Scheduled Date'
							htmlFor='interview_scheduled_at'
							value={placementData.interview_scheduled_at}
							onChange={handleInputChange}
						/>
						<InputField
							placeholder='Contact Person Name'
							type='text'
							className='fv-row mb-7'
							name='contact_person_name'
							label='Contact Person Name'
							htmlFor='contact_person_name'
							value={placementData.contact_person_name}
							onChange={handleInputChange}
						/>
						<InputField
							placeholder='Contact Person Mobile'
							type='text'
							className='fv-row mb-7'
							name='contact_person_mobile'
							label='Contact Person Mobile'
							htmlFor='contact_person_mobile'
							value={placementData.contact_person_mobile}
							onChange={handleInputChange}
						/>
						<InputField
							placeholder='Contact Person Email'
							type='text'
							className='fv-row mb-7'
							name='contact_person_email'
							label='Contact Person Email'
							htmlFor='contact_person_email'
							value={placementData.contact_person_email}
							onChange={handleInputChange}
						/>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='add'
							onClick={addPlacementInterview}
							text='Add'
						/>
					</div>
				</div>
			</Modal>

			<Modal
				centered
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Update Placement Interview</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowUpdateModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<InputField
							placeholder='Interview Scheduled Date'
							type='datetime-local'
							className='fv-row mb-7'
							name='interview_scheduled_at'
							label='Interview Scheduled Date'
							htmlFor='interview_scheduled_at'
							value={updatePlacementData.interview_scheduled_at}
							onChange={handleUpdateInputChange}
						/>
						<InputField
							placeholder='Contact Person Name'
							type='text'
							className='fv-row mb-7'
							name='contact_person_name'
							label='Contact Person Name'
							htmlFor='contact_person_name'
							value={updatePlacementData.contact_person_name}
							onChange={handleUpdateInputChange}
						/>
						<InputField
							placeholder='Contact Person Mobile'
							type='text'
							className='fv-row mb-7'
							name='contact_person_mobile'
							label='Contact Person Mobile'
							htmlFor='contact_person_mobile'
							value={updatePlacementData.contact_person_mobile}
							onChange={handleUpdateInputChange}
						/>
						<InputField
							placeholder='Contact Person Email'
							type='text'
							className='fv-row mb-7'
							name='contact_person_email'
							label='Contact Person Email'
							htmlFor='contact_person_email'
							value={updatePlacementData.contact_person_email}
							onChange={handleUpdateInputChange}
						/>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='edit'
							onClick={updatePlacementInterview}
							text='Update'
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}
export default StudentPlacement
