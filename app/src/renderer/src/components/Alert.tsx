import { useEffect, useState } from 'react'

interface AlertProps {
  message: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  dismissible?: boolean
  timeout?: number
}

export const Alert = ({
  message,
  type = 'info',
  dismissible = true,
  timeout = 5000,
}: AlertProps) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!timeout) return
    const timer = setTimeout(() => setVisible(false), timeout)
    return () => clearTimeout(timer)
  }, [timeout])

  if (!visible) return null

  return (
    <div
      className={`alert alert-${type} shadow rounded-3 position-fixed`}
      style={{
        bottom: '20px',
        right: '20px',
        zIndex: 1055,
        minWidth: '280px',
        maxWidth: '90%',
        animation: 'slideUpFade 0.4s ease-out',
      }}
      role="alert"
    >
      <div className="d-flex justify-content-between align-items-start">
        <div className="me-3">{message}</div>
        {dismissible && (
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setVisible(false)}
          ></button>
        )}
      </div>
    </div>
  )
}
