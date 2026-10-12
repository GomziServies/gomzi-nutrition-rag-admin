import { faCopy, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import UsersListPagination from '../../../../components/TablePagination'
import { GetMedicalProduct } from '../../../../Functions/FGGroup'

const GMPharmacyProductList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [productData, setProductData] = useState([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetMedicalProduct({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			setProductData(response.data)

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

	const sortableFields = [
		{ title: 'Product ID', field: '_id' },
		{ title: 'Image', field: 'display_image' },
		{ title: 'Product Name', field: 'name' },
		{ title: 'Description', field: 'description' },
		{ title: 'Unit', field: 'unit' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleCopy = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('ID copied to clipboard!')
			})
			.catch((err) => {
				console.error('Failed to copy ID: ', err)
				toast.success('Failed to copy ID!')
			})
	}

	const handleKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>, id: string) => {
		if (event.key === 'Enter' || event.key === ' ') {
			handleCopy(id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gomzi Medical Products</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='card-branch_code d-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<LengthMenu
								expenseData={productData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={productData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							removeAction={true}
							renderRow={(product: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={product._id}>
									<tr
										onClick={() => handleRowClick(product._id)}
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
										<td
											onClick={() => handleCopy(product._id)}
											onKeyPress={(event) => handleKeyPress(event, product._id)}
											role='button'
											tabIndex={0}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<div className='d-flex'>
													<FontAwesomeIcon
														icon={faCopy}
														className='fs-2 me-2 text-success'
													/>
													{product._id}
												</div>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<img
													src={`https://files.fggroup.in/` + product.display_image}
													alt={product.name}
													style={{ width: '80px', height: '80px', borderRadius: '10px' }}
												/>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{product.name}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{product.description}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{product.unit}
											</span>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong> {product.book_title}
													<br />
													<strong>{sortableFields[2].title}: </strong> ₹ {product.amount}
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
					{productData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{productData.length > 0 && (
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

export default GMPharmacyProductList
