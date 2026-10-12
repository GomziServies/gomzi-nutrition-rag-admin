import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetProduct, GetReferralCouponUsage } from '../../../Functions/FGGroup'

const Reference: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const coupon_id: string | any = searchParams.get('id')
	const coupon_discount: string | any = searchParams.get('coupon_discount')
	const [searchTerm, setSearchTerm] = useState('')
	const [referenceData, setReferenceData] = useState<any>([])
	const [discountPercentage, setDiscountPercentage] = useState<number>(0)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)
	const [productData, setProductData] = useState<{ [key: string]: any }>({})

	const fetchUserData = async () => {
		setLoading(true)
		try {
			const response: any = await GetReferralCouponUsage({ coupon_id: coupon_id })
			const filteredData: any = response.data[0]
			const order = filteredData.orders
			setReferenceData(order)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const getProductData = async (id: string) => {
		if (!productData[id]) {
			setLoading(true)
			try {
				const response: any = await GetProduct({ id })
				const filteredData: any = response.data[0]
				setProductData((prevData) => ({
					...prevData,
					[id]: filteredData,
				}))
			} catch (error) {
				console.error(error)
			}
			setLoading(false)
		}
	}

	useEffect(() => {
		if (coupon_discount) {
			setDiscountPercentage(parseFloat(coupon_discount))
		}
	}, [coupon_discount])

	useEffect(() => {
		fetchUserData()
	}, [])

	useEffect(() => {
		referenceData.forEach((data: any) => {
			getProductData(data.order_item_id)
		})
	}, [referenceData])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredData = referenceData.filter((data: any) =>
		data.order_item_type.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedData = filteredData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const calculateDiscountedAmount = (price: number, discount: number) => {
		return price - (price * discount) / 100
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Reference</PageTitle>
			<KTCard>
				<div className='row'>
					<div className='col-12'>
						<div className='d-flex align-items-center justify-content-end mt-5'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>User</th>
									<th>Mobile</th>
									<th>Discount Amount</th>
									<th>Paid Amount</th>
									<th>Module</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									paginatedData
										.slice()
										.reverse()
										.map((data: any, index: number) => (
											<tr key={data.no}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>{index + 1}</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data?.user?.first_name + ' ' + data?.user?.last_name || 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data?.user?.mobile}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														₹
														{(
															(productData[data.order_item_id]?.price * discountPercentage) /
															100
														).toFixed(2)}
														/-
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														₹
														{calculateDiscountedAmount(
															productData[data.order_item_id]?.price,
															discountPercentage
														).toFixed(2)}
														/-
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.order_item_type}
													</span>
												</td>
												<td>
													<TableButton
														action='view'
														to={'/rag/all-order/view-order?order_id=' + data._id}
													/>
												</td>
											</tr>
										))
								)}
							</tbody>
						</table>
					</div>
					{referenceData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{referenceData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(referenceData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}
export default Reference
