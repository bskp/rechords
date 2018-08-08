import Songs, {Song} from '../api/collections.js';
import * as React from 'react';

var Hypher = require('hypher'),
english = require('hyphenation.en-us'),
h = new Hypher(english);

var Parser = require("html-react-parser");

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

    let md = this.prependChord(this.props.md, node, '|');
    this.props.updateHandler(md);
  }


  public handleChordBlur(event : React.SyntheticEvent<HTMLElement>) {
    event.currentTarget.removeAttribute('data-initial');
    let chord = event.currentTarget.innerText;

    let i = event.currentTarget.parentElement;

    let md_ = this.removeChord(this.props.md, i);

    if (chord.replace(/\s/g, '').length > 0) {
      md_ = this.prependChord(md_, i, chord);
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


  public removeChord(md : string, node : Element) : string {
    let pos = this.localize(node);

    // Apply patch to markdown
    let verses : RegExp = /([^\n:]+): *\n((?:.+[^:] *\n)+)(?:\n+(?=(?:[^\n]+: *\n|\n|$))|$)/gi;
    // stolen from showdown-rechords.js:45

    // Iterate over verses
    let countedVerses : number = 0;
    md = md.replace(verses, (match:string, title:string, v:string) => {
      if (countedVerses++ == pos.verse) {
        var countedLetters = 0;

        v = v.replace(/([^\[]*)([^\]]*\])/g, (match, text, chord) => {
          countedLetters += text.replace(/\s/g, '').length;
          if (countedLetters == pos.letter) {
            countedLetters = Number.POSITIVE_INFINITY;
            return text;
          }
          return match;
        });
      };

      return title + ':\n' + v + '\n';
    });

    return md;
  }


  public prependChord(md : string, segment : Element, chord : string) : string {
    let pos = this.localize(segment);

    // Apply patch to markdown
    let verses : RegExp = /([^\n:]+): *\n((?:.+[^:] *\n)+)(?:\n+(?=(?:[^\n]+: *\n|\n|$))|$)/gi;
    // stolen from showdown-rechords.js:74

    // Iterate over verses
    let countedVerses : number = 0;
    md = md.replace(verses, (match:string, title:string, v:string) => {
      if (countedVerses++ == pos.verse) {

        // Iterate over letters in the appropriate verse
        let countedLetters : number = 0;
        let in_chord : boolean = false;
        v = v.replace(/\S/g, (l:string) => {
          if (l == ']' && in_chord) {
            in_chord = false;
            return l;
          }
          if (l == '[' && !in_chord) {
            in_chord = true;
            return l;
          }
          if (!in_chord && countedLetters++ == pos.letter) {
            return '[' + chord + ']' + l;
          }

          return l;
        });
      };

      return title + ':\n' + v + '\n';
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
      letter += segment.childNodes[segment.childNodes.length - 1].textContent.replace(/\s/g, '').length;
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

                    if (nextNotEmpty){
                      word += ' ';
                    } 
                    return <i key={idx}>{idx == 0 ? chord : undefined}{word}</i>
                  }
                )}
                </React.Fragment>
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
