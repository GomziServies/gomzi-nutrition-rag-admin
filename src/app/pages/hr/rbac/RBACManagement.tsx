import React, { useEffect, useState } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SelectField from '../../../components/SelectField'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { GetPanels, GetMenus, AssignAuthority, GetAuthority, RemoveAuthority } from '../../../Functions/FGGroup/RBAC'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

const RBACManagement: React.FC = () => {
	const [employees, setEmployees] = useState<any[]>([])
	const [panels, setPanels] = useState<any[]>([])
	const [menus, setMenus] = useState<any[]>([])
	const [selectedEmployee, setSelectedEmployee] = useState<string>('')
	const [selectedPanel, setSelectedPanel] = useState<string>('')
	const [selectedMenus, setSelectedMenus] = useState<any[]>([])
	const [employeeAuthorities, setEmployeeAuthorities] = useState<any[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		fetchInitialData()
	}, [])

	const fetchInitialData = async () => {
		setLoading(true)
		try {
			const empRes: any = await GetEmployees({ limit: 1000 })
			setEmployees(empRes.data || [])

			const panelRes: any = await GetPanels()
			/*
			// Original unfiltered panel loading:
			setPanels(panelRes.data || [])
			*/
			// Restrict to only 3 panels: HR, Employee, and RAG (Gomzi_Nutrition)
			const ALLOWED_PANELS = ['hr', 'employee', 'gomzi_nutrition', 'rag', 'gomzi nutrition']
			const seen = new Set()
			const filteredPanels = (panelRes.data || []).filter((p: any) => {
				const norm = (p.name || '').toLowerCase().trim()
				if (ALLOWED_PANELS.includes(norm) && !seen.has(norm)) {
					seen.add(norm)
					return true
				}
				return false
			})
			setPanels(filteredPanels)
		} catch (error) {
			console.error(error)
			toast.error('Failed to fetch initial data')
		}
		setLoading(false)
	}

	const getFlatOptions = (menusList: any[]) => {
		const list: any[] = []
		menusList.forEach((m) => {
			list.push({ label: m.label, value: m.value })
			if (m.sub_menus && m.sub_menus.length > 0) {
				m.sub_menus.forEach((sm: any) => {
					list.push({ label: `   • ${sm.title}`, value: sm._id })
				})
			}
		})
		return list
	}

	const multiSelectOptions = React.useMemo(() => {
		return getFlatOptions(menus)
	}, [menus])

	const handleEmployeeChange = async (employeeId: string) => {
		setSelectedEmployee(employeeId)
		if (!employeeId) return

		try {
			const res: any = await GetAuthority({ employee_id: employeeId })
			setEmployeeAuthorities(res.data || [])
			// Update menus if a panel is already selected
			if (selectedPanel) {
				const currentAuth = res.data.find((a: any) => (a.panel_id?._id || a.panel_id) === selectedPanel)
				if (currentAuth) {
					const flatOpts = getFlatOptions(menus)
					setSelectedMenus(
						currentAuth.menu_ids.map((m: any) => {
							const id = m._id || m
							const found = flatOpts.find((o) => o.value === id)
							return found ? found : { label: m.title || 'Menu', value: id }
						})
					)
				} else {
					setSelectedMenus([])
				}
			}
		} catch (error) {
			console.error(error)
		}
	}

	const handlePanelChange = async (panelId: string) => {
		setSelectedPanel(panelId)
		if (!panelId) {
			setMenus([])
			return
		}

		try {
			const res: any = await GetMenus({ panel_id: panelId })
			const menuData = res.data || []
			console.log('RBAC Menus:', menuData)
			const mappedMenus = menuData.map((m: any) => ({ label: m.title, value: m._id, sub_menus: m.sub_menus || [] }))
			setMenus(mappedMenus)

			// Load existing authorities for this panel
			if (selectedEmployee) {
				const currentAuth = employeeAuthorities.find((a: any) => (a.panel_id?._id || a.panel_id) === panelId)
				if (currentAuth) {
					const flatOpts = getFlatOptions(mappedMenus)
					setSelectedMenus(
						currentAuth.menu_ids.map((m: any) => {
							const id = m._id || m
							const found = flatOpts.find((o) => o.value === id)
							return found ? found : { label: m.title || 'Menu', value: id }
						})
					)
				} else {
					setSelectedMenus([])
				}
			}
		} catch (error) {
			console.error(error)
		}
	}

	const handleSaveAuthority = async () => {
		if (!selectedEmployee) return toast.error('Please select an employee')
		if (!selectedPanel) return toast.error('Please select a panel')

		setLoading(true)
		try {
			const newAuthority = {
				panel_id: selectedPanel,
				menu_ids: selectedMenus.map((m) => m.value),
			}

			// Update authorities array
			let updatedAuthorities = [...employeeAuthorities]
			const index = updatedAuthorities.findIndex((a: any) => (a.panel_id?._id || a.panel_id) === selectedPanel)

			if (index > -1) {
				updatedAuthorities[index] = { ...updatedAuthorities[index], menu_ids: newAuthority.menu_ids }
			} else {
				updatedAuthorities.push(newAuthority)
			}

			// Format for API
			const payload = updatedAuthorities.map((a: any) => ({
				panel_id: a.panel_id?._id || a.panel_id,
				menu_ids: a.menu_ids.map((m: any) => m._id || m),
			}))

			await AssignAuthority({
				employee_id: selectedEmployee,
				authorities: payload,
			})

			toast.success('Authority updated successfully')
			handleEmployeeChange(selectedEmployee)
		} catch (error) {
			console.error(error)
			toast.error('Failed to update authority')
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteAuthority = async (authorityId: string) => {
		if (!selectedEmployee || !authorityId) return;

		const res = await Swal.fire({
			title: 'Delete this assigned Panel?',
			text: 'Are you sure you want to remove this assigned panel?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete',
		})

		if (res.isConfirmed) {
			setLoading(true);
			try {
				await RemoveAuthority({
					employee_id: selectedEmployee,
					authority_id: authorityId
				});
				handleEmployeeChange(selectedEmployee);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Authority Management</PageTitle>
			<div className='row g-5'>
				{/* Assignment Column */}
				<div className='col-md-12'>
					<KTCard>
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 mb-1'>Assign Authority</span>
								<span className='text-muted mt-1 fw-semibold fs-7'>Link Employees to Menus</span>
							</h3>
						</div>
						<div className='card-body'>
							<div className='row mb-10'>
								<div className='col-md-6'>
									<label className='form-label fw-bold'>Select Employee</label>
									<SelectField
										value={selectedEmployee}
										onChange={(val: any) => {
											const v = typeof val === 'object' && val?.target ? val.target.value : val
											handleEmployeeChange(v)
										}}
										options={[
											{ value: '', label: 'Choose Employee' },
											...employees.filter(emp => emp.employee_id).map((emp) => ({
												value: emp.employee_id,
												label: `${emp.full_name} (${emp.employee?.employee_code})`,
											})),
										]}
									/>
								</div>
								<div className='col-md-6'>
									<label className='form-label fw-bold'>Target Panel</label>
									<SelectField
										value={selectedPanel}
										onChange={(val: any) => {
											const v = typeof val === 'object' && val?.target ? val.target.value : val
											handlePanelChange(v)
										}}
										options={[
											{ value: '', label: 'Choose Panel' },
											/*
											...panels.map((p) => ({
												value: p._id,
												label: p.name,
											})),
											*/
											...panels
												.filter((p) => {
													const norm = (p.name || '').toLowerCase().trim()
													return (
														norm === 'hr' ||
														norm === 'employee' ||
														norm === 'gomzi_nutrition' ||
														norm === 'rag' ||
														norm === 'gomzi nutrition'
													)
												})
												.map((p) => ({
													value: p._id,
													label: p.name === 'Gomzi_Nutrition' ? 'Gomzi Nutrition (RAG)' : p.name,
												})),
										]}
									/>
								</div>
							</div>

							<div className='mb-10'>
								<label className='form-label fw-bold'>Authorized Menus</label>
								<MultiSelect
									options={multiSelectOptions}
									value={selectedMenus}
									onChange={setSelectedMenus}
									labelledBy='Select Menus'
									disabled={!selectedPanel}
								/>
								<p className='text-muted fs-7 mt-2'>Select multiple menus for the selected panel.</p>
							</div>

							<div className='d-flex justify-content-end'>
								<button
									className='btn btn-primary'
									onClick={handleSaveAuthority}
									disabled={!selectedEmployee || !selectedPanel || loading}
								>
									{loading ? 'Saving...' : 'Save Permissions'}
								</button>
							</div>

							{selectedEmployee && employeeAuthorities.length > 0 && (
								<div className='mt-10'>
									<div className='card border border-gray-300 shadow-sm rounded-4'>
										{/* Card Header */}
										<div className='card-header border-bottom border-gray-200 py-5'>
											<h3 className='card-title align-items-start flex-column m-0'>
												<span className='fw-extrabold text-gray-900 fs-3 d-flex align-items-center gap-2'>
													<i className='bi bi-shield-check text-success fs-2'></i> Access Overview
												</span>
												<span className='text-muted mt-1 fw-semibold fs-7'>Detailed tabular view of panels and authorized menus</span>
											</h3>
										</div>

										{/* Card Body with Table */}
										<div className='card-body py-3 px-4'>
											<div className='table-responsive'>
												<table className='table align-middle gs-0 gy-5'>
													<thead>
														<tr className='fw-bolder text-muted bg-light text-uppercase fs-8'>
															<th className='ps-5 min-w-250px rounded-start'>Panel</th>
															<th className='min-w-400px'>Granted Modules</th>
															<th className='pe-5 text-end rounded-end min-w-100px'>Action</th>
														</tr>
													</thead>
													<tbody>
														{employeeAuthorities.map((auth: any, idx: number) => {
															const theme = 'primary';
															const panelName = auth.panel_id?.name || 'Deleted Panel';

															return (
																<tr key={idx} className='border-bottom border-gray-200 border-bottom-dashed'>
																	<td className='ps-5'>
																		<div className='d-flex align-items-center'>
																			<div className={`symbol symbol-45px me-4`}>
																				<div className={`symbol-label bg-light-${theme} text-${theme} fw-bold fs-4 rounded-3 shadow-sm`}>
																					{panelName.charAt(0).toUpperCase()}
																				</div>
																			</div>
																			<div className='d-flex flex-column'>
																				<span className='text-gray-900 fw-semibold fs-6'>
																					{panelName}
																				</span>
																			</div>
																		</div>
																	</td>
																	<td>
																		<div className='d-flex flex-wrap gap-2'>
																			{auth.menu_ids.length > 0 ? auth.menu_ids.map((m: any) => (
																				<span
																					key={m._id}
																					className={`badge bg-light-${theme} text-${theme} fw-bold px-3 py-2 border border-${theme} border-opacity-25 rounded-pill`}
																				>
																					{m.title}
																				</span>
																			)) : (
																				<span className='text-muted fs-7'>No modules granted</span>
																			)}
																		</div>
																	</td>
																	<td className='text-end pe-5'>
																		<button
																			className='btn btn-icon btn-light-danger btn-sm rounded-sm shadow-sm'
																			onClick={() => handleDeleteAuthority(auth._id)}
																			title='Delete Assigned Panel'
																		>
																			<i className='bi bi-trash3-fill fs-6'></i>
																		</button>
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</KTCard>
				</div>
			</div>
		</>
	)
}

export default RBACManagement
