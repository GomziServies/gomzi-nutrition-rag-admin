import React, { useEffect, useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	AddManagerRating,
	GetManagerRatings,
	GetTeams,
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

const TeamRatingView: React.FC = () => {
	const [searchParams] = useSearchParams()
	const managerId = searchParams.get('id')
	const teamId = searchParams.get('team_id')
	const navigate = useNavigate()

	const [ratings, setRatings] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [teamName, setTeamName] = useState('Team')
	const [teamMembers, setTeamMembers] = useState<any[]>([])
	const [showModal, setShowModal] = useState(false)
	const [remarks, setRemarks] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [showViewModal, setShowViewModal] = useState(false)
	const [selectedRating, setSelectedRating] = useState<any>(null)
	const [isEditing, setIsEditing] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)

	// Target Selection State
	const [ratingTarget, setRatingTarget] = useState<'team' | 'member' | 'leader'>('team')
	const [selectedMemberId, setSelectedMemberId] = useState('')
	const [teamLeader, setTeamLeader] = useState<{ id: string; name: string } | null>(null)

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
	const [stats, setStats] = useState({
		teamAvg: 0,
		leaderAvg: 0,
		memberAvg: 0,
	})

	const fetchTeamInfo = async () => {
		if (!teamId) return
		try {
			const res: any = await GetTeams({ id: teamId || undefined })
			const team = Array.isArray(res.data) ? res.data[0] : res.data
			if (team) {
				setTeamName(team.position || 'Team')
				setTeamMembers(team.members || [])
				if (team.leader_id) {
					setTeamLeader({
						id: team.leader_id._id || team.leader_id,
						name: team.leader_id.full_name || 'Leader',
					})
				}
			}
		} catch (error) {
			console.error('Error fetching team info:', error)
		}
	}

	const fetchRatings = async () => {
		if (!teamId) return
		setLoading(true)
		try {
			let start_date: string | undefined
			let end_date: string | undefined

			if (selectedDateRange) {
				const [start, end] = selectedDateRange
				start_date = DayJS(start).format('YYYY-MM-DD')
				end_date = DayJS(end).format('YYYY-MM-DD')
			}

			const response: any = await GetManagerRatings({
				team_id: teamId || undefined,
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

	const calculateStats = async () => {
		if (!teamId) return
		try {
			// Fetch all ratings for this team to calculate averages (limit 1000 for stats)
			const response: any = await GetManagerRatings({
				team_id: teamId,
				limit: 1000,
			})
			if (response.status === 200 || response.data) {
				const allRatings = response.data || []
				const teamRatings = allRatings.filter((r: any) => r.type === 'team')
				const leaderRatings = allRatings.filter((r: any) => r.type === 'leader')
				const memberRatings = allRatings.filter((r: any) => r.type === 'member')

				const getAvg = (list: any[]) => {
					if (list.length === 0) return 0
					const sum = list.reduce((acc, r) => acc + (r.total_score || r.rating * 20 || 0), 0)
					return (sum / list.length / 100) * 5
				}

				setStats({
					teamAvg: getAvg(teamRatings),
					leaderAvg: getAvg(leaderRatings),
					memberAvg: getAvg(memberRatings),
				})
			}
		} catch (error) {
			console.error('Error calculating stats:', error)
		}
	}

	useEffect(() => {
		fetchTeamInfo()
	}, [teamId])

	useEffect(() => {
		fetchRatings()
		calculateStats()
	}, [teamId, pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedDateRange])

	const handleSubmitRating = async () => {
		if (!managerId || !teamId) return

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
				payload.team_id = teamId
				payload.type = ratingTarget
				if (ratingTarget === 'member' && selectedMemberId) {
					payload.member_id = selectedMemberId
				} else if (ratingTarget === 'leader' && teamLeader) {
					payload.member_id = teamLeader.id
				}
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
		setSelectedMemberId('')
		setRatingTarget('team')
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>{`Team Rating: ${teamName}`}</PageTitle>

			<KTCard>
				<div className='row g-5 mx-5 my-3'>
					<div className='col-xl-4'>
						<div
							className='card h-100 card-dashed shadow-none flex-row align-items-center p-6'
							style={{
								border: '1.5px dashed #3b82f6',
								background: 'rgba(59, 130, 246, 0.03)',
								borderRadius: '12px',
							}}>
							<div className='flex-grow-1'>
								<span className='text-black fw-bold fs-6 d-block mb-2'>{teamName} (Team)</span>
								<div className='d-flex align-items-center'>
									<span className='fs-1 fw-boldest text-gray-900 me-2'>
										{stats.teamAvg.toFixed(1)}
									</span>
									<i className='bi bi-star-fill text-warning fs-3'></i>
								</div>
							</div>
							<div
								className='symbol symbol-50px rounded d-flex align-items-center justify-content-center h-50px w-50px'
								style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
								<i
									className='bi bi-people-fill fs-1'
									style={{ color: '#3b82f6' }}></i>
							</div>
						</div>
					</div>

					<div className='col-xl-4'>
						<div
							className='card h-100 card-dashed shadow-none flex-row align-items-center p-6'
							style={{
								border: '1.5px dashed #10b981',
								background: 'rgba(16, 185, 129, 0.03)',
								borderRadius: '12px',
							}}>
							<div className='flex-grow-1'>
								<span className='text-black fw-bold fs-6 d-block mb-2'>
									{teamLeader?.name || 'Leader'} (Team Leader)
								</span>
								<div className='d-flex align-items-center'>
									<span className='fs-1 fw-boldest text-gray-900 me-2'>
										{stats.leaderAvg.toFixed(1)}
									</span>
									<i className='bi bi-star-fill text-warning fs-3'></i>
								</div>
							</div>
							<div
								className='symbol symbol-50px rounded d-flex align-items-center justify-content-center h-50px w-50px'
								style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
								<i
									className='bi bi-person-badge fs-1'
									style={{ color: '#10b981' }}></i>
							</div>
						</div>
					</div>

					<div className='col-xl-4'>
						<div
							className='card h-100 card-dashed shadow-none flex-row align-items-center p-6'
							style={{
								border: '1.5px dashed #8b5cf6',
								background: 'rgba(139, 92, 246, 0.03)',
								borderRadius: '12px',
							}}>
							<div className='flex-grow-1'>
								<span className='text-black fw-bold fs-6 d-block mb-2'>Avg. Member Rating</span>
								<div className='d-flex align-items-center'>
									<span className='fs-1 fw-boldest text-gray-900 me-2'>
										{stats.memberAvg.toFixed(1)}
									</span>
									<i className='bi bi-star-fill text-warning fs-3'></i>
								</div>
							</div>
							<div
								className='symbol symbol-50px rounded d-flex align-items-center justify-content-center h-50px w-50px'
								style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
								<i
									className='bi bi-person-fill fs-1'
									style={{ color: '#8b5cf6' }}></i>
							</div>
						</div>
					</div>
				</div>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<h3 className='fw-bolder m-0'>Performance</h3>
					</div>
					<div className='card-toolbar'>
						<div className='d-flex align-items-center me-3'>
							<LengthMenu
								expenseData={ratings}
								handleItemsPerPageChange={(pageSize) =>
									setPagination((prev) => ({ ...prev, itemsPerPage: pageSize, page: 1 }))
								}
							/>
						</div>
						<div className='me-3'>
							<DateFilter
								onDateRangeChange={(range) => {
									setSelectedDateRange(range)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}
								leftValue='-480px'
							/>
						</div>
						<Button
							variant='primary'
							className='btn-sm fw-bold px-4 py-3'
							onClick={() => {
								setIsEditing(false)
								setShowModal(true)
							}}>
							<i className='bi bi-plus fs-1 me-1'></i>
							Add Rating
						</Button>
					</div>
				</div>

				<div className='card-body py-4'>
					<div className='table-responsive'>
						<Table
							data={ratings}
							columns={[
								{ title: 'Position', field: 'type' },
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
									<tr
										key={rating._id}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold mb-1 fs-6 ps-4'>{actualIndex}</span>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='fw-bold text-capitalize text-dark mb-1'>
													{rating.type === 'team'
														? rating.team_id?.position || teamName
														: rating.member_id?.full_name || '-'}
												</span>
												<span className='text-primary  fw-bold fs-7'>{rating.type}</span>
											</div>
										</td>
										<td>
											<span className='badge badge-light-primary fs-7 fw-bold px-4 py-2 border border-primary border-opacity-10'>
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
								)
							}}
						/>
						{!loading && ratings.length === 0 && (
							<div className='text-center py-15 px-5'>
								<h5 className='text-gray-800 fw-bold mb-1'>No ratings recorded yet</h5>
							</div>
						)}
					</div>
					{ratings.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(totalItems / pagination.itemsPerPage) || 1}
							currentPage={pagination.page}
							onPageChange={(p) => setPagination({ ...pagination, page: p })}
						/>
					)}
				</div>
			</KTCard>

			<Modal
				show={showModal}
				onHide={handleCloseModal}
				centered
				size='lg'>
				<Modal.Header
					closeButton={!submitting}
					className='px-10 border-0 pt-8'>
					<Modal.Title className='fs-2 fw-bolder'>
						{isEditing ? 'Edit Scorecard Rating' : 'Scorecard Rating'}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body className='py-5 px-10'>
					<Form>
						{!isEditing && (
							<div className='row mb-8'>
								<div className='col-md-6'>
									<label className='form-label fw-bold fs-6 mb-2'>Select Role</label>
									<Form.Select
										className='form-select-solid fw-bold'
										value={ratingTarget}
										onChange={(e) => {
											setRatingTarget(e.target.value as any)
											setSelectedMemberId('')
										}}>
										<option value='team'>Whole Team ({teamName})</option>
										{teamLeader && <option value='leader'>Team Leader ({teamLeader.name})</option>}
										<option value='member'>Individual Member</option>
									</Form.Select>
								</div>
								{ratingTarget === 'member' && (
									<div className='col-md-6'>
										<label className='form-label fw-bold fs-6 mb-2'>Select Member</label>
										<Form.Select
											className='form-select-solid fw-bold'
											value={selectedMemberId}
											onChange={(e) => setSelectedMemberId(e.target.value)}>
											<option value=''>Choose a member...</option>
											{teamMembers.map((m: any) => (
												<option
													key={m._id}
													value={m._id}>
													{m.full_name}
												</option>
											))}
										</Form.Select>
									</div>
								)}
							</div>
						)}

						<div className='table-responsive mb-8 border rounded'>
							<table className='table table-bordered align-middle g-0 m-0'>
								<thead>
									<tr
										className='fw-boldest text-gray-900 fs-7 text-uppercase'
										style={{ backgroundColor: '#D9E9FF' }}>
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
											className='fs-6'>
											<td className='ps-4 fw-bold border-end py-3'>{index + 1}</td>
											<td className='ps-4 fw-semibold text-gray-800 border-end py-3'>
												{kra.label}
											</td>
											<td
												className='text-center fw-bold border-end py-3'
												style={{ backgroundColor: '#f9f9f9' }}>
												{kra.max}
											</td>
											<td className='p-0'>
												<Form.Control
													type='number'
													className='form-control-flush text-center fw-boldest text-dark fs-5 py-3'
													value={kraScores[kra.id as keyof KraScores]}
													onChange={(e) => handleScoreChange(kra.id, e.target.value, kra.max)}
													placeholder='0'
													style={{ backgroundColor: '#fff' }}
												/>
											</td>
										</tr>
									))}
									{/* Total Row */}
									<tr className='bg-light fw-boldest fs-5 border-top-2'>
										<td
											colSpan={2}
											className='ps-4 py-4 text-end pe-10'>
											TOTAL
										</td>
										<td
											className='text-center py-4 border-start border-end'
											style={{ backgroundColor: '#eef3f7' }}>
											100
										</td>
										<td
											className='text-center py-4 text-dark'
											style={{ backgroundColor: '#eef3f7' }}>
											{totalScore}
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className='fv-row'>
							<label className='form-label fw-bold fs-6 mb-2'>Remarks</label>
							<Form.Control
								as='textarea'
								rows={3}
								className='form-control bg-white border border-gray-300'
								placeholder='Enter Remarks...'
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
							/>
						</div>
					</Form>
				</Modal.Body>
				<Modal.Footer className='px-10 border-0 pb-10'>
					<Button
						variant='light'
						className='fw-bold'
						onClick={handleCloseModal}
						disabled={submitting}>
						Cancel
					</Button>
					<Button
						variant='primary'
						className='px-10 fw-bold'
						onClick={handleSubmitRating}
						disabled={submitting || (ratingTarget === 'member' && !selectedMemberId)}>
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
				size='lg'>
				<Modal.Header
					closeButton
					className='px-10 border-0 pt-8'>
					<Modal.Title className='fs-2 fw-bolder'>Rating Details</Modal.Title>
				</Modal.Header>
				<Modal.Body className='py-5 px-10'>
					{selectedRating && (
						<>
							<div className='table-responsive mb-8 border rounded'>
								<table className='table table-bordered align-middle g-0 m-0'>
									<thead>
										<tr
											className='fw-boldest text-gray-900 fs-7 text-uppercase'
											style={{ backgroundColor: '#F3F6F9' }}>
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
													className='fs-6'>
													<td className='ps-4 fw-bold border-end py-3'>{index + 1}</td>
													<td className='ps-4 fw-semibold text-gray-800 border-end py-3'>
														{kra.label}
													</td>
													<td
														className='text-center fw-bold border-end py-3'
														style={{ backgroundColor: '#fdfdfd' }}>
														{kra.max}
													</td>
													<td className='text-center fw-boldest text-dark py-3'>{score}</td>
												</tr>
											)
										})}
										<tr className='bg-light-primary fw-boldest fs-5 border-top-2'>
											<td
												colSpan={2}
												className='ps-4 py-4 text-end pe-10'>
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
							<div className='fv-row bg-light rounded p-5 mb-2'>
								<label className='form-label fw-boldest fs-6 mb-2'>Remarks</label>
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

export default TeamRatingView
