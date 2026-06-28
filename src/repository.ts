import type { RowDataPacket } from 'mysql2'
import { pool } from './db'
import type { Product, ProductCategory, ProductVariant } from './types/product'

interface ProductRow extends RowDataPacket {
  id: number
  name: string
  description: string
  price: string
  price_after_discount: string | null
  discount: number | null
  image: string | null
  category: ProductCategory
  required: number
}

interface VariantRow extends RowDataPacket {
  product_id: number
  variant_id: number
  name: string
  img: string
}

const PRODUCT_COLUMNS =
  'id, name, description, price, price_after_discount, discount, image, category, required'

const mapProduct = (row: ProductRow, variants: ProductVariant[]): Product => {
  const product: Product = {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    required: Boolean(row.required),
  }

  if (row.price_after_discount != null)
    product.priceAfterDiscount = Number(row.price_after_discount)
  if (row.discount != null) product.discount = row.discount
  if (row.image) product.image = row.image
  if (variants.length) product.variants = variants

  return product
}

const loadVariants = async (
  productIds: number[],
): Promise<Map<number, ProductVariant[]>> => {
  const byProduct = new Map<number, ProductVariant[]>()
  if (productIds.length === 0) return byProduct

  const placeholders = productIds.map(() => '?').join(', ')
  const [rows] = await pool.query<VariantRow[]>(
    `SELECT product_id, variant_id, name, img
       FROM product_variants
      WHERE product_id IN (${placeholders})
      ORDER BY product_id, variant_id`,
    productIds,
  )

  for (const row of rows) {
    const list = byProduct.get(row.product_id) ?? []
    list.push({ id: row.variant_id, name: row.name, img: row.img })
    byProduct.set(row.product_id, list)
  }

  return byProduct
}

const attachVariants = async (rows: ProductRow[]): Promise<Product[]> => {
  const variantsByProduct = await loadVariants(rows.map((row) => row.id))
  return rows.map((row) => mapProduct(row, variantsByProduct.get(row.id) ?? []))
}

export const getProductsByCategory = async (
  category: ProductCategory,
): Promise<Product[]> => {
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM products WHERE category = ? ORDER BY id`,
    [category],
  )
  return attachVariants(rows)
}

export const getAllProducts = async (): Promise<Product[]> => {
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY id`,
  )
  return attachVariants(rows)
}

export const getProductById = async (
  id: number,
): Promise<Product | undefined> => {
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`,
    [id],
  )
  if (rows.length === 0) return undefined
  const [product] = await attachVariants(rows)
  return product
}
