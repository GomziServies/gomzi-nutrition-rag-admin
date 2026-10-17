import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import {
	AddManagerRating,
	GetManagerRatings,
	UpdateManagerRating,
} from '../../../Functions/FGGroup/Team'

const KRAs = [
	{ id: 'productivity', label: 'Productivity', max: 15 },
	{ id: 'organizational_skills', label: 'Organizational Skills', max: 15 },
	{ id: 'attendance_punctuality', label: 'Attendance & Punctuality', max: 10 },
	{ id: 'communications', label: 'Communications', max: 10 },
	{ id: 'initiatives', label: 'Initiatives', max: 10 },
	{ id: 'cooperation', label: 'Cooperation', max: 10 },
	{ id: 'interpersonal_relations', label: 'Interpersonal Relations', max: 10 },
	{ id: 'specific_job_skills', label: 'Specific Job Skills', max: 10 },
	{ id: 'judgment', label: 'Judgment', max: 5 },
	{ id: 'dependability', label: 'Dependability', max: 5 },
]

interface KraScores {
	productivity: number | string
	organizational_skills: number | string
	attendance_punctuality: number | string
	communications: number | string
	initiatives: number | string
	cooperation: number | string
	interpersonal_relations: number | string
	specific_job_skills: number | string
	judgment: number | string
	dependability: number | string
}

