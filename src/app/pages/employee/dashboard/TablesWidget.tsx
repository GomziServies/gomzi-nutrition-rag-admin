/* eslint-disable jsx-a11y/anchor-is-valid */
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { GetTask, UpdateTask } from '../../../Functions/FGGroup/TaskManagement'
import errorImg from './fixed-404.jpg'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type Props = {
	className: string
}

const TablesWidget: React.FC<Props> = ({ className }) => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employeeId: any = searchParams.get('employeeId')
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	let employeeData: any = localStorage.getItem('fg_group_info')
	employeeData = JSON.parse(employeeData)
	const isFirstRender = useRef(true);
	

	const fetchAssignTaskData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetTask({
				task_id: employeeId,
				admin_id: employeeData._id,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			let filteredData: any = response.data
			setAssignTaskData(filteredData)
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchAssignTaskData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedEmployee])

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchAssignTaskData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const sortableFields = [
		{ title: 'Task', field: 'task_title' },
		{ title: 'Remark', field: 'remarks' },
		{ title: 'File', field: 'file_url' },
		{ title: 'Deadline', field: 'end_date' },
		{ title: 'Status', field: 'status' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const notify = (task_id: any) =>
		Swal.fire({
			icon: 'warning',
			title: 'Are you sure?',
			text: 'Once Completed, you will not be able to undo!',
			showCancelButton: true,
			confirmButtonText: 'Ok',
		}).then(async (result) => {
			if (result.isConfirmed) {
				const payload: any = {
					task_id,
					status: 'COMPLETED',
				}
				await UpdateTask(payload)
					.then(() => {
						toast.success('Task Complete Successfully')
						fetchAssignTaskData()
					})
					.catch((error: any) => {
						toast.error(error.message)
					})
			}
		})

	return (
		<div
			className={`card ${className}`}
			style={{ height: '524px' }}>
			<div className='card-header border-0 pt-5'>
				<h3 className='card-title align-items-start flex-column'>
					<span className='card-label fw-bold fs-3 mb-1'>Employee Task</span>
				</h3>
			</div>
			<div
				className='card-body py-3'
				style={{ maxHeight: '430px', overflowY: 'auto' }}>
				<div className='table-responsive'>
					<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
						<thead>
							<tr className='fw-bold text-muted'>
								<th>No.</th>
								<th>Task</th>
								<th>Remark</th>
								<th>Deadline</th>
								<th className='text-center'>Actions</th>
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
								assignTaskData
									.slice()
									.reverse()
									.map((task: any, index: any) => (
										<tr key={task.id}>
											<td>
												<div className='form-check form-check-sm form-check-custom form-check-solid'>
													{index + 1}
												</div>
											</td>
											<td>
												<div className='d-flex align-items-center'>
													<div className='d-flex justify-content-start flex-column'>
														<div className='text-dark fw-bold text-hover-primary fs-6'>
															{task.task_title}
														</div>
													</div>
												</div>
											</td>
											<td>
												<div className='text-dark fw-bold text-hover-primary d-block fs-6'>
													{task.remarks}
												</div>
											</td>
											<td>
												<div className='text-dark fw-bold text-hover-primary d-block fs-6'>
													{DayJS(task.end_date).format('DD/MM/YYYY hh:mm:ss A')}
												</div>
											</td>
											<td align='center'>
												<div className='d-flex justify-content-center flex-shrink-0'>
													{task.status == 'COMPLETED' ? (
														<b className='text-muted text-center'>Already Complete</b>
													) : (
														<div
															className='btn btn-success btn-sm me-1'
															onClick={() => notify(task.id)}>
															<FontAwesomeIcon icon={faCheck} />
														</div>
													)}
												</div>
											</td>
										</tr>
									))
							)}
						</tbody>
					</table>
				</div>
				{assignTaskData.length === 0 && !loading && (
					<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center mt-5'>
						<div>
							<img
								src={errorImg}
								alt='demo'
								width='40%'
							/>
						</div>
						<h5>No data found</h5>
					</div>
				)}
			</div>
		</div>
	)
}

export { TablesWidget }
