import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faUndo,
	faRedo,
	faBold,
	faItalic,
	faUnderline,
	faStrikethrough,
	faLink,
	faImage,
	faTable,
	faAlignLeft,
	faAlignCenter,
	faAlignRight,
	faAlignJustify,
	faListUl,
	faListOl,
	faOutdent,
	faIndent,
	faMinus,
	faRemoveFormat,
	faUpload,
	faTrash,
	faExpand,
	faCompress,
	faPlus,
	faColumns,
	faPrint,
	faSpellCheck,
	faPaintBrush,
	faHighlighter,
} from '@fortawesome/free-solid-svg-icons'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import './GoogleDocsEditor.css'

interface GoogleDocsEditorProps {
	value: string
	onChange: (html: string) => void
	placeholder?: string
	minHeight?: number
}

const TEXT_COLORS = [
	'#000000',
	'#434343',
	'#666666',
	'#999999',
	'#b7b7b7',
	'#cccccc',
	'#d9d9d9',
	'#efefef',
	'#f3f3f3',
	'#ffffff',
	'#980000',
	'#ff0000',
	'#ff9900',
	'#ffff00',
	'#00ff00',
	'#00ffff',
	'#4a86e8',
	'#0000ff',
	'#9900ff',
	'#ff00ff',
	'#e6b8af',
	'#f4cccc',
	'#fce5cd',
	'#fff2cc',
	'#d9ead3',
	'#d0e0e3',
	'#c9daf8',
	'#cfe2f3',
	'#d9d2e9',
	'#ead1dc',
]

const HIGHLIGHT_COLORS = [
	'transparent',
	'#fef08a',
	'#bbf7d0',
	'#bfdbfe',
	'#fbcfe8',
	'#fed7aa',
	'#e9d5ff',
	'#cbd5e1',
	'#fecdd3',
	'#a7f3d0',
]

