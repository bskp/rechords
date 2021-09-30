import Songs, {Song} from '../api/collections';
import * as React from 'react';
import { Abcjs } from './Abcjs';
import Kord from './Kord';

var Hypher = require('hypher'),
english = require('hyphenation.en-us'),
h = new Hypher(english);

import parse from 'html-react-parser';
import * as DH from 'domhandler';
import { DataNode } from 'domhandler';

// The almighty expression matching a verse. Stolen from showdown-rechords.js:53
const verseRegex = /(.*?): *\n((?:[^\n<>]*[^\n:<>]+\n\n?)+)/gi;

const nodeText = (node) => {
  return node.children.reduce( (out, child) => out += child.type == "text" ? child.data : nodeText(child), "" )
}

interface P {
  md: string;
  song: Song;
  updateHandler?: Function;
}

export default class Preview extends React.Component<P, {}> {

  constructor(props: P) {
    super(props);
  }

  componentDidUpdate() {
    let html : HTMLElement = this.refs.html as HTMLElement;
    
    function traverse(node : HTMLElement) : void {
      for (const child of node.children) {
        if (child.innerHTML.endsWith('|')) {
          child.innerHTML = child.innerHTML.replace('|', '');
          let range = document.createRange();
          range.selectNodeContents(child);
          let sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        } else {
          traverse(child as HTMLElement);
        }
      }

    }

    traverse(html);

  }

  private chordProgressions(md : string) {
    let chords = new Array<Array<string>>();
    let verseNames = new Array<string>();
    md.replace(verseRegex, (match:string, title:string, v:string) => {
      let progression = new Array<string>();

      v.replace(/\[([^\]]*)\]/g, (match, chord) => {
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
    let node: Element = event.target as Element;
    if (!(node instanceof HTMLElement) || node.tagName != 'I') return;

    let offset = 0;
    for (let child of node.children) {
      offset += 2;
      offset += this.textLen((child as HTMLElement)?.innerText);
    }

    let skipWhitespace = true;
    if (this.textLen(node.lastChild.textContent) == 0) {
      // if a last-of-line, fake-syllable was clicked, attach chord _before_ whitespace (ie. newline)
      offset = 0;
      skipWhitespace = false;
    }


    let {verse, letter, chord} = this.locate(node);
    let {verseNames, chords} = this.chordProgressions(this.props.md);
    let current_verse = verseNames[verse];

    let guessedChord;

    // Is there a previous verse with the same name? (eg. "chorus")
    let first_index = verseNames.indexOf(current_verse);
    if (first_index < verse) {
      guessedChord = chords[first_index][chord];

    } else {
      // Is this verse numbered and we have a predecessor?
      let current_nr = parseInt(current_verse, 10);

      if (!isNaN(current_nr)) {
        let pred = (current_nr - 1).toString();
        let pred_idx = verseNames.indexOf(pred);
        if (pred_idx != -1) {
          guessedChord = chords[pred_idx][chord];
        }
      }
    }

    if (guessedChord === undefined) guessedChord = '';

    let md = this.prependChord(this.props.md, node, guessedChord + '|', offset, skipWhitespace);
    this.props.updateHandler(md);
  }


  public handleChordBlur(event : React.SyntheticEvent<HTMLElement>) {
    event.currentTarget.removeAttribute('data-initial');
    let chord = event.currentTarget.innerText;

    let i = event.currentTarget.parentElement;

    let md_ = this.removeChord(this.props.md, i);


    if (this.textLen(chord) > 0) {
      let skipWhitespace = this.textLen(event.currentTarget.nextSibling.textContent) > 0 // ie. a fakey chord
      md_ = this.prependChord(md_, i, chord, 0, skipWhitespace);
    }
    this.props.updateHandler(md_);

    // Remove any selections.
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
  }

  public offsetChordPosition(event : React.SyntheticEvent<HTMLElement>, offset : number) {
    event.currentTarget.removeAttribute('data-initial');
    let chord = event.currentTarget.innerText;

    let i = event.currentTarget.parentElement;

    let md_ = this.removeChord(this.props.md, i);

    md_ = this.prependChord(md_, i, chord, offset, true);
    this.props.updateHandler(md_);
  }

  public handleChordKey(event : React.KeyboardEvent<HTMLElement>) {
    let n = event.currentTarget;
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
    let pos = this.locate(node);
    // "pos" specifies where the chord to remove _begins_, expressed as "nth verse and mth letter".

    // Iterate over verses
    let countedVerses : number = 0;
    md = md.replace(verseRegex, (match:string, title:string, v:string) => {
      if (countedVerses++ == pos.verse) {

        // Iterate over letters
        var countedLetters = 0;
        v = v.replace(/(\[[^\]]*\])|([^\[]*)/gm, (match, chord, lyrics) => {
          let adding = this.textLen(match);
          if (countedLetters == pos.letter) match = lyrics || '';  // retains line breaks.
          countedLetters += adding;
          return match;
        });
      };

      return title + ':\n' + v;
    });

    return md;
  }


  public prependChord(md : string, segment : Element, chord : string, offset = 0, skipWhitespace = true) : string {
    let pos = this.locate(segment);

    // Apply patch to markdown
    // Iterate over verses
    let countedVerses : number = 0;
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
      };

      return title + ':\n' + v;
    });

    return md;
  }


