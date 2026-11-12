import { z } from 'zod'
import { MAX_ADDRESS_INPUT_LENGTH } from '@shared/ipc'

/**
 * Argument schemas for every IPC channel. Each schema validates the full
 * argument list, so extra or missing arguments are rejected too.
 */

const addressInput = z
  .string()
  .max(MAX_ADDRESS_INPUT_LENGTH)
  // No control characters (newlines, NUL, ...) in an address.
  .refine((value) => !/\p{Cc}/u.test(value), 'Control characters are not allowed')
  .refine((value) => value.trim().length > 0, 'Address must not be empty')

export const navigateArgs = z.tuple([addressInput])
export const noArgs = z.tuple([])
