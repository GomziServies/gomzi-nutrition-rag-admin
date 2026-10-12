import { faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { CreateTarget, GetTarget, UpdateTarget } from '../../../Functions/FGGroup/Target'

const HRTarget: React.FC = () => {
	const intl = useIntl()
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [targetData, setTargetData] = useState<any[]>([])
	const [targetAddData, setTargetAddData] = useState({
		target_title: '',
		from_date: '',
		to_date: '',
		target_description: '',
		position: '',
	})
	const [targetUpdateData, setTargetUpdateData] = useState({
		target_id: '',
		target_title: '',
		from_date: '',
		to_date: '',
		target_description: '',
		position: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchAssignTaskData = async () => {
		try {
			const response = await GetTarget()
			const filteredData: any = response.data
			setTargetData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchAssignTaskData()
	}, [searchTerm])

	const handleSubmit = async () => {
		try {
			const { target_title, from_date, to_date, target_description, position } = targetAddData

			const payload: any = {
				target_title,
				from_date,
				to_date,
				target_description,
				position,
			}

			await CreateTarget(payload)
			toast.success('Task Created Successfully')

			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleUpdate = async () => {
		try {
			const { target_id, target_title, from_date, to_date, target_description, position } =
				targetUpdateData

			const payload: any = {
				target_id: target_id,
				target_title,
				from_date,
				to_date,
				target_description,
				position,
			}

			await UpdateTarget(payload)
			toast.success('Task Update Successfully')

			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setTargetAddData({ ...targetAddData, [name]: value })
	}

	const handleUpdateInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setTargetUpdateData({ ...targetUpdateData, [name]: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setPagination({ ...pagination, itemsPerPage, page: 1 })
	}

	const filteredtargetData = targetData.filter((sale) =>
		sale.target_title.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedtargetData = filteredtargetData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const sortableFields = [
		{ title: 'Target Title', field: 'target_title' },
		{ title: 'Description', field: 'target_description' },
		{ title: 'Position', field: 'position' },
		{ title: 'Start Date', field: 'createdAt' },
		{ title: 'End Date', field: 'updatedAt' },
		{ title: 'Target Days', field: 'days' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Services</PageTitle>
			<div
				className='accordion card'
				id='kt_accordion_1'>
				<KTCard className='accordion-item mt-5'>
					<div
						id='kt_accordion_1_body_1'
						className='accordion-collapse collapse show'>
						<div className='row mx-6 my-4 align-items-center justify-content-between'>
							<div className='col-md-4 col-12'>
								<div className='d-flex'>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={setSearchTerm}
									/>
									<div className=''>
										<LengthMenu
											expenseData={targetData}
											handleItemsPerPageChange={handleItemsPerPageChange}
										/>
									</div>
								</div>
							</div>
							<div className='col-md-8 col-12 mt-md-0 mt-4'>
								<div className='modal-footer justify-content-end'>
									<button
										className='btn btn-primary'
										data-bs-toggle='modal'
										data-bs-target='#kt_modal_target_add'>
										<KTIcon
											iconName='plus'
											className='fs-2'
										/>
										Add Target
									</button>
								</div>
							</div>
						</div>
						<div className='py-4 card-body'>
							<div className='table-responsive'>
								<Table
									data={paginatedtargetData}
									columns={sortableFields}
									sort={sort}
									sortOrder={sortOrder}
									onSortChange={handleSortChange}
									renderRow={(
										target: any,
										index: number,
										actualIndex: number,
										isVisible: boolean
									) => (
										<React.Fragment key={target._id}>
											<tr
												onClick={() => handleRowClick(target._id)}
												className='data-row'>
												<td className='text-center'>
													<div className='d-flex'>
														<FontAwesomeIcon
															icon={faPlusCircle}
															className='mx-2 ms-5 mb-1 plus-icon'
															style={{ color: '#607D8B', fontSize: '18px' }}
														/>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</div>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{target.target_title ? target.target_title : 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{target.target_description ? target.target_description : 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{target.position ? target.position : 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{target.createdAt
															? DayJS(target.createdAt).format('DD/MM/YYYY, hh:mm:ss A')
															: 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{target.updatedAt
															? DayJS(target.updatedAt).format('DD/MM/YYYY, hh:mm:ss A')
															: 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{target.createdAt && target.updatedAt
															? DayJS(target.updatedAt).diff(DayJS(target.createdAt), 'day')
															: 'N/A'}{' '}
														Days
														{/* {(() => {
															const fromDate = DayJS(leave.from_date);
															const toDate = DayJS(leave.to_date);
															const diff = DayJS.duration(toDate.diff(fromDate));

															const days = diff.days();
															const hours = diff.hours();
															const minutes = diff.minutes();

															if (days === 0 && hours === 0 && minutes === 0) {
																return '0 hours';
															} else if (days === 0) {
																return `${hours}:${minutes < 10 ? '0' + minutes : minutes} hours`;
															} else if (hours === 0 && minutes === 0) {
																return `${days} day${days !== 1 ? 's' : ''}`;
															} else {
																return `${days} day${days !== 1 ? 's' : ''} ${hours}:${minutes < 10 ? '0' + minutes : minutes} hours`;
															}
														})()} */}
													</span>
												</td>
												<td>
													<div
														data-bs-toggle='modal'
														data-bs-target='#kt_modal_target_update'>
														<TableButton
															action='edit'
															onClick={() =>
																setTargetUpdateData({
																	target_id: target._id,
																	target_title: target.target_title,
																	target_description: target.target_description,
																	to_date: target.createdAt,
																	from_date: target.updatedAt,
																	position: target.position,
																})
															}
														/>
													</div>
												</td>
											</tr>
											{isVisible && (
												<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
													<td colSpan={12}>
														<div>
															<strong>{sortableFields[0].title}:</strong>{' '}
															{target.target_title ? target.target_title : 'N/A'}
															<br />
															<strong>{sortableFields[1].title}:</strong>{' '}
															{target.target_description ? target.target_description : 'N/A'}
															<br />
															<strong>{sortableFields[2].title}:</strong>{' '}
															{target.position ? target.position : 'N/A'}
															<br />
															<strong>{sortableFields[3].title}:</strong>{' '}
															{target.createdAt
																? DayJS(target.createdAt).format('DD/MM/YYYY, hh:mm:ss A')
																: 'N/A'}
															<br />
															<strong>{sortableFields[4].title}:</strong>{' '}
															{target.updatedAt
																? DayJS(target.updatedAt).format('DD/MM/YYYY, hh:mm:ss A')
																: 'N/A'}
															<br />
															<strong>{sortableFields[5].title}:</strong>{' '}
															{target.createdAt && target.updatedAt
																? DayJS(target.updatedAt).diff(DayJS(target.createdAt), 'day')
																: 'N/A'}{' '}
															Days
															<br />
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
							{targetData.length === 0 && !loading && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{targetData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(targetData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</div>

					{/* target add modal */}
					<div
						className='modal fade'
						id='kt_modal_target_add'
						aria-hidden='true'>
						<div className='modal-dialog modal-dialog-centered mw-650px'>
							<div className='modal-content'>
								<div className='modal-header justify-content-between'>
									<h2 className='fw-bolder'>Add New Target</h2>
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
									<div className='col-md-12'>
										<div className='row'>
											<div className='col-md-6 fv-row mb-7'>
												<InputField
													placeholder='Target Title'
													type='text'
													className='col-12 fv-row mb-7'
													name='target_title'
													label='Target Title'
													htmlFor='target_title'
													value={targetAddData.target_title}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<InputField
													placeholder='Target Description'
													type='text'
													className='col-12 fv-row mb-7'
													name='target_description'
													label='Target Description'
													htmlFor='target_description'
													value={targetAddData.target_description}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<InputField
													placeholder='From Date'
													type='date'
													className='col-12 fv-row mb-7'
													name='from_date'
													label='From Date'
													htmlFor='from_date'
													value={targetAddData.from_date}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<InputField
													placeholder='To Date'
													type='date'
													className='col-12 fv-row mb-7'
													name='to_date'
													label='To Date'
													htmlFor='to_date'
													value={targetAddData.to_date}
													onChange={(e) => handleInputChange(e)}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<SelectField
													className='col-12 fv-row'
													name='position'
													label='Set position For'
													htmlFor='position'
													value={targetAddData.position}
													onChange={handleInputChange}
													options={[
														'Developer',
														'Marketing',
														'Franchise Owner',
														'Graphic Designer',
														'Sales Manager',
														'Video Editor',
														'Back Office',
														'Trainer',
														'Dietician',
														'Telecalling',
														'Branch Manager',
														'Human Resources',
														'Team Leader',
														'Manager',
														'Director',
														'Social Media Assistant',
													]}
												/>
											</div>
										</div>
									</div>
								</div>
								<div className='modal-footer justify-content-end'>
									<button
										className='btn btn-primary'
										data-bs-dismiss='modal'
										onClick={() => handleSubmit()}>
										Add
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* target Update modal */}
					<div
						className='modal fade'
						id='kt_modal_target_update'
						aria-hidden='true'>
						<div className='modal-dialog modal-dialog-centered mw-650px'>
							<div className='modal-content'>
								<div className='modal-header justify-content-between'>
									<h2 className='fw-bolder'>Update Target</h2>
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
									<div className='col-md-12'>
										<div className='row'>
											<div className='col-md-6 fv-row mb-7'>
												<InputField
													placeholder='Target Title'
													type='text'
													className='col-12 fv-row mb-7'
													name='target_title'
													label='Target Title'
													htmlFor='target_title'
													value={targetUpdateData.target_title}
													onChange={(e) => handleUpdateInputChange(e)}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<InputField
													placeholder='Target Description'
													type='text'
													className='col-12 fv-row mb-7'
													name='target_description'
													label='Target Description'
													htmlFor='target_description'
													value={targetUpdateData.target_description}
													onChange={(e) => handleUpdateInputChange(e)}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<InputField
													placeholder='From Date'
													type='date'
													className='col-12 fv-row mb-7'
													name='from_date'
													label='From Date'
													htmlFor='from_date'
													value={DayJS(targetUpdateData.from_date).format('YYYY-MM-DD')}
													onChange={(e) => handleUpdateInputChange(e)}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<InputField
													placeholder='To Date'
													type='date'
													className='col-12 fv-row mb-7'
													name='to_date'
													label='To Date'
													htmlFor='to_date'
													value={DayJS(targetUpdateData.to_date).format('YYYY-MM-DD')}
													onChange={(e) => handleUpdateInputChange(e)}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<SelectField
													className='col-12 fv-row'
													name='position'
													label='Set position For'
													htmlFor='position'
													value={targetUpdateData.position}
													onChange={(e) => handleUpdateInputChange(e)}
													options={[
														'Developer',
														'Marketing',
														'Franchise Owner',
														'Graphic Designer',
														'Sales Manager',
														'Video Editor',
														'Back Office',
														'Trainer',
														'Dietician',
														'Telecalling',
														'Branch Manager',
														'Human Resources',
														'Team Leader',
														'Manager',
														'Director',
														'Social Media Assistant',
													]}
												/>
											</div>
										</div>
									</div>
								</div>
								<div className='modal-footer justify-content-end'>
									<button
										className='btn btn-primary'
										data-bs-dismiss='modal'
										onClick={() => handleUpdate()}>
										Update
									</button>
								</div>
							</div>
						</div>
					</div>
				</KTCard>
			</div>
		</>
	)
}

export default HRTarget
