import { useState, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

interface UseCopyFeedbackOptions {
	timeout?: number
	successMessage?: string
}

export function useCopyFeedback(options: UseCopyFeedbackOptions = {}) {
	const { timeout = 1200, successMessage = 'Copied!' } = options
	const [copied, setCopied] = useState<boolean>(false)
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current)
			}
		}
	}, [])

	const copyToClipboard = useCallback(
		async (text: string, customMessage?: string) => {
			if (!text) return false

			try {
				if (navigator?.clipboard?.writeText) {
					await navigator.clipboard.writeText(text)
				} else {
					// Fallback for older contexts
					const textArea = document.createElement('textarea')
					textArea.value = text
					textArea.style.position = 'fixed'
					textArea.style.opacity = '0'
					document.body.appendChild(textArea)
					textArea.select()
					document.execCommand('copy')
					document.body.removeChild(textArea)
				}

				setCopied(true)
				toast.success(customMessage || successMessage)

				if (timerRef.current) {
					clearTimeout(timerRef.current)
				}

				timerRef.current = setTimeout(() => {
					setCopied(false)
				}, timeout)

				return true
			} catch (err) {
				console.error('Failed to copy text:', err)
				toast.error('Failed to copy to clipboard')
				setCopied(false)
				return false
			}
		},
		[timeout, successMessage]
	)

	return { copied, copyToClipboard }
}

export default useCopyFeedback
