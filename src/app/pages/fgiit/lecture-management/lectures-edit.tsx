import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TextareaField from '../../../components/TextareaField'
import TableButton from '../../../components/TableButton'
import { GetLectureReminder, UpdateLectureReminder, GetMentor } from '../../../Functions/FGGroup'

interface Mentor {
  _id: string
  name: string
  email: string
}

interface LectureReminder {
  _id: string
  mentor_id: string
  lecture_topic: string
  lecture_pdf?: string
  lecture_date: string
  lecture_start_time: string
  mentor_name: string
  mentor_email: string
}

function LecturesEdit() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(location.search);
  const id = urlParams.get('id');
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [reminder, setReminder] = useState<LectureReminder | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    mentor_id: '',
    lecture_topic: '',
    lecture_pdf: '',
    lecture_date: '',
    lecture_start_time: ''
  })
  
  const fetchMentors = async () => {
    try {
      const response: any = await GetMentor({ limit: 100 })
      if (response.data) {
        setMentors(response.data)
      }
    } catch (error) {
      console.error('Error fetching mentors:', error)
      toast.error('Failed to load mentors')
    }
  }
  
  const fetchReminder = async () => {
    if (!id) return
    
    setLoading(true)
    try {
      const response: any = await GetLectureReminder({ reminder_id: id })
      if (response.data && response.data.length > 0) {
        const reminderData = response.data[0]
        setReminder(reminderData)
        setFormData({
          mentor_id: reminderData.mentor_id,
          lecture_topic: reminderData.lecture_topic,
          lecture_pdf: reminderData.lecture_pdf || '',
          lecture_date: reminderData.lecture_date.split('T')[0],
          lecture_start_time: reminderData.lecture_start_time
        })
      }
    } catch (error) {
      console.error('Error fetching lecture reminder:', error)
      toast.error('Failed to load lecture reminder')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchMentors()
    fetchReminder()
  }, [id])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id || !formData.mentor_id || !formData.lecture_topic || !formData.lecture_date || !formData.lecture_start_time) {
      toast.error('Please fill all required fields')
      return
    }
    
    setLoading(true)
    try {
      await UpdateLectureReminder({
        reminder_id: id,
        mentor_id: formData.mentor_id,
        lecture_topic: formData.lecture_topic,
        lecture_pdf: formData.lecture_pdf || null,
        lecture_date: formData.lecture_date,
        lecture_start_time: formData.lecture_start_time
      })
      
      toast.success('Lecture reminder updated successfully')
      navigate('/fgiit/lectures-list')
    } catch (error: any) {
      console.error('Error updating lecture reminder:', error)
      toast.error(error.message || 'Failed to update lecture reminder')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading && !reminder) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading lecture details...</p>
        </div>
      </div>
    )
  }
  
  if (!reminder) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <i className="bi bi-exclamation-circle text-warning" style={{ fontSize: '48px' }}></i>
          <h3 className="mt-3">Reminder Not Found</h3>
          <p className="text-muted">The lecture reminder you're looking for doesn't exist.</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/fgiit/lecture-management')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Lectures
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <>
      <PageTitle>
        Edit Lecture Reminder
      </PageTitle>
      
      <div className="row g-5">
        {/* Main Form Card */}
        <div className="col-xl-8">
          <KTCard className="shadow-sm">
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold fs-3 mb-1'>
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Edit Lecture Details
                </span>
                <span className='text-muted mt-1 fw-semibold fs-7'>
                  Update lecture information and reminder settings
                </span>
              </h3>
            </div>
            
            <div className='card-body py-4'>
              <form onSubmit={handleSubmit}>
                {/* Basic Information Section */}
                <div className="mb-8">
                  <h5 className="fw-bold text-gray-800 mb-4">
                    <i className="bi bi-info-circle text-primary me-2"></i>
                    Basic Information
                  </h5>
                  <div className='row g-5'>
                    <div className='col-md-12'>
                      <label className='form-label required fw-semibold'>Select Mentor</label>
                      <select
                        className='form-select form-select-solid'
                        name='mentor_id'
                        value={formData.mentor_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value=''>Choose a mentor...</option>
                        {mentors.map(mentor => (
                          <option key={mentor._id} value={mentor._id}>
                            {mentor.name} • {mentor.email}
                          </option>
                        ))}
                      </select>
                      <div className="form-text">Select the mentor who will conduct this lecture</div>
                    </div>
                    
                    <div className='col-md-12'>
                      <label className='form-label required fw-semibold'>Lecture Topic</label>
                      <input
                        type='text'
                        className='form-control form-control-solid'
                        name='lecture_topic'
                        value={formData.lecture_topic}
                        onChange={handleInputChange}
                        placeholder='Enter the main topic of the lecture'
                        required
                      />
                      <div className="form-text">Provide a clear and descriptive topic name</div>
                    </div>
                  </div>
                </div>
                
                {/* Schedule Section */}
                <div className="mb-8">
                  <h5 className="fw-bold text-gray-800 mb-4">
                    <i className="bi bi-calendar-event text-success me-2"></i>
                    Schedule Details
                  </h5>
                  <div className='row g-5'>
                    <div className='col-md-6'>
                      <label className='form-label required fw-semibold'>Lecture Date</label>
                      <input
                        type='date'
                        className='form-control form-control-solid'
                        name='lecture_date'
                        value={formData.lecture_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className='col-md-6'>
                      <label className='form-label required fw-semibold'>Start Time</label>
                      <input
                        type='time'
                        className='form-control form-control-solid'
                        name='lecture_start_time'
                        value={formData.lecture_start_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Materials Section */}
                <div className="mb-8">
                  <h5 className="fw-bold text-gray-800 mb-4">
                    <i className="bi bi-file-pdf text-danger me-2"></i>
                    Lecture Materials
                  </h5>
                  <div className='row g-5'>
                    <div className='col-md-12'>
                      <label className='form-label fw-semibold'>PDF Document URL</label>
                      <textarea
                        className='form-control form-control-solid'
                        name='lecture_pdf'
                        value={formData.lecture_pdf}
                        onChange={handleInputChange}
                        placeholder='Enter the URL of the lecture PDF (optional)'
                        rows={2}
                      />
                      <div className="form-text">Provide a direct link to the PDF document</div>
                      
                      {/* PDF Preview */}
                      {formData.lecture_pdf && formData.lecture_pdf.endsWith('.pdf') && (
                        <div className='mt-4 border rounded p-4 bg-light-primary'>
                          <div className='d-flex justify-content-between align-items-center mb-3'>
                            <h6 className='mb-0'>
                              <i className="bi bi-file-pdf text-danger me-2"></i>
                              PDF Preview
                            </h6>
                            <a
                              href={`https://files.fggroup.in/${formData.lecture_pdf}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='btn btn-sm btn-light-primary'
                            >
                              <i className="bi bi-box-arrow-up-right me-1"></i>
                              Open Full PDF
                            </a>
                          </div>
                          <div className='border rounded bg-white'>
                            <embed
                              src={`https://files.fggroup.in/${formData.lecture_pdf}`}
                              width={'100%'}
                              height={'400px'}
                              className='rounded'
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className='d-flex gap-3 pt-4 border-top'>
                  <button
                    type='submit'
                    className='btn btn-primary px-6'
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Update Reminder
                      </>
                    )}
                  </button>
                  <button
                    type='button'
                    className='btn btn-light px-6'
                    onClick={() => navigate('/fgiit/lectures-list')}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </KTCard>
        </div>
        
        {/* Sidebar Info Card */}
        <div className="col-xl-4">
          <KTCard className="shadow-sm">
            <div className="card-header border-0">
              <h3 className="card-title fw-bold">
                <i className="bi bi-lightbulb text-warning me-2"></i>
                Quick Info
              </h3>
            </div>
            <div className="card-body">
              <div className="mb-5">
                <h6 className="fw-bold mb-3">Current Lecture Info</h6>
                {reminder && (
                  <div className="bg-light-primary rounded p-4">
                    <div className="mb-3">
                      <span className="text-muted d-block mb-1">Topic</span>
                      <span className="fw-bold">{reminder.lecture_topic}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-muted d-block mb-1">Mentor</span>
                      <span className="fw-bold">{reminder.mentor_name}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-muted d-block mb-1">Date</span>
                      <span className="fw-bold">
                        {new Date(reminder.lecture_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted d-block mb-1">Time</span>
                      <span className="fw-bold">{reminder.lecture_start_time}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-5">
                <h6 className="fw-bold mb-3">Tips</h6>
                <div className="d-flex align-items-start mb-3">
                  <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                  <div className="text-muted fs-7">
                    Ensure the lecture date and time are accurate for proper reminders
                  </div>
                </div>
                <div className="d-flex align-items-start mb-3">
                  <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                  <div className="text-muted fs-7">
                    Upload relevant PDF materials for students to review
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <i className="bi bi-check-circle text-success me-3 mt-1"></i>
                  <div className="text-muted fs-7">
                    Ensure lecture details are accurate for proper notifications
                  </div>
                </div>
              </div>
              
              <div>
                <h6 className="fw-bold mb-3">Need Help?</h6>
                <div className="bg-light-warning rounded p-4">
                  <p className="mb-0 fs-7 text-gray-700">
                    If you encounter any issues while editing the lecture, please contact the support team.
                  </p>
                </div>
              </div>
            </div>
          </KTCard>
        </div>
      </div>
    </>
  )
}

export default LecturesEdit