const ManagerRatingView: React.FC = () => {
	const [searchParams] = useSearchParams()
	const managerId = searchParams.get('id')
	const navigate = useNavigate()

	const [searchTerm, setSearchTerm] = useState('')
	const [ratings, setRatings] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [managerName, setManagerName] = useState('Manager')
	const [showModal, setShowModal] = useState(false)
	const [remarks, setRemarks] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [showViewModal, setShowViewModal] = useState(false)
	const [selectedRating, setSelectedRating] = useState<any>(null)
	const [isEditing, setIsEditing] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)

	const [kraScores, setKraScores] = useState<KraScores>({
		productivity: '',
		organizational_skills: '',
		attendance_punctuality: '',
		communications: '',
		initiatives: '',
		cooperation: '',
		interpersonal_relations: '',
		specific_job_skills: '',
		judgment: '',
		dependability: '',
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		const now = new Date()
		const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
		return [start, end]
	})
	const [totalItems, setTotalItems] = useState(0)

	const fetchManagerInfo = async () => {
		if (!managerId) return
		try {
			const res: any = await GetEmployees()
			const manager = res.data?.find((emp: any) => emp._id === managerId)
			if (manager) {
				setManagerName(manager.full_name)
			}
		} catch (error) {
			console.error(error)
		}
	}

	const fetchRatings = async () => {
		if (!managerId) return
		setLoading(true)
		try {
			let start_date: string | undefined
			let end_date: string | undefined

			if (selectedDateRange) {
				const start = selectedDateRange[0]
				const end = selectedDateRange[1]
				start_date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
					2,
					'0'
				)}-${String(start.getDate()).padStart(2, '0')}`
				end_date = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(
					end.getDate()
				).padStart(2, '0')}`
			}

			const response: any = await GetManagerRatings({
				manager_id: managerId,
				start_date: start_date,
				end_date: end_date,
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort: sort,
				sortOrder: sortOrder,
			})
			if (response.status === 200 || response.data) {
				setRatings(response.data || [])
				if (response.metadata?.pagination) {
					setTotalItems(response.metadata.pagination.totalDocs)
				}
			}
		} catch (error) {
			console.error('Error fetching ratings:', error)
			toast.error('Failed to load ratings')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchManagerInfo()
	}, [managerId])

	useEffect(() => {
		fetchRatings()
	}, [managerId, pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedDateRange])

	const handleSubmitRating = async () => {
		if (!managerId) return

		const hasEmptyScores = Object.values(kraScores).some((score) => score === '')
		if (hasEmptyScores) {
			toast.error('Please enter marks obtained for all KRAs')
			return
		}

		setSubmitting(true)
		try {
			const payload: any = {
				kra_scores: Object.fromEntries(
					Object.entries(kraScores).map(([key, value]) => [key, Number(value) || 0])
				),
				remarks: remarks,
			}

			let response: any
			if (isEditing && editId) {
				payload.id = editId
				response = await UpdateManagerRating(payload)
			} else {
				payload.manager_id = managerId
				response = await AddManagerRating(payload)
			}

			if (response.status === 200 || response.status === 201 || response.data) {
				toast.success(`Rating ${isEditing ? 'updated' : 'added'} successfully`)
				handleCloseModal()
				fetchRatings()
			}
		} catch (error) {
			console.error(`Error saving rating:`, error)
			toast.error(`Failed to ${isEditing ? 'update' : 'add'} rating`)
		} finally {
			setSubmitting(false)
		}
	}

	const handleEdit = (rating: any) => {
		setIsEditing(true)
		setEditId(rating._id)
		setKraScores({
			productivity: rating.kra_scores?.productivity ?? '',
			organizational_skills: rating.kra_scores?.organizational_skills ?? '',
			attendance_punctuality: rating.kra_scores?.attendance_punctuality ?? '',
			communications: rating.kra_scores?.communications ?? '',
			initiatives: rating.kra_scores?.initiatives ?? '',
			cooperation: rating.kra_scores?.cooperation ?? '',
			interpersonal_relations: rating.kra_scores?.interpersonal_relations ?? '',
			specific_job_skills: rating.kra_scores?.specific_job_skills ?? '',
			judgment: rating.kra_scores?.judgment ?? '',
			dependability: rating.kra_scores?.dependability ?? '',
		})
		setRemarks(rating.remarks || '')
		setShowModal(true)
	}

	const handleCloseModal = () => {
		if (submitting) return
		setShowModal(false)
		setIsEditing(false)
		setEditId(null)
		setKraScores({
			productivity: '',
			organizational_skills: '',
			attendance_punctuality: '',
			communications: '',
			initiatives: '',
			cooperation: '',
			interpersonal_relations: '',
			specific_job_skills: '',
			judgment: '',
			dependability: '',
		})
		setRemarks('')
	}

	const handleViewDetail = (id: string) => {
		const rating = ratings.find((r) => r._id === id)
		if (rating) {
			setSelectedRating(rating)
			setShowViewModal(true)
		}
	}

	const handleScoreChange = (id: string, val: string, max: number) => {
		if (val === '') {
			setKraScores((prev) => ({ ...prev, [id]: '' }))
			return
		}
		const numericVal = parseInt(val)
		const score = Math.min(Math.max(0, numericVal), max)
		setKraScores((prev) => ({ ...prev, [id]: score }))
	}

	const renderStars = (score: number) => {
		const val = (score / 100) * 5
		const roundedVal = Math.round(val * 2) / 2
		const stars = []
		for (let i = 1; i <= 5; i++) {
			if (i <= roundedVal) {
				stars.push(
					<i
						key={i}
						className='bi bi-star-fill text-warning fs-5'></i>
				)
			} else if (i - 0.5 === roundedVal) {
				stars.push(
					<i
						key={i}
						className='bi bi-star-half text-warning fs-5'></i>
				)
			} else {
				stars.push(
					<i
						key={i}
						className='bi bi-star text-warning fs-5'></i>
				)
			}
		}
		return (
			<div
				className='d-flex align-items-center'
				style={{ minWidth: '150px' }}>
				<div className='me-2 d-flex gap-1'>{stars}</div>
				<span className='fw-bold text-dark fs-7'>{val.toFixed(1)} / 5</span>
			</div>
		)
	}

	const totalScore = KRAs.reduce(
		(acc, kra) => acc + (Number(kraScores[kra.id as keyof KraScores]) || 0),
		0
	)

	const paginatedData = ratings.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const avgScore =
		ratings.length > 0
			? (
					ratings.reduce((acc, curr) => acc + (curr.total_score || curr.rating * 20), 0) /
					ratings.length
			  ).toFixed(1)
			: '0.0'

	return (
		<>
			<PageTitle breadcrumbs={[]}>{`Rating: ${managerName}`}</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<div className='d-flex align-items-center gap-2'>
						<h2 className='text-gray-900 fw-bold fs-2 m-0'>Rating: {managerName}</h2>
						{ratings.length > 0 && (
							<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
								{totalItems || ratings.length} Scorecards
							</span>
						)}
					</div>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Track KRA scorecards, remarks and performance trends for this manager
					</span>
				</div>
				<Link
					to='/hr/team-management'
					className='btn btn-sm d-inline-flex align-items-center gap-2 gz-back-btn'>
					<i className='bi bi-arrow-left fs-6'></i>
					<span className='fw-semibold'>Back to Team Management</span>
				</Link>
			</div>

			{/* Filter Toolbar (Order: Search -> LengthMenu -> DownloadExcel -> Filters -> Date -> Right Action) */}
			<div
				className='card shadow-sm border-0 mb-6 gz-filter-card'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3 w-100'>
					<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
						{/* 1. Searchbar */}
						<div style={{ minWidth: '220px', maxWidth: '340px', flex: '1 1 220px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search remarks, score...'
								className='me-0'
							/>
						</div>

						{/* 2. Page Size */}
						<div>
							<LengthMenu
								expenseData={ratings}
								itemsPerPage={pagination.itemsPerPage}
								handleItemsPerPageChange={(pageSize) =>
									setPagination((prev) => ({ ...prev, itemsPerPage: pageSize, page: 1 }))
								}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<DownloadExcelButton
								data={ratings}
								columns={[
									{ title: 'Total Score', field: 'total_score' },
									{ title: 'Remarks', field: 'remarks' },
									{ title: 'Rating', field: 'rating' },
									{ title: 'Date', field: 'createdAt' },
								]}
								filename='Manager_Ratings'
							/>
						</div>

						{/* 4. Date Filter */}
						<div>
							<DateFilter
								onDateRangeChange={(range) => {
									setSelectedDateRange(range)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}
								rightValue='0'
							/>
						</div>
					</div>

					{/* 6. End me right side Add Rating Button */}
					<div className='flex-shrink-0 ms-auto'>
						<Button
							variant='primary'
							className='fw-bold px-4 d-flex align-items-center gap-2'
							style={{ height: '38px', borderRadius: '8px' }}
							onClick={() => {
								setIsEditing(false)
								setShowModal(true)
							}}>
							<FontAwesomeIcon icon={faPlus} className='fs-6 text-white' />
							<span>Add Rating</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
				<Table
					data={ratings}
					columns={[
						{ title: 'Total Score', field: 'total_score' },
						{ title: 'Remarks', field: 'remarks' },
						{ title: 'Rating', field: 'rating' },
						{ title: 'Date', field: 'createdAt' },
					]}
					loading={loading}
					pagination={pagination}
					setPagination={setPagination}
					sort={sort}
					sortOrder={sortOrder}
					onSortChange={(f, o) => {
						setSort(f)
						setSortOrder(o as any)
					}}
					visibleDetails={visibleDetails}
					renderRow={(rating: any, index: number, actualIndex: number, isVisible: boolean) => {
						const score = rating.total_score || rating.rating * 20
						return (
							<React.Fragment key={rating._id}>
								<tr
									className='data-row'
									onClick={() =>
										setVisibleDetails(visibleDetails === rating._id ? null : rating._id)
									}>
									<td>
										<span className='text-dark fw-bold mb-1 fs-6 ps-4'>{actualIndex}</span>
									</td>
									<td>
										<span className='badge badge-light-primary fs-6 fw-bold px-4 py-2 border border-primary border-opacity-10'>
											{score} / 100
										</span>
									</td>
									<td>
										<span
											className='text-dark fw-semibold fs-6'
											title={rating.remarks}
											style={{
												maxWidth: '300px',
												display: 'block',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}>
											{rating.remarks || '-'}
										</span>
									</td>
									<td>{renderStars(score)}</td>
									<td>
										<div className='d-flex flex-column'>
											<span className='text-dark fw-bold mb-1 fs-6'>
												{DayJS(rating.createdAt).format('DD MMM YYYY')}
											</span>
											<span className='text-muted fs-7'>
												{DayJS(rating.createdAt).format('hh:mm A')}
											</span>
										</div>
									</td>
									<td>
										<div className='d-flex gap-2'>
											<TableButton
												action='view'
												onClick={(e) => {
													e.stopPropagation()
													handleViewDetail(rating._id)
												}}
											/>
											<TableButton
												action='edit'
												onClick={(e) => {
													e.stopPropagation()
													handleEdit(rating)
												}}
											/>
										</div>
									</td>
								</tr>
								{/* Removed KRA Breakdown Row */}
							</React.Fragment>
						)
					}}
				/>
				{!loading && ratings.length === 0 && (
					<div className='d-flex flex-column align-items-center justify-content-center text-center py-20 px-5'>
						<div
							className='d-flex align-items-center justify-content-center mb-5'
							style={{
								width: '64px',
								height: '64px',
								borderRadius: '16px',
								background: '#F8FAFD',
								border: '1px dashed #CBD5E1',
							}}>
							<i className='bi bi-clipboard-data fs-2x text-gray-400'></i>
						</div>
						<h4 className='fw-bold text-gray-800 mb-2'>No Rating Data</h4>
						<p className='text-muted fs-7 fw-semibold mb-0' style={{ maxWidth: '360px' }}>
							Record the first scorecard for this manager to see performance trends.
						</p>
					</div>
				)}
				{ratings.length > 0 && (
					<UsersListPagination
						totalPages={Math.ceil(totalItems / pagination.itemsPerPage) || 1}
						currentPage={pagination.page}
						onPageChange={(p) => setPagination({ ...pagination, page: p })}
						totalRecords={totalItems || ratings.length}
						itemsPerPage={pagination.itemsPerPage}
					/>
				)}
			</div>

			<Modal
				show={showModal}
				onHide={handleCloseModal}
				centered
				size='lg'
				contentClassName='border-0'
				style={{ borderRadius: '16px' }}>
				<Modal.Header
					closeButton={!submitting}
					className='px-8 pt-6 pb-5'
					style={{ background: '#F8FAFD', borderBottom: '1px solid #E4EAF2' }}>
					<div className='d-flex align-items-center'>
						<div
							className='d-flex align-items-center justify-content-center me-3'
							style={{
								width: '40px',
								height: '40px',
								borderRadius: '10px',
								background: '#EAF1F8',
								color: '#1E4F8A',
							}}>
							<i className='bi bi-star-fill fs-5'></i>
						</div>
						<div>
							<Modal.Title className='fs-4 fw-bold text-gray-900 m-0'>
								{isEditing ? 'Edit Scorecard Rating' : 'Scorecard Rating'}
							</Modal.Title>
							<span className='text-muted fs-7 fw-semibold'>
								Enter marks obtained for each KRA (Total 100)
							</span>
						</div>
					</div>
				</Modal.Header>
				<Modal.Body className='py-6 px-8'>
					<Form>
						<div
							className='table-responsive mb-6'
							style={{ border: '1px solid #E4EAF2', borderRadius: '12px', overflow: 'hidden' }}>
							<table className='table align-middle g-0 m-0'>
								<thead>
									<tr
										className='fw-bold fs-7 text-uppercase'
										style={{
											background: '#F8FAFD',
											color: '#71809A',
											borderBottom: '1px solid #E4EAF2',
										}}>
										<th
											className='ps-4 py-4 border-end'
											style={{ width: '80px' }}>
											SR NO
										</th>
										<th className='ps-4 py-4 border-end'>KEY RESULT AREAS</th>
										<th
											className='text-center py-4 border-end'
											style={{ width: '120px' }}>
											MAX. MARKS
										</th>
										<th
											className='text-center py-4'
											style={{ width: '150px' }}>
											MARKS OBTAINED
										</th>
									</tr>
								</thead>
								<tbody>
									{KRAs.map((kra, index) => (
										<tr
											key={kra.id}
											className='fs-6'
											style={{ borderBottom: '1px solid #EEF2F6' }}>
											<td className='ps-4 fw-bold border-end py-3'>{index + 1}</td>
											<td className='ps-4 fw-semibold text-gray-800 border-end py-3'>
												{kra.label}
											</td>
											<td
												className='text-center fw-bold border-end py-3'
												style={{ backgroundColor: '#F8FAFD' }}>
												{kra.max}
											</td>
											<td className='p-0'>
												<Form.Control
													type='number'
													className='form-control-flush text-center fw-bold text-dark fs-5 py-3 border-0'
													value={kraScores[kra.id as keyof KraScores]}
													onChange={(e) => handleScoreChange(kra.id, e.target.value, kra.max)}
													placeholder='0'
													style={{ backgroundColor: '#fff' }}
												/>
											</td>
										</tr>
									))}
									{/* Total Row */}
									<tr className='fw-bold fs-5' style={{ background: '#F8FAFD' }}>
										<td
											colSpan={2}
											className='ps-4 py-4 text-end pe-10 text-gray-900'>
											TOTAL
										</td>
										<td
											className='text-center py-4 border-start border-end fw-bold'
											style={{ backgroundColor: '#EEF2F6' }}>
											100
										</td>
										<td
											className='text-center py-4 text-dark fw-bold'
											style={{ backgroundColor: '#EAF1F8' }}>
											{totalScore}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div className='fv-row'>
							<label htmlFor='kra-remarks' className='form-label fw-bold fs-7 mb-2'>Remarks</label>
							<Form.Control
								id='kra-remarks'
								as='textarea'
								rows={3}
								className='form-control bg-white'
								style={{ border: '1px solid #E4EAF2', borderRadius: '8px', fontSize: '13px' }}
								placeholder='Enter Remarks...'
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
							/>
						</div>
					</Form>
				</Modal.Body>
				<Modal.Footer className='px-8 pb-6 pt-0 border-0'>
					<Button
						variant='light'
						className='fw-bold px-5'
						style={{ borderRadius: '8px', height: '38px' }}
						onClick={handleCloseModal}
						disabled={submitting}>
						Cancel
					</Button>
					<Button
						variant='primary'
						className='px-8 fw-bold'
						style={{ borderRadius: '8px', height: '38px' }}
						onClick={handleSubmitRating}
						disabled={submitting}>
						{submitting ? (
							<>
								<Spinner
									animation='border'
									size='sm'
									className='me-2'
								/>
								{isEditing ? 'Updating...' : 'Saving...'}
							</>
						) : isEditing ? (
							'Update Rating'
						) : (
							'Save Rating'
						)}
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Detail View Modal */}
			<Modal
				show={showViewModal}
				onHide={() => setShowViewModal(false)}
				centered
				size='lg'
				contentClassName='border-0'
				style={{ borderRadius: '16px' }}>
				<Modal.Header
					closeButton
					className='px-8 pt-6 pb-5'
					style={{ background: '#F8FAFD', borderBottom: '1px solid #E4EAF2' }}>
					<div className='d-flex align-items-center'>
						<div
							className='d-flex align-items-center justify-content-center me-3'
							style={{
								width: '40px',
								height: '40px',
								borderRadius: '10px',
								background: '#FFF8EC',
								color: '#A46A13',
							}}>
							<i className='bi bi-clipboard-data fs-5'></i>
						</div>
						<div>
							<Modal.Title className='fs-4 fw-bold text-gray-900 m-0'>Rating Details</Modal.Title>
							<span className='text-muted fs-7 fw-semibold'>
								KRA breakdown for {managerName}
							</span>
						</div>
					</div>
				</Modal.Header>
				<Modal.Body className='py-6 px-8'>
					{selectedRating && (
						<>
							<div
								className='table-responsive mb-6'
								style={{ border: '1px solid #E4EAF2', borderRadius: '12px', overflow: 'hidden' }}>
								<table className='table align-middle g-0 m-0'>
									<thead>
										<tr
											className='fw-bold fs-7 text-uppercase'
											style={{
												background: '#F8FAFD',
												color: '#71809A',
												borderBottom: '1px solid #E4EAF2',
											}}>
											<th
												className='ps-4 py-4 border-end'
												style={{ width: '80px' }}>
												SR NO
											</th>
											<th className='ps-4 py-4 border-end'>KEY RESULT AREAS</th>
											<th
												className='text-center py-4 border-end'
												style={{ width: '120px' }}>
												MAX. MARKS
											</th>
											<th
												className='text-center py-4'
												style={{ width: '150px' }}>
												MARKS OBTAINED
											</th>
										</tr>
									</thead>
									<tbody>
										{KRAs.map((kra, index) => {
											const score = Number(selectedRating.kra_scores?.[kra.id]) || 0
											return (
												<tr
													key={kra.id}
													className='fs-6'
													style={{ borderBottom: '1px solid #EEF2F6' }}>
													<td className='ps-4 fw-bold border-end py-3'>{index + 1}</td>
													<td className='ps-4 fw-semibold text-gray-800 border-end py-3'>
														{kra.label}
													</td>
													<td
														className='text-center fw-bold border-end py-3'
														style={{ backgroundColor: '#F8FAFD' }}>
														{kra.max}
													</td>
													<td className='text-center fw-bold text-dark py-3'>{score}</td>
												</tr>
											)
										})}
										<tr className='fw-bold fs-5' style={{ background: '#F8FAFD' }}>
											<td
												colSpan={2}
												className='ps-4 py-4 text-end pe-10 text-gray-900'>
												TOTAL
											</td>
											<td className='text-center py-4 border-start border-end'>100</td>
											<td className='text-center py-4 text-dark'>
												{selectedRating.total_score ||
													Object.values(selectedRating.kra_scores || {}).reduce(
														(a: any, b: any) => a + (Number(b) || 0),
														0
													)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div
								className='p-5 mb-2'
								style={{
									background: '#F8FAFD',
									border: '1px solid #EEF2F6',
									borderRadius: '12px',
								}}>
								<span className='form-label fw-bold fs-7 mb-2 d-block'>Remarks</span>
								<div className='text-dark fs-6 fw-semibold'>
									{selectedRating.remarks || 'No remarks provided.'}
								</div>
							</div>
						</>
					)}
				</Modal.Body>
			</Modal>
		</>
	)
}

export default ManagerRatingView
