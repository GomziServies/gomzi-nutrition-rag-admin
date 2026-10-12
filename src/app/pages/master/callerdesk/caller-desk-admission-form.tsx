import { faPlusCircle, faTimes, faVolumeUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { errorToast } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetFgiitAdmissionReport } from '../../../Functions/FGGroup/FgiitFollowUpReport'

export function CallerDeskAdmissionForm() {
	const location = useLocation()
	const [loading, setLoading] = useState(false)
	const [data, setData] = useState<any[]>([])

	const SESSION_KEY = 'admission_form_filters'

	const restoreFilters = () => {
		try {
			const saved = sessionStorage.getItem(SESSION_KEY)
			if (saved) return JSON.parse(saved)
		} catch {
			/* ignore */
		}
		return null
	}

	const saved = restoreFilters()

	// Table features
	const [searchTerm, setSearchTerm] = useState<string>(saved?.searchTerm || '')
	const [sort, setSort] = useState<string>(saved?.sort || 'callDate')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(saved?.sortOrder || 'desc')
	const [pagination, setPagination] = useState<{ page: number; itemsPerPage: number }>(
		saved?.pagination || { page: 1, itemsPerPage: 10 }
	)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [metaData, setMetaData] = useState<any>()
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		if (saved?.dateRange) {
			try {
				const [s, e] = saved.dateRange
				return [new Date(s), new Date(e)] as [Date, Date]
			} catch {
				/* ignore */
			}
		}
		return null
	})

	// Recording modal
	const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
	const audioRef = useRef<HTMLAudioElement>(null)

	useEffect(() => {
		fetchData()
	}, [location, pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedDateRange])

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

	// Persist filters to sessionStorage
	useEffect(() => {
		const toSave = {
			searchTerm,
			sort,
			sortOrder,
			pagination,
			dateRange: selectedDateRange
				? [selectedDateRange[0].toISOString(), selectedDateRange[1].toISOString()]
				: null,
		}
		try {
			sessionStorage.setItem(SESSION_KEY, JSON.stringify(toSave))
		} catch {
			/* ignore */
		}
	}, [searchTerm, sort, sortOrder, pagination, selectedDateRange])

	const fetchIdRef = useRef(0)

	const fetchData = async () => {
		const currentFetchId = ++fetchIdRef.current
		try {
			setLoading(true)
			const queryParams = new URLSearchParams(location.search)
			const id = queryParams.get('id') // if id is present, it will fetch a specific report

			const queryArgs: any = {
				limit: pagination.itemsPerPage,
				page: pagination.page,
				sort,
				sortOrder,
				has_admission: 'true',
			}

			if (id) {
				queryArgs.id = id
			}
			if (searchTerm) {
				queryArgs.search = searchTerm
			}
			const fmt = (d: Date) => {
				const y = d.getFullYear()
				const m = String(d.getMonth() + 1).padStart(2, '0')
				const day = String(d.getDate()).padStart(2, '0')
				return `${y}-${m}-${day}`
			}

			if (selectedDateRange) {
				queryArgs.start_date = fmt(selectedDateRange[0])
				queryArgs.end_date = fmt(selectedDateRange[1])
			}

			// 1. Fetch Report(s) - This API now returns admission forms WITH signed recording URLs
			const res: any = await GetFgiitAdmissionReport(queryArgs)

			if (currentFetchId !== fetchIdRef.current) return // Stop if a newer request was triggered

			if (res.status === 200 && res.data) {
				// Handle both { data: [...] } and { data: { data: [...] } } structures
				const admissionEntries = Array.isArray(res.data?.data)
					? res.data.data
					: Array.isArray(res.data)
					? res.data
					: []

				if (
					res.metadata?.pagination ||
					res.customCode?.pagination ||
					res.data?.metadata?.pagination
				) {
					setMetaData(
						res.metadata?.pagination || res.customCode?.pagination || res.data?.metadata?.pagination
					)
				}

				if (currentFetchId !== fetchIdRef.current) return
				setData(admissionEntries)
			} else {
				errorToast('Failed to fetch reports')
			}
		} catch (err) {
			console.error(err)
			errorToast('Failed to fetch data')
		} finally {
			if (currentFetchId === fetchIdRef.current) {
				setLoading(false)
			}
		}
	}

	const openRecording = (e: React.MouseEvent, url: string) => {
		e.stopPropagation()
		setRecordingUrl(url)
	}
	const closeRecording = () => {
		audioRef.current?.pause()
		if (audioRef.current) audioRef.current.currentTime = 0
		setRecordingUrl(null)
	}

	const formatDate = (date: any) => {
		if (!date) return '—'
		try {
			return new Date(date).toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			})
		} catch (e) {
			return '—'
		}
	}

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const canSaveToLocal = useRef(false)

	useEffect(() => {
		const timer = setTimeout(() => {
			canSaveToLocal.current = true
		}, 1000)
		return () => clearTimeout(timer)
	}, [])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const sortableFields = [
		{ title: 'Full Name', field: 'admission.firstName' },
		{ title: 'Sales Person Name', field: 'salesPersonName' },
		{ title: 'Date', field: 'callDate' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>FGIIT Admission Form</PageTitle>

			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title w-100 m-0'>
						<div className='row w-100 align-items-center'>
							<div className='col-md-6'>
								<div className='d-flex align-items-center'>
									<div className='me-4'>
										<SearchFilter
											searchTerm={searchTerm}
											setSearchTerm={setSearchTerm}
										/>
									</div>
									<div className='d-md-block d-none'>
										<LengthMenu
											expenseData={data}
											handleItemsPerPageChange={handleItemsPerPageChange}
										/>
									</div>
								</div>
							</div>
							<div className='col-md-6 d-flex justify-content-md-end'>
								<div className='mt-md-0 mt-2'>
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										rightValue='0'
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={data}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							removeAction={false}
							disableSortFields={['recordingUrl', 'mobile', 'salesPersonName']}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={index}>
									<tr
										className='data-row'
										onClick={() => handleRowClick(index.toString())}>
										<td className='text-center'>
											<div
												className='d-flex ms-8'
												role='button'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{item.clientName}
												</span>
												<span className='text-muted fs-7'>{item.mobile || '—'}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{item.salesPersonName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{formatDate(item.callDate || item.admission?.dateOfBirth)}
											</span>
										</td>

										<td>
											<TableButton
												action='view'
												to={`/master/caller-desk-admission-view?id=${item.reportId}`}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={7}>
												<div>
													<div className='d-flex align-items-center mb-2'>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold fs-6'>
																{item.admission?.firstName} {item.admission?.lastName}
															</span>
															<span className='text-muted fw-semibold d-flex fs-7'>
																{item.mobile}
															</span>
														</div>
													</div>
													<strong>{sortableFields[1].title}:</strong> {item.salesPersonName}
													<br />
													<strong>{sortableFields[2].title}:</strong>{' '}
													{formatDate(item.callDate || item.admission?.dateOfBirth)}
													{/* Document Thumbnails */}
													<div className='d-flex flex-wrap gap-3 mt-4'>
														{[
															{ label: 'Photo', url: item.admission?.photo },
															{ label: 'Aadhaar (F)', url: item.admission?.aadhaarCardFront },
															{ label: 'Aadhaar (B)', url: item.admission?.aadhaarCardBack },
															{ label: 'Marksheet', url: item.admission?.marksheet },
														]
															.filter((doc) => doc.url)
															.map((doc, idx) => (
																<div
																	key={idx}
																	className='d-flex flex-column align-items-center'>
																	<a
																		href={doc.url}
																		target='_blank'
																		rel='noreferrer'
																		className='border rounded bg-light d-flex align-items-center justify-content-center'
																		style={{
																			width: '60px',
																			height: '60px',
																			overflow: 'hidden',
																		}}
																		title={doc.label}>
																		{doc.url.toLowerCase().endsWith('.pdf') ? (
																			<i className='bi bi-file-earmark-pdf text-danger fs-2'></i>
																		) : (
																			<img
																				src={doc.url}
																				alt={doc.label}
																				style={{
																					width: '100%',
																					height: '100%',
																					objectFit: 'cover',
																				}}
																			/>
																		)}
																	</a>
																	<span
																		className='text-muted mt-1'
																		style={{ fontSize: '10px' }}>
																		{doc.label}
																	</span>
																</div>
															))}
													</div>
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

					{data.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{data.length > 0 && (
						<UsersListPagination
							totalPages={
								metaData?.totalPages || Math.ceil(data.length / pagination.itemsPerPage) || 1
							}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/* Recording Modal */}
			{recordingUrl && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 9999,
						background: 'rgba(0,0,0,0.45)',
						backdropFilter: 'blur(4px)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
					onClick={closeRecording}>
					<div
						style={{
							background: '#fff',
							borderRadius: '16px',
							padding: '28px 32px',
							minWidth: '380px',
							maxWidth: '520px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
						}}
						onClick={(e) => e.stopPropagation()}>
						<div className='d-flex align-items-center justify-content-between mb-4'>
							<div className='d-flex align-items-center gap-3'>
								<div
									style={{
										width: 40,
										height: 40,
										borderRadius: '50%',
										background: '#e8fff3',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}>
									<FontAwesomeIcon
										icon={faVolumeUp}
										style={{ color: '#17c964', fontSize: 16 }}
									/>
								</div>
								<div>
									<div className='fw-bold text-gray-800 fs-6'>Call Recording</div>
									<div className='text-muted fs-8'>Tap play to listen</div>
								</div>
							</div>
							<button
								onClick={closeRecording}
								style={{
									background: '#f4f4f5',
									border: 'none',
									borderRadius: '50%',
									width: 32,
									height: 32,
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}>
								<FontAwesomeIcon
									icon={faTimes}
									style={{ color: '#71717a', fontSize: 13 }}
								/>
							</button>
						</div>
						<audio
							ref={audioRef}
							src={recordingUrl}
							controls
							style={{ width: '100%', borderRadius: '10px', outline: 'none' }}
						/>
						<div className='d-flex justify-content-end mt-4'>
							<a
								href={recordingUrl}
								target='_blank'
								rel='noreferrer'
								className='btn btn-sm btn-light-primary'
								style={{ fontSize: '12px', borderRadius: '8px' }}>
								Open in new tab
							</a>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
