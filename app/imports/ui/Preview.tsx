import {Song} from '../api/collections';
import * as React from 'react';
import {Abcjs} from './Abcjs';
import Kord from './Kord';

import parse from 'html-react-parser';
import * as DH from 'domhandler';
import {DataNode} from 'domhandler';

import {verseRegex} from '../api/showdown-rechords';
import { Tablature } from 'abcjs';

const nodeText = (node) => {
  return node.children.reduce( (out, child) => out += child.type == 'text' ? child.data : nodeText(child), '' );
};

interface P {
  md: string;
  song: Song;
  updateHandler?: (md: string) => void;
}

export default class Preview extends React.Component<P, never> {
  private html: React.RefObject<HTMLElement>;

  constructor(props: P) {
    super(props);
    this.html = React.createRef();
  }

  componentDidUpdate() {
    const traverse = (node : HTMLElement): void => {
      for (const child of node.children) {
        if (child.innerHTML.endsWith('|')) {
          child.innerHTML = child.innerHTML.replace('|', '');
          const range = document.createRange();
          range.selectNodeContents(child);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        } else {
          traverse(child as HTMLElement);
        }
      }
    };

    traverse(this.html.current);
  }

  private chordProgressions(md : string) {
    const chords = new Array<Array<string>>();
    const verseNames = new Array<string>();
    md.replace(verseRegex, (match:string, title:string, v:string) => {
      const progression = new Array<string>();

      v.replace(/\[([^\]]*)]/g, (match, chord) => {
        progression.push(chord);
        return '';
      });

      chords.push(progression);
      verseNames.push(title);
      return '';
    });
    return {verseNames, chords};
  }

  public handleClick(event: React.MouseEvent<HTMLElement>) {
    const node: Element = event.target as Element;
    if (!(node instanceof HTMLElement) || node.tagName != 'I') return;

    let offset = 0;
    for (const child of node.children) {
      offset += 2;
      offset += this.textLen((child as HTMLElement)?.innerText);
    }

    let skipWhitespace = true;
    if (this.textLen(node.lastChild.textContent) == 0) {
      // if a last-of-line, fake-syllable was clicked, attach chord _before_ whitespace (ie. newline)
      offset = 0;
      skipWhitespace = false;
    }


    const {verse, letter, chord} = this.locate(node);
    const {verseNames, chords} = this.chordProgressions(this.props.md);
    const current_verse = verseNames[verse];

    let guessedChord;

    // Is there a previous verse with the same name? (e.g. "chorus")
    const first_index = verseNames.indexOf(current_verse);
    if (first_index < verse) {
      guessedChord = chords[first_index][chord];

    } else {
      // Is this verse numbered and we have a predecessor?
      const current_nr = parseInt(current_verse, 10);

      if (!isNaN(current_nr)) {
        const pred = (current_nr - 1).toString();
        const pred_idx = verseNames.indexOf(pred);
        if (pred_idx != -1) {
          guessedChord = chords[pred_idx][chord];
        }
      }
    }

    if (guessedChord === undefined) guessedChord = '';

    const md = this.prependChord(this.props.md, node, guessedChord + '|', offset, skipWhitespace);
    this.props.updateHandler(md);
  }


  public handleChordBlur(event : React.SyntheticEvent<HTMLElement>) {
    event.currentTarget.removeAttribute('data-initial');
    const chord = event.currentTarget.innerText;

    const i = event.currentTarget.parentElement;

    let md_ = this.removeChord(this.props.md, i);


    if (this.textLen(chord) > 0) {
      const skipWhitespace = this.textLen(event.currentTarget.nextSibling.textContent) > 0; // ie. a fakey chord
      md_ = this.prependChord(md_, i, chord, 0, skipWhitespace);
    }
    this.props.updateHandler(md_);

    // Remove any selections.
    if (window.getSelection) {
      console.log(window.getSelection);
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    }
  }

  public offsetChordPosition(event : React.SyntheticEvent<HTMLElement>, offset : number) {
    event.currentTarget.removeAttribute('data-initial');
    const chord = event.currentTarget.innerText;

    const i = event.currentTarget.parentElement;

    let md_ = this.removeChord(this.props.md, i);

    md_ = this.prependChord(md_, i, chord, offset, true);
    this.props.updateHandler(md_);
  }

  public handleChordKey(event : React.KeyboardEvent<HTMLElement>): void {
    const n = event.currentTarget;
    if (event.key == 'Enter') {
      event.preventDefault();
      n.blur();
      return;
    }

    if (event.key == 'Escape') {
      event.preventDefault();
      n.innerText = n.getAttribute('data-initial');
      n.blur();
      return;
    }

    if (event.shiftKey && event.key == 'ArrowRight') {
      this.offsetChordPosition(event, 1);
      event.preventDefault();
    }

    if (event.shiftKey && event.key == 'ArrowLeft') {
      this.offsetChordPosition(event, -1);
      event.preventDefault();
    }

    if (!n.hasAttribute('data-initial')) {
      n.setAttribute('data-initial', n.innerText);
    }

  }


  /*  Return the string's length omitting all whitespace.
   *  
   */
  private textLen(str : string) {
    if (str === undefined) return 0;
    return str.replace(/\s/g, '').length;
  }


  public removeChord(md : string, node : Element) : string {
    const pos = this.locate(node);
    // "pos" specifies where the chord to remove _begins_, expressed as "nth verse and mth letter".

    // Iterate over verses
    let countedVerses  = 0;
    md = md.replace(verseRegex, (match:string, title:string, v:string) => {
      if (countedVerses++ == pos.verse) {

        // Iterate over letters
        let countedLetters = 0;
        v = v.replace(/(\[[^\]]*])|([^[]*)/gm, (match, chord, lyrics) => {
          const adding = this.textLen(match);
          if (countedLetters == pos.letter) match = lyrics || '';  // retains line breaks.
          countedLetters += adding;
          return match;
        });
      }

      return title + ':\n' + v;
    });

    return md;
  }


  public prependChord(
    md: string,
    segment: Element,
    chord: string,
    offset = 0,
    skipWhitespace = true) : string {

    const pos = this.locate(segment);

    // Apply patch to markdown
    // Iterate over verses
    let countedVerses  = 0;
    md = md.replace(verseRegex, (match:string, title:string, v:string) => {
      if (countedVerses++ == pos.verse) {

        // Iterate over letters in the appropriate verse
        let countedLetters : number = -offset;
        v = v.replace(/\S/g, (l:string) => {
          if (skipWhitespace) {
            if (countedLetters++ == pos.letter) {
              return '[' + chord + ']' + l;
            }
          } else {
            if (++countedLetters == pos.letter) {
              return l + '[' + chord + ']';
            }
          }

          return l;
        });
      }

      return title + ':\n' + v;
    });

    return md;
  }


  locate(segment : Element) {
    if (segment.tagName != 'I') {
      throw('Illegal argument: invoke locate() with a <i>-element');
    }

    // Count letters between clicked syllable and preceding h3 (ie. verse label)
    let letter  = 0;
    let chord  = 0;
    let section : HTMLElement;

    for(;;) {
      if (segment.previousElementSibling != null) {
        segment = segment.previousElementSibling;
      } else {
        // reached the start of the current line
        let line = segment.parentElement;

        if (line.previousElementSibling != null) {
          // go to preceding line
          line = line.previousElementSibling as HTMLElement;
        } else {
          // this was the last line of the paragraph. 
          const wrapping_div = line.parentElement.parentElement as HTMLElement;
          if (wrapping_div.previousElementSibling == null) {
            section = wrapping_div.parentElement;
            break;  // done with letter counting. 
          }
          else {
            line = wrapping_div.previousElementSibling.lastElementChild.lastElementChild as HTMLElement;
          }
        }
        if (line.childElementCount == 0) {
          line = line.previousElementSibling as HTMLElement;
        }
        segment = line.lastElementChild;
      }
       
      // Count letters in this segment
      for (const node of segment.childNodes) {
        if (node.nodeName == '#text') {
          letter += node.textContent.replace(/\s/g, '').length;
          continue;
        }
        if (node.nodeName == 'SPAN' && (node as HTMLSpanElement).className == 'before') {
          letter += 2;
          letter += this.textLen(node.textContent);
          chord += 1;

        }
      }
    }
    // Count sections up to the current paragraph
    let verse  = 0;
    while (section.previousElementSibling != null) {
      section = section.previousElementSibling as HTMLElement;
      if (section.id.startsWith('sd-ref-')) {
        verse++;
      }
    }

    return {
      letter: letter,
      verse: verse,
      chord: chord
    };
  }


  render() {
    this.props.song.parse(this.props.md);

    const vdom = parse(this.props.song.getHtml(), {replace: (domNode) => {
      if(DH.isTag(domNode)) {
        const node = domNode as DH.Element;
        if (node.name == 'i') {
          let chord;
          if ('data-chord' in node.attribs) {
            chord = <span 
              className="before"
              contentEditable={true}
              suppressContentEditableWarning
              onBlur={this.handleChordBlur.bind(this)}
              onKeyDown={this.handleChordKey.bind(this)}
            >{node.attribs['data-chord']}</span>;
          }
          if (!('data' in node.children[0])) return node;
          const lyrics = nodeText(node);

          return <React.Fragment>
            {lyrics.split(' ').map((word, idx, array) => {
              if (word == '') return ' ';

              const isLast = idx == array.length - 1;
              const nextNotEmpty = !isLast && array[idx + 1].length > 0;

              let classes = '';
              if (idx == 0) {
                if ('data-chord' in node.attribs) {
                  classes += 'hasChord ';
                }
                classes += node.attribs.class || '';
              }

              if (nextNotEmpty){
                word += ' ';
              } 
              return <i key={idx} className={classes}>{idx == 0 ? chord : undefined}{word}</i>;
            }
            )}
          </React.Fragment>;
        }
        else if (node.name == 'span' && 'attribs' in node && 'class' in node.attribs && 'line' == node.attribs.class) {
          // Fakey syllable to allow appended chords
          node.children.push(<i>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</i>);

        }
        else if (node.name == 'pre') {
          if (node.children.length != 1) return node;
          const code = node.children[0] as DH.Element;
          if (!('class' in code.attribs)) return node;
          const classes = code.attribs['class'];
          if (!(classes.includes('language-abc'))) return node;
          if (code.children.length != 1) return node;
          let tablature: Tablature[] = []
          if(classes.includes('tab')) {
            tablature.push({instrument: 'guitar'})
          }
          const abc = (code.children[0] as DH.DataNode).data;

          return <Abcjs
            abcNotation={abc}
            params={{ responsive: 'resize', tablature }}
          />;
        }
        else if (node.name == 'abbr') {
          return <span className='chord-container'>
            <strong>{(node.firstChild as DataNode).data}</strong>
            <Kord frets={node.attribs.title} fingers={node.attribs['data-fingers']} />
          </span>;
        }
      }
      return domNode;
    }});

    return (
      <div className="content" id="chordsheet">
        <section
          className="interactive"
          id="chordsheetContent"
          onClick={this.handleClick.bind(this)}
          ref={this.html}>
          {vdom}
        </section>
      </div>
    );
  }
}
