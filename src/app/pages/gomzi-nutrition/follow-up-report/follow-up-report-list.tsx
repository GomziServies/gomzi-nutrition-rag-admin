import {
	faArrowLeft,
	faDownload,
	faPlus,
	faShareAlt,
	faUserFriends,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { endOfMonth, startOfMonth } from 'date-fns'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import * as FGGroupAPIs from '../../../Functions/FGGroup'
import {
	CreateGnFollowUpReport,
	GetGnFollowUpReport,
	UpdateGnPersonalDetails,
} from '../../../Functions/FGGroup/GnFollowUpReport'
import { useAuth } from '../../../modules/auth/core/Auth'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'

const FollowUpReportList: React.FC = () => {
	const { currentUser } = useAuth()
	const navigate = useNavigate()

	const [searchParams] = useSearchParams()
	const adId = searchParams.get('ad') || ''
	const adNameFromUrl = searchParams.get('name') || 'Ad'

	const [searchTerm, setSearchTerm] = useState('')
	const [jobData, setJobData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('created_time')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [loading, setLoading] = useState(false)
	const [rowColors, setRowColors] = useState<Record<string, string>>({})
	const [selectedColor, setSelectedColor] = useState('')
	const [selectedPlatform, setSelectedPlatform] = useState('')
	const [selectedAssignedTo, setSelectedAssignedTo] = useState('')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>([
		startOfMonth(new Date()),
		endOfMonth(new Date()),
	])
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

	const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false)
	const [employees, setEmployees] = useState<any[]>([])
	const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
	const [memberSearchTerm, setMemberSearchTerm] = useState('')
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [distributeDateRange, setDistributeDateRange] = useState<[Date, Date] | null>(null)
	const [distributeLeads, setDistributeLeads] = useState<any[]>([])
	const [loadingDistributeLeads, setLoadingDistributeLeads] = useState(false)
	const [distributing, setDistributing] = useState(false)

	const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
	const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)
	const [selectedReassignEmployeeIds, setSelectedReassignEmployeeIds] = useState<string[]>([])
	const [reassignMemberSearchTerm, setReassignMemberSearchTerm] = useState('')
	const [isReassignDropdownOpen, setIsReassignDropdownOpen] = useState(false)
	const [isReassigning, setIsReassigning] = useState(false)

	const fetchEmployees = async () => {
		try {
			const res = await FGGroupAPIs.GetEmployees({ limit: 1000 })
			const salesPersons = (res.data as any[]).filter(
				(emp: any) =>
					emp.employee?.position === 'Sales Person' &&
					emp.employee?.branch_name === 'Gomzi Nutrition'
			)
			setEmployees(salesPersons)
		} catch (err) {
			console.error('Failed to fetch employees:', err)
		}
	}

	useEffect(() => {
		fetchEmployees()
	}, [])

	const fetchLeadsForDistribution = async (range: [Date, Date] | null) => {
		if (!range) {
			setDistributeLeads([])
			return
		}
		setLoadingDistributeLeads(true)
		try {
			const queryPayload: any = {
				tag: 'gn',
				limit: 1000,
				from_date: range[0],
				to_date: range[1],
			}
			if (adId) queryPayload.ad_id = adId
			const res: any = await FGGroupAPIs.GetFacebookLeads(queryPayload)
			const allLeads = res.data?.leads || []
			const unassignedLeads = allLeads.filter(
				(l: any) => !l.assigned_to || l.assigned_to === '' || l.assigned_to === '-'
			)
			setDistributeLeads(unassignedLeads)
		} catch (err) {
			console.error('Failed to fetch leads for distribution:', err)
			toast.error('Failed to fetch leads for the selected date')
		}
		setLoadingDistributeLeads(false)
	}

	useEffect(() => {
		if (isDistributeModalOpen) {
			fetchLeadsForDistribution(distributeDateRange)
		}
	}, [distributeDateRange, isDistributeModalOpen])

	const handleDistributeLeads = async () => {
		const leadsToDistribute = distributeLeads
		if (leadsToDistribute.length === 0) {
			toast.error('No leads found for the selected date range')
			return
		}

		if (selectedEmployeeIds.length === 0) {
			toast.error('Please select at least one team member')
			return
		}

		setDistributing(true)
		try {
			const selectedEmployees = employees.filter((emp) => selectedEmployeeIds.includes(emp._id))

			for (let i = 0; i < leadsToDistribute.length; i++) {
				const lead = leadsToDistribute[i]
				const employee = selectedEmployees[i % selectedEmployees.length]

				await FGGroupAPIs.CreateFacebookLead({
					ad_id: lead.ad_id || adId,
					ad_name: lead.ad_name || (adId ? adNameFromUrl : '-'),
					lead_id: lead._id || lead.id || lead.lead_id,
					tag: 'gn',
					assigned_to: employee.employee_id,
				})
			}
			toast.success(`${leadsToDistribute.length} leads distributed successfully`)
			setIsDistributeModalOpen(false)
			setSelectedEmployeeIds([])
			setDistributeDateRange(null)
			fetchJobData()
		} catch (err) {
			console.error('Failed to distribute leads:', err)
			toast.error('Failed to distribute leads')
		}
		setDistributing(false)
	}

	const toggleSelectAll = () => {
		if (selectedLeadIds.length === filteredData.length) {
			setSelectedLeadIds([])
		} else {
			setSelectedLeadIds(filteredData.map((d: any) => d._id))
		}
	}

	const toggleSelectLead = (id: string) => {
		setSelectedLeadIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
	}

	const handleBulkReassign = async () => {
		if (selectedReassignEmployeeIds.length === 0) {
			toast.error('Please select at least one team member')
			return
		}
		setIsReassigning(true)
		try {
			const selectedEmployees = employees.filter((emp) =>
				selectedReassignEmployeeIds.includes(emp._id)
			)

			for (let i = 0; i < selectedLeadIds.length; i++) {
				const id = selectedLeadIds[i]
				const employee = selectedEmployees[i % selectedEmployees.length]
				const leadData = jobData.find((d: any) => d._id === id)

				if (leadData) {
					if (
						leadData.platform === 'Pull_marketing' &&
						(!leadData.ad_id || leadData.ad_id === '-')
					) {
						await FGGroupAPIs.CreateManualFacebookLead({
							id,
							assigned_to: employee.employee_id,
						})
					} else {
						await FGGroupAPIs.CreateFacebookLead({
							ad_id: leadData.ad_id || adId,
							ad_name: leadData.ad_name !== '-' ? leadData.ad_name : adNameFromUrl,
							lead_id: id,
							assigned_to: employee.employee_id,
							tag: 'gn',
						})
					}
				}
			}
			toast.success(`${selectedLeadIds.length} leads reassigned successfully`)
			setIsReassignModalOpen(false)
			setSelectedLeadIds([])
			setSelectedReassignEmployeeIds([])
			fetchJobData()
		} catch (err) {
			console.error('Failed to reassign leads:', err)
			toast.error('Failed to reassign leads')
		}
		setIsReassigning(false)
	}

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredData.map((item: any) => ({
				Name: item.title || '-',
				Mobile: item.contact_mobile || '-',
				'Ad Name': item.ad_name || '-',
				City: item.city || '-',
				'Next Follow Up': item.next_follow_up_date || '-',
				Amount: item.final_amount || '-',
				'Assigned To':
					employees.find((emp) => emp.employee_id === item.assigned_to)?.full_name ||
					item.assigned_to ||
					'-',
				Platform: item.platform || '-',
				'Created Date': item.created_time || '-',
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

	const handleLeadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setLeadFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSaveLead = async () => {
		if (!leadFormData.full_name) {
			toast.error('Full Name is required')
			return
		}
		if (!leadFormData.phone_number) {
			toast.error('Phone Number is required')
			return
		}
		if (!leadFormData.city) {
			toast.error('City is required')
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

	const colorOptions = [
		{ label: 'No Color', value: '', dot: '#d1d5db' },
		{ label: 'Red', value: '#fff0f0', dot: '#ef4444' },
		{ label: 'Green', value: '#f0fff4', dot: '#22c55e' },
		{ label: 'Yellow', value: '#fefce8', dot: '#eab308' },
		{ label: 'Orange', value: '#fff7ed', dot: '#f97316' },
		{ label: 'Blue', value: '#eff6ff', dot: '#3b82f6' },
	]

	const assignedToOptions = useMemo(
		() => [
			{ label: 'All Assigned To', value: '' },
			...employees.map((emp) => ({
				label: emp.full_name,
				value: emp.employee_id,
			})),
		],
		[employees]
	)

	const platformOptions = [
		{ label: 'All Platforms', value: '' },
		{ label: 'Facebook', value: 'fb' },
		{ label: 'Instagram', value: 'ig' },
		{ label: 'Pull Marketing', value: 'Pull_marketing' },
	]

	const colorFilterOptions = useMemo(
		() => [
			{ label: 'All Colors', value: '' },
			...colorOptions
				.filter((c) => c.value !== '')
				.map((c) => ({
					label: c.label,
					value: c.value,
				})),
		],
		[colorOptions]
	)

	const getBorderColor = (bg: string) => {
		const map: Record<string, string> = {
			'#fff0f0': '#ef4444',
			'#f0fff4': '#22c55e',
			'#fefce8': '#eab308',
			'#fff7ed': '#f97316',
			'#eff6ff': '#3b82f6',
		}
		return map[bg] || 'transparent'
	}

	const fetchJobData = async () => {
		setLoading(true)
		try {
			const queryPayload: any = { tag: 'gn', limit: 1000 }
			if (adId) queryPayload.ad_id = adId
			if (selectedDateRange) {
				queryPayload.from_date = selectedDateRange[0]
				queryPayload.to_date = selectedDateRange[1]
			}
			const res: any = await FGGroupAPIs.GetFacebookLeads(queryPayload)
			const rawLeads: any[] = res.data?.leads || []
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
		fetchJobData()
	}, [adId, selectedDateRange])

	useEffect(() => {
		const filtered = jobData.filter((item: any) => {
			const matchesSearch = Object.values(item).some(
				(val: any) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
			)
			const matchesColor =
				selectedColor === '' || (rowColors[item._id] || item.color_code) === selectedColor
			const p = item.platform?.toLowerCase()
			const sp = selectedPlatform?.toLowerCase()
			const matchesPlatform =
				selectedPlatform === '' ||
				p === sp ||
				(sp === 'fb' && p === 'facebook') ||
				(sp === 'ig' && p === 'instagram') ||
				(sp === 'pull_marketing' && p === 'pull_marketing')
			const matchesAssignedTo = selectedAssignedTo === '' || item.assigned_to === selectedAssignedTo

			return matchesSearch && matchesColor && matchesPlatform && matchesAssignedTo
		})
		const totalPages = Math.ceil(filtered.length / pagination.itemsPerPage) || 1
		setMetaData({ totalPages })
	}, [
		searchTerm,
		selectedColor,
		selectedPlatform,
		selectedAssignedTo,
		jobData,
		pagination.itemsPerPage,
		rowColors,
	])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, selectedColor, selectedPlatform, selectedAssignedTo, pagination.itemsPerPage])

	const filteredData = jobData
		.filter((item: any) => {
			const matchesSearch = Object.values(item).some(
				(val: any) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
			)
			const matchesColor =
				selectedColor === '' || (rowColors[item._id] || item.color_code) === selectedColor
			const p = item.platform?.toLowerCase()
			const sp = selectedPlatform?.toLowerCase()
			const matchesPlatform =
				selectedPlatform === '' ||
				p === sp ||
				(sp === 'fb' && p === 'facebook') ||
				(sp === 'ig' && p === 'instagram') ||
				(sp === 'pull_marketing' && p === 'pull_marketing')
			const matchesAssignedTo = selectedAssignedTo === '' || item.assigned_to === selectedAssignedTo

			return matchesSearch && matchesColor && matchesPlatform && matchesAssignedTo
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

	const handleActionClick = async (data: any) => {
		try {
			const cleanMobile =
				data.contact_mobile && data.contact_mobile !== '-' ? data.contact_mobile : ''
			const cleanEmail = data.contact_email && data.contact_email !== '-' ? data.contact_email : ''
			const cleanAdName = data.ad_name && data.ad_name !== '-' ? data.ad_name : ''
			const cleanCreatedTime =
				data.created_time && data.created_time !== '-' ? data.created_time : ''
			const cleanPlatform = data.platform && data.platform !== '-' ? data.platform : ''
			const cleanAdditionalNote =
				data.additional_note && data.additional_note !== '-' ? data.additional_note : ''

			if (cleanMobile) {
				try {
					const existingRes: any = await GetGnFollowUpReport({ mobile: cleanMobile })
					const existingData = existingRes?.data || existingRes || []
					if (Array.isArray(existingData) && existingData.length > 0) {
						const existingId = existingData[0]._id
						const existingPlatform = existingData[0].personalDetails?.platform
						const existingNote = existingData[0].personalDetails?.additional_note
						const existingAdName = existingData[0].personalDetails?.ad_name
						const existingLeadCreatedAt = existingData[0].personalDetails?.lead_created_at

						const patchPayload: any = {}
						if (
							cleanPlatform &&
							(!existingPlatform || existingPlatform === '' || existingPlatform === '-')
						)
							patchPayload.platform = cleanPlatform
						if (
							cleanAdditionalNote &&
							cleanAdditionalNote !== '-' &&
							(!existingNote || existingNote === '' || existingNote === '-')
						)
							patchPayload.additional_note = cleanAdditionalNote
						if (
							cleanAdName &&
							cleanAdName !== '-' &&
							(!existingAdName ||
								existingAdName === '' ||
								existingAdName === '-' ||
								existingAdName === 'N/A')
						)
							patchPayload.ad_name = cleanAdName
						if (
							cleanCreatedTime &&
							cleanCreatedTime !== '-' &&
							(!existingLeadCreatedAt ||
								existingLeadCreatedAt === '' ||
								existingLeadCreatedAt === '-' ||
								existingLeadCreatedAt === 'N/A')
						)
							patchPayload.lead_created_at = cleanCreatedTime

						if (Object.keys(patchPayload).length > 0) {
							try {
								await UpdateGnPersonalDetails({ id: existingId }, { personalDetails: patchPayload })
							} catch (e) {
								console.error('Silent patch failed', e)
							}
						}
						navigate(
							`/rag/follow-up-report-inner-list?mobile=${encodeURIComponent(
								cleanMobile
							)}&name=${encodeURIComponent(data.title)}&email=${encodeURIComponent(
								cleanEmail
							)}&city=${encodeURIComponent(data.city || '')}&platform=${encodeURIComponent(
								cleanPlatform
							)}&ad_name=${encodeURIComponent(cleanAdName)}&lead_created_at=${encodeURIComponent(
								cleanCreatedTime
							)}`
						)
						return
					}
				} catch (_) {}
			}

			const payload = {
				personalDetails: {
					client_name: data.title || '',
					mobile: cleanMobile,
					email: cleanEmail,
					platform: cleanPlatform,
					additional_note: cleanAdditionalNote,
					ad_name: cleanAdName,
					lead_created_at: cleanCreatedTime,
				},
			}
			await CreateGnFollowUpReport(payload)
			navigate(
				`/rag/follow-up-report-inner-list?mobile=${encodeURIComponent(
					cleanMobile
				)}&name=${encodeURIComponent(data.title)}&email=${encodeURIComponent(
					cleanEmail
				)}&city=${encodeURIComponent(data.city || '')}&platform=${encodeURIComponent(
					cleanPlatform
				)}&ad_name=${encodeURIComponent(cleanAdName)}&lead_created_at=${encodeURIComponent(
					cleanCreatedTime
				)}`
			)
		} catch (err) {
			console.error('Failed to store personal details:', err)
			toast.error('Failed to store personal details')
		}
	}

	const getRowColor = (rowId: string) => rowColors[rowId] || ''

	const columns = [
		{ field: 'selection', title: '' },
		{ field: 'sr', title: 'No.' },
		{ field: 'title', title: 'Name & Mobile' },
		{ field: 'ad_name', title: 'Ad Name' },
		{ field: 'city', title: 'City' },
		{ field: 'next_follow_up_date', title: 'Next Follow Up' },
		{ field: 'final_amount', title: 'Amount' },
		{ field: 'assigned_to', title: 'Assigned To' },
		{ field: 'platform', title: 'Platform' },
		{ field: 'color', title: 'Status' },
		{ field: 'action', title: 'Action' },
	]

	const SortIcon = ({ field }: { field: string }) => {
		const nonSortable = ['selection', 'sr', 'color', 'action']
		if (nonSortable.includes(field)) return null
		if (sort !== field)
			return (
				<span style={{ opacity: 0.25, fontSize: 9, marginLeft: 5, letterSpacing: '-1px' }}>▲▼</span>
			)
		return (
			<span style={{ fontSize: 9, marginLeft: 5, color: '#6366f1' }}>
				{sortOrder === 'asc' ? '▲' : '▼'}
			</span>
		)
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
				.flr-card {
					border: none;
					border-radius: 16px;
					overflow: hidden;
					box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 24px rgba(0,0,0,.04);
					background: #fff;
				}

				/* Filter Bar */
				.flr-filter-bar {
					padding: 18px 24px;
					background: #fafafa;
					border-bottom: 1px solid #f0f0f0;
				}
				.flr-filter-row {
					display: flex;
					align-items: center;
					justify-content: flex-start;
					gap: 12px;
					flex-wrap: wrap;
				}
				.flr-filter-left, .flr-filter-right {
					display: flex;
					align-items: center;
					gap: 10px;
				}
				.flr-select {
					height: 38px;
					padding: 0 32px 0 12px;
					border: 1px solid #DFE7F0;
					border-radius: 8px;
					font-size: 13px;
					font-weight: 500;
					color: #172B4D;
					background: #ffffff;
					min-width: 160px;
					outline: none;
					cursor: pointer;
					appearance: none;
					background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
					background-repeat: no-repeat;
					background-position: right 12px center;
					background-size: 11px;
					box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
					transition: border-color .15s ease, box-shadow .15s ease;
				}
				.flr-select:hover { border-color: #1E3A5F; }
				.flr-select:focus { border-color: #1E3A5F; box-shadow: 0 0 0 0.22rem rgba(30, 58, 95, 0.15); }

				/* Stats Bar */
				.flr-stats-bar {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 10px 24px;
					background: #fff;
					border-bottom: 1px solid #f0f0f0;
					gap: 12px;
					flex-wrap: wrap;
				}
				.flr-chips { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
				.flr-chip {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					padding: 4px 12px;
					border-radius: 20px;
					font-size: 12px;
					font-weight: 600;
					background: #f8f8f8;
					border: 1.5px solid #ebebeb;
					color: #555;
					white-space: nowrap;
				}
				.flr-chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
				.flr-chip-count {
					background: #fff;
					border: 1px solid #e5e7eb;
					padding: 1px 7px;
					border-radius: 10px;
					font-size: 11px;
					font-weight: 700;
					color: #374151;
				}

				/* Table */
				.flr-table-wrap { overflow-x: auto; }
				.flr-table {
					width: 100%;
					border-collapse: collapse;
					border-spacing: 0;
				}

				/* Head */
				.flr-table thead tr {
					background: #f9fafb;
					border-bottom: 2px solid #f0f0f0;
				}
				.flr-table thead th {
					padding: 12px 16px;
					font-size: 11px;
					font-weight: 700;
					color: #9ca3af;
					text-transform: uppercase;
					letter-spacing: .6px;
					white-space: nowrap;
					border: none;
					cursor: pointer;
					user-select: none;
					transition: color .15s;
				}
				.flr-table thead th:hover { color: #6366f1; }
				.flr-table thead th.col-center { text-align: center; }
				.flr-table thead th:first-child { padding-left: 24px; }
				.flr-table thead th:last-child { padding-right: 24px; }

				/* Body */
				.flr-table tbody tr.flr-row {
					border-bottom: 1px solid #f5f5f5;
					transition: filter .12s;
				}
				.flr-table tbody tr.flr-row:last-child { border-bottom: none; }
				.flr-table tbody tr.flr-row:hover { filter: brightness(0.97); }
				.flr-table tbody td {
					padding: 14px 16px;
					border: none;
					vertical-align: middle;
					font-size: 13px;
					color: #374151;
				}
				.flr-table tbody td:first-child { padding-left: 24px; }
				.flr-table tbody td:last-child { padding-right: 24px; }
				.flr-table tbody td.col-center { text-align: center; }

				/* Sr Badge */
				.flr-sr {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 30px;
					height: 30px;
					border-radius: 8px;
					background: #f3f4f6;
					color: #9ca3af;
					font-size: 11px;
					font-weight: 700;
				}

				/* Name + Mobile */
				.flr-name-block { display: flex; flex-direction: column; gap: 3px; }
				.flr-name { font-size: 13.5px; font-weight: 700; color: #111827; line-height: 1.3; }
				.flr-mobile {
					display: inline-flex;
					align-items: center;
					gap: 5px;
					font-size: 12px;
					font-weight: 500;
					color: #6b7280;
				}
				.flr-mobile i { font-size: 11px; color: #9ca3af; }

				/* Ad Name */
				.flr-ad-name {
					font-size: 13px;
					font-weight: 500;
					color: #374151;
					max-width: 180px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					display: block;
				}

				/* Date */
				.flr-date { font-size: 12.5px; color: #6b7280; font-weight: 500; white-space: nowrap; }

				/* Follow Up Badge */
				.flr-followup {
					display: inline-flex;
					align-items: center;
					gap: 5px;
					padding: 4px 10px;
					border-radius: 8px;
					background: #eef2ff;
					color: #4f46e5;
					font-size: 12px;
					font-weight: 600;
					white-space: nowrap;
				}
				.flr-followup.no-date { background: #f9fafb; color: #d1d5db; }
				.flr-amount {
					display: inline-flex;
					align-items: center;
					gap: 4px;
					padding: 4px 10px;
					border-radius: 8px;
					background: #f0fdf4;
					color: #16a34a;
					font-size: 12px;
					font-weight: 700;
					white-space: nowrap;
				}
				.flr-amount.no-amount { background: #f9fafb; color: #d1d5db; }

				/* Platform Badge */
				.flr-platform-badge {
					display: inline-flex;
					align-items: center;
					padding: 4px 10px;
					border-radius: 8px;
					font-size: 11.5px;
					font-weight: 700;
					letter-spacing: .2px;
					border: 1.5px solid;
					white-space: nowrap;
				}

				/* Color Select */
				.flr-color-wrap { position: relative; display: inline-block; }
				.flr-color-dot {
					position: absolute;
					left: 9px;
					top: 50%;
					transform: translateY(-50%);
					width: 9px;
					height: 9px;
					border-radius: 50%;
					pointer-events: none;
					z-index: 2;
				}
				.flr-color-select {
					height: 32px;
					padding: 0 28px 0 26px;
					border: 1.5px solid #e5e7eb;
					border-radius: 8px;
					font-size: 12px;
					font-weight: 600;
					color: #374151;
					background: #fff;
					min-width: 120px;
					outline: none;
					cursor: pointer;
					appearance: none;
					background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
					background-repeat: no-repeat;
					background-position: right 8px center;
					background-size: 10px;
					transition: all .15s;
				}
				.flr-color-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }

				/* Action */
				.flr-action-wrap {
					display: flex;
					align-items: center;
					justify-content: center;
				}

				/* Skeleton */
				.flr-skeleton td { padding: 14px 16px; border: none !important; }
				.flr-skeleton-box {
					height: 14px;
					border-radius: 6px;
					background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
					background-size: 200% 100%;
					animation: flr-shimmer 1.3s infinite;
				}
				@keyframes flr-shimmer {
					0% { background-position: 200% 0; }
					100% { background-position: -200% 0; }
				}

				/* Empty State */
				.flr-empty {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 72px 24px;
					gap: 12px;
				}
				.flr-empty-icon {
					width: 72px;
					height: 72px;
					border-radius: 50%;
					background: #f3f4f6;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.flr-empty-icon i { font-size: 28px; color: #d1d5db; }
				.flr-empty-title { font-size: 15px; font-weight: 700; color: #6b7280; }
				.flr-empty-sub { font-size: 13px; color: #9ca3af; }

				/* Modal */
				.flr-modal-header {
					padding: 20px 24px;
					background: #fafafa;
					border-bottom: 1px solid #f0f0f0;
					display: flex;
					align-items: center;
					justify-content: space-between;
				}
				.flr-modal-title { font-size: 17px; font-weight: 700; color: #111827; margin: 0; }
				.flr-modal-footer {
					padding: 16px 24px;
					border-top: 1px solid #f0f0f0;
					display: flex;
					justify-content: flex-end;
					gap: 10px;
				}
				.flr-form-label {
					font-size: 12.5px;
					font-weight: 700;
					color: #374151;
					margin-bottom: 6px;
					display: block;
				}
				.flr-form-input {
					width: 100%;
					height: 40px;
					padding: 0 14px;
					border: 1.5px solid #e5e7eb;
					border-radius: 10px;
					font-size: 13px;
					color: #111827;
					outline: none;
					transition: all .15s;
					background: #fff;
				}
				.flr-form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
				.flr-form-input::placeholder { color: #d1d5db; }
				.flr-btn-cancel {
					height: 38px;
					padding: 0 20px;
					background: #f3f4f6;
					color: #6b7280;
					border: none;
					border-radius: 10px;
					font-size: 13px;
					font-weight: 600;
					cursor: pointer;
					transition: all .15s;
				}
				.flr-btn-cancel:hover { background: #e5e7eb; color: #374151; }
				.flr-btn-save {
					height: 38px;
					padding: 0 24px;
					background: #6366f1;
					color: #fff;
					border: none;
					border-radius: 10px;
					font-size: 13px;
					font-weight: 600;
					cursor: pointer;
					transition: all .15s;
					box-shadow: 0 4px 14px rgba(99,102,241,.3);
				}
				.flr-btn-save:hover { background: #4f46e5; transform: translateY(-1px); }
				.flr-btn-save:disabled { opacity: .65; cursor: not-allowed; transform: none; }

				@media (max-width: 768px) {
					.flr-filter-row { flex-direction: column; }
					.flr-filter-left, .flr-filter-right { width: 100%; }
					.flr-select { width: 100%; min-width: unset; }
				}
					
					/* Multi-select Styles */
				.flr-multiselect-wrap { position: relative; width: 100%; }
				.flr-multiselect-input {
					min-height: 44px;
					padding: 6px 40px 6px 14px;
					border: 1.5px solid #3b82f6;
					border-radius: 8px;
					display: flex;
					flex-wrap: wrap;
					gap: 6px;
					align-items: center;
					background: #fff;
					cursor: pointer;
					position: relative;
				}
				.flr-multiselect-placeholder { color: #9ca3af; font-size: 13px; }
				.flr-multiselect-value { font-size: 13px; font-weight: 600; color: #111827; }
				.flr-multiselect-arrow {
					position: absolute;
					right: 12px;
					top: 50%;
					transform: translateY(-50%);
					color: #9ca3af;
					display: flex;
					gap: 8px;
					align-items: center;
				}
				.flr-multiselect-dropdown {
					position: absolute;
					top: calc(100% + 4px);
					left: 0;
					width: 100%;
					background: #fff;
					border: 1px solid #e5e7eb;
					border-radius: 8px;
					box-shadow: 0 10px 15px -3px rgba(0,0,0,.1);
					z-index: 100;
					overflow: hidden;
				}
				.flr-member-search-wrap { padding: 8px; border-bottom: 1px solid #f3f4f6; }
				.flr-member-search {
					width: 100%;
					height: 36px;
					border: none;
					padding: 0 8px;
					font-size: 13px;
					outline: none;
				}
				.flr-member-list { max-height: 240px; overflow-y: auto; padding: 4px 0; }
				.flr-member-item {
					padding: 8px 14px;
					display: flex;
					align-items: center;
					gap: 10px;
					cursor: pointer;
					transition: background .1s;
				}
				.flr-member-item:hover { background: #f9fafb; }
				.flr-member-item.selected { background: #f3f4f6; }
				.flr-member-name { font-size: 13px; font-weight: 500; color: #374151; }
				.flr-checkbox {
					width: 16px;
					height: 16px;
					border: 1.5px solid #d1d5db;
					border-radius: 4px;
					cursor: pointer;
				}
			`}</style>

			<div className='gz-mgmt-container'>
				<PageTitle breadcrumbs={[]}>
					{adId
						? adNameFromUrl
							? `Leads — ${decodeURIComponent(adNameFromUrl)}`
							: 'Gomzi Lead Management'
						: 'Gomzi Lead Management'}
				</PageTitle>

				{/* Breadcrumb */}
				<div className='gz-mgmt-breadcrumb'>
					<Link to='/rag/dashboard'>Dashboard</Link>
					<span className='sep'>&gt;</span>
					<Link to='/rag/follow-up-report-dashboard'>Follow-Up Dashboard</Link>
					<span className='sep'>&gt;</span>
					<span className='current'>
						{adId
							? adNameFromUrl
								? `Leads — ${decodeURIComponent(adNameFromUrl)}`
								: 'Lead Management'
							: 'Lead Management'}
					</span>
				</div>

				{/* Header */}
				<div className='gz-mgmt-header mb-4'>
					<div className='gz-mgmt-title-wrap'>
						<h1 className='gz-mgmt-title'>
							{adId
								? adNameFromUrl
									? `Campaign Leads: ${decodeURIComponent(adNameFromUrl)}`
									: 'Follow-Up Lead Management'
								: 'Follow-Up Lead Management'}
						</h1>
						<p className='gz-mgmt-subtitle'>
							Filter incoming inquiries, categorize lead priority status, and distribute leads across sales staff.
						</p>
					</div>
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						{adId && (
							<Link to='/rag/follow-up-report-dashboard' className='gz-mgmt-btn-secondary'>
								<FontAwesomeIcon icon={faArrowLeft} />
								<span>Back to Ads</span>
							</Link>
						)}
					</div>
				</div>

				<KTCard className='flr-card gz-mgmt-card'>
					{/* Filter Bar */}
					<div className='flr-filter-bar'>
						<div className='flr-filter-row'>
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								className='me-0'
							/>
						</div>

						<div>
							<LengthMenu
								expenseData={jobData}
								handleItemsPerPageChange={handleItemsPerPageChange}
								value={pagination.itemsPerPage}
								className='me-0'
							/>
						</div>

						<div>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center justify-content-center'
								onClick={downloadExcel}
								disabled={loading || exporting || filteredData.length === 0}
								style={{
									width: '38px',
									height: '38px',
									padding: 0,
									borderRadius: '8px',
									fontSize: '14px',
								}}
								title='Download as Excel'>
								<FontAwesomeIcon
									icon={faDownload}
									className='fs-5'
								/>
							</button>
						</div>

						<div style={{ minWidth: '170px' }}>
							<SelectField
								className='fv-row mb-0'
								label='Assigned To'
								showLabel={false}
								hideDefaultOption={true}
								name='assigned_to'
								value={selectedAssignedTo}
								onChange={(e) => {
									setSelectedAssignedTo(e.target.value)
									setPagination((p) => ({ ...p, page: 1 }))
								}}
								marginRemove={true}
								height='38px'
								options={assignedToOptions}
							/>
						</div>

						<div style={{ minWidth: '160px' }}>
							<SelectField
								className='fv-row mb-0'
								label='Platform'
								showLabel={false}
								hideDefaultOption={true}
								name='platform'
								value={selectedPlatform}
								onChange={(e) => {
									setSelectedPlatform(e.target.value)
									setPagination((p) => ({ ...p, page: 1 }))
								}}
								marginRemove={true}
								height='38px'
								options={platformOptions}
							/>
						</div>

						<div style={{ minWidth: '150px' }}>
							<SelectField
								className='fv-row mb-0'
								label='Color'
								showLabel={false}
								hideDefaultOption={true}
								name='color'
								value={selectedColor}
								onChange={(e) => setSelectedColor(e.target.value)}
								marginRemove={true}
								height='38px'
								options={colorFilterOptions}
							/>
						</div>

						<div>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>

				{/* Stats + Add Button */}
				<div className='flr-stats-bar'>
					<div className='flr-chips'>
						{colorOptions
							.filter((c) => c.value !== '')
							.map((color) => {
								const count = Object.values(rowColors).filter((c) => c === color.value).length
								return (
									<div
										className='flr-chip'
										key={color.value}>
										<span
											className='flr-chip-dot'
											style={{ backgroundColor: color.dot }}
										/>
										{color.label}
										{count > 0 && <span className='flr-chip-count'>{count}</span>}
									</div>
								)
							})}
					</div>
					<div className='d-flex gap-3 align-items-center'>
						{selectedLeadIds.length > 0 && (
							<TableButton
								action='add'
								text={`Bulk Reassign (${selectedLeadIds.length})`}
								onClick={() => setIsReassignModalOpen(true)}
								className='flex-shrink-0'
								style={{ backgroundColor: '#10b981', color: '#fff' }}
							/>
						)}
						<TableButton
							action='add'
							text={`Distribute Leads`}
							onClick={() => setIsDistributeModalOpen(true)}
							className='flex-shrink-0'
							style={{ backgroundColor: '#6366f1', color: '#fff' }}
						/>
						<TableButton
							action='add'
							text='Add Lead'
							onClick={() => setIsModalOpen(true)}
							className='flex-shrink-0'
						/>
					</div>
				</div>

				{/* Table */}
				<div className='card-body p-0'>
					<div className='flr-table-wrap'>
						<table className='flr-table'>
							<thead>
								<tr>
									{columns.map((col) => (
										<th
											key={col.field}
											className={
												['color', 'action', 'selection'].includes(col.field) ? 'col-center' : ''
											}
											onClick={() =>
												!['selection', 'sr', 'color', 'action'].includes(col.field) &&
												handleSortChange(col.field)
											}
											style={
												col.field === 'selection' ? { width: '40px', paddingLeft: '24px' } : {}
											}>
											{col.field === 'selection' ? (
												<input
													type='checkbox'
													className='form-check-input'
													checked={
														paginatedData.length > 0 &&
														paginatedData.every((d: any) => selectedLeadIds.includes(d._id))
													}
													onChange={toggleSelectAll}
												/>
											) : (
												<>
													{col.title}
													<SortIcon field={col.field} />
												</>
											)}
										</th>
									))}
								</tr>
							</thead>

							<tbody>
								{loading
									? Array.from({ length: 9 }).map((_, i) => (
											<tr
												key={i}
												className='flr-skeleton'>
												{Array.from({ length: 11 }).map((__, j) => (
													<td key={j}>
														<div
															className='flr-skeleton-box'
															style={{ width: j === 0 ? 30 : `${60 + Math.random() * 30}%` }}
														/>
													</td>
												))}
											</tr>
									  ))
									: paginatedData.map((data: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											const bgColor = getRowColor(data._id)
											const borderColor = getBorderColor(bgColor)
											const colorDot =
												colorOptions.find((c) => c.value === bgColor)?.dot || '#d1d5db'
											const platformStyle = getPlatformBadge(data.platform)

											return (
												<tr
													key={data._id}
													className='flr-row'
													style={{
														backgroundColor: bgColor || '#fff',
														borderLeft: bgColor
															? `4px solid ${borderColor}`
															: '4px solid transparent',
													}}>
													{/* Selection */}
													<td
														className='col-center'
														style={{ paddingLeft: '24px' }}>
														<input
															type='checkbox'
															className='form-check-input'
															checked={selectedLeadIds.includes(data._id)}
															onChange={() => toggleSelectLead(data._id)}
														/>
													</td>

													{/* Sr */}
													<td>
														<span className='flr-sr'>{actualIndex}</span>
													</td>

													{/* Name + Mobile */}
													<td>
														<div className='flr-name-block'>
															<span className='flr-name'>{data.title || '-'}</span>
															<span className='flr-mobile'>
																<i className='bi bi-telephone' />
																{data.contact_mobile || '-'}
															</span>
														</div>
													</td>

													{/* Ad Name */}
													<td>
														<div className='d-flex flex-column'>
															<span
																className='flr-ad-name'
																title={data.ad_name}>
																{data.ad_name || '-'}
															</span>
															<span
																className='flr-date mt-1'
																style={{ fontSize: '11px', opacity: 0.8 }}>
																<i
																	className='bi bi-calendar-event me-1'
																	style={{ fontSize: '10px' }}
																/>
																{data.created_time || '-'}
															</span>
														</div>
													</td>

													{/* City */}
													<td>
														<span
															className='flr-ad-name'
															title={data.city}>
															{data.city || '-'}
														</span>
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
																	style={{ fontSize: 11, marginRight: 4 }}
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

													{/* Assigned To */}
													<td>
														<span className='text-gray-900 fw-bold fs-7'>
															{employees.find((emp) => emp.employee_id === data.assigned_to)
																?.full_name ||
																data.assigned_to ||
																'-'}
														</span>
													</td>

													{/* Platform */}
													<td>
														<span
															className='flr-platform-badge'
															style={{
																background: platformStyle.bg,
																color: platformStyle.color,
																borderColor: platformStyle.border,
																padding: '3px 8px',
																borderRadius: '6px',
																display: 'inline-flex',
																alignItems: 'center',
																gap: '6px',
																fontWeight: 700,
																fontSize: '10.5px',
																border: '1px solid',
															}}>
															<i
																className={`bi ${platformStyle.icon}`}
																style={{ fontSize: 13, color: 'inherit' }}
															/>
															{platformStyle.label}
														</span>
													</td>

													{/* Color Select */}
													<td className='col-center'>
														<div className='flr-color-wrap'>
															<span
																className='flr-color-dot'
																style={{ backgroundColor: colorDot }}
															/>
															<select
																className='flr-color-select'
																style={{
																	backgroundColor: bgColor || '#fff',
																	borderColor: bgColor ? borderColor : '#e5e7eb',
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
									  })}
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
						<div className='px-8 py-5'>
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
					<div className='row g-6'>
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

			{/* Distribution Modal */}
			<Modal
				show={isDistributeModalOpen}
				onHide={() => setIsDistributeModalOpen(false)}
				centered>
				<div className='flr-modal-header'>
					<h3 className='flr-modal-title'>Distribute Leads</h3>
					<button
						className='btn btn-icon btn-sm btn-active-light-primary'
						onClick={() => setIsDistributeModalOpen(false)}>
						<i className='bi bi-x fs-2' />
					</button>
				</div>
				<Modal.Body className='p-8'>
					<div className='mb-8'>
						<label className='flr-form-label d-flex align-items-center gap-2 mb-3'>
							<i className='bi bi-calendar-event text-primary' /> Select Date Range for Leads
						</label>
						<DateFilter
							onDateRangeChange={(range) => setDistributeDateRange(range)}
							rightValue='0'
						/>
						{distributeDateRange && (
							<div className='mt-3 d-flex align-items-center gap-2'>
								{loadingDistributeLeads ? (
									<div
										className='spinner-border spinner-border-sm text-primary'
										role='status'
									/>
								) : (
									<span className='badge badge-light-primary fs-7 fw-bold'>
										{distributeLeads.length} leads found for this range
									</span>
								)}
							</div>
						)}
					</div>

					<div className='mb-8'>
						<label className='flr-form-label d-flex align-items-center gap-2 mb-3'>
							<i className='bi bi-people text-primary' /> Select Team Members
						</label>

						<div className='flr-multiselect-wrap'>
							<div
								className='flr-multiselect-input'
								onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
								{selectedEmployeeIds.length > 0 ? (
									<span className='flr-multiselect-value'>
										{employees
											.filter((e) => selectedEmployeeIds.includes(e._id))
											.map((e) => e.full_name)
											.join(', ')}
									</span>
								) : (
									<span className='flr-multiselect-placeholder'>Select team members...</span>
								)}
								<div className='flr-multiselect-arrow'>
									{selectedEmployeeIds.length > 0 && (
										<i
											className='bi bi-x fs-5'
											onClick={(e) => {
												e.stopPropagation()
												setSelectedEmployeeIds([])
											}}
										/>
									)}
									<i className={`bi bi-chevron-${isDropdownOpen ? 'up' : 'down'}`} />
								</div>
							</div>

							{isDropdownOpen && (
								<div className='flr-multiselect-dropdown'>
									<div className='flr-member-search-wrap'>
										<input
											type='text'
											className='flr-member-search'
											placeholder='Search members...'
											value={memberSearchTerm}
											onChange={(e) => setMemberSearchTerm(e.target.value)}
											onClick={(e) => e.stopPropagation()}
										/>
									</div>
									<div className='flr-member-list'>
										<div
											className='flr-member-item'
											onClick={() => {
												if (selectedEmployeeIds.length === employees.length) {
													setSelectedEmployeeIds([])
												} else {
													setSelectedEmployeeIds(employees.map((e) => e._id))
												}
											}}>
											<input
												type='checkbox'
												className='flr-checkbox'
												checked={
													selectedEmployeeIds.length === employees.length && employees.length > 0
												}
												readOnly
											/>
											<span className='flr-member-name fw-bold'>Select All</span>
										</div>
										{employees
											.filter((e) =>
												e.full_name.toLowerCase().includes(memberSearchTerm.toLowerCase())
											)
											.map((emp) => (
												<div
													key={emp._id}
													className={`flr-member-item ${
														selectedEmployeeIds.includes(emp._id) ? 'selected' : ''
													}`}
													onClick={() => {
														setSelectedEmployeeIds((prev) =>
															prev.includes(emp._id)
																? prev.filter((id) => id !== emp._id)
																: [...prev, emp._id]
														)
													}}>
													<input
														type='checkbox'
														className='flr-checkbox'
														checked={selectedEmployeeIds.includes(emp._id)}
														readOnly
													/>
													<span className='flr-member-name'>{emp.full_name}</span>
												</div>
											))}
									</div>
								</div>
							)}
						</div>
					</div>

					<button
						className='flr-btn-save w-100 py-4 mt-6'
						style={{ height: 'auto', background: '#6366f1' }}
						onClick={handleDistributeLeads}
						disabled={
							distributing ||
							selectedEmployeeIds.length === 0 ||
							distributeLeads.length === 0 ||
							loadingDistributeLeads
						}>
						{distributing
							? 'Processing...'
							: `Distribute ${distributeLeads.length} Leads Equally among ${selectedEmployeeIds.length} Selected`}
					</button>
				</Modal.Body>
			</Modal>

			{/* Reassign Modal */}
			<Modal
				show={isReassignModalOpen}
				onHide={() => setIsReassignModalOpen(false)}
				centered>
				<div className='flr-modal-header'>
					<h3 className='flr-modal-title'>Bulk Reassign Leads</h3>
					<button
						className='btn btn-icon btn-sm btn-active-light-primary'
						onClick={() => setIsReassignModalOpen(false)}>
						<i className='bi bi-x fs-2' />
					</button>
				</div>
				<Modal.Body className='p-8'>
					<div className='mb-6'>
						<p className='text-gray-600 fs-7 fw-bold mb-4'>
							You have selected <span className='text-primary'>{selectedLeadIds.length}</span>{' '}
							leads. Select team members to distribute these leads among.
						</p>
						<label className='flr-form-label d-flex align-items-center gap-2 mb-3'>
							<i className='bi bi-people text-primary' /> Select Team Members
						</label>

						<div className='flr-multiselect-wrap'>
							<div
								className='flr-multiselect-input'
								onClick={() => setIsReassignDropdownOpen(!isReassignDropdownOpen)}>
								{selectedReassignEmployeeIds.length > 0 ? (
									<span className='flr-multiselect-value'>
										{employees
											.filter((e) => selectedReassignEmployeeIds.includes(e._id))
											.map((e) => e.full_name)
											.join(', ')}
									</span>
								) : (
									<span className='flr-multiselect-placeholder'>Select team members...</span>
								)}
								<div className='flr-multiselect-arrow'>
									{selectedReassignEmployeeIds.length > 0 && (
										<i
											className='bi bi-x fs-5'
											onClick={(e) => {
												e.stopPropagation()
												setSelectedReassignEmployeeIds([])
											}}
										/>
									)}
									<i className={`bi bi-chevron-${isReassignDropdownOpen ? 'up' : 'down'}`} />
								</div>
							</div>

							{isReassignDropdownOpen && (
								<div className='flr-multiselect-dropdown'>
									<div className='flr-member-search-wrap'>
										<input
											type='text'
											className='flr-member-search'
											placeholder='Search members...'
											value={reassignMemberSearchTerm}
											onChange={(e) => setReassignMemberSearchTerm(e.target.value)}
											onClick={(e) => e.stopPropagation()}
										/>
									</div>
									<div className='flr-member-list'>
										<div
											className='flr-member-item'
											onClick={() => {
												if (selectedReassignEmployeeIds.length === employees.length) {
													setSelectedReassignEmployeeIds([])
												} else {
													setSelectedReassignEmployeeIds(employees.map((e) => e._id))
												}
											}}>
											<input
												type='checkbox'
												className='flr-checkbox'
												checked={
													selectedReassignEmployeeIds.length === employees.length &&
													employees.length > 0
												}
												readOnly
											/>
											<span className='flr-member-name fw-bold'>Select All</span>
										</div>
										{employees
											.filter((e) =>
												e.full_name.toLowerCase().includes(reassignMemberSearchTerm.toLowerCase())
											)
											.map((emp) => (
												<div
													key={emp._id}
													className={`flr-member-item ${
														selectedReassignEmployeeIds.includes(emp._id) ? 'selected' : ''
													}`}
													onClick={() => {
														setSelectedReassignEmployeeIds((prev) =>
															prev.includes(emp._id)
																? prev.filter((id) => id !== emp._id)
																: [...prev, emp._id]
														)
													}}>
													<input
														type='checkbox'
														className='flr-checkbox'
														checked={selectedReassignEmployeeIds.includes(emp._id)}
														readOnly
													/>
													<span className='flr-member-name'>{emp.full_name}</span>
												</div>
											))}
									</div>
								</div>
							)}
						</div>
					</div>

					<button
						className='btn w-100 py-4 fw-bolder'
						style={{
							backgroundColor: '#10b981',
							color: '#fff',
							boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
						}}
						onClick={handleBulkReassign}
						disabled={isReassigning || selectedReassignEmployeeIds.length === 0}>
						{isReassigning
							? 'Processing...'
							: `Reassign ${selectedLeadIds.length} Leads Equally among ${selectedReassignEmployeeIds.length} Selected`}
					</button>
				</Modal.Body>
			</Modal>
			</div>
		</>
	)
}

export default FollowUpReportList
