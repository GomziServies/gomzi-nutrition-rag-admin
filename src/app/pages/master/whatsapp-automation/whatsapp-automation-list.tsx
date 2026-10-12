import { faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetLeadAutomation, RemoveLeadAutomation } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const WhatsappAutomationList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [leadData, setLeadData] = useState([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [updateShow, setUpdateShow] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [updateData, setUpdateData] = useState({
		_id: '',
		branch_code: '',
		franchise_name: '',
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetLeadAutomation({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			setLeadData(response.data)

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const isFirstRender = useRef(true);

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

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRemoveVariation = (id: any) => {
		Swal.fire({
			icon: 'warning',
			title: 'Are you sure?',
			text: 'Once Completed, you will not be able to undone!',
			showCancelButton: true,
			confirmButtonText: 'Ok',
		}).then(async (result) => {
			if (result.isConfirmed) {
				await RemoveLeadAutomation({ id, status: false })
				toast.success('Product Variation Remove Successfully')
				fetchData()
			}
		})
	}

	const sortableFields = [
		{ title: 'Title', field: 'title' },
		{ title: 'Category', field: 'category' },
		{ title: 'Status', field: 'status' },
		{ title: 'createdDate', field: 'createdDate' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleSetData = () => {
		setUpdateShow(true)
	}

	const handleUpdateData = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				franchise_id: updateData._id,
				franchise_name: updateData.franchise_name,
				branch_code: updateData.branch_code,
			}
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
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Lead Automation</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='card-branch_code d-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<LengthMenu
								expenseData={leadData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							to={'/master/whatsapp-automation-create'}
							text='Create Workflow'
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={leadData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(lead: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={lead._id}>
									<tr
										onClick={() => handleRowClick(lead._id)}
										className='data-row'>
										<td>
											<span className='text-dark text-center fw-bold  ms-6 mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.title || 'null'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.category}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{lead.status}
												<span
													className='badge badge-success'
													title='Account is Active.'>
													Active
												</span>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(lead.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<div className='d-flex'>
												<TableButton
													action='remove'
													onClick={() => handleRemoveVariation(lead._id)}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong> {lead.category}
													<br />
													<strong>{sortableFields[2].title}: </strong> {lead.category}
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
					{leadData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{leadData.length > 0 && (
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
						<h2 className='mb-3'>Create Workflow</h2>
					</div>
					<div>
						<div className='mb-5'>
							<InputField
								placeholder='Workflow Title'
								type='text'
								className='mb-7 w-100 fv-row'
								name='franchise_name'
								label='Workflow Title'
								htmlFor='franchise_name'
							/>
						</div>
						{/* <div className=''>
							<SelectField
								className='w-100 fv-row'
								label='Type'
								name='type'
								value={updateData.branch_code}
								onChange={handleInputChange}
								htmlFor='Type'
								options={['Admin', 'Franchise', 'Store']}
							/>
						</div> */}
					</div>
				</div>
				<div className='modal-footer justify-content-end'>
					<TableButton
						action='add'
						onClick={handleUpdateData}
						text={isSubmitting ? 'Please wait, Creating...' : 'Create'}
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

export default WhatsappAutomationList
