import { faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	GetAdajanBranchClient,
	RemoveAdajanBranchClient,
} from '../../../Functions/FGGroup/AdajanBranchClient'
import { calculateMembershipDays } from '../../../utils/dateUtils'

// Client Interface
interface Client {
	_id: string
	name: string
	phone: string
	email: string
	client_address?: {
		address_line_1?: string
		city?: string
		state?: string
		pin_code?: string
		country?: string
	}
	planDuration: string
	joiningDate: string
	remainingDays: number | null
	image?: string
	clientCode?: string
	bloodGroup?: string
	workoutTime?: string
	expiryDate?: string
	status: boolean
}

const AdajanBranchClientList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [loading, setLoading] = useState(false)
	const [clients, setClients] = useState<Client[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetAdajanBranchClient({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const clientData = response.data || []
			setClients(clientData)

			const metaData: any = response.metadata
			setMetaData(metaData?.pagination)
		} catch (error: any) {
			toast.error('Failed to fetch clients')
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

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

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination({ ...pagination, page: 1 })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
		sessionStorage.setItem('currentPage', page.toString())
	}

	useEffect(() => {
		const storedPage = sessionStorage.getItem('currentPage')
		if (storedPage) {
			setPagination((prev) => ({ ...prev, page: parseInt(storedPage, 10) }))
		}
	}, [])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const sortableFields = [
		{ title: 'Client', field: 'name' },
		{ title: 'Client Code', field: 'clientCode' },
		{ title: 'Remaining Days', field: 'remainingDays' },
		{ title: 'Plan Duration', field: 'planDuration' },
		{ title: 'Joining Date', field: 'joiningDate' },
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

	const handleRemoveItem = async () => {
		if (!removeConfirmId) return
		try {
			setIsSubmitting(true)
			await RemoveAdajanBranchClient(removeConfirmId)
			toast.success('Client removed successfully')
			setRemoveConfirmId(null)
			fetchData()
		} catch (error: any) {
			toast.error(error.message || 'Failed to remove client')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Adajan-Branch Client List</PageTitle>

			{/* Main Table Card */}
			<KTCard>
				<div className='row justify-content-between mt-7 mx-6'>
					<div className='col-md-9'>
						<h3 className='card-title align-items-start flex-column'>
							<span className='card-label fw-bold fs-3 mb-1'>Adajan-Branch Client List</span>
						</h3>
					</div>
				</div>

				<div className='card-header row border-0 pt-6'>
					<div className='col-md-6 d-flex'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div className='d-md-block d-none'>
							<LengthMenu
								expenseData={clients}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='col-md-6 pe-md-6'>
						<div className='row justify-content-end align-items-center'>
							<div className='col-md-6 my-md-0 my-5 pe-0'>
								<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
							</div>
							<div className='col-md-4 text-end'>
								<TableButton
									action='add'
									to='/adajan-branch/client/add'
									text='Add Client'
								/>
							</div>
						</div>
					</div>
					<div className='col-md-3 d-flex d-md-none justify-content-between p-0'>
						<LengthMenu
							expenseData={clients}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={clients}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(client: Client, index: number, actualIndex: number, isVisible: boolean) => {
								const { remainingDays, expiredDays } = calculateMembershipDays(
									client.joiningDate,
									client.expiryDate
								)

								return (
									<React.Fragment key={client._id}>
										<tr
											onClick={() => handleRowClick(client._id)}
											className='data-row'>
											<td className='text-center align-middle'>
												<div className='d-flex align-items-center justify-content-center'>
													<FontAwesomeIcon
														icon={faPlusCircle}
														className='mx-2 mb-1 plus-icon'
														style={{ color: '#607D8B', fontSize: '18px' }}
													/>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
												</div>
											</td>
											<td className='text-start align-middle px-3'>
												<div className='d-flex align-items-center'>
													<div className='symbol symbol-45px'>
														<img
															src={
																client.image
																	? `https://files.fggroup.in/${client.image}`
																	: toAbsoluteUrl('/media/logos/fgiit-logo.png')
															}
															alt={client.name}
															style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
														/>
													</div>
													<div className='d-flex justify-content-start flex-column ms-5'>
														<span className='text-dark fw-bold fs-6'>{client.name}</span>
														<span className='text-muted fw-semibold d-block fs-7 text-start'>
															{client.phone}
														</span>
													</div>
												</div>
											</td>
											<td className='text-center align-middle'>
												<span className='text-dark fw-bold d-block mb-1'>
													{client.clientCode || 'N/A'}
												</span>
											</td>
											<td>
												{remainingDays <= 0 ? (
													<span
														className='badge rounded-pill py-2 px-3'
														style={{ backgroundColor: '#fff5f8', color: '#f1416c' }}>
														{expiredDays} Days Expired
													</span>
												) : remainingDays <= 30 ? (
													<span
														className='badge rounded-pill py-2 px-3'
														style={{ backgroundColor: '#fff5f8', color: '#f1416c' }}>
														{remainingDays} Days Remaining
													</span>
												) : (
													<span
														className='badge rounded-pill py-2 px-3'
														style={{ backgroundColor: '#e8fff3', color: '#50cd89' }}>
														{remainingDays} Days Remaining
													</span>
												)}
											</td>
											<td className='text-center align-middle'>
												<span className='badge badge-light-primary fs-7'>
													{client.planDuration}
												</span>
											</td>
											<td className='text-center align-middle'>
												<span className='text-dark fw-bold d-block mb-1'>
													{new Date(client.joiningDate).toLocaleDateString('en-IN', {
														day: '2-digit',
														month: 'short',
														year: 'numeric',
													})}
												</span>
											</td>
											<td className='text-center align-middle'>
												<div className='d-flex align-items-center justify-content-center gap-2'>
													<TableButton
														action='view'
														to={`/adajan-branch/client/view?id=${client._id}`}
													/>
													<TableButton
														action='edit'
														to={`/adajan-branch/client/edit?id=${client._id}`}
													/>
													<TableButton
														action='remove'
														onClick={() => setRemoveConfirmId(client._id)}
													/>
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div>
														<div className='d-flex align-items-center mb-3'>
															<div className='symbol symbol-45px me-5'>
																<img
																	src={
																		client.image
																			? `https://files.fggroup.in/${client.image}`
																			: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																	}
																	alt={client.name}
																	style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
																/>
															</div>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold fs-6'>{client.name}</span>
																<span className='text-muted fw-semibold d-block fs-7'>
																	{client.phone}
																</span>
															</div>
														</div>
														<strong>Client Code:</strong> {client.clientCode || 'N/A'}
														<br />
														<strong>Remaining Days:</strong>{' '}
														{remainingDays <= 0 ? (
															<span
																className='badge rounded-pill py-2 px-3'
																style={{ backgroundColor: '#fff5f8', color: '#f1416c' }}>
																{expiredDays} Days Expired
															</span>
														) : remainingDays <= 30 ? (
															<span
																className='badge rounded-pill py-2 px-3'
																style={{ backgroundColor: '#fff5f8', color: '#f1416c' }}>
																{remainingDays} Days Remaining
															</span>
														) : (
															<span
																className='badge rounded-pill py-2 px-3'
																style={{ backgroundColor: '#e8fff3', color: '#50cd89' }}>
																{remainingDays} Days Remaining
															</span>
														)}
														<br />
														<strong>Plan Duration:</strong> {client.planDuration}
														<br />
														<strong>Joining Date:</strong>{' '}
														{new Date(client.joiningDate).toLocaleDateString('en-IN', {
															day: '2-digit',
															month: 'short',
															year: 'numeric',
														})}
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								)
							}}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>

					{/* No Records Message */}
					{clients.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}

					{/* Pagination */}
					{clients.length > 0 && metaData && (
						<UsersListPagination
							totalPages={metaData.totalPages || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/* Remove Confirmation Modal */}
			<Modal
				centered
				show={!!removeConfirmId}
				onHide={() => setRemoveConfirmId(null)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Remove Client</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setRemoveConfirmId(null)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body'>
						<p>Are you sure you want to remove this client?</p>
					</div>
					<div className='modal-footer justify-content-end'>
						<button
							className='btn btn-light me-2'
							onClick={() => setRemoveConfirmId(null)}
							disabled={isSubmitting}>
							Cancel
						</button>
						<TableButton
							action='remove'
							onClick={handleRemoveItem}
							text={isSubmitting ? 'Please wait...' : 'Remove'}
							showIcon={false}
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</Modal>

			<style>{`
        .client-list-table { font-size: 0.95rem !important; }
        .client-list-table th,
        .client-list-table td,
        .client-list-table .badge { font-size: 0.95rem !important; }
      `}</style>
		</>
	)
}

export default AdajanBranchClientList
