import React, { useEffect, useRef, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import { GetExercisePlan } from '../../../Functions/FWG'

const ExerciseApprove: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [approveData, setApproveData] = useState([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [metaData, setMetaData] = useState<any>()
	const [loading, setLoading] = useState(false)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	// const filteredFoodTimeData = approveData.filter((foodtime: any) =>
	// 	foodtime.user?.firstName.toLowerCase().includes(searchTerm.toLowerCase())
	// )
	// const paginatedFoodTimeData = filteredFoodTimeData.slice(
	// 	(pagination.page - 1) * pagination.itemsPerPage,
	// 	pagination.page * pagination.itemsPerPage
	// )

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const exercisePlanResponse: any = await GetExercisePlan({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const metaData: any = exercisePlanResponse.metadata
			setMetaData(metaData.pagination)

			const data = exercisePlanResponse.data
			const userApprove = data.map((item: any) => item.user_assign_exercise).flat()
			const filteredData: any = userApprove.filter((item: any) => !item.is_active)
			setApproveData(filteredData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

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

	const sortableFields = [
		{ title: 'User', field: 'firstName' },
		{ title: 'Live Meeting Time', field: 'live_meeting_time' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Exercise Details</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<TableSort
								sortableFields={sortableFields}
								sort={sort}
								sortOrder={sortOrder}
								onSortChange={handleSortChange}
							/>
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
									approveData.map((data: any, index: number) => (
										<tr key={index}>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{index + 1}
												</span>
											</td>
											<td>
												<div className='d-flex align-items-center'>
													<div className='symbol symbol-45px me-5'>
														<img
															src={data.user?.profile_image || '/media/avatars/300-1.jpg'}
															alt={data.username}
															className='fs-3 text-primary'
															style={{ width: '55px', height: '55px', borderRadius: '20%' }}
														/>
													</div>
													<div className='d-flex justify-content-start flex-column'>
														<span className='text-dark fw-bold  fs-6'>
															{data.user?.firstName + ' ' + data.user?.lastName || 'N/A'}
														</span>
														<span className='text-muted fw-semibold text-muted d-block fs-7'>
															{data.user?._id}
														</span>
													</div>
												</div>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.live_meeting_time || 'N/A'}
												</span>
											</td>
											<td>
												<TableButton
													action='view'
													to={`/fwg/add-exercise-plan?exercise_plan_id=${data.exercise_plan_id}&exercise_approve=true`}
													text='View Plan'
													backgroundDark={true}
												/>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
					{approveData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{approveData.length > 0 && (
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

export default ExerciseApprove
