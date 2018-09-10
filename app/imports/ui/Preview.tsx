import Songs, {Song} from '../api/collections.js';
import * as React from 'react';

var Hypher = require('hypher'),
english = require('hyphenation.en-us'),
h = new Hypher(english);

var Parser = require("html-react-parser");

// The almighty expression matching a verse. Stolen from showdown-rechords.js:48
const verseRegex = /(.*?): *\n((?:[^\n:<>]*\n)+)/gi;

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

  public handleClick(event: React.MouseEvent<HTMLElement>) {
    let node: Element = event.target as Element;
    if (!(node instanceof HTMLElement) || node.tagName != 'I') return;

    let offset = 0;
    for (let child of node.children) {
      offset += 2;
      offset += this.textLen(child.innerText);
    }

    let skipWhitespace = true;
    if (this.textLen(node.lastChild.textContent) == 0) {
      // if a last-of-line, fake-syllable was clicked, attach chord _before_ whitespace (ie. newline)
      offset = 0;
      skipWhitespace = false;
    }

    let md = this.prependChord(this.props.md, node, '|', offset, skipWhitespace);
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
    let pos = this.localize(node);
    // "pos" specifies where the chord to remove _begins_, expressed as "nth verse and mth letter".

    // Iterate over verses
    let countedVerses : number = 0;
    md = md.replace(verseRegex, (match:string, title:string, v:string) => {
      if (countedVerses++ == pos.verse) {

        // Iterate over letters
        var countedLetters = 0;
        v = v.replace(/(\[[^\]]*\])|([^\[]*)/g, (match) => {
          let adding = this.textLen(match);
          if (countedLetters == pos.letter) match = '';
          countedLetters += adding;
          return match;
        });
      };

      return title + ':\n' + v;
    });

    return md;
  }


  public prependChord(md : string, segment : Element, chord : string, offset = 0, skipWhitespace = true) : string {
    let pos = this.localize(segment);

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


  localize(segment : Element) {
    if (segment.tagName != 'I') {
      throw("Illegal argument: invoke localize() with a <i>-element");
    }

    // Count letters between clicked syllable and preceding h3 (ie. verse label)
    let letter : number = 0;
    let h3;

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
          // The element preceding it may either be another paragraph or a h3 / title
          let par_or_h3 = line.parentElement.previousElementSibling;
          if (par_or_h3 instanceof HTMLParagraphElement) {
            line = par_or_h3.lastElementChild as HTMLElement;
          } else {
            h3 = par_or_h3;
            break;
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
        if (node.nodeName == 'SPAN' && node.className == 'before') {
          letter += 2;
          letter += this.textLen(node.textContent);
          continue;
        }
      }
    }
    // Count h3-occurences up to the current paragraph
    let verse : number = 0;
    while (h3 != null) {
      h3 = h3.previousSibling as Element;
      if (h3 instanceof HTMLHeadingElement && h3.tagName == 'H3') {
        verse++;
      }
    }

    return {
      letter: letter,
      verse: verse
    };
  }


  render() {
    this.props.song.parse(this.props.md);

    let vdom = Parser(this.props.song.getHtml(), {replace: (node) => {
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
        return <React.Fragment>
                {node.children[0].data.split(' ').map((word, idx, array) => {
                    if (word == '') return ' ';
                    let isLast = idx == array.length - 1;
                    let nextNotEmpty = !isLast && array[idx + 1].length > 0;
                    let hasChord = idx == 0 && 'data-chord' in node.attribs ? 'hasChord' : '';

                    if (nextNotEmpty){
                      word += ' ';
                    } 
                    return <i key={idx} className={hasChord}>{idx == 0 ? chord : undefined}{word}</i>
                  }
                )}
                </React.Fragment>
      }
      else if (node.name == 'span' && 'attribs' in node && 'class' in node.attribs && 'line' == node.attribs.class) {
        // Fakey syllable to allow appended chords
        node.children.push(<i>      </i>);

      }
      return node;
    }});

    return (
      <section
        className="content interactive"
        id="chordsheet"
        onClick={this.handleClick.bind(this)}
        ref="html">

        {vdom}

      </section>
    )
  }
}
