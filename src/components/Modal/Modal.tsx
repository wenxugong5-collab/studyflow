/**
 * 通用弹窗组件
 * 用于确认对话框和表单弹窗
 */
import type { ReactNode } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
}

export default function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

/** 确认弹窗 */
interface ConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
      <div className={styles.actions}>
        <button className={styles.btnCancel} onClick={onCancel}>
          取消
        </button>
        <button className={styles.btnConfirm} onClick={onConfirm}>
          确认删除
        </button>
      </div>
    </Modal>
  )
}
