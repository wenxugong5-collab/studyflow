/**
 * 任务表单组件
 * 用于添加新任务或编辑已有任务
 */
import { useState } from 'react'
import styles from './TaskForm.module.css'

interface TaskFormProps {
  initialTitle?: string
  initialSubject?: string
  initialDuration?: number
  onSubmit: (data: { title: string; subject: string; duration: number }) => void
  onCancel?: () => void
  submitLabel?: string
}

export default function TaskForm({
  initialTitle = '',
  initialSubject = '',
  initialDuration = 25,
  onSubmit,
  onCancel,
  submitLabel = '添加任务',
}: TaskFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [subject, setSubject] = useState(initialSubject)
  const [duration, setDuration] = useState(initialDuration)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // 任务名称不能为空
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      subject: subject.trim() || '其他',
      duration,
    })
  }

  const isDisabled = !title.trim()

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* 任务名称 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>任务名称</label>
        <input
          className={styles.input}
          type="text"
          placeholder="例如：复习数学第三章"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* 科目和时长（同一行） */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label className={styles.label}>科目</label>
          <input
            className={styles.input}
            type="text"
            placeholder="例如：数学"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>预计时长（分钟）</label>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={480}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 25)}
          />
        </div>
      </div>

      {/* 按钮 */}
      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={isDisabled}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={styles.btnSecondary} onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </form>
  )
}
