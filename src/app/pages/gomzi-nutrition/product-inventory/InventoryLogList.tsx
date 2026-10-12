import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetInventoryHistory } from '../../../Functions/FGGroup'

const InventoryLogList = () => {
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [inventoryData, setInventoryData] = useState<any[]>([])
	const [searchParams] = useSearchParams()
	const product_id = searchParams.get('product_id') || undefined
	const variant_id = searchParams.get('variant_id') || undefined
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [selectedSource, setSelectedSource] = useState<string>('')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchInventoryLogs = async () => {
		try {
			setLoading(true)

			const response: any = await GetInventoryHistory({
				product_id,
				variant_id,
				...(selectedSource && { source: selectedSource }),
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm,
			})

			setInventoryData(response.data || [])

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	const sortableFields = [
		{ title: 'Date', field: 'date' },
		{ title: 'Type', field: 'type' },
		{ title: 'Source', field: 'source' },
		{ title: 'Quantity', field: 'quantity' },
		{ title: 'Previous Stock', field: 'previous_stock' },
		{ title: 'Current Stock', field: 'current_stock' },
		{ title: 'Remarks', field: 'remarks' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
		sessionStorage.setItem('currentPage', page.toString())
	}
	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	useEffect(() => {
		const storedPage = sessionStorage.getItem('currentPage')
		if (storedPage) {
			setPagination((prev) => ({ ...prev, page: parseInt(storedPage, 10) }))
		}
	}, [])

	useEffect(() => {
		fetchInventoryLogs()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedSource])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchInventoryLogs()
		}
	}, [searchTerm])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Product Stock History</PageTitle>

			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='card-branch_code d-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<LengthMenu
								expenseData={inventoryData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<select
							name='Select status'
							className='form-select'
							value={selectedSource}
							onChange={(e) => setSelectedSource(e.target.value)}>
							<option value=''>Select Source</option>
							<option value='MANUAL'>MANUAL</option>
							<option value='ORDER'>ORDER</option>
							<option value='INVOICE'>INVOICE</option>
							<option value='RESET'>RESET</option>
							<option value='RETURN'>RETURN</option>
							<option value='PURCHASE'>PURCHASE</option>
						</select>
					</div>
				</div>

				<div className='card-body py-4'>
					<div className='table-responsive'>
						<Table
							data={inventoryData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							removeAction
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={item._id}>
									<tr key={item._id}>
										<td>
											<span className='text-dark fw-bold  ms-6 mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>

										<td>{moment(item.createdAt).format('DD MMM YYYY hh:mm A')}</td>

										<td>
											<span
												className={`badge ${
													item.transaction_type === 'IN'
														? 'badge-light-success'
														: 'badge-light-danger'
												}`}>
												{item.transaction_type}
											</span>
										</td>

										<td>{item.source}</td>

										<td>{item.quantity}</td>

										<td>{item.previous_stock}</td>

										<td>{item.current_stock}</td>

										<td>{item.remarks}</td>
									</tr>
								</React.Fragment>
							)}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{inventoryData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{inventoryData.length > 0 && (
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

export default InventoryLogList
