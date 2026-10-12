import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
    UpdateFgiitPitchReport,
    UpdateFgiitCourseDetails,
    UpdateFgiitAdmissionForm,
    GetFgiitFollowUpReport,
} from '../../../Functions/FGGroup/FgiitFollowUpReport'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup/AccountFunctions'

const courseOptions = [
    'Anabolic Androgenic Steroids', 'Diploma In Nutrition Course', 'Nutri Trainer',
    'Injury Rehabilitation Masterclass', 'Group Instructor Masterclass', 'Diploma In Nutrition',
    'Advance Clinical Nutrition', 'Mix Martial Arts Workshop', 'Anabolic Androgenic Steroids Masterclass',
    'Functional Training Workshop', 'Diploma In Personal Training', 'Powerlifting Coach Workshop',
    'Diploma In Business Management', 'Tabata Workshop', 'Certified Nutrition Course',
    'TRX band workshop', 'Python Programming', 'Injury Rehabilitation Workshop', 'Injury Rehab Course',
    'Certified Personal Trainer', 'Flexible Learning', 'Certified Wellness Consultant',
    'Gym Management Course', 'Digital Marketing', 'Tabata & Functional Trainer',
    'Tabata & Functional Workshop', 'Group Instructor Workshop',
]

function UpdateFollowUpReport() {
    const location = useLocation()
    const navigate = useNavigate()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [recordId, setRecordId] = useState<string | null>(null)
    const [latestCallHistoryId, setLatestCallHistoryId] = useState<string | null>(null)

    // Track which sections are already filled
    const [hasCourseDetails, setHasCourseDetails] = useState(false)
    const [hasAdmissionForm, setHasAdmissionForm] = useState(false)
    // Tracks in-session save progress
    const [courseSaved, setCourseSaved] = useState(false)
    const [admissionSaved, setAdmissionSaved] = useState(false)

    // Personal Details — read-only
    const [personalDetails, setPersonalDetails] = useState({
        firstName: '', gender: 'MALE', email: '', mobile: '', age: '', education: '', job: '',
    })

    // Course Details — editable when not filled
    const [courseDetails, setCourseDetails] = useState({
        course: '', course_mode: '', course_duration: '', course_amount: '', final_amount: '',
        payment_method: 'Online', sales_script: '',
    })

    // Admission Form — editable when not filled
    const [admissionForm, setAdmissionForm] = useState<any>({
        firstName: '', lastName: '', address: '', phone: '', email: '',
        dateOfBirth: '', age: '', course: '', reference: '', pinCode: '',
        aadhaarCardFront: null, aadhaarCardBack: null, marksheet: null, photo: null,
    })

    // Pitch Report — always editable
    const [pitchReport, setPitchReport] = useState({
        telecaller_name: '', interest_level: 'LOW', follow_up_date: '', objections: '', call_recording: null as File | null,
    })

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search)
        if (queryParams.get('edit') !== 'true') return
        const id = queryParams.get('id')
        if (!id) return
        setRecordId(id)

        const fetchData = async () => {
            const callHistoryId = queryParams.get('callHistoryId')
            try {
                const response = await GetFgiitFollowUpReport({ id })
                if (response.status === 200 && response.data && response.data.length > 0) {
                    const data = response.data[0]

                    const targetedCall = (callHistoryId && callHistoryId !== 'null' && callHistoryId !== 'undefined')
                        ? data.callHistory?.find((c: any) => c._id === callHistoryId) || null
                        : data.callHistory?.[data.callHistory.length - 1] || null

                    setLatestCallHistoryId(targetedCall?._id || null)

                    setPersonalDetails({
                        firstName: data.personalDetails?.firstName || '',
                        gender: data.personalDetails?.gender || 'MALE',
                        email: data.personalDetails?.email || '',
                        mobile: data.personalDetails?.mobile || '',
                        age: data.personalDetails?.age || '',
                        education: data.personalDetails?.education || '',
                        job: data.personalDetails?.job || '',
                    })

                    const hasCourse = Boolean(targetedCall?.courseDetails?.course)
                    setHasCourseDetails(hasCourse)

                    if (hasCourse) {
                        setCourseDetails({
                            course: targetedCall.courseDetails.course || '',
                            course_mode: targetedCall.courseDetails.course_mode || '',
                            course_duration: targetedCall.courseDetails.course_duration || '',
                            course_amount: targetedCall.courseDetails.course_amount || '',
                            final_amount: targetedCall.courseDetails.final_amount || '',
                            payment_method: targetedCall.courseDetails.payment_method || 'Online',
                            sales_script: targetedCall.courseDetails.sales_script || '',
                        })
                    }

                    const hasAdm = Boolean(targetedCall?.admissionForm?.firstName)
                    setHasAdmissionForm(hasAdm)

                    if (hasAdm) {
                        setAdmissionForm({
                            firstName: targetedCall.admissionForm.firstName || '',
                            lastName: targetedCall.admissionForm.lastName || '',
                            address: targetedCall.admissionForm.address?.address_line_1 || '',
                            phone: targetedCall.admissionForm.phone || '',
                            email: targetedCall.admissionForm.email || '',
                            dateOfBirth: targetedCall.admissionForm.dateOfBirth
                                ? new Date(targetedCall.admissionForm.dateOfBirth).toISOString().split('T')[0] : '',
                            age: targetedCall.admissionForm.age || '',
                            course: targetedCall.admissionForm.course || '',
                            reference: targetedCall.admissionForm.reference || '',
                            pinCode: targetedCall.admissionForm.address?.pin_code || '',
                            aadhaarCardFront: targetedCall.admissionForm.aadhaarCardFront || null,
                            aadhaarCardBack: targetedCall.admissionForm.aadhaarCardBack || null,
                            marksheet: targetedCall.admissionForm.marksheet || null,
                            photo: targetedCall.admissionForm.photo || null,
                        })
                    }

                    setPitchReport({ telecaller_name: '', interest_level: 'LOW', follow_up_date: '', objections: '', call_recording: null })

                    // Open first incomplete section
                    setTimeout(() => {
                        document.getElementById('kt_personal_details')?.classList.add('show')
                        if (!hasCourse) {
                            document.getElementById('kt_course_details')?.classList.add('show')
                        } else if (!hasAdm) {
                            document.getElementById('kt_admission_details')?.classList.add('show')
                        } else {
                            document.getElementById('kt_pitch_report')?.classList.add('show')
                        }
                    }, 100)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                toast.error('Failed to load existing data')
            }
        }

        fetchData()
    }, [location])

    const handleSaveCourseDetails = async () => {
        if (isSubmitting || !recordId) return
        setIsSubmitting(true)
        try {
            const response = await UpdateFgiitCourseDetails({
                id: recordId,
                callHistoryId: latestCallHistoryId,
                courseDetails,
                pitchReport: { telecaller_name: '', interest_level: 'LOW', objections: '' },
            })
            if (Number(response.status) === 200) {
                setLatestCallHistoryId(response.data.latestCallHistoryId)
                setCourseSaved(true)
                toast.success('Course details saved')
                document.getElementById('kt_course_details')?.classList.remove('show')
                document.getElementById('kt_admission_details')?.classList.add('show')
            } else {
                toast.error(response.message || 'Failed to save course details')
            }
        } catch { toast.error('An error occurred') }
        finally { setIsSubmitting(false) }
    }

    const handleSaveAdmissionForm = async () => {
        if (isSubmitting || !recordId) return
        setIsSubmitting(true)
        try {
            const docFields = ['aadhaarCardFront', 'aadhaarCardBack', 'marksheet', 'photo']
            const docUrls: any = {}

            for (const field of docFields) {
                const value = admissionForm[field]
                if (value && typeof value !== 'string') {
                    // It's a new file to upload
                    try {
                        const formData = new FormData()
                        formData.append('file', value)
                        const uploadRes = await FileUploadToFGGroup(formData)
                        if (uploadRes && Number(uploadRes.status) === 200 && uploadRes.data && uploadRes.data.fileURL) {
                            let url = uploadRes.data.fileURL
                            if (!url.startsWith('http')) {
                                url = `https://files.fggroup.in/${url.startsWith('/') ? url.slice(1) : url}`
                            }
                            docUrls[field] = url
                        } else {
                            docUrls[field] = ''
                        }
                    } catch (uploadErr) {
                        console.error(`Failed to upload ${field}`, uploadErr)
                        docUrls[field] = ''
                    }
                } else if (typeof value === 'string') {
                    // Keep existing URL
                    docUrls[field] = value
                } else {
                    docUrls[field] = ''
                }
            }

            const payload = {
                firstName: admissionForm.firstName,
                lastName: admissionForm.lastName,
                address: {
                    address_line_1: admissionForm.address,
                    pin_code: admissionForm.pinCode,
                },
                phone: admissionForm.phone,
                email: admissionForm.email || undefined,
                dateOfBirth: admissionForm.dateOfBirth || undefined,
                age: admissionForm.age,
                course: admissionForm.course,
                reference: admissionForm.reference,
                ...docUrls,
            }
            const response = await UpdateFgiitAdmissionForm({
                id: recordId,
                callHistoryId: latestCallHistoryId,
                admissionForm: payload,
                pitchReport: { telecaller_name: '', interest_level: 'LOW', objections: '' },
            })
            if (Number(response.status) === 200) {
                setLatestCallHistoryId(response.data.latestCallHistoryId)
                setAdmissionSaved(true)
                toast.success('Admission form saved')
                document.getElementById('kt_admission_details')?.classList.remove('show')
                document.getElementById('kt_pitch_report')?.classList.add('show')
            } else {
                toast.error(response.message || 'Failed to save admission form')
            }
        } catch { toast.error('An error occurred') }
        finally { setIsSubmitting(false) }
    }

    const handleSavePitchReport = async () => {
        if (!recordId) { toast.error('No record ID found'); return }
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
            const payload: any = {
                telecaller_name: pitchReport.telecaller_name,
                interest_level: pitchReport.interest_level,
                objections: pitchReport.objections,
            }
            if (pitchReport.follow_up_date) payload.pitch_follow_up_date = pitchReport.follow_up_date

            // Upload audio recording if a new file was selected (optional)
            if (pitchReport.call_recording instanceof File) {
                try {
                    const audioRes: any = await FileUploadToFGGroup(pitchReport.call_recording, { directory: 'call-recordings' })
                    let audioUrl = audioRes?.data?.fileURLs?.[0]
                    if (audioUrl) {
                        if (!audioUrl.startsWith('http')) audioUrl = `https://files.fggroup.in/${audioUrl}`
                        payload.call_recording = audioUrl
                    }
                } catch (audioErr) {
                    console.error('Failed to upload call recording', audioErr)
                }
            } else {
                payload.call_recording = typeof pitchReport.call_recording === 'string' ? pitchReport.call_recording : ''
            }

            const response = await UpdateFgiitPitchReport({
                id: recordId,
                callHistoryId: latestCallHistoryId,
                pitchReport: payload,
            })
            if (Number(response.status) === 200) {
                toast.success('Pitch report saved successfully!')
                navigate(`/fgiit/follow-up-report-inner-list?id=${recordId}`)
            } else {
                toast.error(response.message || 'Failed to save pitch report')
            }
        } catch { toast.error('An error occurred while saving pitch report') }
        finally { setIsSubmitting(false) }
    }

    const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setCourseDetails(prev => ({ ...prev, [name]: value }))
    }

    const handleAdmissionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setAdmissionForm((prev: any) => ({ ...prev, [name]: value }))
    }

    const handlePitchReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setPitchReport(prev => ({ ...prev, [name]: value }))
    }

    const handleAdmissionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target
        if (files && files[0]) {
            setAdmissionForm((prev: any) => ({ ...prev, [name]: files[0] }))
        }
    }

    const handleRemoveAdmissionFile = (name: string) => {
        setAdmissionForm((prev: any) => ({ ...prev, [name]: null }))
    }

    const courseIsDone = hasCourseDetails || courseSaved
    const admissionIsDone = hasAdmissionForm || admissionSaved

    return (
        <>
            <style>{`
                .divider-line {
                    border-top: 1px solid #ebedf3;
                    margin: 2rem 0;
                    width: 100%;
                }
                .field-group-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #181c32;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                .field-group-title i {
                    margin-right: 0.5rem;
                    color: #009ef7;
                }
            `}</style>
            <PageTitle breadcrumbs={[]}>Follow Up Report (Update)</PageTitle>

            {/* Personal Details (Read-only) */}
            <div className='col-12'>
                <div className='card mb-5 mb-xl-10 mt-5'>
                    <div className='card-header row border-0 cursor-pointer' role='button' data-bs-toggle='collapse' data-bs-target='#kt_personal_details'>
                        <div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
                            <h3 className='fw-bolder m-0'>Personal Details (Read Only)</h3>
                            <FontAwesomeIcon icon={faAngleDown} className='fs-3' />
                        </div>
                    </div>
                    <div id='kt_personal_details' className='collapse show'>
                        <div className='card-body'>
                            <div className='row'>
                                <InputField type='text' className='col-md-6 fv-row mb-7' name='firstName' label='Fullname' htmlFor='fullname' value={personalDetails.firstName} disabled onChange={() => { }} />
                                <InputField type='number' className='col-md-6 fv-row mb-7' name='mobile' label='Mobile Number' htmlFor='mobile' value={personalDetails.mobile} disabled onChange={() => { }} />
                                <InputField type='email' className='col-md-6 fv-row mb-7' name='email' label='Email' htmlFor='email' value={personalDetails.email} disabled onChange={() => { }} />
                                <InputField type='text' className='col-md-3 fv-row mb-7' name='age' label='Age' htmlFor='age' value={personalDetails.age} disabled onChange={() => { }} />
                                <InputField type='text' className='col-md-3 fv-row mb-7' name='education' label='Education' htmlFor='education' value={personalDetails.education} disabled onChange={() => { }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Details */}
            <div className='col-12'>
                <div className='card mb-5 mb-xl-10'>
                    <div className='card-header row border-0 cursor-pointer' role='button' data-bs-toggle='collapse' data-bs-target='#kt_course_details'>
                        <div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
                            <h3 className='fw-bolder m-0'>
                                Course Details {courseIsDone ? '(Read Only)' : ''}
                                {courseIsDone && <span className='badge badge-light-success ms-3 fs-8'>Filled</span>}
                            </h3>
                            <FontAwesomeIcon icon={faAngleDown} className='fs-3' />
                        </div>
                    </div>
                    <div id='kt_course_details' className='collapse'>
                        <div className='card-body'>
                            <div className='row'>
                                {courseIsDone ? (
                                    <>
                                        <InputField type='text' className='col-md-8 fv-row mb-7' name='course' label='Course' htmlFor='course' value={courseDetails.course} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-4 fv-row mb-7' name='course_mode' label='Mode' htmlFor='course_mode' value={courseDetails.course_mode} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-3 fv-row mb-7' name='course_duration' label='Duration' htmlFor='course_duration' value={courseDetails.course_duration} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-3 fv-row mb-7' name='course_amount' label='Course Fees' htmlFor='course_amount' value={courseDetails.course_amount} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-3 fv-row mb-7' name='final_amount' label='Final Pitched Fees' htmlFor='final_amount' value={courseDetails.final_amount} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-3 fv-row mb-7' name='payment_method' label='Interested Payment Method' htmlFor='payment_method' value={courseDetails.payment_method} disabled onChange={() => { }} />
                                    </>
                                ) : (
                                    <>
                                        <div className='col-md-8 fv-row mb-7'>
                                            <SelectField className='col-md-12 fv-row mb-7' label='Course' name='course' htmlFor='course' options={courseOptions} value={courseDetails.course} onChange={handleCourseChange} />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <SelectField className='col-md-12 fv-row mb-7' label='Mode' name='course_mode' htmlFor='course_mode' options={['Offline', 'Online', 'Flexible']} value={courseDetails.course_mode} onChange={handleCourseChange} />
                                        </div>
                                        <div className='col-md-3 fv-row mb-7'>
                                            <InputField placeholder='Course Duration' type='text' className='col-md-12 fv-row' label='Duration' name='course_duration' htmlFor='course_duration' value={courseDetails.course_duration} onChange={handleCourseChange} />
                                        </div>
                                        <div className='col-md-3 fv-row mb-7'>
                                            <InputField placeholder='Course Fees' type='number' className='col-md-12 fv-row' label='Course Fees' name='course_amount' htmlFor='course_amount' value={courseDetails.course_amount} onChange={handleCourseChange} />
                                        </div>
                                        <div className='col-md-3 fv-row mb-7'>
                                            <InputField placeholder='Final Pitched Fees' type='number' className='col-md-12 fv-row' label='Final Pitched Fees' name='final_amount' htmlFor='final_amount' value={courseDetails.final_amount} onChange={handleCourseChange} />
                                        </div>
                                        <div className='col-md-3 fv-row mb-7'>
                                            <SelectField className='col-md-12 fv-row mb-7' label='Interested Payment Method' name='payment_method' htmlFor='payment_method' options={['Online', 'Cash', 'SaveIn']} value={courseDetails.payment_method} onChange={handleCourseChange} />
                                        </div>
                                        <div className='col-md-12 fv-row mb-7'>
                                            <label className='form-label fw-bolder text-dark fs-6'>Sales Script</label>
                                            <textarea className='form-control form-control-solid' rows={4} name='sales_script' placeholder='Sales script...' value={courseDetails.sales_script} onChange={handleCourseChange} />
                                        </div>
                                        <div className='col-md-12 d-flex justify-content-end mt-2 mb-7'>
                                            <TableButton action='add' text='Save & Next' showIcon={false} backgroundDark={true} onClick={handleSaveCourseDetails} disabled={isSubmitting} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admission Form */}
            <div className='col-12'>
                <div className='card mb-5 mb-xl-10'>
                    <div className='card-header row border-0 cursor-pointer' role='button' data-bs-toggle='collapse' data-bs-target='#kt_admission_details'>
                        <div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
                            <h3 className='fw-bolder m-0'>
                                Admission Form {admissionIsDone ? '(Read Only)' : ''}
                                {admissionIsDone && <span className='badge badge-light-success ms-3 fs-8'>Filled</span>}
                            </h3>
                            <FontAwesomeIcon icon={faAngleDown} className='fs-3' />
                        </div>
                    </div>
                    <div id='kt_admission_details' className='collapse'>
                        <div className='card-body'>
                            <div className='row'>
                                {admissionIsDone ? (
                                    <>
                                        <InputField type='text' className='col-md-6 fv-row mb-7' name='firstName' label='First Name' htmlFor='firstName' value={admissionForm.firstName} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-6 fv-row mb-7' name='lastName' label='Last Name' htmlFor='lastName' value={admissionForm.lastName} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-12 fv-row mb-7' name='address' label='Address' htmlFor='address' value={admissionForm.address} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-4 fv-row mb-7' name='phone' label='Phone' htmlFor='phone' value={admissionForm.phone} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-4 fv-row mb-7' name='email' label='Email' htmlFor='email' value={admissionForm.email} disabled onChange={() => { }} />
                                        <InputField type='text' className='col-md-4 fv-row mb-7' name='course' label='Course' htmlFor='course' value={admissionForm.course} disabled onChange={() => { }} />
                                        
                                        <div className="divider-line"></div>
                                        <div className="field-group-title">
                                            <i className="bi bi-cloud-arrow-up"></i>Document Uploads
                                        </div>
                                        <div className="row">
                                            {['aadhaarCardFront', 'aadhaarCardBack', 'marksheet', 'photo'].map((field) => {
                                                const url = admissionForm[field]
                                                const label = field === 'aadhaarCardFront' ? 'Aadhaar (Front)' : 
                                                              field === 'aadhaarCardBack' ? 'Aadhaar (Back)' :
                                                              field === 'marksheet' ? 'Marksheet' : 'Photo'
                                                
                                                if (!url) return null

                                                return (
                                                    <div key={field} className="col-md-3 fv-row mb-7">
                                                        <label className="form-label">{label}</label>
                                                        <div className="border border-secondary rounded overflow-hidden" style={{ height: '180px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <a href={url} target="_blank" rel="noreferrer" className="w-100 h-100 d-flex align-items-center justify-content-center">
                                                                {url.toLowerCase().endsWith('.pdf') ? (
                                                                    <div className="text-center">
                                                                        <i className="bi bi-file-earmark-pdf text-danger fs-1"></i>
                                                                        <div className="fs-7 fw-bold mt-2">View PDF</div>
                                                                    </div>
                                                                ) : (
                                                                    <img src={url} alt={label} className="img-fluid" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                                )}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <InputField placeholder='First Name' type='text' className='col-md-6 fv-row mb-7' name='firstName' label='First Name' htmlFor='firstName' value={admissionForm.firstName} onChange={handleAdmissionChange} />
                                        <InputField placeholder='Last Name' type='text' className='col-md-6 fv-row mb-7' name='lastName' label='Last Name' htmlFor='lastName' value={admissionForm.lastName} onChange={handleAdmissionChange} />
                                        <InputField placeholder='Address' type='text' className='col-md-8 fv-row mb-7' name='address' label='Address' htmlFor='address' value={admissionForm.address} onChange={handleAdmissionChange} />
                                        <InputField placeholder='Pin Code' type='text' className='col-md-4 fv-row mb-7' name='pinCode' label='Pin Code' htmlFor='pinCode' value={(admissionForm as any).pinCode || ''} onChange={handleAdmissionChange} />
                                        <InputField placeholder='Phone Number' type='tel' className='col-md-6 fv-row mb-7' name='phone' label='Phone Number' htmlFor='phone' value={admissionForm.phone} onChange={handleAdmissionChange} />
                                        <InputField placeholder='Email' type='email' className='col-md-6 fv-row mb-7' name='email' label='Email' htmlFor='email' value={admissionForm.email} onChange={handleAdmissionChange} />
                                        <InputField placeholder='Date of Birth' type='date' className='col-md-6 fv-row mb-7' name='dateOfBirth' label='Date of Birth' htmlFor='dateOfBirth' value={admissionForm.dateOfBirth} onChange={handleAdmissionChange} />
                                        <InputField placeholder='Age' type='number' className='col-md-6 fv-row mb-7' name='age' label='Age' htmlFor='age' value={admissionForm.age} onChange={handleAdmissionChange} />
                                        <SelectField className='col-md-6 fv-row mb-7' label='Course' name='course' htmlFor='course' options={courseOptions} value={admissionForm.course} onChange={handleAdmissionChange} />
                                        <InputField placeholder='Reference' type='text' className='col-md-6 fv-row mb-7' name='reference' label='Reference' htmlFor='reference' value={admissionForm.reference} onChange={handleAdmissionChange} />
                                        
                                        <div className="divider-line"></div>
                                        <div className="field-group-title">
                                            <i className="bi bi-cloud-arrow-up"></i>Document Uploads
                                        </div>
                                        
                                        {/* Aadhaar Front */}
                                        <div className="col-md-3 fv-row mb-7">
                                            <label className="form-label fw-bolder text-dark fs-6">Aadhaar (Front)</label>
                                            {admissionForm.aadhaarCardFront ? (
                                                <div className="position-relative mt-2">
                                                    <div className="border border-secondary rounded overflow-hidden" style={{ height: '180px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {(() => {
                                                            const url = typeof admissionForm.aadhaarCardFront === 'string' ? admissionForm.aadhaarCardFront : URL.createObjectURL(admissionForm.aadhaarCardFront)
                                                            return url.toLowerCase().endsWith('.pdf') ? 
                                                                <div className="text-center"><i className="bi bi-file-earmark-pdf text-danger fs-1"></i><div className="fs-7 fw-bold mt-2">PDF Selected</div></div> :
                                                                <img src={url} alt="Aadhaar Front Preview" className="img-fluid" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                        })()}
                                                    </div>
                                                    <button className="btn btn-icon btn-sm btn-danger position-absolute" onClick={() => handleRemoveAdmissionFile('aadhaarCardFront')} style={{ top: '5px', right: '5px', borderRadius: '50%' }}><i className="bi bi-x"></i></button>
                                                </div>
                                            ) : (
                                                <input type='file' name='aadhaarCardFront' className='form-control form-control-solid' onChange={handleAdmissionFileChange} accept="image/*,application/pdf" />
                                            )}
                                        </div>

                                        {/* Aadhaar Back */}
                                        <div className="col-md-3 fv-row mb-7">
                                            <label className="form-label fw-bolder text-dark fs-6">Aadhaar (Back)</label>
                                            {admissionForm.aadhaarCardBack ? (
                                                <div className="position-relative mt-2">
                                                    <div className="border border-secondary rounded overflow-hidden" style={{ height: '180px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {(() => {
                                                            const url = typeof admissionForm.aadhaarCardBack === 'string' ? admissionForm.aadhaarCardBack : URL.createObjectURL(admissionForm.aadhaarCardBack)
                                                            return url.toLowerCase().endsWith('.pdf') ? 
                                                                <div className="text-center"><i className="bi bi-file-earmark-pdf text-danger fs-1"></i><div className="fs-7 fw-bold mt-2">PDF Selected</div></div> :
                                                                <img src={url} alt="Aadhaar Back Preview" className="img-fluid" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                        })()}
                                                    </div>
                                                    <button className="btn btn-icon btn-sm btn-danger position-absolute" onClick={() => handleRemoveAdmissionFile('aadhaarCardBack')} style={{ top: '5px', right: '5px', borderRadius: '50%' }}><i className="bi bi-x"></i></button>
                                                </div>
                                            ) : (
                                                <input type='file' name='aadhaarCardBack' className='form-control form-control-solid' onChange={handleAdmissionFileChange} accept="image/*,application/pdf" />
                                            )}
                                        </div>

                                        {/* Marksheet */}
                                        <div className="col-md-3 fv-row mb-7">
                                            <label className="form-label fw-bolder text-dark fs-6">Marksheet</label>
                                            {admissionForm.marksheet ? (
                                                <div className="position-relative mt-2">
                                                    <div className="border border-secondary rounded overflow-hidden" style={{ height: '180px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {(() => {
                                                            const url = typeof admissionForm.marksheet === 'string' ? admissionForm.marksheet : URL.createObjectURL(admissionForm.marksheet)
                                                            return url.toLowerCase().endsWith('.pdf') ? 
                                                                <div className="text-center"><i className="bi bi-file-earmark-pdf text-danger fs-1"></i><div className="fs-7 fw-bold mt-2">PDF Selected</div></div> :
                                                                <img src={url} alt="Marksheet Preview" className="img-fluid" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                        })()}
                                                    </div>
                                                    <button className="btn btn-icon btn-sm btn-danger position-absolute" onClick={() => handleRemoveAdmissionFile('marksheet')} style={{ top: '5px', right: '5px', borderRadius: '50%' }}><i className="bi bi-x"></i></button>
                                                </div>
                                            ) : (
                                                <input type='file' name='marksheet' className='form-control form-control-solid' onChange={handleAdmissionFileChange} accept="image/*,application/pdf" />
                                            )}
                                        </div>

                                        {/* Photo */}
                                        <div className="col-md-3 fv-row mb-7">
                                            <label className="form-label fw-bolder text-dark fs-6">Photo</label>
                                            {admissionForm.photo ? (
                                                <div className="position-relative mt-2">
                                                    <div className="border border-secondary rounded overflow-hidden" style={{ height: '180px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {(() => {
                                                            const url = typeof admissionForm.photo === 'string' ? admissionForm.photo : URL.createObjectURL(admissionForm.photo)
                                                            return url.toLowerCase().endsWith('.pdf') ? 
                                                                <div className="text-center"><i className="bi bi-file-earmark-pdf text-danger fs-1"></i><div className="fs-7 fw-bold mt-2">PDF Selected</div></div> :
                                                                <img src={url} alt="Photo Preview" className="img-fluid" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                        })()}
                                                    </div>
                                                    <button className="btn btn-icon btn-sm btn-danger position-absolute" onClick={() => handleRemoveAdmissionFile('photo')} style={{ top: '5px', right: '5px', borderRadius: '50%' }}><i className="bi bi-x"></i></button>
                                                </div>
                                            ) : (
                                                <input type='file' name='photo' className='form-control form-control-solid' onChange={handleAdmissionFileChange} accept="image/*,application/pdf" />
                                            )}
                                        </div>
                                        <div className='col-md-12 d-flex justify-content-between mt-2 mb-7'>
                                            <button className='btn btn-light' type='button' onClick={() => {
                                                document.getElementById('kt_admission_details')?.classList.remove('show')
                                                document.getElementById('kt_pitch_report')?.classList.add('show')
                                            }}>Skip</button>
                                            <TableButton action='add' text='Save & Next' showIcon={false} backgroundDark={true} onClick={handleSaveAdmissionForm} disabled={isSubmitting} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pitch Report (Editable) */}
            <div className='card mb-5 mb-xl-10'>
                <div className='card-header row border-0 cursor-pointer' role='button' data-bs-toggle='collapse' data-bs-target='#kt_pitch_report'>
                    <div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
                        <h3 className='fw-bolder m-0'>Pitch Report</h3>
                        <FontAwesomeIcon icon={faAngleDown} className='fs-3' />
                    </div>
                </div>
                <div id='kt_pitch_report' className='collapse'>
                    <div className='card-body border-top p-9'>
                        <div className='row'>
                            <SelectField className='col-md-6 fv-row mb-7' label='Telecaller Name' name='telecaller_name' htmlFor='telecaller_name'
                                options={['Ezaz', 'Ravi', 'Chirag Pandey', 'Gautam Sir', 'Aslam Bhai']}
                                value={pitchReport.telecaller_name} onChange={handlePitchReportChange} />
                            <SelectField className='col-md-6 fv-row mb-7' label='Interest Level' name='interest_level' htmlFor='interest_level' options={['LOW', 'MEDIUM', 'HIGH']} value={pitchReport.interest_level} onChange={handlePitchReportChange} />
                            <InputField type='date' className='col-md-6 fv-row mb-7' label='Follow Up Date' name='follow_up_date' htmlFor='follow_up_date' value={pitchReport.follow_up_date} onChange={handlePitchReportChange} />
                            <div className='col-md-12 fv-row mb-7'>
                                <label className='form-label fw-bolder text-dark fs-6'>Objections</label>
                                <textarea className='form-control form-control-solid' rows={3} placeholder='Enter any objections here...' name='objections' value={pitchReport.objections} onChange={handlePitchReportChange} />
                            </div>
                            <div className='col-md-12 fv-row mb-7'>
                                <label className='form-label fw-bolder text-dark fs-6'>
                                    Call Recording
                                    <span className='text-muted fs-7 fw-normal ms-2'>(optional)</span>
                                </label>
                                {pitchReport.call_recording instanceof File ? (
                                    <div className='d-flex align-items-center gap-3 mt-2'>
                                        <i className='bi bi-file-earmark-music fs-2 text-primary'></i>
                                        <span className='text-gray-700 fw-semibold'>{(pitchReport.call_recording as File).name}</span>
                                        <button
                                            type='button'
                                            className='btn btn-sm btn-icon btn-danger'
                                            onClick={() => setPitchReport(prev => ({ ...prev, call_recording: null }))}
                                        >
                                            <i className='bi bi-x'></i>
                                        </button>
                                    </div>
                                ) : typeof pitchReport.call_recording === 'string' && pitchReport.call_recording !== '' ? (
                                    <div className='d-flex flex-column gap-3 mt-2'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <audio controls src={pitchReport.call_recording} style={{ height: '40px' }}>
                                                Your browser does not support the audio element.
                                            </audio>
                                            <button
                                                type='button'
                                                className='btn btn-sm btn-icon btn-danger'
                                                onClick={() => setPitchReport(prev => ({ ...prev, call_recording: null }))}
                                                title='Remove Recording'
                                            >
                                                <i className='bi bi-trash'></i>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type='file'
                                        accept='audio/*'
                                        className='form-control form-control-solid'
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null
                                            setPitchReport(prev => ({ ...prev, call_recording: file }))
                                        }}
                                    />
                                )}
                            </div>
                            <div className='col-md-12 mt-4 d-flex justify-content-end'>
                                <TableButton action='add' text={isSubmitting ? 'Saving...' : 'Save Report'} showIcon={false} backgroundDark={true} onClick={handleSavePitchReport} disabled={isSubmitting} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UpdateFollowUpReport