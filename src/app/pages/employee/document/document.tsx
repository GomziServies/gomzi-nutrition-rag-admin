import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'

const EmployeeDocument: React.FC = () => {
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [documentData, setDocumentData] = useState<any[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const employeeData: any = localStorage.getItem('fg_group_info')

	const fetchDocumentData = async (page?: number) => {
		const employee = JSON.parse(employeeData)
		setLoading(true)
		try {
			const response = await GetEmployees({ id: employee._id, page: page || pagination.page })
			let filteredData: any = response.data

			if (filteredData && filteredData.length > 0) {
				filteredData = filteredData[0]

				if (filteredData.employee && filteredData.employee.document) {
					let DocumentData: any = []
					filteredData.employee.document.forEach((el: any) => {
						DocumentData.push({ name: el.document_type, document: el.link })
					})

					setDocumentData(DocumentData)
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
		const downloadUrl = `https://files.fggroup.in/${document}`
		window.open(downloadUrl)
		toast.success('Document File Downloaded Successfully')
	}

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
			<PageTitle breadcrumbs={[]}>Employee Document</PageTitle>
			<div
				className='accordion card'
				id='kt_accordion_1'>
				<KTCard className='accordion-item mt-5'>
					<div
						id='kt_accordion_1_body_1'
						className='accordion-collapse collapse show'>
						<div className='py-4 card-body'>
							<div className='table-responsive'>
								<Table
									data={documentData}
									columns={sortableFields}
									sort={sort}
									sortOrder={sortOrder}
									onSortChange={handleSortChange}
									renderRow={(
										document: any,
										index: number,
										actualIndex: number,
										isVisible: boolean
									) => (
										<React.Fragment key={index}>
											<tr
												onClick={() => handleRowClick(index)}
												className='data-row'>
												<td className='text-center'>
													<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
														{document.name}
													</span>
												</td>
												<td>
													<button
														className='btn btn-success btn-sm'
														onClick={() => notify(document.document)}>
														Download
													</button>
												</td>
											</tr>
											{isVisible && (
												<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
													<td colSpan={12}>
														<div>
															<strong>{sortableFields[0].title}:</strong> {document.name}
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
							{documentData.length === 0 && !loading && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{documentData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(documentData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</div>
				</KTCard>
			</div>
		</>
	)
}

export default EmployeeDocument
