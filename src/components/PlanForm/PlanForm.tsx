/**
 * 学习计划表单组件
 * 用于新建或编辑学习计划
 */
import { useState } from 'react'
import styles from './PlanForm.module.css'

interface PlanFormProps {
  initialData?: {
    name: string
    subject: string
    goal: string
    startDate: string
    endDate: string
    dailyMinutes: number
    note: string
  }
  onSubmit: (data: {
    name: string
    subject: string
    goal: string
    startDate: string
    endDate: string
    dailyMinutes: number
    note: string
  }) => void
  onCancel: () => void
  submitLabel?: string
}

export default function PlanForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = '创建计划',
}: PlanFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [subject, setSubject] = useState(initialData?.subject || '')
  const [goal, setGoal] = useState(initialData?.goal || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [dailyMinutes, setDailyMinutes] = useState(initialData?.dailyMinutes || 30)
  const [note, setNote] = useState(initialData?.note || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = '请输入计划名称'
    }
    if (!subject.trim()) {
      newErrors.subject = '请输入科目'
    }
    if (!endDate) {
      newErrors.endDate = '请选择截止日期'
    }
    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = '截止日期不能早于开始日期'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      name: name.trim(),
      subject: subject.trim(),
      goal: goal.trim(),
      startDate,
      endDate,
      dailyMinutes,
      note: note.trim(),
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* 计划名称 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          计划名称<span className={styles.required}>*</span>
        </label>
        <input
          className={styles.input}
          type="text"
          placeholder="例如：高等数学期中复习"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <span className={styles.error}>{errors.name}</span>}
      </div>

      {/* 科目 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          科目<span className={styles.required}>*</span>
        </label>
        <input
          className={styles.input}
          type="text"
          placeholder="例如：数学"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        {errors.subject && <span className={styles.error}>{errors.subject}</span>}
      </div>

      {/* 学习目标 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>学习目标</label>
        <textarea
          className={styles.textarea}
          placeholder="描述你的学习目标..."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </div>

      {/* 开始日期和截止日期 */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label className={styles.label}>开始日期</label>
          <input
            className={styles.input}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            截止日期<span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {errors.endDate && <span className={styles.error}>{errors.endDate}</span>}
        </div>
      </div>

      {/* 每日学习时长 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>每日建议学习时长（分钟）</label>
        <input
          className={styles.input}
          type="number"
          min={5}
          max={480}
          value={dailyMinutes}
          onChange={(e) => setDailyMinutes(Number(e.target.value) || 30)}
        />
      </div>

      {/* 备注 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>备注</label>
        <input
          className={styles.input}
          type="text"
          placeholder="其他备注信息..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* 按钮 */}
      <div className={styles.actions}>
        <button type="submit" className={styles.btnPrimary}>
          {submitLabel}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  )
}
