import { faFilePdf, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup/AccountFunctions'
// API Imports
import { FGIITBatch, getFGIITBatch } from '../../../Functions/FGGroup/FGIITBatch'
import {
	createFGIITLectureSchedule,
	CreateFGIITLectureScheduleParams,
	FGIITLectureSchedule,
	getFGIITLectureSchedule,
	removeFGIITLectureSchedule,
	toggleFGIITLectureReminder,
	updateFGIITLectureSchedule,
	UpdateFGIITLectureScheduleParams,
} from '../../../Functions/FGGroup/FGIITLectureSchedule'
import { GetFGIITMentors, MentorResponse } from '../../../Functions/FGGroup/FGIITMentor'
import {
	FGIITSyllabusChapter,
	getFGIITSyllabusChapters,
} from '../../../Functions/FGGroup/FGIITSyllabusChapter'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MappedLecture {
	id: string
	lectureName: string
	batchName: string
	batchId: string
	syllabusId?: string
	mentorName: string
	mentorId?: string
	scheduledDate: string
	scheduledTime: string
	batchType?: 'weekend' | 'weekday'
	status: string
	zoomLink?: string
	shortNotes?: string
	pdfUrl?: string
	lectureNo?: number
	lectureStatus?: 'pending' | 'complete'
	isReminder?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

const LectureBatchDetail: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()

	// Support both state-based navigation and query-param-based navigation
	const stateData = (location.state as any) || {}
	const batchFromState: FGIITBatch | undefined = stateData.batch
	const syllabusIdFromState: string | undefined = stateData.syllabusId
	const batchNameFallback =
		searchParams.get('batch') || batchFromState?.batchName || 'Unknown Batch'
	const courseNameFallback = searchParams.get('course') || stateData.courseName || 'Lecture Detail'

	// ─── State ──────────────────────────────────────────────────────────────────

	const [loading, setLoading] = useState(false)
	const [lectures, setLectures] = useState<MappedLecture[]>([])

	// Supporting data
	const [availableBatches, setAvailableBatches] = useState<FGIITBatch[]>([])
	const [mentors, setMentors] = useState<MentorResponse[]>([])
	const [syllabusChapters, setSyllabusChapters] = useState<FGIITSyllabusChapter[]>([])

	// The batch we're viewing (resolved after fetching all batches if needed)
	const [currentBatch, setCurrentBatch] = useState<FGIITBatch | undefined>(batchFromState)

	// Add Modal
	const [showAddModal, setShowAddModal] = useState(false)
	const [addForm, setAddForm] = useState<{
		batch_id: string
		mentor_id: string
		lecture_name: string
		scheduled_date: string
		scheduled_time: string
		zoom_link: string
		short_notes: string
		pdf_url: string
		lecture_no: number
		lecture_status: 'pending' | 'complete'
	}>({
		batch_id: batchFromState?._id || '',
		mentor_id: '',
		lecture_name: '',
		scheduled_date: '',
		scheduled_time: '',
		zoom_link: '',
		short_notes: '',
		pdf_url: '',
		lecture_no: 0,
		lecture_status: 'pending',
	})

	// Edit Modal
	const [showEditModal, setShowEditModal] = useState(false)
	const [uploadingPdf, setUploadingPdf] = useState(false)
	const [editForm, setEditForm] = useState<UpdateFGIITLectureScheduleParams>({
		id: '',
		batch_id: '',
		mentor_id: '',
		syllabus_id: '',
		lecture_name: '',
		scheduled_date: '',
		scheduled_time: '',
		zoom_link: '',
		short_notes: '',
		pdf_url: '',
		lecture_no: 0,
		lecture_status: 'pending',
	})

	// Reminder toggle loading — tracks which lecture IDs are being toggled
	const [reminderLoadingIds, setReminderLoadingIds] = useState<Set<string>>(new Set())
	const [masterReminderLoading, setMasterReminderLoading] = useState(false)

	// Derived: all non-temp lectures have reminder on
	const allRemindersOn =
		lectures.filter((l) => !l.id.startsWith('temp-')).length > 0 &&
		lectures.filter((l) => !l.id.startsWith('temp-')).every((l) => l.isReminder)

	// ─── Data Fetching ──────────────────────────────────────────────────────────

	useEffect(() => {
		const fetchSupportData = async () => {
			setLoading(true)
			try {
				const [batchRes, mentorRes] = await Promise.all([
					getFGIITBatch({ limit: 1000 }),
					GetFGIITMentors(),
				])
				let batches: FGIITBatch[] = []
				if (batchRes?.data) batches = Array.isArray(batchRes.data) ? batchRes.data : []
				setAvailableBatches(batches)

				// If batch was passed via state, keep it; otherwise try to resolve by name from query param
				if (!batchFromState && searchParams.get('batch')) {
					const matchedBatch = batches.find(
						(b) => b.batchName === decodeURIComponent(searchParams.get('batch') || '')
					)
					if (matchedBatch) setCurrentBatch(matchedBatch)
				}

				if (mentorRes?.data) setMentors(Array.isArray(mentorRes.data) ? mentorRes.data : [])

				// Fetch Syllabus Chapters if we have a syllabus_id
				const syllabusId = syllabusIdFromState
				if (syllabusId) {
					const chapterRes = await getFGIITSyllabusChapters({ syllabusId, limit: 1000 })
					if (chapterRes?.data) {
						setSyllabusChapters(Array.isArray(chapterRes.data) ? chapterRes.data : [])
					}
				}
			} catch (error) {
				console.error('Failed to fetch support data', error)
				toast.error('Failed to load support data')
			} finally {
				setLoading(false)
			}
		}

		fetchSupportData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Fetch lectures once batches & mentors load (needed for name mapping)
	useEffect(() => {
		if ((availableBatches.length > 0 || mentors.length > 0) && syllabusChapters.length > 0) {
			fetchLectures()
		}
	}, [availableBatches, mentors, syllabusChapters])

	const fetchLectures = async () => {
		try {
			// Fetch lectures scoped to this specific batch + syllabus to avoid cross-syllabus leakage
			const batchId = currentBatch?._id || batchFromState?._id
			const batchNameParam = searchParams.get('batch')

			const queryParams: { limit: number; syllabus_id?: string; batch_id?: string } = {
				limit: 1000,
			}
			if (syllabusIdFromState) queryParams.syllabus_id = syllabusIdFromState
			if (batchId) queryParams.batch_id = batchId

			const res = await getFGIITLectureSchedule(queryParams)
			if (res?.data && Array.isArray(res.data)) {
				// API already filters by syllabus_id + batch_id, so no further client-side filtering needed
				let filtered: FGIITLectureSchedule[] = res.data

				// Fallback: if batch_id was not sent (no resolved batch yet), filter by batch name
				if (!batchId && batchNameParam) {
					const matchedBatch = availableBatches.find(
						(b) => b.batchName === decodeURIComponent(batchNameParam)
					)
					if (matchedBatch) {
						filtered = res.data.filter((l: FGIITLectureSchedule) => l.batch_id === matchedBatch._id)
					}
				}

				// ── Synchronization Logic ──
				// Filter chapters based on current batch type (weekend vs weekday)
				const batchType = currentBatch?.batchType || batchFromState?.batchType || 'weekend'
				const relevantChapters = syllabusChapters.filter(
					(ch) => (ch.batchType || 'weekend') === batchType
				)

				// We want to show ALL relevant chapters.
				// If a chapter has a matching lecture in 'filtered', we use it.

				const mapped: MappedLecture[] = relevantChapters.map((ch) => {
					// Match by lecture_no only — after syllabus_id+batch_id scoping above,
					// matching by name would cause false cross-syllabus matches
					const matchedLec = filtered.find((l) => l.lecture_no === ch.classNumber)

					if (matchedLec) {
						const mentor = mentors.find((m) => m._id === matchedLec.mentor_id)
						return {
							id: matchedLec._id,
							lectureName: matchedLec.lecture_name,
							lectureNo: matchedLec.lecture_no || ch.classNumber,
							batchName: currentBatch?.batchName || batchNameFallback,
							batchId: matchedLec.batch_id || '',
							syllabusId:
								typeof matchedLec.syllabus_id === 'object'
									? (matchedLec.syllabus_id as any)._id
									: matchedLec.syllabus_id,
							mentorName: mentor?.mentorName || 'Unknown Mentor',
							mentorId: matchedLec.mentor_id,
							scheduledDate: moment(matchedLec.scheduled_date).format('YYYY-MM-DD'),
							scheduledTime: matchedLec.scheduled_time,
							batchType: currentBatch?.batchType,
							status:
								matchedLec.lecture_status ||
								getLectureStatus(matchedLec.scheduled_date, matchedLec.scheduled_time),
							zoomLink: matchedLec.zoom_link,
							shortNotes: matchedLec.short_notes,
							pdfUrl: matchedLec.pdf_url || ch.pdfUrl,
							lectureStatus: (matchedLec.lecture_status as 'pending' | 'complete') || 'pending',
							isReminder: matchedLec.is_reminder || false,
						}
					} else {
						// No lecture scheduled yet for this chapter
						return {
							id: `temp-${ch._id}`, // temporary ID for the row
							lectureName: ch.chapterName,
							lectureNo: ch.classNumber,
							batchName: currentBatch?.batchName || batchNameFallback,
							batchId: currentBatch?._id || '',
							syllabusId:
								typeof ch.syllabusId === 'object' ? (ch.syllabusId as any)._id : ch.syllabusId,
							mentorName: '-',
							scheduledDate: '-',
							scheduledTime: '-',
							status: 'pending',
							pdfUrl: ch.pdfUrl,
							lectureStatus: 'pending',
						}
					}
				})

				setLectures(mapped)
			}
		} catch (e) {
			console.error('Failed to fetch lectures', e)
			toast.error('Failed to load lecture schedules')
		}
	}

	const getLectureStatus = (dateStr: string, timeStr: string) => {
		const now = moment()
		const lectureTime = moment(
			`${moment(dateStr).format('YYYY-MM-DD')} ${timeStr}`,
			'YYYY-MM-DD HH:mm'
		)
		if (lectureTime.isBefore(now)) return 'completed'
		if (lectureTime.isSame(now, 'day')) return 'upcoming'
		return 'upcoming'
	}

	// ─── Handlers ───────────────────────────────────────────────────────────────

	const handleAdd = async () => {
		if (!addForm.lecture_name || !addForm.scheduled_date || !addForm.scheduled_time) {
			toast.error('Please fill all required fields')
			return
		}
		try {
			setLoading(true)
			const payload: CreateFGIITLectureScheduleParams = {
				batch_id: addForm.batch_id || currentBatch?._id || '',
				mentor_id: addForm.mentor_id,
				syllabus_id: syllabusIdFromState,
				lecture_name: addForm.lecture_name,
				lecture_no: addForm.lecture_no,
				lecture_status: addForm.lecture_status as 'pending' | 'complete',
				scheduled_date: addForm.scheduled_date,
				scheduled_time: addForm.scheduled_time,
				zoom_link: addForm.zoom_link,
				short_notes: addForm.short_notes,
				pdf_url: addForm.pdf_url,
			}
			await createFGIITLectureSchedule(payload)
			toast.success('Lecture scheduled successfully')
			setShowAddModal(false)
			resetAddForm()
			fetchLectures()
		} catch (error) {
			console.error('Failed to add lecture', error)
			toast.error('Failed to schedule lecture')
		} finally {
			setLoading(false)
		}
	}

	const handleUpdate = async () => {
		if (!editForm.lecture_name || !editForm.scheduled_date || !editForm.scheduled_time) {
			toast.error('Please fill all required fields')
			return
		}
		try {
			setLoading(true)
			await updateFGIITLectureSchedule(editForm)
			toast.success('Lecture updated successfully')
			setShowEditModal(false)
			fetchLectures()
		} catch (error) {
			console.error('Failed to update lecture', error)
			toast.error('Failed to update lecture')
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async (id: string) => {
		if (!window.confirm('Are you sure you want to delete this lecture?')) return
		try {
			await removeFGIITLectureSchedule(id)
			toast.success('Lecture deleted successfully')
			fetchLectures()
		} catch (error) {
			console.error('Failed to delete lecture', error)
			toast.error('Failed to delete lecture')
		} finally {
			setLoading(false)
		}
	}

	const handleAllReminderToggle = async (newValue: boolean) => {
		const scheduledLectures = lectures.filter((l) => !l.id.startsWith('temp-'))
		if (scheduledLectures.length === 0) return
		setMasterReminderLoading(true)
		try {
			await Promise.all(scheduledLectures.map((l) => toggleFGIITLectureReminder(l.id, newValue)))
			setLectures((prev) =>
				prev.map((l) => (l.id.startsWith('temp-') ? l : { ...l, isReminder: newValue }))
			)
			toast.success(newValue ? 'All reminders enabled' : 'All reminders disabled')
		} catch (error) {
			console.error('Failed to toggle all reminders', error)
			toast.error('Failed to update some reminders')
		} finally {
			setMasterReminderLoading(false)
		}
	}

	const handleReminderToggle = async (lec: MappedLecture, newValue: boolean) => {
		if (lec.id.startsWith('temp-')) return // no schedule saved yet
		setReminderLoadingIds((prev) => new Set(prev).add(lec.id))
		try {
			await toggleFGIITLectureReminder(lec.id, newValue)
			// Optimistically update local state
			setLectures((prev) => prev.map((l) => (l.id === lec.id ? { ...l, isReminder: newValue } : l)))
			toast.success(newValue ? 'Reminder enabled' : 'Reminder disabled')
		} catch (error) {
			console.error('Failed to toggle reminder', error)
			toast.error('Failed to update reminder')
		} finally {
			setReminderLoadingIds((prev) => {
				const next = new Set(prev)
				next.delete(lec.id)
				return next
			})
		}
	}

	const openEditModal = (lec: MappedLecture) => {
		if (lec.id.startsWith('temp-')) {
			// It's a temporary row, we want to ADD a new schedule
			setAddForm({
				batch_id: currentBatch?._id || '',
				mentor_id: '',
				lecture_name: lec.lectureName,
				lecture_no: lec.lectureNo || 0,
				lecture_status: 'pending',
				scheduled_date: '',
				scheduled_time: '',
				zoom_link: '',
				short_notes: '',
				pdf_url: lec.pdfUrl || '',
			})
			setShowAddModal(true)
		} else {
			setEditForm({
				id: lec.id,
				batch_id: lec.batchId,
				mentor_id: lec.mentorId || '',
				syllabus_id: lec.syllabusId || syllabusIdFromState || '',
				lecture_name: lec.lectureName,
				lecture_no: lec.lectureNo,
				lecture_status: lec.lectureStatus,
				scheduled_date: lec.scheduledDate,
				scheduled_time: lec.scheduledTime,
				zoom_link: lec.zoomLink || '',
				short_notes: lec.shortNotes || '',
				pdf_url: lec.pdfUrl || '',
			})
			setShowEditModal(true)
		}
	}

	const resetAddForm = () => {
		setAddForm({
			batch_id: currentBatch?._id || batchFromState?._id || '',
			mentor_id: '',
			lecture_name: '',
			scheduled_date: '',
			scheduled_time: '',
			zoom_link: '',
			short_notes: '',
			pdf_url: '',
			lecture_no: 0,
			lecture_status: 'pending',
		})
	}

	// ─── Status Colour ───────────────────────────────────────────────────────────

	const getStatusColor = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'upcoming':
				return { bg: '#e0f2fe', border: '#38bdf8', text: '#0284c7' }
			case 'in-progress':
				return { bg: '#dcfce7', border: '#4ade80', text: '#16a34a' }
			case 'completed':
				return { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' }
			default:
				return { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' }
		}
	}

	// ─── Render ──────────────────────────────────────────────────────────────────

	const displayBatchName = currentBatch?.batchName || batchNameFallback
	const displayCourseName = courseNameFallback

	return (
		<>
			<PageTitle breadcrumbs={[]}>{displayCourseName}</PageTitle>

			{/* Header */}
			<div className='d-flex align-items-center justify-content-between mb-6 flex-wrap gap-3'>
				<div className='d-flex align-items-center gap-3'>
					<button
						className='btn btn-sm btn-light-primary fw-semibold'
						onClick={() => navigate(-1)}>
						<i className='bi bi-arrow-left me-1' />
						Back
					</button>
					<div>
						<h4 className='mb-0 fw-bold text-gray-900'>{displayCourseName}</h4>
						<div className='d-flex align-items-center gap-2 mt-1'>
							<span
								className='badge fw-semibold'
								style={{
									background: '#dcfce7',
									color: '#15803d',
									border: '1px solid #bbf7d0',
									fontSize: '0.78rem',
									padding: '4px 10px',
									borderRadius: '20px',
								}}>
								<i className='bi bi-collection-fill me-1' />
								{displayBatchName}
							</span>
							{currentBatch?.batchType && (
								<span
									className={`badge fw-semibold ${
										currentBatch.batchType === 'weekend'
											? 'badge-light-warning'
											: 'badge-light-info'
									}`}>
									{currentBatch.batchType === 'weekend' ? 'Weekend' : 'Weekday'}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Schedule Lecture button — temporarily commented out
        <button
          className='btn btn-primary fw-semibold d-flex align-items-center gap-2'
          onClick={() => {
            resetAddForm()
            setShowAddModal(true)
          }}
        >
          <FontAwesomeIcon icon={faPlusCircle} />
          Schedule Lecture
        </button>
        */}
			</div>

			<KTCard className='shadow-sm'>
				<div className='card-body py-4'>
					{loading ? (
						<div className='d-flex justify-content-center py-12'>
							<span className='spinner-border spinner-border-sm text-primary me-2' />
							<span className='text-muted fw-semibold'>Loading lectures...</span>
						</div>
					) : lectures.length === 0 ? (
						<div className='d-flex flex-column align-items-center justify-content-center py-16 text-center'>
							<div
								style={{
									width: '64px',
									height: '64px',
									borderRadius: '16px',
									background: '#f0fdf4',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: '16px',
								}}>
								<i className='bi bi-journal-bookmark-fill fs-1 text-success' />
							</div>
							<h5 className='fw-bold text-gray-700 mb-2'>No Lectures Yet</h5>
							<p className='text-muted fs-6 mb-4'>
								No lectures scheduled for <strong>{displayBatchName}</strong>
							</p>
							<button
								className='btn btn-primary fw-semibold'
								onClick={() => {
									resetAddForm()
									setShowAddModal(true)
								}}>
								<FontAwesomeIcon
									icon={faPlusCircle}
									className='me-2'
								/>
								Schedule First Lecture
							</button>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table align-middle table-row-dashed fs-6 gy-4'>
								<thead>
									<tr className='fw-bold text-muted bg-light'>
										<th className='ps-4 rounded-start min-w-80px'>Lec No.</th>
										<th className='min-w-200px'>Chapter Name</th>
										<th className='min-w-100px'>PDF/PPT</th>
										<th className='min-w-150px'>Mentor</th>
										<th className='min-w-120px'>Zoom Link</th>
										<th className='min-w-120px'>Date</th>
										<th className='min-w-100px'>Time</th>
										<th className='min-w-100px'>Status</th>
										<th className='min-w-80px'>
								<div className='d-flex align-items-center gap-2'>
									Reminder
									{masterReminderLoading ? (
										<span className='spinner-border spinner-border-sm text-primary ms-1' />
									) : (
										<div className='form-check form-switch form-check-custom form-check-solid ms-1'>
											<input
												className='form-check-input h-20px w-35px'
												type='checkbox'
												title='Toggle all reminders'
												checked={allRemindersOn}
												onChange={(e) => handleAllReminderToggle(e.target.checked)}
											/>
										</div>
									)}
								</div>
							</th>
										<th className='min-w-100px text-center rounded-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{lectures.map((lec, idx) => {
										const statusStyle = getStatusColor(lec.lectureStatus || 'pending')
										const isTemp = lec.id.startsWith('temp-')
										return (
											<tr key={lec.id}>
												<td className='ps-4'>
													<span className='text-dark fw-bold fs-6'>{lec.lectureNo}</span>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-dark fw-bold fs-6'>{lec.lectureName}</span>
													</div>
												</td>
												<td>
													{lec.pdfUrl ? (
														<a
															href={
																lec.pdfUrl.startsWith('http')
																	? lec.pdfUrl
																	: `https://files.fggroup.in/${lec.pdfUrl}`
															}
															target='_blank'
															rel='noopener noreferrer'
															className='d-flex align-items-center gap-1 text-primary fw-semibold fs-7'>
															<FontAwesomeIcon
																icon={faFilePdf}
																className='text-danger fs-5'
															/>
															View PDF
														</a>
													) : (
														<span className='text-muted fs-7'>—</span>
													)}
												</td>
												<td>
													<div className='d-flex align-items-center gap-2'>
														{lec.mentorName !== '-' && (
															<div
																style={{
																	width: '32px',
																	height: '32px',
																	borderRadius: '50%',
																	background: '#dbeafe',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	color: '#1d4ed8',
																	fontWeight: 700,
																	fontSize: '0.8rem',
																	flexShrink: 0,
																}}>
																{lec.mentorName.charAt(0)}
															</div>
														)}
														<span className='text-dark fw-semibold fs-7'>{lec.mentorName}</span>
													</div>
												</td>
												<td>
													{lec.zoomLink ? (
														<a
															href={lec.zoomLink}
															target='_blank'
															rel='noopener noreferrer'
															className='btn btn-sm btn-light-primary fw-semibold d-flex align-items-center gap-1'
															style={{ width: 'fit-content' }}>
															<i className='bi bi-camera-video-fill' />
															Join
														</a>
													) : (
														<span className='text-muted fs-7'>—</span>
													)}
												</td>
												<td>
													<span className='text-dark fw-semibold fs-7'>
														{lec.scheduledDate === '-'
															? '-'
															: moment(lec.scheduledDate).format('DD MMM YYYY')}
													</span>
												</td>
												<td>
													<span className='text-muted fs-7'>{lec.scheduledTime}</span>
												</td>
												<td>
													<span
														className='badge fw-bolder fs-8 px-3 py-2 text-capitalize'
														style={{
															backgroundColor: statusStyle.bg,
															color: statusStyle.text,
															border: `1px solid ${statusStyle.border}`,
														}}>
														{lec.lectureStatus || 'pending'}
													</span>
												</td>
												<td>
													<div className='form-check form-switch form-check-custom form-check-solid'>
														{reminderLoadingIds.has(lec.id) ? (
															<span className='spinner-border spinner-border-sm text-primary' />
														) : (
															<input
																className='form-check-input h-20px w-35px'
																type='checkbox'
																title={
																	isTemp
																		? 'Save lecture details first to enable reminder'
																		: undefined
																}
																disabled={isTemp}
																checked={lec.isReminder || false}
																onChange={(e) => handleReminderToggle(lec, e.target.checked)}
															/>
														)}
													</div>
												</td>
												<td className='text-center'>
													<div className='d-flex justify-content-center gap-2'>
														{isTemp ? (
															<button
																className='btn btn-icon btn-sm btn-light-primary w-35px h-35px'
																title='Add Details'
																onClick={() => openEditModal(lec)}>
																<i className='bi bi-plus-circle-fill fs-3'></i>
															</button>
														) : (
															<>
																<button
																	className='btn btn-icon btn-sm btn-light-primary w-35px h-35px'
																	title='Edit'
																	onClick={() => openEditModal(lec)}>
																	<i className='bi bi-pencil-square fs-3'></i>
																</button>
																<button
																	className='btn btn-icon btn-sm btn-light-danger w-35px h-35px'
																	title='Delete'
																	onClick={() => handleDelete(lec.id)}>
																	<i className='bi bi-trash3-fill fs-3'></i>
																</button>
															</>
														)}
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</KTCard>

			{/* ─── Add Lecture Modal ─────────────────────────────────────────────────── */}
			<Modal
				show={showAddModal}
				onHide={() => setShowAddModal(false)}
				size='lg'
				centered>
				<Modal.Header
					closeButton
					className='border-0 pb-0'>
					<Modal.Title className='fw-bold fs-4'>Schedule Lecture</Modal.Title>
				</Modal.Header>
				<Modal.Body className='pt-4 px-6'>
					<div
						className='mb-4 p-3 rounded'
						style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
						<span className='fw-semibold text-success fs-7'>
							<i className='bi bi-collection-fill me-2' />
							{displayCourseName} — {displayBatchName}
						</span>
					</div>

					<div className='row g-4'>
						{/* Lecture No */}
						<div className='col-md-2'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Lec No.</Form.Label>
								<Form.Control
									type='number'
									readOnly
									className='form-control-solid bg-light'
									value={addForm.lecture_no}
								/>
							</Form.Group>
						</div>

						{/* Lecture Name */}
						<div className='col-md-10'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Chapter Name</Form.Label>
								<Form.Control
									type='text'
									readOnly
									className='form-control-solid bg-light'
									value={addForm.lecture_name}
								/>
							</Form.Group>
						</div>

						{/* Mentor */}
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Mentor</Form.Label>
								<Form.Select
									className='form-select-solid'
									value={addForm.mentor_id}
									onChange={(e) => setAddForm((p) => ({ ...p, mentor_id: e.target.value }))}>
									<option value=''>Select Mentor</option>
									{mentors.map((m) => (
										<option
											key={m._id}
											value={m._id}>
											{m.mentorName}
										</option>
									))}
								</Form.Select>
							</Form.Group>
						</div>

						{/* Scheduled Date */}
						<div className='col-md-3'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>
									Date <span className='text-danger'>*</span>
								</Form.Label>
								<Form.Control
									type='date'
									className='form-control-solid'
									value={addForm.scheduled_date}
									onChange={(e) => setAddForm((p) => ({ ...p, scheduled_date: e.target.value }))}
								/>
							</Form.Group>
						</div>

						{/* Scheduled Time */}
						<div className='col-md-3'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>
									Time <span className='text-danger'>*</span>
								</Form.Label>
								<Form.Control
									type='time'
									className='form-control-solid'
									value={addForm.scheduled_time}
									onChange={(e) => setAddForm((p) => ({ ...p, scheduled_time: e.target.value }))}
								/>
							</Form.Group>
						</div>

						{/* Zoom Link */}
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Zoom Meeting Link</Form.Label>
								<Form.Control
									type='url'
									className='form-control-solid'
									placeholder='https://zoom.us/j/...'
									value={addForm.zoom_link}
									onChange={(e) => setAddForm((p) => ({ ...p, zoom_link: e.target.value }))}
								/>
							</Form.Group>
						</div>

						{/* PDF Upload */}
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>PDF / PPT</Form.Label>
								{addForm.pdf_url ? (
									<div
										className='d-flex align-items-center gap-2 p-2 rounded-2'
										style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
										<FontAwesomeIcon
											icon={faFilePdf}
											className='text-danger fs-4 flex-shrink-0'
										/>
										<a
											href={
												addForm.pdf_url.startsWith('http')
													? addForm.pdf_url
													: `https://files.fggroup.in/${addForm.pdf_url}`
											}
											target='_blank'
											rel='noopener noreferrer'
											className='text-success fw-semibold fs-7 flex-grow-1'>
											View PDF
										</a>
										<button
											type='button'
											className='btn btn-sm btn-light-danger px-2 py-1 fs-8 ms-auto'
											onClick={() => setAddForm((p) => ({ ...p, pdf_url: '' }))}>
											<i className='bi bi-x-lg me-1' />
											Replace
										</button>
									</div>
								) : (
									<div>
										<Form.Control
											type='file'
											accept='.pdf,.ppt,.pptx'
											className='form-control-solid'
											disabled={uploadingPdf}
											onChange={async (e) => {
												const file = (e.target as HTMLInputElement).files?.[0]
												if (!file) return
												try {
													setUploadingPdf(true)
													const res: any = await FileUploadToFGGroup([file])
													const url = res?.data?.fileURLs?.[0] || ''
													if (url) {
														setAddForm((p) => ({ ...p, pdf_url: url }))
														toast.success('PDF uploaded successfully')
													} else {
														toast.error('Upload failed — no URL returned')
													}
												} catch {
													toast.error('Failed to upload PDF')
												} finally {
													setUploadingPdf(false)
												}
											}}
										/>
										{uploadingPdf && (
											<div className='d-flex align-items-center gap-2 mt-1'>
												<span className='spinner-border spinner-border-sm text-primary' />
												<span className='text-muted fs-8'>Uploading...</span>
											</div>
										)}
									</div>
								)}
							</Form.Group>
						</div>

						{/* Status */}
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Status</Form.Label>
								<Form.Select
									className='form-select-solid'
									value={addForm.lecture_status}
									onChange={(e) =>
										setAddForm((p) => ({ ...p, lecture_status: e.target.value as any }))
									}>
									<option value='pending'>Pending</option>
									<option value='complete'>Complete</option>
								</Form.Select>
							</Form.Group>
						</div>

						{/* Short Notes */}
						<div className='col-12'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Short Notes</Form.Label>
								<Form.Control
									as='textarea'
									rows={2}
									className='form-control-solid'
									placeholder='Brief notes about this class...'
									value={addForm.short_notes}
									onChange={(e) => setAddForm((p) => ({ ...p, short_notes: e.target.value }))}
								/>
							</Form.Group>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer className='border-0 pt-0'>
					<Button
						variant='light'
						onClick={() => setShowAddModal(false)}>
						Cancel
					</Button>
					<Button
						variant='primary'
						onClick={handleAdd}
						style={{
							background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
							border: 'none',
						}}>
						<FontAwesomeIcon
							icon={faPlusCircle}
							className='me-2'
						/>
						Schedule Lecture
					</Button>
				</Modal.Footer>
			</Modal>

			{/* ─── Edit Lecture Modal ────────────────────────────────────────────────── */}
			<Modal
				show={showEditModal}
				onHide={() => setShowEditModal(false)}
				size='lg'
				centered>
				<Modal.Header
					closeButton
					className='border-0 pb-0'>
					<Modal.Title className='fw-bold fs-4'>Edit Lecture</Modal.Title>
				</Modal.Header>
				<Modal.Body className='pt-4 px-6'>
					<div className='row g-4'>
						{/* Lecture No */}
						<div className='col-md-2'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Lec No.</Form.Label>
								<Form.Control
									type='number'
									readOnly
									className='form-control-solid bg-light'
									value={editForm.lecture_no || ''}
								/>
							</Form.Group>
						</div>

						{/* Lecture Name */}
						<div className='col-md-10'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Chapter Name</Form.Label>
								<Form.Control
									type='text'
									readOnly
									className='form-control-solid bg-light'
									value={editForm.lecture_name || ''}
								/>
							</Form.Group>
						</div>

						{/* Mentor */}
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Mentor</Form.Label>
								<Form.Select
									className='form-select-solid'
									value={editForm.mentor_id || ''}
									onChange={(e) => setEditForm({ ...editForm, mentor_id: e.target.value })}>
									<option value=''>Select Mentor</option>
									{mentors.map((m) => (
										<option
											key={m._id}
											value={m._id}>
											{m.mentorName}
										</option>
									))}
								</Form.Select>
							</Form.Group>
						</div>

						{/* Date */}
						<div className='col-md-3'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>
									Date <span className='text-danger'>*</span>
								</Form.Label>
								<Form.Control
									type='date'
									className='form-control-solid'
									value={editForm.scheduled_date || ''}
									onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })}
								/>
							</Form.Group>
						</div>

						{/* Time */}
						<div className='col-md-3'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>
									Time <span className='text-danger'>*</span>
								</Form.Label>
								<Form.Control
									type='time'
									className='form-control-solid'
									value={editForm.scheduled_time || ''}
									onChange={(e) => setEditForm({ ...editForm, scheduled_time: e.target.value })}
								/>
							</Form.Group>
						</div>

						{/* Zoom Link */}
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Zoom Meeting Link</Form.Label>
								<Form.Control
									type='url'
									className='form-control-solid'
									placeholder='https://zoom.us/j/...'
									value={editForm.zoom_link || ''}
									onChange={(e) => setEditForm({ ...editForm, zoom_link: e.target.value })}
								/>
							</Form.Group>
						</div>

						{/* PDF — Preview if already uploaded, Upload input if not */}
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>PDF / PPT</Form.Label>
								{editForm.pdf_url ? (
									<div
										className='d-flex align-items-center gap-2 p-2 rounded-2'
										style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
										<FontAwesomeIcon
											icon={faFilePdf}
											className='text-danger fs-4 flex-shrink-0'
										/>
										<a
											href={
												editForm.pdf_url.startsWith('http')
													? editForm.pdf_url
													: `https://files.fggroup.in/${editForm.pdf_url}`
											}
											target='_blank'
											rel='noopener noreferrer'
											className='text-success fw-semibold fs-7 text-truncate flex-grow-1'
											style={{ maxWidth: '150px' }}>
											View PDF
										</a>
										<button
											type='button'
											className='btn btn-sm btn-light-danger px-2 py-1 fs-8 ms-auto'
											onClick={() => setEditForm({ ...editForm, pdf_url: '' })}>
											<i className='bi bi-x-lg me-1' />
											Replace
										</button>
									</div>
								) : (
									<div>
										<Form.Control
											type='file'
											accept='.pdf,.ppt,.pptx'
											className='form-control-solid'
											disabled={uploadingPdf}
											onChange={async (e) => {
												const file = (e.target as HTMLInputElement).files?.[0]
												if (!file) return
												try {
													setUploadingPdf(true)
													const res: any = await FileUploadToFGGroup([file])
													const url = res?.data?.fileURLs?.[0] || ''
													if (url) {
														setEditForm((prev) => ({ ...prev, pdf_url: url }))
														toast.success('PDF uploaded successfully')
													} else {
														toast.error('Upload failed — no URL returned')
													}
												} catch {
													toast.error('Failed to upload PDF')
												} finally {
													setUploadingPdf(false)
												}
											}}
										/>
										{uploadingPdf && (
											<div className='d-flex align-items-center gap-2 mt-1'>
												<span className='spinner-border spinner-border-sm text-primary' />
												<span className='text-muted fs-8'>Uploading...</span>
											</div>
										)}
									</div>
								)}
							</Form.Group>
						</div>

						{/* Status */}
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Status</Form.Label>
								<Form.Select
									className='form-select-solid'
									value={editForm.lecture_status || 'pending'}
									onChange={(e) =>
										setEditForm({ ...editForm, lecture_status: e.target.value as any })
									}>
									<option value='pending'>Pending</option>
									<option value='complete'>Complete</option>
								</Form.Select>
							</Form.Group>
						</div>

						{/* Short Notes */}
						<div className='col-12'>
							<Form.Group>
								<Form.Label className='fw-semibold fs-6 mb-1'>Short Notes</Form.Label>
								<Form.Control
									as='textarea'
									rows={2}
									className='form-control-solid'
									placeholder='Brief notes about this class...'
									value={editForm.short_notes || ''}
									onChange={(e) => setEditForm({ ...editForm, short_notes: e.target.value })}
								/>
							</Form.Group>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer className='border-0 pt-0'>
					<Button
						variant='light'
						onClick={() => setShowEditModal(false)}>
						Cancel
					</Button>
					<Button
						variant='primary'
						onClick={handleUpdate}
						style={{
							background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
							border: 'none',
						}}>
						<i className='bi bi-check-circle-fill me-2' />
						Update Lecture
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default LectureBatchDetail
