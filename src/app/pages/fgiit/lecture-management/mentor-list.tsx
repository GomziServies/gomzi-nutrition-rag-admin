import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import { GetMentor, AddMentor, UpdateMentor, DeleteMentor } from '../../../Functions/FGGroup'
import toast from 'react-hot-toast'

interface Mentor {
  _id: string
  name: string
  email: string
  mobile_number: string
  profile_image?: string
  createdAt: string
}

function MentorList() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null)
  const [viewingMentor, setViewingMentor] = useState<Mentor | null>(null)
  const [deletingMentor, setDeletingMentor] = useState<Mentor | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile_number: '',
    profile_image: ''
  })
  
  // Function to get dummy avatar based on name
  const getDummyAvatar = (name: string, index: number) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=random&color=fff&bold=true`
  }
  
  const fetchMentors = async () => {
    setLoading(true)
    try {
      const response: any = await GetMentor({
        limit: 100,
        sort: 'createdAt',
        sortOrder: 'desc'
      })
      
      if (response.data) {
        setMentors(response.data)
      }
    } catch (error) {
      console.error('Error fetching mentors:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchMentors()
  }, [])
  
  const handleCreate = () => {
    setEditingMentor(null)
    setFormData({ name: '', email: '', mobile_number: '', profile_image: '' })
    setSelectedFile(null)
    setPreviewImage('')
    setShowModal(true)
  }
  
  const handleView = (mentor: Mentor) => {
    setViewingMentor(mentor)
    setShowViewModal(true)
  }
  
  const handleEdit = (mentor: Mentor) => {
    setEditingMentor(mentor)
    setFormData({
      name: mentor.name,
      email: mentor.email,
      mobile_number: mentor.mobile_number,
      profile_image: mentor.profile_image || ''
    })
    setSelectedFile(null)
    setPreviewImage(mentor.profile_image || '')
    setShowModal(true)
  }
  
  const handleDelete = (mentor: Mentor) => {
    setDeletingMentor(mentor)
    setShowDeleteModal(true)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const confirmDelete = async () => {
    if (!deletingMentor) return
    
    try {
      await DeleteMentor({ mentor_id: deletingMentor._id })
      toast.success('Mentor deleted successfully')
      setShowDeleteModal(false)
      setDeletingMentor(null)
      fetchMentors()
    } catch (error: any) {
      console.error('Error deleting mentor:', error)
      toast.error(error.message || 'Failed to delete mentor')
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.mobile_number) {
      toast.error('Please fill all required fields')
      return
    }
    
    try {
      let imageUrl = formData.profile_image
      
      // If a file is selected, you would upload it here
      // For now, we'll use the preview image (base64)
      if (selectedFile && previewImage) {
        imageUrl = previewImage
        // In production, you would upload to a server:
        // const uploadedUrl = await uploadImage(selectedFile)
        // imageUrl = uploadedUrl
      }
      
      if (editingMentor) {
        // Update existing mentor
        await UpdateMentor({
          mentor_id: editingMentor._id,
          name: formData.name,
          email: formData.email,
          mobile_number: formData.mobile_number,
          // profile_image: imageUrl
        })
        toast.success('Mentor updated successfully')
      } else {
        // Create new mentor
        await AddMentor({
          name: formData.name,
          email: formData.email,
          mobile_number: formData.mobile_number,
          // profile_image: imageUrl
        })
        toast.success('Mentor created successfully')
      }
      
      setShowModal(false)
      setSelectedFile(null)
      setPreviewImage('')
      fetchMentors()
    } catch (error: any) {
      console.error('Error saving mentor:', error)
      toast.error(error.message || 'Failed to save mentor')
    }
  }
  
  const columns = [
    { title: 'Profile', field: 'profile_image' },
    { title: 'Name', field: 'name' },
    { title: 'Email', field: 'email' },
    { title: 'Mobile', field: 'mobile_number' },
    { title: 'Created', field: 'createdAt' }
  ]
  
  return (
    <>
      <PageTitle breadcrumbs={[]}>Mentors</PageTitle>
      <KTCard>
        <div className='card-header border-0 pt-6'>
          <div className='card-title'>
            <h3 className='fw-bolder m-0'>Mentors List</h3>
          </div>
          <div className='card-toolbar'>
            <TableButton 
              action='add' 
              onClick={handleCreate}
              text='Add Mentor' 
            />
          </div>
        </div>
        <div className='card-body py-4'>
          <div className='table-responsive'>
            <Table
              data={mentors}
              columns={columns}
              loading={loading}
              sort=''
              sortOrder='asc'
              onSortChange={() => {}}
              visibleDetails={null}
              pagination={{ page: 1, itemsPerPage: 10 }}
              setPagination={() => {}}
              renderRow={(mentor: Mentor, index: number) => (
                <tr key={mentor._id}>
                  <td>
                    <span className='text-dark fw-bold d-block mb-1 fs-6 text-center'>
                      {index + 1}
                    </span>
                  </td>
                  <td>
                    <div className='d-flex align-items-center'>
                      <div className='symbol symbol-50px me-3'>
                        <img 
                          src={mentor.profile_image || getDummyAvatar(mentor.name, index)} 
                          alt={mentor.name}
                          className='rounded-circle'
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className='text-dark fw-bold d-block mb-1 fs-6'>
                      {mentor.name}
                    </span>
                  </td>
                  <td>
                    <span className='text-dark fw-bold d-block mb-1 fs-6'>
                      {mentor.email}
                    </span>
                  </td>
                  <td>
                    <span className='text-dark fw-bold d-block mb-1 fs-6'>
                      {mentor.mobile_number}
                    </span>
                  </td>
                  <td>
                    <span className='text-muted fw-semibold d-block fs-7'>
                      {new Date(mentor.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className='d-flex gap-2'>
                      <TableButton 
                        action='view' 
                        onClick={() => handleView(mentor)}
                      />
                      <TableButton 
                        action='edit' 
                        onClick={() => handleEdit(mentor)}
                      />
                      <TableButton 
                        action='remove' 
                        onClick={() => handleDelete(mentor)}
                      />
                    </div>
                  </td>
                </tr>
              )}
            />
          </div>
          {mentors.length === 0 && !loading && (
            <div className='text-center py-10'>
              <span className='text-gray-500 fs-6'>No mentors found</span>
            </div>
          )}
        </div>
      </KTCard>
      
      {/* View Modal */}
      {showViewModal && viewingMentor && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className='modal-dialog modal-dialog-centered modal-lg'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Mentor Details</h5>
                <button 
                  type='button' 
                  className='btn-close' 
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingMentor(null)
                  }}
                ></button>
              </div>
              <div className='modal-body'>
                <div className='row'>
                  <div className='col-md-4 text-center mb-5'>
                    <div className='symbol symbol-150px symbol-circle mb-3 mx-auto'>
                      <img 
                        src={viewingMentor.profile_image || getDummyAvatar(viewingMentor.name, 0)} 
                        alt={viewingMentor.name}
                        className='rounded-circle w-100 h-100'
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                  <div className='col-md-8'>
                    <div className='mb-5'>
                      <label className='form-label fw-bold text-gray-700'>Name</label>
                      <div className='fs-5 text-gray-800'>{viewingMentor.name}</div>
                    </div>
                    <div className='mb-5'>
                      <label className='form-label fw-bold text-gray-700'>Email</label>
                      <div className='fs-6 text-gray-800'>{viewingMentor.email}</div>
                    </div>
                    <div className='mb-5'>
                      <label className='form-label fw-bold text-gray-700'>Mobile Number</label>
                      <div className='fs-6 text-gray-800'>{viewingMentor.mobile_number}</div>
                    </div>
                    <div className='mb-5'>
                      <label className='form-label fw-bold text-gray-700'>Created On</label>
                      <div className='fs-6 text-gray-600'>
                        {new Date(viewingMentor.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='modal-footer'>
                <button 
                  type='button' 
                  className='btn btn-light' 
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingMentor(null)
                  }}
                >
                  Close
                </button>
                <button 
                  type='button' 
                  className='btn btn-primary'
                  onClick={() => {
                    setShowViewModal(false)
                    handleEdit(viewingMentor)
                  }}
                >
                  <i className='fas fa-edit me-2'></i>
                  Edit Mentor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Create/Edit */}
      {showModal && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className='modal-dialog modal-dialog-centered'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>
                  {editingMentor ? 'Edit Mentor' : 'Create Mentor'}
                </h5>
                <button 
                  type='button' 
                  className='btn-close' 
                  onClick={() => {
                    setShowModal(false)
                    setSelectedFile(null)
                    setPreviewImage('')
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className='modal-body'>
                  {/* Profile Image Upload */}
                  <div className='mb-7 text-center'>
                    <label className='form-label fw-bold'>Profile Image</label>
                    <div className='symbol symbol-150px symbol-circle mb-4 mx-auto position-relative'>
                      <img 
                        src={previewImage || formData.profile_image || getDummyAvatar(formData.name || 'User', 0)} 
                        alt='Profile'
                        className='rounded-circle w-100 h-100'
                        style={{ objectFit: 'cover' }}
                      />
                      <label 
                        htmlFor='profile-image-upload'
                        className='btn btn-icon btn-circle btn-active-color-primary w-40px h-40px bg-body shadow position-absolute'
                        style={{ bottom: '10px', right: '10px', cursor: 'pointer' }}
                        title='Upload new image'
                      >
                        <i className='fas fa-camera fs-3'></i>
                      </label>
                    </div>
                    <input
                      id='profile-image-upload'
                      type='file'
                      className='d-none'
                      accept='image/*'
                      onChange={handleFileChange}
                    />
                    <div className='text-muted fs-7'>
                      Click the camera icon to upload an image (Max 5MB)
                    </div>
                    {selectedFile && (
                      <div className='mt-2'>
                        <span className='badge badge-light-success'>
                          <i className='fas fa-check me-1'></i>
                          {selectedFile.name}
                        </span>
                        <button
                          type='button'
                          className='btn btn-sm btn-icon btn-light-danger ms-2'
                          onClick={() => {
                            setSelectedFile(null)
                            setPreviewImage(formData.profile_image || '')
                          }}
                        >
                          <i className='fas fa-times'></i>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className='mb-7'>
                    <label className='form-label fw-bold required'>Name</label>
                    <input
                      type='text'
                      className='form-control'
                      placeholder='Enter mentor name'
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className='mb-7'>
                    <label className='form-label fw-bold required'>Email</label>
                    <input
                      type='email'
                      className='form-control'
                      placeholder='Enter email address'
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className='mb-7'>
                    <label className='form-label fw-bold required'>Mobile Number</label>
                    <input
                      type='tel'
                      className='form-control'
                      placeholder='Enter mobile number'
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className='modal-footer'>
                  <button 
                    type='button' 
                    className='btn btn-light' 
                    onClick={() => {
                      setShowModal(false)
                      setSelectedFile(null)
                      setPreviewImage('')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type='submit' 
                    className='btn btn-primary'
                  >
                    <i className={`fas fa-${editingMentor ? 'save' : 'plus'} me-2`}></i>
                    {editingMentor ? 'Update Mentor' : 'Create Mentor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingMentor && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className='modal-dialog modal-dialog-centered'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Confirm Delete</h5>
                <button 
                  type='button' 
                  className='btn-close' 
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingMentor(null)
                  }}
                ></button>
              </div>
              <div className='modal-body'>
                <div className='text-center mb-4'>
                  <div className='symbol symbol-100px symbol-circle mb-3 mx-auto'>
                    <img 
                      src={deletingMentor.profile_image || getDummyAvatar(deletingMentor.name, 0)} 
                      alt={deletingMentor.name}
                      className='rounded-circle'
                    />
                  </div>
                </div>
                <p className='text-center'>Are you sure you want to delete mentor <strong>{deletingMentor.name}</strong>?</p>
                <p className='text-muted text-center'>This action cannot be undone.</p>
              </div>
              <div className='modal-footer'>
                <button 
                  type='button' 
                  className='btn btn-light' 
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingMentor(null)
                  }}
                >
                  Cancel
                </button>
                <button 
                  type='button' 
                  className='btn btn-danger'
                  onClick={confirmDelete}
                >
                  <i className='fas fa-trash me-2'></i>
                  Delete Mentor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MentorList