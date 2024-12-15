import { ParsedSong } from '@/api/collections'
import { ChordPdfJs } from '@/api/comfyPdfJs'
import { extractOrGuessKey } from '@/api/helpers'
import ChrodLib from '@/api/libchrod'
import { refPrefix } from 'showdown-rechords'
import { IPdfViewerSettings } from '../PdfSettings'

/**
 * 
 * @param vdom Dom Tree in format of showdown-rechord output
 * @param settings How to render
 * @param debug Print Debuglines for Columns?
 * @returns URL of the generated Blob
 */
export async function jsPdfGenerator(song: ParsedSong, settings: IPdfViewerSettings, debug = false): Promise<string> {

  if (!song)
    return



  /** font sizes  */
  const fos = settings.sizes

  // Hm. Reusing reactParser would make alot more sense...
  // But hey... here we are...
  // There is even a plugin to convert svg (notes + fret diagrams)
  // to PDF. However, if printing via CSS finally succeeds (2030 maybe ;-) )
  // this PDF rendering  will obliviate
  const mdHtml = new DOMParser().parseFromString(song.getHtml(), 'text/html')

  const libChrod = new ChrodLib()
  const key = extractOrGuessKey(song)

  const sections_ = mdHtml.body.children

  const sections: Element[] = []
  const lookupMap = new Map<string, Element>()
  for( const el of sections_ ) {
    if (el.tagName == 'SECTION') {
      lookupMap.set( el.id, el )
      sections.push(el); continue
    } if( el.classList.contains('ref') ) {

      const uuid = refPrefix + el.querySelector('strong').textContent.trim()
      const otherContent = el.childNodes[1]
      const content = lookupMap.get(uuid)
      if ( settings.inlineReferences && content ) { 
        const cloneContent = content.cloneNode(true) as Element
        if(otherContent) { 
          const addText = document.createElement('h4')
          addText.textContent = otherContent.textContent
          cloneContent.appendChild(addText)
        }
        sections.push(cloneContent) 
      } else {
        const section = document.createElement('section')
        const h3 = document.createElement('h3')
        h3.textContent = '|:'+el.textContent
        section.appendChild(h3)
        sections.push( section )
      }

    } else if (el.tagName == 'P') {
      sections.push(el)
    }
  }


  const cdoc = new ChordPdfJs({}, [settings.orientation, 'mm', 'a4'])

  const doc = cdoc.doc
  const cols = settings.numCols
  const colWidth = (cdoc.mediaWidth() - (cols - 1) * fos.gap) / cols

  let x0 = cdoc.margins.left

  await Promise.all([
    cdoc.addFontXhr('/fonts/Alegreya-Regular.ttf', 'Al', 'normal'),
    cdoc.addFontXhr('/fonts/Alegreya-Bold.ttf', 'Al', 'bold'),
    cdoc.addFontXhr('/fonts/Alegreya-Italic.ttf', 'Al', 'italic'),
    cdoc.addFontXhr('/fonts/Roboto_Condensed/RobotoCondensed-Light.ttf', 'RoCo', 'light'),
    cdoc.addFontXhr('/fonts/Roboto_Condensed/RobotoCondensed-Bold.ttf', 'RoCo', 'bold'),
    cdoc.addFontXhr('/fonts/Roboto_Condensed/RobotoCondensed-Regular.ttf', 'RoCo', 'normal')
  ])

  cdoc.chordFont = ['RoCo', 'bold', fos.chord]
  cdoc.textFont = ['Al', 'normal', fos.text]


  const songArtist = mdHtml.querySelector('.sd-header>h2')
  cdoc.setFont('RoCo', 'normal', fos.section)
  const dima = cdoc.textLine(songArtist.textContent)
  cdoc.cursor.y += fos.section / doc.internal.scaleFactor

  const songTitle = mdHtml.querySelector('.sd-header>h1')
  cdoc.setFont('RoCo', 'light', fos.header)
  const dimt = cdoc.textLine(songTitle.textContent)

  const header = { y: cdoc.cursor.y, x: x0 + Math.max(dima.w, dimt.w) }

  function placeFooter() {
    cdoc.setFont('RoCo', 'bold', fos.chord)
    doc.text(songTitle.textContent + ' - ' + songArtist.textContent, cdoc.margins.left + cdoc.mediaWidth() / 2, cdoc.maxY(), { align: 'center', baseline: 'top' })
  }
  placeFooter()

  for (const section of sections.values()) {
    // IDEA set Text without chords (not happeining now)
    // by deselecting chords


    const simHeight = placeSection(section, true)
    if (debug) {
      const y0 = cdoc.cursor.y
      doc.setDrawColor('green')
      doc.line(x0 - 1, y0, x0 - 1, y0 + simHeight)
    }

    if (cdoc.cursor.y + simHeight > cdoc.maxY()) {
      const c = cdoc.cursor
      const g = fos.gap
      x0 += colWidth + g
      cdoc.cursor.y = x0 > header.x ? cdoc.margins.top : header.y
      if (debug) {
        // doc.line(x0 - g, c.y, x0 - g, c.y + cdoc.mediaHeight())
        // doc.line(x0, c.y, x0, c.y + cdoc.mediaHeight())
      }
      if (x0 > cdoc.maxX()) {
        doc.addPage()
        x0 = cdoc.margins.left
        header.y = cdoc.margins.top
        placeFooter()
      }

    }

    if (debug) {
      const y0 = cdoc.cursor.y
      doc.setDrawColor('red')
      doc.line(x0, y0, x0, y0 + simHeight)
    }
    placeSection(section)
  }

  // to think about: instead of simulation flag simulation cursor. that 
  // would simplify everthingj
  function placeSection(section: Element, simulate = false): number {

    let advance_y = 0

    const lines = section.querySelectorAll('span.line')
    resetX()
    const lineHeight = fos.section * 2 / doc.internal.scaleFactor
    if (!cdoc.isTop()) {
      advance_y += lineHeight
      if (!simulate)
        cdoc.cursor.y += lineHeight // fonts are in point... 
    }

    cdoc.setFont('RoCo', 'bold', fos.section)
    advance_y += cdoc.textLine(section.querySelector('h3')?.innerText, simulate).h
    cdoc.setFont('RoCo', 'bold', fos.text)
    advance_y += cdoc.textLine(section.querySelector('h4')?.innerText, simulate).h

    for (const line of lines) {
      resetX()
      const chords = line.querySelectorAll('i')
      const fragments = Array.from(chords)
        .map(c => ({ 
          text: c.innerText, 
          chord: libChrod.transpose( c.dataset?.chord, key, settings.transpose )
        }))
      advance_y += cdoc.placeChords(fragments, colWidth, simulate).advance_y
    }

    if( settings.includeComments && section.tagName == 'P')
    {
      cdoc.setFont('Al', 'italic', fos.text)
      const texts: string[] = cdoc.doc.splitTextToSize(section.textContent, colWidth)
      advance_y += texts.map( l => cdoc.textLine(l, simulate).h )
        .reduce( (sum, current) => sum+current, 0 ) 
    }


    return advance_y




  }

  function placePageNumbers() {

    //@ts-ignore not yet added to types :( )
    const total = doc.getNumberOfPages()

    for (let i = 1; i <= total; i++) {
      doc.setPage(i)
      cdoc.setFont('RoCo', 'bold', fos.chord)
      doc.text(i + ' / ' + total, cdoc.margins.left + cdoc.mediaWidth(), cdoc.maxY(), { align: 'right', baseline: 'top' })
    }
  }

  placePageNumbers()

  // Save the Data
  const pdfData = doc.output('arraybuffer')
  const pdfBlobUrl = window.URL.createObjectURL(new Blob([pdfData], { type: 'application/pdf' }))
  return pdfBlobUrl

  function resetX() {
    cdoc.cursor.x = x0
  }
}