import { faCheck, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import {
	DeleteExam,
	DeleteQuestion,
	GetExam,
	GetFitnessCourse,
	UpdateExam,
	UpdateQuestion,
} from '../../../Functions/FGGroup'

const Exam = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const exam_id: any = searchParams.get('exam_id')!
	const [examData, setExamData] = useState<any>({})
	const [courses, setCourses] = useState([])
	const [selected, setSelected] = useState<{ label: string; value: string; exam_course: string }[]>(
		[]
	)
	const [shuffleQuestions, setShuffleQuestions] = useState(false)
	const [shuffleOptions, setShuffleOptions] = useState(false)
	const [canStartAnytime, setCanStartAnytime] = useState(false)
	const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)
	const [editingOptionIndex, setEditingOptionIndex] = useState<{
		questionIndex: number
		optionIndex: number
	} | null>(null)
	const [questions, setQuestions] = useState([])
	const [showAddQuestionForm, setShowAddQuestionForm] = useState(false)
	const [newQuestion, setNewQuestion] = useState({
		question: '',
		question_index: questions.length + 1,
		options: [{ option: '', is_correct: false }],
	})

	const handleAddQuestionClick = () => {
		setShowAddQuestionForm(true)
	}

	const handleNewQuestionChange = (e: any) => {
		setNewQuestion({ ...newQuestion, question: e.target.value })
	}

	const handleNewQuestionIndexChange = (e: any) => {
		setNewQuestion({ ...newQuestion, question_index: parseInt(e.target.value, 10) })
	}

	const handleNewOptionChange = (index: any, e: any) => {
		const updatedOptions = [...newQuestion.options]
		updatedOptions[index].option = e.target.value
		setNewQuestion({ ...newQuestion, options: updatedOptions })
	}

	const handleNewOptionCheckboxChange = (index: any) => {
		const updatedOptions = [...newQuestion.options]
		updatedOptions[index].is_correct = !updatedOptions[index].is_correct
		setNewQuestion({ ...newQuestion, options: updatedOptions })
	}

	const handleAddNewOption = () => {
		setNewQuestion({
			...newQuestion,
			options: [...newQuestion.options, { option: '', is_correct: false }],
		})
	}

	const handleSaveNewQuestion = async () => {
		if (!newQuestion.question) {
			return Swal.fire({
				icon: 'error',
				title: 'Question Empty',
				text: 'Please add text for question',
			})
		}

		if (!newQuestion.question_index) {
			return Swal.fire({
				icon: 'error',
				title: 'Question Index Empty',
				text: 'Please add text for question index',
			})
		}

		if (isNaN(newQuestion.question_index)) {
			return Swal.fire({
				icon: 'error',
				title: 'Question Index is not a number',
				text: 'Please add a valid number for question index',
			})
		}

		const totalOption = newQuestion.options.length

		if (totalOption === 0) {
			return Swal.fire({
				icon: 'error',
				title: 'No Option Found',
				text: 'Please add at least 1 option',
			})
		}

		const optionList = newQuestion.options.filter((option) => option.option.trim())
		const answerFound = optionList.some((option) => option.is_correct)

		if (optionList.length === 0) {
			return Swal.fire({
				icon: 'error',
				title: 'No Option Found',
				text: 'Please add at least 1 option',
			})
		}

		if (!answerFound) {
			return Swal.fire({
				icon: 'error',
				title: 'Correct Answer not found',
				text: 'Please select 1 correct answer.',
			})
		}

		const payload: any = {
			exam_id: exam_id,
			questions: [
				{
					type: 'MCQ',
					question: newQuestion.question.trim(),
					question_index: newQuestion.question_index,
					options: optionList,
				},
			],
		}

		try {
			await UpdateQuestion(payload)
			fetchData()
			Swal.fire({
				icon: 'success',
				title: 'Success',
				text: 'Question added successfully',
			})
			setShowAddQuestionForm(false)
			setNewQuestion({
				question: '',
				question_index: questions.length + 1,
				options: [{ option: '', is_correct: false }],
			})
		} catch (error: any) {
			Swal.fire({
				icon: 'error',
				title: 'ERROR',
				text: error.message,
			})
		}
	}

	const handleUpdateQuestion = async (questionIndex: number) => {
		const updatedQuestion: any = questions[questionIndex]

		if (!updatedQuestion.question) {
			return Swal.fire({
				icon: 'error',
				title: 'Question Empty',
				text: 'Please add text for question',
			})
		}

		if (!updatedQuestion.question_index) {
			return Swal.fire({
				icon: 'error',
				title: 'Question Index Empty',
				text: 'Please add text for question index',
			})
		}

		if (isNaN(updatedQuestion.question_index)) {
			return Swal.fire({
				icon: 'error',
				title: 'Question Index is not a number',
				text: 'Please add a valid number for question index',
			})
		}

		const totalOption = updatedQuestion.options.length

		if (totalOption === 0) {
			return Swal.fire({
				icon: 'error',
				title: 'No Option Found',
				text: 'Please add at least 1 option',
			})
		}

		const optionList = updatedQuestion.options.filter((option: any) => option.option.trim())
		const answerFound = optionList.some((option: any) => option.is_correct)

		if (optionList.length === 0) {
			return Swal.fire({
				icon: 'error',
				title: 'No Option Found',
				text: 'Please add at least 1 option',
			})
		}

		if (!answerFound) {
			return Swal.fire({
				icon: 'error',
				title: 'Correct Answer not found',
				text: 'Please select 1 correct answer.',
			})
		}

		// Exclude options with an empty _id from the payload
		const filteredOptions = optionList.map((option: any) => {
			const { _id, ...rest } = option
			if (!_id) {
				return { ...rest }
			}
			return option
		})

		const payload = {
			exam_id: exam_id,
			questions: [
				{
					_id: updatedQuestion._id,
					type: 'MCQ',
					question: updatedQuestion.question.trim(),
					question_index: updatedQuestion.question_index,
					options: filteredOptions,
				},
			],
		}

		try {
			await UpdateQuestion(payload)
			fetchData()
			Swal.fire({
				icon: 'success',
				title: 'Success',
				text: 'Question updated successfully',
			})
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const fetchCourses = async () => {
		try {
			const response: any = await GetFitnessCourse()
			const filteredCourses = response.data.filter(
				(course: any) => course.coaching_mode === 'VIRTUAL'
			)
			const formattedCourses = filteredCourses.map((course: any) => ({
				label: `${course.course_name} - ${course.coaching_mode}`,
				value: course._id,
				exam_course: course.course_name,
			}))
			setCourses(formattedCourses)
			return formattedCourses
		} catch (error: any) {
			console.error(error)
			return []
		}
	}

	const fetchData = async () => {
		try {
			const fetchedCourses = await fetchCourses()
			const response: any = await GetExam({ exam_id: exam_id })
			const data = response.data[0]
			setExamData(data)

			const selectedCourses = data.exam_course.map((courseId: string) => {
				const course = fetchedCourses.find((course: any) => course.value === courseId)
				return course ? course : { label: courseId, value: courseId, exam_course: courseId }
			})
			const questionsWithOptions = data.questions.map((question: any) => {
				const options = question.options.map((option: any) => ({
					...option,
					isChecked: false,
				}))

				return {
					...question,
					options,
				}
			})

			setQuestions(questionsWithOptions)
			setSelected(selectedCourses)
			setShuffleQuestions(data?.options.shuffle_questions)
			setShuffleOptions(data?.options.shuffle_options)
			setCanStartAnytime(data.can_start_anytime)
		} catch (error: any) {
			console.error(error)
		}
	}

	const updateExamData = async () => {
		try {
			const formDataWith: any = {
				exam_id,
				title: examData.title,
				description: examData.description,
				exam_language: examData?.options?.exam_language,
				duration: parseInt(examData?.options?.duration),
				delay_allowed: parseInt(examData.delay_allowed),
			}

			const selectedCourses = selected.map((course) => course.value)

			await UpdateExam({ ...formDataWith, exam_course: selectedCourses })
			toast.success('Exam Updated Successfully')

			setSelected([])
			navigate('/fgiit/exam')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const removeExamData = () => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to undo!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
		}).then((result) => {
			if (result.isConfirmed) {
				const payload = { exam_id }
				DeleteExam(payload)
					.then(() => {
						fetchData()
						toast.success('Exam Remove successfully')
						navigate('/fgiit/exam')
					})
					.catch((error: any) => {
						toast.error(error.message)
					})
			}
		})
	}

	const removeQuestion = (questionID: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to undo!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
		}).then((result) => {
			if (result.isConfirmed) {
				const payload = {
					exam_id: exam_id,
					question_id: questionID,
				}
				DeleteQuestion(payload)
					.then(() => {
						fetchData()
						Swal.fire('Success!', `Question Remove successfully!.`, 'success')
					})
					.catch((error) => {
						Swal.fire('Error!', 'There was an error updating the Removing Question.', 'error')
					})
			}
		})
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setExamData({ ...examData, [name]: value })
	}

	const handleShuffleQuestionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setShuffleQuestions(event.target.checked)
		setExamData({ ...examData, shuffle_questions: event.target.checked })
	}

	const handleShuffleOptionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setShuffleOptions(event.target.checked)
		setExamData({ ...examData, shuffle_options: event.target.checked })
	}

	const handleCanStartAnytimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCanStartAnytime(event.target.checked)
		setExamData({ ...examData, can_start_anytime: event.target.checked })
	}

	useEffect(() => {
		fetchCourses()
		fetchData()
	}, [])

	return (
		<>
			<div>
				<PageTitle breadcrumbs={[]}>Exam Details</PageTitle>
				<div className='row'>
					<div className='col-md-12 mt-3'>
						<div className='card py-10'>
							<h1 className='fw-bold text-dark fs-1 mt-0 m-6 '>Exam Details</h1>
							<div className='card-body row'>
								<InputField
									placeholder='Exam Title'
									type='text'
									className='col-md-6  fv-row mb-7'
									name='title'
									label='Enter Exam Title'
									htmlFor='title'
									value={examData.title}
									onChange={handleInputChange}
								/>
								<div className='col-md-6 '>
									<label
										htmlFor='selected'
										className='required fw-bold fs-6 mb-5'>
										Exam Course
									</label>
									<MultiSelect
										className='fv-row'
										options={courses}
										value={selected}
										onChange={setSelected}
										labelledBy='Select'
										hasSelectAll={false}
									/>
								</div>
								<InputField
									placeholder='Description'
									type='text'
									className='col-md-6  fv-row mb-7'
									name='description'
									label='Enter Description'
									htmlFor='description'
									value={examData.description}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Duration'
									type='number'
									className='col-md-6  fv-row mb-7'
									name='duration'
									label='Enter Duration'
									htmlFor='duration'
									value={examData?.options?.duration}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='in minute (ex. 5)'
									type='number'
									className='col-md-6  fv-row mb-7'
									name='delay_allowed'
									label='Delay Allowed'
									htmlFor='delay_allowed'
									value={examData?.options?.delay_allowed}
									onChange={handleInputChange}
								/>
								<SelectField
									className='col-6 fv-row m-0'
									label='Exam Language'
									name='exam_language'
									value={examData?.options?.exam_language}
									onChange={handleInputChange}
									htmlFor='exam_language'
									options={['English', 'Hindi']}
								/>

								{/* Shuffle Questions */}
								<div className='d-flex mt-5'>
									<div className='col-md-3 mb-7'>
										<div className='form-check'>
											<input
												className='form-check-input'
												type='checkbox'
												id='shuffleQuestions'
												checked={shuffleQuestions}
												onChange={handleShuffleQuestionsChange}
											/>
											<label
												className='form-check-label text-black'
												htmlFor='shuffleQuestions'>
												Shuffle Questions
											</label>
										</div>
									</div>

									<div className='col-md-3 mb-7'>
										<div className='form-check'>
											<input
												className='form-check-input'
												type='checkbox'
												id='shuffleOptions'
												checked={shuffleOptions}
												onChange={handleShuffleOptionsChange}
											/>
											<label
												className='form-check-label text-black'
												htmlFor='shuffleOptions'>
												Shuffle Options
											</label>
										</div>
									</div>

									<div className='col-md-3 mb-7'>
										<div className='form-check'>
											<input
												className='form-check-input'
												type='checkbox'
												id='canStartAnytime'
												checked={canStartAnytime}
												onChange={handleCanStartAnytimeChange}
											/>
											<label
												className='form-check-label text-black'
												htmlFor='canStartAnytime'>
												Can Start Anytime
											</label>
										</div>
									</div>
								</div>

								{/* Add Exam Button */}
								<div className='col-md-12 mt-3 d-flex justify-content-end'>
									<TableButton
										action='view'
										to={`/fgiit/allocate-exam?allocate_id=${exam_id}&exam_title=${examData.title}`}
										text='Allocate Exam'
										showIcon={false}
										backgroundDark={true}
									/>
									<TableButton
										action='edit'
										onClick={() => updateExamData()}
										text='Update'
										showIcon={false}
										backgroundDark={true}
									/>
									<TableButton
										action='remove'
										onClick={() => removeExamData()}
										text='Remove'
										showIcon={false}
										backgroundDark={true}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className='mt-5'>
				<h1 className='fw-bold text-dark fs-2 mb-4 mt-10 '>Exam Question</h1>

				{questions.length == 0 && !showAddQuestionForm ? (
					<div className='card py-7 px-5 my-6'>
						<h2>No Question Found</h2>
					</div>
				) : (
					<>
						{questions.map((question: any, questionIndex: number) => (
							<div
								className='card py-4 px-5 my-4'
								key={question._id}>
								<div>
									<div className='mb-4 col-md-2'>
										<label
											htmlFor={`question-index-${questionIndex}`}
											className='fw-bold fs-5'>
											Index:
										</label>
										<input
											type='number'
											id={`question-index-${questionIndex}`}
											className='form-control form-control-lg'
											value={question.question_index}
											onChange={(e) => {
												const updatedQuestions: any = [...questions]
												updatedQuestions[questionIndex].question_index = parseInt(
													e.target.value,
													10
												)
												setQuestions(updatedQuestions)
												setEditingQuestionIndex(questionIndex)
												setEditingOptionIndex(null) // Reset editing option index
											}}
										/>
									</div>
									<div className='mb-4'>
										<label
											htmlFor={`question-${questionIndex}`}
											className='fw-bold fs-5'>
											Question:
										</label>
										<input
											type='text'
											id={`question-${questionIndex}`}
											className='form-control form-control-lg'
											value={question.question}
											onChange={(e) => {
												const updatedQuestions: any = [...questions]
												updatedQuestions[questionIndex].question = e.target.value
												setQuestions(updatedQuestions)
												setEditingQuestionIndex(questionIndex)
												setEditingOptionIndex(null) // Reset editing option index
											}}
										/>
									</div>
									<div className='mb-4'>
										<div className='row d-flex'>
											{question.options.map((option: any, optionIndex: number) => (
												<div
													key={option._id}
													className='form-check col-md-3'>
													<input
														type='checkbox'
														className='form-check-input'
														id={`option-${questionIndex}-${optionIndex}`}
														checked={option.is_correct}
														onChange={() => {
															const updatedQuestions: any = [...questions]
															updatedQuestions[questionIndex].options[optionIndex].is_correct =
																!option.is_correct
															setQuestions(updatedQuestions)
															setEditingQuestionIndex(questionIndex)
															setEditingOptionIndex({ questionIndex, optionIndex })
														}}
													/>
													<input
														type='text'
														className='form-control'
														placeholder={option.option || 'Enter option'}
														value={option.option || ''}
														onChange={(e) => {
															const updatedQuestions: any = [...questions]
															updatedQuestions[questionIndex].options[optionIndex].option =
																e.target.value
															setQuestions(updatedQuestions)
															setEditingQuestionIndex(questionIndex)
															setEditingOptionIndex({ questionIndex, optionIndex })
														}}
													/>
												</div>
											))}
										</div>
									</div>
									<div className='modal-footer border-0 d-flex'>
										<button
											className='btn btn-info me-1 fs-24'
											onClick={() => {
												const updatedQuestions: any = [...questions]
												updatedQuestions[questionIndex].options.push({
													_id: '',
													option: '',
													is_correct: false,
												})
												setQuestions(updatedQuestions)
												setEditingQuestionIndex(questionIndex)
												setEditingOptionIndex(null) // Reset editing option index
											}}>
											<FontAwesomeIcon
												className='me-2'
												icon={faCheck}
											/>
											Add Option
										</button>
										{editingQuestionIndex === questionIndex && (
											<button
												className='btn btn-info me-1 fs-24'
												onClick={() => {
													handleUpdateQuestion(questionIndex)
												}}>
												<FontAwesomeIcon
													className='me-2'
													icon={faCheck}
												/>
												Update Question
											</button>
										)}
										<button
											className='btn btn-danger fs-29'
											onClick={() => removeQuestion(question._id)}>
											<FontAwesomeIcon icon={faTrash} />{' '}
										</button>
									</div>
								</div>
							</div>
						))}
						{showAddQuestionForm && (
							<div className='card py-4 px-5 my-4'>
								<div className='mb-4 col-md-2'>
									<label
										htmlFor='new-question-index'
										className='fw-bold fs-5'>
										Question:
									</label>
									<input
										placeholder='index'
										type='number'
										id='new-question-index'
										className='form-control'
										value={newQuestion.question_index}
										onChange={handleNewQuestionIndexChange}
									/>
								</div>
								<div className='mb-4'>
									<label
										htmlFor='new-question'
										className='fw-bold fs-5'>
										New Question:
									</label>
									<input
										type='text'
										id='new-question'
										className='form-control form-control-lg'
										value={newQuestion.question}
										onChange={handleNewQuestionChange}
									/>
								</div>
								<div className='mb-4'>
									<div className='row d-flex'>
										{newQuestion.options.map((option, index) => (
											<div
												key={index}
												className='form-check col-md-3'>
												<input
													type='checkbox'
													className='form-check-input'
													checked={option.is_correct}
													onChange={() => handleNewOptionCheckboxChange(index)}
												/>
												<input
													type='text'
													className='form-control'
													placeholder='Enter option'
													value={option.option}
													onChange={(e) => handleNewOptionChange(index, e)}
												/>
											</div>
										))}
									</div>
								</div>
								<div className='modal-footer border-0 d-flex'>
									<button
										className='btn btn-info me-1 fs-24'
										onClick={handleAddNewOption}>
										<FontAwesomeIcon
											className='me-2'
											icon={faCheck}
										/>
										Add Option
									</button>
									<button
										className='btn btn-primary me-1 fs-24'
										onClick={handleSaveNewQuestion}>
										<FontAwesomeIcon
											className='me-2'
											icon={faCheck}
										/>
										Save Question
									</button>
									<button
										className='btn btn-danger fs-29'
										onClick={() => setShowAddQuestionForm(false)}>
										<FontAwesomeIcon icon={faTrash} /> Cancel
									</button>
								</div>
							</div>
						)}
					</>
				)}

				<div className='modal-footer border-0 d-flex'>
					<div className='modal-footer border-0 d-flex'>
						<button
							className='btn btn-primary me-1 fs-24'
							onClick={handleAddQuestionClick}>
							<FontAwesomeIcon
								className='me-2'
								icon={faCheck}
							/>
							Add Question
						</button>
					</div>
				</div>
			</div>
		</>
	)
}
export { Exam }
