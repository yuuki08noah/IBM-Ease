import { defineEventHandler, readBody, createError } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { spawn } from 'node:child_process'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'

const TIMEOUT_MS = 30000
const MAX_OUTPUT_LENGTH = 50000

interface ExecuteRequest {
  code: string
  language: 'javascript' | 'python'
  labId?: string
  stepId?: number
  env?: Record<string, string>
}

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const body = await readBody<ExecuteRequest>(event)

  if (!body.code || !body.language) {
    throw createError({ statusCode: 400, statusMessage: 'Missing code or language' })
  }

  const sessionId = randomBytes(16).toString('hex')
  const sandboxDir = join(tmpdir(), 'ibm-ease-sandbox', user.id, sessionId)

  try {
    await mkdir(sandboxDir, { recursive: true })

    let filename: string
    let command: string
    let args: string[]

    if (body.language === 'javascript') {
      filename = join(sandboxDir, 'script.js')
      await writeFile(filename, body.code, 'utf-8')
      command = 'node'
      args = ['--max-old-space-size=128', filename]
    } else if (body.language === 'python') {
      filename = join(sandboxDir, 'script.py')
      await writeFile(filename, body.code, 'utf-8')
      command = 'python3'
      args = ['-u', filename]
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Unsupported language' })
    }

    const result = await executeInSandbox(command, args, sandboxDir, body.env || {})


    await cleanup(sandboxDir)

    return {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      sessionId
    }
  } catch (err: any) {
    await cleanup(sandboxDir)
    throw createError({
      statusCode: 500,
      statusMessage: 'Execution failed',
      data: err.message
    })
  }
})

async function executeInSandbox(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string> = {}
): Promise<{ success: boolean; output: string; error?: string; executionTime: number }> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let killed = false

    const proc = spawn(command, args, {
      cwd,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'sandbox',
        HOME: cwd,
        NODE_PATH: process.env.NODE_PATH || join(process.cwd(), 'node_modules'),
        // Inject API keys for labs
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
        WATSON_API_KEY: process.env.WATSON_API_KEY,
        WATSON_API_URL: process.env.WATSON_API_URL,
        CLOUDANT_URL: process.env.CLOUDANT_URL,
        CLOUDANT_API_KEY: process.env.CLOUDANT_API_KEY,
        IAM_API_KEY: process.env.IAM_API_KEY,
        ...env
      },
      timeout: TIMEOUT_MS
    })

    const timeoutId = setTimeout(() => {
      killed = true
      proc.kill('SIGTERM')
      setTimeout(() => proc.kill('SIGKILL'), 1000)
    }, TIMEOUT_MS)

    proc.stdout?.on('data', (data) => {
      stdout += data.toString()
      if (stdout.length > MAX_OUTPUT_LENGTH) {
        killed = true
        proc.kill('SIGTERM')
      }
    })

    proc.stderr?.on('data', (data) => {
      stderr += data.toString()
      if (stderr.length > MAX_OUTPUT_LENGTH) {
        killed = true
        proc.kill('SIGTERM')
      }
    })

    proc.on('close', (code) => {
      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime

      if (killed) {
        resolve({
          success: false,
          output: stdout.slice(0, MAX_OUTPUT_LENGTH),
          error: 'Execution timeout or output limit exceeded',
          executionTime
        })
        return
      }

      if (code === 0) {
        resolve({
          success: true,
          output: stdout.slice(0, MAX_OUTPUT_LENGTH),
          executionTime
        })
      } else {
        resolve({
          success: false,
          output: stdout.slice(0, MAX_OUTPUT_LENGTH),
          error: stderr.slice(0, MAX_OUTPUT_LENGTH) || `Process exited with code ${code}`,
          executionTime
        })
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timeoutId)
      resolve({
        success: false,
        output: stdout,
        error: err.message,
        executionTime: Date.now() - startTime
      })
    })
  })
}

async function cleanup(dir: string) {
  try {
    const { rm } = await import('node:fs/promises')
    await rm(dir, { recursive: true, force: true })
  } catch {
    // ignore cleanup errors
  }
}
