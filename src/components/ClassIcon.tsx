import { CLASSES, type ClassId } from '@/engine/classes'

type ClassIconProps = {
  classId: ClassId
}

/** 職業圖示；螢幕閱讀器讀出職業名稱 */
export function ClassIcon({ classId }: ClassIconProps) {
  const { icon, name } = CLASSES[classId]
  return (
    <span role="img" aria-label={name} title={name}>
      {icon}
    </span>
  )
}
