import React, { useState } from 'react'
import { Button, Form, Card, Row, Col } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CreateExpenseReport } from '../../../Functions/FGGroup/ExpenseReport'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'

interface ExpenseItem {
    type: string
    description: string
    amount: string
    file_url?: string // Add file_url to expense item
}

interface SelectedFile {
    file: File
    previewUrl: string
}

const EmployeeExpenseCreate: React.FC = () => {
    const navigate = useNavigate()
    
    const [purpose, setPurpose] = useState('')
    const [remarks, setRemarks] = useState('')
    const [expenses, setExpenses] = useState<ExpenseItem[]>([{ type: '', description: '', amount: '' }])
    const [selectedFiles, setSelectedFiles] = useState<{[key: number]: SelectedFile[]}>({}) // Store selected files per expense
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // Form validation errors
    const [errors, setErrors] = useState({
        purpose: '',
        expenses: '',
        files: ''
    })

    // Handle adding a new expense item
    const handleAddExpense = () => {
        setExpenses([...expenses, { type: '', description: '', amount: '' }])
    }

    // Handle removing an expense item
    const handleRemoveExpense = (index: number) => {
        if (expenses.length > 1) {
            const newExpenses = [...expenses]
            newExpenses.splice(index, 1)
            setExpenses(newExpenses)
            
            // Remove associated files
            const newSelectedFiles = {...selectedFiles}
            delete newSelectedFiles[index]
            setSelectedFiles(newSelectedFiles)
        }
    }

    // Handle expense item change
    const handleExpenseChange = (index: number, field: keyof ExpenseItem, value: string) => {
        const newExpenses = [...expenses]
        newExpenses[index][field] = value
        setExpenses(newExpenses)
        
        // Clear error when user starts typing
        if (errors.expenses) {
            setErrors(prev => ({ ...prev, expenses: '' }))
        }
    }

    // Handle file selection for a specific expense
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, expenseIndex: number) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const newSelectedFiles: SelectedFile[] = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            // Create a preview URL for display
            const previewUrl = URL.createObjectURL(file)
            newSelectedFiles.push({ file, previewUrl })
        }

        setSelectedFiles(prev => ({
            ...prev,
            [expenseIndex]: [...(prev[expenseIndex] || []), ...newSelectedFiles]
        }))
        e.target.value = '' // Reset file input
    }

    // Handle file removal for a specific expense
    const handleRemoveFile = (expenseIndex: number, fileIndex: number) => {
        const newSelectedFiles = {...selectedFiles}
        const removedFile = newSelectedFiles[expenseIndex].splice(fileIndex, 1)[0]
        // Revoke the preview URL to free memory
        URL.revokeObjectURL(removedFile.previewUrl)
        
        if (newSelectedFiles[expenseIndex].length === 0) {
            delete newSelectedFiles[expenseIndex]
        }
        
        setSelectedFiles(newSelectedFiles)
    }

    // Validate form
    const validateForm = () => {
        let isValid = true
        const newErrors = { purpose: '', expenses: '', files: '' }

        // Validate purpose
        if (!purpose.trim()) {
            newErrors.purpose = 'Purpose is required'
            isValid = false
        }

        // Validate expenses
        let hasValidExpense = false
        for (const expense of expenses) {
            if (expense.type.trim() && expense.amount && parseFloat(expense.amount) > 0) {
                hasValidExpense = true
                break
            }
        }

        if (!hasValidExpense) {
            newErrors.expenses = 'At least one valid expense is required'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    // Calculate total amount
    const calculateTotalAmount = () => {
        return expenses.reduce((total, expense) => {
            const amount = parseFloat(expense.amount) || 0
            return total + amount
        }, 0)
    }

    // Upload files for a specific expense and return their URLs
    const uploadFilesForExpense = async (expenseIndex: number): Promise<string[]> => {
        const files = selectedFiles[expenseIndex]
        if (!files || files.length === 0) return []

        const uploadedUrls: string[] = []
        
        try {
            for (const selectedFile of files) {
                // Pass the file as an array to FileUploadToFGGroup
                const response: any = await FileUploadToFGGroup([selectedFile.file])
                if (response && response.status === 200 && response.data?.fileURLs) {
                    // The file upload returns an array of file URLs, we take the first one
                    uploadedUrls.push(response.data.fileURLs[0])
                } else {
                    throw new Error(`Failed to upload file: ${selectedFile.file.name} - ${response?.message || 'Unknown error'}`)
                }
            }
        } catch (error) {
            console.error('File upload error:', error)
            throw error
        }
        
        return uploadedUrls
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) {
            toast.error('Please fix the errors before submitting')
            return
        }

        setLoading(true)
        setUploading(true)
        
        try {
            // Get employee ID from localStorage
            const fgGroupInfo = localStorage.getItem('fg_group_info')
            let employeeId = null
            if (fgGroupInfo) {
                const parsedInfo = JSON.parse(fgGroupInfo)
                employeeId = parsedInfo._id
            }

            if (!employeeId) {
                throw new Error('Employee ID not found')
            }

            // Upload files for each expense
            const expenseItems = []
            for (let i = 0; i < expenses.length; i++) {
                const expense = expenses[i]
                if (expense.type.trim() && expense.amount && parseFloat(expense.amount) > 0) {
                    // Upload files for this expense
                    const fileUrls = await uploadFilesForExpense(i)
                    
                    // Prepend base URL to file paths to create valid URIs
                    const fullFileUrls = fileUrls.map(url => 
                        url.startsWith('http') ? url : `${FG_GROUP_FILE_BASE_URL}/${url}`
                    )
                    
                    // Add expense with file URLs
                    expenseItems.push({
                        type: expense.type,
                        description: expense.description,
                        amount: parseFloat(expense.amount),
                        file_url: fullFileUrls.length > 0 ? fullFileUrls[0] : undefined // Take first file URL if exists
                    })
                }
            }

            const response = await CreateExpenseReport({
                employee_id: employeeId,
                purpose: purpose.trim(),
                expenses: expenseItems,
                remarks: remarks.trim()
            })

            if (response.status === 201) {
                toast.success('Expense report created successfully')
                navigate('/employee/expenses-list')
            } else {
                throw new Error(response.message || 'Failed to create expense report')
            }
        } catch (error: any) {
            console.error('Error creating expense report:', error)
            toast.error(error.message || 'Error creating expense report')
        } finally {
            setUploading(false)
            setLoading(false)
        }
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Create Expense Report</PageTitle>
            <KTCard>
                <div className='card-header border-0 pt-6'>
                    <div className='card-title'>
                        <h2>Create Expense Report</h2>
                    </div>
                </div>
                <div className='card-body'>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={12}>
                                <Form.Group className='mb-6'>
                                    <Form.Label>Purpose<span className='text-danger'>*</span></Form.Label>
                                    <Form.Control
                                        type='text'
                                        placeholder='Enter purpose of expense report'
                                        value={purpose}
                                        onChange={(e) => {
                                            setPurpose(e.target.value)
                                            if (errors.purpose) setErrors(prev => ({ ...prev, purpose: '' }))
                                        }}
                                        isInvalid={!!errors.purpose}
                                    />
                                    <Form.Control.Feedback type='invalid'>
                                        {errors.purpose}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className='mb-6'>
                                    <Form.Label>Remarks</Form.Label>
                                    <Form.Control
                                        as='textarea'
                                        rows={3}
                                        placeholder='Enter any additional remarks'
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Card className='mb-6'>
                            <Card.Header>
                                <div className='card-title'>
                                    <h3>Expenses</h3>
                                </div>
                                <div className='card-toolbar'>
                                    <Button 
                                        variant='primary' 
                                        onClick={handleAddExpense}
                                        size='sm'
                                    >
                                        <i className='fas fa-plus me-1'></i>Add Expense
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {expenses.map((expense, index) => (
                                    <Card key={index} className='mb-4'>
                                        <Card.Body>
                                            <Row>
                                                <Col md={4}>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Type<span className='text-danger'>*</span></Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            placeholder='e.g., Travel, Meal, etc.'
                                                            value={expense.type}
                                                            onChange={(e) => handleExpenseChange(index, 'type', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Description</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            placeholder='Enter description'
                                                            value={expense.description}
                                                            onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Amount (₹)<span className='text-danger'>*</span></Form.Label>
                                                        <Form.Control
                                                            type='number'
                                                            placeholder='0.00'
                                                            min='0'
                                                            step='0.01'
                                                            value={expense.amount}
                                                            onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={1} className='d-flex align-items-center mt-4'>
                                                    {expenses.length > 1 && (
                                                        <Button
                                                            variant='danger'
                                                            size='sm'
                                                            onClick={() => handleRemoveExpense(index)}
                                                        >
                                                            <i className='fas fa-trash'></i>
                                                        </Button>
                                                    )}
                                                </Col>
                                            </Row>
                                            
                                            {/* File upload for this specific expense */}
                                            <Row>
                                                <Col md={12}>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Upload Receipts/Documents for this expense</Form.Label>
                                                        <Form.Control
                                                            type='file'
                                                            multiple
                                                            onChange={(e) => handleFileSelect(e as any, index)}
                                                            disabled={uploading || loading}
                                                        />
                                                    </Form.Group>
                                                    
                                                    {selectedFiles[index] && selectedFiles[index].length > 0 && (
                                                        <div className='mt-2'>
                                                            <h6>Selected Files:</h6>
                                                            <div className='d-flex flex-wrap gap-2'>
                                                                {selectedFiles[index].map((selectedFile, fileIndex) => (
                                                                    <div key={fileIndex} className='d-flex align-items-center border rounded p-2'>
                                                                        <span className='me-2'>{selectedFile.file.name}</span>
                                                                        <Button
                                                                            variant='danger'
                                                                            size='sm'
                                                                            onClick={() => handleRemoveFile(index, fileIndex)}
                                                                            disabled={uploading || loading}
                                                                        >
                                                                            <i className='fas fa-times'></i>
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                ))}
                                
                                {errors.expenses && (
                                    <div className='text-danger mb-3'>{errors.expenses}</div>
                                )}
                                
                                <div className='d-flex justify-content-end'>
                                    <h4>Total Amount: ₹{calculateTotalAmount().toFixed(2)}</h4>
                                </div>
                            </Card.Body>
                        </Card>

                        <div className='d-flex justify-content-end gap-3'>
                            <Button 
                                variant='secondary' 
                                onClick={() => navigate('/employee/expenses-list')}
                                disabled={uploading || loading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant='primary' 
                                type='submit'
                                disabled={uploading || loading}
                            >
                                {uploading ? 'Creating...' : 'Create Expense Report'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </KTCard>
        </>
    )
}

export default EmployeeExpenseCreate