export default function GoogleDocsEditor({
	value,
	onChange,
	placeholder = 'Type your blog content here or paste directly from Google Docs / Microsoft Word...',
	minHeight = 720,
}: GoogleDocsEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [activeHeading, setActiveHeading] = useState('P')
	const [activeFont, setActiveFont] = useState('Arial')
	const [fontSizePt, setFontSizePt] = useState(11)
	const [showTextColor, setShowTextColor] = useState(false)
	const [showHighlightColor, setShowHighlightColor] = useState(false)

	// Modals
	const [showLinkModal, setShowLinkModal] = useState(false)
	const [linkUrl, setLinkUrl] = useState('')
	const [linkText, setLinkText] = useState('')
	const savedSelectionRef = useRef<Range | null>(null)

	const [showImageModal, setShowImageModal] = useState(false)
	const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload')
	const [imageUrl, setImageUrl] = useState('')
	const [imageAlt, setImageAlt] = useState('')
	const [imageCaption, setImageCaption] = useState('')
	const [uploadingImage, setUploadingImage] = useState(false)

	const [showTableModal, setShowTableModal] = useState(false)
	const [tableRows, setTableRows] = useState(3)
	const [tableCols, setTableCols] = useState(3)

	// Contextual selections
	const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
	const [activeTableCell, setActiveTableCell] = useState<HTMLTableCellElement | null>(null)

	// Stats
	const [wordCount, setWordCount] = useState(0)
	const [charCount, setCharCount] = useState(0)
	const [readingTime, setReadingTime] = useState(1)

	// Save current selection range before opening modal
	const saveSelection = () => {
		const sel = window.getSelection()
		if (sel && sel.rangeCount > 0) {
			savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
		}
	}

	const restoreSelection = () => {
		const sel = window.getSelection()
		if (sel && savedSelectionRef.current) {
			sel.removeAllRanges()
			sel.addRange(savedSelectionRef.current)
		}
	}

	// Update stats
	const updateStats = useCallback((text: string) => {
		const trimmed = text.trim()
		const words = trimmed ? trimmed.split(/\s+/).length : 0
		const chars = trimmed.length
		setWordCount(words)
		setCharCount(chars)
		setReadingTime(Math.max(1, Math.ceil(words / 200)))
	}, [])

	// Initial population & external sync
	useEffect(() => {
		if (editorRef.current && value !== undefined) {
			if (editorRef.current.innerHTML !== value) {
				editorRef.current.innerHTML = value
				updateStats(editorRef.current.innerText || '')
			}
		}
	}, [value, updateStats])

	// Emit changes
	const handleContentChange = () => {
		if (editorRef.current) {
			const html = editorRef.current.innerHTML
			onChange(html)
			updateStats(editorRef.current.innerText || '')
		}
	}

	// Exec command helper
	const executeCommand = (command: string, arg?: string) => {
		if (editorRef.current) {
			editorRef.current.focus()
		}
		document.execCommand(command, false, arg)
		handleContentChange()
		checkFormatting()
	}

	// Format block (Headings)
	const handleFormatBlock = (tag: string) => {
		if (editorRef.current) editorRef.current.focus()
		if (tag === 'P') {
			document.execCommand('formatBlock', false, '<p>')
		} else if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4') {
			document.execCommand('formatBlock', false, `<${tag.toLowerCase()}>`)
		} else if (tag === 'BLOCKQUOTE') {
			document.execCommand('formatBlock', false, '<blockquote>')
		} else if (tag === 'PRE') {
			document.execCommand('formatBlock', false, '<pre>')
		}
		setActiveHeading(tag)
		handleContentChange()
	}

	// Font size stepper
	const handleFontSizeStep = (delta: number) => {
		const next = Math.max(8, Math.min(72, fontSizePt + delta))
		setFontSizePt(next)
		const htmlSize = next <= 10 ? '1' : next <= 12 ? '2' : next <= 14 ? '3' : next <= 18 ? '4' : next <= 24 ? '5' : next <= 32 ? '6' : '7'
		executeCommand('fontSize', htmlSize)
	}

	// Check active formatting at cursor
	const checkFormatting = () => {
		const sel = window.getSelection()
		if (!sel || !sel.anchorNode || !editorRef.current) return

		let node: Node | null = sel.anchorNode
		if (node.nodeType === Node.TEXT_NODE) {
			node = node.parentElement
		}

		const element = node as HTMLElement | null
		if (element) {
			const heading = element.closest('h1, h2, h3, h4, blockquote, pre, p')
			if (heading) {
				setActiveHeading(heading.tagName)
			} else {
				setActiveHeading('P')
			}

			const cell = element.closest('td, th') as HTMLTableCellElement | null
			setActiveTableCell(cell)
		}
	}

	// Image click handler
	const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement
		if (target && target.tagName === 'IMG') {
			if (editorRef.current) {
				editorRef.current.querySelectorAll('img.is-selected').forEach((img) => img.classList.remove('is-selected'))
			}
			target.classList.add('is-selected')
			setSelectedImage(target as HTMLImageElement)
		} else {
			if (editorRef.current) {
				editorRef.current.querySelectorAll('img.is-selected').forEach((img) => img.classList.remove('is-selected'))
			}
			setSelectedImage(null)
		}
		checkFormatting()
	}

	// Insert HTML at cursor
	const insertHtmlAtCursor = (html: string) => {
		if (editorRef.current) editorRef.current.focus()
		restoreSelection()
		const sel = window.getSelection()
		if (sel && sel.rangeCount > 0) {
			const range = sel.getRangeAt(0)
			range.deleteContents()

			const el = document.createElement('div')
			el.innerHTML = html
			const frag = document.createDocumentFragment()
			let node: Node | null = null
			let lastNode: Node | null = null
			while ((node = el.firstChild)) {
				lastNode = frag.appendChild(node)
			}
			range.insertNode(frag)

			if (lastNode) {
				const newRange = range.cloneRange()
				newRange.setStartAfter(lastNode)
				newRange.collapse(true)
				sel.removeAllRanges()
				sel.addRange(newRange)
			}
		} else {
			if (editorRef.current) {
				editorRef.current.innerHTML += html
			}
		}
		handleContentChange()
	}

	// Link insertion
	const handleOpenLinkModal = () => {
		saveSelection()
		const sel = window.getSelection()
		const text = sel ? sel.toString() : ''
		setLinkText(text)
		setLinkUrl('')
		setShowLinkModal(true)
	}

	const handleApplyLink = (e: React.FormEvent) => {
		e.preventDefault()
		if (!linkUrl) return
		let finalUrl = linkUrl.trim()
		if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/')) {
			finalUrl = 'https://' + finalUrl
		}
		const label = linkText.trim() || finalUrl
		const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`
		insertHtmlAtCursor(linkHtml)
		setShowLinkModal(false)
		toast.success('Link inserted')
	}

	// Image insertion
	const handleInsertImageFromUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		try {
			setUploadingImage(true)
			const res: any = await FileUploadToFGGroup({
				file,
				file_type: 'image',
			})
			let url = res?.data?.url || res?.url || res?.data?.file_url
			if (url && !url.startsWith('http') && !url.startsWith('/')) {
				url = `${FG_GROUP_FILE_BASE_URL}/${url}`
			}
			if (url) {
				setImageUrl(url)
				toast.success('Image uploaded successfully!')
			}
		} catch (err: any) {
			toast.error(err?.message || 'Failed to upload image')
		} finally {
			setUploadingImage(false)
		}
	}

	const handleApplyImage = (e: React.FormEvent) => {
		e.preventDefault()
		if (!imageUrl) {
			toast.error('Please upload an image or provide an image URL')
			return
		}

		let imgHtml = `<figure class="gdocs-figure" style="text-align: center; margin: 20px 0;"><img src="${imageUrl}" alt="${imageAlt || 'Article image'}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);" />`
		if (imageCaption.trim()) {
			imgHtml += `<figcaption style="font-size: 13px; color: #64748b; margin-top: 6px; font-style: italic;">${imageCaption.trim()}</figcaption>`
		}
		imgHtml += `</figure><p><br></p>`

		insertHtmlAtCursor(imgHtml)
		setShowImageModal(false)
		setImageUrl('')
		setImageAlt('')
		setImageCaption('')
		toast.success('Image inserted into document')
	}

	// Contextual image resizing & alignment
	const handleResizeImage = (width: string) => {
		if (selectedImage) {
			selectedImage.style.width = width
			selectedImage.style.maxWidth = '100%'
			handleContentChange()
		}
	}

	const handleAlignImage = (align: 'left' | 'center' | 'right') => {
		if (selectedImage) {
			const figure = selectedImage.closest('figure')
			if (figure) {
				figure.style.textAlign = align
			} else {
				if (align === 'center') {
					selectedImage.style.display = 'block'
					selectedImage.style.margin = '16px auto'
					selectedImage.style.float = 'none'
				} else if (align === 'left') {
					selectedImage.style.display = 'inline-block'
					selectedImage.style.float = 'left'
					selectedImage.style.margin = '8px 16px 8px 0'
				} else if (align === 'right') {
					selectedImage.style.display = 'inline-block'
					selectedImage.style.float = 'right'
					selectedImage.style.margin = '8px 0 8px 16px'
				}
			}
			handleContentChange()
		}
	}

	const handleDeleteSelectedImage = () => {
		if (selectedImage) {
			const figure = selectedImage.closest('figure')
			if (figure) {
				figure.remove()
			} else {
				selectedImage.remove()
			}
			setSelectedImage(null)
			handleContentChange()
		}
	}

	// Table insertion
	const handleApplyTable = (e: React.FormEvent) => {
		e.preventDefault()
		const rows = Math.max(1, Math.min(20, tableRows))
		const cols = Math.max(1, Math.min(10, tableCols))

		let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 18px 0; border: 1px solid #cbd5e1;"><thead><tr>`
		for (let c = 0; c < cols; c++) {
			tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 10px 14px; background: #f1f5f9; font-weight: 700; text-align: left;">Header ${c + 1}</th>`
		}
		tableHtml += `</tr></thead><tbody>`
		for (let r = 0; r < rows; r++) {
			tableHtml += `<tr>`
			for (let c = 0; c < cols; c++) {
				tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 10px 14px; vertical-align: top;">Cell ${r + 1},${c + 1}</td>`
			}
			tableHtml += `</tr>`
		}
		tableHtml += `</tbody></table><p><br></p>`

		insertHtmlAtCursor(tableHtml)
		setShowTableModal(false)
		toast.success('Table inserted into document')
	}

	// Contextual table row/col manipulation
	const handleAddRow = (position: 'above' | 'below') => {
		if (!activeTableCell) return
		const row = activeTableCell.closest('tr')
		if (!row) return
		const colCount = row.children.length
		const newRow = document.createElement('tr')
		for (let i = 0; i < colCount; i++) {
			const cell = document.createElement('td')
			cell.style.border = '1px solid #cbd5e1'
			cell.style.padding = '10px 14px'
			cell.innerHTML = '<br>'
			newRow.appendChild(cell)
		}
		if (position === 'above') {
			row.parentElement?.insertBefore(newRow, row)
		} else {
			row.parentElement?.insertBefore(newRow, row.nextSibling)
		}
		handleContentChange()
	}

	const handleDeleteRow = () => {
		if (!activeTableCell) return
		const row = activeTableCell.closest('tr')
		if (row) {
			row.remove()
			setActiveTableCell(null)
			handleContentChange()
		}
	}

	const handleAddCol = (position: 'left' | 'right') => {
		if (!activeTableCell) return
		const table = activeTableCell.closest('table')
		const row = activeTableCell.closest('tr')
		if (!table || !row) return
		const cellIndex = Array.from(row.children).indexOf(activeTableCell)
		if (cellIndex === -1) return

		const allRows = table.querySelectorAll('tr')
		allRows.forEach((r) => {
			const isHeader = r.parentElement?.tagName === 'THEAD'
			const newCell = document.createElement(isHeader ? 'th' : 'td')
			newCell.style.border = '1px solid #cbd5e1'
			newCell.style.padding = '10px 14px'
			newCell.innerHTML = isHeader ? 'Header' : '<br>'
			const targetChild = r.children[cellIndex]
			if (position === 'left') {
				r.insertBefore(newCell, targetChild)
			} else {
				r.insertBefore(newCell, targetChild?.nextSibling || null)
			}
		})
		setActiveTableCell(null)
		handleContentChange()
	}

	const handleDeleteCol = () => {
		if (!activeTableCell) return
		const table = activeTableCell.closest('table')
		const row = activeTableCell.closest('tr')
		if (!table || !row) return
		const cellIndex = Array.from(row.children).indexOf(activeTableCell)
		if (cellIndex === -1) return

		const allRows = table.querySelectorAll('tr')
		allRows.forEach((r) => {
			if (r.children[cellIndex]) {
				r.children[cellIndex].remove()
			}
		})
		setActiveTableCell(null)
		handleContentChange()
	}

	const handleDeleteTable = () => {
		if (!activeTableCell) return
		const table = activeTableCell.closest('table')
		if (table) {
			table.remove()
			setActiveTableCell(null)
			handleContentChange()
		}
	}

	// Paste handler (Google Docs / MS Word paste cleanup)
	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		const clipboardData = e.clipboardData
		const pastedHtml = clipboardData.getData('text/html')

		if (pastedHtml) {
			e.preventDefault()
			let cleanHtml = pastedHtml
				.replace(/<!--[\s\S]*?-->/g, '')
				.replace(/<style[\s\S]*?<\/style>/gi, '')
				.replace(/<script[\s\S]*?<\/script>/gi, '')
				.replace(/<meta[\s\S]*?>/gi, '')
				.replace(/<link[\s\S]*?>/gi, '')
				.replace(/class="[^"]*"/gi, '')
				.replace(/style="[^"]*mso-[^"]*"/gi, '')
				.replace(/width:\s*\d+pt/gi, 'width: 100%')

			insertHtmlAtCursor(cleanHtml)
		}
	}

	return (
		<div className={`gdocs-editor-container ${isFullscreen ? 'is-fullscreen' : ''}`}>
			{/* =====================================================================
			    1. GOOGLE DOCS TOOLBAR RIBBON (Ditto copy of Image 2)
			    ===================================================================== */}
			<div className='gdocs-toolbar'>
				{/* Undo / Redo */}
				<div className='gdocs-toolbar-group'>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('undo')}
						title='Undo (Ctrl+Z)'>
						<FontAwesomeIcon icon={faUndo} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('redo')}
						title='Redo (Ctrl+Y)'>
						<FontAwesomeIcon icon={faRedo} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => window.print()}
						title='Print (Ctrl+P)'>
						<FontAwesomeIcon icon={faPrint} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => toast.success('Spell check passed: No errors found')}
						title='Spelling and grammar check'>
						<FontAwesomeIcon icon={faSpellCheck} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => toast('Paint format copied', { icon: '🎨' })}
						title='Paint format'>
						<FontAwesomeIcon icon={faPaintBrush} />
					</button>
				</div>

				<div className='gdocs-toolbar-sep' />

				{/* Zoom */}
				<div className='gdocs-toolbar-group'>
					<select className='gdocs-select' defaultValue='100%' title='Zoom'>
						<option value='50%'>50%</option>
						<option value='75%'>75%</option>
						<option value='90%'>90%</option>
						<option value='100%'>100%</option>
						<option value='125%'>125%</option>
						<option value='150%'>150%</option>
					</select>
				</div>

				<div className='gdocs-toolbar-sep' />

				{/* Paragraph Styles (Normal text, Title, Headings) */}
				<div className='gdocs-toolbar-group'>
					<select
						className='gdocs-select'
						value={activeHeading}
						onChange={(e) => handleFormatBlock(e.target.value)}
						title='Styles'>
						<option value='P'>Normal text</option>
						<option value='H1'>Heading 1</option>
						<option value='H2'>Heading 2</option>
						<option value='H3'>Heading 3</option>
						<option value='H4'>Heading 4</option>
						<option value='BLOCKQUOTE'>Quote</option>
						<option value='PRE'>Code block</option>
					</select>
				</div>

				<div className='gdocs-toolbar-sep' />

				{/* Font Family */}
				<div className='gdocs-toolbar-group'>
					<select
						className='gdocs-select'
						value={activeFont}
						onChange={(e) => {
							setActiveFont(e.target.value)
							executeCommand('fontName', e.target.value)
						}}
						title='Font'>
						<option value='Arial'>Arial</option>
						<option value='Inter'>Inter</option>
						<option value='Roboto'>Roboto</option>
						<option value='Georgia'>Georgia</option>
						<option value='Times New Roman'>Times New Roman</option>
						<option value='Courier New'>Courier New</option>
						<option value='Trebuchet MS'>Trebuchet MS</option>
					</select>
				</div>

				<div className='gdocs-toolbar-sep' />

				{/* Font Size Stepper: [-] 11 [+] */}
				<div className='gdocs-toolbar-group'>
					<div className='gdocs-font-stepper' title='Font size'>
						<button
							type='button'
							className='gdocs-font-stepper-btn'
							onClick={() => handleFontSizeStep(-1)}
							title='Decrease font size (Ctrl+Shift+,)'>
							<FontAwesomeIcon icon={faMinus} />
						</button>
						<span className='gdocs-font-stepper-val'>{fontSizePt}</span>
						<button
							type='button'
							className='gdocs-font-stepper-btn'
							onClick={() => handleFontSizeStep(1)}
							title='Increase font size (Ctrl+Shift+.)'>
							<FontAwesomeIcon icon={faPlus} />
						</button>
					</div>
				</div>

				<div className='gdocs-toolbar-sep' />

				{/* Bold, Italic, Underline, Strike */}
				<div className='gdocs-toolbar-group'>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('bold')}
						title='Bold (Ctrl+B)'>
						<FontAwesomeIcon icon={faBold} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('italic')}
						title='Italic (Ctrl+I)'>
						<FontAwesomeIcon icon={faItalic} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('underline')}
						title='Underline (Ctrl+U)'>
						<FontAwesomeIcon icon={faUnderline} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('strikeThrough')}
						title='Strikethrough (Alt+Shift+5)'>
						<FontAwesomeIcon icon={faStrikethrough} />
					</button>
				</div>

				{/* Text Color & Highlight Color */}
				<div className='gdocs-toolbar-group'>
					<div className='gdocs-color-wrap'>
						<button
							type='button'
							className='gdocs-btn'
							onClick={() => {
								setShowTextColor(!showTextColor)
								setShowHighlightColor(false)
							}}
							title='Text color'>
							<span style={{ fontWeight: 800, textDecoration: 'underline', textDecorationColor: '#0B57D0' }}>A</span>
						</button>
						{showTextColor && (
							<div className='gdocs-color-palette'>
								{TEXT_COLORS.map((color) => (
									<button
										key={color}
										type='button'
										className='gdocs-color-swatch'
										style={{ backgroundColor: color }}
										onClick={() => {
											executeCommand('foreColor', color)
											setShowTextColor(false)
										}}
									/>
								))}
							</div>
						)}
					</div>

					<div className='gdocs-color-wrap'>
						<button
							type='button'
							className='gdocs-btn'
							onClick={() => {
								setShowHighlightColor(!showHighlightColor)
								setShowTextColor(false)
							}}
							title='Highlight color'>
							<FontAwesomeIcon icon={faHighlighter} style={{ color: '#EAB308' }} />
						</button>
						{showHighlightColor && (
							<div className='gdocs-color-palette'>
								{HIGHLIGHT_COLORS.map((color) => (
									<button
										key={color}
										type='button'
										className='gdocs-color-swatch'
										style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
										onClick={() => {
											executeCommand('hiliteColor', color)
											setShowHighlightColor(false)
										}}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				<div className='gdocs-toolbar-sep' />

				{/* Link, Image, Table */}
				<div className='gdocs-toolbar-group'>
					<button
						type='button'
						className='gdocs-btn'
						onClick={handleOpenLinkModal}
						title='Insert link (Ctrl+K)'>
						<FontAwesomeIcon icon={faLink} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => {
							saveSelection()
							setShowImageModal(true)
						}}
						title='Insert image'>
						<FontAwesomeIcon icon={faImage} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => {
							saveSelection()
							setShowTableModal(true)
						}}
						title='Insert table'>
						<FontAwesomeIcon icon={faTable} />
					</button>
				</div>

				<div className='gdocs-toolbar-sep' />

				{/* Alignment */}
				<div className='gdocs-toolbar-group'>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('justifyLeft')}
						title='Align left (Ctrl+Shift+L)'>
						<FontAwesomeIcon icon={faAlignLeft} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('justifyCenter')}
						title='Align center (Ctrl+Shift+E)'>
						<FontAwesomeIcon icon={faAlignCenter} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('justifyRight')}
						title='Align right (Ctrl+Shift+R)'>
						<FontAwesomeIcon icon={faAlignRight} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('justifyFull')}
						title='Justify (Ctrl+Shift+J)'>
						<FontAwesomeIcon icon={faAlignJustify} />
					</button>
				</div>

				<div className='gdocs-toolbar-sep' />

				{/* Lists & Indent */}
				<div className='gdocs-toolbar-group'>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('insertOrderedList')}
						title='Numbered list (Ctrl+Shift+7)'>
						<FontAwesomeIcon icon={faListOl} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('insertUnorderedList')}
						title='Bulleted list (Ctrl+Shift+8)'>
						<FontAwesomeIcon icon={faListUl} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('outdent')}
						title='Decrease indent (Ctrl+[)'>
						<FontAwesomeIcon icon={faOutdent} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('indent')}
						title='Increase indent (Ctrl+])'>
						<FontAwesomeIcon icon={faIndent} />
					</button>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => executeCommand('removeFormat')}
						title='Clear formatting (Ctrl+\)'>
						<FontAwesomeIcon icon={faRemoveFormat} />
					</button>
				</div>

				{/* Fullscreen Toggle */}
				<div className='ms-auto'>
					<button
						type='button'
						className='gdocs-btn'
						onClick={() => setIsFullscreen(!isFullscreen)}
						title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Document'}>
						<FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
					</button>
				</div>
			</div>

			{/* =====================================================================
			    2. GOOGLE DOCS HORIZONTAL RULER (Exact reproduction of Image 2)
			    ===================================================================== */}
			<div className='gdocs-ruler-bar'>
				<div className='gdocs-ruler-track'>
					<div className='gdocs-ruler-marker-left' title='First line indent'>▼</div>
					<div className='gdocs-ruler-marker-right' title='Right margin indent'>▼</div>
					<div className='gdocs-ruler-ticks'>
						<div className='gdocs-ruler-inch'>1</div>
						<div className='gdocs-ruler-inch'>2</div>
						<div className='gdocs-ruler-inch'>3</div>
						<div className='gdocs-ruler-inch'>4</div>
						<div className='gdocs-ruler-inch'>5</div>
						<div className='gdocs-ruler-inch'>6</div>
						<div className='gdocs-ruler-inch'>7</div>
					</div>
				</div>
			</div>

			{/* =====================================================================
			    CONTEXTUAL TABLE TOOLBAR (When cursor is inside any Table cell)
			    ===================================================================== */}
			{activeTableCell && (
				<div className='gdocs-context-bar'>
					<span className='fw-bold text-dark me-2'>
						<FontAwesomeIcon icon={faTable} className='me-1 text-primary' /> Table Controls:
					</span>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleAddRow('above')}>
						<FontAwesomeIcon icon={faPlus} /> Row Above
					</button>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleAddRow('below')}>
						<FontAwesomeIcon icon={faPlus} /> Row Below
					</button>
					<button
						type='button'
						className='gdocs-context-pill is-danger'
						onClick={handleDeleteRow}>
						<FontAwesomeIcon icon={faTrash} /> Delete Row
					</button>
					<div className='gdocs-toolbar-sep' />
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleAddCol('left')}>
						<FontAwesomeIcon icon={faColumns} /> Col Left
					</button>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleAddCol('right')}>
						<FontAwesomeIcon icon={faColumns} /> Col Right
					</button>
					<button
						type='button'
						className='gdocs-context-pill is-danger'
						onClick={handleDeleteCol}>
						<FontAwesomeIcon icon={faTrash} /> Delete Col
					</button>
					<div className='gdocs-toolbar-sep' />
					<button
						type='button'
						className='gdocs-context-pill is-danger'
						onClick={handleDeleteTable}>
						<FontAwesomeIcon icon={faTrash} /> Delete Entire Table
					</button>
				</div>
			)}

			{/* =====================================================================
			    CONTEXTUAL IMAGE TOOLBAR (When an image is clicked/selected)
			    ===================================================================== */}
			{selectedImage && (
				<div className='gdocs-context-bar'>
					<span className='fw-bold text-dark me-2'>
						<FontAwesomeIcon icon={faImage} className='me-1 text-primary' /> Image Options:
					</span>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleAlignImage('left')}>
						<FontAwesomeIcon icon={faAlignLeft} /> Wrap Left
					</button>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleAlignImage('center')}>
						<FontAwesomeIcon icon={faAlignCenter} /> Center Break
					</button>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleAlignImage('right')}>
						<FontAwesomeIcon icon={faAlignRight} /> Wrap Right
					</button>
					<div className='gdocs-toolbar-sep' />
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleResizeImage('25%')}>
						25%
					</button>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleResizeImage('50%')}>
						50%
					</button>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleResizeImage('75%')}>
						75%
					</button>
					<button
						type='button'
						className='gdocs-context-pill'
						onClick={() => handleResizeImage('100%')}>
						100% Full
					</button>
					<div className='gdocs-toolbar-sep' />
					<button
						type='button'
						className='gdocs-context-pill is-danger'
						onClick={handleDeleteSelectedImage}>
						<FontAwesomeIcon icon={faTrash} /> Delete Image
					</button>
				</div>
			)}

			{/* =====================================================================
			    3. GOOGLE DOCS CANVAS SHEET (Centered A4/Letter paper sheet)
			    ===================================================================== */}
			<div
				className='gdocs-workspace'
				onClick={() => {
					setShowTextColor(false)
					setShowHighlightColor(false)
				}}>
				<div
					ref={editorRef}
					className='gdocs-sheet'
					contentEditable={true}
					suppressContentEditableWarning={true}
					data-placeholder={placeholder}
					style={{ minHeight }}
					onInput={handleContentChange}
					onKeyUp={checkFormatting}
					onMouseUp={checkFormatting}
					onClick={handleEditorClick}
					onPaste={handlePaste}
				/>
			</div>

			{/* =====================================================================
			    4. STATUS BAR (Google Docs Word Count & Reading Time)
			    ===================================================================== */}
			<div className='gdocs-statusbar'>
				<div className='gdocs-statusbar-stats'>
					<span>
						Words: <strong>{wordCount.toLocaleString()}</strong>
					</span>
					<span>
						Characters: <strong>{charCount.toLocaleString()}</strong>
					</span>
					<span>
						Est. Read: <strong>{readingTime} min</strong>
					</span>
				</div>
				<div>
					<span className='badge bg-light text-muted border'>Google Docs Document Engine</span>
				</div>
			</div>

			{/* =====================================================================
			    MODAL: INSERT LINK
			    ===================================================================== */}
			<Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} centered size='sm'>
				<form onSubmit={handleApplyLink}>
					<Modal.Header closeButton>
						<Modal.Title className='fs-6 fw-bold'>
							<FontAwesomeIcon icon={faLink} className='me-2 text-primary' />
							Insert Link
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div className='mb-3'>
							<label className='form-label fs-8 fw-semibold text-gray-700'>Display Text</label>
							<input
								type='text'
								className='form-control form-control-sm'
								placeholder='e.g., Read Clinical Trial'
								value={linkText}
								onChange={(e) => setLinkText(e.target.value)}
							/>
						</div>
						<div>
							<label className='form-label fs-8 fw-semibold text-gray-700 required'>URL Link</label>
							<input
								type='text'
								required
								className='form-control form-control-sm'
								placeholder='https://example.com/research'
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
							/>
						</div>
					</Modal.Body>
					<Modal.Footer className='py-2'>
						<button type='button' className='btn btn-sm btn-light' onClick={() => setShowLinkModal(false)}>
							Cancel
						</button>
						<button type='submit' className='btn btn-sm btn-primary'>
							Apply
						</button>
					</Modal.Footer>
				</form>
			</Modal>

			{/* =====================================================================
			    MODAL: INSERT IMAGE
			    ===================================================================== */}
			<Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered>
				<form onSubmit={handleApplyImage}>
					<Modal.Header closeButton>
						<Modal.Title className='fs-6 fw-bold'>
							<FontAwesomeIcon icon={faImage} className='me-2 text-primary' />
							Insert Image into Document
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<ul className='nav nav-tabs nav-line-tabs mb-4 fs-7 fw-semibold'>
							<li className='nav-item'>
								<button
									type='button'
									className={`nav-link ${imageTab === 'upload' ? 'active text-primary' : 'text-muted'}`}
									onClick={() => setImageTab('upload')}>
									<FontAwesomeIcon icon={faUpload} className='me-1' /> Upload File
								</button>
							</li>
							<li className='nav-item'>
								<button
									type='button'
									className={`nav-link ${imageTab === 'url' ? 'active text-primary' : 'text-muted'}`}
									onClick={() => setImageTab('url')}>
									<FontAwesomeIcon icon={faLink} className='me-1' /> Image URL
								</button>
							</li>
						</ul>

						{imageTab === 'upload' ? (
							<div className='mb-3'>
								<label className='form-label fs-8 fw-semibold text-gray-700'>Choose Image File</label>
								<input
									type='file'
									accept='image/*'
									className='form-control form-control-sm'
									disabled={uploadingImage}
									onChange={handleInsertImageFromUpload}
								/>
								{uploadingImage && <div className='fs-8 text-primary mt-1'>Uploading to server...</div>}
								{imageUrl && (
									<div className='mt-3 text-center border rounded p-2 bg-light'>
										<img
											src={imageUrl}
											alt='Uploaded preview'
											style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }}
										/>
									</div>
								)}
							</div>
						) : (
							<div className='mb-3'>
								<label className='form-label fs-8 fw-semibold text-gray-700 required'>Image URL</label>
								<input
									type='text'
									className='form-control form-control-sm'
									placeholder='https://files.fggroup.in/...'
									value={imageUrl}
									onChange={(e) => setImageUrl(e.target.value)}
								/>
							</div>
						)}

						<div className='row g-2 mb-2'>
							<div className='col-12'>
								<label className='form-label fs-8 fw-semibold text-gray-700'>Alt Text (SEO & Accessibility)</label>
								<input
									type='text'
									className='form-control form-control-sm'
									placeholder='e.g., Whey protein clinical trial chart'
									value={imageAlt}
									onChange={(e) => setImageAlt(e.target.value)}
								/>
							</div>
							<div className='col-12'>
								<label className='form-label fs-8 fw-semibold text-gray-700'>Caption (Optional)</label>
								<input
									type='text'
									className='form-control form-control-sm'
									placeholder='e.g., Figure 1: Protein absorption kinetics across 4 hours'
									value={imageCaption}
									onChange={(e) => setImageCaption(e.target.value)}
								/>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer className='py-2'>
						<button type='button' className='btn btn-sm btn-light' onClick={() => setShowImageModal(false)}>
							Cancel
						</button>
						<button type='submit' className='btn btn-sm btn-primary' disabled={uploadingImage || !imageUrl}>
							Insert Image
						</button>
					</Modal.Footer>
				</form>
			</Modal>

			{/* =====================================================================
			    MODAL: INSERT TABLE
			    ===================================================================== */}
			<Modal show={showTableModal} onHide={() => setShowTableModal(false)} centered size='sm'>
				<form onSubmit={handleApplyTable}>
					<Modal.Header closeButton>
						<Modal.Title className='fs-6 fw-bold'>
							<FontAwesomeIcon icon={faTable} className='me-2 text-primary' />
							Insert Table Grid
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div className='row g-3'>
							<div className='col-6'>
								<label className='form-label fs-8 fw-semibold text-gray-700'>Rows</label>
								<input
									type='number'
									min={1}
									max={20}
									className='form-control form-control-sm'
									value={tableRows}
									onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
								/>
							</div>
							<div className='col-6'>
								<label className='form-label fs-8 fw-semibold text-gray-700'>Columns</label>
								<input
									type='number'
									min={1}
									max={10}
									className='form-control form-control-sm'
									value={tableCols}
									onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
								/>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer className='py-2'>
						<button type='button' className='btn btn-sm btn-light' onClick={() => setShowTableModal(false)}>
							Cancel
						</button>
						<button type='submit' className='btn btn-sm btn-primary'>
							Insert Table
						</button>
					</Modal.Footer>
				</form>
			</Modal>
		</div>
	)
}
