import { faDownload, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'

const EmployeeDocument: React.FC = () => {
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [sort, setSort] = useState('name')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('asc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [documentData, setDocumentData] = useState<any[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const getStoredEmployee = () => {
		try {
			const raw =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			return raw ? JSON.parse(raw) : {}
		} catch {
			return {}
		}
	}

	const fetchDocumentData = async (page?: number) => {
		setLoading(true)
		try {
			const employee = getStoredEmployee()
			const empId = employee?._id || employee?.id
			if (!empId) {
				setLoading(false)
				return
			}

			const response: any = await GetEmployees({ id: empId, page: page || pagination.page })
			let filteredData: any = response?.data

			if (filteredData && filteredData.length > 0) {
				const empObj = filteredData[0]
				if (empObj?.employee?.document) {
					const docs: any[] = []
					empObj.employee.document.forEach((el: any) => {
						if (el) {
							docs.push({
								name: el.document_type || 'Document',
								document: el.link || '',
							})
						}
					})
					setDocumentData(docs)
				}
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchDocumentData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const notify = (document: any) => {
		if (!document) {
			toast.error('Document file not available')
			return
		}
		const downloadUrl = document.startsWith('http') ? document : `https://files.fggroup.in/${document}`
		window.open(downloadUrl, '_blank')
		toast.success('Document opened for download')
	}

	const filteredDocs = documentData.filter((doc) =>
		(doc.name || '').toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedDocs = filteredDocs.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const sortableFields = [{ title: 'Document Type', field: 'name' }]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: any) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>My Documents</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						<div className='d-flex align-items-center position-relative'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>
					<div className='d-flex align-items-center gap-3'>
						<LengthMenu
							expenseData={documentData}
							handleItemsPerPageChange={handlePageChange}
						/>
					</div>
				</div>

				<div className='card-body py-4 px-6'>
					<div className='table-responsive'>
						<Table
							data={paginatedDocs}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(
								doc: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => (
								<React.Fragment key={index}>
									<tr
										onClick={() => handleRowClick(index)}
										className='data-row'
										style={{ verticalAlign: 'middle', borderBottom: '1px solid #f1f1f4' }}>
										<td className='text-center py-3' style={{ width: '60px' }}>
											<span className='badge badge-light-secondary fw-bolder px-2 py-1' style={{ borderRadius: '6px' }}>
												{actualIndex}
											</span>
										</td>
										<td className='py-3'>
											<div className='d-flex align-items-center gap-3'>
												<div className='symbol symbol-35px'>
													<span className='symbol-label bg-light-primary text-primary'>
														<FontAwesomeIcon icon={faFilePdf} />
													</span>
												</div>
												<span className='text-gray-900 fw-bold fs-6'>
													{doc.name}
												</span>
											</div>
										</td>
										<td className='py-3 text-end pe-4'>
											<button
												className='btn btn-sm btn-light-primary fw-semibold px-4 py-2 d-inline-flex align-items-center gap-2'
												style={{ borderRadius: '8px' }}
												onClick={(e) => {
													e.stopPropagation()
													notify(doc.document)
												}}>
												<FontAwesomeIcon icon={faDownload} />
												<span>Download</span>
											</button>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12} className='p-4 bg-light-primary rounded-3'>
												<div className='fs-7'>
													<div><strong>Document Type:</strong> {doc.name}</div>
													<div className='mt-2'>
														<button
															className='btn btn-sm btn-primary'
															onClick={() => notify(doc.document)}>
															<FontAwesomeIcon icon={faDownload} className='me-1' /> Download File
														</button>
													</div>
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

					{filteredDocs.length === 0 && !loading && (
						<div className='d-flex flex-column align-items-center justify-content-center py-12 text-center'>
							<div className='symbol symbol-60px mb-4'>
								<span className='symbol-label bg-light-primary text-primary fs-2'>📁</span>
							</div>
							<h5 className='fw-bold text-gray-800 mb-1'>No Documents Found</h5>
							<p className='text-muted fs-7 mb-0'>Your uploaded personal and company documents will appear here.</p>
						</div>
					)}

					<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
						<div className='text-muted fs-7 fw-semibold'>
							Showing {filteredDocs.length === 0 ? 0 : (pagination.page - 1) * pagination.itemsPerPage + 1} to{' '}
							{Math.min(pagination.page * pagination.itemsPerPage, filteredDocs.length)} of {filteredDocs.length} records
						</div>
						{filteredDocs.length > 0 && (
							<UsersListPagination
								totalPages={Math.ceil(filteredDocs.length / pagination.itemsPerPage) || 1}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default EmployeeDocument
