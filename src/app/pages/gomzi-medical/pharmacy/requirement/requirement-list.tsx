import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import SelectField from '../../../../components/SelectField'
import UsersListPagination from '../../../../components/TablePagination'
import { GetMedicalProductRequirement } from '../../../../Functions/FGGroup'

const GMPharmacyRequirementList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [cartDataWithUser, setCartDataWithUser] = useState<any[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)
	const [itemType, setItemType] = useState<any>({ item_type: 'MEDICAL_PRODUCT' })

	const fetchCartData = async () => {
		setLoading(true)
		try {
			const response = await GetMedicalProductRequirement(itemType)

			let filteredData: any = response.data

			filteredData?.sort((a: any, b: any) => {
				const dateA = new Date(a.createdAt)
				const dateB = new Date(b.createdAt)
				return dateB.getTime() - dateA.getTime()
			})

			setCartDataWithUser(filteredData)
		} catch (error) {
			console.error('Error fetching cart data:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchCartData()
	}, [itemType])

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value }))
	}

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		if (value == 'Fitness Course') {
			setItemType({ ...itemType, [name]: 'FITNESS_COURSE' })
		} else if (value == 'Books') {
			setItemType({ ...itemType, [name]: 'BOOKS' })
		} else {
			setItemType({ ...itemType, [name]: value })
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Requirement</PageTitle>
			<KTCard>
				<div className='row justify-content-between mx-3 m-5'>
					<div className='col-md-4 pt-1 d-flex align-items-end'>
						<LengthMenu
							expenseData={cartDataWithUser}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='col-md-8'>
						<div className='row align-items-end justify-content-between'>
							<div className='col'>
							</div>
							<div className='col-md-4 d-flex justify-content-end'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
							</div>
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
									<th>Disease</th>
									<th>Requirement</th>
									<th>Date</th>
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
									cartDataWithUser
										.sort((a, b) => {
											const dateA = new Date(a.createdAt)
											const dateB = new Date(b.createdAt)
											return dateB.getTime() - dateA.getTime()
										})
										.map((data: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark ms-6 fw-bold  mb-1 fs-6'>{actualIndex}</span>
													</td>
													<td>
														<div className='d-flex align-items-center'>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold  fs-6'>
																	{data?.user_id
																		? `${data?.user_id?.first_name || 'Deleted User'} ${
																				data?.user_id?.last_name || ''
																		  }`
																		: 'Deleted User'}
																</span>
																<span className='text-muted fw-semibold d-block fs-7'>
																	{data?.user_id
																		? `${data?.user_id?.country_code || ''} ${
																				data?.user_id?.mobile || ''
																		  }`
																		: 'N/A'}
																</span>
																<span className='text-muted fw-semibold d-block fs-7'>
																	{data?.user_id?.email || 'N/A'}
																</span>
															</div>
														</div>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>{data.disease}</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>{data.requirement}</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														</span>
													</td>
												</tr>
											)
										})
								)}
							</tbody>
						</table>
					</div>
					{cartDataWithUser?.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{cartDataWithUser?.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(cartDataWithUser.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default GMPharmacyRequirementList
