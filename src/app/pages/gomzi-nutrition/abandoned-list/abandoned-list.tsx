import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetOrders } from '../../../Functions/FGGroup'

const AbandonedList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [abandonedData, setAbandonedData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [loading, setLoading] = useState(false)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [formData, setFormData] = useState<any>({
		from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
	})

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		if (range && range[0] && range[1]) {
			setFormData({
				from_date: DayJS(range[0]).format('YYYY-MM-DD'),
				to_date: DayJS(range[1]).format('YYYY-MM-DD'),
			})
		} else {
			setFormData({
				from_date: '',
				to_date: '',
			})
		}
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const fetchAbandonedData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				item_type: ['FG_MEAL_PRODUCT'],
				order_status: 'PENDING',
			}
			if (formData.from_date && formData.to_date) {
				filterQuery.from_date = formData.from_date
				filterQuery.to_date = formData.to_date
			}
			const response = await GetOrders({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm ? searchTerm : null,
				sort,
				sortOrder,
				...filterQuery,
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			let filteredData: any = response.data

			// Merge the CART and multiple_items arrays based on item_id
			filteredData = filteredData
				// .filter((cart: any) => cart.gateway !== "RAZORPAY_FGIIT")
				?.map((cart: any) => ({
					...cart,
					merged_items: cart.CART?.map((cartItem: any) => {
						const matchingItem = cart.multiple_items.find(
							(item: any) => item.item_id === cartItem?._id
						)
						return {
							...cartItem,
							amount: matchingItem?.amount || 0, // Add amount from multiple_items
							quantity: matchingItem?.quantity || 0, // Add quantity from multiple_items
						}
					}),
				}))
			setAbandonedData(filteredData)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAbandonedData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, formData.from_date, formData.to_date])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	const filteredAbandonedData = abandonedData.filter((cart: any) => {
		if (!searchTerm || !searchTerm.trim()) return true
		const term = searchTerm.toLowerCase().trim()
		const firstName = cart?.user_info?.first_name || ''
		const lastName = cart?.user_info?.last_name || ''
		const fullName = `${firstName} ${lastName}`.toLowerCase()
		const mobile = (cart?.user_info?.mobile || '').toString().toLowerCase()
		const receiptId = (cart?.receipt_id || '').toString().toLowerCase()
		const product = (cart?.product?.name || '').toLowerCase()
		const merged = (cart?.merged_items || []).map((m: any) => m.name).join(' ').toLowerCase()

		return (
			fullName.includes(term) ||
			mobile.includes(term) ||
			receiptId.includes(term) ||
			product.includes(term) ||
			merged.includes(term)
		)
	})

	const downloadExcel = () => {
		const worksheetData = filteredAbandonedData.map((data: any, idx: number) => {
			const userName = data?.user_info
				? `${data.user_info.first_name || 'Deleted User'} ${data.user_info.last_name || ''}`.trim()
				: 'Deleted User'
			const mobile = data?.user_info?.mobile || 'N/A'
			const receiptId = data?.receipt_id || 'N/A'
			const itemsList = data?.product
				? data.product.name
				: data.merged_items?.map((item: any) => `${item.name} (x${item.quantity})`).join(', ') || 'N/A'
			const price = data?.amount || 0
			const date = data?.createdAt ? DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A') : 'N/A'

			return {
				'No.': idx + 1,
				'User Name': userName,
				Mobile: mobile,
				'Receipt ID': receiptId,
				Items: itemsList,
				Price: price,
				Date: date,
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Abandoned List')
		XLSX.writeFile(workbook, `Abandoned_Checkout_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	const sortableFields = [
		{ title: 'User', field: 'user_info.first_name' },
		{ title: 'Receipt ID', field: 'receipt_id' },
		{ title: 'Item Name', field: 'product.name' },
		{ title: 'Price', field: 'amount' },
		{ title: 'Date', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Abandoned List</PageTitle>
			<KTCard>
				{/* Filters Toolbar Row: Search, LengthMenu, Download Excel, DateFilter */}
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex flex-wrap align-items-center gap-3 w-100'>
						{/* 1. Search Filter */}
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								className='me-0'
							/>
						</div>

						{/* 2. Dropdown (show entries per page) */}
						<div>
							<LengthMenu
								expenseData={filteredAbandonedData}
								handleItemsPerPageChange={handleItemsPerPageChange}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center justify-content-center'
								style={{
									width: '38px',
									height: '38px',
									padding: 0,
									borderRadius: '8px',
									fontSize: '14px',
								}}
								onClick={downloadExcel}
								disabled={loading || filteredAbandonedData.length === 0}
								title='Download Excel'>
								<FontAwesomeIcon icon={faDownload} />
							</button>
						</div>

						{/* 4. Date Filter */}
						<div className='d-flex align-items-center'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={filteredAbandonedData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							disableSortFields={['receipt_id']}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr
										onClick={() => handleRowClick(data._id)}
										className='data-row'>
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
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-3'>
													<img
														src={
															data.profile_image
																? `https://files.fggroup.in/${data.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{(data.user_info.first_name || 'Deleted User') +
															' ' +
															(data.user_info.last_name || '')}
													</span>
													<span className='text-muted fw-semibold text-muted d-flex fs-7'>
														{data.user_info?.mobile || '-'}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  mb-1 fs-6'>
												{data.receipt_id}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  mb-1 fs-6'>
												{data?.product ? (
													data?.product?.name
												) : (
													<ul>
														{data.merged_items?.map((name: any, index: number) => (
															<li key={index}>{name.name + `( × ${name.quantity})` || '-'}</li>
														))}
													</ul>
												)}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  mb-1 fs-6'>
												₹{data.amount}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  mb-1 fs-6'>
												{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	data.profile_image
																		? `https://files.fggroup.in/${data.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>
																{(data.user_info.first_name || 'Deleted User') +
																	' ' +
																	(data.user_info.last_name || '')}
															</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{data.user_info?.mobile || '-'}
															</span>
														</div>
													</div>
													<br />
													<strong>{sortableFields[1].title}: </strong> {data.receipt_id}
													<br />
													<strong>{sortableFields[2].title}: </strong>{' '}
													<ul>
														{data.merged_items?.map((name: any, index: number) => (
															<li key={index}>{name.name + `( × ${name.quantity})` || '-'}</li>
														))}
													</ul>
													<br />
													<strong>{sortableFields[3].title}: </strong> ₹ {data.amount}
													<br />
													<strong>{sortableFields[4].title}: </strong>{' '}
													{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
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
					{abandonedData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{abandonedData.length > 0 && (
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

export default AbandonedList
