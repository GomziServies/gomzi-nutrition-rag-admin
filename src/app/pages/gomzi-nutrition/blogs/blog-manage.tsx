import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SelectField from '../../../components/SelectField'
import {
	BlogItem,
	GetBlogsAdmin,
	CreateBlogAdmin,
	UpdateBlogAdmin,
	DeleteBlogAdmin,
	FileUploadToFGGroup,
} from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faTrash,
	faEdit,
	faCheck,
	faTimes,
	faImage,
	faStar,
	faEye,
	faUpload,
	faRotateLeft,
	faBookOpen,
	faClock,
	faUserMd,
} from '@fortawesome/free-solid-svg-icons'

const PRESET_IMAGES = [
	{ label: 'Blog 1 (Whey Isolate)', url: '/images/blog-1.webp' },
	{ label: 'Blog 3 (Protein Intake)', url: '/images/blog-3.webp' },
	{ label: 'Blog 4 (GLP-1 Muscle)', url: '/images/blog-4.webp' },
	{ label: 'Blog 5 (Brand Legacy)', url: '/images/blog-5.webp' },
]

const getPreviewUrl = (url?: string) => {
	if (!url) return '/images/blog-1.webp'
	if (
		url.startsWith('blob:') ||
		url.startsWith('http://') ||
		url.startsWith('https://') ||
		url.startsWith('/')
	) {
		return url
	}
	return `${FG_GROUP_FILE_BASE_URL}/${url}`
}

