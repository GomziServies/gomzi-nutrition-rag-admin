import axios from 'axios'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { getAPIHeaders } from '../../../../../_metronic/helpers/AuthToken'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import * as FGGroupEndpoints from '../../../../constants/fg_group_endpoints'
import { createWhatsAppTemplate } from '../../../../Functions/FGGroup/WhatsApp'
import { Spinner } from 'react-bootstrap'

interface Button {
	type: string
	text: string
	url?: string
	code?: string
	phone_number?: string
}

interface Component {
	type: string
	format?: string
	text?: string
	buttons?: {
		type: string
		text: string
		url?: string
		code?: string
	}[]
	example?: {
		body_text?: string[][]
		header_text?: string[]
		header_url?: string[]
	}
}

interface FormData {
	template_name: string
	billing_address: string
	broadcast_text: string
	broadcast_text_info: string
	broadcast_images: File[]
	broadcast_video: File | null
	broadcast_document: File | null
}

interface ParameterExample {
	id: number
	value: string
	componentType: string // 'header', 'body', or 'footer'
}

const CreateBroadcastTemplate: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [contentType, setContentType] = useState('text')
	const [templateCategory, setTemplateCategory] = useState('MARKETING')
	const [templateLanguage, setTemplateLanguage] = useState('en_US')
	const [formData, setFormData] = useState<FormData>({
		template_name: '',
		billing_address: '',
		broadcast_text: '',
		broadcast_text_info: '',
		broadcast_images: [] as File[],
		broadcast_video: null as File | null,
		broadcast_document: null as File | null,
	})
	const [buttons, setButtons] = useState<Button[]>([])
	const [parameterExamples, setParameterExamples] = useState<ParameterExample[]>([])
	const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([])

	// Function to upload files to server
	const uploadFiles = async (files: File[]): Promise<string[]> => {
		if (files.length === 0) return []

		const formData = new FormData()
		files.forEach((file, index) => {
			formData.append('files', file, file.name)
		})

		try {
			// Use direct axios call for file upload to avoid APIPost conflicts with FormData
			const headers = getAPIHeaders('fg_group')
			// Remove Content-Type header so browser can set it with proper boundary
			delete (headers as any)['Content-Type']

			const response = await axios.post(FGGroupEndpoints.FileUpload, formData, {
				headers: headers,
			})

			// Check response structure - API returns {status, response, message, data: {fileURLs}}
			if (response?.data?.status === 200 && response?.data?.data?.fileURLs) {
				// Convert relative paths to full URLs
				const baseURL = 'https://files.fggroup.in'
				const fullURLs = response.data.data.fileURLs.map((path: string) => {
					// If path is already a full URL, return as is; otherwise prepend base URL
					if (path.startsWith('http://') || path.startsWith('https://')) {
						return path
					}
					return `${baseURL}/${path}`
				})
				return fullURLs
			} else {
				console.error('Unexpected response structure:', response)
				throw new Error('File upload failed - unexpected response format')
			}
		} catch (error) {
			console.error('File upload error:', error)
			throw error
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })

		// Detect parameters in broadcast_text_info and update parameter examples
		if (name === 'broadcast_text_info') {
			const params = value.match(/\{\{\d+\}\}/g) || []
			const paramNumbers = params
				.map((p) => parseInt(p.replace(/\D/g, '')))
				.filter((item, index, self) => self.indexOf(item) === index)
				.sort((a, b) => a - b)

			// Initialize parameter examples if they don't exist
			const newExamples = paramNumbers.map((num) => {
				const existingExample = parameterExamples.find(
					(ex) => ex.id === num && ex.componentType === 'header'
				)
				return existingExample || { id: num, value: '', componentType: 'header' }
			})

			// Remove old header examples
			const filteredExamples = parameterExamples.filter((ex) => ex.componentType !== 'header')

			// Add new header examples
			const finalExamples = [...filteredExamples, ...newExamples]

			// Sort by parameter number
			finalExamples.sort((a, b) => a.id - b.id)

			setParameterExamples(finalExamples)
		}

		// Detect parameters in billing_address and update parameter examples
		if (name === 'billing_address') {
			const params = value.match(/\{\{\d+\}\}/g) || []
			const paramNumbers = params
				.map((p) => parseInt(p.replace(/\D/g, '')))
				.filter((item, index, self) => self.indexOf(item) === index)
				.sort((a, b) => a - b)

			// Initialize parameter examples if they don't exist
			const newExamples = paramNumbers.map((num) => {
				const existingExample = parameterExamples.find(
					(ex) => ex.id === num && ex.componentType === 'footer'
				)
				return existingExample || { id: num, value: '', componentType: 'footer' }
			})

			// Remove old footer examples
			const filteredExamples = parameterExamples.filter((ex) => ex.componentType !== 'footer')

			// Add new footer examples
			const finalExamples = [...filteredExamples, ...newExamples]

			// Sort by parameter number
			finalExamples.sort((a, b) => a.id - b.id)

			setParameterExamples(finalExamples)
		}
	}

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })

		// Detect parameters in the text and update parameter examples
		if (name === 'broadcast_text') {
			const params = value.match(/\{\{\d+\}\}/g) || []
			const paramNumbers = params
				.map((p) => parseInt(p.replace(/\D/g, '')))
				.filter((item, index, self) => self.indexOf(item) === index)
				.sort((a, b) => a - b)

			// Initialize parameter examples if they don't exist
			const newExamples = paramNumbers.map((num) => {
				const existingExample = parameterExamples.find(
					(ex) => ex.id === num && ex.componentType === 'body'
				)
				return existingExample || { id: num, value: '', componentType: 'body' }
			})

			// Remove old body examples
			const filteredExamples = parameterExamples.filter((ex) => ex.componentType !== 'body')

			// Add new body examples
			const finalExamples = [...filteredExamples, ...newExamples]

			// Sort by parameter number
			finalExamples.sort((a, b) => a.id - b.id)

			setParameterExamples(finalExamples)
		}
	}

	// Function to process template text with parameter examples
	const processTemplateText = (text: string): string => {
		if (!text) return ''

		let processedText = text

		// Sort parameter examples by ID in descending order to avoid conflicts when replacing
		const sortedExamples = [...parameterExamples].sort((a, b) => b.id - a.id)

		// Replace each parameter with its example value
		sortedExamples.forEach((example: ParameterExample) => {
			const paramRegex = new RegExp(`\\{\\{${example.id}\\}\\}`, 'g')
			processedText = processedText.replace(paramRegex, example.value || `{{${example.id}}}`)
		})

		return processedText
	}

	const handleCreateInvoice = async (event: any) => {
		event.preventDefault()

		// Validate template name
		const templateNameRegex = /^[a-z0-9_]+$/
		if (!templateNameRegex.test(formData.template_name)) {
			toast.error('Template name must contain only lowercase letters, numbers, and underscores')
			return
		}

		// Upload files if media content type is selected
		let mediaUrls: string[] = []
		try {
			if (contentType === 'images' && formData.broadcast_images.length > 0) {
				mediaUrls = await uploadFiles(formData.broadcast_images)
			} else if (contentType === 'video' && formData.broadcast_video) {
				mediaUrls = await uploadFiles([formData.broadcast_video])
			} else if (contentType === 'document' && formData.broadcast_document) {
				mediaUrls = await uploadFiles([formData.broadcast_document])
			}
			setUploadedMediaUrls(mediaUrls)
		} catch (error) {
			toast.error('Failed to upload media files')
			return
		}

		// Prepare components for WhatsApp template
		const components: Component[] = []

		// Add header component if needed
		if (contentType !== 'none') {
			if (contentType === 'text') {
				// Check if header text has parameters
				const headerText = formData.broadcast_text_info || 'Default header text'
				const headerParams = headerText.match(/\{\{\d+\}\}/g) || []

				const headerComponent: Component = {
					type: 'HEADER',
					format: 'TEXT',
					text: headerText,
				}

				// Add example data if parameters exist in header text
				if (headerParams.length > 0) {
					const exampleValues = parameterExamples
						.filter((ex) => ex.value.trim() !== '' && ex.componentType === 'header')
						.sort((a, b) => a.id - b.id)
						.map((ex) => ex.value)

					if (exampleValues.length > 0) {
						headerComponent.example = {
							header_text: exampleValues,
						}
					} else {
						const emptyExamples = Array(headerParams.length).fill('')
						headerComponent.example = {
							header_text: emptyExamples,
						}
					}
				}

				components.push(headerComponent)
			} else if (contentType === 'images') {
				const headerComponent: Component = {
					type: 'HEADER',
					format: 'IMAGE',
				}

				// Add example URLs if images are uploaded
				if (mediaUrls.length > 0) {
					headerComponent.example = {
						header_url: mediaUrls,
					}
				}

				components.push(headerComponent)
			} else if (contentType === 'video') {
				const headerComponent: Component = {
					type: 'HEADER',
					format: 'VIDEO',
				}

				// Add example URL if video is uploaded
				if (mediaUrls.length > 0) {
					headerComponent.example = {
						header_url: mediaUrls,
					}
				}

				components.push(headerComponent)
			} else if (contentType === 'document') {
				const headerComponent: Component = {
					type: 'HEADER',
					format: 'DOCUMENT',
				}

				// Add example URL if document is uploaded
				if (mediaUrls.length > 0) {
					headerComponent.example = {
						header_url: mediaUrls,
					}
				}

				components.push(headerComponent)
			}
		}

		// Add body component (required)
		// Body component is mandatory, so we always add it
		const bodyComponent: Component = {
			type: 'BODY',
			text: formData.broadcast_text || ' ',
		}

		// Validate body text for placeholder positioning
		const bodyText = formData.broadcast_text || ''
		const placeholders = (bodyText.match(/\{\{\d+\}\}/g) || []).length

		// Check if placeholders are at start or end (which is not allowed)
		if (placeholders > 0) {
			if (bodyText.startsWith('{{') || bodyText.endsWith('}}')) {
				toast.error('Placeholders cannot be at the start or end of the body text')
				return
			}

			// For templates with placeholders, we need to provide example data
			// Create example data from parameter examples
			const exampleValues = parameterExamples
				.filter((ex) => ex.value.trim() !== '' && ex.componentType === 'body')
				.sort((a, b) => a.id - b.id)
				.map((ex) => ex.value)

			// If we have example values, use them; otherwise, use default examples
			if (exampleValues.length > 0) {
				bodyComponent.example = {
					body_text: [exampleValues],
				}
			} else {
				// Create empty example array based on number of placeholders
				const emptyExamples = Array(placeholders).fill('')
				bodyComponent.example = {
					body_text: [emptyExamples],
				}
			}
		}

		components.push(bodyComponent)

		// Add footer component if text exists
		if (formData.billing_address) {
			const footerText = formData.billing_address
			const footerParams = footerText.match(/\{\{\d+\}\}/g) || []

			const footerComponent: Component = {
				type: 'FOOTER',
				text: footerText,
			}

			// Add example data if parameters exist in footer text
			if (footerParams.length > 0) {
				const exampleValues = parameterExamples
					.filter((ex) => ex.value.trim() !== '' && ex.componentType === 'footer')
					.sort((a, b) => a.id - b.id)
					.map((ex) => ex.value)

				if (exampleValues.length > 0) {
					footerComponent.example = {
						body_text: [exampleValues],
					}
				} else {
					const emptyExamples = Array(footerParams.length).fill('')
					footerComponent.example = {
						body_text: [emptyExamples],
					}
				}
			}

			components.push(footerComponent)
		}

		// Add buttons component if any buttons exist
		if (buttons.length > 0) {
			// Validate maximum number of buttons (3)
			if (buttons.length > 3) {
				toast.error('Maximum 3 buttons are allowed')
				return
			}

			const buttonComponents = buttons
				.filter((button) => {
					// Validate required fields based on button type
					if (
						button.type.toUpperCase() === 'URL' &&
						(!button.url || !button.url.startsWith('https://'))
					) {
						toast.error(
							button.url ? 'URL must be a valid HTTPS URL' : 'URL is required for URL buttons'
						)
						return false
					}
					if (button.type.toUpperCase() === 'COPY_CODE' && !button.code) {
						toast.error('Code is required for COPY_CODE buttons')
						return false
					}
					if (button.type.toUpperCase() === 'PHONE_NUMBER') {
						if (!button.phone_number) {
							toast.error('Phone number is required for PHONE_NUMBER buttons')
							return false
						}
						const phoneRegex = /^\+[1-9]\d{1,14}$/
						if (!phoneRegex.test(button.phone_number)) {
							toast.error('Phone number must be in E.164 format (e.g. +919876543210)')
							return false
						}
					}
					return button.text.trim() !== ''
				})
				.map((button) => {
					// Map button types to the required format
					switch (button.type.toUpperCase()) {
						case 'URL':
							return {
								type: 'url',
								text: button.text,
								url: button.url,
							}
						case 'COPY_CODE':
							return {
								type: 'copy_code',
								text: button.text,
								code: button.code,
							}
						case 'PHONE_NUMBER':
							return {
								type: 'phone_number',
								text: button.text,
								phone_number: button.phone_number,
							}
						case 'QUICK_REPLY':
							return {
								type: 'quick_reply',
								text: button.text,
							}
						default:
							return {
								type: button.type.toLowerCase(),
								text: button.text,
							}
					}
				}) // Validation happens in the filter, so no null values should be returned

			if (buttonComponents.length > 0) {
				components.push({
					type: 'BUTTONS',
					buttons: buttonComponents,
				})
			}
		}

		// Prepare data for API call
		const templateData = {
			templateName: formData.template_name,
			category: templateCategory.toUpperCase(),
			language: templateLanguage === 'en_US' ? 'en' : templateLanguage,
			components: components,
		}

		try {
			setIsSubmitting(true)
			const response: FGGroupAPIResponse = await createWhatsAppTemplate(templateData)

			if (response.status === 200) {
				toast.success(response.message || 'Template Created Successfully')
			} else {
				toast.error(response.message || 'Failed to create template')
			}
		} catch (error) {
			console.error('Error creating template:', error)
			toast.error('An error occurred while creating the template')
		} finally {
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
				.message-bubble-header img{
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
				
				.header-image, .header-video, .header-document {
					width: 100%;
					height: 100%;
					background: #d9dbd5;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 7.5px;
				}
			`}</style>
			<PageTitle breadcrumbs={[]}>Create WhatsApp Template</PageTitle>

			<div className='row'>
				<div className='col-md-8 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<div className='row'>
								<InputField
									className='col-md-4 fv-row'
									label='Template Name'
									placeholder='Template Name'
									type='text'
									name='template_name'
									htmlFor='template_name'
									value={formData.template_name}
									onChange={handleInputChange}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Category'
									name='template_category'
									value={templateCategory}
									onChange={(e) => setTemplateCategory(e.target.value)}
									htmlFor='template_category'
									options={['UTILITY', 'MARKETING', 'AUTHENTICATION']}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Language'
									name='template_language'
									value={templateLanguage}
									onChange={(e) => setTemplateLanguage(e.target.value)}
									htmlFor='template_language'
									options={['en_US','en', 'es', 'fr', 'de', 'it', 'pt_BR', 'id', 'ru', 'vi']}
								/>
								<div
									className='col-12 pt-5'
									style={{
										borderBottom: '1px solid gray',
									}}></div>
								<div className='mb-7 pt-5 col-md-12'>
									<h4>Broadcast Title</h4>
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
												None
											</label>
										</div>
										<div className='form-check'>
											<input
												className='form-check-input'
												type='radio'
												id='contentText'
												name='contentType'
												value='text'
												checked={contentType === 'text'}
												onChange={(e) => setContentType(e.target.value)}
											/>
											<label
												className='form-check-label'
												htmlFor='contentText'>
												Text
											</label>
										</div>
										<div className='form-check'>
											<input
												className='form-check-input'
												type='radio'
												id='contentImages'
												name='contentType'
												value='images'
												checked={contentType === 'images'}
												onChange={(e) => setContentType(e.target.value)}
											/>
											<label
												className='form-check-label'
												htmlFor='contentImages'>
												Images
											</label>
										</div>
										<div className='form-check'>
											<input
												className='form-check-input'
												type='radio'
												id='contentVideo'
												name='contentType'
												value='video'
												checked={contentType === 'video'}
												onChange={(e) => setContentType(e.target.value)}
											/>
											<label
												className='form-check-label'
												htmlFor='contentVideo'>
												Video
											</label>
										</div>
										<div className='form-check'>
											<input
												className='form-check-input'
												type='radio'
												id='contentDocument'
												name='contentType'
												value='document'
												checked={contentType === 'document'}
												onChange={(e) => setContentType(e.target.value)}
											/>
											<label
												className='form-check-label'
												htmlFor='contentDocument'>
												Document
											</label>
										</div>
									</div>
								</div>
								{contentType === 'text' && (
									<div className='col-md-12 fv-row mb-4'>
										<div
											style={{
												padding: '20px',
												borderRadius: '8px',
												border: '2px solid #28a745',
												animation: 'fadeIn 0.3s ease',
											}}>
											<InputField
												className='col-md-12 fv-row mt-4'
												label='Additional Information'
												placeholder='Enter additional information'
												type='text'
												name='broadcast_text_info'
												htmlFor='broadcast_text_info'
												value={formData.broadcast_text_info || ''}
												onChange={handleInputChange}
											/>
										</div>
									</div>
								)}
								{contentType === 'images' && (
									<div className='col-md-12 fv-row mb-4'>
										<div
											style={{
												padding: '20px',
												borderRadius: '8px',
												border: '2px solid #28a745',
												animation: 'fadeIn 0.3s ease',
											}}>
											<label className='fw-bold fs-6 mb-3 d-block text-dark'>Upload Images</label>
											<div
												style={{
													border: '2px dashed #28a745',
													borderRadius: '8px',
													padding: '20px',
													textAlign: 'center',
													backgroundColor: '#fff',
													transition: 'all 0.3s ease',
												}}>
												<input
													type='file'
													multiple
													accept='image/*'
													className='form-control d-none'
													id='broadcast_images'
													onChange={(e) => {
														if (e.target.files) {
															setFormData({
																...formData,
																broadcast_images: Array.from(e.target.files),
															})
														}
													}}
												/>
												<label
													htmlFor='broadcast_images'
													style={{
														cursor: 'pointer',
														display: 'block',
														marginBottom: '0',
													}}>
													<p
														className='mb-2'
														style={{ fontSize: '14px', color: '#28a745' }}>
														📸 Click to upload images or drag and drop
													</p>
													<p style={{ fontSize: '12px', color: '#999', marginBottom: '0' }}>
														PNG, JPG, GIF up to 10MB each
													</p>
												</label>
											</div>
											{formData.broadcast_images.length > 0 && (
												<div className='mt-3'>
													<div
														style={{
															padding: '12px',
															backgroundColor: '#fff',
															border: '1px solid #28a745',
															borderRadius: '6px',
															display: 'flex',
															alignItems: 'center',
															gap: '10px',
														}}>
														<p className='fw-bold text-dark mb-0'>✓ Selected Images</p>
														<p style={{ fontSize: '12px', color: '#666', marginBottom: '0' }}>
															{formData.broadcast_images.map((file, index) => (
																<div
																	key={index}
																	style={{
																		padding: '10px',
																		backgroundColor: '#fff',
																		textAlign: 'center',
																		fontSize: '12px',
																	}}>
																	{file.name.substring(0, 60)}
																</div>
															))}
														</p>
													</div>
												</div>
											)}
										</div>
									</div>
								)}
								{contentType === 'video' && (
									<div className='col-md-12 fv-row mb-4'>
										<div
											style={{
												padding: '20px',
												borderRadius: '8px',
												border: '2px solid #28a745',
												animation: 'fadeIn 0.3s ease',
											}}>
											<label className='fw-bold fs-6 mb-3 d-block text-dark'>Upload Video</label>
											<div
												style={{
													border: '2px dashed #28a745',
													borderRadius: '8px',
													padding: '20px',
													textAlign: 'center',
													backgroundColor: '#fff',
													transition: 'all 0.3s ease',
												}}>
												<input
													type='file'
													accept='video/*'
													className='form-control d-none'
													id='broadcast_video'
													onChange={(e) => {
														if (e.target.files && e.target.files[0]) {
															setFormData({
																...formData,
																broadcast_video: e.target.files[0],
															})
														}
													}}
												/>
												<label
													htmlFor='broadcast_video'
													style={{
														cursor: 'pointer',
														display: 'block',
														marginBottom: '0',
													}}>
													<p
														className='mb-2'
														style={{ fontSize: '14px', color: '#28a745' }}>
														🎥 Click to upload video or drag and drop
													</p>
													<p style={{ fontSize: '12px', color: '#999', marginBottom: '0' }}>
														MP4, WebM, Ogg up to 20MB
													</p>
												</label>
											</div>
											{formData.broadcast_video && (
												<div className='mt-3'>
													<div
														style={{
															padding: '12px',
															backgroundColor: '#fff',
															border: '1px solid #28a745',
															borderRadius: '6px',
															display: 'flex',
															alignItems: 'center',
															gap: '10px',
														}}>
														<span style={{ fontSize: '20px' }}>✓</span>
														<div>
															<p className='fw-bold text-dark mb-0'>Selected Video:</p>
															<p style={{ fontSize: '12px', color: '#666', marginBottom: '0' }}>
																{formData.broadcast_video.name}
															</p>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								)}
								{contentType === 'document' && (
									<div className='col-md-12 fv-row mb-4'>
										<div
											style={{
												padding: '20px',
												borderRadius: '8px',
												border: '2px solid #28a745',
												animation: 'fadeIn 0.3s ease',
											}}>
											<label className='fw-bold fs-6 mb-3 d-block text-dark'>
												Upload Document As PDF
											</label>
											<div
												style={{
													border: '2px dashed #28a745',
													borderRadius: '8px',
													padding: '20px',
													textAlign: 'center',
													backgroundColor: '#fff',
													transition: 'all 0.3s ease',
												}}>
												<input
													type='file'
													accept='.pdf'
													className='form-control d-none'
													id='broadcast_document'
													onChange={(e) => {
														if (e.target.files && e.target.files[0]) {
															setFormData({
																...formData,
																broadcast_document: e.target.files[0],
															})
														}
													}}
												/>
												<label
													htmlFor='broadcast_document'
													style={{
														cursor: 'pointer',
														display: 'block',
														marginBottom: '0',
													}}>
													<p
														className='mb-2'
														style={{ fontSize: '14px', color: '#28a745' }}>
														Click to upload PDF or drag and drop
													</p>
													<p style={{ fontSize: '12px', color: '#999', marginBottom: '0' }}>
														PDF up to 20MB
													</p>
												</label>
											</div>
											{formData.broadcast_document && (
												<div className='mt-3'>
													<div
														style={{
															padding: '12px',
															backgroundColor: '#fff',
															border: '1px solid #28a745',
															borderRadius: '6px',
															display: 'flex',
															alignItems: 'center',
															gap: '10px',
														}}>
														<span style={{ fontSize: '20px' }}>✓</span>
														<div>
															<p className='fw-bold text-dark mb-0'>Selected PDF:</p>
															<p style={{ fontSize: '12px', color: '#666', marginBottom: '0' }}>
																{formData.broadcast_document.name}
															</p>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								)}
								<div
									className='col-12 pt-5'
									style={{
										borderBottom: '1px solid gray',
									}}></div>
								<div className='col-md-12 fv-row pt-5 mb-4'>
									<h4 className='pt-5'>Body</h4>
									<div className='mb-2 d-flex gap-2'>
										<button
											type='button'
											className='btn btn-sm btn-outline-secondary'
											onClick={() => {
												const textarea = document.getElementById(
													'broadcast_text'
												) as HTMLTextAreaElement
												if (textarea) {
													const start = textarea.selectionStart
													const end = textarea.selectionEnd
													const selected = formData.broadcast_text.substring(start, end)
													const before = formData.broadcast_text.substring(0, start)
													const after = formData.broadcast_text.substring(end)
													const newText = before + '*' + selected + '*' + after
													setFormData({ ...formData, broadcast_text: newText })
													setTimeout(() => {
														textarea.focus()
														textarea.selectionStart = start + 2
														textarea.selectionEnd = end + 2
													}, 0)
												}
											}}
											style={{ padding: '4px 12px' }}>
											<strong>B</strong>
										</button>
										<button
											type='button'
											className='btn btn-sm btn-outline-secondary'
											onClick={() => {
												const textarea = document.getElementById(
													'broadcast_text'
												) as HTMLTextAreaElement
												if (textarea) {
													const start = textarea.selectionStart
													const end = textarea.selectionEnd
													const selected = formData.broadcast_text.substring(start, end)
													const before = formData.broadcast_text.substring(0, start)
													const after = formData.broadcast_text.substring(end)
													const newText = before + '_' + selected + '_' + after
													setFormData({ ...formData, broadcast_text: newText })
													setTimeout(() => {
														textarea.focus()
														textarea.selectionStart = start + 1
														textarea.selectionEnd = end + 1
													}, 0)
												}
											}}
											style={{ padding: '4px 12px' }}>
											<em>I</em>
										</button>
									</div>
									<textarea
										id='broadcast_text'
										className='form-control'
										placeholder='Enter broadcast message here...'
										name='broadcast_text'
										value={formData.broadcast_text}
										onChange={handleNotesChange}
										style={{
											minHeight: '120px',
											resize: 'vertical',
											padding: '10px',
											fontFamily: 'inherit',
										}}
									/>
								</div>

								{/* Parameter Examples Section - Show when parameters exist */}
								{parameterExamples.length > 0 && (
									<div className='col-md-12 fv-row pt-5 mb-4'>
										<h4 className='pt-5'>Parameter Examples</h4>
										<p className='text-muted'>
											Provide example values for the parameters in your message
										</p>
										<div className='row'>
											{parameterExamples.map((example, index) => (
												<div
													className='col-md-6 fv-row mb-4'
													key={`${example.id}-${example.componentType}`}>
													<label className='form-label fw-bold'>
														Parameter {example.id} ({example.componentType})
													</label>
													<input
														type='text'
														className='form-control'
														placeholder={`Example for parameter ${example.id} (${example.componentType})`}
														value={example.value}
														onChange={(e) => {
															const updatedExamples = [...parameterExamples]
															const exampleIndex = updatedExamples.findIndex(
																(ex) =>
																	ex.id === example.id && ex.componentType === example.componentType
															)
															if (exampleIndex !== -1) {
																updatedExamples[exampleIndex] = {
																	...updatedExamples[exampleIndex],
																	value: e.target.value,
																}
																setParameterExamples(updatedExamples)
															}
														}}
													/>
												</div>
											))}
										</div>
									</div>
								)}

								<div
									className='col-12 pt-5'
									style={{
										borderBottom: '1px solid gray',
									}}></div>
								<h4 className='pt-5'>Footer</h4>
								<InputField
									className='col-md-12 fv-row'
									label=''
									placeholder='Enter Footer'
									type='text'
									name='billing_address'
									htmlFor='billing_address'
									value={formData.billing_address}
									onChange={handleInputChange}
								/>

								<div
									className='col-12 pt-5'
									style={{
										borderBottom: '1px solid gray',
									}}></div>
								<div className='col-12'>
									<div className='button-editor'>
										<h4>Button</h4>
										{buttons.map((button, index) => (
											<div
												className='button-row'
												key={index}>
												<select
													value={button.type}
													onChange={(e) => {
														const newButtons = [...buttons]
														newButtons[index].type = e.target.value
														// Reset url/code when changing type
														if (e.target.value.toUpperCase() === 'URL') {
															newButtons[index].url = ''
															delete newButtons[index].code
															delete newButtons[index].phone_number
														} else if (e.target.value.toUpperCase() === 'COPY_CODE') {
															newButtons[index].code = ''
															delete newButtons[index].url
															delete newButtons[index].phone_number
														} else if (e.target.value.toUpperCase() === 'PHONE_NUMBER') {
															newButtons[index].phone_number = ''
															delete newButtons[index].url
															delete newButtons[index].code
														} else {
															delete newButtons[index].url
															delete newButtons[index].code
															delete newButtons[index].phone_number
														}
														setButtons(newButtons)
													}}>
													<option value='QUICK_REPLY'>Quick Reply</option>
													<option value='COPY_CODE'>Copy Offer Code</option>
													<option value='PHONE_NUMBER'>Voice Call</option>
													<option value='URL'>Visit Website</option>
												</select>
												<input
													type='text'
													value={button.text}
													onChange={(e) => {
														const newButtons = [...buttons]
														newButtons[index].text = e.target.value
														setButtons(newButtons)
													}}
													placeholder='Type Button Text'
												/>
												{button.type.toUpperCase() === 'URL' && (
													<input
														type='text'
														value={button.url || ''}
														onChange={(e) => {
															const newButtons = [...buttons]
															newButtons[index].url = e.target.value
															setButtons(newButtons)
														}}
														placeholder='https://example.com'
													/>
												)}
												{button.type.toUpperCase() === 'COPY_CODE' && (
													<input
														type='text'
														value={button.code || ''}
														onChange={(e) => {
															const newButtons = [...buttons]
															newButtons[index].code = e.target.value
															setButtons(newButtons)
														}}
														placeholder='Offer code'
													/>
												)}
												{button.type.toUpperCase() === 'PHONE_NUMBER' && (
													<input
														type='text'
														value={button.phone_number || ''}
														onChange={(e) => {
															const newButtons = [...buttons]
															newButtons[index].phone_number = e.target.value
															setButtons(newButtons)
														}}
														placeholder='+919876543210'
													/>
												)}
												{buttons.length > 0 && (
													<button
														className='delete-btn'
														onClick={() => {
															const newButtons = buttons.filter((_, i) => i !== index)
															setButtons(newButtons)
														}}>
														<i className='fa-solid fa-trash'></i>
													</button>
												)}
											</div>
										))}
										<button
											className='btn btn-sm btn-primary mt-2'
											onClick={() => {
												setButtons([
													...buttons,
													{ type: 'QUICK_REPLY', text: '', url: '', code: '', phone_number: '' },
												])
											}}>
											Add Button
										</button>
									</div>
								</div>
								<div className='col-md-12 fv-row mb-7'>
									<TableButton
										action='add'
										onClick={handleCreateInvoice}
										text={isSubmitting ? 'Creating WhatsApp Template...' : 'Create WhatsApp Template'}
										showIcon={false}
										disabled={isSubmitting}
										className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
									/>
									{isSubmitting && (
										<div className="d-flex justify-content-center mt-2">
											<Spinner 
												as="span"
												animation="border" 
												size="sm" 
												role="status"
											>
											</Spinner>
										</div>
									)}{' '}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='col-md-4 mt-3'>
					<div className='center-screen'>
						<div className='phone'>
							<div className='chat-header'>
								<div className='chat-info'>
									<div className='chat-avatar'>
										<span className='avatar-initial'>GLS</span>
									</div>
									<div className='chat-details'>
										<div className='chat-name'>Gomzi Life Science</div>
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
										{/* Header section based on content type */}
										<div className='message-bubble-header'>
											{(contentType === 'images' ||
												contentType === 'video' ||
												contentType === 'document') && (
												<div className='message-header'>
													{contentType === 'images' && (
														<div className='header-image'>
															{formData.broadcast_images.length > 0 ? (
																<img
																	src={URL.createObjectURL(formData.broadcast_images[0])}
																	alt='Preview'
																	style={{
																		width: '100%',
																		objectFit: 'cover',
																	}}
																/>
															) : (
																<i
																	className='fa-solid fa-image'
																	style={{
																		fontSize: '48px',
																		color: '#ccc',
																	}}></i>
															)}
														</div>
													)}
													{contentType === 'video' && (
														<div className='header-video'>
															{formData.broadcast_video ? (
																<video
																	autoPlay
																	preload='metadata'
																	controls={false}
																	style={{
																		width: '100%',
																		objectFit: 'cover',
																		borderRadius: '7.5px',
																	}}>
																	<source
																		src={URL.createObjectURL(formData.broadcast_video)}
																		type='video/mp4'
																	/>
																	Your browser does not support the video tag.
																</video>
															) : (
																<i
																	className='fa-solid fa-video'
																	style={{ fontSize: '48px', color: '#ccc' }}></i>
															)}
														</div>
													)}
													{contentType === 'document' && (
														<div className='header-document'>
															{formData.broadcast_document ? (
																<div style={{ textAlign: 'center', padding: '20px' }}>
																	<i
																		className='fa-solid fa-file-pdf'
																		style={{ fontSize: '48px', color: '#dc3545' }}></i>
																	<div style={{ marginTop: '10px', fontSize: '14px' }}>
																		{formData.broadcast_document.name}
																	</div>
																</div>
															) : (
																<i
																	className='fa-solid fa-file'
																	style={{ fontSize: '48px', color: '#ccc' }}></i>
															)}
														</div>
													)}
												</div>
											)}

											{contentType === 'text' && formData.broadcast_text_info && (
												<div style={{ padding: '10px 10px 0px 10px' }}>
													<div className='message-text' style={{ margin: '0px' }}>
														<strong>{processTemplateText(formData.broadcast_text_info)}</strong>
													</div>
												</div>
											)}
										</div>
										<div className='message-bubble-content'>
											{formData.broadcast_text ? (
												<div className='message-text'>
													{processTemplateText(formData.broadcast_text)
														.split('\n')
														.map((line, index) => (
															<span key={index}>
																{line}
																{index <
																	processTemplateText(formData.broadcast_text).split('\n').length -
																		1 && <br />}
															</span>
														))}
												</div>
											) : (
												<div className='message-text'>Your message content will appear here...</div>
											)}

											{formData.billing_address && (
												<div className='message-footer'>
													{processTemplateText(formData.billing_address)}
												</div>
											)}
										</div>

										{/* Buttons section */}
										{buttons.length > 0 && (
											<div className='message-buttons'>
												{buttons
													.filter((button) => button.text.trim() !== '')
													.map((button, index) => (
														<button
															key={index}
															onClick={(e) => {
																e.preventDefault()
																if (button.type.toUpperCase() === 'COPY_CODE') {
																	navigator.clipboard.writeText(button.code || '')
																	toast.success('Code copied to clipboard!')
																}
															}}>
															{button.type.toUpperCase() === 'URL' && '🔗 '}
															{button.type.toUpperCase() === 'COPY_CODE' && '📋 '}
															{button.type.toUpperCase() === 'PHONE_NUMBER' && '📞 '}
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
		</>
	)
}

export default CreateBroadcastTemplate