  locate(segment : Element) {
    if (segment.tagName != 'I') {
      throw("Illegal argument: invoke locate() with a <i>-element");
    }

    // Count letters between clicked syllable and preceding h3 (ie. verse label)
    let letter : number = 0;
    let chord : number = 0;
    let section : HTMLElement;

    while(true) {

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
          let wrapping_div = line.parentElement.parentElement as HTMLElement;
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
          continue;
        }
      }
    }
    // Count sections up to the current paragraph
    let verse : number = 0;
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

    let vdom = parse(this.props.song.getHtml(), {replace: (domNode) => {
      if(DH.isTag(domNode)) {
        const node = domNode as DH.Element
      if (node.name == 'i') {
        let chord;
        if ('data-chord' in node.attribs) {
          chord = <span 
                className="before"
                contentEditable={true}
                suppressContentEditableWarning
                onBlur={this.handleChordBlur.bind(this)}
                onKeyDown={this.handleChordKey.bind(this)}
              >{node.attribs['data-chord']}</span>
        }
        if (!('data' in node.children[0])) return node;
        const lyrics = nodeText(node);

        return <React.Fragment>
                {lyrics.split(' ').filter(el => true).map((word, idx, array) => {
                    if (word == '') return ' ';

                    let isLast = idx == array.length - 1;
                    let nextNotEmpty = !isLast && array[idx + 1].length > 0;

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
                    return <i key={idx} className={classes}>{idx == 0 ? chord : undefined}{word}</i>
                  }
                )}
                </React.Fragment>
      }
      else if (node.name == 'span' && 'attribs' in node && 'class' in node.attribs && 'line' == node.attribs.class) {
        // Fakey syllable to allow appended chords
        node.children.push(<i>      </i>);

      }
      else if (node.name == 'pre') {
        if (node.children.length != 1) return node;
        let code = node.children[0] as DH.Element;
        if (!('class' in code.attribs)) return node;
        let classes = code.attribs['class'];
        if (!(classes.includes('language-abc'))) return node;
        if (code.children.length != 1) return node;
        let abc = (code.children[0] as DH.DataNode).data;

        return <Abcjs
          abcNotation={abc}
          engraverParams={{ responsive: 'resize' }}
        />
      }
      else if (node.name == 'abbr') {
        return <span className='chord-container'>
            <strong>{(node.firstChild as DataNode).data}</strong>
            <Kord frets={node.attribs.title} fingers={node.attribs['data-fingers']} />
          </span>
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
          ref="html">

          {vdom}
        </section>
      </div>
    )
  }
}
