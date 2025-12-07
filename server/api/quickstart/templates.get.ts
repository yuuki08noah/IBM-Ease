import { defineEventHandler } from 'h3'
import { quickstartTemplates } from '../../utils/templates'

export default defineEventHandler(() => {
  return quickstartTemplates
})
