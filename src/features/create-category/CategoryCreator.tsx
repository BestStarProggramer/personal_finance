import type { Category, TransactionType } from '../../entities/finance/model/types'
import CategoryEditor from '../manage-category/CategoryEditor'

type Props = { categories: Category[]; type: TransactionType; disabled?: boolean; onCreated: (name: string) => void }

export default function CategoryCreator({ categories, type, disabled, onCreated }: Props) {
  return <CategoryEditor categories={categories} fixedType={type} disabled={disabled}
    label="Добавить свою категорию" onSaved={onCreated} />
}
