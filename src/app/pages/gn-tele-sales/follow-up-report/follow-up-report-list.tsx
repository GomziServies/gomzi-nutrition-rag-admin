import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import * as FGGroupAPIs from '../../../Functions/FGGroup'
import {
	CreateGnFollowUpReport,
	GetGnFollowUpReport,
	UpdateGnPersonalDetails,
} from '../../../Functions/FGGroup/GnFollowUpReport'
import { useAuth } from '../../../modules/auth/core/Auth'

const FollowUpReportList: React.FC = () => {
	const { currentUser } = useAuth()
	const navigate = useNavigate()

	const [searchParams] = useSearchParams()
	const adId = searchParams.get('ad') || ''
	const adNameFromUrl = searchParams.get('name') || ''

	const [searchTerm, setSearchTerm] = useState('')
	const [jobData, setJobData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [loading, setLoading] = useState(false)
	const [employeeId, setEmployeeId] = useState<string>('')
	const [rowColors, setRowColors] = useState<Record<string, string>>({})
	const [selectedColor, setSelectedColor] = useState('')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [selectedPlatform, setSelectedPlatform] = useState('')
	const [exporting, setExporting] = useState(false)

	const [isModalOpen, setIsModalOpen] = useState(false)
	const [leadFormData, setLeadFormData] = useState({
		full_name: '',
		phone_number: '',
		email: '',
		city: '',
		age: '',
	})
	const [savingLead, setSavingLead] = useState(false)

	const [sort, setSort] = useState('created_time')
	const [sortOrder, setSortOrder] = useState<any>('desc')

	const colorOptions = [
		{ label: 'No Color', value: '', dot: '#ccc', bg: 'transparent', border: '#e5e7eb' },
		{ label: 'Red', value: '#fff0f0', dot: '#ff4d4d', bg: '#fff0f0', border: '#ff4d4d' },
		{ label: 'Green', value: '#f0fff0', dot: '#28a745', bg: '#f0fff0', border: '#28a745' },
		{ label: 'Yellow', value: '#fffff0', dot: '#ffc107', bg: '#fffff0', border: '#ffc107' },
		{ label: 'Orange', value: '#fff5eb', dot: '#ff8c00', bg: '#fff5eb', border: '#ff8c00' },
		{ label: 'Blue', value: '#f0f5ff', dot: '#3699ff', bg: '#f0f5ff', border: '#3699ff' },
	]

	const handleLeadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setLeadFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSaveLead = async () => {
		if (!leadFormData.full_name || !leadFormData.phone_number || !leadFormData.city) {
			toast.error('Name, Phone and City are required')
			return
		}

		setSavingLead(true)
		try {
			await FGGroupAPIs.CreateManualFacebookLead({
				...leadFormData,
				ad_id: null,
				ad_name: null,
				lead_id: null,
				created_time: new Date().toISOString(),
				platform: 'Pull_marketing',
				tag: 'gn',
				assigned_to: employeeId,
			})
			toast.success('Lead created successfully')
			setIsModalOpen(false)
			setLeadFormData({ full_name: '', phone_number: '', email: '', city: '', age: '' })
			fetchJobData()
		} catch (err) {
			console.error('Failed to create lead:', err)
			toast.error('Failed to create lead')
		}
		setSavingLead(false)
	}

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res: any = await FGGroupAPIs.getProfile()
				if (res.status === 200 && res.data?.employee_id) {
					setEmployeeId(res.data.employee_id)
				}
			} catch (error) {
				console.error('Failed to fetch profile', error)
			}
		}
		fetchProfile()
	}, [])

	const fetchJobData = async () => {
		setLoading(true)
		try {
			const queryPayload: any = { tag: 'gn', limit: 1000 }
			if (adId) queryPayload.ad_id = adId
			if (selectedPlatform) {
				queryPayload.platform =
					selectedPlatform === 'fb'
						? 'facebook'
						: selectedPlatform === 'ig'
						? 'instagram'
						: selectedPlatform
			}
			if (selectedDateRange) {
				queryPayload.from_date = selectedDateRange[0]
				queryPayload.to_date = selectedDateRange[1]
			}

			const res: any = await FGGroupAPIs.GetFacebookLeads(queryPayload)
			const rawLeads: any[] = (res.data?.leads || []).filter((lead: any) => {
				const leadCreatedTime = lead.created_time || lead.createdTime
				const leadDate = leadCreatedTime ? new Date(leadCreatedTime) : null
				const isBeforeCutoff = leadDate ? leadDate < new Date('2026-05-11') : false
				return lead.assigned_to === employeeId || isBeforeCutoff
			})
			const parsed = rawLeads.map((lead: any) => ({
				_id: lead._id || lead.id || lead.lead_id,
				ad_id: lead.ad_id,
				title: lead.full_name || lead.fullName || '-',
				contact_email: lead.email || '-',
				contact_mobile: lead.phone_number || lead.phone || '-',
				city: lead.city || '-',
				created_time:
					lead.created_time || lead.createdTime
						? new Date(lead.created_time || lead.createdTime).toLocaleString('en-IN', {
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
								hour12: true,
						  })
						: '-',
				ad_name: lead.ad_name || lead.adName || (adId ? adNameFromUrl || 'Ad' : '-'),
				platform: lead.platform || '-',
				next_follow_up_date: lead.next_follow_up_date
					? new Date(lead.next_follow_up_date).toLocaleString('en-IN', {
							day: '2-digit',
							month: '2-digit',
							year: 'numeric',
					  })
					: '-',
				additional_note: lead.additional_note || '',
				final_amount: lead.final_amount || '-',
				color_code: lead.color_code,
				assigned_to: lead.assigned_to,
				raw_created_time: lead.created_time || lead.createdTime || 0,
			}))

			setJobData(parsed)
			const initialColors: Record<string, string> = {}
			parsed.forEach((p: any) => {
				if (p.color_code) initialColors[p._id] = p.color_code
			})
			setRowColors(initialColors)
			setMetaData({ totalPages: Math.ceil(parsed.length / pagination.itemsPerPage) || 1 })
		} catch (err) {
			console.error('Error fetching leads:', err)
			setJobData([])
		}
		setLoading(false)
	}

	useEffect(() => {
		if (employeeId) {
			fetchJobData()
		}
	}, [
		adId,
		selectedDateRange,
		selectedPlatform,
		pagination.page,
		pagination.itemsPerPage,
		sort,
		sortOrder,
		selectedColor,
		employeeId,
	])

	useEffect(() => {
		const filtered = jobData.filter((item: any) => {
			const matchesSearch = Object.values(item).some(
				(val: any) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
			)
			const matchesColor =
				selectedColor === '' || (rowColors[item._id] || item.color_code) === selectedColor
			return matchesSearch && matchesColor
		})
		const totalPages = Math.ceil(filtered.length / pagination.itemsPerPage) || 1
		setMetaData({ totalPages })
	}, [searchTerm, selectedColor, jobData, pagination.itemsPerPage, rowColors])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, selectedColor])

	const filteredData = jobData
		.filter((item: any) => {
			const matchesSearch = Object.values(item).some(
				(val: any) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
			)
			const matchesColor =
				selectedColor === '' || (rowColors[item._id] || item.color_code) === selectedColor
			return matchesSearch && matchesColor
		})
		.sort((a: any, b: any) => {
			const aVal = sort === 'created_time' ? new Date(a.raw_created_time || 0).getTime() : a[sort]
			const bVal = sort === 'created_time' ? new Date(b.raw_created_time || 0).getTime() : b[sort]
			return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (sortOrder === 'asc' ? 1 : -1)
		})

	const paginatedData = filteredData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleSortChange = (field: string) => {
		if (sort === field) {
			setSortOrder((prev: string) => (prev === 'asc' ? 'desc' : 'asc'))
		} else {
			setSort(field)
			setSortOrder('asc')
		}
	}

	const handlePageChange = (page: number) => setPagination({ ...pagination, page })
	const handleItemsPerPageChange = (value: number) =>
		setPagination({ ...pagination, itemsPerPage: value })

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleColorChange = async (rowId: string, color: string) => {
		setRowColors((prev) => ({ ...prev, [rowId]: color }))
		const leadData = jobData.find((d: any) => d._id === rowId)
		if (leadData) {
			try {
				if (leadData.platform === 'Pull_marketing' && (!leadData.ad_id || leadData.ad_id === '-')) {
					await FGGroupAPIs.CreateManualFacebookLead({ id: rowId, color_code: color })
				} else {
					await FGGroupAPIs.CreateFacebookLead({
						ad_id: leadData.ad_id || adId,
						ad_name: leadData.ad_name !== '-' ? leadData.ad_name : adNameFromUrl,
						lead_id: rowId,
						color_code: color,
						tag: 'gn',
						action_by_email: currentUser?.email,
						action_time: new Date().toISOString(),
					})
				}
				toast.success('Lead updated successfully')
			} catch (err) {
				console.error('Failed to save lead color mapping:', err)
				toast.error('Failed to update lead')
			}
		}
	}

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredData.map((item: any) => ({
				Name: item.title || '-',
				Mobile: item.contact_mobile || '-',
				'Ad Name': item.ad_name || '-',
				City: item.city || '-',
				'Created Date': item.created_time || '-',
				'Next Follow Up': item.next_follow_up_date || '-',
				Amount: item.final_amount || '-',
				Platform: item.platform || '-',
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Follow Up Report')
			XLSX.writeFile(workbook, 'FollowUpReport.xlsx')
			toast.success('Excel file downloaded successfully')
		} catch (error) {
			console.error('Error exporting data:', error)
			toast.error('Failed to export data')
		} finally {
			setExporting(false)
		}
	}

	const handleActionClick = async (data: any) => {
		try {
			const cleanMobile =
				data.contact_mobile && data.contact_mobile !== '-' ? data.contact_mobile : ''
			const cleanEmail = data.contact_email && data.contact_email !== '-' ? data.contact_email : ''

			if (cleanMobile) {
				const res: any = await GetGnFollowUpReport({ mobile: cleanMobile })
				if (res.status === 200 && res.data && res.data.length > 0) {
					const existing = res.data[0]
					if (existing.personalDetails) {
						let needsUpdate = false
						const updatePayload: any = { personalDetails: { ...existing.personalDetails } }

						if (!existing.personalDetails.ad_name && data.ad_name && data.ad_name !== '-') {
							updatePayload.personalDetails.ad_name = data.ad_name
							needsUpdate = true
						}
						if (
							!existing.personalDetails.lead_created_at &&
							data.created_time &&
							data.created_time !== '-'
						) {
							updatePayload.personalDetails.lead_created_at = data.created_time
							needsUpdate = true
						}
						if (!existing.personalDetails.platform && data.platform && data.platform !== '-') {
							updatePayload.personalDetails.platform = data.platform
							needsUpdate = true
						}
						if (!existing.personalDetails.additional_note && data.additional_note) {
							updatePayload.personalDetails.additional_note = data.additional_note
							needsUpdate = true
						}

						if (needsUpdate) {
							await UpdateGnPersonalDetails({ id: existing._id }, updatePayload)
						}
					}
				} else {
					const payload = {
						personalDetails: {
							client_name: data.title || '',
							mobile: cleanMobile,
							email: cleanEmail,
							platform: data.platform !== '-' ? data.platform : undefined,
							ad_name: data.ad_name !== '-' ? data.ad_name : undefined,
							lead_created_at: data.created_time !== '-' ? data.created_time : undefined,
							additional_note: data.additional_note || undefined,
						},
					}
					await CreateGnFollowUpReport(payload)
				}
			}

			navigate(
				`/gn-tele-sales/follow-up-report-inner-list?mobile=${encodeURIComponent(
					cleanMobile
				)}&name=${encodeURIComponent(data.title)}&email=${encodeURIComponent(
					cleanEmail
				)}&city=${encodeURIComponent(data.city || '')}&platform=${encodeURIComponent(
					data.platform || ''
				)}&ad_name=${encodeURIComponent(data.ad_name || '')}&lead_created_at=${encodeURIComponent(
					data.created_time || ''
				)}`
			)
		} catch (err) {
			console.error('Failed to navigate:', err)
			toast.error('Something went wrong')
		}
	}

	const getPlatformBadge = (platform: string) => {
		const p = platform?.toLowerCase()
		if (p === 'ig' || p === 'instagram')
			return {
				label: 'Instagram',
				icon: 'bi-instagram',
				bg: '#fdf2f8',
				color: '#c026d3',
				border: '#f0abfc',
			}
		if (p === 'fb' || p === 'facebook')
			return {
				label: 'Facebook',
				icon: 'bi-facebook',
				bg: '#eff6ff',
				color: '#2563eb',
				border: '#bfdbfe',
			}
		if (p === 'pull_marketing')
			return {
				label: 'Pull Mktg',
				icon: 'bi-magnet',
				bg: '#f0fdf4',
				color: '#16a34a',
				border: '#bbf7d0',
			}
		return {
			label: platform || '-',
			icon: 'bi-question-circle',
			bg: '#f8fafc',
			color: '#64748b',
			border: '#e2e8f0',
		}
	}

	return (
		<>
			<style>{`
				.flr-card { border: none; box-shadow: 0 0 20px 0 rgba(76,87,125,.02); border-radius: 12px; background: #fff; }
				.flr-filter-bar { padding: 20px 25px; border-bottom: 1px solid #f1f3f9; background: #fafbff; border-radius: 12px 12px 0 0; }
				.flr-table { width: 100%; border-collapse: separate; border-spacing: 0; }
				.flr-table tr th { background: #fff; padding: 12px 15px; font-size: 12px; font-weight: 700; color: #b5b5c3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f3f9; cursor: pointer; transition: 0.3s; }
				.flr-table tr th:hover { color: #009ef7; }
				.flr-table tr th i { font-size: 10px; margin-left: 5px; opacity: 0.5; }
				.flr-row { transition: 0.2s; }
				.flr-row:hover { background: #fcfdfe !important; }
				.flr-row td { padding: 15px; vertical-align: middle; border-bottom: 1px solid #f1f3f9; }
				.flr-sr-no { font-weight: 700; color: #b5b5c3; width: 40px; }
				.flr-name-wrap { display: flex; flex-direction: column; }
				.flr-name { font-weight: 700; color: #3f4254; font-size: 14px; margin-bottom: 2px; }
				.flr-mobile { color: #80808f; font-size: 12px; font-weight: 500; }
				.flr-ad-name { color: #3f4254; font-weight: 600; font-size: 13px; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
				.flr-date { color: #7e8299; font-weight: 500; font-size: 12px; }
				.flr-followup { display: flex; align-items: center; gap: 6px; font-weight: 700; color: #50cd89; font-size: 12px; background: #e8fff3; padding: 4px 10px; border-radius: 6px; width: fit-content; }
				.flr-followup.no-date { background: #f5f8fa; color: #a1a5b7; }
				.flr-amount { font-weight: 700; color: #10b981; font-size: 13px; background: #ecfdf5; padding: 4px 10px; border-radius: 6px; width: fit-content; display: flex; align-items: center; border: 0px solid #d1fae5; }
				.flr-amount.no-amount { background: #f5f8fa; color: #a1a5b7; border-color: #e4e6ef; }
				.flr-platform-badge {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					padding: 4px 10px;
					border-radius: 8px;
					font-size: 11px;
					font-weight: 700;
					border: 1.5px solid;
					white-space: nowrap;
				}
				.flr-color-wrap { display: flex; align-items: center; gap: 8px; position: relative; width: 130px; }
				.flr-color-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
				.flr-color-select { border: 1px solid #e1e3ea; border-radius: 6px; padding: 5px 25px 5px 8px; font-size: 12px; font-weight: 600; color: #3f4254; width: 100%; outline: none; appearance: none; background: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2010%2010%22%3E%3Cpath%20fill%3D%22%23b5b5c3%22%20d%3D%22M5%207L0%202h10z%22/%3E%3C/svg%3E') no-repeat right 8px center; }
				.flr-action-wrap { display: flex; justify-content: center; }
				.flr-stats-bar { padding: 12px 25px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #f1f3f9; overflow-x: auto; }
				.flr-stat-chip { padding: 6px 12px; background: #f9fafb; border: 1px solid #f1f3f9; border-radius: 8px; font-size: 12px; font-weight: 600; color: #5e6278; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
				.flr-stat-dot { width: 6px; height: 6px; border-radius: 50%; }
				.flr-stat-count { background: #fff; padding: 1px 6px; border-radius: 4px; border: 1px solid #f1f3f9; font-size: 10px; font-weight: 700; }
				.flr-empty { padding: 60px; text-align: center; display: flex; flex-direction: column; align-items: center; }
				.flr-empty-icon { font-size: 40px; color: #e1e3ea; margin-bottom: 15px; }
				.flr-empty-title { font-size: 16px; font-weight: 700; color: #3f4254; margin-bottom: 5px; }
				.flr-empty-sub { font-size: 13px; color: #b5b5c3; }
				.col-center { text-align: center; }
				.flr-modal-header { padding: 20px 25px; border-bottom: 1px solid #f1f3f9; display: flex; align-items: center; justify-content: space-between; }
				.flr-modal-title { font-weight: 700; font-size: 18px; color: #181c32; }
				.flr-form-label { font-size: 13px; font-weight: 600; color: #3f4254; margin-bottom: 8px; display: block; }
				.flr-form-input { width: 100%; border: 1px solid #e1e3ea; border-radius: 8px; padding: 10px 15px; font-size: 13px; color: #3f4254; transition: 0.2s; }
				.flr-form-input:focus { border-color: #009ef7; box-shadow: 0 0 0 3px rgba(0,158,247,0.1); outline: none; }
				.flr-modal-footer { padding: 15px 25px; border-top: 1px solid #f1f3f9; display: flex; justify-content: flex-end; gap: 10px; }
				.flr-btn-save { background: #009ef7; color: #fff; border: none; padding: 10px 25px; border-radius: 8px; font-weight: 700; font-size: 13px; transition: 0.2s; }
				.flr-btn-save:hover { background: #008be5; }
				.flr-btn-cancel { background: #f5f8fa; color: #7e8299; border: none; padding: 10px 25px; border-radius: 8px; font-weight: 700; font-size: 13px; transition: 0.2s; }
				.flr-btn-cancel:hover { background: #eff2f5; color: #5e6278; }
			`}</style>

			<PageTitle breadcrumbs={[]}>
				{adId
					? adNameFromUrl
						? `Leads — ${decodeURIComponent(adNameFromUrl)}`
						: 'Gomzi Lead Management'
					: 'Gomzi Lead Management'}
			</PageTitle>

			<KTCard className='flr-card'>
				<div className='flr-filter-bar'>
					<div className='d-flex align-items-center justify-content-between flex-wrap gap-5'>
						<div className='d-flex align-items-center gap-3'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>

						<div className='d-flex align-items-center gap-3 flex-wrap'>
							<LengthMenu
								expenseData={jobData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>

							<select
								className='form-select form-select-solid fw-bold w-150px'
								value={selectedPlatform}
								onChange={(e) => setSelectedPlatform(e.target.value)}>
								<option value=''>All Platforms</option>
								<option value='ig'>Instagram</option>
								<option value='fb'>Facebook</option>
								<option value='Pull_marketing'>Pull Marketing</option>
							</select>

							<select
								className='form-select form-select-solid fw-bold w-150px'
								value={selectedColor}
								onChange={(e) => setSelectedColor(e.target.value)}>
								<option value=''>All Status</option>
								{colorOptions
									.filter((c) => c.value !== '')
									.map((c) => (
										<option
											key={c.value}
											value={c.value}>
											{c.label}
										</option>
									))}
							</select>
							<button
								className='btn btn-primary btn-icon'
								onClick={downloadExcel}
								disabled={loading || exporting || filteredData.length === 0}
								title='Download as Excel'>
								<FontAwesomeIcon
									icon={faDownload}
									className='fs-5'
								/>
							</button>
							<div>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
							<TableButton
								action='add'
								text='Add Lead'
								onClick={() => setIsModalOpen(true)}
							/>
						</div>
					</div>
				</div>

				<div className='flr-stats-bar'>
					{colorOptions
						.filter((c) => c.value !== '')
						.map((color) => {
							const count = filteredData.filter(
								(item: any) => (rowColors[item._id] || item.color_code) === color.value
							).length
							return (
								<div
									className='flr-stat-chip'
									key={color.value}>
									<span
										className='flr-stat-dot'
										style={{ backgroundColor: color.dot }}
									/>
									{color.label}
									{count > 0 && <span className='flr-stat-count'>{count}</span>}
								</div>
							)
						})}
				</div>

				<div className='card-body py-0 px-0'>
					<div className='table-responsive'>
						<table className='flr-table'>
							<thead>
								<tr>
									<th style={{ width: '60px' }}>No.</th>
									<th onClick={() => handleSortChange('title')}>
										Name & Mobile{' '}
										<i
											className={`bi bi-sort-${
												sort === 'title' ? (sortOrder === 'asc' ? 'up' : 'down') : 'alpha-down'
											}`}
										/>
									</th>
									<th onClick={() => handleSortChange('ad_name')}>
										Ad Name{' '}
										<i
											className={`bi bi-sort-${
												sort === 'ad_name' ? (sortOrder === 'asc' ? 'up' : 'down') : 'alpha-down'
											}`}
										/>
									</th>
									<th onClick={() => handleSortChange('city')}>
										City{' '}
										<i
											className={`bi bi-sort-${
												sort === 'city' ? (sortOrder === 'asc' ? 'up' : 'down') : 'alpha-down'
											}`}
										/>
									</th>
									<th onClick={() => handleSortChange('created_time')}>
										Created Date{' '}
										<i
											className={`bi bi-sort-${
												sort === 'created_time'
													? sortOrder === 'asc'
														? 'up'
														: 'down'
													: 'alpha-down'
											}`}
										/>
									</th>
									<th onClick={() => handleSortChange('next_follow_up_date')}>
										Next Follow Up{' '}
										<i
											className={`bi bi-sort-${
												sort === 'next_follow_up_date'
													? sortOrder === 'asc'
														? 'up'
														: 'down'
													: 'alpha-down'
											}`}
										/>
									</th>
									<th onClick={() => handleSortChange('final_amount')}>
										Amount{' '}
										<i
											className={`bi bi-sort-${
												sort === 'final_amount'
													? sortOrder === 'asc'
														? 'up'
														: 'down'
													: 'alpha-down'
											}`}
										/>
									</th>
									<th>Platform</th>
									<th className='col-center'>Status</th>
									<th className='col-center'>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={9}
											className='text-center py-20'>
											<span className='spinner-border text-primary' />
										</td>
									</tr>
								) : (
									paginatedData.map((data: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										const bgColor = rowColors[data._id] || data.color_code || ''
										const colorOpt =
											colorOptions.find((c) => c.value === bgColor) || colorOptions[0]
										const colorDot = colorOpt.dot
										const borderColor = colorOpt.border
										const platformInfo = getPlatformBadge(data.platform)

										return (
											<tr
												key={data._id}
												className='flr-row'
												style={{
													backgroundColor: bgColor || 'transparent',
													borderLeft: bgColor ? `4px solid ${borderColor}` : 'none',
												}}>
												<td className='flr-sr-no ps-8'>{actualIndex}</td>

												{/* Name & Mobile */}
												<td>
													<div className='flr-name-wrap'>
														<span className='flr-name'>{data.title || '-'}</span>
														<span className='flr-mobile'>
															<i className='bi bi-phone me-1' />
															{data.contact_mobile || '-'}
														</span>
													</div>
												</td>

												{/* Ad Name */}
												<td>
													<span
														className='flr-ad-name'
														title={data.ad_name}>
														{data.ad_name || '-'}
													</span>
												</td>

												{/* City */}
												<td>
													<span
														className='flr-ad-name'
														title={data.city}>
														{data.city || '-'}
													</span>
												</td>

												{/* Created Date */}
												<td>
													<span className='flr-date'>{data.created_time || '-'}</span>
												</td>

												{/* Next Follow Up */}
												<td>
													<span
														className={`flr-followup ${
															data.next_follow_up_date === '-' ? 'no-date' : ''
														}`}>
														{data.next_follow_up_date !== '-' && (
															<i
																className='bi bi-calendar-check'
																style={{ fontSize: 11 }}
															/>
														)}
														{data.next_follow_up_date || '-'}
													</span>
												</td>

												{/* Amount */}
												<td>
													<span
														className={`flr-amount ${
															data.final_amount === '-' ? 'no-amount' : ''
														}`}>
														{data.final_amount !== '-' && (
															<i
																className='bi bi-currency-rupee me-1'
																style={{ fontSize: 13 }}
															/>
														)}
														{data.final_amount || '-'}
													</span>
												</td>

												{/* Platform */}
												<td>
													<span
														className='flr-platform-badge'
														style={{
															background: platformInfo.bg,
															color: platformInfo.color,
															borderColor: platformInfo.border,
														}}>
														<i
															className={`bi ${platformInfo.icon}`}
															style={{ fontSize: '12px', color: platformInfo.color }}
														/>
														{platformInfo.label}
													</span>
												</td>

												{/* Color */}
												<td className='col-center'>
													<div className='flr-color-wrap mx-auto'>
														<span
															className='flr-color-dot'
															style={{ backgroundColor: colorDot }}
														/>
														<select
															className='flr-color-select'
															style={{
																backgroundColor: bgColor || '#fff',
																borderColor: bgColor ? borderColor : '#e1e3ea',
															}}
															value={bgColor}
															onChange={(e) => handleColorChange(data._id, e.target.value)}>
															{colorOptions.map((c) => (
																<option
																	key={c.value}
																	value={c.value}>
																	{c.label}
																</option>
															))}
														</select>
													</div>
												</td>

												{/* Action */}
												<td className='col-center'>
													<div className='flr-action-wrap'>
														<TableButton
															action='view'
															onClick={() => handleActionClick(data)}
														/>
													</div>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>

					{filteredData.length === 0 && !loading && (
						<div className='flr-empty'>
							<div className='flr-empty-icon'>
								<i className='bi bi-inbox' />
							</div>
							<span className='flr-empty-title'>No Records Found</span>
							<span className='flr-empty-sub'>Try adjusting your search or filters</span>
						</div>
					)}

					{filteredData.length > 0 && (
						<div className='px-6 py-4'>
							<UsersListPagination
								totalPages={metaData?.totalPages}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						</div>
					)}
				</div>
			</KTCard>

			<Modal
				show={isModalOpen}
				onHide={() => setIsModalOpen(false)}
				centered
				size='lg'>
				<div className='flr-modal-header'>
					<h3 className='flr-modal-title'>Add New Lead</h3>
					<button
						className='btn btn-icon btn-sm btn-active-light-primary'
						onClick={() => setIsModalOpen(false)}>
						<i className='bi bi-x fs-2' />
					</button>
				</div>

				<Modal.Body className='p-8'>
					<div className='row g-5'>
						<div className='col-md-6'>
							<label className='flr-form-label'>
								Full Name <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								className='flr-form-input'
								type='text'
								placeholder='Enter full name'
								name='full_name'
								value={leadFormData.full_name}
								onChange={handleLeadInputChange}
							/>
						</div>
						<div className='col-md-6'>
							<label className='flr-form-label'>
								Phone Number <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								className='flr-form-input'
								type='text'
								placeholder='Enter phone number'
								name='phone_number'
								value={leadFormData.phone_number}
								onChange={handleLeadInputChange}
							/>
						</div>
						<div className='col-md-6'>
							<label className='flr-form-label'>Email</label>
							<input
								className='flr-form-input'
								type='email'
								placeholder='Enter email address'
								name='email'
								value={leadFormData.email}
								onChange={handleLeadInputChange}
							/>
						</div>
						<div className='col-md-6'>
							<label className='flr-form-label'>
								City <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								className='flr-form-input'
								type='text'
								placeholder='Enter city'
								name='city'
								value={leadFormData.city}
								onChange={handleLeadInputChange}
							/>
						</div>
						<div className='col-md-6'>
							<label className='flr-form-label'>Age</label>
							<input
								className='flr-form-input'
								type='text'
								placeholder='Enter age'
								name='age'
								value={leadFormData.age}
								onChange={handleLeadInputChange}
							/>
						</div>
					</div>
				</Modal.Body>

				<div className='flr-modal-footer'>
					<button
						className='flr-btn-cancel'
						onClick={() => setIsModalOpen(false)}>
						Cancel
					</button>
					<button
						className='flr-btn-save'
						onClick={handleSaveLead}
						disabled={savingLead}>
						{savingLead && (
							<span
								className='spinner-border spinner-border-sm me-2'
								role='status'
								aria-hidden='true'
							/>
						)}
						Save Lead
					</button>
				</div>
			</Modal>
		</>
	)
}

export default FollowUpReportList
