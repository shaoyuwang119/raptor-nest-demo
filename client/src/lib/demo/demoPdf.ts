// PDF helpers for the demo build. The real app does this work on the
// Express server; the demo does the same steps in the browser with the
// same libraries (pdf-lib to build/merge, pdf.js to render previews).
import { PDFDocument, rgb, StandardFonts, type PDFPage } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

import '@/lib/pdf'

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 64

// Turns a list of note lines into a tidy notebook-style PDF
export async function makeNotePdf(opts: {
  title: string
  subject: string
  author: string
  lines: string[]
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const serif = await doc.embedFont(StandardFonts.TimesRoman)
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold)
  const sans = await doc.embedFont(StandardFonts.Helvetica)

  const ink = rgb(0.16, 0.2, 0.27)
  const muted = rgb(0.45, 0.5, 0.57)
  const accent = rgb(0.06, 0.46, 0.43)
  const ruleColor = rgb(0.82, 0.88, 0.93)
  const maxWidth = PAGE_W - MARGIN * 2

  let page: PDFPage
  let y = 0

  function newPage() {
    page = doc.addPage([PAGE_W, PAGE_H])
    // Faint ruled lines + margin line, like notebook paper
    for (let ly = PAGE_H - 96; ly > 40; ly -= 22) {
      page.drawLine({
        start: { x: 0, y: ly },
        end: { x: PAGE_W, y: ly },
        thickness: 0.5,
        color: ruleColor,
      })
    }
    page.drawLine({
      start: { x: MARGIN - 14, y: 0 },
      end: { x: MARGIN - 14, y: PAGE_H },
      thickness: 0.8,
      color: rgb(0.95, 0.7, 0.7),
    })
    y = PAGE_H - MARGIN
  }

  function wrap(text: string, font: typeof sans, size: number, width: number) {
    const words = text.split(' ')
    const out: string[] = []
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) > width && line) {
        out.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) out.push(line)
    return out
  }

  function ensureSpace(h: number) {
    if (y - h < MARGIN) newPage()
  }

  newPage()

  // Header
  for (const line of wrap(opts.title, serifBold, 24, maxWidth)) {
    page!.drawText(line, { x: MARGIN, y, size: 24, font: serifBold, color: ink })
    y -= 30
  }
  page!.drawText(`${opts.subject}  |  ${opts.author}`, {
    x: MARGIN,
    y,
    size: 11,
    font: sans,
    color: accent,
  })
  y -= 30

  for (const raw of opts.lines) {
    if (raw === '') {
      y -= 8
      continue
    }

    if (raw.startsWith('# ')) {
      ensureSpace(36)
      y -= 6
      page!.drawText(raw.slice(2), { x: MARGIN, y, size: 15, font: serifBold, color: accent })
      y -= 22
      continue
    }

    const isBullet = raw.startsWith('- ')
    const text = isBullet ? raw.slice(2) : raw
    const indent = isBullet ? 16 : 0
    const lines = wrap(text, serif, 12, maxWidth - indent)
    ensureSpace(lines.length * 17)

    lines.forEach((line, i) => {
      if (isBullet && i === 0) {
        page!.drawCircle({ x: MARGIN + 5, y: y + 4, size: 1.8, color: muted })
      }
      page!.drawText(line, { x: MARGIN + indent, y, size: 12, font: serif, color: ink })
      y -= 17
    })
  }

  return doc.save()
}

async function addFileToPdf(target: PDFDocument, file: File) {
  const bytes = await file.arrayBuffer()
  if (file.type === 'application/pdf') {
    const src = await PDFDocument.load(bytes)
    const pages = await target.copyPages(src, src.getPageIndices())
    pages.forEach((p) => target.addPage(p))
    return
  }
  const image =
    file.type === 'image/png' ? await target.embedPng(bytes) : await target.embedJpg(bytes)
  const page = target.addPage([image.width, image.height])
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
}

const ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg'])

export function findUnsupported(files: File[]) {
  return files.find((f) => !ALLOWED_TYPES.has(f.type))
}

// Same as POST /api/notes on the server: merge every upload into one PDF
export async function mergeUploads(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  for (const file of files) await addFileToPdf(merged, file)
  return merged.save()
}

type PageSpec =
  | { source: 'existing'; index: number }
  | { source: 'new'; fileIndex: number; pageIndex: number }

// Same as POST /api/notes/:id/edit on the server: rebuild the PDF from a
// list of existing pages and pages from newly uploaded files
export async function rebuildFromSpec(
  originalBytes: ArrayBuffer,
  spec: PageSpec[],
  files: File[]
): Promise<Uint8Array> {
  const original = await PDFDocument.load(originalBytes)
  const out = await PDFDocument.create()
  const loaded = new Map<number, PDFDocument>()

  for (const entry of spec) {
    if (entry.source === 'existing') {
      const [page] = await out.copyPages(original, [entry.index])
      out.addPage(page)
      continue
    }

    const file = files[entry.fileIndex]
    if (!file) throw new Error(`Missing uploaded file at index ${entry.fileIndex}`)

    if (file.type === 'application/pdf') {
      if (!loaded.has(entry.fileIndex)) {
        loaded.set(entry.fileIndex, await PDFDocument.load(await file.arrayBuffer()))
      }
      const [page] = await out.copyPages(loaded.get(entry.fileIndex)!, [entry.pageIndex])
      out.addPage(page)
    } else {
      await addFileToPdf(out, file)
    }
  }

  return out.save()
}

// Renders page 1 to a PNG, like the server's generatePreview
export async function renderPreview(bytes: Uint8Array): Promise<Blob> {
  // pdf.js takes ownership of the buffer it's given, so hand it a copy
  const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise
  const page = await pdf.getPage(1)
  const unscaled = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: 400 / unscaled.width })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d')!, canvas, viewport }).promise
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Preview failed'))), 'image/png')
  )
}
