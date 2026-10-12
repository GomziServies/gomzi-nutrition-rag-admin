import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { FileUploadToFGGroup, GetNextCode } from '../../../Functions/FGGroup'
import { CreateAdajanBranchClient } from '../../../Functions/FGGroup'

// Type definitions
interface Country {
  id: string
  name: string
  iso2: string
}

interface State {
  id: number
  name: string
  country_code: string
  state_code: string
}

interface City {
  id: number
  name: string
}

type TrainerBookings = {
  [key: number]: {
    [key: string]: number
  }
}

// Dummy Data - Replace with API calls later
const DUMMY_DATA = {
  timeSlots: [
    '5:00 AM - 6:00 AM',
    '6:00 AM - 7:00 AM',
    '7:00 AM - 8:00 AM',
    '8:00 AM - 9:00 AM',
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM',
    '7:00 PM - 8:00 PM',
    '8:00 PM - 9:00 PM',
    '9:00 PM - 10:00 PM',
    '10:00 PM - 11:00 PM',
    '11:00 PM - 12:00 AM',

  ],
  trainers: [
    { id: 1, name: 'Rahul Sharma', specialization: 'Weight Loss' },
    { id: 2, name: 'Priya Patel', specialization: 'Weight Gain' },
    { id: 3, name: 'Amit Kumar', specialization: 'Muscle Building' },
    { id: 4, name: 'Sneha Desai', specialization: 'General Fitness' },
    { id: 5, name: 'Vikram Singh', specialization: 'Strength Training' },
    { id: 6, name: 'Ravi Mehta', specialization: 'Cardio Training' },
    { id: 7, name: 'Anjali Shah', specialization: 'Body Toning' }
  ],
  trainerBookings: {
    1: { '8:00 AM - 9:00 AM': 2, '9:00 AM - 10:00 AM': 3, '10:00 AM - 11:00 AM': 1 },
    2: { '8:00 AM - 9:00 AM': 1, '10:00 AM - 11:00 AM': 2, '6:00 PM - 7:00 PM': 3 },
    3: { '8:00 AM - 9:00 AM': 3, '9:00 AM - 10:00 AM': 2, '7:00 AM - 8:00 AM': 1 },
    4: { '7:00 AM - 8:00 AM': 1, '8:00 AM - 9:00 AM': 2, '7:00 PM - 8:00 PM': 3 },
    5: { '9:00 AM - 10:00 AM': 1, '6:00 PM - 7:00 PM': 2, '8:00 PM - 9:00 PM': 3 },
    6: { '6:00 AM - 7:00 AM': 2, '7:00 AM - 8:00 AM': 3, '5:00 PM - 6:00 PM': 1 },
    7: { '10:00 AM - 11:00 AM': 3, '11:00 AM - 12:00 PM': 2, '6:00 PM - 7:00 PM': 1 }
  } as TrainerBookings
}

const MAX_CLIENTS_PER_TRAINER = 3

