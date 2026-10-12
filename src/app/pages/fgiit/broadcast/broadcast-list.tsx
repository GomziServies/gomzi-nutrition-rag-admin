import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { deleteWhatsAppTemplate, getWhatsAppTemplates } from '../../../Functions/FGGroup/WhatsApp'

const BroadcastList: React.FC = () => {
	const location = useLocation()

	const adminType = localStorage.getItem('admin')
	const adminPrefix =
		adminType === 'FWG'
			? '/fwg'
			: adminType === 'Gomzi_Nutrition' || adminType === 'Store'
			? '/nutrition'
			: '/fgiit'

	const [searchTerm, setSearchTerm] = useState('')
	const [templateData, setTemplateData] = useState<any>([])
	const [allTemplateData, setAllTemplateData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('name')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')

	const [loading, setLoading] = useState(false)

	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchTemplateData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await getWhatsAppTemplates({
				// For WhatsApp API, we fetch all data and paginate client-side
				// page: page || pagination.page,
				// limit: pagination.itemsPerPage,
				...(searchTerm && { search: searchTerm }),
				sort,
				sortOrder,
			})

			// Handle both formats - with metadata and without
			let dataArray = []
			let meta = null

			if (response.metadata && response.data) {
				dataArray = response.data
				meta = response.metadata.pagination
			} else {
				// Direct data format from WhatsApp API
				dataArray = response.data || response || []
				// Store all data for client-side pagination
				setAllTemplateData(dataArray)
				// Create mock pagination data for WhatsApp API
				meta = {
					totalPages: Math.ceil(dataArray.length / pagination.itemsPerPage),
					currentPage: pagination.page,
					totalItems: dataArray.length,
				}
			}

			// Implement client-side pagination
			const startIndex = (pagination.page - 1) * pagination.itemsPerPage
			const endIndex = startIndex + pagination.itemsPerPage
			const paginatedData = dataArray.slice(startIndex, endIndex)

			setTemplateData(paginatedData)
			setMetaData(meta)
		} catch (error) {
			console.error('Error fetching WhatsApp templates:', error)
		}
		setLoading(false)
	}

	useEffect(() => {
		// If we already have all data, just re-paginate
		if (allTemplateData.length > 0 && !searchTerm) {
			const startIndex = (pagination.page - 1) * pagination.itemsPerPage
			const endIndex = startIndex + pagination.itemsPerPage
			const paginatedData = allTemplateData.slice(startIndex, endIndex)

			setTemplateData(paginatedData)
			setMetaData({
				totalPages: Math.ceil(allTemplateData.length / pagination.itemsPerPage),
				currentPage: pagination.page,
				totalItems: allTemplateData.length,
			})
		} else {
			fetchTemplateData()
		}
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, searchTerm])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))

			// Clear cached data when search term changes significantly
			setAllTemplateData([])

			if (pagination.page === 1) {
				fetchTemplateData()
			}
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleDeleteTemplate = async (templateName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `Do you want to delete the template "${templateName}"?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		})

		if (result.isConfirmed) {
			// Show loading indicator
			Swal.fire({
				title: 'Deleting...',
				text: 'Please wait while the template is being deleted.',
				allowOutsideClick: false,
				allowEscapeKey: false,
				didOpen: () => {
					Swal.showLoading()
				},
			})

			try {
				const response: any = await deleteWhatsAppTemplate({ name: templateName })
				if (response.status === 200) {
					// Refresh the template list after deletion
					setAllTemplateData([]) // Clear cached data to force refresh
					fetchTemplateData()
					Swal.fire({
						icon: 'success',
						title: 'Deleted!',
						text: `Template "${templateName}" deleted successfully.`,
					})
				} else {
					Swal.fire({
						icon: 'error',
						title: 'Error!',
						text: `Failed to delete template: ${response.message || 'Unknown error'}`,
					})
				}
			} catch (error: any) {
				console.error('Error deleting template:', error)
				Swal.fire({
					icon: 'error',
					title: 'Error!',
					text: `Error deleting template: ${error.message || 'Unknown error'}`,
				})
			}
		}
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}
	let sortableFields: any

	sortableFields = [
		{ title: 'Template Name', field: 'name' },
		{ title: 'Category', field: 'category' },
		{ title: 'Status', field: 'status' },
		{ title: 'Language', field: 'language' },
		{ title: 'Template ID', field: 'id' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const downloadExcel = () => {
		const worksheetData = templateData?.map((template: any, index: number) => {
			return {
				Name: template?.name || 'N/A',
				Category: template?.category || 'N/A',
				Status: template?.status || 'N/A',
				Language: template?.language || 'N/A',
				'Template ID': template?.id || template?._id || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Templates')
		XLSX.writeFile(workbook, 'TemplateData.xlsx')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>WhatsApp Templates</PageTitle>
			<KTCard>
				<div className='row mx-5 border-0 pt-6'>
					<div className='col-md-3'></div>
					<div className='col-md-9'>
						<div className='card-toolbar d-flex justify-content-end'>
							<div className='row justify-content-between'>
								<div className='col-md-12'>
									<TableButton
										action='add'
										to={`${adminPrefix}/automation/broadcast/create-template`}
										text='Create New Template'
									/>
								</div>
							</div>
						</div>
					</div>
					<div className='col-12 row align-items-end'>
						<div className='col-md-3'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
						<div className='col-md-1'>
							<LengthMenu
								expenseData={templateData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={templateData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							manualSearch={searchTerm}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={item.id || item._id || index}>
									<tr
										className='data-row'
										onClick={() => handleRowClick(item.id || item._id)}>
										<td className='text-center'>
											<div
												className='d-flex ms-8'
												role='button'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<span className='text-dark fw-bold  fs-6'>{item.name || 'N/A'}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.category || 'N/A'}
											</span>
										</td>

										<td>
											<span
												className={`fw-bold  d-block mb-1 fs-6 ${
													item.status === 'APPROVED'
														? 'text-success'
														: item.status === 'PENDING'
														? 'text-warning'
														: 'text-danger'
												}`}>
												{item.status || 'N/A'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.language || 'N/A'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.id || item._id || 'N/A'}
											</span>
										</td>
										<td>
											<TableButton
												action='send'
												to={`${adminPrefix}/automation/broadcast/send-template?id=${
													item.id || item._id
												}`}
											/>
											{/* <TableButton
												action='edit'
												to={`/fgiit/automation/broadcast/edit-template?id=${item.id || item._id}`}
											/> */}
											<TableButton
												action='remove'
												onClick={() => handleDeleteTemplate(item.name)}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>Template ID:</strong> {item.id || item._id || 'N/A'}
													<br />
													<strong>Category:</strong> {item.category || 'N/A'}
													<br />
													<strong>Status:</strong> {item.status || 'N/A'}
													<br />
													<strong>Language:</strong> {item.language || 'N/A'}
													<br />
													<strong>Template ID:</strong> {item.id || item._id || 'N/A'}
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
					{templateData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{templateData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default BroadcastList
