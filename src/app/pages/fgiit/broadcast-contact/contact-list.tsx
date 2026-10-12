import { faPlusCircle, faXmark, faUpload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'

import { Modal } from 'react-bootstrap'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField' // Import SelectField component
import { GetAutomationContacts, CreateAutomationContact, UpdateAutomationContact, RemoveAutomationContact, GetAutomationBrands, GetAutomationContactGroups, BulkCreateAutomationContact } from '../../../Functions/FGGroup/AutomationContacts'
import * as xlsx from 'xlsx'

import Swal from 'sweetalert2'
import toast from 'react-hot-toast'

// Define response type
interface APIResponse {
  status: number;
  message?: string;
  data?: any;
  metadata?: any;
}

interface Brand {
  _id: string;
  brand_name: string;
}

interface Group {
  _id: string;
  group_name: string;
  brand_id: {
    _id: string;
    brand_name: string;
  };
}

const ContactList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [contactData, setContactData] = useState<any[]>([])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [loading, setLoading] = useState(false)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [showBulkImportModal, setShowBulkImportModal] = useState(false)
	const [editContactId, setEditContactId] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [totalPages, setTotalPages] = useState(1);
	
	// New states for brands and groups
	const [brands, setBrands] = useState<Brand[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [allGroups, setAllGroups] = useState<Group[]>([]); // Store all groups for filtering
	const [loadingBrands, setLoadingBrands] = useState(false);
	const [loadingGroups, setLoadingGroups] = useState(false);
	const [fgiitBrandId, setFgiitBrandId] = useState<string>('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [bulkImportData, setBulkImportData] = useState<any[]>([])
	const [isProcessing, setIsProcessing] = useState(false)

	useEffect(() => {
		const fetchContacts = async () => {
			setLoading(true);
			try {
				const query: any = {
					search: searchTerm,
					sort,
					sortOrder,
					page: pagination.page,
					limit: pagination.itemsPerPage,
				};
				
				// Only add brand_id filter if we have the FGIIT brand ID
				if (fgiitBrandId) {
					query.brand_id = fgiitBrandId;
				}
				
				const response: APIResponse = await GetAutomationContacts(query);
				if (response.status === 200) {
					setContactData(response.data || []);
					// Extract pagination info from response
					if (response.metadata && (response.metadata as any).pagination) {
						setTotalPages(((response.metadata as any).pagination as any).totalPages || 1);
					} else {
						// Fallback: calculate total pages based on data length and items per page
						const calculatedTotalPages = Math.ceil((response.data?.length || 0) / pagination.itemsPerPage);
						setTotalPages(calculatedTotalPages || 1);
					}
				} else {
					console.error('Error fetching contacts:', response.message);
				}
			} catch (error) {
				console.error('Error fetching contacts:', error);
			}
			setLoading(false);
		};

		fetchContacts();
	}, [searchTerm, sort, sortOrder, pagination.page, pagination.itemsPerPage, fgiitBrandId]);

	// Fetch brands and groups when component mounts
	useEffect(() => {
		const fetchBrandsAndGroups = async () => {
			try {
				setLoadingBrands(true);
				const brandsResponse: APIResponse = await GetAutomationBrands({});
				if (brandsResponse.status === 200) {
					const fetchedBrands = brandsResponse.data?.automation_brands || [];
					setBrands(fetchedBrands);
					
					// Find and store the FGIIT brand ID
					const fgiitBrand = fetchedBrands.find((brand: Brand) => brand.brand_name === 'FGIIT');
					if (fgiitBrand) {
						setFgiitBrandId(fgiitBrand._id);
					}
				}

				setLoadingGroups(true);
				const groupsResponse: APIResponse = await GetAutomationContactGroups({});
				if (groupsResponse.status === 200) {
					const groupsData = groupsResponse.data || [];
					setGroups(groupsData);
					setAllGroups(groupsData); // Store all groups for filtering
				}
			} catch (error) {
				console.error('Error fetching brands or groups:', error);
			} finally {
				setLoadingBrands(false);
				setLoadingGroups(false);
			}
		};

		fetchBrandsAndGroups();
	}, []);

	const [contactAddData, setContactAddData] = useState({
			full_name: '',
			email: '',
			country_code: '91',
			phone_number: '',
			brand_id: '',
			group_id: '',
		})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}
	let sortableFields: any

	sortableFields = [
		{ title: 'Name', field: 'full_name' },
		{ title: 'Phone Number', field: 'phone_number' },
		{ title: 'Email', field: 'email' },
		{ title: 'Brand Name', field: 'brand_id.brand_name' },
		{ title: 'Group Name', field: 'group_id.group_name' },
	 ]
	
	// Handle brand change to filter groups
	const handleBrandChange = (brandId: string) => {
		setContactAddData(prev => ({
			...prev,
			brand_id: brandId,
			group_id: '' // Reset group when brand changes
		}));
		
		// Filter groups based on selected brand
		if (brandId) {
			const filteredGroups = allGroups.filter(group => 
				group.brand_id && group.brand_id._id === brandId
			);
			setGroups(filteredGroups);
		} else {
			setGroups(allGroups);
		}
	};

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleInputChange = (event: any) => {
		const { name, value, type, files } = event.target
		if (type === 'file') {
			setContactAddData((prevData) => ({
				...prevData,
				[name]: files[0],
			}))
		} else {
			// Special handling for brand_id to filter groups
			if (name === 'brand_id') {
				handleBrandChange(value);
			} else {
				setContactAddData((prevData) => ({
					...prevData,
					[name]: value,
				}))
			}
		}
	}

	const handleCreateContact = async () => {
		try {
			const response: APIResponse = await CreateAutomationContact({
				full_name: contactAddData.full_name,
				email: contactAddData.email,
				country_code: contactAddData.country_code,
				phone_number: parseInt(contactAddData.phone_number) || 0,
				brand_id: contactAddData.brand_id,
				group_id: contactAddData.group_id || undefined,
			});
			if (response.status === 200) {
				// Refresh the contact list
				const query: any = {
					page: pagination.page,
					limit: pagination.itemsPerPage,
				};
				
				// Only add brand_id filter if we have the FGIIT brand ID
				if (fgiitBrandId) {
					query.brand_id = fgiitBrandId;
				}
				
				const refreshResponse: APIResponse = await GetAutomationContacts(query);
				if (refreshResponse.status === 200) {
					setContactData(refreshResponse.data || []);
				}
				setShowCreateModal(false);
				// Reset form
				setContactAddData({
					full_name: '',
					email: '',
					country_code: '91',
					phone_number: '',
					brand_id: '',
					group_id: '',
				});
				// Reset groups to all groups after form reset
				setGroups(allGroups);
				toast.success('Contact created successfully!');
			} else {
				toast.error('Error creating contact: ' + response.message);
			}
		} catch (error) {
			console.error('Error creating contact:', error);
			toast.error('Error creating contact: ' + (error as any).message);
		}
	}

	const handleRemoveContact = async (contactId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'You won\'t be able to revert this!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, remove it!'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const response: APIResponse = await RemoveAutomationContact({ contact_id: contactId });
					if (response.status === 200) {
						// Refresh the contact list
						const query: any = {
							page: pagination.page,
							limit: pagination.itemsPerPage,
						};
								
						// Only add brand_id filter if we have the FGIIT brand ID
						if (fgiitBrandId) {
							query.brand_id = fgiitBrandId;
						}
								
						const refreshResponse: APIResponse = await GetAutomationContacts(query);
						if (refreshResponse.status === 200) {
							setContactData(refreshResponse.data || []);
						}
						toast.success('Contact removed successfully!');
					} else {
						toast.error('Error removing contact: ' + response.message);
					}
				} catch (error) {
					console.error('Error removing contact:', error);
					toast.error('Error removing contact: ' + (error as any).message);
				}
			}
		});
	}

	// Format brands for SelectField component (string array with ID included)
	const brandOptions = brands.map(brand => `${brand.brand_name} (${brand._id})`);
	
	// Format groups for SelectField component (string array with ID included)
	const groupOptions = groups.map(group => `${group.group_name} (${group._id})`);

	// Helper function to get brand ID from formatted option
	const getBrandIdFromOption = (option: string) => {
		if (!option) return '';
		const match = option.match(/\(([^)]+)\)$/);
		return match ? match[1] : '';
	};

	// Helper function to get group ID from formatted option
	const getGroupIdFromOption = (option: string) => {
		if (!option) return '';
		const match = option.match(/\(([^)]+)\)$/);
		return match ? match[1] : '';
	};

	// Helper function to get brand option from ID
	const getBrandOptionFromId = (id: string) => {
		const brand = brands.find(b => b._id === id);
		return brand ? `${brand.brand_name} (${brand._id})` : '';
	};

	// Helper function to get group option from ID
	const getGroupOptionFromId = (id: string) => {
		const group = groups.find(g => g._id === id);
		return group ? `${group.group_name} (${group._id})` : '';
	};

	const handleBulkImport = async () => {
		if (!selectedFile) {
			toast.error('Please select a file to upload')
			return
		}
		
		if (bulkImportData.length === 0) {
			toast.error('No valid data found in the file')
			return
		}
		
		Swal.fire({
			title: 'Confirm Bulk Import',
			text: `You are about to import ${bulkImportData.length} contacts. This action cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, import them!'
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					setIsProcessing(true)
					const response: APIResponse = await BulkCreateAutomationContact({
						contacts: bulkImportData
					})
					
					if (response.status === 200) {
						// Refresh the contact list
						const query: any = {
							page: pagination.page,
							limit: pagination.itemsPerPage,
						}
						
						if (fgiitBrandId) {
							query.brand_id = fgiitBrandId
						}
						
						const refreshResponse: APIResponse = await GetAutomationContacts(query)
						if (refreshResponse.status === 200) {
							setContactData(refreshResponse.data || [])
						}
						setShowBulkImportModal(false)
						setSelectedFile(null)
						setBulkImportData([])
						toast.success('Contacts imported successfully!')
					} else {
						toast.error('Error importing contacts: ' + response.message)
					}
				} catch (error) {
					console.error('Error importing contacts:', error)
					toast.error('Error importing contacts: ' + (error as any).message)
				} finally {
					setIsProcessing(false)
				}
			}
		})
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return
		
		if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
			toast.error('Please upload a valid Excel or CSV file')
			return
		}
		
		setSelectedFile(file)
		toast.success('File selected. Click "Preview Data" to review before importing.')
	}

	const handlePreviewData = () => {
		if (!selectedFile) {
			toast.error('Please select a file first')
			return
		}
		
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
				const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
				
				if (missingHeaders.length > 0) {
					toast.error(`Missing required columns: ${missingHeaders.join(', ')}`)
					return
				}
				
				const processedData = []
				for (let i = 1; i < jsonData.length; i++) {
					const row = jsonData[i] as any[]
					if (row.length < 4) continue
					
					const contact: any = {
						full_name: String(row[headers.indexOf('full_name')] || '').trim(),
						email: String(row[headers.indexOf('email')] || '').trim(),
						country_code: String(row[headers.indexOf('country_code')] || '').trim(),
						phone_number: String(row[headers.indexOf('phone_number')] || '').trim(),
						brand_id: fgiitBrandId
					}
					
					// Validate required fields
					if (!contact.full_name || !contact.email || !contact.country_code || !contact.phone_number) {
						continue
					}
					
					// Remove '+' from country code if present
					if (contact.country_code.startsWith('+')) {
						contact.country_code = contact.country_code.substring(1)
					}
					
					// Validate phone number
					const phoneRegex = /^\d+$/
					if (!phoneRegex.test(contact.phone_number)) {
						continue
					}
					
					// Validate email
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
					if (!emailRegex.test(contact.email)) {
						continue
					}
					
					processedData.push(contact)
				}
				
				if (processedData.length === 0) {
					toast.error('No valid data found in the file')
					return
				}
				
				setBulkImportData(processedData)
				toast.success(`Successfully processed ${processedData.length} contacts`)
			} catch (error) {
				console.error('Error reading file:', error)
				toast.error('Error reading file. Please make sure it is a valid Excel or CSV file.')
			}
		}
		reader.readAsArrayBuffer(selectedFile)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Contact List</PageTitle>
			<KTCard>
				<div className='row mx-5 border-0 pt-6'>
					<div className='col-md-3'></div>
					<div className='col-md-9'>
						<div className='card-toolbar d-flex justify-content-end'>
							<div className='row justify-content-between'>
								<div className='col-md-12'>
									<TableButton
                                        action='add'
                                        onClick={() => {
                                            // Reset form data when opening create modal
                                            setContactAddData({
                                                full_name: '',
                                                email: '',
                                                country_code: '91',
                                                phone_number: '',
                                                brand_id: '',
                                                group_id: '',
                                            });
                                            // Reset groups to all groups
                                            setGroups(allGroups);
                                            setShowCreateModal(true);
                                        }}
                                        text='Create New Contact'
                                    />
									<button
										className='btn btn-success ms-3'
										onClick={() => setShowBulkImportModal(true)}
									>
										<FontAwesomeIcon icon={faUpload} className='me-2' />
										Bulk Import
									</button>
								</div>
							</div>
						</div>
					</div>
					<div className='col-12 row align-items-end'>
						<div className='col-md-3'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
						<div className='col-md-1'>
							<LengthMenu
								expenseData={contactData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={contactData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={item._id}>
									<tr
										className='data-row'
										onClick={() => handleRowClick(item._id)}>
										<td className='text-center'>
											<div
												className='d-flex ms-8'
												role='button'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<span className='text-dark fw-bold  fs-6'>{item.full_name}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.phone_number}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.email}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.brand_id?.brand_name || 'N/A'}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.group_id?.group_name || 'N/A'}</span>
										</td>
										<td>
											<TableButton
												action='edit'
												onClick={() => {
													setEditContactId(item._id);
													setContactAddData({
														full_name: item.full_name,
														email: item.email,
														country_code: item.country_code,
														phone_number: item.phone_number.toString(),
														brand_id: item.brand_id?._id || '',
														group_id: item.group_id?._id || '',
													});
													// Update groups based on selected brand
													if (item.brand_id?._id) {
														const filteredGroups = allGroups.filter(group => 
															group.brand_id && group.brand_id._id === item.brand_id._id
														);
														setGroups(filteredGroups);
													} else {
														setGroups(allGroups);
													}
													setShowEditModal(true);
												}}
											/>
											<TableButton
												action='remove'
												onClick={() => handleRemoveContact(item._id)}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	item.profile_image
																		? `https://files.fggroup.in/${item.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{item.full_name}</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{item?.phone_number || ''}
															</span>
														</div>
													</div>
													<br />
													<strong>{sortableFields[0].title}:</strong> {item.full_name}
													<br />
													<strong>{sortableFields[1].title}:</strong> {item.phone_number}
													<br />
													<strong>{sortableFields[2].title}:</strong> {item.email}
													<br />
													<strong>{sortableFields[3].title}:</strong> {item.brand_id?.brand_name || 'N/A'}
													<br />
													<strong>{sortableFields[4].title}:</strong> {item.group_id?.group_name || 'N/A'}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{contactData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No contacts found</b>
						</div>
					)}
					{contactData.length > 0 && (
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
			<Modal
				centered
				show={showCreateModal}
				onHide={() => {
					// Reset form data when closing create modal
					setContactAddData({
						full_name: '',
						email: '',
						country_code: '91',
						phone_number: '',
						brand_id: '',
						group_id: '',
					});
					// Reset groups to all groups
					setGroups(allGroups);
					setShowCreateModal(false);
				}}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Create Contact</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => {
								// Reset form data when clicking the close button
								setContactAddData({
									full_name: '',
									email: '',
									country_code: '91',
									phone_number: '',
									brand_id: '',
									group_id: '',
								});
								// Reset groups to all groups
								setGroups(allGroups);
								setShowCreateModal(false);
							}}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='row'>
							<InputField
								placeholder='Full Name'
								type='text'
								className='col-12 fv-row mb-7'
								name='full_name'
								label='Full Name'
								htmlFor='full_name'
								value={contactAddData?.full_name}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Email'
								type='email'
								className='col-12 fv-row mb-7'
								name='email'
								label='Email'
								htmlFor='email'
								value={contactAddData?.email}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Country Code'
								type='text'
								className='col-md-4 fv-row mb-7'
								name='country_code'
								label='Country Code'
								htmlFor='country_code'
								value={contactAddData?.country_code}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Phone Number'
								type='number'
								className='col-md-8 fv-row mb-7'
								name='phone_number'
								label='Phone Number'
								htmlFor='phone_number'
								value={contactAddData?.phone_number}
								onChange={handleInputChange}
							/>
							<SelectField
								className='col-12 fv-row mb-7'
								name='brand_id'
								label='Brand'
								htmlFor='brand_id'
								value={getBrandOptionFromId(contactAddData?.brand_id)}
								onChange={(e) => {
									const selectedBrandId = getBrandIdFromOption(e.target.value);
									handleBrandChange(selectedBrandId);
								}}
								options={[...brandOptions]}
								disabled={loadingBrands}
							/>
							{/* <SelectField
								className='col-12 fv-row mb-7'
								name='group_id'
								label='Group'
								htmlFor='group_id'
								value={getGroupOptionFromId(contactAddData?.group_id)}
								onChange={(e) => {
									const selectedGroupId = getGroupIdFromOption(e.target.value);
									setContactAddData(prev => ({
										...prev,
										group_id: selectedGroupId
									}));
								}}
								options={[...groupOptions]}
								disabled={loadingGroups || !contactAddData.brand_id}
							/> */}
						</div>
						<div className='d-flex justify-content-end'>
							<button
								className='btn btn-primary'
								onClick={handleCreateContact}
							>
								Create Contact
							</button>
						</div>
					</div>
				</div>
			</Modal>
			
			<Modal
				centered
				show={showEditModal}
				onHide={() => {
					// Don't reset form data when closing edit modal to preserve create modal's clean state
					setShowEditModal(false);
					// Reset groups to all groups after closing
					setGroups(allGroups);
				}}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Edit Contact</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => {
								// Don't reset form data when clicking the close button in edit modal
								setShowEditModal(false);
								// Reset groups to all groups after closing
								setGroups(allGroups);
							}}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='row'>
							<InputField
								placeholder='Full Name'
								type='text'
								className='col-12 fv-row mb-7'
								name='full_name'
								label='Full Name'
								htmlFor='full_name'
								value={contactAddData?.full_name}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Email'
								type='email'
								className='col-12 fv-row mb-7'
								name='email'
								label='Email'
								htmlFor='email'
								value={contactAddData?.email}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Country Code'
								type='text'
								className='col-md-4 fv-row mb-7'
								name='country_code'
								label='Country Code'
								htmlFor='country_code'
								value={contactAddData?.country_code}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Phone Number'
								type='number'
								className='col-md-8 fv-row mb-7'
								name='phone_number'
								label='Phone Number'
								htmlFor='phone_number'
								value={contactAddData?.phone_number}
								onChange={handleInputChange}
							/>
							<SelectField
								className='col-12 fv-row mb-7'
								name='brand_id'
								label='Brand'
								htmlFor='brand_id'
								value={getBrandOptionFromId(contactAddData?.brand_id)}
								onChange={(e) => {
									const selectedBrandId = getBrandIdFromOption(e.target.value);
									handleBrandChange(selectedBrandId);
								}}
								options={[ ...brandOptions]}
								disabled={loadingBrands}
							/>
							{/* <SelectField
								className='col-12 fv-row mb-7'
								name='group_id'
								label='Group'
								htmlFor='group_id'
								value={getGroupOptionFromId(contactAddData?.group_id)}
								onChange={(e) => {
									const selectedGroupId = getGroupIdFromOption(e.target.value);
									setContactAddData(prev => ({
										...prev,
										group_id: selectedGroupId
									}));
								}}
								options={[...groupOptions]}
								disabled={loadingGroups || !contactAddData.brand_id}
							/> */}
						</div>
						<div className='d-flex justify-content-end'>
							<button
								className='btn btn-primary'
								onClick={async () => {
									try {
										const response: APIResponse = await UpdateAutomationContact({
											contact_id: editContactId!,
											full_name: contactAddData.full_name,
											email: contactAddData.email,
											country_code: contactAddData.country_code,
											phone_number: parseInt(contactAddData.phone_number) || 0,
											brand_id: contactAddData.brand_id,
											group_id: contactAddData.group_id || undefined,
										});
										if (response.status === 200) {
											// Refresh the contact list
											const query: any = {
												page: pagination.page,
												limit: pagination.itemsPerPage,
											};
																	
											// Only add brand_id filter if we have the FGIIT brand ID
											if (fgiitBrandId) {
												query.brand_id = fgiitBrandId;
											}
																	
											const refreshResponse: APIResponse = await GetAutomationContacts(query);
											if (refreshResponse.status === 200) {
												setContactData(refreshResponse.data || []);
											}
											setShowEditModal(false);
											// Reset groups to all groups after closing
											setGroups(allGroups);
											toast.success('Contact updated successfully!');
										} else {
											toast.error('Error updating contact: ' + response.message);
										}
									} catch (error) {
										console.error('Error updating contact:', error);
										toast.error('Error updating contact: ' + (error as any).message);
									}
								}}
							>
								Update Contact
							</button>
						</div>
					</div>
				</div>
			</Modal>
			
			{/* Bulk Import Modal */}
			<Modal
				centered
				show={showBulkImportModal}
				onHide={() => {
					setShowBulkImportModal(false)
					setSelectedFile(null)
					setBulkImportData([])
				}}
				size='lg'
			>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Bulk Import Contacts</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => {
								setShowBulkImportModal(false)
								setSelectedFile(null)
								setBulkImportData([])
							}}
						>
							<FontAwesomeIcon className='fs-1 position-absolute ms-3' icon={faXmark} />
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='mb-5'>
							<h5>File Format Requirements:</h5>
							<ul>
								<li>File must be in .xlsx, .xls, or .csv format</li>
								<li>Required columns: <strong>full_name, email, country_code, phone_number</strong></li>
								<li>Example: John Doe, john@example.com, 91, 1234567890</li>
								<li>Country code should not include '+' symbol (e.g., use "91" instead of "+91")</li>
							</ul>
						</div>
						
						<div className='mb-5'>
							<label className='form-label'>Select Excel/CSV File</label>
							<input
								type='file'
								className='form-control'
								accept='.xlsx,.xls,.csv'
								onChange={handleFileUpload}
							/>
						</div>
						
						{selectedFile && (
							<div className='mb-5'>
								<button
									className='btn btn-primary'
									onClick={handlePreviewData}
									disabled={isProcessing}
								>
									Preview Data
								</button>
								<div className='mt-3'>
									<strong>Selected File:</strong> {selectedFile.name}
								</div>
							</div>
						)}
						
						{bulkImportData.length > 0 && (
							<div className='mb-5'>
								<h5>Preview ({bulkImportData.length} contacts)</h5>
								<div className='table-responsive' style={{ maxHeight: '300px', overflowY: 'auto' }}>
									<table className='table table-striped'>
										<thead>
											<tr>
												<th>Name</th>
												<th>Email</th>
												<th>Country Code</th>
												<th>Phone Number</th>
											</tr>
										</thead>
										<tbody>
											{/* {bulkImportData.slice(0, 10).map((contact, index) => (
												<tr key={index}>
													<td>{contact.full_name}</td>
													<td>{contact.email}</td>
													<td>{contact.country_code}</td>
													<td>{contact.phone_number}</td>
												</tr>
											))}
											{bulkImportData.length > 10 && (
												<tr>
													<td colSpan={4} className='text-center'>
														... and {bulkImportData.length - 10} more
													</td>
												</tr>
											)} */}
											{bulkImportData.map((contact, index) => (
												<tr key={index}>
													<td>{contact.full_name}</td>
													<td>{contact.email}</td>
													<td>{contact.country_code}</td>
													<td>{contact.phone_number}</td>
												</tr>
											))}
											{/* {bulkImportData.length > 10 && (
												<tr>
													<td colSpan={4} className='text-center'>
														... and {bulkImportData.length - 10} more
													</td>
												</tr>
											)} */}
										</tbody>
									</table>
								</div>
							</div>
						)}
						
						<div className='d-flex justify-content-end'>
							<button
								className='btn btn-light me-3'
								onClick={() => {
									setShowBulkImportModal(false)
									setSelectedFile(null)
									setBulkImportData([])
								}}
								disabled={isProcessing}
							>
								Cancel
							</button>
							<button
								className='btn btn-success'
								onClick={handleBulkImport}
								disabled={isProcessing || bulkImportData.length === 0}
							>
								{isProcessing ? 'Importing...' : 'Import Contacts'}
							</button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default ContactList