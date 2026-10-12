import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../../_metronic/layout/core'
import LengthMenu from '../../../../../components/LengthMenu'
import SearchFilter from '../../../../../components/SearchFilter'
import Table from '../../../../../components/Table'
import UsersListPagination from '../../../../../components/TablePagination'
import * as FGGroupAPIs from '../../../../../Functions/FGGroup'
import { useAuth } from '../../../../../modules/auth/core/Auth'

const FollowUpReportList: React.FC = () => {
	const { currentUser } = useAuth()
	const navigate = useNavigate()

	const [searchParams] = useSearchParams()
	const adId = searchParams.get('ad') || ''
	const adNameFromUrl = searchParams.get('name') || ''

	const [searchTerm, setSearchTerm] = useState('')
	const [jobData, setJobData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [loading, setLoading] = useState(false)
	const [rowColors, setRowColors] = useState<Record<string, string>>({})
	const [selectedColor, setSelectedColor] = useState('')
	const [exporting, setExporting] = useState(false)

	const colorOptions = [
		{ label: 'No Color', value: '', dot: '#ccc' },
		{ label: 'Red', value: '#fff0f0', dot: '#ff4d4d' },
		{ label: 'Green', value: '#f0fff0', dot: '#28a745' },
		{ label: 'Yellow', value: '#fffff0', dot: '#ffc107' },
		{ label: 'Orange', value: '#fff5eb', dot: '#ff8c00' },
		{ label: 'Blue', value: '#f0f5ff', dot: '#3699ff' },
	]

	const getBorderColor = (bg: string) => {
		const map: Record<string, string> = {
			'#fff0f0': '#ff4d4d',
			'#f0fff0': '#28a745',
			'#fffff0': '#ffc107',
			'#fff5eb': '#ff8c00',
			'#f0f5ff': '#3699ff',
		}
		return map[bg] || 'transparent'
	}

	const getField = (fieldData: any[], name: string): string => {
		if (!Array.isArray(fieldData)) return '-'
		const f = fieldData.find((d: any) => d.name === name)
		return f?.values?.[0] || '-'
	}

	const fetchJobData = async () => {
		setLoading(true)
		try {
			const queryPayload: any = { tag: 'gn', limit: 1000 }
			if (adId) queryPayload.ad_id = adId

			const res: any = await FGGroupAPIs.GetFacebookLeads(queryPayload)
			const rawLeads: any[] = res.data?.leads || []
			const parsed = rawLeads.map((lead: any) => ({
				_id: lead.lead_id,
				ad_id: lead.ad_id,
				title: lead.full_name || getField(lead.field_data, 'full_name') || '-',
				contact_email: lead.email || getField(lead.field_data, 'email') || '-',
				contact_mobile: lead.phone_number || getField(lead.field_data, 'phone_number') || '-',
				city: lead.city || getField(lead.field_data, 'city') || '-',
				company_name: getField(lead.field_data, 'company_name') || '-',
				category: getField(lead.field_data, 'what_is_your_product_category?') || '-',
				created_time: lead.created_time
					? new Date(lead.created_time).toLocaleString('en-IN', {
							day: '2-digit',
							month: '2-digit',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
							hour12: true,
					  })
					: '-',
				ad_name: lead.ad_name || (adId ? adNameFromUrl || 'Ad' : '-'),
				color_code: lead.color_code,
			}))

			setJobData(parsed)
			const initialColors: Record<string, string> = {}
			parsed.forEach((p: any) => {
				if (p.color_code) initialColors[p._id] = p.color_code
			})
			setRowColors(initialColors)
			setMetaData({ totalPages: Math.ceil(parsed.length / pagination.itemsPerPage) || 1 })
		} catch (err) {
			setJobData([])
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchJobData()
	}, [adId])

	useEffect(() => {
		const filtered = jobData.filter((item: any) => {
			const matchesSearch = Object.values(item).some(
				(val: any) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
			)
			const matchesColor = selectedColor === '' || item.color_code === selectedColor
			return matchesSearch && matchesColor
		})
		setMetaData({ totalPages: Math.ceil(filtered.length / pagination.itemsPerPage) || 1 })
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, selectedColor, jobData, pagination.itemsPerPage])

	const filteredData = jobData.filter((item: any) => {
		const matchesSearch = Object.values(item).some(
			(val: any) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
		)
		const matchesColor = selectedColor === '' || item.color_code === selectedColor
		return matchesSearch && matchesColor
	})

	const paginatedData = filteredData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}
	const handlePageChange = (page: number) => setPagination({ ...pagination, page })
	const handleItemsPerPageChange = (value: number) =>
		setPagination({ ...pagination, itemsPerPage: value })
	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) setVisibleDetails(visibleDetails === id ? null : id)
	}

	const handleColorChange = async (rowId: string, color: string) => {
		setRowColors((prev) => ({ ...prev, [rowId]: color }))
		const leadData = jobData.find((d: any) => d._id === rowId)
		if (leadData) {
			try {
				await FGGroupAPIs.CreateFacebookLead({
					ad_id: leadData.ad_id || adId,
					ad_name: leadData.ad_name !== '-' ? leadData.ad_name : adNameFromUrl,
					lead_id: rowId,
					color_code: color,
					tag: 'gn',
					action_by_email: currentUser?.email,
					action_time: new Date().toISOString(),
				})
				toast.success('Lead updated successfully')
			} catch (err) {
				toast.error('Failed to update lead')
			}
		}
	}

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredData.map((item: any) => ({
				'Full Name': item.title || '-',
				Email: item.contact_email || '-',
				Mobile: item.contact_mobile || '-',
				'Ad Name': item.ad_name || '-',
				'Created Date': item.created_time || '-',
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')
			XLSX.writeFile(workbook, 'Leads.xlsx')
			toast.success('Excel file downloaded successfully')
		} catch (error) {
			console.error('Error exporting data:', error)
			toast.error('Failed to export data')
		} finally {
			setExporting(false)
		}
	}

	// Direct navigate — no API call needed at eye button step
	const handleActionClick = (data: any) => {
		const cleanMobile =
			data.contact_mobile && data.contact_mobile !== '-' ? data.contact_mobile : ''
		const cleanEmail = data.contact_email && data.contact_email !== '-' ? data.contact_email : ''
		navigate(
			`/automation/gn/follow-up-report-inner-list?mobile=${encodeURIComponent(
				cleanMobile
			)}&name=${encodeURIComponent(data.title)}&email=${encodeURIComponent(
				cleanEmail
			)}&city=${encodeURIComponent(data.city)}`
		)
	}

	const getRowColor = (rowId: string) => rowColors[rowId] || ''
	const sortableFields = [
		{ field: 'title', title: 'Full Name' },
		{ field: 'contact_email', title: 'Email' },
		{ field: 'contact_mobile', title: 'Mobile' },
		{ field: 'ad_name', title: 'Ad Name' },
		{ field: 'created_time', title: 'Created Date' },
		{ field: 'interest', title: 'Status Color' },
	]

	return (
		<>
			<style>{`
				.tele-report-card { border: none; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
				.filter-bar { background: linear-gradient(135deg, #f8f9fd 0%, #ffffff 100%); border-bottom: 1px solid #eef0f8; padding: 20px 24px; }
				.filter-group { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; width: 100%; justify-content: space-between; }
				.filter-left, .filter-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
				.custom-select { border: 1px solid #e4e6ef; border-radius: 8px; padding: 8px 30px 8px 14px; font-size: 13px; font-weight: 500; color: #3f4254; background-color: #fff; min-width: 190px; height: 40px; outline: none; cursor: pointer; appearance: none; }
				.data-row { cursor: pointer; border-bottom: 1px solid #f4f4f8; }
				.data-row td { padding: 14px 12px; vertical-align: middle; }
				.sr-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: #f1f3f9; color: #7e8299; font-weight: 700; font-size: 12px; }
				.name-cell { font-weight: 500; color: #181c32; font-size: 13px; }
				.masked-text, .masked-mobile { color: #181c32; font-size: 13px; font-weight: 500; }
				.color-select-wrapper { position: relative; }
				.color-indicator { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; pointer-events: none; z-index: 2; }
				.color-select { border: 1px solid #e4e6ef; border-radius: 8px; padding: 6px 12px 6px 30px; font-size: 13px; color: #3f4254; background-color: #fff; min-width: 140px; height: 38px; outline: none; cursor: pointer; appearance: none; }
				.stats-bar { display: flex; gap: 16px; padding: 12px 24px; background: #fff; border-bottom: 1px solid #f1f3f9; overflow-x: auto; }
				.stat-chip { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 8px; background: #f8f9fd; border: 1px solid #eef0f8; white-space: nowrap; font-size: 12px; font-weight: 600; color: #5e6278; }
				.stat-dot { width: 8px; height: 8px; border-radius: 50%; }
				.stat-count { background: #fff; padding: 2px 8px; border-radius: 4px; font-weight: 700; color: #3f4254; font-size: 11px; }
				.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; }
				.empty-icon { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #f1f3f9 0%, #e8ecf7 100%); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
				.empty-icon i { font-size: 32px; color: #b5b5c3; }
				.empty-title { font-size: 16px; font-weight: 600; color: #5e6278; margin-bottom: 4px; }
				.empty-subtitle { font-size: 13px; color: #a1a5b7; }
			`}</style>
			<PageTitle breadcrumbs={[]}>
				{adId ? `Leads — ${decodeURIComponent(adNameFromUrl)}` : 'All Saved Leads'}
			</PageTitle>

			<KTCard className='tele-report-card'>
				<div className='filter-bar'>
					<div className='filter-group'>
						<div className='filter-left'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
						<div className='filter-right'>
							<select
								className='custom-select me-3'
								value={selectedColor}
								onChange={(e) => setSelectedColor(e.target.value)}>
								<option value=''>All Colors</option>
								{colorOptions
									.filter((c) => c.value !== '')
									.map((color) => (
										<option
											key={color.value}
											value={color.value}>
											{color.label}
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
							<LengthMenu
								expenseData={jobData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
				</div>

				<div className='stats-bar'>
					{colorOptions
						.filter((color) => color.value !== '')
						.map((color) => {
							const count = Object.values(rowColors).filter((c) => c === color.value).length
							return (
								<div
									className='stat-chip'
									key={color.value}>
									<span
										className='stat-dot'
										style={{ backgroundColor: color.dot }}></span>
									{color.label}
									{count > 0 && <span className='stat-count'>{count}</span>}
								</div>
							)
						})}
				</div>

				<div className='card-body px-0 py-0'>
					<div className='table-responsive'>
						<Table
							data={paginatedData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							visibleDetails={visibleDetails}
							onSortChange={handleSortChange}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => {
								const bgColor = getRowColor(data._id)
								const borderColor = getBorderColor(bgColor)
								const colorDot = colorOptions.find((c) => c.value === bgColor)?.dot || '#ccc'
								return (
									<React.Fragment key={data._id}>
										<tr
											onClick={() => handleRowClick(data._id)}
											className='data-row'
											style={{
												backgroundColor: bgColor || 'transparent',
												borderLeft: bgColor ? `4px solid ${borderColor}` : '4px solid transparent',
											}}>
											<td className='ps-4'>
												<span className='sr-badge'>{actualIndex}</span>
											</td>
											<td>
												<span className='name-cell'>{data.title || '-'}</span>
											</td>
											<td>
												<span className='masked-text'>{data.contact_email || '-'}</span>
											</td>
											<td>
												<span className='masked-mobile'>{data.contact_mobile || '-'}</span>
											</td>
											<td>
												<span className='masked-text'>{data.ad_name || '-'}</span>
											</td>
											<td>
												<span className='masked-text'>{data.created_time || '-'}</span>
											</td>
											<td>
												<div className='color-select-wrapper'>
													<span
														className='color-indicator'
														style={{ backgroundColor: colorDot }}></span>
													<select
														className='color-select'
														style={{
															backgroundColor: bgColor || '#fff',
															borderColor: bgColor ? borderColor : '#e4e6ef',
														}}
														value={bgColor}
														onClick={(e) => e.stopPropagation()}
														onChange={(e) => {
															e.stopPropagation()
															handleColorChange(data._id, e.target.value)
														}}>
														{colorOptions.map((color) => (
															<option
																key={color.value}
																value={color.value}>
																{color.label}
															</option>
														))}
													</select>
												</div>
											</td>
											<td>
												<div onClick={(e) => e.stopPropagation()}>
													<button
														className='btn btn-sm btn-icon btn-light-primary'
														title='View Follow Ups'
														onClick={() => handleActionClick(data)}>
														<i className='bi bi-eye fs-4'></i>
													</button>
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className='detail-row'>
												<td colSpan={12}>
													<div className='d-flex flex-column gap-1'>
														<div className='detail-item'>
															<span className='detail-label'>
																<i className='bi bi-building me-1'></i> Company
															</span>
															<span className='detail-value'>{data.company_name || '-'}</span>
														</div>
														<div className='detail-item'>
															<span className='detail-label'>
																<i className='bi bi-geo-alt me-1'></i> City
															</span>
															<span className='detail-value'>{data.city || '-'}</span>
														</div>
														<div className='detail-item'>
															<span className='detail-label'>
																<i className='bi bi-tag me-1'></i> Category
															</span>
															<span className='detail-value'>{data.category || '-'}</span>
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								)
							}}
						/>
					</div>
					{filteredData.length === 0 && !loading && (
						<div className='empty-state'>
							<div className='empty-icon'>
								<i className='bi bi-inbox'></i>
							</div>
							<span className='empty-title'>No Records Found</span>
							<span className='empty-subtitle'>Try adjusting your search or filters</span>
						</div>
					)}
					{filteredData.length > 0 && (
						<div className='px-6 pb-4'>
							<UsersListPagination
								totalPages={metaData?.totalPages}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						</div>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default FollowUpReportList
