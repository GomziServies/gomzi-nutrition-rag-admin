import React, { useEffect, useState } from 'react'

interface NumberTickerProps {
    value?: number
    text?: string | number
    prefix?: string
    suffix?: string
    className?: string
}

export const formatCurrencyCompact = (amount: any): string => {
    const num = Number(amount) || 0
    if (num >= 10000000) {
        return '₹' + (num / 10000000).toFixed(1) + ' Cr'
    } else if (num >= 100000) {
        return '₹' + (num / 100000).toFixed(1) + ' L'
    } else {
        return '₹' + num.toLocaleString()
    }
}

// 20-digit full rolling cycle reel: 0-9 followed by 0-9 so even 0 spins a full mechanical revolution!
const DIGIT_REEL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const NumberTicker: React.FC<NumberTickerProps> = ({
    value,
    text,
    prefix = '',
    suffix = '',
    className = '',
}) => {
    const rawTargetStr =
        text !== undefined && text !== null
            ? String(text)
            : value !== undefined && value !== null
            ? Math.abs(value).toLocaleString()
            : '0'

    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        setIsLoaded(false)
        const timer = setTimeout(() => {
            setIsLoaded(true)
        }, 50)
        return () => clearTimeout(timer)
    }, [rawTargetStr])

    const displayStr = `${prefix}${rawTargetStr}${suffix}`

    return (
        <span className={`gz-odometer ${className}`}>
            {displayStr.split('').map((char, idx) => {
                const isDigit = !isNaN(Number(char)) && char !== ' '
                if (!isDigit) {
                    return (
                        <span key={idx} className='gz-odometer-static'>
                            {char}
                        </span>
                    )
                }
                const targetDigit = Number(char)
                const targetPercent = (10 + targetDigit) * 5

                return (
                    <span key={idx} className='gz-odometer-digit-wrap'>
                        <span
                            className='gz-odometer-digit-strip'
                            style={{
                                transform: isLoaded ? `translateY(-${targetPercent}%)` : 'translateY(0%)',
                                transitionDelay: `${Math.min(idx * 40, 300)}ms`,
                            }}>
                            {DIGIT_REEL.map((n, i) => (
                                <span key={i} className='gz-odometer-digit'>
                                    {n}
                                </span>
                            ))}
                        </span>
                    </span>
                )
            })}
        </span>
    )
}

export default NumberTicker