export default function BlogManage() {
	const [blogs, setBlogs] = useState<BlogItem[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [totalViews, setTotalViews] = useState(0)

	// Filter
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')

	// Modal State
	const [showModal, setShowModal] = useState(false)
	const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
	const [currentId, setCurrentId] = useState<string>('')
	const [formData, setFormData] = useState<Partial<BlogItem>>({
		title: '',
		slug: '',
		category: 'Nutrition',
		desc: '',
		image: '/images/blog-1.webp',
		readTime: '6 min read',
		reviewer: 'Dt. Chirag Pandey, RD',
		author: 'Gomzi Supplement by RAG',
		tags: ['nutrition', 'protein'],
		status: true,
		featured: false,
	})
	const [tagsString, setTagsString] = useState('nutrition, protein')
	const [uploadingImage, setUploadingImage] = useState(false)

	const loadBlogs = async () => {
		try {
			setLoading(true)
			const res: any = await GetBlogsAdmin()
			if (res?.data?.blogs) {
				setBlogs(res.data.blogs)
				if (res.data.totalViews !== undefined) setTotalViews(res.data.totalViews)
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to fetch blogs')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadBlogs()
	}, [])

	const handleOpenCreate = () => {
		setModalMode('create')
		setCurrentId('')
		setFormData({
			title: '',
			slug: '',
			category: 'Nutrition',
			desc: '',
			image: '/images/blog-1.webp',
			readTime: '6 min read',
			reviewer: 'Dt. Chirag Pandey, RD',
			author: 'Gomzi Supplement by RAG',
			status: true,
			featured: false,
		})
		setTagsString('nutrition, protein')
		setShowModal(true)
	}

	const handleOpenEdit = (item: BlogItem) => {
		setModalMode('edit')
		setCurrentId(item._id || item.id || '')
		setFormData({
			title: item.title,
			slug: item.slug,
			category: item.category,
			desc: item.desc || '',
			image: item.image || '/images/blog-1.webp',
			readTime: item.readTime || '6 min read',
			reviewer: item.reviewer || 'Dt. Chirag Pandey, RD',
			author: item.author || 'Gomzi Supplement by RAG',
			status: item.status !== false,
			featured: Boolean(item.featured),
		})
		setTagsString(Array.isArray(item.tags) ? item.tags.join(', ') : 'nutrition')
		setShowModal(true)
	}

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.title?.trim()) {
			toast.error('Title is required')
			return
		}

		try {
			setSaving(true)
			const parsedTags = tagsString
				.split(',')
				.map((t) => t.trim().toLowerCase())
				.filter(Boolean)

			const payload = {
				...formData,
				tags: parsedTags,
			}

			if (modalMode === 'create') {
				const res: any = await CreateBlogAdmin(payload)
				toast.success(res?.message || 'Article created successfully!')
			} else {
				const res: any = await UpdateBlogAdmin({ ...payload, id: currentId })
				toast.success(res?.message || 'Article updated successfully!')
			}

			setShowModal(false)
			await loadBlogs()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to save article')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id?: string) => {
		if (!id) return
		if (!window.confirm('Are you sure you want to delete this publication?')) return

		try {
			const res: any = await DeleteBlogAdmin(id)
			toast.success(res?.message || 'Article deleted successfully!')
			await loadBlogs()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to delete article')
		}
	}

	const handleToggleStatus = async (item: BlogItem) => {
		const id = item._id || item.id
		if (!id) return
		try {
			await UpdateBlogAdmin({ id, status: !item.status })
			toast.success(`Article set to ${!item.status ? 'Published' : 'Draft'}`)
			await loadBlogs()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to toggle status')
		}
	}

	const handleToggleFeatured = async (item: BlogItem) => {
		const id = item._id || item.id
		if (!id) return
		try {
			await UpdateBlogAdmin({ id, featured: !item.featured })
			toast.success(`Featured flag updated!`)
			await loadBlogs()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to update featured flag')
		}
	}

	const filteredBlogs = blogs.filter((b) => {
		const matchesCat =
			selectedCategory === 'all' ||
			b.category?.toLowerCase() === selectedCategory.toLowerCase() ||
			b.tags?.includes(selectedCategory.toLowerCase())

		const matchesSearch =
			!searchQuery ||
			b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			b.desc?.toLowerCase().includes(searchQuery.toLowerCase())

		return matchesCat && matchesSearch
	})

	return (
		<>
			<PageTitle>Science Journal & Blogs</PageTitle>

			<div className='card mb-5 mb-xl-8'>
				{/* Header */}
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold fs-3 mb-1 d-inline-flex align-items-center'>
							Science Journal Publications{' '}
							{loading ? (
								<span
									className='gz-skeleton rounded ms-2'
									style={{ width: '36px', height: '22px', verticalAlign: 'middle' }}
								/>
							) : (
								`(${blogs.length})`
							)}
						</span>
						<span className='text-muted mt-1 fw-semibold fs-7'>
							Manage evidence-based clinical articles, read times, and reviewers. Total Reads: {totalViews}
						</span>
					</h3>
					<div className='card-toolbar gap-3'>
						<button
							type='button'
							className='btn btn-sm btn-light'
							onClick={loadBlogs}
							disabled={loading}
						>
							<FontAwesomeIcon icon={faRotateLeft} className='me-1' /> Refresh
						</button>
						<button
							type='button'
							className='btn btn-sm btn-primary'
							onClick={handleOpenCreate}
						>
							<FontAwesomeIcon icon={faPlus} className='me-1' /> Add Article
						</button>
					</div>
				</div>

				{/* Search & Filter Bar */}
				<div className='card-body py-3 border-bottom'>
					<div className='d-flex flex-wrap align-items-center gap-3'>
						<div style={{ minWidth: '260px' }}>
							<input
								type='text'
								className='form-control form-control-sm'
								placeholder='Search articles by title or keyword...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<DownloadExcelButton
							data={filteredBlogs}
							columns={[
								{ title: 'Article Title', field: 'title' },
								{ title: 'Category', field: 'category' },
								{ title: 'Reviewer', field: 'medicalReviewer' },
								{ title: 'Featured', field: 'featured' },
								{ title: 'Reads', field: 'reads' },
								{ title: 'Status', field: 'status' },
							]}
							filename='articles-list'
						/>

						<div style={{ minWidth: '180px' }}>
							<SelectField
								value={selectedCategory}
								onChange={(e: any) => setSelectedCategory(e.target.value)}
								options={[
									{ label: 'All Categories', value: 'all' },
									{ label: 'Nutrition', value: 'Nutrition' },
									{ label: 'Whey & Protein', value: 'protein' },
									{ label: 'Clinical & ICMR', value: 'clinical' },
									{ label: 'Brand Legacy', value: 'brand' },
								]}
								showLabel={false}
								marginRemove={true}
								hideDefaultOption={true}
								searchable={false}
								defaultLabel='All Categories'
							/>
						</div>
					</div>
				</div>

				{/* Table */}
				<div className='card-body py-3'>
					<div className='table-responsive'>
						<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
							<thead>
								<tr className='fw-bold text-muted'>
									<th className='w-40px text-center'>#</th>
									<th className='min-w-200px'>Article Title</th>
									<th className='min-w-100px'>Category</th>
									<th className='min-w-120px'>Reviewer</th>
									<th className='min-w-80px text-center'>Featured</th>
									<th className='min-w-80px text-center'>Reads</th>
									<th className='min-w-80px text-center'>Status</th>
									<th className='min-w-100px text-end'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									Array.from({ length: 6 }).map((_, idx) => (
										<tr key={`blog-skeleton-${idx}`} className='gz-skeleton-tr'>
											<td className='text-center'>
												<div
													className='gz-skeleton'
													style={{ width: '20px', height: '14px', margin: '0 auto' }}
												/>
											</td>
											<td>
												<div className='d-flex align-items-center'>
													<div
														className='gz-skeleton rounded me-3'
														style={{ width: '45px', height: '45px', flexShrink: 0 }}
													/>
													<div className='d-flex flex-column gap-2 w-100' style={{ maxWidth: '300px' }}>
														<div className='gz-skeleton' style={{ width: '85%', height: '15px' }} />
														<div className='gz-skeleton' style={{ width: '55%', height: '12px' }} />
													</div>
												</div>
											</td>
											<td>
												<div
													className='gz-skeleton rounded-pill'
													style={{ width: '75px', height: '22px' }}
												/>
											</td>
											<td>
												<div
													className='gz-skeleton'
													style={{ width: '130px', height: '14px' }}
												/>
											</td>
											<td className='text-center'>
												<div
													className='gz-skeleton rounded'
													style={{ width: '32px', height: '32px', margin: '0 auto' }}
												/>
											</td>
											<td className='text-center'>
												<div
													className='gz-skeleton'
													style={{ width: '35px', height: '14px', margin: '0 auto' }}
												/>
											</td>
											<td className='text-center'>
												<div
													className='gz-skeleton rounded'
													style={{ width: '70px', height: '24px', margin: '0 auto' }}
												/>
											</td>
											<td className='text-end'>
												<div className='d-inline-flex gap-2 justify-content-end'>
													<div
														className='gz-skeleton rounded'
														style={{ width: '30px', height: '30px' }}
													/>
													<div
														className='gz-skeleton rounded'
														style={{ width: '30px', height: '30px' }}
													/>
												</div>
											</td>
										</tr>
									))
								) : filteredBlogs.length === 0 ? (
									<tr>
										<td colSpan={8} className='text-center py-10 text-muted'>
											No articles found matching filters.
										</td>
									</tr>
								) : (
									filteredBlogs.map((b, idx) => (
											<tr key={b._id || b.id || idx}>
												<td className='text-center text-muted fw-bold'>{idx + 1}</td>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={getPreviewUrl(b.image)}
																alt={b.title}
																className='rounded object-fit-cover'
																onError={(e: any) => {
																	e.currentTarget.onerror = null
																	e.currentTarget.src = '/images/product-placeholder.webp'
																}}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-gray-900 fw-bold fs-6'>
																{b.title}
															</span>
															<span className='text-muted fs-7'>
																/blog/{b.slug} • {b.readTime || '6 min'}
															</span>
														</div>
													</div>
												</td>
												<td>
													<span className='badge badge-light-primary fw-bold'>
														{b.category}
													</span>
												</td>
												<td>
													<span className='text-muted fs-7 d-flex align-items-center gap-1'>
														<FontAwesomeIcon icon={faUserMd} className='text-primary' />
														{b.reviewer || b.author}
													</span>
												</td>
												<td className='text-center'>
													<button
														type='button'
														className={`btn btn-sm btn-icon ${
															b.featured ? 'btn-warning' : 'btn-light'
														}`}
														onClick={() => handleToggleFeatured(b)}
														title={b.featured ? 'Featured on Top' : 'Set as Featured'}
													>
														<FontAwesomeIcon icon={faStar} />
													</button>
												</td>
												<td className='text-center fw-bold text-gray-700'>
													{b.views || 0}
												</td>
												<td className='text-center'>
													<button
														type='button'
														className={`btn btn-sm px-3 py-1 ${
															b.status !== false
																? 'btn-light-success text-success'
																: 'btn-light-danger text-danger'
														}`}
														onClick={() => handleToggleStatus(b)}
													>
														{b.status !== false ? 'Published' : 'Draft'}
													</button>
												</td>
												<td className='text-end'>
													<button
														type='button'
														className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
														onClick={() => handleOpenEdit(b)}
													>
														<FontAwesomeIcon icon={faEdit} />
													</button>
													<button
														type='button'
														className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
														onClick={() => handleDelete(b._id || b.id)}
													>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
				</div>
			</div>

			{/* Modal */}
			{showModal && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
				>
					<div className='modal-dialog modal-dialog-centered modal-lg'>
						<div className='modal-content'>
							<form onSubmit={handleSave}>
								<div className='modal-header'>
									<h5 className='modal-title fw-bold'>
										{modalMode === 'create' ? 'Create Publication' : 'Edit Article'}
									</h5>
									<button
										type='button'
										className='btn-close'
										onClick={() => setShowModal(false)}
									/>
								</div>
								<div className='modal-body'>
									<div className='row g-3'>
										<div className='col-12'>
											<label className='form-label required fw-bold'>Title</label>
											<input
												type='text'
												className='form-control form-control-sm'
												value={formData.title || ''}
												onChange={(e) =>
													setFormData({ ...formData, title: e.target.value })
												}
												required
											/>
										</div>

										<div className='col-md-6'>
											<label className='form-label fw-bold'>Slug (URL identifier)</label>
											<input
												type='text'
												className='form-control form-control-sm'
												placeholder='e.g. whey-isolate-guide'
												value={formData.slug || ''}
												onChange={(e) =>
													setFormData({ ...formData, slug: e.target.value })
												}
											/>
										</div>

										<div className='col-md-6'>
											<label className='form-label fw-bold'>Category</label>
											<SelectField
												value={formData.category || 'Nutrition'}
												onChange={(e: any) =>
													setFormData({ ...formData, category: e.target.value })
												}
												options={[
													{ label: 'Nutrition', value: 'Nutrition' },
													{ label: 'Clinical Nutrition', value: 'Clinical Nutrition' },
													{ label: 'Sports Performance', value: 'Sports Performance' },
													{ label: 'Brand Story', value: 'Brand Story' },
												]}
												showLabel={false}
												marginRemove={true}
												hideDefaultOption={true}
												searchable={false}
											/>
										</div>

										<div className='col-md-6'>
											<label className='form-label fw-bold'>Reading Time</label>
											<input
												type='text'
												className='form-control form-control-sm'
												value={formData.readTime || '6 min read'}
												onChange={(e) =>
													setFormData({ ...formData, readTime: e.target.value })
												}
											/>
										</div>

										<div className='col-md-6'>
											<label className='form-label fw-bold'>Clinical Reviewer</label>
											<input
												type='text'
												className='form-control form-control-sm'
												value={formData.reviewer || 'Dt. Chirag Pandey, RD'}
												onChange={(e) =>
													setFormData({ ...formData, reviewer: e.target.value })
												}
											/>
										</div>

										<div className='col-12'>
											<label className='form-label fw-bold'>Tags (Comma separated)</label>
											<input
												type='text'
												className='form-control form-control-sm'
												placeholder='nutrition, protein, guide'
												value={tagsString}
												onChange={(e) => setTagsString(e.target.value)}
											/>
										</div>

										<div className='col-12'>
											<label className='form-label fw-bold'>Short Description / Subtitle</label>
											<textarea
												className='form-control form-control-sm'
												rows={2}
												value={formData.desc || ''}
												onChange={(e) =>
													setFormData({ ...formData, desc: e.target.value })
												}
											/>
										</div>

										<div className='col-12'>
											<label className='form-label fw-bold'>Cover Image URL</label>
											<input
												type='text'
												className='form-control form-control-sm mb-2'
												value={formData.image || ''}
												onChange={(e) =>
													setFormData({ ...formData, image: e.target.value })
												}
											/>
											<div className='d-flex gap-2 flex-wrap'>
												{PRESET_IMAGES.map((p, idx) => (
													<button
														key={idx}
														type='button'
														className='btn btn-xs btn-light-primary py-1 px-2 fs-8'
														onClick={() =>
															setFormData({ ...formData, image: p.url })
														}
													>
														Preset: {p.label}
													</button>
												))}
											</div>
										</div>

										<div className='col-md-6'>
											<div className='form-check form-switch mt-3'>
												<input
													className='form-check-input'
													type='checkbox'
													id='statusSwitch'
													checked={formData.status !== false}
													onChange={(e) =>
														setFormData({
															...formData,
															status: e.target.checked,
														})
													}
												/>
												<label className='form-check-label fw-bold' htmlFor='statusSwitch'>
													Published (Visible on Website)
												</label>
											</div>
										</div>

										<div className='col-md-6'>
											<div className='form-check form-switch mt-3'>
												<input
													className='form-check-input'
													type='checkbox'
													id='featuredSwitch'
													checked={Boolean(formData.featured)}
													onChange={(e) =>
														setFormData({
															...formData,
															featured: e.target.checked,
														})
													}
												/>
												<label className='form-check-label fw-bold' htmlFor='featuredSwitch'>
													Featured Article (Hero Banner)
												</label>
											</div>
										</div>
									</div>
								</div>
								<div className='modal-footer'>
									<button
										type='button'
										className='btn btn-sm btn-light'
										onClick={() => setShowModal(false)}
									>
										Cancel
									</button>
									<button
										type='submit'
										className='btn btn-sm btn-primary'
										disabled={saving}
									>
										{saving ? 'Saving...' : 'Save Article'}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
