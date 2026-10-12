/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { FileUploadToFGGroup, GetNextCode } from '../../../Functions/FGGroup'
import { CreateAdajanBranchEmployee } from '../../../Functions/FGGroup/AdajanBranchEmployee'
import { GetNextEmployeeCode } from '../../../Functions/FGGroup/Employee'
import TableButton from '../../../components/TableButton'

// Add interfaces for location data
type Country = {
    id: number
    name: string
    iso2: string
}

type State = {
    id: number
    name: string
    country_id: number
    country_code: string
    state_code: string
}

type City = {
    id: number
    name: string
    state_id: number
    state_code: string
    country_id: number
    country_code: string
    latitude: string
    longitude: string
}

const AdajanBranchEmployeeAdd: React.FC = () => {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // const [employee_code, setEmployee_code] = useState()
    const [nextCode, setNextCode] = useState('')

    // Add state variables for location data
    const [countries, setCountries] = useState<Country[]>([])
    const [states, setStates] = useState<State[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [loadingCountries, setLoadingCountries] = useState(false)
    const [loadingStates, setLoadingStates] = useState(false)
    const [loadingCities, setLoadingCities] = useState(false)

    const [employeeData, setEmployeeData] = useState({
        employee_code: '',
        name: '',
        position: '',
        salary: '',
        bank_name: '',
        account_details: '',
        IFSC: '',
        email: '',
        mobile: '',
        blood_group: '',
        address: '',
        address_line_1: '',
        address_country: '',
        address_state: '',
        address_city: '',
        address_pin_code: '',
        photo: '',
        proof: '',
        document: '',
        in_time: '',
        out_time: '',
        joining_date: '',
    })

    const [family_details, setFamilyDetails] = useState([{
        name: '',
        mobile: ''
    }])
    const fetchNextCode = async () => {
        try {
            const response: any = await GetNextCode()
            setNextCode(response.data.code)
            setEmployeeData((prev) => ({ ...prev, employee_code: response.data.code }))
        } catch (error) {
            console.error('Error fetching code:', error)
            toast.error('Failed to fetch client code')
        }
    }

    const handleFamilyChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        const updatedDetails = [...family_details];

        // Ensure 'name' is a valid key of FamilyMember
        if (name in updatedDetails[index]) {
            updatedDetails[index] = {
                ...updatedDetails[index],
                [name]: value,
            };
            setFamilyDetails(updatedDetails);
        }
    };

    const addPlan = (event: any) => {
        event.preventDefault()
        setFamilyDetails([
            ...family_details,
            {
                name: '',
                mobile: ''
            },
        ])
    }

    const removePlan = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const copy = [...family_details]
        copy.splice(index, 1);
        setFamilyDetails(copy);
    }

    const validateFamilyDetails = (): boolean => {
        for (let i = 0; i < family_details.length; i++) {
            const member = family_details[i];

            if (!member.name.trim()) {
                toast.error(`Family Details is required`);
                return false;
            }

            if (!member.mobile.trim()) {
                toast.error(`Family Details Contact number is required`);
                return false;
            }

            if (!/^\d{10}$/.test(member.mobile.trim())) {
                toast.error(`Family Details ${i + 1}: Enter a valid 10-digit number`);
                return false;
            }
        }

        return true;
    };


    // const fetchEmployeeData = async (page?: number) => {
    //     try {
    //         const response: any = await GetNextEmployeeCode()
    //         setEmployee_code(response.data.employee_code)
    //     } catch (error) {
    //         console.error(error)
    //     }
    // }

    useEffect(() => {
        // fetchEmployeeData()
        fetchNextCode()
        fetchCountries() // Load countries on component mount
    }, [])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target

        // Handle country change - fetch states when country changes
        if (name === 'address_country') {
            const data = { ...employeeData, [name]: value }
            setEmployeeData(data)
            fetchStates(value)
            // Reset state and city when country changes
            setEmployeeData((prev) => ({
                ...prev,
                address_country: value,
                address_state: '',
                address_city: '',
            }))
            setStates([])
            setCities([])
            return
        }

        // Handle state change - fetch cities when state changes
        if (name === 'address_state') {
            const data = { ...employeeData, [name]: value }
            setEmployeeData(data)
            // Find the selected state object to get the state name
            const selectedState = states.find((state) => state.name === value)
            if (selectedState && employeeData.address_country) {
                fetchCities(employeeData.address_country, selectedState.name)
            }
            // Reset city when state changes
            setEmployeeData((prev) => ({
                ...prev,
                address_state: value,
                address_city: '',
            }))
            setCities([])
            return
        }

        setEmployeeData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, files } = event.target as HTMLInputElement
        if (files && files[0]) {
            setEmployeeData((prevData) => ({
                ...prevData,
                [name]: files[0],
            }))
        }
    }

    const handleAddButtonClick = async () => {

        if (!validateFamilyDetails()) {
            return;
        }

        try {
            setIsSubmitting(true)
            let imgUrl = ''
            let proofUrl = ''
            let docUrl = ''

            if (employeeData.photo) {
                const imageUrl: any = await FileUploadToFGGroup([employeeData.photo], {
                    directory: 'files',
                })
                imgUrl = imageUrl.data?.fileURLs[0]
                toast.success('Image uploaded successfully')
            }

            if (employeeData.document) {
                const proofDataUrl: any = await FileUploadToFGGroup([employeeData.proof], {
                    directory: 'files',
                })
                proofUrl = proofDataUrl.data?.fileURLs[0]
                toast.success('Proof uploaded successfully')
            }

            if (employeeData.document) {
                const documentUrl: any = await FileUploadToFGGroup([employeeData.document], {
                    directory: 'files',
                })
                docUrl = documentUrl.data?.fileURLs[0]
                toast.success('Document uploaded successfully')
            }

            const payload: any = {
                employee_code: employeeData.employee_code,
                name: employeeData.name,
                position: employeeData.position,
                salary: employeeData.salary,
                account_details: {
                    bank_name: employeeData.bank_name,
                    account_number: employeeData.account_details,
                    IFSC: employeeData.IFSC,
                },
                email: employeeData.email,
                mobile: employeeData.mobile,
                blood_group: employeeData.blood_group,
                family_details: family_details,
                address: employeeData.address,
                address_details: {
                    address_line_1: employeeData.address_line_1,
                    country: employeeData.address_country,
                    state: employeeData.address_state,
                    city: employeeData.address_city,
                    pin_code: employeeData.address_pin_code,
                },
                photo: imgUrl,
                proof: proofUrl,
                document: docUrl,
                in_time: employeeData.in_time,
                out_time: employeeData.out_time,
                joining_date: employeeData?.joining_date,
            }

            await CreateAdajanBranchEmployee(payload)

            toast.success('Employee added successfully')
            setIsSubmitting(false)

            navigate('/adajan-branch/employee/list')
        } catch (error: any) {
            console.error(error)
            const errorMessage = error.message
                ? (typeof error.message === 'object' ? JSON.stringify(error.message) : error.message)
                : 'Something went wrong';

            toast.error(errorMessage)
            setIsSubmitting(false)
        }
    }

    // Add API functions for fetching location data
    const fetchCountries = async () => {
        setLoadingCountries(true)
        try {
            // Using a free API for countries data
            const response = await fetch('https://countriesnow.space/api/v0.1/countries')
            const data = await response.json()
            if (data && data.data) {
                // Transform the data to match our Country interface
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

    const fetchStates = async (countryCode: string) => {
        if (!countryCode) {
            setStates([])
            setCities([])
            return
        }

        setLoadingStates(true)
        try {
            // Using a free API for states data
            const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ country: countryCode }),
            })
            const data = await response.json()
            if (data && data.data && data.data.states) {
                // Transform the data to match our State interface
                const statesData = data.data.states.map((state: any, index: number) => ({
                    id: index,
                    name: state.name,
                    country_id: 0, // Not provided by API
                    country_code: countryCode,
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

    const fetchCities = async (countryCode: string, stateName: string) => {
        if (!countryCode || !stateName) {
            setCities([])
            return
        }

        setLoadingCities(true)
        try {
            // Using a free API for cities data
            const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    country: countryCode,
                    state: stateName,
                }),
            })
            const data = await response.json()
            if (data && data.data) {
                // Transform the data to match our City interface
                const citiesData = data.data.map((city: string, index: number) => ({
                    id: index,
                    name: city,
                    state_id: 0, // Not provided by API
                    state_code: '',
                    country_id: 0, // Not provided by API
                    country_code: countryCode,
                    latitude: '',
                    longitude: '',
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

    return (
        <>
            <PageTitle breadcrumbs={[]}>Add Employee</PageTitle>
            <div className='row'>
                <div className='col-12 mt-3'>
                    <div className='card py-10'>
                        <div className='card-body'>
                            <div className='row'>
                                <div className='col-md-12'>
                                    <h2 className='mb-5'>Personal Details:</h2>
                                    <div className='row'>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                // placeholder='Employee Code'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='employee_code'
                                                label='Employee Code'
                                                htmlFor='employee_code'
                                                // value={
                                                //     employeeData.employee_code ? employeeData.employee_code : employee_code
                                                // }
                                                placeholder='Enter Employee Code'
                                                value={employeeData.employee_code}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-md-7'>
                                            <InputField
                                                placeholder='Joining Date'
                                                type='date'
                                                className='col-12 fv-row mb-7'
                                                name='joining_date'
                                                label='Joining Date'
                                                htmlFor='joining_date'
                                                value={employeeData.joining_date}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Name'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='name'
                                                label='Name'
                                                htmlFor='name'
                                                value={employeeData.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <SelectField
                                                className='col-12 fv-row'
                                                name='position'
                                                label='Position'
                                                htmlFor='position'
                                                value={employeeData.position}
                                                onChange={handleInputChange}
                                                options={[
                                                    'Trainer',
                                                    'Yoga',
                                                    'Zumba',
                                                    'Dietician',
                                                    'Admin',
                                                    'Others',
                                                ]}
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Salary'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='salary'
                                                label='Salary'
                                                htmlFor='salary'
                                                value={employeeData.salary}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Mobile No.'
                                                type='number'
                                                className='col-12 fv-row mb-7'
                                                name='mobile'
                                                label='Mobile No.'
                                                htmlFor='mobile'
                                                value={employeeData.mobile}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <SelectField
                                            className='col-md-4 fv-row mb-7'
                                            name='blood_group'
                                            label='Blood Group'
                                            htmlFor='bloodGroup'
                                            value={employeeData.blood_group}
                                            onChange={handleInputChange}
                                            options={[
                                                'A+',
                                                'A-',
                                                'B+',
                                                'B-',
                                                'AB+',
                                                'AB-',
                                                'O+',
                                                'O-',
                                            ]}
                                        />
                                        {/* <div className='col-md-3 fv-row mb-7'>
                                            <InputField
                                                placeholder='Address'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='address'
                                                label='Address'
                                                htmlFor='address'
                                                value={employeeData.address}
                                                onChange={handleInputChange}
                                            />
                                        </div> */}
                                        <div className='col-md-4 fv-row'>
                                            <InputField
                                                placeholder='Email'
                                                type='text'
                                                className='col-12 fv-row'
                                                name='email'
                                                label='Email'
                                                htmlFor='email'
                                                value={employeeData.email}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className='col-md-12 mt-3'>
                                            <h2 className='mb-5'>Address Details:</h2>
                                            <div className='row'>
                                                <SelectField
                                                    className='col-md-4 fv-row mb-7'
                                                    label='Country'
                                                    name='address_country'
                                                    value={employeeData.address_country}
                                                    onChange={handleInputChange}
                                                    htmlFor='address_country'
                                                    options={countries.map((country) => country.name)}
                                                    disabled={loadingCountries}
                                                />
                                                <SelectField
                                                    className='col-md-4 fv-row mb-7'
                                                    label='State'
                                                    name='address_state'
                                                    value={employeeData.address_state}
                                                    onChange={handleInputChange}
                                                    htmlFor='address_state'
                                                    options={states.map((state) => state.name)}
                                                    disabled={loadingStates || !employeeData.address_country}
                                                />
                                                <SelectField
                                                    className='col-md-4 fv-row mb-7'
                                                    label='City'
                                                    name='address_city'
                                                    value={employeeData.address_city}
                                                    onChange={handleInputChange}
                                                    htmlFor='address_city'
                                                    options={cities.map((city) => city.name)}
                                                    disabled={loadingCities || !employeeData.address_state}
                                                />
                                                <InputField
                                                    className='col-md-8 fv-row mb-7'
                                                    label='Address'
                                                    placeholder='Enter Address'
                                                    type='text'
                                                    name='address_line_1'
                                                    htmlFor='address_line_1'
                                                    value={employeeData.address_line_1}
                                                    onChange={handleInputChange}
                                                />
                                                <InputField
                                                    className='col-md-4 fv-row mb-7'
                                                    label='Postal/Zip Code'
                                                    placeholder='Enter Postal/Zip Code'
                                                    type='text'
                                                    name='address_pin_code'
                                                    htmlFor='address_pin_code'
                                                    value={employeeData.address_pin_code}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <div className='col-md-12 mt-3'>
                                            <h2 className='mb-5'>Family Details:</h2>
                                            <div className='row'>
                                                {family_details.map((family, index) => (
                                                    <div className='row' key={index}>
                                                        <div className='col-md-5 fv-row'>
                                                            <InputField
                                                                placeholder='Name'
                                                                type='text'
                                                                className='col-12 fv-row'
                                                                name="name"
                                                                label='Name'
                                                                htmlFor="name"
                                                                value={family.name}
                                                                onChange={(e: any) => handleFamilyChange(index, e)}
                                                            />
                                                        </div>
                                                        <div className='col-md-5 fv-row'>
                                                            <InputField
                                                                placeholder='Contact Number'
                                                                type='number'
                                                                className='col-12 fv-row'
                                                                name="mobile"
                                                                label='Contact Number'
                                                                htmlFor="number"
                                                                value={family.mobile}
                                                                onChange={(e: any) => handleFamilyChange(index, e)}
                                                            />
                                                        </div>
                                                        {family_details.length > 1 && index != 0 ? <div className='col-2 d-flex  align-items-center'>
                                                            <div className='d-flex mt-5 justify-content-center align-items-center'>
                                                                <TableButton
                                                                    action='remove'
                                                                    backgroundDark={true}
                                                                    onClick={(e) => removePlan(index, e)}
                                                                />
                                                            </div>
                                                        </div> : ""}
                                                    </div>
                                                ))}

                                            </div>
                                        </div>

                                        <div className='col-12 my-3 d-flex justify-content-end'>
                                            <button
                                                className='btn-primary btn gap-2 mx-2 btn-sm me-1'
                                                onClick={(e) => addPlan(e)}>
                                                <strong><big>+</big></strong> Add
                                            </button>
                                        </div>
                                        <div className='col-md-12 mt-3'>
                                            <h2 className='mb-5'>Account Details:</h2>
                                            <div className='row'>
                                                <div className='col-md-4 fv-row mb-7'>
                                                    <InputField
                                                        placeholder='Bank Name'
                                                        type='text'
                                                        className='col-12 fv-row mb-7'
                                                        name='bank_name'
                                                        label='Bank Name'
                                                        htmlFor='bank_name'
                                                        value={employeeData.bank_name}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className='col-md-4 fv-row mb-7'>
                                                    <InputField
                                                        placeholder='Account No.'
                                                        type='text'
                                                        className='col-12 fv-row mb-7'
                                                        name='account_details'
                                                        label='Account No.'
                                                        htmlFor='account_details'
                                                        value={employeeData.account_details}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className='col-md-4 fv-row mb-7'>
                                                    <InputField
                                                        placeholder='IFSC Code'
                                                        type='text'
                                                        className='col-12 fv-row mb-7'
                                                        name='IFSC'
                                                        label='IFSC Code'
                                                        htmlFor='IFSC'
                                                        value={employeeData.IFSC}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Upload Photo'
                                                type='file'
                                                className='col-12 fv-row mb-7'
                                                name='photo'
                                                label='Upload Photo'
                                                htmlFor='photo'
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Upload Proof'
                                                type='file'
                                                className='col-12 fv-row mb-7'
                                                name='proof'
                                                label='Upload Proof'
                                                htmlFor='proof'
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Upload Pdf'
                                                type='file'
                                                className='col-12 fv-row mb-7'
                                                name='document'
                                                label='Upload Pdf'
                                                htmlFor='document'
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className='col-md-12 mt-3'>
                                            <h2 className='mb-5'>Shift Time:</h2>
                                            <div className='row'>
                                                <div className='col-md-4 fv-row mb-md-7'>
                                                    <InputField
                                                        placeholder='In-Time'
                                                        type='time'
                                                        className='col-12 fv-row mb-7'
                                                        name='in_time'
                                                        label='In-Time'
                                                        htmlFor='in_time'
                                                        value={employeeData.in_time}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className='col-md-4 fv-row mb-md-7'>
                                                    <InputField
                                                        placeholder='Out-Time'
                                                        type='time'
                                                        className='col-12 fv-row mb-7'
                                                        name='out_time'
                                                        label='Out-Time'
                                                        htmlFor='out_time'
                                                        value={employeeData.out_time}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
                                            <button
                                                type='button'
                                                className='btn btn-success mx-2 mb-4'
                                                onClick={handleAddButtonClick}
                                                disabled={isSubmitting}>
                                                {isSubmitting ? 'Submitting...' : 'Submit'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export { AdajanBranchEmployeeAdd }
