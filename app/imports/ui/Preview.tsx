import Songs, {Song} from '../api/collections.js';
import * as React from 'react';

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
        } else {
          traverse(child as HTMLElement);
        }
      }

    }

    traverse(html);

  }

  public handleClick(event: React.MouseEvent<HTMLElement>) {
    let node: Element = event.target as Element;
    if (!(node instanceof HTMLSpanElement) || node.className != 's') return;

    let md = this.prependChord(this.props.md, node, '|');
    this.props.updateHandler(md);
  }

  public removeChord(md : string, node : Element) : string {
    // Count chords between clicked chord and preceding h3 (ie. verse label)
    let chordIdx : number = 0;

    while(true) {
      if (node.previousElementSibling == null) {
        let par_or_h3 = node.parentElement.previousElementSibling;
        if (par_or_h3 instanceof HTMLParagraphElement) {
          node = par_or_h3.lastElementChild;
        } else {
          node = par_or_h3;
          break;
        }
      }

      node = node.previousElementSibling;
      if (node.className == 'chord') {
        chordIdx++;
      }
    }

    // Count h3-occurences up to the current paragraph
    let verse : number = 0;
    while (node != null) {
      node = node.previousSibling as Element;
      if (node instanceof HTMLHeadingElement && node.tagName == 'H3') {
        verse++;
      }
    }

    // Apply patch to markdown
    let verses : RegExp = /([^\n:]+): *\n((?:.+[^:] *\n)+)(?:\n+(?=(?:[^\n]+: *\n|\n|$))|$)/gi;
    // stolen from showdown-rechords.js:74

    // Iterate over verses
    let countedVerses : number = 0;
    md = md.replace(verses, (match:string, title:string, v:string) => {
      if (countedVerses++ == verse) {

        // Iterate over chord in the appropriate verse
        let countedChords : number = 0;
        v = v.replace(/\[.*?\]/g, (c : string) => {
          if (countedChords++ == chordIdx) {
            return '';
          }
          return c;
        });
      };

      return title + ':\n' + v + '\n';
    });

    return md;
  }


  public prependChord(md : string, node : Element, chord : string, consume : number = 0) : string {
    // Count letters between clicked syllable and preceding h3 (ie. verse label)
    let letter : number = 0;

    while(true) {
      if (node.previousElementSibling == null) {
        let par_or_h3 = node.parentElement.previousElementSibling;
        if (par_or_h3 instanceof HTMLParagraphElement) {
          node = par_or_h3.lastElementChild;
          letter += node.innerHTML.trim().length;
        } else {
          node = par_or_h3;
          break;
        }
      }

      node = node.previousElementSibling;
      if (node.className == 's') {
        letter += node.innerHTML.trim().length;
      }
    }

    // Count h3-occurences up to the current paragraph
    let verse : number = 0;
    while (node != null) {
      node = node.previousSibling as Element;
      if (node instanceof HTMLHeadingElement && node.tagName == 'H3') {
        verse++;
      }
    }

    // Apply patch to markdown
    let verses : RegExp = /([^\n:]+): *\n((?:.+[^:] *\n)+)(?:\n+(?=(?:[^\n]+: *\n|\n|$))|$)/gi;
    // stolen from showdown-rechords.js:74

    // Iterate over verses
    let countedVerses : number = 0;
    md = md.replace(verses, (match:string, title:string, v:string) => {
      if (countedVerses++ == verse) {

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
          if (!in_chord && countedLetters++ == letter) {
            return '[' + chord + ']' + l;
          }

          return l;
        });
      };

      return title + ':\n' + v + '\n';
    });

    return md;
  }

  private replace(md : string, chord : HTMLSpanElement, content : string) : string {

    let md_ = this.removeChord(this.props.md, chord);
    if (content.length > 0) {
      md_ = this.prependChord(md_, chord, content);
    }
    return md_;
  }

  public handleChordBlur(event : React.SyntheticEvent<HTMLSpanElement>) {
    let md_ = this.replace(this.props.md, event.currentTarget, event.currentTarget.innerText);
    this.props.updateHandler(md_);
  }
  
  public handleChordKeyPress(event : React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key == 'Enter') {
      window.getSelection().removeAllRanges();
      event.currentTarget.blur();
      return;
    }

    /*
    if (event.key == 'Tab') {
      event.preventDefault();

      let next = event.currentTarget.nextElementSibling;
      // next is on span.chord now.

      do {
        if (next.nextElementSibling != null) {
          // next has sibling
          next = next.nextElementSibling;
          continue;
        }

        if (next instanceof HTMLParagraphElement) {
          // next is <p>
          next = next.firstElementChild;
          continue;
        } 

        if (next.nextSibling == null && next.parentElement.nextElementSibling != null) {
          // next has no sibling, but next's parent has a sibling (typically <h3>)
          next = next.parentElement.nextElementSibling;
        }

      } while (next.className != 's' && next.className != 'chord');


      if (next.className == 's') {
        let md = this.replace(this.props.md, event.currentTarget, event.currentTarget.innerText);
        md = this.prependChord(md, next, '|');
        this.props.updateHandler(md);
        return;
      } 
      
      if (next.className == 'chord') {
        let chord = next as HTMLSpanElement;
        let md = this.replace(this.props.md, chord, chord.innerText + '|');
        this.props.updateHandler(md);
        return;
      }
    }
    */
  }

  render() {
    this.props.song.parse(this.props.md);

    let vdom = Parser(this.props.song.getHtml(), {replace: (node) => {
      if (node.attribs != undefined && node.attribs.class != undefined && node.attribs.class == 'chord') {
        let chord : string = node.children[0].data;
        return <span
            className='chord'
            contentEditable={true}
            onBlur={this.handleChordBlur.bind(this)}
            onKeyDown={this.handleChordKeyPress.bind(this)}
          >
            {chord}
        </span>;
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