const AdajanBranchClientAdd: React.FC = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Location data states
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [nextCode, setNextCode] = useState('')

  const [formData, setFormData] = useState({
    clientCode: '',
    name: '',
    phone: '',
    email: '',
    bloodGroup: '',
    country: '',
    state: '',
    city: '',
    address: '',
    pincode: '',
    gymWork: '',
    workoutTime: '',
    expiryDate: '',
    joiningDate: '',
    client_image: '', // For preview URL
    selectedFile: null as File | null, // For actual file
  })

  // Fetch Countries
  const fetchCountries = async () => {
    setLoadingCountries(true)
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries')
      const data = await response.json()
      if (data && data.data) {
        const countriesData = data.data.map((country: any) => ({
          id: country.iso2,
          name: country.country,
          iso2: country.iso2,
        }))
        setCountries(countriesData)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
      toast.error('Failed to load countries')
    } finally {
      setLoadingCountries(false)
    }
  }

  // Fetch States
  const fetchStates = async (countryName: string) => {
    if (!countryName) {
      setStates([])
      setCities([])
      return
    }

    setLoadingStates(true)
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: countryName }),
      })
      const data = await response.json()
      if (data && data.data && data.data.states) {
        const statesData = data.data.states.map((state: any, index: number) => ({
          id: index,
          name: state.name,
          country_code: countryName,
          state_code: state.state_code || '',
        }))
        setStates(statesData)
      }
    } catch (error) {
      console.error('Error fetching states:', error)
      toast.error('Failed to load states')
    } finally {
      setLoadingStates(false)
    }
  }
  const fetchNextCode = async () => {
    try {
      const response: any = await GetNextCode()
      if (response && response.data && response.data.code) {
        const code = String(response.data.code).padStart(4, '0')
        setNextCode(code)
        setFormData((prev) => ({ ...prev, clientCode: code }))
      }
    } catch (error) {
      console.error('Error fetching code:', error)
      toast.error('Failed to fetch client code')
    }
  }
  // Fetch Cities
  const fetchCities = async (countryName: string, stateName: string) => {
    if (!countryName || !stateName) {
      setCities([])
      return
    }

    setLoadingCities(true)
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: countryName,
          state: stateName,
        }),
      })
      const data = await response.json()
      if (data && data.data) {
        const citiesData = data.data.map((city: string, index: number) => ({
          id: index,
          name: city,
        }))
        setCities(citiesData)
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
      toast.error('Failed to load cities')
    } finally {
      setLoadingCities(false)
    }
  }

  // Load countries on mount
  useEffect(() => {
    fetchCountries()
    fetchNextCode()
  }, [])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, name, value } = event.target

    // Handle file input (like supplier component)
    if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
      const file = event.target.files[0]

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      setFormData((prevData) => ({
        ...prevData,
        selectedFile: file,
        client_image: URL.createObjectURL(file),
      }))
      return
    }

    // Handle country change
    if (name === 'country') {
      setFormData((prev) => ({
        ...prev,
        country: value,
        state: '',
        city: '',
        address: '',
        pincode: ''
      }))
      fetchStates(value)
      setStates([])
      setCities([])
      return
    }

    // Handle state change
    if (name === 'state') {
      setFormData((prev) => ({
        ...prev,
        state: value,
        city: '',
        address: '',
        pincode: ''
      }))
      if (value && formData.country) {
        fetchCities(formData.country, value)
      }
      setCities([])
      return
    }

    // Handle city change
    if (name === 'city') {
      setFormData((prev) => ({
        ...prev,
        city: value,
        address: '',
        pincode: ''
      }))
      return
    }

    setFormData({ ...formData, [name]: value })
  }

  const handleFileButtonClick = () => {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Validation (Client Code is NOT required - it's auto-generated)
    const requiredFields = {
      name: 'Name',
      phone: 'Phone Number',
      email: 'Email',
      joiningDate: 'Joining Date',
      expiryDate: 'Expiry Date',
      workoutTime: 'Workout Time'
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please enter ${label}`)
        return
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Phone number must be 10 digits')
      return
    }


    // Date validation - expiry date should be after joining date
    if (formData.expiryDate && formData.joiningDate) {
      const expiryDate = new Date(formData.expiryDate)
      const joiningDate = new Date(formData.joiningDate)

      if (expiryDate <= joiningDate) {
        toast.error('Expiry date must be after joining date')
        return
      }
    }

    try {
      setIsSubmitting(true)

      let imgUrl = ''

      // Upload image if selected (exactly like supplier component)
      if (formData.selectedFile) {
        const imageUrl: any = await FileUploadToFGGroup([formData.selectedFile], {
          directory: 'clients',
        })
        imgUrl = imageUrl.data?.fileURLs[0]
        toast.success('Image uploaded successfully')
      }

      // Prepare payload - ONLY send imgUrl if it exists (don't send empty string)
      const payload: any = {
        clientCode: formData.clientCode,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        bloodGroup: formData.bloodGroup,
        client_address: {
          address_line_1: formData.address,
          city: formData.city,
          state: formData.state,
          pin_code: formData.pincode,
          country: formData.country,
        },
        joiningDate: formData.joiningDate,
        expiryDate: formData.expiryDate,
        workoutTime: formData.workoutTime,
      }

      // Only add image if URL exists (like supplier component does with logo)
      if (imgUrl) {
        payload.image = imgUrl
      }

      // Call API
      const response = await CreateAdajanBranchClient(payload)

      toast.success('Client Added Successfully')


      // Reset form
      setFormData({
        clientCode: nextCode,
        name: '',
        phone: '',
        email: '',
        bloodGroup: '',
        country: '',
        state: '',
        city: '',
        address: '',
        pincode: '',
        gymWork: '',
        workoutTime: '',
        expiryDate: '',
        joiningDate: '',
        client_image: '',
        selectedFile: null,
      })

      // Navigate back to list after 1 second
      setTimeout(() => {
        navigate('/adajan-branch/client/list')
      }, 1000)

    } catch (error: any) {
      toast.error(error.message || 'Failed to add client')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate('/adajan-branch/client/list')
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Add New Client</PageTitle>

      <div className='row'>
        <div className='col-md-12 mt-3'>
          <div className='card'>
            <div className='card-body'>
              <p className='fw-bold fs-2 mb-4'>Add New Client</p>

              <form onSubmit={handleSubmit}>
                <div className='row'>
                  {/* Image left, Full Name / Email / Phone right */}
                  <div className='col-12 mb-5 d-flex flex-wrap gap-4 align-items-start'>
                    {/* Image Upload Section (Like Supplier) */}
                    <div className='text-center p-3'>
                      {/* <label className='fw-bold fs-6 mb-2'>Client Image</label> */}
                      <img
                        alt='Client Photo'
                        src={formData.client_image || '/media/logos/fwg-logo.png'}
                        style={{
                          borderRadius: '12px',
                          width: '200px',
                          height: '200px',
                          objectFit: 'cover',
                          display: 'inline-block',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: '1px solid #eee'
                        }}
                      />
                      <div>
                        <button
                          type='button'
                          className='mt-3 px-4 py-2 btn btn-success'
                          onClick={handleFileButtonClick}
                        >
                          Upload Photo
                        </button>
                        <input
                          type='file'
                          id='fileInput'
                          className='d-none'
                          accept='image/*'
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className='flex-grow-1 ms-3' style={{ minWidth: '260px' }}>
                      <div className='row'>
                        <InputField
                          className='col-md-6 fv-row mb-7'
                          label='Client Code'
                          placeholder='Enter Client Code'
                          type='text'
                          name='clientCode'
                          htmlFor='clientCode'
                          value={formData.clientCode}
                          onChange={handleInputChange}
                          labelMarginRemove={true}
                        />

                        <InputField
                          className='col-md-6 fv-row mb-7'
                          label='Full Name'
                          placeholder='Enter Full Name'
                          type='text'
                          name='name'
                          htmlFor='name'
                          value={formData.name}
                          onChange={handleInputChange}
                          labelMarginRemove={true} />
                      </div>

                      <div className='row'>
                        <InputField
                          className='col-md-6 fv-row mb-7'
                          label='Phone Number'
                          placeholder='Enter Phone Number'
                          type='tel'
                          name='phone'
                          htmlFor='phone'
                          value={formData.phone}
                          onChange={handleInputChange}
                          labelMarginRemove={true} />

                        <InputField
                          className='col-md-6 fv-row mb-7'
                          label='Email'
                          placeholder='Enter Email Address'
                          type='email'
                          name='email'
                          htmlFor='email'
                          value={formData.email}
                          onChange={handleInputChange}
                          labelMarginRemove={true} />
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <h3 className='col-12 mb-4 mt-3'>Address Details:</h3>

                  <div className='col-12 mb-3'>
                    <div className='row'>
                      {/* Country, State, City in one row (3 fields) */}
                      <SelectField
                        className='col-md-4 fv-row mb-7'
                        label='Country'
                        name='country'
                        value={formData.country}
                        onChange={handleInputChange}
                        htmlFor='country'
                        options={countries.map(country => country.name)}
                        disabled={loadingCountries}
                      />

                      <SelectField
                        className='col-md-4 fv-row mb-7'
                        label='State'
                        name='state'
                        value={formData.state}
                        onChange={handleInputChange}
                        htmlFor='state'
                        options={states.map(state => state.name)}
                        disabled={loadingStates || !formData.country}
                      />

                      <SelectField
                        className='col-md-4 fv-row mb-7'
                        label='City'
                        name='city'
                        value={formData.city}
                        onChange={handleInputChange}
                        htmlFor='city'
                        options={cities.map(city => city.name)}
                        disabled={loadingCities || !formData.state}
                      />

                      {/* Address - Full width */}
                      <InputField
                        className='col-md-8 fv-row mb-7'
                        label='Address'
                        placeholder='Enter Full Address'
                        type='text'
                        name='address'
                        htmlFor='address'
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!formData.city}
                        labelMarginRemove={true}
                      />

                      {/* Pincode */}
                      <InputField
                        className='col-md-4 fv-row mb-7'
                        label='Postal/Zip Code'
                        placeholder='Enter Postal/Zip Code'
                        type='text'
                        name='pincode'
                        htmlFor='pincode'
                        value={formData.pincode}
                        onChange={handleInputChange}
                        disabled={!formData.address}
                        labelMarginRemove={true}
                      />
                    </div>
                  </div>

                  {/* Joining Date & Expiry Date in one row (2 fields) */}
                  <div className='col-md-6 fv-row mb-md-7 mb-3'>
                    <label className='fw-bold fs-6 mb-2'>Joining Date</label>
                    <input
                      type='date'
                      name='joiningDate'
                      className='form-control inputfield-bg'
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className='col-md-6 fv-row mb-md-7 mb-3'>
                    <label className='fw-bold fs-6 mb-2'>Expiry Date</label>
                    <input
                      type='date'
                      name='expiryDate'
                      className='form-control inputfield-bg'
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Blood Group, In Time & Workout Time in one row (3 fields) */}
                  <SelectField className='col-md-6 fv-row mb-7' label='Blood Group' name='bloodGroup' value={formData.bloodGroup} onChange={handleInputChange} htmlFor='bloodGroup' options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />

                  <SelectField className='col-md-6 fv-row mb-7' label='Workout Time' name='workoutTime' value={formData.workoutTime} onChange={handleInputChange} htmlFor='workoutTime' options={DUMMY_DATA.timeSlots} />

                  {/* Action Buttons */}
                  <div className='col-md-12 fv-row mb-7 mt-5'>
                    <div className='d-flex justify-content-end gap-3'>
                      <button
                        type='button'
                        className='btn btn-secondary'
                        onClick={handleBack}
                        disabled={isSubmitting}
                      >
                        Back
                      </button>
                      <button
                        type='submit'
                        className={`btn btn-primary ${isSubmitting ? 'disabled' : ''}`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
                            Please wait...
                          </>
                        ) : (
                          'Add Client'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdajanBranchClientAdd