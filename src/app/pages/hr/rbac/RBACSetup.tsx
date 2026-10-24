import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	CreateMenu,
	CreatePanel,
	CreateSubMenu,
	GetMenus,
	GetPanels,
	RemoveMenu,
	RemovePanel,
	RemoveSubMenu,
	UpdatePanel,
} from '../../../Functions/FGGroup/RBAC'

const RBACSetup: React.FC = () => {
	const [panels, setPanels] = useState<any[]>([])
	const [loading, setLoading] = useState(false)

	// Cascading Selected States
	const [selectedPanelId, setSelectedPanelId] = useState<string>('')
	const [selectedMenuId, setSelectedMenuId] = useState<string>('')

	// Data lists
	const [folders, setFolders] = useState<any[]>([])
	const [subPages, setSubPages] = useState<any[]>([])

	// Form Inputs
	const [newPanelName, setNewPanelName] = useState('')
	const [newMenuTitle, setNewMenuTitle] = useState('')
	const [newPageTitle, setNewPageTitle] = useState('')
	const [editPanelId, setEditPanelId] = useState<string | null>(null)
	const [editPanelName, setEditPanelName] = useState('')

	useEffect(() => {
		fetchInitialPanels()
	}, [])

	const fetchInitialPanels = async () => {
		setLoading(true)
		try {
			const res: any = await GetPanels()
			const panelsData = res.data || []
			/*
			// Original unfiltered panels:
			setPanels(panelsData)
			*/
			// Restrict to only 3 panels: HR, Employee, and RAG (Gomzi_Nutrition)
			const ALLOWED_PANELS = ['hr', 'employee', 'gomzi_nutrition', 'rag', 'gomzi nutrition']
			const seen = new Set()
			const filteredPanels = panelsData.filter((p: any) => {
				const norm = (p.name || '').toLowerCase().trim()
				if (ALLOWED_PANELS.includes(norm) && !seen.has(norm)) {
					seen.add(norm)
					return true
				}
				return false
			})
			setPanels(filteredPanels)

			// Select first panel by default if not set
			if (filteredPanels.length > 0 && !selectedPanelId) {
				setSelectedPanelId(filteredPanels[0]._id)
				fetchFolders(filteredPanels[0]._id)
			}
		} catch (error) {
			console.error(error)
			toast.error('Failed to load department panels')
		}
		setLoading(false)
	}

	const fetchFolders = async (panelId: string) => {
		try {
			const res: any = await GetMenus({ panel_id: panelId })
			const folderData = res.data || []
			setFolders(folderData)

			// Select first folder by default
			if (folderData.length > 0) {
				setSelectedMenuId(folderData[0]._id)
				setSubPages(folderData[0].sub_menus || [])
			} else {
				setSelectedMenuId('')
				setSubPages([])
			}
		} catch (error) {
			console.error(error)
		}
	}

	const handlePanelSelect = (panelId: string) => {
		setSelectedPanelId(panelId)
		setSelectedMenuId('')
		setSubPages([])
		fetchFolders(panelId)
	}

	const handleFolderSelect = (menuId: string) => {
		setSelectedMenuId(menuId)
		const folder = folders.find((f) => f._id === menuId)
		setSubPages(folder ? folder.sub_menus || [] : [])
	}

	// Create new department panel
	const handleAddPanel = async () => {
		if (!newPanelName.trim()) return toast.error('Please type panel name!')
		try {
			await CreatePanel({ name: newPanelName.trim() })
			toast.success('New panel created successfully')
			setNewPanelName('')
			fetchInitialPanels()
		} catch (error) {
			toast.error('Failed')
		}
	}

	// Rename department panel
	const handleUpdatePanel = async (id: string) => {
		if (!editPanelName.trim()) return
		try {
			await UpdatePanel({ id, name: editPanelName.trim() })
			toast.success('Panel name updated successfully')
			setEditPanelId(null)
			fetchInitialPanels()
		} catch (error) {
			toast.error('Failed')
		}
	}

	// Delete panel
	const handleDeletePanel = async (panelId: string, event: React.MouseEvent) => {
		event.stopPropagation()
		const res = await Swal.fire({
			title: 'Delete this Panel?',
			text: 'Are you sure you want to delete this panel?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete',
		})
		if (res.isConfirmed) {
			try {
				await RemovePanel({ panel_id: panelId })
				if (selectedPanelId === panelId) {
					setSelectedPanelId('')
					setFolders([])
					setSelectedMenuId('')
					setSubPages([])
				}
				fetchInitialPanels()
			} catch (error) {
				toast.error('Failed')
			}
		}
	}

	// Create sidebar menu folder
	const handleAddMenu = async () => {
		if (!selectedPanelId) return toast.error('Please select a department first!')
		if (!newMenuTitle.trim()) return toast.error('Please type folder title!')
		try {
			await CreateMenu({
				panel_id: selectedPanelId,
				title: newMenuTitle.trim(),
			})
			toast.success('Sidebar folder created!')
			setNewMenuTitle('')
			fetchFolders(selectedPanelId)
		} catch (error) {
			toast.error('Failed')
		}
	}

	// Delete sidebar menu folder
	const handleDeleteMenu = async (menuId: string, event: React.MouseEvent) => {
		event.stopPropagation()
		const res = await Swal.fire({
			title: 'Delete this sidebar folder?',
			text: 'This will delete this main folder and all action pages inside it!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete',
		})
		if (res.isConfirmed) {
			try {
				await RemoveMenu({ menu_id: menuId })
				fetchFolders(selectedPanelId)
			} catch (error) {
				toast.error('Failed')
			}
		}
	}

	// Create nested action sub-page
	const handleAddSubMenu = async () => {
		if (!selectedMenuId) return toast.error('Please choose a folder first!')
		if (!newPageTitle.trim()) return toast.error('Please type page name!')
		try {
			await CreateSubMenu({ menu_id: selectedMenuId, title: newPageTitle.trim() })
			toast.success('Sub menu added successfully!')
			setNewPageTitle('')

			// Refresh list
			const res: any = await GetMenus({ panel_id: selectedPanelId })
			const refreshedFolders = res.data || []
			setFolders(refreshedFolders)
			const updatedFolder = refreshedFolders.find((f: any) => f._id === selectedMenuId)
			setSubPages(updatedFolder ? updatedFolder.sub_menus || [] : [])
		} catch (error) {
			toast.error('Failed to add sub-menu')
		}
	}

	// Delete nested action sub-page
	const handleDeleteSubMenu = async (subMenuId: string) => {
		const res = await Swal.fire({
			title: 'Are you sure you want to delete this sub-menu?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, remove',
		})
		if (res.isConfirmed) {
			try {
				await RemoveSubMenu({ sub_menu_id: subMenuId })
				toast.success('Page deleted!')

				// Refresh list
				const res: any = await GetMenus({ panel_id: selectedPanelId })
				const refreshedFolders = res.data || []
				setFolders(refreshedFolders)
				const updatedFolder = refreshedFolders.find((f: any) => f._id === selectedMenuId)
				setSubPages(updatedFolder ? updatedFolder.sub_menus || [] : [])
			} catch (error) {
				toast.error('Failed to delete page')
			}
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Panel & Menu Setup</PageTitle>
			<div className='d-flex flex-column gap-6'>
				{/* PREMUM HEADER ACCENT */}
				<div
					className='card border-0 shadow-sm overflow-hidden rounded-4 position-relative'
					style={{
						background: 'linear-gradient(135deg, #2a3e59 0%, #4e657e 100%)',
					}}>
					{/* Decorative radial gradient glow */}
					<div
						style={{
							position: 'absolute',
							top: '-50%',
							right: '-10%',
							width: '300px',
							height: '300px',
							background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)',
							pointerEvents: 'none',
						}}
					/>
					<div className='card-body p-6 d-flex align-items-center justify-content-between z-index-1'>
						<div>
							<h3 className='text-white fw-bold fs-2 mb-2 d-flex align-items-center gap-3'>
								<span
									className='p-2 bg-white bg-opacity-10 rounded-3 fs-4 d-flex align-items-center justify-content-center'
									style={{ width: '40px', height: '40px' }}>
									⚙️
								</span>
								Panel & Menu Setup
							</h3>
							<p
								className='text-white-50 fs-7 mb-0'
								style={{ maxWidth: '600px' }}>
								Manage system panels, sidebar folders, and nested page configurations in a visual
								flow.
							</p>
						</div>
					</div>
				</div>

				{/* CASCADING THREE COLUMN GRID */}
				<div className='row g-6'>
					{/* COLUMN 1: WORKSPACE DEPARTMENTS */}
					<div className='col-lg-4 col-md-12'>
						<div className='card border rounded-4 bg-white shadow-sm h-100 overflow-hidden'>
							{/* Accent Top Strip */}
							<div className='h-4px bg-primary'></div>

							<div className='p-5'>
								<div className='d-flex align-items-center gap-2 mb-4 border-bottom pb-3'>
									<span className='fs-3'>🏢</span>
									<h4 className='fw-bold text-gray-900 mb-0'>1. Select Panel</h4>
								</div>

								{/* Add Panel input */}
								<div className='bg-light p-3 rounded-3 border mb-4 bg-opacity-50'>
									<label className='form-label fw-bold text-gray-700 fs-9 mb-1'>
										Add New Panel
									</label>
									<div className='input-group input-group-sm'>
										<input
											type='text'
											className='form-control bg-white fs-8'
											placeholder='e.g. FWG, GN, Sales'
											value={newPanelName}
											onChange={(e) => setNewPanelName(e.target.value)}
											onKeyDown={(e) => e.key === 'Enter' && handleAddPanel()}
										/>
										<button
											className='btn btn-primary px-3 fw-bold fs-9'
											onClick={handleAddPanel}>
											Add
										</button>
									</div>
								</div>

								{/* Active list */}
								<div
									className='d-flex flex-column gap-2 overflow-auto'
									style={{ maxHeight: '380px' }}>
									{panels.map((p) => {
										const isSelected = selectedPanelId === p._id
										return (
											<div
												key={p._id}
												onClick={() => handlePanelSelect(p._id)}
												className={`p-3 rounded-3 border cursor-pointer transition-all d-flex align-items-center justify-content-between ${
													isSelected
														? 'bg-light-primary border-primary shadow-sm'
														: 'bg-white hover-bg-light border-gray-200'
												}`}>
												<div className='d-flex align-items-center gap-2 flex-grow-1 pe-2'>
													<span className='fs-4'>🏢</span>
													<div className='flex-grow-1'>
														{editPanelId === p._id ? (
															<input
																type='text'
																className='form-control form-control-sm border px-2 py-1 bg-white fw-bold text-gray-800'
																value={editPanelName}
																onChange={(e) => setEditPanelName(e.target.value)}
																onClick={(e) => e.stopPropagation()}
																onKeyDown={(e) => e.key === 'Enter' && handleUpdatePanel(p._id)}
															/>
														) : (
															<span
																className={`fw-bold fs-7 ${
																	isSelected ? 'text-primary' : 'text-gray-800'
																}`}>
																{p.name}
															</span>
														)}
													</div>
												</div>

												<div className='d-flex gap-1'>
													{editPanelId === p._id ? (
														<button
															className='btn btn-icon btn-xs btn-light-success btn-active-success rounded-circle w-20px h-20px'
															onClick={(e) => {
																e.stopPropagation()
																handleUpdatePanel(p._id)
															}}>
															<i className='bi bi-check fs-9'></i>
														</button>
													) : (
														<button
															className='btn btn-icon btn-xs btn-light-primary btn-active-primary rounded-circle w-20px h-20px'
															onClick={(e) => {
																e.stopPropagation()
																setEditPanelId(p._id)
																setEditPanelName(p.name)
															}}>
															<i className='bi bi-pencil fs-9'></i>
														</button>
													)}
													<button
														className='btn btn-icon btn-xs btn-light-danger btn-active-danger rounded-circle w-20px h-20px'
														onClick={(e) => handleDeletePanel(p._id, e)}>
														<i className='bi bi-trash fs-9'></i>
													</button>
												</div>
											</div>
										)
									})}
								</div>
							</div>
						</div>
					</div>

					{/* COLUMN 2: SIDEBAR MAIN FOLDERS (EMERALD GREEN ACCENT) */}
					<div className='col-lg-4 col-md-12'>
						<div className='card border rounded-4 bg-white shadow-sm h-100 overflow-hidden'>
							{/* Accent Top Strip */}
							<div className='h-4px bg-success'></div>

							<div className='p-5'>
								<div className='d-flex align-items-center justify-content-between border-bottom pb-3 mb-4'>
									<div className='d-flex align-items-center gap-2'>
										<span className='fs-3'>📁</span>
										<h4 className='fw-bold text-gray-900 mb-0'>2. Select Aside Menu</h4>
									</div>
									{selectedPanelId && (
										<span className='badge badge-light-primary fs-9 rounded-pill fw-bold'>
											🏢 {panels.find((p) => p._id === selectedPanelId)?.name}
										</span>
									)}
								</div>

								{selectedPanelId ? (
									<div>
										{/* Add Folder Input */}
										<div className='bg-light p-3 rounded-3 border mb-4 bg-opacity-50'>
											<label className='form-label fw-bold text-gray-700 fs-9 mb-1'>
												Add Aside Menu
											</label>
											<div className='input-group input-group-sm'>
												<input
													type='text'
													className='form-control bg-white fs-8'
													placeholder='e.g. Sales, Staff, SOP'
													value={newMenuTitle}
													onChange={(e) => setNewMenuTitle(e.target.value)}
													onKeyDown={(e) => e.key === 'Enter' && handleAddMenu()}
												/>
												<button
													className='btn btn-success px-3 fw-bold fs-9'
													onClick={handleAddMenu}>
													Add
												</button>
											</div>
										</div>

										{/* Active Folders list */}
										<div
											className='d-flex flex-column gap-2 overflow-auto'
											style={{ maxHeight: '380px' }}>
											{folders.length > 0 ? (
												folders.map((f) => {
													const isSelected = selectedMenuId === f._id
													return (
														<div
															key={f._id}
															onClick={() => handleFolderSelect(f._id)}
															className={`p-3 rounded-3 border cursor-pointer transition-all d-flex align-items-center justify-content-between ${
																isSelected
																	? 'bg-light-success border-success shadow-sm'
																	: 'bg-white hover-bg-light border-gray-200'
															}`}>
															<div className='d-flex align-items-center gap-2 flex-grow-1 pe-2'>
																<span className='fs-4'>📁</span>
																<span
																	className={`fw-bold fs-7 ${
																		isSelected ? 'text-success' : 'text-gray-800'
																	}`}>
																	{f.title}
																</span>
															</div>
															<button
																className='btn btn-icon btn-xs btn-light-danger btn-active-danger rounded-circle w-20px h-20px'
																onClick={(e) => handleDeleteMenu(f._id, e)}>
																<i className='bi bi-trash fs-9'></i>
															</button>
														</div>
													)
												})
											) : (
												<span className='text-muted fs-8 italic text-center py-4 border border-dashed rounded bg-light bg-opacity-20'>
													No aside menus exist. Add one above!
												</span>
											)}
										</div>
									</div>
								) : (
									<div className='text-center py-10 text-muted fs-8 border border-dashed rounded bg-light bg-opacity-40'>
										👈 Choose a department panel from Step 1 to show its folders.
									</div>
								)}
							</div>
						</div>
					</div>

					{/* COLUMN 3: SIDEBAR SUB-MENU PAGES  */}
					<div className='col-lg-4 col-md-12'>
						<div className='card border rounded-4 bg-white shadow-sm h-100 overflow-hidden'>
							{/* Accent Top Strip */}
							<div className='h-4px bg-info'></div>

							<div className='p-5'>
								<div className='d-flex align-items-center justify-content-between border-bottom pb-3 mb-4'>
									<div className='d-flex align-items-center gap-2'>
										<span className='fs-3'>📄</span>
										<h4 className='fw-bold text-gray-900 mb-0'>3. Sub-Menu</h4>
									</div>
									{selectedMenuId && (
										<span className='badge badge-light-success fs-9 rounded-pill fw-bold'>
											📁 {folders.find((f) => f._id === selectedMenuId)?.title}
										</span>
									)}
								</div>

								{selectedMenuId ? (
									<div>
										{/* Add Subpage Input */}
										<div className='bg-light p-3 rounded-3 border mb-4 bg-opacity-50'>
											<label className='form-label fw-bold text-gray-700 fs-9 mb-1'>
												Add Sidebar Sub-Menu Page
											</label>
											<div className='input-group input-group-sm'>
												<input
													type='text'
													className='form-control bg-white fs-8'
													placeholder='e.g. Assign Authority, Add Target'
													value={newPageTitle}
													onChange={(e) => setNewPageTitle(e.target.value)}
													onKeyDown={(e) => e.key === 'Enter' && handleAddSubMenu()}
												/>
												<button
													className='btn btn-info px-3 fw-bold fs-9 text-white'
													onClick={handleAddSubMenu}>
													Add
												</button>
											</div>
										</div>

										{/* Subpages list */}
										<div
											className='d-flex flex-column gap-2 overflow-auto'
											style={{ maxHeight: '380px' }}>
											{subPages.length > 0 ? (
												subPages.map((sm: any) => (
													<div
														key={sm._id}
														className='p-3 rounded-3 border border-gray-200 bg-light bg-opacity-40 d-flex align-items-center justify-content-between hover-border-danger transition-all'>
														<div className='d-flex align-items-center gap-2 flex-grow-1 pe-2'>
															<span className='fs-5'>📄</span>
															<span className='fw-semibold text-gray-700 fs-8'>{sm.title}</span>
														</div>
														<button
															className='btn btn-icon btn-xs btn-light-danger btn-active-danger rounded-circle w-20px h-20px'
															onClick={() => handleDeleteSubMenu(sm._id)}>
															<i className='bi bi-trash pt-1 fs-8'></i>
														</button>
													</div>
												))
											) : (
												<span className='text-muted fs-8 italic text-center py-4 border border-dashed rounded bg-light bg-opacity-20'>
													No sub-menu added yet. Type above and click Add!
												</span>
											)}
										</div>
									</div>
								) : (
									<div className='text-center py-10 text-muted fs-8 border border-dashed rounded bg-light bg-opacity-40'>
										👈 Choose an aside menu from Step 2 to show its sub-menu.
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default RBACSetup
