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
import GoogleDocsEditor from './GoogleDocsEditor'
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
	faQuestionCircle,
	faListUl,
	faHeading,
	faLayerGroup,
	faSearch,
	faTable,
	faPaste,
	faFileAlt,
} from '@fortawesome/free-solid-svg-icons'

const PRESET_IMAGES = [
	{ label: 'Blog 1 (Whey Isolate)', url: '/images/blog-1.webp' },
	{ label: 'Blog 2 (Plant Protein)', url: '/images/blog-2.webp' },
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

const escapeHtml = (value: any): string =>
	String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')

const toStringList = (value: any): string[] => {
	if (Array.isArray(value)) return value.map((v) => String(v ?? '').trim()).filter(Boolean)
	if (typeof value === 'string') {
		return value
			.split(/\n\s*\n/)
			.map((v) => v.trim())
			.filter(Boolean)
	}
	return []
}

const tableToHtml = (table: any): string => {
	if (!table || (!Array.isArray(table.columns) && !Array.isArray(table.rows))) return ''
	const columns: string[] = Array.isArray(table.columns) ? table.columns : []
	const rows: any[][] = Array.isArray(table.rows) ? table.rows : []
	let html = ''
	if (table.heading) html += `<h3>${escapeHtml(table.heading)}</h3>`
	html += '<table><thead><tr>'
	columns.forEach((c) => {
		html += `<th>${escapeHtml(c)}</th>`
	})
	html += '</tr></thead><tbody>'
	rows.forEach((row) => {
		html += '<tr>'
		;(Array.isArray(row) ? row : []).forEach((cell) => {
			html += `<td>${escapeHtml(cell)}</td>`
		})
		html += '</tr>'
	})
	html += '</tbody></table>'
	return html
}

/**
 * Builds editor HTML from legacy structured blog content (intro / sections / tables / faqs / bottomLine)
 * so older articles that never stored `content.html` can still be opened in the rich-text editor.
 */
const convertLegacyToHtml = (content: any): string => {
	if (!content || typeof content !== 'object') return ''
	let html = ''

	toStringList(content.intro).forEach((p) => {
		html += `<p>${escapeHtml(p)}</p>`
	})

	if (Array.isArray(content.sections)) {
		content.sections.forEach((section: any) => {
			if (!section) return
			if (section.heading) html += `<h2>${escapeHtml(section.heading)}</h2>`
			toStringList(section.paragraphs).forEach((p) => {
				html += `<p>${escapeHtml(p)}</p>`
			})
			if (Array.isArray(section.bullets) && section.bullets.length > 0) {
				html += `<ul>${section.bullets.map((b: any) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
			}
			if (section.closingParagraph) html += `<p>${escapeHtml(section.closingParagraph)}</p>`
			html += tableToHtml(section.table)
		})
	}

	const tables: any[] = Array.isArray(content.tables) ? content.tables : []
	tables.forEach((t) => {
		html += tableToHtml(t)
	})

	if (Array.isArray(content.faqs) && content.faqs.length > 0) {
		html += '<h2>Frequently Asked Questions</h2>'
		content.faqs.forEach((f: any) => {
			if (!f) return
			html += `<h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p>`
		})
	}

	if (content.bottomLine) {
		html += `<h2>${escapeHtml(content.bottomLine.heading || 'The bottom line')}</h2>`
		toStringList(content.bottomLine.paragraphs).forEach((p) => {
			html += `<p>${escapeHtml(p)}</p>`
		})
	}

	return html
}

/**
 * Reads intro paragraphs and heading-based sections back out of editor HTML.
 * Returns empty lists when the HTML has no usable structure, so callers fall back to the form fields.
 */
const extractStructuredFromHtml = (
	html: string
): { intro: string[]; sections: any[] } => {
	const result: { intro: string[]; sections: any[] } = { intro: [], sections: [] }
	if (!html || typeof DOMParser === 'undefined') return result

	const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html')
	const root = doc.getElementById('root')
	if (!root) return result

	const text = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim()
	let current: any = null

	Array.from(root.children).forEach((node) => {
		const tag = node.tagName.toLowerCase()
		if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
			current = { heading: text(node), paragraphs: [], bullets: [], closingParagraph: '' }
			result.sections.push(current)
			return
		}
		if (tag === 'p') {
			const value = text(node)
			if (!value) return
			if (current) current.paragraphs.push(value)
			else result.intro.push(value)
			return
		}
		if ((tag === 'ul' || tag === 'ol') && current) {
			Array.from(node.querySelectorAll('li'))
				.map((li) => text(li))
				.filter(Boolean)
				.forEach((b) => current.bullets.push(b))
			return
		}
		if (tag === 'table' && current) {
			const columns = Array.from(node.querySelectorAll('thead th, tr:first-child th')).map((th) => text(th))
			const rows = Array.from(node.querySelectorAll('tbody tr'))
				.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => text(td)))
				.filter((r) => r.length > 0)
			current.table = { heading: '', columns, rows }
		}
	})

	return result
}

interface TableFormState {
	heading: string
	columns: string[]
	columnsText: string
	rows: string[][]
	quickPasteText?: string
}

interface SectionFormState {
	heading: string
	paragraphsText: string
	bulletsText: string
	closingParagraph: string
	table?: TableFormState | null
	image?: SectionImageState | null
}

interface SectionImageState {
	url: string
	alt?: string
	caption?: string
	placement?: 'below_heading' | 'below_paragraphs' | 'below_bullets'
}

interface FaqFormState {
	question: string
	answer: string
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
	const [activeTab, setActiveTab] = useState<'details' | 'media' | 'content' | 'faqs_seo'>('details')

	// Form States
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
	const [editorHtml, setEditorHtml] = useState('')
	const [uploadingImage, setUploadingImage] = useState(false)
	const [uploadingSectionImageIdx, setUploadingSectionImageIdx] = useState<number | null>(null)

	// Rich Content States
	const [introText, setIntroText] = useState('')
	const [sections, setSections] = useState<SectionFormState[]>([])
	const [tables, setTables] = useState<TableFormState[]>([])
	const [faqs, setFaqs] = useState<FaqFormState[]>([])
	const [bottomLineHeading, setBottomLineHeading] = useState('The bottom line')
	const [bottomLineText, setBottomLineText] = useState('')
	const [metaTitle, setMetaTitle] = useState('')
	const [metaDescription, setMetaDescription] = useState('')

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
			image: '/images/blog-2.webp',
			readTime: '6 min read',
			reviewer: 'Dt. Chirag Pandey, RD',
			author: 'Gomzi Supplement by RAG',
			status: true,
			featured: false,
		})
		setTagsString('nutrition, protein')
		setEditorHtml('')
		setIntroText('')
		setSections([
			{
				heading: '',
				paragraphsText: '',
				bulletsText: '',
				closingParagraph: '',
				table: null,
				image: null,
			},
		])
		setTables([])
		setFaqs([])
		setBottomLineHeading('The bottom line')
		setBottomLineText('')
		setMetaTitle('')
		setMetaDescription('')
		setActiveTab('details')
		setShowModal(true)
	}

	const handleOpenEdit = (item: BlogItem) => {
		setModalMode('edit')
		setCurrentId(item._id || item.id || '')
		setFormData({
			title: item.title,
			slug: item.slug,
			category: item.category || 'Nutrition',
			desc: item.desc || '',
			image: item.image || '/images/blog-1.webp',
			readTime: item.readTime || '6 min read',
			reviewer: item.reviewer || 'Dt. Chirag Pandey, RD',
			author: item.author || 'Gomzi Supplement by RAG',
			status: item.status !== false,
			featured: Boolean(item.featured),
		})
		setTagsString(Array.isArray(item.tags) ? item.tags.join(', ') : 'nutrition')
		setEditorHtml(item.content?.html || convertLegacyToHtml(item.content))

		// Intro
		const rawIntro = item.content?.intro
		if (Array.isArray(rawIntro)) {
			setIntroText(rawIntro.join('\n\n'))
		} else if (typeof rawIntro === 'string') {
			setIntroText(rawIntro)
		} else {
			setIntroText('')
		}

		// Sections
		const rawSections = item.content?.sections
		if (Array.isArray(rawSections) && rawSections.length > 0) {
			setSections(
				rawSections.map((s: any) => ({
					heading: s.heading || '',
					paragraphsText: Array.isArray(s.paragraphs)
						? s.paragraphs.join('\n\n')
						: typeof s.paragraphs === 'string'
						? s.paragraphs
						: '',
					bulletsText: Array.isArray(s.bullets) ? s.bullets.join('\n') : '',
					closingParagraph: s.closingParagraph || '',
					table: s.table
						? {
								heading: s.table.heading || '',
								columns: Array.isArray(s.table.columns) ? s.table.columns : [],
								columnsText: Array.isArray(s.table.columns) ? s.table.columns.join(', ') : '',
								rows: Array.isArray(s.table.rows) ? s.table.rows : [],
								quickPasteText: '',
						  }
						: null,
					image: s.image
						? typeof s.image === 'string'
							? {
									url: s.image,
									alt: s.heading || '',
									caption: '',
									placement: 'below_paragraphs',
							  }
							: {
									url: s.image.url || '',
									alt: s.image.alt || s.heading || '',
									caption: s.image.caption || '',
									placement: s.image.placement || 'below_paragraphs',
							  }
						: null,
				}))
			)
		} else {
			setSections([
				{
					heading: '',
					paragraphsText: '',
					bulletsText: '',
					closingParagraph: '',
					table: null,
					image: null,
				},
			])
		}

		// Tables
		const loadedTables: TableFormState[] = []
		if (Array.isArray(item.content?.tables) && item.content.tables.length > 0) {
			item.content.tables.forEach((t: any) => {
				const cols = Array.isArray(t.columns) ? t.columns : []
				const rws = Array.isArray(t.rows) ? t.rows : []
				loadedTables.push({
					heading: t.heading || 'Data Table',
					columns: cols,
					columnsText: cols.join(', '),
					rows: rws,
					quickPasteText: '',
				})
			})
		} else {
			if (item.content?.comparisonTable) {
				const ct = item.content.comparisonTable
				const cols = Array.isArray(ct.columns) ? ct.columns : []
				const rws = Array.isArray(ct.rows) ? ct.rows : []
				loadedTables.push({
					heading: ct.heading || 'Comparison Table',
					columns: cols,
					columnsText: cols.join(', '),
					rows: rws,
					quickPasteText: '',
				})
			}
			if (item.content?.proteinTable) {
				const pt = item.content.proteinTable
				const cols = Array.isArray(pt.columns) ? pt.columns : []
				const rws = Array.isArray(pt.rows) ? pt.rows : []
				loadedTables.push({
					heading: pt.heading || 'Daily Meal Guide / Schedule',
					columns: cols,
					columnsText: cols.join(', '),
					rows: rws,
					quickPasteText: '',
				})
			}
		}
		setTables(loadedTables)

		// FAQs
		const rawFaqs = item.content?.faqs
		if (Array.isArray(rawFaqs) && rawFaqs.length > 0) {
			setFaqs(
				rawFaqs.map((f: any) => ({
					question: f.question || '',
					answer: f.answer || '',
				}))
			)
		} else {
			setFaqs([])
		}

		// Bottom line
		const rawBottomLine = item.content?.bottomLine
		setBottomLineHeading(rawBottomLine?.heading || 'The bottom line')
		if (Array.isArray(rawBottomLine?.paragraphs)) {
			setBottomLineText(rawBottomLine.paragraphs.join('\n\n'))
		} else if (typeof rawBottomLine?.paragraphs === 'string') {
			setBottomLineText(rawBottomLine.paragraphs)
		} else {
			setBottomLineText('')
		}

		// SEO
		setMetaTitle(item.metaTitle || '')
		setMetaDescription(item.metaDescription || '')

		setActiveTab('details')
		setShowModal(true)
	}

	const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		try {
			setUploadingImage(true)
			const res: any = await FileUploadToFGGroup([file], { directory: 'blog' })
			const uploadedUrl = res?.data?.fileURLs?.[0] || res?.data?.url || res?.url
			if (uploadedUrl) {
				setFormData((prev) => ({ ...prev, image: uploadedUrl }))
				toast.success('Cover image uploaded successfully!')
			} else {
				toast.error('Image upload failed: no URL returned')
			}
		} catch (err: any) {
			toast.error(err?.message || 'Error uploading cover image')
		} finally {
			setUploadingImage(false)
		}
	}

	const handleGenerateSlug = () => {
		if (!formData.title) return
		const gen = formData.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '')
		setFormData((prev) => ({ ...prev, slug: gen }))
	}

	// Section Handlers
	const handleAddSection = () => {
		setSections((prev) => [
			...prev,
			{ heading: '', paragraphsText: '', bulletsText: '', closingParagraph: '', table: null, image: null },
		])
	}

	const handleAddSectionWithTable = () => {
		setSections((prev) => [
			...prev,
			{
				heading: '',
				paragraphsText: '',
				bulletsText: '',
				closingParagraph: '',
				table: {
					heading: 'Nutritional Breakdown',
					columns: ['Food / Factor', 'Protein Content', 'Notes / Usage'],
					columnsText: 'Food / Factor, Protein Content, Notes / Usage',
					rows: [
						['Soya chunks (dry)', '50–52 g', 'Curry, pulao, cutlets'],
						['Pumpkin seeds', 'about 30 g', 'Snacks, salads, smoothies'],
					],
					quickPasteText: '',
				},
			},
		])
		toast.success('Added new section with table!')
	}

	const handleSmartAddTable = () => {
		// If there is an existing section that doesn't have a table yet, add table to it
		const sectionWithoutTableIdx = sections.findIndex((s) => !s.table)
		if (sectionWithoutTableIdx !== -1) {
			handleAddTableToSection(sectionWithoutTableIdx)
		} else {
			// All sections already have tables, or no sections exist: create a new section with a table
			handleAddSectionWithTable()
		}
	}

	const handleAddSectionWithImage = () => {
		setSections((prev) => [
			...prev,
			{
				heading: '',
				paragraphsText: '',
				bulletsText: '',
				closingParagraph: '',
				table: null,
				image: {
					url: '',
					alt: '',
					caption: '',
					placement: 'below_paragraphs',
				},
			},
		])
		toast.success('Added new section with image!')
	}

	const handleSmartAddImage = () => {
		const sectionWithoutImageIdx = sections.findIndex((s) => !s.image)
		if (sectionWithoutImageIdx !== -1) {
			handleAddImageToSection(sectionWithoutImageIdx)
		} else {
			handleAddSectionWithImage()
		}
	}

	const handleAddImageToSection = (sIdx: number) => {
		setSections((prev) => {
			const next = [...prev]
			next[sIdx] = {
				...next[sIdx],
				image: {
					url: '',
					alt: next[sIdx].heading || '',
					caption: '',
					placement: 'below_paragraphs',
				},
			}
			return next
		})
		toast.success(`Image banner attached to Section #${sIdx + 1}`)
	}

	const handleRemoveImageFromSection = (sIdx: number) => {
		setSections((prev) => {
			const next = [...prev]
			next[sIdx] = {
				...next[sIdx],
				image: null,
			}
			return next
		})
		toast.success(`Image removed from Section #${sIdx + 1}`)
	}

	const handleSectionImageFieldChange = (
		sIdx: number,
		field: keyof SectionImageState,
		value: string
	) => {
		setSections((prev) => {
			const next = [...prev]
			if (next[sIdx].image) {
				next[sIdx].image = {
					...next[sIdx].image!,
					[field]: value,
				}
			}
			return next
		})
	}

	const handleSectionImageUpload = async (
		sIdx: number,
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0]
		if (!file) return
		try {
			setUploadingSectionImageIdx(sIdx)
			const res: any = await FileUploadToFGGroup([file], { directory: 'blog' })
			const uploadedUrl = res?.data?.fileURLs?.[0] || res?.data?.url || res?.url
			if (uploadedUrl) {
				setSections((prev) => {
					const next = [...prev]
					if (next[sIdx].image) {
						next[sIdx].image = {
							...next[sIdx].image!,
							url: uploadedUrl,
						}
					}
					return next
				})
				toast.success(`Section #${sIdx + 1} image uploaded successfully!`)
			} else {
				toast.error('Image upload failed: no URL returned')
			}
		} catch (err: any) {
			toast.error(err?.message || 'Error uploading section image')
		} finally {
			setUploadingSectionImageIdx(null)
		}
	}

	const handleRemoveSection = (index: number) => {
		setSections((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSectionChange = (index: number, field: keyof SectionFormState, value: string) => {
		setSections((prev) => {
			const updated = [...prev]
			updated[index] = { ...updated[index], [field]: value }
			return updated
		})
	}

	// Section Table Handlers
	const handleAddTableToSection = (sIdx: number) => {
		setSections((prev) => {
			const next = [...prev]
			next[sIdx] = {
				...next[sIdx],
				table: {
					heading: `${next[sIdx].heading || 'Section'} Table`,
					columns: ['Food / Item', 'Protein Content', 'Notes / Usage'],
					columnsText: 'Food / Item, Protein Content, Notes / Usage',
					rows: [
						['Soya chunks (dry)', '50–52 g', 'Curry, pulao, cutlets'],
						['Pumpkin seeds', 'about 30 g', 'Snacks, salads, smoothies'],
					],
					quickPasteText: '',
				},
			}
			return next
		})
		toast.success(`Table added to Section #${sIdx + 1}`)
	}

	const handleRemoveTableFromSection = (sIdx: number) => {
		setSections((prev) => {
			const next = [...prev]
			next[sIdx] = {
				...next[sIdx],
				table: null,
			}
			return next
		})
		toast.success(`Table removed from Section #${sIdx + 1}`)
	}

	const handleSectionTableHeadingChange = (sIdx: number, heading: string) => {
		setSections((prev) => {
			const next = [...prev]
			if (next[sIdx].table) {
				next[sIdx].table = { ...next[sIdx].table!, heading }
			}
			return next
		})
	}

	const handleSectionTableColumnsChange = (sIdx: number, columnsText: string) => {
		const cols = columnsText.split(',').map((c) => c.trim()).filter(Boolean)
		setSections((prev) => {
			const next = [...prev]
			if (next[sIdx].table) {
				const currentRows = next[sIdx].table!.rows || []
				const adjustedRows = currentRows.map((r) => {
					const rowCopy = [...r]
					while (rowCopy.length < cols.length) rowCopy.push('')
					return rowCopy.slice(0, cols.length)
				})
				next[sIdx].table = {
					...next[sIdx].table!,
					columnsText,
					columns: cols,
					rows: adjustedRows,
				}
			}
			return next
		})
	}

	const handleAddSectionTableRow = (sIdx: number) => {
		setSections((prev) => {
			const next = [...prev]
			if (next[sIdx].table) {
				const cols =
					next[sIdx].table!.columns.length > 0 ? next[sIdx].table!.columns : ['Column 1', 'Column 2']
				const emptyRow = cols.map(() => '')
				next[sIdx].table = {
					...next[sIdx].table!,
					rows: [...next[sIdx].table!.rows, emptyRow],
				}
			}
			return next
		})
	}

	const handleRemoveSectionTableRow = (sIdx: number, rIdx: number) => {
		setSections((prev) => {
			const next = [...prev]
			if (next[sIdx].table) {
				next[sIdx].table = {
					...next[sIdx].table!,
					rows: next[sIdx].table!.rows.filter((_, idx) => idx !== rIdx),
				}
			}
			return next
		})
	}

	const handleSectionTableCellChange = (sIdx: number, rIdx: number, cIdx: number, value: string) => {
		setSections((prev) => {
			const next = [...prev]
			if (next[sIdx].table) {
				const nextRows = next[sIdx].table!.rows.map((r, ri) => {
					if (ri !== rIdx) return r
					const newR = [...r]
					newR[cIdx] = value
					return newR
				})
				next[sIdx].table = { ...next[sIdx].table!, rows: nextRows }
			}
			return next
		})
	}

	const handleSectionTableQuickParse = (sIdx: number) => {
		const text = sections[sIdx]?.table?.quickPasteText
		if (!text?.trim()) return

		const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
		if (lines.length === 0) return

		const firstLine = lines[0]
		const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(',') ? ',' : '\t'
		const parsedGrid = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()))

		if (parsedGrid.length === 0) return

		const cols = parsedGrid[0]
		const rows = parsedGrid.slice(1)

		setSections((prev) => {
			const next = [...prev]
			if (next[sIdx].table) {
				next[sIdx].table = {
					...next[sIdx].table!,
					columns: cols,
					columnsText: cols.join(', '),
					rows: rows.length > 0 ? rows : [cols.map(() => '')],
					quickPasteText: '',
				}
			}
			return next
		})
		toast.success(`Imported ${rows.length} rows with ${cols.length} columns!`)
	}

	// Standalone Table Handlers
	const handleAddTable = () => {
		setTables((prev) => [
			...prev,
			{
				heading: 'New Data Table',
				columns: ['Food / Factor', 'Protein per 100g', 'Best Use / Notes'],
				columnsText: 'Food / Factor, Protein per 100g, Best Use / Notes',
				rows: [
					['Soya chunks', '52 g', 'Curry, pulao, cutlets'],
					['Pumpkin seeds', '30 g', 'Snacks, salads, smoothies'],
				],
				quickPasteText: '',
			},
		])
	}

	const handleRemoveTable = (tIdx: number) => {
		setTables((prev) => prev.filter((_, idx) => idx !== tIdx))
	}

	const handleTableHeadingChange = (tIdx: number, heading: string) => {
		setTables((prev) => {
			const next = [...prev]
			next[tIdx] = { ...next[tIdx], heading }
			return next
		})
	}

	const handleTableColumnsChange = (tIdx: number, columnsText: string) => {
		const cols = columnsText.split(',').map((c) => c.trim()).filter(Boolean)
		setTables((prev) => {
			const next = [...prev]
			const currentRows = next[tIdx].rows || []
			const adjustedRows = currentRows.map((r) => {
				const rowCopy = [...r]
				while (rowCopy.length < cols.length) rowCopy.push('')
				return rowCopy.slice(0, cols.length)
			})
			next[tIdx] = {
				...next[tIdx],
				columnsText,
				columns: cols,
				rows: adjustedRows,
			}
			return next
		})
	}

	const handleAddTableRow = (tIdx: number) => {
		setTables((prev) => {
			const next = [...prev]
			const cols = next[tIdx].columns.length > 0 ? next[tIdx].columns : ['Column 1', 'Column 2']
			const emptyRow = cols.map(() => '')
			next[tIdx] = {
				...next[tIdx],
				rows: [...next[tIdx].rows, emptyRow],
			}
			return next
		})
	}

	const handleRemoveTableRow = (tIdx: number, rIdx: number) => {
		setTables((prev) => {
			const next = [...prev]
			next[tIdx] = {
				...next[tIdx],
				rows: next[tIdx].rows.filter((_, idx) => idx !== rIdx),
			}
			return next
		})
	}

	const handleTableCellChange = (tIdx: number, rIdx: number, cIdx: number, value: string) => {
		setTables((prev) => {
			const next = [...prev]
			const nextRows = next[tIdx].rows.map((r, ri) => {
				if (ri !== rIdx) return r
				const newR = [...r]
				newR[cIdx] = value
				return newR
			})
			next[tIdx] = { ...next[tIdx], rows: nextRows }
			return next
		})
	}

	const handleQuickPasteParse = (tIdx: number, pasteText: string) => {
		if (!pasteText.trim()) return
		const lines = pasteText.trim().split(/\r?\n/).filter((l) => l.trim())
		if (lines.length === 0) return

		const firstLine = lines[0]
		const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(',') ? ',' : '\t'
		const parsedGrid = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()))

		if (parsedGrid.length === 0) return

		const cols = parsedGrid[0]
		const rows = parsedGrid.slice(1)

		setTables((prev) => {
			const next = [...prev]
			next[tIdx] = {
				...next[tIdx],
				columns: cols,
				columnsText: cols.join(', '),
				rows: rows.length > 0 ? rows : [cols.map(() => '')],
				quickPasteText: '',
			}
			return next
		})
		toast.success(`Imported ${rows.length} rows with ${cols.length} columns!`)
	}

	// FAQ Handlers
	const handleAddFaq = () => {
		setFaqs((prev) => [...prev, { question: '', answer: '' }])
	}

	const handleRemoveFaq = (index: number) => {
		setFaqs((prev) => prev.filter((_, i) => i !== index))
	}

	const handleFaqChange = (index: number, field: keyof FaqFormState, value: string) => {
		setFaqs((prev) => {
			const updated = [...prev]
			updated[index] = { ...updated[index], [field]: value }
			return updated
		})
	}

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.title?.trim()) {
			toast.error('Article Title is required')
			setActiveTab('details')
			return
		}

		try {
			setSaving(true)
			const parsedTags = tagsString
				.split(',')
				.map((t) => t.trim().toLowerCase())
				.filter(Boolean)

			const parsedIntro = introText
				.split(/\n\s*\n/)
				.map((p) => p.trim())
				.filter(Boolean)

			const parsedSections = sections
				.filter((s) => s.heading.trim() || s.paragraphsText.trim() || (s.image && s.image.url && s.image.url.trim()))
				.map((s) => {
					const secObj: any = {
						heading: s.heading.trim(),
						paragraphs: s.paragraphsText
							.split(/\n\s*\n/)
							.map((p) => p.trim())
							.filter(Boolean),
						bullets: s.bulletsText
							.split('\n')
							.map((b) => b.trim())
							.filter(Boolean),
						...(s.closingParagraph.trim() ? { closingParagraph: s.closingParagraph.trim() } : {}),
					}

					if (s.image && s.image.url && s.image.url.trim()) {
						secObj.image = {
							url: s.image.url.trim(),
							alt: (s.image.alt || s.heading || '').trim(),
							caption: (s.image.caption || '').trim(),
							placement: s.image.placement || 'below_paragraphs',
						}
					}

					if (s.table && s.table.heading.trim() && s.table.columns.length > 0) {
						secObj.table = {
							heading: s.table.heading.trim(),
							columns: s.table.columns.map((c) => c.trim()).filter(Boolean),
							rows: s.table.rows.map((r) =>
								s.table!.columns.map((_, colIdx) =>
									r[colIdx] !== undefined ? String(r[colIdx]).trim() : ''
								)
							),
						}
					}

					return secObj
				})

			const parsedTables = tables
				.filter((t) => t.heading.trim() && t.columns.length > 0)
				.map((t) => ({
					heading: t.heading.trim(),
					columns: t.columns.map((c) => c.trim()).filter(Boolean),
					rows: t.rows.map((r) =>
						t.columns.map((_, colIdx) =>
							r[colIdx] !== undefined ? String(r[colIdx]).trim() : ''
						)
					),
				}))

			const parsedFaqs = faqs
				.filter((f) => f.question.trim() && f.answer.trim())
				.map((f) => ({
					question: f.question.trim(),
					answer: f.answer.trim(),
				}))

			const parsedBottomLine = bottomLineText.trim()
				? {
						heading: bottomLineHeading.trim() || 'The bottom line',
						paragraphs: bottomLineText
							.split(/\n\s*\n/)
							.map((p) => p.trim())
							.filter(Boolean),
				  }
				: undefined

			const fallbackStructured = extractStructuredFromHtml(editorHtml)
			const contentPayload: any = {
				...(formData.content || {}),
				html: editorHtml,
				intro: fallbackStructured.intro.length > 0 ? fallbackStructured.intro : parsedIntro,
				sections: fallbackStructured.sections.length > 0 ? fallbackStructured.sections : parsedSections,
				faqs: parsedFaqs,
				tables: parsedTables,
			}
			if (parsedTables.length > 0) {
				contentPayload.comparisonTable = parsedTables[0]
				if (parsedTables.length > 1) {
					contentPayload.proteinTable = parsedTables[1]
				}
			}
			if (parsedBottomLine) {
				contentPayload.bottomLine = parsedBottomLine
			}

			const generatedSlug = (formData.slug || formData.title || '')
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '')

			const payload: any = {
				...formData,
				slug: generatedSlug,
				tags: parsedTags,
				content: contentPayload,
				metaTitle: metaTitle.trim() || `${formData.title} | Gomzi Supplement`,
				metaDescription: metaDescription.trim() || formData.desc || '',
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
							Manage evidence-based clinical articles, data tables, body sections, FAQs, and SEO. Total Reads:{' '}
							{totalViews}
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
							<FontAwesomeIcon icon={faPlus} className='me-1' /> Add Complete Blog
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
								{ title: 'Reviewer', field: 'reviewer' },
								{ title: 'Featured', field: 'featured' },
								{ title: 'Reads', field: 'views' },
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
									<th className='min-w-80px text-center'>Sections</th>
									<th className='min-w-80px text-center'>Tables</th>
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
													<div
														className='d-flex flex-column gap-2 w-100'
														style={{ maxWidth: '300px' }}
													>
														<div className='gz-skeleton' style={{ width: '85%', height: '15px' }} />
														<div className='gz-skeleton' style={{ width: '55%', height: '12px' }} />
													</div>
												</div>
											</td>
											<td>
												<div className='gz-skeleton' style={{ width: '70px', height: '22px' }} />
											</td>
											<td>
												<div className='gz-skeleton' style={{ width: '100px', height: '14px' }} />
											</td>
											<td className='text-center'>
												<div
													className='gz-skeleton'
													style={{ width: '30px', height: '14px', margin: '0 auto' }}
												/>
											</td>
											<td className='text-center'>
												<div
													className='gz-skeleton'
													style={{ width: '30px', height: '14px', margin: '0 auto' }}
												/>
											</td>
											<td className='text-center'>
												<div
													className='gz-skeleton'
													style={{ width: '30px', height: '30px', margin: '0 auto' }}
												/>
											</td>
											<td className='text-center'>
												<div
													className='gz-skeleton'
													style={{ width: '40px', height: '14px', margin: '0 auto' }}
												/>
											</td>
											<td className='text-center'>
												<div
													className='gz-skeleton'
													style={{ width: '60px', height: '24px', margin: '0 auto' }}
												/>
											</td>
											<td className='text-end'>
												<div
													className='gz-skeleton'
													style={{ width: '70px', height: '32px', marginLeft: 'auto' }}
												/>
											</td>
										</tr>
									))
								) : filteredBlogs.length === 0 ? (
									<tr>
										<td colSpan={10} className='text-center py-10 text-muted'>
											<FontAwesomeIcon icon={faBookOpen} className='fs-1 d-block mb-3 opacity-25' />
											No articles found matching the current criteria.
										</td>
									</tr>
								) : (
									filteredBlogs.map((b, idx) => {
										const secTables = Array.isArray(b.content?.sections)
											? b.content.sections.filter((s: any) => s.table).length
											: 0
										const tablesCount =
											(Array.isArray(b.content?.tables)
												? b.content.tables.length
												: (b.content?.comparisonTable ? 1 : 0) + (b.content?.proteinTable ? 1 : 0)) +
											secTables
										return (
											<tr key={b._id || b.id || idx}>
												<td className='text-center text-muted fw-bold'>{idx + 1}</td>
												<td>
													<div className='d-flex align-items-center'>
														<img
															src={getPreviewUrl(b.image)}
															alt={b.title}
															className='rounded me-3 object-fit-cover shadow-sm'
															style={{ width: '48px', height: '48px', flexShrink: 0 }}
															onError={(e: any) => {
																e.target.src = '/images/blog-1.webp'
															}}
														/>
														<div className='d-flex flex-column'>
															<span className='text-gray-900 fw-bold text-hover-primary fs-6 mb-1'>
																{b.title}
															</span>
															<span className='text-muted fs-8'>
																<FontAwesomeIcon icon={faClock} className='me-1' />
																{b.readTime || '6 min read'} &bull; /{b.slug}
															</span>
														</div>
													</div>
												</td>
												<td>
													<span className='badge badge-light-primary fs-8 fw-semibold'>
														{b.category || 'Nutrition'}
													</span>
												</td>
												<td>
													<span className='text-gray-700 fs-7 d-flex align-items-center gap-1'>
														<FontAwesomeIcon icon={faUserMd} className='text-muted' />
														{b.reviewer || 'Clinical Team'}
													</span>
												</td>
												<td className='text-center'>
													<span className='badge badge-light-secondary fs-8'>
														{Array.isArray(b.content?.sections) ? b.content.sections.length : 0} sections
													</span>
												</td>
												<td className='text-center'>
													{tablesCount > 0 ? (
														<span className='badge badge-light-info fs-8 fw-bold'>
															<FontAwesomeIcon icon={faTable} className='me-1' />
															{tablesCount} {tablesCount === 1 ? 'table' : 'tables'}
														</span>
													) : (
														<span className='text-muted fs-8'>—</span>
													)}
												</td>
												<td className='text-center'>
													<button
														type='button'
														className={`btn btn-icon btn-sm ${
															b.featured ? 'btn-light-warning text-warning' : 'btn-light text-muted'
														}`}
														onClick={() => handleToggleFeatured(b)}
														title={b.featured ? 'Featured Article' : 'Make Featured'}
													>
														<FontAwesomeIcon icon={faStar} />
													</button>
												</td>
												<td className='text-center fw-bold text-gray-700'>{b.views || 0}</td>
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
														title='Edit Complete Blog'
													>
														<FontAwesomeIcon icon={faEdit} />
													</button>
													<button
														type='button'
														className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
														onClick={() => handleDelete(b._id || b.id)}
														title='Delete Article'
													>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    COMPLETE BLOG AUTHORING & EDITING MODAL WITH TABLE BUILDER
			    ========================================================================= */}
			{showModal && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
				>
					<div className='modal-dialog modal-dialog-centered modal-dialog-scrollable' style={{ maxWidth: '1280px', width: '96%' }}>
						<div
							className='modal-content border-0 shadow-lg'
							style={{ borderRadius: '16px', overflow: 'hidden' }}
						>
							<form onSubmit={handleSave} className='d-flex flex-column h-100'>
								{/* Modal Header */}
								<div
									className='modal-header py-4 px-6 border-bottom'
									style={{ backgroundColor: '#F8FAFC' }}
								>
									<div className='d-flex align-items-center gap-3'>
										<div
											style={{
												width: '38px',
												height: '38px',
												borderRadius: '10px',
												background: modalMode === 'create' ? '#EFF6FF' : '#F5F3FF',
												color: modalMode === 'create' ? '#2563EB' : '#7C3AED',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: '16px',
											}}
										>
											<FontAwesomeIcon icon={modalMode === 'create' ? faPlus : faEdit} />
										</div>
										<div>
											<h5 className='modal-title fw-bold text-gray-900 mb-0'>
												{modalMode === 'create'
													? 'Create Complete Publication'
													: 'Edit Publication & Body Content'}
											</h5>
											<p className='fs-8 text-muted mb-0'>
												{modalMode === 'create'
													? 'Draft an evidence-based clinical journal article for the website'
													: `Editing: "${formData.title || 'Journal Article'}"`}
											</p>
										</div>
									</div>
									<button
										type='button'
										className='btn-close'
										onClick={() => setShowModal(false)}
									/>
								</div>

								{/* Navigation Tabs */}
								<div className='bg-light px-6 pt-3 border-bottom'>
									<ul className='nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-6 fw-bold'>
										<li className='nav-item'>
											<button
												type='button'
												className={`nav-link text-active-primary pb-3 ${
													activeTab === 'details' ? 'active text-primary border-primary' : 'text-gray-600'
												}`}
												onClick={() => setActiveTab('details')}
											>
												<FontAwesomeIcon icon={faBookOpen} className='me-2' />
												1. Overview
											</button>
										</li>
										<li className='nav-item'>
											<button
												type='button'
												className={`nav-link text-active-primary pb-3 ${
													activeTab === 'media' ? 'active text-primary border-primary' : 'text-gray-600'
												}`}
												onClick={() => setActiveTab('media')}
											>
												<FontAwesomeIcon icon={faImage} className='me-2' />
												2. Cover Image
											</button>
										</li>
										<li className='nav-item'>
											<button
												type='button'
												className={`nav-link text-active-primary pb-3 ${
													activeTab === 'content' ? 'active text-primary border-primary' : 'text-gray-600'
												}`}
												onClick={() => setActiveTab('content')}
											>
												<FontAwesomeIcon icon={faFileAlt} className='me-2' />
												3. Document Editor (Google Docs)
											</button>
										</li>
										<li className='nav-item'>
											<button
												type='button'
												className={`nav-link text-active-primary pb-3 ${
													activeTab === 'faqs_seo' ? 'active text-primary border-primary' : 'text-gray-600'
												}`}
												onClick={() => setActiveTab('faqs_seo')}
											>
												<FontAwesomeIcon icon={faQuestionCircle} className='me-2' />
												4. FAQs & SEO{' '}
												{faqs.length > 0 && (
													<span className='badge badge-light-success ms-1 fs-9'>{faqs.length}</span>
												)}
											</button>
										</li>
									</ul>
								</div>

								{/* Modal Body */}
								<div className='modal-body p-6 p-md-8' style={{ maxHeight: '78vh' }}>
									{/* TAB 1: OVERVIEW & METADATA */}
									{activeTab === 'details' && (
										<div className='row g-4'>
											<div className='col-12'>
												<label className='form-label required fw-bold text-gray-800'>
													Article Title
												</label>
												<input
													type='text'
													className='form-control form-control-solid'
													placeholder='e.g., Plant Protein Guide: Benefits, Best Sources & Side Effects'
													value={formData.title || ''}
													onChange={(e) =>
														setFormData({ ...formData, title: e.target.value })
													}
													required
												/>
											</div>

											<div className='col-md-7'>
												<div className='d-flex align-items-center justify-content-between mb-1'>
													<label className='form-label fw-bold text-gray-800 mb-0'>
														Slug (URL Identifier)
													</label>
													<button
														type='button'
														className='btn btn-link btn-color-primary p-0 fs-8'
														onClick={handleGenerateSlug}
													>
														Auto-generate from title
													</button>
												</div>
												<div className='input-group input-group-solid'>
													<span className='input-group-text text-muted fs-8'>/blog/</span>
													<input
														type='text'
														className='form-control form-control-solid'
														placeholder='what-is-plant-protein-benefits-uses-and-side-effects'
														value={formData.slug || ''}
														onChange={(e) =>
															setFormData({ ...formData, slug: e.target.value })
														}
													/>
												</div>
											</div>

											<div className='col-md-5'>
												<label className='form-label fw-bold text-gray-800'>Category</label>
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
												<label className='form-label fw-bold text-gray-800'>
													Estimated Reading Time
												</label>
												<input
													type='text'
													className='form-control form-control-solid'
													placeholder='e.g., 7 min read'
													value={formData.readTime || '6 min read'}
													onChange={(e) =>
														setFormData({ ...formData, readTime: e.target.value })
													}
												/>
											</div>

											<div className='col-md-6'>
												<label className='form-label fw-bold text-gray-800'>
													Clinical / Medical Reviewer
												</label>
												<input
													type='text'
													className='form-control form-control-solid'
													placeholder='e.g., Dt. Chirag Pandey, RD'
													value={formData.reviewer || 'Dt. Chirag Pandey, RD'}
													onChange={(e) =>
														setFormData({ ...formData, reviewer: e.target.value })
													}
												/>
											</div>

											<div className='col-md-6'>
												<label className='form-label fw-bold text-gray-800'>Author</label>
												<input
													type='text'
													className='form-control form-control-solid'
													placeholder='e.g., Gomzi Supplement by RAG'
													value={formData.author || 'Gomzi Supplement by RAG'}
													onChange={(e) =>
														setFormData({ ...formData, author: e.target.value })
													}
												/>
											</div>

											<div className='col-md-6'>
												<label className='form-label fw-bold text-gray-800'>
													Tags (Comma-separated)
												</label>
												<input
													type='text'
													className='form-control form-control-solid'
													placeholder='e.g., nutrition, plant-protein, vegan'
													value={tagsString}
													onChange={(e) => setTagsString(e.target.value)}
												/>
											</div>

											<div className='col-12'>
												<label className='form-label fw-bold text-gray-800'>
													Short Summary / Excerpt
												</label>
												<textarea
													className='form-control form-control-solid'
													rows={3}
													placeholder='A quick 1-2 sentence overview for the article preview card...'
													value={formData.desc || ''}
													onChange={(e) =>
														setFormData({ ...formData, desc: e.target.value })
													}
												/>
											</div>

											<div className='col-md-6'>
												<div
													className='p-4 rounded-3 border d-flex align-items-center justify-content-between'
													style={{ backgroundColor: '#F8FAFC' }}
												>
													<div>
														<span className='fw-bold text-gray-800 d-block'>
															Publication Status
														</span>
														<span className='fs-8 text-muted'>
															{formData.status !== false
																? 'Visible and live on public website'
																: 'Draft only (hidden from readers)'}
														</span>
													</div>
													<div className='form-check form-switch'>
														<input
															className='form-check-input'
															type='checkbox'
															id='statusToggle'
															checked={formData.status !== false}
															onChange={(e) =>
																setFormData({ ...formData, status: e.target.checked })
															}
														/>
													</div>
												</div>
											</div>

											<div className='col-md-6'>
												<div
													className='p-4 rounded-3 border d-flex align-items-center justify-content-between'
													style={{ backgroundColor: '#F8FAFC' }}
												>
													<div>
														<span className='fw-bold text-gray-800 d-block'>
															Hero Featured Article
														</span>
														<span className='fs-8 text-muted'>
															Pin this publication to the top banner hero
														</span>
													</div>
													<div className='form-check form-switch'>
														<input
															className='form-check-input'
															type='checkbox'
															id='featuredToggle'
															checked={Boolean(formData.featured)}
															onChange={(e) =>
																setFormData({ ...formData, featured: e.target.checked })
															}
														/>
													</div>
												</div>
											</div>
										</div>
									)}

									{/* TAB 2: COVER IMAGE & MEDIA */}
									{activeTab === 'media' && (
										<div className='row g-5'>
											<div className='col-md-6'>
												<div className='card border shadow-none p-5 h-100'>
													<h6 className='fw-bold text-gray-900 mb-3'>
														<FontAwesomeIcon icon={faUpload} className='me-2 text-primary' />
														Upload New Image
													</h6>
													<p className='fs-8 text-muted mb-4'>
														Upload high-resolution editorial photography (WebP, PNG, or JPEG, 16:9 ratio recommended).
													</p>

													<div className='mb-4'>
														<label
															htmlFor='blogImageFileInput'
															className={`btn btn-outline btn-outline-dashed btn-outline-primary d-flex flex-column align-items-center justify-content-center p-6 w-100 ${
																uploadingImage ? 'disabled' : ''
															}`}
															style={{ cursor: uploadingImage ? 'wait' : 'pointer' }}
														>
															<FontAwesomeIcon
																icon={uploadingImage ? faRotateLeft : faUpload}
																className={`fs-1 text-primary mb-2 ${
																	uploadingImage ? 'fa-spin' : ''
																}`}
															/>
															<span className='fw-bold text-gray-800'>
																{uploadingImage
																	? 'Uploading image to CDN...'
																	: 'Click to Choose File'}
															</span>
															<span className='fs-8 text-muted mt-1'>
																Supports JPG, PNG, WebP up to 5MB
															</span>
														</label>
														<input
															type='file'
															id='blogImageFileInput'
															className='d-none'
															accept='image/*'
															onChange={handleImageFileUpload}
															disabled={uploadingImage}
														/>
													</div>

													<div className='separator my-3' />

													<h6 className='fw-bold text-gray-900 mb-2 fs-7'>
														Or Select a Curated Preset
													</h6>
													<div className='d-flex flex-column gap-2'>
														{PRESET_IMAGES.map((preset, idx) => (
															<button
																key={idx}
																type='button'
																className={`btn btn-sm text-start py-2 px-3 border ${
																	formData.image === preset.url
																		? 'btn-light-primary border-primary fw-bold'
																		: 'btn-light'
																}`}
																onClick={() =>
																	setFormData({ ...formData, image: preset.url })
																}
															>
																<FontAwesomeIcon icon={faCheck} className='me-2 opacity-50' />
																{preset.label}
															</button>
														))}
													</div>
												</div>
											</div>

											<div className='col-md-6'>
												<div className='card border shadow-none p-5 h-100'>
													<h6 className='fw-bold text-gray-900 mb-3'>
														<FontAwesomeIcon icon={faImage} className='me-2 text-primary' />
														Image Preview & Direct URL
													</h6>

													<div className='mb-4'>
														<label className='form-label fw-bold text-gray-800 fs-8'>
															Direct Image URL
														</label>
														<input
															type='text'
															className='form-control form-control-solid form-control-sm'
															placeholder='https://... or /images/blog-2.webp'
															value={formData.image || ''}
															onChange={(e) =>
																setFormData({ ...formData, image: e.target.value })
															}
														/>
													</div>

													<div
														className='rounded-3 overflow-hidden border bg-light d-flex align-items-center justify-content-center position-relative'
														style={{ height: '220px' }}
													>
														<img
															src={getPreviewUrl(formData.image)}
															alt='Article preview'
															className='w-100 h-100 object-fit-cover'
															onError={(e: any) => {
																e.target.src = '/images/blog-1.webp'
															}}
														/>
														<div
															className='position-absolute top-0 start-0 m-3 badge badge-primary shadow-sm'
															style={{ fontSize: '11px' }}
														>
															{formData.category || 'Nutrition'}
														</div>
													</div>

													<p className='fs-8 text-muted mt-3 mb-0'>
														This image appears in the website science journal hero, article detail header, and social sharing OpenGraph previews.
													</p>
												</div>
											</div>
										</div>
									)}

									{/* TAB 3: GOOGLE DOCS STYLE DOCUMENT CANVAS */}
									{activeTab === 'content' && (
										<div className='p-0'>
											<div className='d-flex align-items-center justify-content-between mb-3 px-1'>
												<div>
													<h6 className='fw-bold text-gray-900 mb-0'>
														<FontAwesomeIcon icon={faFileAlt} className='me-2 text-primary' />
														Google Docs Article Canvas
													</h6>
													<p className='fs-8 text-muted mb-0'>
														Type directly, insert images & tables anywhere, format headings, or paste directly from Google Docs / Microsoft Word.
													</p>
												</div>
											</div>
											<GoogleDocsEditor
												value={editorHtml}
												onChange={setEditorHtml}
												placeholder='Start writing your publication or paste directly from Google Docs / Microsoft Word...'
												minHeight={650}
											/>
										</div>
									)}

									{/* TAB 4: FAQS & SEO */}
									{activeTab === 'faqs_seo' && (
										<div>
											{/* Frequently Asked Questions */}
											<div className='card border shadow-none p-5 mb-5'>
												<div className='d-flex align-items-center justify-content-between mb-4'>
													<div>
														<h6 className='fw-bold text-gray-900 mb-0'>
															<FontAwesomeIcon icon={faQuestionCircle} className='me-2 text-primary' />
															Frequently Asked Questions ({faqs.length})
														</h6>
														<p className='fs-8 text-muted mb-0'>
															Rendered in the article FAQ accordion and used for Google FAQ Rich Snippets schema.
														</p>
													</div>
													<button
														type='button'
														className='btn btn-sm btn-light-primary'
														onClick={handleAddFaq}
													>
														<FontAwesomeIcon icon={faPlus} className='me-1' /> Add FAQ
													</button>
												</div>

												{faqs.length === 0 ? (
													<p className='text-muted fs-8 mb-0 text-center py-4 bg-light rounded-3'>
														No FAQs added yet. Click "+ Add FAQ" to add question-and-answer pairs.
													</p>
												) : (
													<div className='d-flex flex-column gap-3'>
														{faqs.map((faq, fIdx) => (
															<div key={fIdx} className='p-4 border rounded-3 bg-light'>
																<div className='d-flex align-items-center justify-content-between mb-2'>
																	<span className='fw-bold fs-8 text-primary'>
																		Q&A #{fIdx + 1}
																	</span>
																	<button
																		type='button'
																		className='btn btn-link btn-color-danger p-0 fs-8'
																		onClick={() => handleRemoveFaq(fIdx)}
																	>
																		<FontAwesomeIcon icon={faTimes} className='me-1' /> Remove
																	</button>
																</div>
																<div className='mb-2'>
																	<input
																		type='text'
																		className='form-control form-control-solid form-control-sm'
																		placeholder='Question: e.g., Is plant protein good for muscle building?'
																		value={faq.question}
																		onChange={(e) =>
																			handleFaqChange(fIdx, 'question', e.target.value)
																		}
																	/>
																</div>
																<div>
																	<textarea
																		className='form-control form-control-solid form-control-sm'
																		rows={2}
																		placeholder='Answer explaining the evidence clearly...'
																		value={faq.answer}
																		onChange={(e) =>
																			handleFaqChange(fIdx, 'answer', e.target.value)
																		}
																	/>
																</div>
															</div>
														))}
													</div>
												)}
											</div>

											{/* Bottom Line Takeaway */}
											<div className='card border shadow-none p-5 mb-5'>
												<h6 className='fw-bold text-gray-900 mb-1'>
													<FontAwesomeIcon icon={faCheck} className='me-2 text-success' />
													The Bottom Line / Conclusion Callout
												</h6>
												<p className='fs-8 text-muted mb-3'>
													The final clinical takeaway card displayed at the bottom of the article.
												</p>

												<div className='mb-3'>
													<label className='form-label fw-bold fs-8 text-gray-700'>
														Conclusion Heading
													</label>
													<input
														type='text'
														className='form-control form-control-solid form-control-sm'
														placeholder='Conclusion'
														value={bottomLineHeading}
														onChange={(e) => setBottomLineHeading(e.target.value)}
													/>
												</div>

												<div>
													<label className='form-label fw-bold fs-8 text-gray-700'>
														Conclusion Body Text
													</label>
													<textarea
														className='form-control form-control-solid'
														rows={3}
														placeholder='Plant protein is a valuable part of a balanced diet...'
														value={bottomLineText}
														onChange={(e) => setBottomLineText(e.target.value)}
													/>
												</div>
											</div>

											{/* SEO Meta Tags */}
											<div className='card border shadow-none p-5'>
												<h6 className='fw-bold text-gray-900 mb-1'>
													<FontAwesomeIcon icon={faSearch} className='me-2 text-primary' />
													Search Engine Optimization (SEO Meta Tags)
												</h6>
												<p className='fs-8 text-muted mb-3'>
													Configure how this article displays on Google Search results and social media embeds.
												</p>

												<div className='mb-3'>
													<div className='d-flex justify-content-between align-items-center mb-1'>
														<label className='form-label fw-bold fs-8 text-gray-700 mb-0'>
															SEO Meta Title
														</label>
														<span className='fs-9 text-muted'>
															{metaTitle.length}/60 characters
														</span>
													</div>
													<input
														type='text'
														className='form-control form-control-solid form-control-sm'
														placeholder='Plant Protein Guide: Benefits, Best Sources & Side Effects'
														value={metaTitle}
														onChange={(e) => setMetaTitle(e.target.value)}
													/>
												</div>

												<div>
													<div className='d-flex justify-content-between align-items-center mb-1'>
														<label className='form-label fw-bold fs-8 text-gray-700 mb-0'>
															SEO Meta Description
														</label>
														<span className='fs-9 text-muted'>
															{metaDescription.length}/160 characters
														</span>
													</div>
													<textarea
														className='form-control form-control-solid form-control-sm'
														rows={2}
														placeholder='Discover plant protein benefits, types, uses, and side effects...'
														value={metaDescription}
														onChange={(e) => setMetaDescription(e.target.value)}
													/>
												</div>
											</div>
										</div>
									)}
								</div>

								{/* Modal Footer */}
								<div
									className='modal-footer py-3 px-6 border-top d-flex justify-content-between'
									style={{ backgroundColor: '#F8FAFC' }}
								>
									<button
										type='button'
										className='btn btn-sm btn-light'
										onClick={() => setShowModal(false)}
									>
										Cancel
									</button>

									<div className='d-flex gap-2'>
										{activeTab !== 'details' && (
											<button
												type='button'
												className='btn btn-sm btn-light-primary'
												onClick={() => {
													if (activeTab === 'media') setActiveTab('details')
													else if (activeTab === 'content') setActiveTab('media')
													else if (activeTab === 'faqs_seo') setActiveTab('content')
												}}
											>
												&larr; Previous Tab
											</button>
										)}

										{activeTab !== 'faqs_seo' ? (
											<button
												type='button'
												className='btn btn-sm btn-primary'
												onClick={() => {
													if (activeTab === 'details') setActiveTab('media')
													else if (activeTab === 'media') setActiveTab('content')
													else if (activeTab === 'content') setActiveTab('faqs_seo')
												}}
											>
												Next Tab &rarr;
											</button>
										) : null}

										<button
											type='submit'
											className='btn btn-sm btn-success'
											disabled={saving}
										>
											<FontAwesomeIcon icon={faCheck} className='me-1' />
											{saving
												? 'Saving Publication...'
												: modalMode === 'create'
												? 'Publish / Save Article'
												: 'Save Changes'}
										</button>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
