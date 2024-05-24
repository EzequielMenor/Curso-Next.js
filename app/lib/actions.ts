'use server'

// Marcar que todas las funciones que se exportan en este archivo son de servidor y por lo tanto no se ejecuta ni se envia al cliente.

import { z } from 'zod'
import { Invoice } from './definitions'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
})

const CreateInvoice = FormSchema.omit({
  id: true,
  date: true,
})

const UpdateInvoice = FormSchema.omit({
  id: true,
  date: true,
})

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  // transformamos para evitar errores de redondeo
  const amountInCents = amount * 100
  // creamos la fecha actual 2024-5-23 <---
  const date = new Date().toISOString().split('T')[0]

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
  } catch (error) {
    return {
      message: 'Error Base de Datos: Fallo alcrear factura',
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  const amountInCents = amount * 100

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `
  } catch (error) {
    return {
      message: 'Error Base de Datos: Fallo alcrear factura',
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
  throw new Error('Fallo al eliminar factura')

  try {
    await sql`
    DELETE FROM invoices
    WHERE id = ${id}
    `
  } catch (error) {
    return {
      message: 'Error Base de Datos: Fallo alcrear factura',
    }
  }

  revalidatePath('/dashboard/invoices')
}
