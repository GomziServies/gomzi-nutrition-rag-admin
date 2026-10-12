import { faPlus, faEdit, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'

import { Modal } from 'react-bootstrap'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import {
  GetAutomationBrands,
  GetAutomationContactGroups,
  CreateAutomationContactGroup,
  UpdateAutomationContactGroup,
  RemoveAutomationContactGroup,
  GetAutomationContacts,
  UpdateAutomationContact
} from '../../../Functions/FGGroup/AutomationContacts'

type QuerySortOptions = 'asc' | 'desc';

interface APIResponse {
  status: number;
  message?: string;
  data?: any;
  metadata?: any;
}

interface Brand {
  _id: string;
  brand_name: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Group {
  _id: string;
  group_name: string;
  brand_id: {
    _id: string;
    brand_name: string;
  } | string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  _id: string;
  full_name: string;
  email: string;
  phone_number: number;
  brand_id: {
    _id: string;
    brand_name: string;
  };
  group_id: {
    _id: string;
    group_name: string;
  };
}

const GroupManagement: React.FC = () => {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .hover-row:hover {
        background-color: #f8f9fa !important;
      }
      .table .selected {
        background-color: #e7f3ff !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [allBrands, setAllBrands] = useState<Brand[]>([])
  const [loadingBrands, setLoadingBrands] = useState<boolean>(true)
  
  // For pagination of groups/contacts since we removed brands tab
  const [brandTotalCount, setBrandTotalCount] = useState<number>(0)
  
  const [groups, setGroups] = useState<Group[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [groupTotalCount, setGroupTotalCount] = useState<number>(0)
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true)
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactTotalCount, setContactTotalCount] = useState<number>(0)
  const [loadingContacts, setLoadingContacts] = useState<boolean>(true)
  
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false)
  const [showContactAssignmentModal, setShowContactAssignmentModal] = useState<boolean>(false)
  
  const [groupAddData, setGroupAddData] = useState<Partial<Group>>({})
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  
  const [selectedGroupIdForAssignment, setSelectedGroupIdForAssignment] = useState<string>('')
  
  const [contactBrandFilter, setContactBrandFilter] = useState<string>('')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [sort, setSort] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
  
  const [activeTab, setActiveTab] = useState<'groups' | 'contacts'>('groups')
  
  const fetchBrands = async () => {
    setLoadingBrands(true)
    try {
      const response: APIResponse = await GetAutomationBrands({
        page: currentPage,
        limit: rowsPerPage,
        search: searchTerm,
        sort,
        sortOrder
      })
      
      if (response.status === 200) {
        const brandsData = response.data?.automation_brands || []
        setAllBrands(Array.isArray(brandsData) ? brandsData : [])
        setBrandTotalCount(response.data?.pagination?.totalDocs || 0)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    } finally {
      setLoadingBrands(false)
    }
  }
  
  // Get groups
  const fetchGroups = async () => {
    setLoadingGroups(true)
    try {
      const query: any = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchTerm,
        sort,
        sortOrder
      };
      
      if (contactBrandFilter) {
        query.brand_id = contactBrandFilter;
      }
      
      const response: APIResponse = await GetAutomationContactGroups(query)
      
      if (response.status === 200) {
        const groupsData = response.data?.automation_groups || response.data || []
        setGroups(Array.isArray(groupsData) ? groupsData : [])
        setAllGroups(Array.isArray(groupsData) ? groupsData : [])
        setGroupTotalCount(response.data?.pagination?.totalDocs || 0)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }
  
  // Get contacts
  const fetchContacts = async () => {
    setLoadingContacts(true)
    try {
      const query: any = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchTerm,
        sort,
        sortOrder
      };
      
      if (contactBrandFilter) {
        query.brand_id = contactBrandFilter;
      }
      
      const response: APIResponse = await GetAutomationContacts(query)
      
      if (response.status === 200) {
        const contactsData = response.data?.automation_contacts || response.data || []
        const fetchedContacts = Array.isArray(contactsData) ? contactsData : []
        setContacts(fetchedContacts)
        
        setFilteredContacts(fetchedContacts)
        
        let totalDocs = 0;
        if (response.metadata?.pagination?.totalDocs !== undefined) {
          // Check metadata first as per the API response structure you provided
          totalDocs = response.metadata.pagination.totalDocs;
        } else if (response.data?.pagination?.totalDocs !== undefined) {
          totalDocs = response.data.pagination.totalDocs;
        } else if (response.data?.totalDocs !== undefined) {
          totalDocs = response.data.totalDocs;
        } else if (response.data?.length !== undefined) {
          // Fallback: if response.data is an array, use its length (though this is not ideal)
          totalDocs = response.data.length;
        } else {
          // Try to find total count in other common fields
          totalDocs = response.data?.meta?.total || 
                    response.data?.total || 0;
        }
        setContactTotalCount(totalDocs)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }
  
  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId)
      
    setContactBrandFilter(brandId);
  }
    
  const handleContactBrandFilterChange = (brandId: string) => {
    setContactBrandFilter(brandId)
  }
  
  const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
    setSort(newSort)
    setSortOrder(newSortOrder)
  }
  
  const handleGroupInputChange = (event: any) => {
    const { name, value } = event.target
    setGroupAddData((prevData) => ({
      ...prevData,
      [name]: value,
    } as Partial<Group>))
  }
  

  const handleCreateGroup = async () => {
    if (!groupAddData.group_name || !groupAddData.brand_id) {
      toast.error('Group name and brand are required')
      return
    }
    
    try {
      const response: APIResponse = await CreateAutomationContactGroup({
        group_name: groupAddData.group_name as string,
        brand_id: typeof groupAddData.brand_id === 'object' ? (groupAddData.brand_id as any)._id : groupAddData.brand_id as string
      })
      
      if (response.status === 200) {
        toast.success('Group created successfully')
        setGroupAddData({})
        setShowGroupModal(false)
        fetchGroups()
      } else {
        toast.error(response.message || 'Error creating group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Error creating group')
    }
  }
  

  const handleUpdateGroup = async (groupId: string) => {
    if (!groupAddData.group_name) {
      toast.error('Group name is required')
      return
    }
    
    try {
      const response: APIResponse = await UpdateAutomationContactGroup({
        group_id: groupId,
        group_name: groupAddData.group_name as string,
        brand_id: typeof groupAddData.brand_id === 'object' ? (groupAddData.brand_id as any)._id : groupAddData.brand_id as string
      })
      
      if (response.status === 200) {
        toast.success('Group updated successfully')
        setGroupAddData({})
        setShowGroupModal(false)
        fetchGroups()
      } else {
        toast.error(response.message || 'Error updating group')
      }
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Error updating group')
    }
  }
  

  const handleDeleteGroup = async (groupId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (!result.isConfirmed) {
      return;
    }
    
    try {
      const response: APIResponse = await RemoveAutomationContactGroup({
        group_id: groupId
      })
      
      if (response.status === 200) {
        toast.success('Group deleted successfully')
        fetchGroups()
      } else {
        toast.error(response.message || 'Error deleting group')
      }
    } catch (error: any) {
      console.error('Error deleting group:', error)
      toast.error(error?.response?.data?.message || error.message || 'Error deleting group')
    }
  }
  
  const handleAssignContactsToGroup = async (groupId: string) => {
    if (!groupId || selectedContacts.length === 0) {
      toast.error('Please select a group and at least one contact')
      return
    }
    
    try {
      for (const contactId of selectedContacts) {
        await UpdateAutomationContact({
          contact_id: contactId,
          group_id: groupId
        })
      }
      
      toast.success('Contacts assigned to group successfully')
      setSelectedContacts([])
      setSelectedGroupIdForAssignment('')
      setShowContactAssignmentModal(false)
      fetchContacts()
    } catch (error) {
      console.error('Error assigning contacts to group:', error)
      toast.error('Error assigning contacts to group')
    }
  }
  
  const handleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId) 
        : [...prev, contactId]
    )
  }
  
  const handleSelectAllContacts = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact._id))
    }
  }
  
  const setGNBrandFilter = () => {
    const GNBrand = allBrands.find(brand => brand.brand_name === 'GN');
    if (GNBrand) {
      setContactBrandFilter(GNBrand._id);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'groups') {
      fetchGroups()
    } else if (activeTab === 'contacts') {
      fetchContacts()
    }
  }, [activeTab, currentPage, rowsPerPage, searchTerm, sort, sortOrder, contactBrandFilter])
  
  useEffect(() => {
    if (allBrands.length > 0 && !contactBrandFilter) {
      setGNBrandFilter();
    }
  }, [allBrands, contactBrandFilter])
  
  // Fetch brands on component mount since groups depend on brand data
  useEffect(() => {
    fetchBrands();
  }, [])
  
  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm])
  
  // Update filtered contacts when contacts change
  useEffect(() => {
    setFilteredContacts(contacts)
  }, [contacts])
  
  // Create options for brand selection
  const brandOptions = Array.isArray(allBrands) ? allBrands.map(brand => 
    `${brand.brand_name} (${brand._id})`
  ) : []
  
  // Create options for brand filter dropdown
  const brandOptionsForFilter = Array.isArray(allBrands) ? allBrands.map(brand => 
    ({ value: brand._id, label: brand.brand_name })
  ) : []
  
  const groupOptions = Array.isArray(allGroups) ? allGroups
    .filter(group => {
      const brandName = typeof group.brand_id === 'object' ? group.brand_id.brand_name : 
        (Array.isArray(allBrands) ? allBrands.find(b => b._id === group.brand_id)?.brand_name || '' : '');
      return brandName === 'GN';
    })
    .map(group => 
      `${group.group_name} (${group._id}) - ${typeof group.brand_id === 'object' ? group.brand_id.brand_name : (Array.isArray(allBrands) ? allBrands.find(b => b._id === group.brand_id)?.brand_name || 'Unknown Brand' : 'Unknown Brand')}`
    ) : []
  
  const getBrandIdFromOption = (option: string) => {
    if (!option) return ''
    const match = option.match(/\(([^)]+)\)$/) 
    return match ? match[1] : ''
  }
  
  const getGroupIdFromOption = (option: string) => {
    if (!option) return ''
    const match = option.match(/\(([^)]+)\)/g)
    if (match && match.length > 0) {
      // Get the last match which should be the group ID in parentheses
      const lastMatch = match[match.length - 1]
      return lastMatch.replace(/[()]/g, '') // Remove parentheses
    }
    return ''
  }
  
  // Helper function to get brand option from ID
  const getBrandOptionFromId = (id: string) => {
    const brand = Array.isArray(allBrands) ? allBrands.find(b => b._id === id) : undefined
    return brand ? `${brand.brand_name} (${brand._id})` : ''
  }
  
  // Helper function to get group option from ID
  const getGroupOptionFromId = (id: string) => {
    if (!id) return ''
    const gnGroups = Array.isArray(allGroups) ? allGroups.filter(group => {
      const brandName = typeof group.brand_id === 'object' ? group.brand_id.brand_name : 
        (Array.isArray(allBrands) ? allBrands.find(b => b._id === group.brand_id)?.brand_name || '' : '');
      return brandName === 'GN';
    }) : [];
    const group = gnGroups.find(g => g._id === id);
    return group ? `${group.group_name} (${group._id}) - ${typeof group.brand_id === 'object' ? group.brand_id.brand_name : (Array.isArray(allBrands) ? allBrands.find(b => b._id === group.brand_id)?.brand_name || 'Unknown Brand' : 'Unknown Brand')}` : ''
  }
  
  // Brand columns for table
  // Group columns for table
  const groupColumns = [
    { title: 'No.', field: 'no' },
    { title: 'Group Name', field: 'group_name' },
    { title: 'Brand Name', field: 'brand_id.brand_name' }, // This will be handled in the table display
    { title: 'Created At', field: 'createdAt' },
    { title: 'Actions', field: 'actions' },
  ]
  
  // Contact columns for table
  const contactColumns = [
    { title: 'No.', field: 'no' },
    { title: 'Select', field: 'select' },
    { title: 'Name', field: 'full_name' },
    { title: 'Phone Number', field: 'phone_number' },
    { title: 'Email', field: 'email' },
    { title: 'Brand Name', field: 'brand_id.brand_name' },
    { title: 'Group Name', field: 'group_id.group_name' },
  ]
  
  return (
    <>
      <PageTitle breadcrumbs={[]}>Groups and Contact Management</PageTitle>
      
      <KTCard>
        {/* Tabs */}
        <div className='card-header border-0 pt-5'>
          <div className='d-flex justify-content-between align-items-center'>
            <div className='d-flex'>
              <button 
                className={`btn btn-sm mx-2 ${activeTab === 'groups' ? 'btn-primary' : 'btn-outline btn-light'}`} 
                onClick={() => setActiveTab('groups')}
              >
                <i className='fa fa-users me-2'></i> Groups
              </button>
              <button 
                className={`btn btn-sm ${activeTab === 'contacts' ? 'btn-primary' : 'btn-outline btn-light'}`} 
                onClick={() => setActiveTab('contacts')}
              >
                <i className='fa fa-address-book me-2'></i> Contacts
              </button>
            </div>
            
            <div className='card-toolbar'>
              
              {activeTab === 'groups' && (
                <TableButton
                  action='add'
                  onClick={() => {
                    setGroupAddData({})
                    setShowGroupModal(true)
                  }}
                  text='Add Group'
                />
              )}
              
              {activeTab === 'contacts' && (
                <TableButton
                  action='assign'
                  onClick={async () => {
                    if (selectedContacts.length === 0) {
                      toast.error('Please select at least one contact to assign')
                      return
                    }
                    // limit
                    const query: any = {
                      page: 1, 
                      limit: 100, 
                      search: '', 
                      sort,
                      sortOrder
                    };
                    
                    const response: APIResponse = await GetAutomationContactGroups(query)
                    
                    if (response.status === 200) {
                      const groupsData = response.data?.automation_groups || response.data || []
                      setAllGroups(Array.isArray(groupsData) ? groupsData : [])
                    }
                    
                    setShowContactAssignmentModal(true)
                  }}
                  text='Assign to Group'
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className='card-header border-0 pt-0 pb-5'>
          <div className='d-flex justify-content-between'>
            <div className='d-flex justify-content-start'>
              <div className='d-flex align-items-center position-relative me-3'>
                <i className='fa fa-search position-absolute ms-4 fs-3 text-gray-400'></i>
                <input
                  type='text'
                  data-kt-table-filter='search'
                  className='form-control form-control-solid w-250px ps-14 me-3'
                  placeholder='Search...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className='btn btn-sm btn-icon btn-active-color-gray-500 position-absolute end-0 me-5'
                    onClick={() => setSearchTerm('')}
                  >
                    <i className='fa fa-close fs-6'></i>
                  </button>
                )}
              </div>
              <div className='d-flex align-items-center'>
                <LengthMenu
                  expenseData={activeTab === 'groups' ? groups : filteredContacts}
                  handleItemsPerPageChange={(value) => {
                    setRowsPerPage(value)
                    setCurrentPage(1)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className='card-body py-3'>
          
          {activeTab === 'groups' && (
            <div className='table-responsive'>
              <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                <thead>
                  <tr className='fw-bold text-muted bg-light'>
                    <th className='ps-4'>#</th>
                    <th>Group Name</th>
                    <th>Brand Name</th>
                    <th>Created At</th>
                    <th className='text-end'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(groups) && groups.map((group, index) => (
                    <tr key={group._id} className='hover-row'>
                      <td className='ps-4'>
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td>
                        <div className='d-flex align-items-center'>
                          <div className='symbol symbol-40px me-3'>
                            <div className='symbol-label bg-light-info text-info'>
                              <i className='fa fa-users fs-3'></i>
                            </div>
                          </div>
                          <div className='d-flex justify-content-start flex-column'>
                            <a className='text-dark fw-bold text-hover-primary fs-6'>
                              {group.group_name}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className='text-dark fw-bold text-hover-primary fs-6'>
                          {typeof group.brand_id === 'object' && group.brand_id 
                            ? group.brand_id.brand_name 
                            : (Array.isArray(allBrands) && allBrands.length > 0 
                              ? allBrands.find(b => b._id === group.brand_id)?.brand_name || 'N/A' 
                              : 'N/A')}
                        </span>
                      </td>
                      <td>
                        {new Date(group.createdAt).toLocaleDateString()}
                      </td>
                      <td className='text-end'>
                        <TableButton
                          action='edit'
                          onClick={() => {
                            setGroupAddData(group)
                            setShowGroupModal(true)
                          }}
                          text='Edit'
                        />
                        <TableButton
                          action='remove'
                          onClick={() => handleDeleteGroup(group._id)}
                          text='Delete'
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {loadingGroups && (
                <div className='text-center'>Loading groups...</div>
              )}
              
              {!loadingGroups && Array.isArray(groups) && groups.length === 0 && (
                <div className='text-center'>No groups found</div>
              )}
            </div>
          )}
          
          {activeTab === 'contacts' && (
            <div className='table-responsive'>
              <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                <thead>
                  <tr className='fw-bold text-muted bg-light'>
                    <th className='ps-4'>#</th>
                    <th>
                      <div className='form-check form-check-sm form-check-custom form-check-solid me-3'>
                        <input
                          className='form-check-input'
                          type='checkbox'
                          checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                          onChange={handleSelectAllContacts}
                        />
                      </div>
                    </th>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Email</th>
                    <th>Brand</th>
                    <th>Group</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredContacts) && filteredContacts.map((contact, index) => (
                    <tr 
                      key={contact._id} 
                      className={`hover-row ${selectedContacts.includes(contact._id) ? 'selected' : ''}`}
                    >
                      <td className='ps-4'>
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td>
                        <div className='form-check form-check-sm form-check-custom form-check-solid'>
                          <input
                            className='form-check-input'
                            type='checkbox'
                            checked={selectedContacts.includes(contact._id)}
                            onChange={() => handleContactSelection(contact._id)}
                          />
                        </div>
                      </td>
                      <td>
                        <div className='d-flex align-items-center'>
                          <div className='symbol symbol-40px me-3'>
                            <div className='symbol-label bg-light-success text-success'>
                              <i className='fa fa-user fs-3'></i>
                            </div>
                          </div>
                          <div className='d-flex justify-content-start flex-column'>
                            <a className='text-dark fw-bold text-hover-primary fs-6'>
                              {contact.full_name}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className='text-dark fw-bold text-hover-primary fs-6'>
                          {contact.phone_number}
                        </span>
                      </td>
                      <td>
                        <span className='text-dark fw-bold text-hover-primary fs-6'>
                          {contact.email}
                        </span>
                      </td>
                      <td>
                        <span className='text-dark fw-bold text-hover-primary fs-6'>
                          {contact.brand_id?.brand_name || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className='text-dark fw-bold text-hover-primary fs-6'>
                          {contact.group_id?.group_name || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {loadingContacts && (
                <div className='text-center'>Loading contacts...</div>
              )}
              
              {!loadingContacts && Array.isArray(filteredContacts) && filteredContacts.length === 0 && (
                <div className='text-center'>No contacts found</div>
              )}
            </div>
          )}
          
          {/* Pagination */}
              {activeTab === 'contacts' && contactTotalCount > rowsPerPage && (
                <div className='ms-4'>
                  <UsersListPagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(contactTotalCount / rowsPerPage)}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}
        </div>
      </KTCard>
      
      
      {/* Group Modal */}
      <Modal
        centered
        show={showGroupModal}
        onHide={() => {
          setGroupAddData({})
          setShowGroupModal(false)
        }}
      >
        <div className='modal-content'>
          <div className='modal-header pb-0 border-0 justify-content-end'>
            <div
              className='btn btn-sm btn-icon btn-active-color-primary'
              onClick={() => {
                setGroupAddData({})
                setShowGroupModal(false)
              }}
            >
              <FontAwesomeIcon
                className='fs-1 position-absolute ms-3'
                icon={faXmark}
              />
            </div>
          </div>
          <div className='modal-body scroll-y mx-5 mx-xl-18 pt-0 pb-15'>
            <div className='text-center mb-13'>
              <h1 className='mb-3'>{groupAddData._id ? 'Update Group' : 'Create New Group'}</h1>
            <div className='text-muted mb-7'>Fill in the group details below</div>
            </div>
            
            <div className='col-md-12'>
              <div className='row'>
                <div className='col-md-12 fv-row mb-7'>
                  <InputField
                    placeholder='Enter group name'
                    type='text'
                    className='col-12 fv-row mb-7'
                    name='group_name'
                    label='Group Name'
                    htmlFor='group_name'
                    value={groupAddData.group_name || ''}
                    onChange={handleGroupInputChange}
                  />
                </div>
                
                <div className='col-md-12 fv-row mb-7'>
                  <SelectField
                    className='col-12 fv-row mb-7'
                    name='brand_id'
                    label='Brand'
                    htmlFor='brand_id'
                    value={getBrandOptionFromId(typeof groupAddData.brand_id === 'object' ? (groupAddData.brand_id as any)._id : groupAddData.brand_id as string)}
                    onChange={(e) => {
                      const selectedBrandId = getBrandIdFromOption(e.target.value)
                      setGroupAddData(prev => ({
                        ...prev,
                        brand_id: selectedBrandId
                      } as Partial<Group>))
                    }}
                    options={[...brandOptions]}
                    disabled={loadingBrands}
                  />
                </div>
              </div>
            </div>
            
            <div className='d-flex justify-content-end'>
              <button
                className='btn btn-primary'
                onClick={() => {
                  if (groupAddData._id) {
                    handleUpdateGroup(groupAddData._id)
                  } else {
                    handleCreateGroup()
                  }
                }}
              >
                {groupAddData._id ? 'Update Group' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Contact Assignment Modal */}
      <Modal
        centered
        show={showContactAssignmentModal}
        onHide={() => {
          setShowContactAssignmentModal(false)
          setSelectedGroupIdForAssignment('')
        }}
      >
        <div className='modal-content'>
          <div className='modal-header pb-0 border-0 justify-content-end'>
            <div
              className='btn btn-sm btn-icon btn-active-color-primary'
              onClick={() => {
                setShowContactAssignmentModal(false)
              }}
            >
              <FontAwesomeIcon
                className='fs-1 position-absolute ms-3'
                icon={faXmark}
              />
            </div>
          </div>
          <div className='modal-body scroll-y mx-5 mx-xl-18 pt-0 pb-15'>
            <div className='text-center mb-13'>
              <h1 className='mb-3'>Assign Contacts to Group</h1>
            <div className='text-muted mb-7'>You have selected <span className='fw-bold'>{selectedContacts.length}</span> contact(s) to assign to a group</div>
            </div>
            
            <div className='col-md-12'>
              <div className='row'>
                <div className='col-md-12 fv-row mb-7'>
                  <SelectField
                    className='col-12 fv-row mb-7'
                    name='assign_group_id'
                    label='Select Group'
                    htmlFor='assign_group_id'
                    value={getGroupOptionFromId(selectedGroupIdForAssignment)}
                    onChange={(e) => {
                      const selectedGroupId = getGroupIdFromOption(e.target.value)
                      setSelectedGroupIdForAssignment(selectedGroupId)
                    }}
                    options={groupOptions}
                    disabled={loadingGroups}
                  />
                </div>
              </div>
            </div>
            
            <div className='d-flex justify-content-end'>
              <button
                className='btn btn-primary'
                onClick={() => {
                  handleAssignContactsToGroup(selectedGroupIdForAssignment)
                }}
                disabled={!selectedGroupIdForAssignment || selectedContacts.length === 0}
              >
                <i className='fa fa-paper-plane me-2'></i> Assign to Group
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default GroupManagement
