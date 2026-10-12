import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import * as xlsx from 'xlsx'
import '../../../../../src/_metronic/assets/css/style.css'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import {
	GetAutomationBrands,
	GetAutomationContactGroups,
	GetAutomationContacts,
} from '../../../Functions/FGGroup/AutomationContacts'
import {
	createScheduleMessage,
	getWhatsAppTemplates,
	sendWhatsAppTemplateMessage,
	sendWhatsAppTemplateMessageMultiple,
} from '../../../Functions/FGGroup/WhatsApp'

// Define types for our contact data
interface Contact {
	id: string
	name: string
	phone: string
	allowBroadcast: boolean
	selected: boolean
}

// Define type for Excel contact data
interface ExcelContact {
	full_name: string
	email: string
	country_code: string
	phone_number: string
}

interface UploadedMedia {
	url: string
	filename: string
	type: 'image' | 'video' | 'document'
}

interface Brand {
	_id: string
	brand_name: string
}

interface Group {
	_id: string
	group_name: string
	brand_id: {
		_id: string
		brand_name: string
	}
}

const SendBroadcastTemplate: React.FC = () => {
	const [searchParams] = useSearchParams()
	const templateId = searchParams.get('id')

	const adminType = (localStorage.getItem('admin') || '').toUpperCase()
	const defaultSenderNumber = adminType.includes('FWG')
		? '917016009065'
		: adminType.includes('GOMZI_NUTRITION') || adminType.includes('STORE')
		? '917990969639'
		: '918758391809'
	const expectedBrandName = adminType.includes('FWG')
		? 'FWG'
		: adminType.includes('GOMZI_NUTRITION') || adminType.includes('STORE')
		? 'Gomzi Nutrition'
		: 'FGIIT'

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [contentType, setContentType] = useState('none')
	const [formData, setFormData] = useState({
		broadcast_name: '',
		broadcast_text: '',
		broadcast_header: '',
		broadcast_footer: '',
		broadcast_date: '',
		broadcast_time: '',
		broadcast_images: [] as File[],
		broadcast_video: null as File | null,
		broadcast_document: null as File | null,
		custom_url: '', // Added custom URL field
		senderNumber: defaultSenderNumber, // Default sender number
	})
	// Removed file upload states
	// const [selectedFile, setSelectedFile] = useState<File | null>(null)
	// const [uploading, setUploading] = useState(false)
	// const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [value, onChange] = useState<any>(null)

	// Add state for loading template
	const [loadingTemplate, setLoadingTemplate] = useState(false)
	const [templateData, setTemplateData] = useState<any>(null)

	interface ParameterExample {
		id: number
		value: string
		componentType: string // 'header', 'body', or 'footer'
	}

	const [userParameters, setUserParameters] = useState<ParameterExample[]>([])
	// Add state to track parameter types (custom or dynamic)
	const [parameterTypes, setParameterTypes] = useState<string[]>([])

	// Contact management states
	const [fgiitBrandId, setFgiitBrandId] = useState<string>('')
	const [brands, setBrands] = useState<Brand[]>([])
	const [groups, setGroups] = useState<Group[]>([])
	const [selectedGroupId, setSelectedGroupId] = useState<string>('')
	const [contacts, setContacts] = useState<Contact[]>([])
	const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectAll, setSelectAll] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(5)
	const [sortConfig, setSortConfig] = useState<{ key: keyof Contact; direction: string } | null>(
		null
	)
	const [showBulkSelectionNotice, setShowBulkSelectionNotice] = useState(false)
	const [loadingBrands, setLoadingBrands] = useState(false)
	const [loadingGroups, setLoadingGroups] = useState(false)
	const [loadingContacts, setLoadingContacts] = useState(false)

	// Excel upload states
	const [excelFile, setExcelFile] = useState<File | null>(null)
	const [excelContacts, setExcelContacts] = useState<ExcelContact[]>([])
	const [showExcelModal, setShowExcelModal] = useState(false)
	const [excelPreviewData, setExcelPreviewData] = useState<any[]>([])
	const [excelValidationErrors, setExcelValidationErrors] = useState<string[]>([])

	// Fetch brands and groups when component mounts
	useEffect(() => {
		const fetchBrandsAndGroups = async () => {
			try {
				setLoadingBrands(true)
				const brandsResponse: any = await GetAutomationBrands({})
				if (brandsResponse.status === 200) {
					const fetchedBrands = brandsResponse.data?.automation_brands || []
					setBrands(fetchedBrands)

					// Find and store the correct brand ID for the current panel
					const activeBrand = fetchedBrands.find(
						(brand: Brand) => brand.brand_name === expectedBrandName
					)
					if (activeBrand) {
						setFgiitBrandId(activeBrand._id)
					}
				}
			} catch (error) {
				console.error('Error fetching brands:', error)
			} finally {
				setLoadingBrands(false)
			}
		}

		fetchBrandsAndGroups()
	}, [])

	// Fetch groups when FGIIT brand ID is available
	useEffect(() => {
		if (fgiitBrandId) {
			const fetchGroups = async () => {
				try {
					setLoadingGroups(true)
					const groupsResponse: any = await GetAutomationContactGroups({ brand_id: fgiitBrandId })
					if (groupsResponse.status === 200) {
						const groupsData = groupsResponse.data || []
						setGroups(groupsData)
					}
				} catch (error) {
					console.error('Error fetching groups:', error)
				} finally {
					setLoadingGroups(false)
				}
			}

			fetchGroups()
		}
	}, [fgiitBrandId])

	// Fetch contacts when FGIIT brand ID is available
	useEffect(() => {
		if (fgiitBrandId) {
			const fetchContacts = async () => {
				try {
					setLoadingContacts(true)
					const query: any = {
						brand_id: fgiitBrandId,
						page: 1,
						limit: 1000, // Get all contacts
					}

					// Add group filter if a group is selected
					if (selectedGroupId) {
						query.group_id = selectedGroupId
					}

					const contactsResponse: any = await GetAutomationContacts(query)
					if (contactsResponse.status === 200) {
						const contactsData = contactsResponse.data || []
						// Transform the data to match our Contact interface
						// Preserve existing selection state when contacts are re-fetched
						const transformedContacts: Contact[] = contactsData.map((contact: any) => {
							// Check if this contact was previously selected
							const existingContact = contacts.find((c) => c.id === contact._id)
							return {
								id: contact._id,
								name: contact.full_name,
								phone: `${contact.country_code}${contact.phone_number}`,
								allowBroadcast: true, // Assuming all contacts can receive broadcast
								selected: existingContact ? existingContact.selected : false, // Preserve selection state
							}
						})
						setContacts(transformedContacts)
						// When contacts are re-fetched due to group change, reset to first page
						setCurrentPage(1)
					}
				} catch (error) {
					console.error('Error fetching contacts:', error)
				} finally {
					setLoadingContacts(false)
				}
			}

			fetchContacts()
		}
	}, [fgiitBrandId, selectedGroupId])

	// Initialize filtered contacts
	useEffect(() => {
		setFilteredContacts(contacts)
		// Only update pagination if the current page is no longer valid
		const totalPages = Math.ceil(contacts.length / rowsPerPage)
		if (currentPage > totalPages && totalPages > 0) {
			setCurrentPage(totalPages)
		} else if (totalPages === 0) {
			setCurrentPage(1)
		}
	}, [contacts, rowsPerPage])

	// Load template data if templateId is present
	useEffect(() => {
		const loadTemplateData = async () => {
			if (templateId) {
				setLoadingTemplate(true)
				try {
					const response: any = await getWhatsAppTemplates()
					if (response.status === 200) {
						const template = response.data?.find(
							(t: any) => t.id === templateId || t._id === templateId
						)
						if (template) {
							// Extract all parameters from all components (header, body, footer)
							let allParams: ParameterExample[] = []
							let allParamTypes: string[] = []

							// Process header component if it exists
							const headerComponent = template.components?.find(
								(comp: any) => comp.type === 'HEADER'
							)
							if (headerComponent && headerComponent.text) {
								const headerParams = headerComponent.text.match(/\{\{(\d+)\}\}/g) || []
								headerParams.forEach((param: string) => {
									const paramId = parseInt(param.replace(/[^0-9]/g, ''))
									allParams.push({ id: paramId, value: '', componentType: 'header' })
									allParamTypes.push('custom')
								})
							}

							// Process body component
							const bodyComponentFromParams = template.components?.find(
								(comp: any) => comp.type === 'BODY'
							)
							const templateTextFromParams = bodyComponentFromParams?.text || ''
							if (templateTextFromParams) {
								const bodyParams = templateTextFromParams.match(/\{\{(\d+)\}\}/g) || []
								bodyParams.forEach((param: string) => {
									const paramId = parseInt(param.replace(/[^0-9]/g, ''))
									// Only add if not already in allParams
									if (!allParams.some((p) => p.id === paramId && p.componentType === 'body')) {
										allParams.push({ id: paramId, value: '', componentType: 'body' })
										allParamTypes.push('custom')
									}
								})
							}

							// Process footer component if it exists
							const footerComponent = template.components?.find(
								(comp: any) => comp.type === 'FOOTER'
							)
							if (footerComponent && footerComponent.text) {
								const footerParams = footerComponent.text.match(/\{\{(\d+)\}\}/g) || []
								footerParams.forEach((param: string) => {
									const paramId = parseInt(param.replace(/[^0-9]/g, ''))
									// Only add if not already in allParams
									if (!allParams.some((p) => p.id === paramId && p.componentType === 'footer')) {
										allParams.push({ id: paramId, value: '', componentType: 'footer' })
										allParamTypes.push('custom')
									}
								})
							}

							// Sort parameters by ID to maintain order
							allParams.sort((a, b) => a.id - b.id)

							setUserParameters(allParams)
							setParameterTypes(allParamTypes)

							// Update form data with template information
							setFormData((prev) => ({
								...prev,
								broadcast_name: template.name || template.templateName || '',
								broadcast_text: templateTextFromParams,
								broadcast_header: headerComponent?.text || '',
								broadcast_footer: footerComponent?.text || '',
							}))

							// Store the full template data for preview
							setTemplateData(template)
						}
					}
				} catch (error) {
					console.error('Error loading template:', error)
					toast.error('Failed to load template data')
				} finally {
					setLoadingTemplate(false)
				}
			}
		}

		loadTemplateData()
	}, [templateId])

	// Function to replace placeholders in template text with user parameter values
	const processTemplateText = (
		text: string,
		parameters?: ParameterExample[],
		componentType?: string
	) => {
		if (!text) return ''

		let processedText = text
		if (parameters && Array.isArray(parameters)) {
			// Filter parameters based on componentType if provided
			const filteredParams = componentType
				? parameters.filter((param) => param.componentType === componentType)
				: parameters

			filteredParams.forEach((paramObj) => {
				// Replace {{paramObj.id}} with paramObj.value, ensuring proper escaping
				const placeholder = `{{${paramObj.id}}}`
				// Use a global regex to replace all occurrences
				const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')
				processedText = processedText.replace(regex, paramObj.value || '')
			})
		}

		return processedText
	}

	// Handle parameter change
	const handleParameterChange = (index: number, value: string) => {
		const newParameters = [...userParameters]
		if (newParameters[index]) {
			newParameters[index] = { ...newParameters[index], value: value }
			setUserParameters(newParameters)
		}
	}

	// Handle parameter type change (custom or dynamic)
	const handleParameterTypeChange = (index: number, type: string) => {
		const newParamTypes = [...parameterTypes]
		newParamTypes[index] = type
		setParameterTypes(newParamTypes)

		// If switching to dynamic and the parameter is empty, set a default value
		if (type === 'dynamic' && userParameters[index]?.value === '') {
			const newParameters = [...userParameters]
			if (newParameters[index]) {
				newParameters[index] = { ...newParameters[index], value: '{{user_name}}' } // Default dynamic parameter
				setUserParameters(newParameters)
			}
		}

		// If switching from dynamic to custom, clear the value
		if (type === 'custom' && parameterTypes[index] === 'dynamic') {
			const newParameters = [...userParameters]
			if (newParameters[index]) {
				newParameters[index] = { ...newParameters[index], value: '' } // Clear the dynamic value when switching to custom
				setUserParameters(newParameters)
			}
		}
	}

	// Get available dynamic parameters based on context
	const getDynamicParameters = () => {
		return [
			{
				value: '{{user_name}}',
				label: 'User Name',
				description: 'Contact name from selected contacts',
			},
			{ value: '{{current_date}}', label: 'Current Date', description: "Today's date" },
			{ value: '{{company_name}}', label: 'Company Name', description: 'Company name' },
			{
				value: '{{broadcast_name}}',
				label: 'Broadcast Name',
				description: 'Current broadcast name',
			},
		]
	}

	// Function to check if any required template parameters are empty
	const checkEmptyParameters = () => {
		const emptyParameters = userParameters.filter(
			(param, index) => param.value.trim() === '' && parameterTypes[index] !== 'dynamic'
		)
		return emptyParameters
	}

	// Handle search functionality
	useEffect(() => {
		const results = contacts.filter(
			(contact) =>
				contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				contact.phone.includes(searchTerm)
		)
		setFilteredContacts(results)
		// Reset to page 1 only when search term changes, not when contacts change
		if (searchTerm !== '') {
			setCurrentPage(1)
		} else {
			// Ensure current page is still valid after filtering
			const totalPages = Math.ceil(results.length / rowsPerPage)
			if (currentPage > totalPages && totalPages > 0) {
				setCurrentPage(totalPages)
			} else if (totalPages === 0) {
				setCurrentPage(1)
			}
		}
	}, [searchTerm])

	// Handle sorting
	const handleSort = (key: keyof Contact) => {
		let direction = 'ascending'
		if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
			direction = 'descending'
		}
		setSortConfig({ key, direction })

		const sortedContacts = [...filteredContacts].sort((a, b) => {
			if (a[key] < b[key]) {
				return direction === 'ascending' ? -1 : 1
			}
			if (a[key] > b[key]) {
				return direction === 'ascending' ? 1 : -1
			}
			return 0
		})

		setFilteredContacts(sortedContacts)
		// Reset to first page after sorting to ensure valid pagination state
		setCurrentPage(1)
	}

	// Handle individual row selection
	const handleRowSelect = (id: string) => {
		const updatedContacts = contacts.map((contact) =>
			contact.id === id ? { ...contact, selected: !contact.selected } : contact
		)
		setContacts(updatedContacts)

		// Update filtered contacts as well
		const updatedFilteredContacts = filteredContacts.map((contact) =>
			contact.id === id ? { ...contact, selected: !contact.selected } : contact
		)
		setFilteredContacts(updatedFilteredContacts)

		// Check if all visible contacts are selected
		const allVisibleSelected = updatedFilteredContacts.every((contact) => contact.selected)
		setSelectAll(allVisibleSelected)

		// Show bulk selection notice if needed
		const selectedCount = updatedContacts.filter((c) => c.selected).length
		if (selectedCount > 0 && selectedCount < contacts.length) {
			setShowBulkSelectionNotice(true)
		} else {
			setShowBulkSelectionNotice(false)
		}
	}

	// Handle select all for the header control (only current page)
	const handleSelectAll = () => {
		const newSelectAll = !selectAll
		setSelectAll(newSelectAll)

		// Update only the contacts visible on the current page
		const updatedContacts = contacts.map((contact) => {
			// Check if this contact is in the current filtered list
			const isInCurrentPage = filteredContacts.some((c) => c.id === contact.id)
			return {
				...contact,
				selected: isInCurrentPage ? newSelectAll : contact.selected,
			}
		})

		setContacts(updatedContacts)

		// Update filtered contacts as well
		const updatedFilteredContacts = filteredContacts.map((contact) => ({
			...contact,
			selected: newSelectAll,
		}))

		setFilteredContacts(updatedFilteredContacts)

		// Hide bulk selection notice when all are selected
		if (newSelectAll) {
			setShowBulkSelectionNotice(false)
		}
	}

	// Handle select all for the table header checkbox (only current page)
	const handleTableHeaderSelectAll = () => {
		// Calculate which contacts are on the current page
		const startIndex = (currentPage - 1) * rowsPerPage
		const endIndex = startIndex + rowsPerPage
		const currentContactsOnPage = filteredContacts.slice(startIndex, endIndex)

		// Determine if all current page contacts are selected
		const allCurrentPageSelected = currentContactsOnPage.every((contact) => contact.selected)
		const newSelectAllValue = !allCurrentPageSelected

		// Update the main contacts list
		const updatedContacts = contacts.map((contact) => {
			// Check if this contact is among the current page contacts
			const isOnCurrentPage = currentContactsOnPage.some((c) => c.id === contact.id)
			return {
				...contact,
				selected: isOnCurrentPage ? newSelectAllValue : contact.selected,
			}
		})

		setContacts(updatedContacts)

		// Update filtered contacts list
		const updatedFilteredContacts = filteredContacts.map((contact) => {
			const isOnCurrentPage = currentContactsOnPage.some((c) => c.id === contact.id)
			return {
				...contact,
				selected: isOnCurrentPage ? newSelectAllValue : contact.selected,
			}
		})

		setFilteredContacts(updatedFilteredContacts)

		// Update the selectAll state based on whether all visible contacts are selected
		const allVisibleSelected = updatedFilteredContacts.every((contact) => contact.selected)
		setSelectAll(allVisibleSelected)

		// Show bulk selection notice if needed
		const selectedCount = updatedContacts.filter((c) => c.selected).length
		if (selectedCount > 0 && selectedCount < contacts.length) {
			setShowBulkSelectionNotice(true)
		} else {
			setShowBulkSelectionNotice(false)
		}
	}

	// Handle select all contacts across pages
	const handleSelectAllContacts = () => {
		const updatedContacts = contacts.map((contact) => ({
			...contact,
			selected: true,
		}))

		setContacts(updatedContacts)
		setFilteredContacts(updatedContacts)
		setSelectAll(true)
		setShowBulkSelectionNotice(false)
	}

	// Toggle broadcast permission
	const toggleBroadcastPermission = (id: string) => {
		const updatedContacts = contacts.map((contact) =>
			contact.id === id ? { ...contact, allowBroadcast: !contact.allowBroadcast } : contact
		)
		setContacts(updatedContacts)

		// Update filtered contacts as well
		const updatedFilteredContacts = filteredContacts.map((contact) =>
			contact.id === id ? { ...contact, allowBroadcast: !contact.allowBroadcast } : contact
		)
		setFilteredContacts(updatedFilteredContacts)
	}

	// Pagination calculations
	const totalPages = Math.ceil(filteredContacts.length / rowsPerPage)
	const startIndex = (currentPage - 1) * rowsPerPage
	const endIndex = startIndex + rowsPerPage
	const currentContacts = filteredContacts.slice(startIndex, endIndex)
	const totalContacts = contacts.length
	const selectedContactsCount = contacts.filter((contact) => contact.selected).length

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	// Separate event handler for textarea
	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	// Removed file upload handler

	// Handle Excel button click - open modal with rules
	const handleExcelButtonClick = () => {
		setShowExcelModal(true)
	}

	// Handle Excel file upload for broadcast
	const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		// Validate file type
		if (
			!file.name.endsWith('.xlsx') &&
			!file.name.endsWith('.xls') &&
			!file.name.endsWith('.csv')
		) {
			toast.error('Please upload a valid Excel or CSV file')
			return
		}

		setExcelFile(file)
		toast.success('Excel file selected. Click "Preview Data" to review before sending.')
	}

	// Process Excel file preview
	const processExcelPreview = () => {
		if (!excelFile) return

		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer)
				const workbook = xlsx.read(data, { type: 'array' })
				const firstSheetName = workbook.SheetNames[0]
				const worksheet = workbook.Sheets[firstSheetName]
				const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 })

				if (jsonData.length < 2) {
					toast.error('File must contain at least one row of data')
					return
				}

				const headers = jsonData[0] as string[]
				const requiredHeaders = ['full_name', 'email', 'country_code', 'phone_number']
				const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))

				if (missingHeaders.length > 0) {
					setExcelValidationErrors([`Missing required columns: ${missingHeaders.join(', ')}`])
					return
				}

				const previewData = []
				const processedContacts: ExcelContact[] = []
				const errors: string[] = []

				// Preview up to 200 rows or all rows if less than 200
				const previewLimit = Math.min(jsonData.length, 201) // 200 data rows + 1 header
				for (let i = 1; i < previewLimit; i++) {
					const row = jsonData[i] as any[]
					if (row.length < 4) continue

					const contact: ExcelContact = {
						full_name: String(row[headers.indexOf('full_name')] || '').trim(),
						email: String(row[headers.indexOf('email')] || '').trim(),
						country_code: String(row[headers.indexOf('country_code')] || '').trim(),
						phone_number: String(row[headers.indexOf('phone_number')] || '').trim(),
					}

					// Validate required fields
					if (!contact.full_name) {
						errors.push(`Row ${i + 1}: Full name is required`)
						continue
					}

					if (!contact.phone_number) {
						errors.push(`Row ${i + 1}: Phone number is required`)
						continue
					}

					// Remove '+' from country code if present
					if (contact.country_code.startsWith('+')) {
						contact.country_code = contact.country_code.substring(1)
					}

					// Validate phone number
					const phoneRegex = /^\d+$/
					if (!phoneRegex.test(contact.phone_number)) {
						errors.push(`Row ${i + 1}: Invalid phone number format`)
						continue
					}

					// Validate email if provided
					if (contact.email) {
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
						if (!emailRegex.test(contact.email)) {
							errors.push(`Row ${i + 1}: Invalid email format`)
							continue
						}
					}

					previewData.push({
						...contact,
						full_phone: `${contact.country_code}${contact.phone_number}`,
					})
					processedContacts.push(contact)
				}

				setExcelPreviewData(previewData)
				setExcelContacts(processedContacts)
				setExcelValidationErrors(errors)

				if (processedContacts.length === 0) {
					toast.error('No valid contacts found in the file')
				} else {
					toast.success(`Successfully processed ${processedContacts.length} contacts`)
				}
			} catch (error) {
				console.error('Error reading Excel file:', error)
				toast.error('Error reading file. Please make sure it is a valid Excel or CSV file.')
			}
		}
		reader.readAsArrayBuffer(excelFile)
	}

	// Send broadcast to Excel contacts
	const sendBroadcastToExcelContacts = async () => {
		if (excelContacts.length === 0) {
			toast.error('No valid contacts to send broadcast to')
			return
		}

		// Validate template is loaded
		if (!templateData) {
			toast.error('Template data not loaded. Please select a valid template.')
			return
		}

		// Validate template name
		const actualTemplateName =
			templateData?.name || templateData?.templateName || formData.broadcast_name
		if (!actualTemplateName) {
			toast.error('Template name is required')
			return
		}

		// Validate phone numbers
		const invalidPhones = excelContacts.filter((contact) => {
			const fullPhone = `${contact.country_code}${contact.phone_number}`
			// Check if phone number is valid (10-15 digits)
			const phoneRegex = /^\d{10,15}$/
			return !phoneRegex.test(fullPhone)
		})

		if (invalidPhones.length > 0) {
			toast.error(
				`Invalid phone numbers found: ${invalidPhones.length} contacts have incorrect phone formats`
			)
			return
		}

		// Validate media template requirements
		const headerComponent = templateData?.components?.find((comp: any) => comp.type === 'HEADER')
		const hasMediaHeader =
			headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)

		if (hasMediaHeader && !templateData?.files?.length && !formData.custom_url) {
			const mediaType = headerComponent.format.toLowerCase()
			toast.error(
				`Media template requires a ${mediaType} file. Please select a template with files or provide a URL.`
			)
			return
		}

		// Validate document links specifically
		if (hasMediaHeader && headerComponent.format === 'DOCUMENT') {
			const uploadedFileUrl = formData.custom_url || templateData?.files?.[0]?.url || ''

			// If no file is available and no custom URL is provided
			if (
				!templateData?.files?.length &&
				(!formData.custom_url || formData.custom_url.trim() === '')
			) {
				toast.error('Please upload a document file or provide a valid document URL')
				setIsSubmitting(false)
				return
			}

			// If a custom URL is provided, validate it
			if (formData.custom_url && formData.custom_url.trim() !== '') {
				const trimmedUrl = formData.custom_url.trim()
				if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
					toast.error('Document URL must start with http:// or https://')
					setIsSubmitting(false)
					return
				}
			}
		}

		setIsSubmitting(true)
		try {
			let uploadedFileUrl = formData.custom_url

			// Use file from template if available
			if (templateData?.files?.length > 0) {
				uploadedFileUrl = String(templateData.files[0].url)
				toast.success('Using template file for broadcast')
			}

			// Check for empty template parameters
			const emptyParameters = checkEmptyParameters()
			if (emptyParameters.length > 0) {
				toast.error('Please fill in all required template parameters')
				setIsSubmitting(false)
				return
			}

			// Process parameters for each contact
			const allProcessedParameters: {
				headerParams: string[]
				bodyParams: string[]
			}[] = []

			for (let i = 0; i < excelContacts.length; i++) {
				const contact = excelContacts[i]
				const processedParameters = userParameters.map((param) => ({ ...param }))

				for (let j = 0; j < processedParameters.length; j++) {
					if (parameterTypes[j] === 'dynamic') {
						if (processedParameters[j].value === '{{user_name}}') {
							processedParameters[j].value = contact.full_name
						} else if (processedParameters[j].value === '{{current_date}}') {
							processedParameters[j].value = new Date().toLocaleDateString()
						} else if (processedParameters[j].value === '{{company_name}}') {
							processedParameters[j].value = 'FGIIT'
						} else if (processedParameters[j].value === '{{broadcast_name}}') {
							processedParameters[j].value = formData.broadcast_name
						}
					}
				}

				const headerParams = processedParameters
					.filter((param) => param.componentType === 'header')
					.sort((a, b) => a.id - b.id)
					.map((param) => param.value)
				const bodyParams = processedParameters
					.filter((param) => param.componentType === 'body')
					.sort((a, b) => a.id - b.id)
					.map((param) => param.value)

				allProcessedParameters.push({
					headerParams: headerParams,
					bodyParams: bodyParams,
				})
			}

			const actualTemplateName =
				templateData?.name || templateData?.templateName || formData.broadcast_name

			// Check if the template has header parameters that need to be filled
			const hasHeaderParams = templateData?.components?.some(
				(comp: any) => comp.type === 'HEADER' && comp.text?.includes('{{')
			)

			// Check if template has media (image/video/document) in header
			const headerComponent = templateData?.components?.find((comp: any) => comp.type === 'HEADER')
			const hasMediaHeader =
				headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)

			// Prepare phone numbers
			const phoneNumbers = excelContacts.map(
				(contact) => `${contact.country_code}${contact.phone_number}`
			)

			if (contentType === 'schedule') {
				// Validate that date and time are provided
				if (!formData.broadcast_date || !formData.broadcast_time) {
					toast.error('Please select date and time for scheduled broadcast')
					setIsSubmitting(false)
					return
				}

				const scheduledTime = new Date(
					`${formData.broadcast_date}T${formData.broadcast_time}:00+05:30`
				).toISOString()

				const scheduleMessageData: any = {
					templateName: actualTemplateName,
					senderNumber: formData.senderNumber,
					phoneNumbers: phoneNumbers,
					parameters: allProcessedParameters.map((params) => params.bodyParams),
					headerParams: hasHeaderParams
						? allProcessedParameters.map((params) => params.headerParams)
						: [],
					scheduledTime: scheduledTime,
				}

				if (hasMediaHeader) {
					if (uploadedFileUrl && uploadedFileUrl.trim() !== '') {
						scheduleMessageData.headerParams = [uploadedFileUrl.trim()]
					}
				}

				const response = await createScheduleMessage(scheduleMessageData)

				if (response.status === 200) {
					toast.success(
						`Broadcast scheduled successfully for ${scheduledTime} to ${excelContacts.length} contacts`
					)
				} else {
					toast.error(response.message || 'Failed to schedule broadcast')
				}
			} else {
				// Send immediately
				let response

				if (excelContacts.length === 1) {
					// Single contact
					const singleTemplateData: any = {
						templateName: actualTemplateName,
						phoneNumber: phoneNumbers[0],
						senderNumber: formData.senderNumber,
						bodyParams: allProcessedParameters[0].bodyParams,
					}

					if (hasHeaderParams) {
						singleTemplateData.headerParams = allProcessedParameters[0].headerParams
					}

					if (hasMediaHeader) {
						// For templates with files, don't send customURL - use the template's files directly
						if (templateData?.files?.length > 0) {
							// Template has files, use them directly (no customURL needed)
							const templateFileUrl = templateData.files[0].url
							// For media templates with files, we don't need to send customURL
							// The WhatsApp API will use the template's predefined media
						} else if (uploadedFileUrl && uploadedFileUrl.trim() !== '') {
							// Only send customURL if there are no template files and a URL is provided
							singleTemplateData.customURL = uploadedFileUrl.trim()
						} else {
							const exampleHeaderUrl =
								headerComponent?.example?.header_handle || headerComponent?.example?.url || ''
							singleTemplateData.customURL =
								allProcessedParameters[0].headerParams[0] || exampleHeaderUrl || ''
						}
					} else if (headerComponent && headerComponent.format === 'TEXT') {
						singleTemplateData.headerParams = allProcessedParameters[0].headerParams
					}

					response = await sendWhatsAppTemplateMessage(singleTemplateData)
				} else {
					// Multiple contacts
					const multipleTemplateData: any = {
						templateName: actualTemplateName,
						senderNumber: formData.senderNumber,
						recipients: excelContacts.map((contact, index) => {
							const recipientData: any = {
								phoneNumber: `${contact.country_code}${contact.phone_number}`,
								headerParams: hasHeaderParams ? allProcessedParameters[index].headerParams : [],
								bodyParams: allProcessedParameters[index].bodyParams,
							}

							if (hasMediaHeader) {
								// For templates with files, don't send customURL - use the template's files directly
								if (templateData?.files?.length > 0) {
									// Template has files, use them directly (no customURL needed)
									const templateFileUrl = templateData.files[0].url
									// For media templates with files, we don't need to send customURL
									// The WhatsApp API will use the template's predefined media
								} else if (uploadedFileUrl && uploadedFileUrl.trim() !== '') {
									// Only send URL in headerParams if there are no template files and a URL is provided
									recipientData.headerParams = [uploadedFileUrl.trim()]
								} else {
									const exampleHeaderUrl =
										headerComponent?.example?.header_handle || headerComponent?.example?.url || ''
									recipientData.headerParams = [
										allProcessedParameters[index].headerParams[0] || exampleHeaderUrl || '',
									]
								}
							}

							return recipientData
						}),
					}
					response = await sendWhatsAppTemplateMessageMultiple(multipleTemplateData)
				}

				if (response.status === 200) {
					const responseData = response.data || {}
					const successCount = responseData.successCount || responseData.success_count || 0
					const failedCount =
						responseData.failureCount ||
						responseData.failed_count ||
						excelContacts.length - successCount

					if (successCount > 0) {
						toast.success(`✅ Broadcast sent successfully to ${successCount} contacts`)

						// Show detailed errors for failed contacts
						if (failedCount > 0 && responseData.results) {
							const failedResults = responseData.results.filter((r: any) => !r.success)
							failedResults.slice(0, 3).forEach((result: any) => {
								if (result.error) {
									toast.error(`❌ ${result.phoneNumber}: ${result.error}`)
								}
							})
							if (failedResults.length > 3) {
								toast.error(`❌ And ${failedResults.length - 3} more errors...`)
							}
						}
					} else {
						// All failed - show detailed errors
						let errorMessage = 'Broadcast failed for all contacts.'

						if (responseData.results && responseData.results.length > 0) {
							const firstError = responseData.results.find((r: any) => r.error)
							if (firstError) {
								errorMessage = firstError.error
								toast.error(`❌ Broadcast Error: ${errorMessage}`)

								// Show additional errors if there are more
								const otherErrors = responseData.results
									.filter((r: any, i: number) => r.error && i > 0)
									.slice(0, 2)
								otherErrors.forEach((result: any) => {
									toast.error(`❌ ${result.phoneNumber}: ${result.error}`)
								})

								if (
									otherErrors.length <
									responseData.results.filter((r: any) => r.error).length - 1
								) {
									const remaining =
										responseData.results.filter((r: any) => r.error).length - otherErrors.length - 1
									toast.error(`❌ And ${remaining} more similar errors...`)
								}
							} else {
								toast.error(`❌ ${errorMessage} Please check template parameters and try again.`)
							}
						} else {
							toast.error(`❌ ${errorMessage} Please check template parameters and try again.`)
						}
					}
				} else {
					const errorMessage = response.message || response.error || 'Failed to send broadcast'
					toast.error(`❌ Broadcast Error: ${errorMessage}`)
					console.error('Broadcast API Error:', response)
				}
			}

			// Reset form
			setFormData((prevFormData) => ({
				...prevFormData,
				broadcast_name: prevFormData.broadcast_name,
				broadcast_text: prevFormData.broadcast_text,
				broadcast_header: prevFormData.broadcast_header,
				broadcast_footer: prevFormData.broadcast_footer,
				custom_url: '',
				broadcast_date: '',
				broadcast_time: '',
				broadcast_images: [],
				broadcast_video: null,
				broadcast_document: null,
				senderNumber: prevFormData.senderNumber,
			}))
			// Removed file upload cleanup
			setExcelFile(null)
			setExcelContacts([])
			setExcelPreviewData([])
			setShowExcelModal(false)
			setIsSubmitting(false)
		} catch (error: any) {
			console.error('Error sending broadcast:', error)

			// More detailed error messages based on error type
			let errorMessage = 'An error occurred while sending the broadcast'

			if (error.message) {
				errorMessage = error.message
			} else if (error.response) {
				// API response error
				const status = error.response.status
				const data = error.response.data

				switch (status) {
					case 400:
						errorMessage = 'Bad Request: Please check your template parameters and contact data'
						break
					case 401:
						errorMessage = 'Authentication failed. Please log in again.'
						break
					case 403:
						errorMessage = 'Access forbidden. You do not have permission to send broadcasts.'
						break
					case 404:
						errorMessage = 'Template not found. Please select a valid template.'
						break
					case 422:
						errorMessage = 'Unprocessable Entity: Please check phone numbers and template format'
						break
					case 500:
						errorMessage = 'Server error. Please try again later.'
						break
					default:
						errorMessage = `Server error (${status}): ${data?.message || 'Unknown error'}`
				}
			} else if (error.request) {
				// Network error
				errorMessage = 'Network error: Please check your internet connection and try again'
			}

			toast.error(`❌ ${errorMessage}`)
			setIsSubmitting(false)
		}
	}

	// Helper function to get accepted file types based on template header format
	const getFileAcceptTypes = (): string => {
		const headerComponent = templateData?.components?.find((comp: any) => comp.type === 'HEADER')

		if (!headerComponent) return 'image/*,video/*,application/*,text/*'

		switch (headerComponent.format) {
			case 'IMAGE':
				return 'image/*'
			case 'VIDEO':
				return 'video/*'
			case 'DOCUMENT':
				return 'application/*,text/*'
			default:
				return 'image/*,video/*,application/*,text/*'
		}
	}

	// Removed file upload clear function

	const handleSendBroadcast = async (event: any) => {
		event.preventDefault()
		setIsSubmitting(true)
		try {
			let uploadedFileUrl = formData.custom_url

			// Use file from template if available
			if (templateData?.files?.length > 0) {
				uploadedFileUrl = String(templateData.files[0].url)
				toast.success('Using template file for broadcast')
			}

			// Check for empty template parameters
			const emptyParameters = checkEmptyParameters()
			if (emptyParameters.length > 0) {
				toast.error('Please fill in all required template parameters')
				setIsSubmitting(false)
				return
			}

			// Get selected contacts
			const selectedContacts = contacts.filter((contact) => contact.selected)

			if (selectedContacts.length === 0) {
				toast.error('Please select at least one contact to send the broadcast')
				setIsSubmitting(false)
				return
			}

			// Validate media template requirements for regular broadcast too
			const headerComponent = templateData?.components?.find((comp: any) => comp.type === 'HEADER')
			const hasMediaHeader =
				headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)

			if (hasMediaHeader && !templateData?.files?.length && !formData.custom_url) {
				const mediaType = headerComponent.format.toLowerCase()
				toast.error(
					`Media template requires a ${mediaType} file. Please upload a ${mediaType} file or provide a URL.`
				)
				setIsSubmitting(false)
				return
			}

			// Validate document links specifically
			if (hasMediaHeader && headerComponent.format === 'DOCUMENT') {
				const uploadedFileUrl = formData.custom_url || templateData?.files?.[0]?.url || ''

				// If no file is selected and no custom URL is provided
				if (
					!templateData?.files?.length &&
					(!formData.custom_url || formData.custom_url.trim() === '')
				) {
					toast.error('Please upload a document file or provide a valid document URL')
					setIsSubmitting(false)
					return
				}

				// If a custom URL is provided, validate it
				if (formData.custom_url && formData.custom_url.trim() !== '') {
					const trimmedUrl = formData.custom_url.trim()
					if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
						toast.error('Document URL must start with http:// or https://')
						setIsSubmitting(false)
						return
					}
				}
			}

			// Check if the broadcast is scheduled
			if (contentType === 'schedule') {
				// Validate that date and time are provided
				if (!formData.broadcast_date || !formData.broadcast_time) {
					toast.error('Please select date and time for scheduled broadcast')
					setIsSubmitting(false)
					return
				}

				// Format the scheduled time in ISO format with timezone
				const scheduledTime = new Date(
					`${formData.broadcast_date}T${formData.broadcast_time}:00+05:30`
				).toISOString()

				// Process parameters for each contact
				const allProcessedParameters: {
					headerParams: string[]
					bodyParams: string[]
				}[] = []
				for (let i = 0; i < selectedContacts.length; i++) {
					const contact = selectedContacts[i]
					const processedParameters = userParameters.map((param) => ({ ...param })) // Create a copy of userParameters

					for (let j = 0; j < processedParameters.length; j++) {
						if (parameterTypes[j] === 'dynamic') {
							// Replace dynamic parameters with actual values based on contact
							if (processedParameters[j].value === '{{user_name}}') {
								processedParameters[j].value = contact.name // Use actual contact name
							} else if (processedParameters[j].value === '{{current_date}}') {
								processedParameters[j].value = new Date().toLocaleDateString()
							} else if (processedParameters[j].value === '{{company_name}}') {
								processedParameters[j].value = 'FGIIT'
							} else if (processedParameters[j].value === '{{broadcast_name}}') {
								processedParameters[j].value = formData.broadcast_name
							}
						}
					}

					// Extract just the values for the API, organized by component type
					const headerParams = processedParameters
						.filter((param) => param.componentType === 'header')
						.sort((a, b) => a.id - b.id)
						.map((param) => param.value)
					const bodyParams = processedParameters
						.filter((param) => param.componentType === 'body')
						.sort((a, b) => a.id - b.id)
						.map((param) => param.value)

					// Store parameters separately for the new payload format
					allProcessedParameters.push({
						headerParams: headerParams,
						bodyParams: bodyParams,
					})
				}

				// Prepare the payload for scheduled message with the required format
				// Check if the template has header parameters that need to be filled
				const hasHeaderParams = templateData?.components?.some(
					(comp: any) => comp.type === 'HEADER' && comp.text?.includes('{{')
				)

				// Add customURL if there's uploaded media for media templates
				const headerComponent = templateData?.components?.find(
					(comp: any) => comp.type === 'HEADER'
				)
				const hasMediaHeader =
					headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)

				const scheduleMessageData: any = {
					templateName: templateData?.name || templateData?.templateName || formData.broadcast_name,
					senderNumber: formData.senderNumber,
					phoneNumbers: selectedContacts.map((contact) => contact.phone),
					parameters: allProcessedParameters.map((params) => params.bodyParams), // 2D array for body parameters
					headerParams: hasHeaderParams
						? allProcessedParameters.map((params) => params.headerParams)
						: [], // Include headerParams if template expects them
					scheduledTime: scheduledTime,
				}

				// Add headerParams if there's uploaded media for media templates
				if (hasMediaHeader) {
					if (uploadedFileUrl && uploadedFileUrl.trim() !== '') {
						scheduleMessageData.headerParams = [uploadedFileUrl.trim()]
					}
				}

				// Call the create schedule message API
				const response = await createScheduleMessage(scheduleMessageData)

				if (response.status === 200) {
					toast.success(
						`Broadcast scheduled successfully for ${scheduledTime} to ${selectedContacts.length} contacts`
					)
				} else {
					toast.error(response.message || 'Failed to schedule broadcast')
				}
			} else {
				// Determine which API to use based on number of selected contacts
				let response

				// Get the actual template name from the template data
				const actualTemplateName =
					templateData?.name || templateData?.templateName || formData.broadcast_name

				if (selectedContacts.length === 1) {
					// Process parameters for single contact
					const processedParameters = userParameters.map((param) => ({ ...param })) // Create a copy of userParameters
					for (let i = 0; i < processedParameters.length; i++) {
						if (parameterTypes[i] === 'dynamic') {
							// Replace dynamic parameters with actual values
							if (processedParameters[i].value === '{{user_name}}') {
								processedParameters[i].value = selectedContacts[0].name // Use actual contact name
							} else if (processedParameters[i].value === '{{current_date}}') {
								processedParameters[i].value = new Date().toLocaleDateString()
							} else if (processedParameters[i].value === '{{company_name}}') {
								processedParameters[i].value = 'FGIIT'
							} else if (processedParameters[i].value === '{{broadcast_name}}') {
								processedParameters[i].value = formData.broadcast_name
							}
						}
					}

					// Extract just the values for the API, organized by component type
					const headerParams = processedParameters
						.filter((param) => param.componentType === 'header')
						.sort((a, b) => a.id - b.id)
						.map((param) => param.value)
					const bodyParams = processedParameters
						.filter((param) => param.componentType === 'body')
						.sort((a, b) => a.id - b.id)
						.map((param) => param.value)

					// Check if the template has header parameters that need to be filled
					const hasHeaderParams = templateData?.components?.some(
						(comp: any) => comp.type === 'HEADER' && comp.text?.includes('{{')
					)

					// Use single template message API with required payload format
					const singleTemplateData: any = {
						templateName: actualTemplateName, // Use the actual template name
						phoneNumber: selectedContacts[0].phone,
						senderNumber: formData.senderNumber,
						bodyParams: bodyParams,
					}
					// Include headerParams if template expects them, regardless of whether we have values
					if (hasHeaderParams) {
						singleTemplateData.headerParams = headerParams
					}

					// Check if template has media (image/video/document) in header
					const headerComponent = templateData?.components?.find(
						(comp: any) => comp.type === 'HEADER'
					)
					if (headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)) {
						// For templates with files, don't send customURL - use the template's files directly
						if (templateData?.files?.length > 0) {
							// Template has files, use them directly (no customURL needed)
							const templateFileUrl = templateData.files[0].url
							// For media templates with files, we don't need to send customURL
							// The WhatsApp API will use the template's predefined media
						} else if (uploadedFileUrl && uploadedFileUrl.trim() !== '') {
							// Only send customURL if there are no template files and a URL is provided
							singleTemplateData.customURL = uploadedFileUrl.trim()
						} else {
							// Use header param if available, otherwise check for example URL in template
							const exampleHeaderUrl =
								headerComponent.example?.header_handle || headerComponent.example?.url || ''
							singleTemplateData.customURL = headerParams[0] || exampleHeaderUrl || ''
						}
					} else if (headerComponent && headerComponent.format === 'TEXT') {
						// For text headers, include headerParams normally
						singleTemplateData.headerParams = headerParams
					}

					response = await sendWhatsAppTemplateMessage(singleTemplateData)
				} else {
					// Multiple contacts - determine if using legacy template format (shared params) or custom template format (individual params)
					// Process parameters for each contact
					const allProcessedParameters: {
						headerParams: string[]
						bodyParams: string[]
					}[] = []
					for (let i = 0; i < selectedContacts.length; i++) {
						const contact = selectedContacts[i]
						const processedParameters = userParameters.map((param) => ({ ...param }))

						for (let j = 0; j < processedParameters.length; j++) {
							if (parameterTypes[j] === 'dynamic') {
								// Replace dynamic parameters with actual values for this specific contact
								if (processedParameters[j].value === '{{user_name}}') {
									processedParameters[j].value = contact.name
								} else if (processedParameters[j].value === '{{current_date}}') {
									processedParameters[j].value = new Date().toLocaleDateString()
								} else if (processedParameters[j].value === '{{company_name}}') {
									processedParameters[j].value = 'FGIIT'
								} else if (processedParameters[j].value === '{{broadcast_name}}') {
									processedParameters[j].value = formData.broadcast_name
								}
							}
						}

						// Extract just the values for the API, organized by component type
						const headerParams = processedParameters
							.filter((param) => param.componentType === 'header')
							.sort((a, b) => a.id - b.id)
							.map((param) => param.value)
						const bodyParams = processedParameters
							.filter((param) => param.componentType === 'body')
							.sort((a, b) => a.id - b.id)
							.map((param) => param.value)

						allProcessedParameters.push({
							headerParams: headerParams,
							bodyParams: bodyParams,
						})
					}

					// Check if all contacts have the same parameters (legacy template case)
					const allSameParams = allProcessedParameters.every(
						(params) => JSON.stringify(params) === JSON.stringify(allProcessedParameters[0])
					)

					// Check if the template has header parameters that need to be filled
					const hasHeaderParams = templateData?.components?.some(
						(comp: any) => comp.type === 'HEADER' && comp.text?.includes('{{')
					)
					// Check if the template has footer parameters that need to be filled
					const hasFooterParams = templateData?.components?.some(
						(comp: any) => comp.type === 'FOOTER' && comp.text?.includes('{{')
					)

					// Check if template has media (image/video/document) in header
					const headerComponent = templateData?.components?.find(
						(comp: any) => comp.type === 'HEADER'
					)
					const hasMediaHeader =
						headerComponent && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent.format)

					if (allSameParams) {
						// Use legacy template format with shared parameters
						const multipleTemplateData: any = {
							templateName: actualTemplateName,
							senderNumber: formData.senderNumber,
							phoneNumbers: selectedContacts.map((contact) => contact.phone),
						}

						// Add parameters based on template type
						if (hasMediaHeader) {
							// For media templates, use headerParams
							// Use custom URL if provided
							if (uploadedFileUrl && uploadedFileUrl.trim() !== '') {
								multipleTemplateData.headerParams = [uploadedFileUrl.trim()]
							} else {
								// Use header param if available, otherwise check for example URL in template
								const exampleHeaderUrl =
									headerComponent?.example?.header_handle || headerComponent?.example?.url || ''
								multipleTemplateData.headerParams = [
									allProcessedParameters[0].headerParams[0] || exampleHeaderUrl || '',
								]
							}
							multipleTemplateData.parameters = allProcessedParameters[0].bodyParams
						} else {
							// For text templates, use headerParams and bodyParams
							if (hasHeaderParams) {
								multipleTemplateData.headerParams = allProcessedParameters[0].headerParams
							}
							multipleTemplateData.bodyParams = allProcessedParameters[0].bodyParams
						}

						response = await sendWhatsAppTemplateMessageMultiple(multipleTemplateData)
					} else {
						// Use custom template format with individual parameters
						const multipleTemplateData: any = {
							templateName: actualTemplateName,
							senderNumber: formData.senderNumber,
							recipients: selectedContacts.map((contact, index) => {
								const recipientData: any = {
									phoneNumber: contact.phone,
									headerParams: hasHeaderParams ? allProcessedParameters[index].headerParams : [],
									bodyParams: allProcessedParameters[index].bodyParams,
								}

								// Add headerParams for media templates
								if (hasMediaHeader) {
									if (uploadedFileUrl && uploadedFileUrl.trim() !== '') {
										recipientData.headerParams = [uploadedFileUrl.trim()]
									} else {
										// Use header param if available, otherwise check for example URL in template
										const exampleHeaderUrl =
											headerComponent?.example?.header_handle || headerComponent?.example?.url || ''
										recipientData.headerParams = [
											allProcessedParameters[index].headerParams[0] || exampleHeaderUrl || '',
										]
									}
								}

								return recipientData
							}),
						}
						response = await sendWhatsAppTemplateMessageMultiple(multipleTemplateData)
					}
				}

				if (response.status === 200) {
					const responseData = response.data || {}
					const successCount =
						responseData.successCount || responseData.success_count || selectedContacts.length
					const failedCount = responseData.failureCount || responseData.failed_count || 0

					if (successCount > 0) {
						toast.success(`Broadcast sent successfully to ${successCount} contacts`)

						// Show detailed errors for failed contacts
						if (failedCount > 0 && responseData.results) {
							const failedResults = responseData.results.filter((r: any) => !r.success)
							failedResults.slice(0, 3).forEach((result: any) => {
								if (result.error) {
									toast.error(`❌ ${result.phoneNumber}: ${result.error}`)
								}
							})
							if (failedResults.length > 3) {
								toast.error(`❌ And ${failedResults.length - 3} more errors...`)
							}
						}
					} else {
						// All failed - show detailed errors
						let errorMessage = 'Broadcast failed for all contacts.'

						if (responseData.results && responseData.results.length > 0) {
							const firstError = responseData.results.find((r: any) => r.error)
							if (firstError) {
								errorMessage = firstError.error
								toast.error(`❌ Broadcast Error: ${errorMessage}`)

								// Show additional errors if there are more
								const otherErrors = responseData.results
									.filter((r: any, i: number) => r.error && i > 0)
									.slice(0, 2)
								otherErrors.forEach((result: any) => {
									toast.error(`❌ ${result.phoneNumber}: ${result.error}`)
								})

								if (
									otherErrors.length <
									responseData.results.filter((r: any) => r.error).length - 1
								) {
									const remaining =
										responseData.results.filter((r: any) => r.error).length - otherErrors.length - 1
									toast.error(`❌ And ${remaining} more similar errors...`)
								}
							} else {
								toast.error(`❌ ${errorMessage} Please check template parameters and try again.`)
							}
						} else {
							toast.error(`❌ ${errorMessage} Please check template parameters and try again.`)
						}
					}
				} else {
					const errorMessage = response.message || response.error || 'Failed to send broadcast'
					toast.error(`❌ Broadcast Error: ${errorMessage}`)
					console.error('Broadcast API Error:', response)
				}
			}

			// Reset form but preserve template-related information
			setFormData((prevFormData) => ({
				broadcast_name: prevFormData.broadcast_name, // Keep template name
				broadcast_text: prevFormData.broadcast_text, // Keep template text
				broadcast_header: prevFormData.broadcast_header, // Keep header text
				broadcast_footer: prevFormData.broadcast_footer, // Keep footer text
				custom_url: '', // Clear custom URL
				broadcast_date: '', // Clear scheduled date/time
				broadcast_time: '',
				broadcast_images: [], // Clear media files
				broadcast_video: null,
				broadcast_document: null,
				senderNumber: prevFormData.senderNumber,
			}))
			// Removed file upload cleanup
			// Deselect all contacts after successful broadcast
			const deselectedContacts = contacts.map((contact) => ({
				...contact,
				selected: false,
			}))
			setContacts(deselectedContacts)
			setFilteredContacts(deselectedContacts)
			setSelectAll(false)
			setShowBulkSelectionNotice(false)
			setIsSubmitting(false)
		} catch (error: any) {
			console.error('Error sending broadcast:', error)

			// More detailed error messages based on error type
			let errorMessage = 'An error occurred while sending the broadcast'

			if (error.message) {
				errorMessage = error.message
			} else if (error.response) {
				// API response error
				const status = error.response.status
				const data = error.response.data

				switch (status) {
					case 400:
						errorMessage = 'Bad Request: Please check your template parameters and contact data'
						break
					case 401:
						errorMessage = 'Authentication failed. Please log in again.'
						break
					case 403:
						errorMessage = 'Access forbidden. You do not have permission to send broadcasts.'
						break
					case 404:
						errorMessage = 'Template not found. Please select a valid template.'
						break
					case 422:
						errorMessage = 'Unprocessable Entity: Please check phone numbers and template format'
						break
					case 500:
						errorMessage = 'Server error. Please try again later.'
						break
					default:
						errorMessage = `Server error (${status}): ${data?.message || 'Unknown error'}`
				}
			} else if (error.request) {
				// Network error
				errorMessage = 'Network error: Please check your internet connection and try again'
			}

			toast.error(`❌ ${errorMessage}`)
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<style>{`
				.form-check-input:checked {
					background-color: #28a745;
					border-color: #28a745;
				}
				.form-check-input:checked:focus {
					border-color: #28a745;
					box-shadow: 0 0 0 0.25rem rgba(40, 167, 69, 0.25);
				}
        
				/* Contact Management Styles */
				.contact-management-container {
				background-color: var(--bs-card-bg);
				border-radius: 0.475rem;
				box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.05);
				transition: all 0.3s ease;
				}
				
				.contact-header {
				padding: 1.5rem 1.5rem 1rem;
				border-bottom: 1px solid var(--bs-border-color);
				}
				
				.search-filter-bar {
					display: flex;
					gap: 1rem;
					align-items: center;
					margin-bottom: 1rem;
					flex-wrap: wrap;
				}
				
				.search-input-container {
					position: relative;
					flex: 1;
					min-width: 250px;
					max-width: 450px;
				}
				
				.search-icon-pos {
					position: absolute;
					left: 1.25rem;
					top: 50%;
					transform: translateY(-50%);
					z-index: 10;
					pointer-events: none;
				}
				
				.filter-button, .add-filter-button {
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 0.475rem;
				padding: 0.5rem 0.75rem;
				cursor: pointer;
				transition: all 0.2s ease;
				}
				
				.filter-button {
				background-color: var(--bs-light);
				border: 1px solid var(--bs-border-color);
				}
				
				.add-filter-button {
				border: 1px dashed var(--bs-border-color);
				color: var(--bs-primary);
				background: transparent;
				}
				
				.info-bar {
				display: flex;
				justify-content: space-between;
				padding: 0.75rem 1.5rem;
				font-size: 0.9rem;
				color: var(--bs-gray-600);
				background-color: var(--bs-light);
				border-top: 1px solid var(--bs-border-color);
				border-bottom: 1px solid var(--bs-border-color);
				}
				
				.contact-table-container {
				overflow-x: auto;
				}
				
				.contact-table {
				width: 100%;
				border-collapse: separate;
				border-spacing: 0;
				}
				
				.contact-table th {
				padding: 1rem 1.25rem;
				text-align: left;
				font-weight: 600;
				color: var(--bs-gray-800);
				background-color: var(--bs-light);
				border-bottom: 1px solid var(--bs-border-color);
				cursor: pointer;
				user-select: none;
				transition: background-color 0.2s ease;
				}
				
				.contact-table th:hover {
				background-color: var(--bs-gray-100);
				}
				
				.contact-table th:first-child {
				border-top-left-radius: 0.475rem;
				}
				
				.contact-table th:last-child {
				border-top-right-radius: 0.475rem;
				}
				
				.contact-table td {
				padding: 1rem 1.25rem;
				border-bottom: 1px solid var(--bs-border-color);
				}
				
				.contact-table tr:last-child td {
				border-bottom: none;
				}
				
				.contact-table tr:hover {
				background-color: var(--bs-gray-100);
				}
				
				.contact-table tr.selected {
				background-color: rgba(var(--bs-primary-rgb), 0.1);
				}
				
				.checkbox-cell {
				width: 1%;
				white-space: nowrap;
				}
				
				.broadcast-toggle {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 2rem;
				height: 2rem;
				border-radius: 0.475rem;
				cursor: pointer;
				transition: all 0.2s ease;
				}
				
				.broadcast-toggle.true {
				background-color: rgba(var(--bs-success-rgb), 0.1);
				color: var(--bs-success);
				}
				
				.broadcast-toggle.false {
				background-color: rgba(var(--bs-danger-rgb), 0.1);
				color: var(--bs-danger);
				}
				
				.bulk-selection-notice {
				padding: 1rem 1.5rem;
				background-color: var(--bs-warning-light);
				border-top: 1px solid var(--bs-border-color);
				border-bottom: 1px solid var(--bs-border-color);
				}
				
				.bulk-selection-notice a {
				color: var(--bs-primary);
				text-decoration: underline;
				cursor: pointer;
				font-weight: 500;
				}
				
				.pagination-container {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 1rem 1.5rem;
				}
				
				.rows-per-page-selector {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				}
				
				.pagination-controls {
				display: flex;
				gap: 0.5rem;
				}
				
				.pagination-button {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 2.25rem;
				height: 2.25rem;
				border-radius: 0.475rem;
				border: 1px solid var(--bs-border-color);
				background-color: var(--bs-white);
				cursor: pointer;
				transition: all 0.2s ease;
				}
				
				.pagination-button:not(.disabled):hover {
				background-color: var(--bs-light);
				}
				
				.pagination-button.disabled {
				opacity: 0.6;
				cursor: not-allowed;
				}
				
				.pagination-info {
				font-size: 0.9rem;
				color: var(--bs-gray-600);
				}
				
				/* WhatsApp Preview Styles */
				.phone {
				width: 360px;
				height: 700px;
				background: #f0f2f5;
				border-radius: 20px;
				margin: 0 auto;
				overflow: hidden;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
				display: flex;
				flex-direction: column;
				position: relative;
				}
				
				.status-bar {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 10px 16px 0;
				color: #000;
				font-size: 14px;
				background: #f0f2f5;
				}
				
				.status-icons {
				display: flex;
				gap: 8px;
				}
				
				.chat-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 16px 16px;
				background: #fff;
				border-bottom: 1px solid #e9edef;
				}
				
				.chat-info {
				display: flex;
				align-items: center;
				gap: 12px;
				}
				
				.chat-avatar {
				width: 40px;
				height: 40px;
				border-radius: 50%;
				background: #00a884;
				display: flex;
				align-items: center;
				justify-content: center;
				}
				
				.avatar-initial {
				color: white;
				font-weight: bold;
				font-size: 16px;
				}
				
				.chat-details {
				display: flex;
				flex-direction: column;
				}
				
				.chat-name {
				font-weight: 600;
				color: #000;
				}
				
				.chat-status {
				font-size: 12px;
				color: #667781;
				}
				
				.chat-actions {
				display: flex;
				gap: 20px;
				color: #54656f;
				}
				
				.message-area {
				flex: 1;
				padding: 12px;
				overflow-y: auto;
				background: #e9edef;
				background-image: url("/media/patterns/meassge_back.png");
				background-repeat: repeat;
				background-size: cover;
				}
				
				.message-container {
				display: flex;
				flex-direction: column;
				}
				
				.message-bubble {
				background: #ffffff;
				border-radius: 7.5px;
				margin: 8px 0;
				max-width: 75%;
				align-self: flex-start;
				box-shadow: 0 1px 1px rgb(0 0 0 / 7%);
				}
				
				
				.message-bubble-header{
					padding: 2px;
				}
				.header-image img{
					border-radius: 7.5px 7.5px 0px 0px;
				}

				.message-bubble-content{
					padding: 4px 10px;
				}

				.message-text {
				color: #000;
				font-size: 12.5px;
				line-height: 1.4;
				margin-bottom: 5px;
				}
				
				.message-footer {
				color: #667781;
				font-size: 12px;
				padding-top: 8px;
				}
				
				.message-buttons {
					margin-top: 10px;
				}
				.message-buttons .btn:last-child {
					margin-bottom: 0;
				}

				.message-buttons button {
					border: none;
					border-top: 1px solid #e9edef;
					color: #00a884;
					padding: 8px 12px;
					font-size: 14px;
					width: 100%;
					margin-bottom: 5px;
					background: none;
				}
				
				.input-area {
				display: flex;
				align-items: center;
				padding: 12px 16px;
				background: #f0f2f5;
				border-top: 1px solid #e9edef;
				}
				
				.input-actions {
				display: flex;
				align-items: center;
				gap: 16px;
				color: #54656f;
				}
				
				.input-field {
				flex: 1;
				background: #ffffff;
				border-radius: 20px;
				padding: 8px 16px;
				margin: 0 12px;
				color: #667781;
				font-size: 15px;
				}
				
				.input-send {
				color: #00a884;
				}
				
				.header-text {
				font-weight: bold;
				font-size: 16px;
				color: #000;
				line-height: 1.4;
				}
				
				.header-image, .header-video, .header-document {
				width: 100%;
				height: 100%;
				display: flex;
				background: #d9dbd5;
				align-items: center;
				justify-content: center;
				border-radius: 3.25px 3.25px 0px 0px;
				}

				.filter-buttons {
					display: flex;
					gap: 0.75rem;
				}
				
				/* Responsive styles */
				@media (max-width: 768px) {
				.search-filter-bar {
					flex-direction: column;
					align-items: stretch;
				}
				
				.search-input {
					margin-bottom: 0.75rem;
				}
				
				.filter-buttons {
					display: flex;
					gap: 0.75rem;
				}
				
				.pagination-container {
					flex-direction: column;
					gap: 1rem;
					align-items: stretch;
				}
				
				.rows-per-page-selector, .pagination-info {
					justify-content: center;
				}
				
				.phone {
					width: 100%;
					height: 500px;
					border-radius: 15px;
				}
				}
			`}</style>
			<PageTitle breadcrumbs={[]}>Send Broadcast</PageTitle>

			<div className='row'>
				<div className='col-md-8 mt-3'>
					<div className='card'>
						<div className='card-body'>
							{loadingTemplate && (
								<div className='d-flex justify-content-center align-items-center p-5'>
									<div
										className='spinner-border text-primary'
										role='status'>
										<span className='visually-hidden'>Loading...</span>
									</div>
									<span className='ms-3'>Loading template data...</span>
								</div>
							)}
							{!loadingTemplate && (
								<div className='row'>
									<InputField
										className='col-md-12 fv-row'
										label='Broadcast name'
										placeholder='Enter broadcast name'
										type='text'
										name='broadcast_name'
										htmlFor='broadcast_name'
										value={formData.broadcast_name}
										onChange={handleInputChange}
									/>
									<InputField
										className='col-md-12 fv-row'
										label='Sender Number'
										placeholder='Enter sender number'
										type='text'
										name='senderNumber'
										htmlFor='senderNumber'
										value={formData.senderNumber}
										onChange={handleInputChange}
									/>
									<div className='col-md-12 fv-row mb-7'>
										<label
											className='form-label fw-bold'
											htmlFor='broadcast_message'>
											Message
										</label>

										<textarea
											className='form-control textareafield-bg'
											id='broadcast_message'
											value={[
												formData.broadcast_header,
												formData.broadcast_text,
												formData.broadcast_footer,
											]
												.filter(Boolean) // blank / null / undefined hatai dese
												.join('\n\n')} // sirf available fields vachche space
											placeholder='Enter message'
											readOnly
											rows={4}
										/>
									</div>

									{/* Parameter input fields */}
									{templateData && userParameters.length > 0 && (
										<div className='col-12'>
											<h4 className='fw-bold mb-8'>Template Parameters</h4>
											<div className='row'>
												{userParameters.map((param, index) => (
													<div
														className='col-md-6 fv-row mb-4'
														key={index}>
														<label className='form-label fw-bold mb-4'>
															Parameter {index + 1} ({param.componentType})
														</label>
														<div className='d-flex align-items-center mb-2'>
															<div className='form-check me-3'>
																<input
																	className='form-check-input'
																	type='radio'
																	name={`param-type-${index}`}
																	id={`param-type-custom-${index}`}
																	value='custom'
																	checked={parameterTypes[index] !== 'dynamic'}
																	onChange={() => handleParameterTypeChange(index, 'custom')}
																/>
																<label
																	className='form-check-label'
																	htmlFor={`param-type-custom-${index}`}>
																	Custom
																</label>
															</div>
															<div className='form-check'>
																<input
																	className='form-check-input'
																	type='radio'
																	name={`param-type-${index}`}
																	id={`param-type-dynamic-${index}`}
																	value='dynamic'
																	checked={parameterTypes[index] === 'dynamic'}
																	onChange={() => handleParameterTypeChange(index, 'dynamic')}
																/>
																<label
																	className='form-check-label'
																	htmlFor={`param-type-dynamic-${index}`}>
																	Dynamic
																</label>
															</div>
														</div>
														{parameterTypes[index] === 'custom' ? (
															<input
																type='text'
																id={`param-${index}`}
																className='form-control'
																placeholder={`Enter value for parameter ${index + 1}`}
																value={param.value}
																onChange={(e) => handleParameterChange(index, e.target.value)}
															/>
														) : (
															<select
																className='form-select'
																value={param.value}
																onChange={(e) => handleParameterChange(index, e.target.value)}>
																<option value=''>Select dynamic value</option>
																{getDynamicParameters().map((dynamicParam, idx) => (
																	<option
																		key={idx}
																		value={dynamicParam.value}>
																		{dynamicParam.label} - {dynamicParam.description}
																	</option>
																))}
															</select>
														)}
													</div>
												))}
											</div>
										</div>
									)}

									{/* Custom URL input field - Show only if template has media header with examples */}
									{templateData?.components?.some(
										(comp: any) =>
											comp.type === 'HEADER' &&
											['IMAGE', 'VIDEO', 'DOCUMENT'].includes(comp.format) &&
											(comp.example?.header_url || comp.example?.header_handle || comp.example?.url)
									) && (
										<div className='col-md-12 fv-row mb-7'>
											<label className='form-label fw-bold'>Upload Media</label>

											{/* File upload section */}
											<div className='mb-3'>
												<div className='d-flex align-items-center gap-3'>
													{/* File upload removed - using template files */}
													<div className='alert alert-info py-2'>
														<i className='fas fa-info-circle me-2'></i>
														Using template files for media content
													</div>
												</div>
												{/* File preview section removed - using template files instead */}
												{templateData?.files?.length > 0 && (
													<div className='mt-2'>
														<div className='alert alert-info py-2 px-3 mb-2'>
															<div className='d-flex justify-content-between align-items-center'>
																<div>
																	<strong>Template file:</strong> {templateData.files[0].name}
																	<small className='d-block text-muted'>
																		URL: {templateData.files[0].url}
																	</small>
																</div>
															</div>
														</div>
														<div className='d-flex justify-content-center'>
															{templateData.files[0].format === 'IMAGE' && (
																<img
																	src={templateData.files[0].url}
																	alt='Template preview'
																	style={{
																		maxWidth: '200px',
																		maxHeight: '200px',
																		width: '100%',
																		height: 'auto',
																	}}
																	className='img-thumbnail rounded'
																/>
															)}
															{(templateData.files[0].format === 'VIDEO' ||
																templateData.files[0].format === 'DOCUMENT') && (
																<div
																	className='d-flex flex-column align-items-center p-3 border rounded'
																	style={{ minWidth: '200px', minHeight: '150px' }}>
																	<i className='fas fa-file fa-3x text-primary mb-2 p-0'></i>
																	<span className='text-center'>{templateData.files[0].name}</span>
																	<small className='text-muted'>
																		{templateData.files[0].format} file
																	</small>
																</div>
															)}
														</div>
													</div>
												)}
											</div>

											<small className='text-muted'>
												Select a media file to replace the template's default header. The file will
												be uploaded when sending the broadcast.
											</small>
										</div>
									)}

									<div
										className='col-12 pt-5'
										style={{
											borderBottom: '1px solid gray',
										}}></div>

									{/* Contact Management Section */}
									<div className='col-md-12 mt-7'>
										<h4>Broadcast Contacts</h4>

										{/* Contact Management Container */}
										<div className='contact-management-container'>
											<div className='contact-header'>
												<div className='search-filter-bar'>
													<div className='search-input-container'>
														<i className='fas fa-search search-icon-pos text-gray-500 fs-4'></i>
														<input
															type='text'
															className='form-control form-control-solid ps-13'
															style={{ height: '42px' }}
															placeholder='Search...'
															value={searchTerm}
															onChange={(e) => setSearchTerm(e.target.value)}
														/>
													</div>

													<div className='filter-buttons'>
														<div className='group-selector'>
															{loadingGroups ? (
																<select
																	className='form-select form-select-solid'
																	style={{ height: '42px' }}
																	disabled>
																	<option>Loading groups...</option>
																</select>
															) : (
																<select
																	className='form-select form-select-solid'
																	style={{ height: '42px', minWidth: '150px' }}
																	value={selectedGroupId}
																	onChange={(e) => setSelectedGroupId(e.target.value)}
																	disabled={groups.length === 0}>
																	<option value=''>All Groups</option>
																	{groups.map((group) => (
																		<option
																			key={group._id}
																			value={group._id}>
																			{group.group_name}
																		</option>
																	))}
																</select>
															)}
														</div>

														<div className='rows-per-page-selector'>
															<select
																className='form-select form-select-solid'
																style={{ height: '42px', width: '80px' }}
																value={rowsPerPage}
																onChange={(e) => {
																	setRowsPerPage(Number(e.target.value))
																	setCurrentPage(1)
																}}>
																<option value={5}>5</option>
																<option value={10}>10</option>
																<option value={25}>25</option>
																<option value={50}>50</option>
															</select>
														</div>
													</div>
												</div>
											</div>
											<div className='contact-header'>
												<div className='d-flex justify-content-between align-items-center mb-3'>
													<div>
														Total Contacts: {contacts.length} | Selected:{' '}
														{contacts.filter((c) => c.selected).length}
													</div>
													<div>
														{loadingContacts ? (
															<div className='d-flex justify-content-center align-items-center'>
																<div
																	className='spinner-border spinner-border-sm text-primary'
																	role='status'>
																	<span className='visually-hidden'>Loading...</span>
																</div>
																<span className='ms-2'>Loading...</span>
															</div>
														) : (
															<>
																<div className='d-flex align-items-center gap-3'>
																	<input
																		type='checkbox'
																		checked={selectAll}
																		onChange={handleSelectAll}
																		title='Select/Deselect all visible contacts on current page'
																		className='pt-2'
																	/>
																	<label className='mb-0'>Select All</label>

																	{/* Excel Upload Button */}
																	<div
																		className='btn-group'
																		role='group'>
																		<button
																			type='button'
																			className='btn btn-sm btn-outline-primary'
																			onClick={handleExcelButtonClick}
																			onMouseEnter={(e) => {
																				const icon = e.currentTarget.children[0] as HTMLElement
																				e.currentTarget.style.color = '#fff'
																				icon.style.color = '#fff'
																			}}
																			onMouseLeave={(e) => {
																				const icon = e.currentTarget.children[0] as HTMLElement
																				e.currentTarget.style.color = ''
																				icon.style.color = ''
																			}}>
																			<i className='fas fa-file-excel me-1 mb-1'></i>
																			Upload Excel
																		</button>
																	</div>
																</div>
															</>
														)}
													</div>
												</div>
												{loadingContacts ? (
													<div className='d-flex justify-content-center align-items-center p-5'>
														<div
															className='spinner-border text-primary'
															role='status'>
															<span className='visually-hidden'>Loading...</span>
														</div>
														<span className='ms-3'>Loading contacts...</span>
													</div>
												) : (
													<table className='contact-table'>
														<thead>
															<tr>
																<th>No.</th>
																<th className='checkbox-cell'>
																	<input
																		type='checkbox'
																		checked={
																			currentContacts.every((contact) => contact.selected) &&
																			currentContacts.length > 0
																		}
																		onChange={handleTableHeaderSelectAll}
																		title='Select/Deselect all contacts on current page'
																	/>
																</th>
																<th onClick={() => handleSort('name')}>
																	Name{' '}
																	{sortConfig?.key === 'name' && (
																		<i
																			className={`fas fa-sort-${
																				sortConfig.direction === 'ascending' ? 'up' : 'down'
																			} ms-1`}></i>
																	)}
																</th>
																<th>Phone</th>
															</tr>
														</thead>
														<tbody>
															{currentContacts.map((contact, index) => (
																<tr
																	key={contact.id}
																	className={contact.selected ? 'selected' : ''}>
																	<td className='index-cell'>{startIndex + index + 1}</td>
																	<td className='checkbox-cell'>
																		<input
																			type='checkbox'
																			checked={contact.selected}
																			onChange={() => handleRowSelect(contact.id)}
																		/>
																	</td>
																	<td>{contact.name}</td>
																	<td>{contact.phone}</td>
																</tr>
															))}
														</tbody>
													</table>
												)}
											</div>

											{/* Pagination */}
											<div className='pagination-container'>
												<div className='rows-per-page-selector'></div>

												<div className='pagination-info'>
													Showing {startIndex + 1}-{Math.min(endIndex, filteredContacts.length)} of{' '}
													{filteredContacts.length} contacts
												</div>

												<div className='pagination-controls'>
													<button
														className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
														onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
														disabled={currentPage === 1}>
														<i className='fas fa-chevron-left'></i>
													</button>

													{[...Array(totalPages)].map((_, index) => {
														const pageNumber = index + 1
														// Only show first, last, current, and nearby pages
														if (
															pageNumber === 1 ||
															pageNumber === totalPages ||
															(pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
														) {
															return (
																<button
																	key={pageNumber}
																	className={`pagination-button ${
																		currentPage === pageNumber ? 'active' : ''
																	}`}
																	onClick={() => setCurrentPage(pageNumber)}
																	style={{
																		backgroundColor:
																			currentPage === pageNumber ? 'var(--bs-primary)' : '',
																		color: currentPage === pageNumber ? 'white' : '',
																	}}>
																	{pageNumber}
																</button>
															)
														}

														// Show ellipsis for skipped pages
														if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
															return (
																<span
																	key={pageNumber}
																	className='pagination-button disabled'>
																	...
																</span>
															)
														}

														return null
													})}

													<button
														className={`pagination-button ${
															currentPage === totalPages ? 'disabled' : ''
														}`}
														onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
														disabled={currentPage === totalPages}>
														<i className='fas fa-chevron-right'></i>
													</button>
												</div>
											</div>
										</div>
									</div>
									<div
										className='col-12 pt-5'
										style={{
											borderBottom: '1px solid gray',
										}}></div>

									{/* Contact Management Section */}
									<div className='mb-7 pt-5 col-md-12'>
										<h4 className='mb-4'>When do you want to send it?</h4>
										<div className='d-flex gap-10 flex-wrap'>
											<div className='form-check'>
												<input
													className='form-check-input'
													type='radio'
													id='contentNone'
													name='contentType'
													value='none'
													checked={contentType === 'none'}
													onChange={(e) => setContentType(e.target.value)}
												/>
												<label
													className='form-check-label'
													htmlFor='contentNone'>
													Send now
												</label>
											</div>
											<div className='form-check'>
												<input
													className='form-check-input'
													type='radio'
													id='scheduleBroadcast'
													name='contentType'
													value='schedule'
													checked={contentType === 'schedule'}
													onChange={(e) => setContentType(e.target.value)}
												/>
												<label
													className='form-check-label'
													htmlFor='scheduleBroadcast'>
													Schedule for a specific time
												</label>
											</div>
										</div>
									</div>
									{contentType === 'schedule' && (
										<div className='col-md-12 fv-row mb-4'>
											<div
												style={{
													padding: '20px',
													borderRadius: '8px',
													border: '2px solid #28a745',
													animation: 'fadeIn 0.3s ease',
												}}>
												<div className='row'>
													<InputField
														className='col-md-6 fv-row mt-4'
														label='Date'
														placeholder='Enter Date'
														type='date'
														name='broadcast_date'
														htmlFor='broadcast_date'
														value={formData.broadcast_date || ''}
														onChange={(e) =>
															setFormData({ ...formData, broadcast_date: e.target.value })
														}
													/>
													<InputField
														className='col-md-6 fv-row mt-4'
														label='Time'
														placeholder='Enter Time'
														type='time'
														name='broadcast_time'
														htmlFor='broadcast_time'
														value={formData.broadcast_time || ''}
														onChange={(e) =>
															setFormData({ ...formData, broadcast_time: e.target.value })
														}
													/>
												</div>
											</div>
										</div>
									)}
									<div className='col-md-12 fv-row mb-7'>
										<TableButton
											action='send'
											onClick={handleSendBroadcast}
											text={isSubmitting ? 'Please wait, sending broadcast...' : 'Send Broadcast'}
											showIcon={true}
											disabled={isSubmitting}
											className={`btn-block btn btn-success mb-4 w-100 ${
												isSubmitting ? 'disabled' : ''
											}`}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				<div className='col-md-4 mt-3'>
					<div
						className='center-screen'
						style={{ position: 'sticky', top: '90px' }}>
						<div className='phone'>
							<div className='chat-header'>
								<div className='chat-info'>
									<div className='chat-avatar'>
										<span className='avatar-initial'>FG</span>
									</div>
									<div className='chat-details'>
										<div className='chat-name'>FGIIT</div>
										<div className='chat-status'>online</div>
									</div>
								</div>
								<div className='chat-actions'>
									<i className='fa-solid fa-video'></i>
									<i className='fa-solid fa-phone'></i>
									<i className='fa-solid fa-ellipsis-vertical'></i>
								</div>
							</div>
							<div className='message-area'>
								<div className='message-container'>
									{/* Message bubble */}
									<div className='message-bubble'>
										{/* Header section if exists */}
										{templateData?.components?.find((comp: any) => comp.type === 'HEADER') ? (
											<div className='message-bubble-header'>
												<div className='message-header'>
													{templateData.components.find((comp: any) => comp.type === 'HEADER')
														.format === 'IMAGE' && (
														<div className='header-image'>
															{templateData?.files?.[0]?.format === 'IMAGE' ? (
																<img
																	src={templateData.files[0].url}
																	alt='Template preview'
																	style={{ width: '100%', height: '100%', objectFit: 'cover' }}
																/>
															) : (
																<i
																	className='fa-solid fa-image'
																	style={{ fontSize: '48px', color: '#ccc' }}></i>
															)}
														</div>
													)}
													{templateData.components.find((comp: any) => comp.type === 'HEADER')
														.format === 'VIDEO' && (
														<div className='header-video'>
															{templateData?.files?.[0]?.format === 'VIDEO' ? (
																<video
																	src={templateData.files[0].url}
																	autoPlay
																	style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
																	Your browser does not support the video tag.
																</video>
															) : (
																<i
																	className='fa-solid fa-video'
																	style={{ fontSize: '48px', color: '#ccc' }}></i>
															)}
														</div>
													)}
													{templateData.components.find((comp: any) => comp.type === 'HEADER')
														.format === 'DOCUMENT' && (
														<div className='header-document'>
															{templateData?.files?.[0]?.format === 'DOCUMENT' ? (
																<div style={{ textAlign: 'center', padding: '20px' }}>
																	<i
																		className='fa-solid fa-file'
																		style={{ fontSize: '48px', color: '#ccc' }}></i>
																	<p style={{ marginTop: '10px', color: '#666' }}>
																		{templateData?.files?.[0]?.name || 'Document'}
																	</p>
																</div>
															) : (
																<i
																	className='fa-solid fa-file'
																	style={{ fontSize: '48px', color: '#ccc' }}></i>
															)}
														</div>
													)}
													{(templateData.components.find((comp: any) => comp.type === 'HEADER')
														.format === 'TEXT' ||
														!templateData.components.find((comp: any) => comp.type === 'HEADER')
															.format) && (
														<div style={{ padding: '10px 10px 0px 10px' }}>
															<div className='header-text'>
																{processTemplateText(
																	templateData.components.find(
																		(comp: any) => comp.type === 'HEADER'
																	).text,
																	userParameters,
																	'header'
																)
																	.split('\n')
																	.map((line: string, index: number) => (
																		<span key={index}>
																			{line}
																			{index <
																				processTemplateText(
																					templateData.components.find(
																						(comp: any) => comp.type === 'HEADER'
																					).text,
																					userParameters,
																					'header'
																				).split('\n').length -
																					1 && <br />}
																		</span>
																	))}
															</div>
														</div>
													)}
												</div>
											</div>
										) : (
											formData.broadcast_header && (
												<div className='message-header'>
													<div className='header-text'>
														{formData.broadcast_header
															.split('\n')
															.map((line: string, index: number) => (
																<span key={index}>
																	{line}
																	{index < formData.broadcast_header.split('\n').length - 1 && (
																		<br />
																	)}
																</span>
															))}
													</div>
												</div>
											)
										)}
										{/* Body section */}
										<div className='message-bubble-content'>
											{templateData?.components?.find((comp: any) => comp.type === 'BODY') && (
												<div className='message-text'>
													{processTemplateText(
														templateData.components.find((comp: any) => comp.type === 'BODY').text,
														userParameters, // Use user parameters instead of example data
														'body'
													)
														.split('\n')
														.map((line, index) => (
															<span key={index}>
																{line}
																{index <
																	processTemplateText(
																		templateData.components.find(
																			(comp: any) => comp.type === 'BODY'
																		).text,
																		userParameters,
																		'body'
																	).split('\n').length -
																		1 && <br />}
															</span>
														))}
												</div>
											)}

											{!templateData?.components?.find((comp: any) => comp.type === 'BODY') && (
												<div className='message-text'>
													{formData.broadcast_text.split('\n').map((line, index) => (
														<span key={index}>
															{line}
															{index < formData.broadcast_text.split('\n').length - 1 && <br />}
														</span>
													)) || 'Template message will appear here...'}
												</div>
											)}

											{/* Footer section if exists */}
											{templateData?.components?.find((comp: any) => comp.type === 'FOOTER') && (
												<div className='message-footer'>
													{processTemplateText(
														templateData.components.find((comp: any) => comp.type === 'FOOTER')
															.text,
														userParameters, // Use user parameters instead of example data
														'footer'
													)
														.split('\n')
														.map((line, index) => (
															<span key={index}>
																{line}
																{index <
																	processTemplateText(
																		templateData.components.find(
																			(comp: any) => comp.type === 'FOOTER'
																		).text,
																		userParameters,
																		'footer'
																	).split('\n').length -
																		1 && <br />}
															</span>
														))}
												</div>
											)}
										</div>
										{/* Buttons section if exists */}
										{templateData?.components?.find((comp: any) => comp.type === 'BUTTONS') && (
											<div className='message-buttons'>
												{templateData.components
													.find((comp: any) => comp.type === 'BUTTONS')
													.buttons?.map((button: any, index: number) => (
														<button
															key={index}
															onClick={(e) => {
																if (button.type === 'COPY_CODE') {
																	navigator.clipboard.writeText(button.code || '')
																	toast.success('Code copied to clipboard!')
																}
															}}>
															{button.type === 'URL' && '🔗 '}
															{button.type === 'COPY_CODE' && '📋 '}
															{button.type === 'PHONE_NUMBER' && '📞 '}
															{button.type.toUpperCase() === 'QUICK_REPLY' && '💬 '}
															{button.text}
														</button>
													))}
											</div>
										)}
									</div>
								</div>
							</div>
							<div className='input-area'>
								<div className='input-actions'>
									<i className='fa-solid fa-plus-circle'></i>
									<i className='fa-solid fa-microphone'></i>
								</div>
								<div className='input-field'>
									<span>Type a message</span>
								</div>
								<div className='input-send'>
									<i className='fa-solid fa-paper-plane'></i>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Excel Validation Modal */}
			{showExcelModal && (
				<div
					className='modal fade show d-block'
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div className='modal-dialog modal-lg'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>Excel File Validation</h5>
								<button
									type='button'
									className='btn-close'
									onClick={() => {
										setShowExcelModal(false)
										setExcelFile(null)
										setExcelContacts([])
										setExcelPreviewData([])
										setExcelValidationErrors([])
									}}></button>
							</div>
							<div className='modal-body'>
								<div className='mb-4'>
									<h6>File Format Rules:</h6>
									<ul className='text-muted small'>
										<li>File must be in .xlsx, .xls, or .csv format</li>
										<li>
											Must contain headers:{' '}
											<strong>full_name, email, country_code, phone_number</strong>
										</li>
										<li>
											Country code should not include '+' symbol (e.g., use "91" instead of "+91")
										</li>
										<li>Phone numbers should contain only digits</li>
										<li>Email is optional but if provided, must be valid format</li>
										<li>Contacts will NOT be saved to database - messages sent directly</li>
									</ul>
								</div>

								{excelFile ? (
									<div className='alert alert-info'>
										<strong>Selected file:</strong> {excelFile.name}
										<small className='d-block'>
											Size: {(excelFile.size / 1024 / 1024).toFixed(2)} MB
										</small>
									</div>
								) : (
									<div className='mb-4'>
										<label className='form-label'>Upload Excel File</label>
										<input
											type='file'
											accept='.xlsx,.xls,.csv'
											className='form-control'
											onChange={handleExcelUpload}
										/>
									</div>
								)}

								{excelValidationErrors.length > 0 && (
									<div className='alert alert-danger'>
										<strong>Validation Errors:</strong>
										<ul className='mb-0'>
											{excelValidationErrors.map((error, index) => (
												<li key={index}>{error}</li>
											))}
										</ul>
									</div>
								)}

								{excelPreviewData.length > 0 && (
									<div className='mb-4'>
										<h6>Preview (Scrollable - Up to 200 contacts):</h6>
										<div
											className='table-responsive'
											style={{ maxHeight: '400px', overflowY: 'auto' }}>
											<table className='table table-bordered table-sm'>
												<thead>
													<tr>
														<th>Name</th>
														<th>Email</th>
														<th>Country Code</th>
														<th>Phone Number</th>
														<th>Full Phone</th>
													</tr>
												</thead>
												<tbody>
													{excelPreviewData.map((contact, index) => (
														<tr key={index}>
															<td>{contact.full_name}</td>
															<td>{contact.email || '-'}</td>
															<td>{contact.country_code}</td>
															<td>{contact.phone_number}</td>
															<td>{contact.full_phone}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
										<div className='alert alert-success'>
											<strong>Total valid contacts:</strong> {excelContacts.length}
											{excelContacts.length > 200 && (
												<small className='d-block mt-1'>
													Showing first 200 in scrollable preview. All {excelContacts.length}{' '}
													contacts will be sent.
												</small>
											)}
										</div>
									</div>
								)}
							</div>
							<div className='modal-footer'>
								<button
									type='button'
									className='btn btn-secondary'
									onClick={() => {
										setShowExcelModal(false)
										setExcelFile(null)
										setExcelContacts([])
										setExcelPreviewData([])
										setExcelValidationErrors([])
									}}>
									Cancel
								</button>
								<button
									type='button'
									className='btn btn-primary'
									onClick={processExcelPreview}
									disabled={!excelFile || excelValidationErrors.length > 0}>
									Preview Data
								</button>
								<button
									type='button'
									className='btn btn-success'
									onClick={sendBroadcastToExcelContacts}
									disabled={excelContacts.length === 0 || isSubmitting}>
									{isSubmitting ? 'Sending...' : `Send to ${excelContacts.length} Contacts`}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default SendBroadcastTemplate
