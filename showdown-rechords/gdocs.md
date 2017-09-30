Unterschiede zu Markdown:
Blöcke mit “:” bis “\n\n”
Links ohne Ziel sind Akkorde
“%”-Zeilen sind Akkord-Zeilen und nehmen Greedy die nächste Zeile mit
#Wort ist verschlagwortung
#Scale gibt Hinweis auf Tonart
Akkordzeile kann Schläge anzeigen (auch koppeln!)
Textzeile kann Slurs: xxx_xxx
 Akkorde sind einfach Links ohne Ziel



Parsbaum (bzw Showdown Extensions)
Erste Aufteilung (Global)
^\w+:(!=\n\n)+\n\n Blöcke
^%.+\n.*\n AkkordZeile + Nächste Zeile

http://www.songnotes.cc
http://coolwanglu.github.io/vim.js/emterpreter/vim.html
http://showdownjs.github.io/demo/




Home
Edward Sharpe & the Magnetic Zeroes
===================================

#2009
#4/4

Chords (scheiss aufwändig?)
------

[amsus2]:
     ^  ^^  
    ||||||
    ||oo||
    ||||||

[D/F#]:
      ^
    ||||||
    o||o|o
    ||||o|

Tabs
------
```
// ui näi lieber nöd

Intro:

Bm . . . D  . . . D  . . . G  . . . 
|--------|--------|--------|--------|
|--------|--------|--------|--------|
|--------|--------|------2-|--------|
|-0-0-0-0|-7-7-7-7|-4-4-4-4|--------|
|2-2-2-2-|5-5-5-5-|5-5-5---|-2-2-2-2|
|--------|--------|--------|3-3-3-3-|

2x


Gekoppelte Akkord- und Textzeilen mit Rythmusangabe
----------------------


```
$ C .  .       .    E   .  .    . amsus2. . . "...
      This_is the first day of my life 
$ Fmaj7 .      .    . G    .    .    .  C   .. . "...
       I_swear I was born right in the doorway 
$ C .     .        .  E    .       .      .     am .
   I_went out in the rain suddenly everything changed 
$  ..       ". .  .  D. ..  ".   .  .G. . . "...
They're spreading blankets on the beach 


1:
(her)
% Bm  .   .   .  
  Alabama, Arkansas
% D     .       .      .
  I do love my ma and pa
-  "        .      .   .      G. ..
  Not the way that I do love you
    

(him)
       Bm   .    .     .
Well, holy moly me-ho-my
 D         .     .     .
You're the apple of my eye
 "          .     .    .         G. ..
Girl, I've never loved one like you

![refrain]
```


Akkorde und Text unabhängig
---------------------------

% C G F
% am E
[ C F am F ]
[ C dm F   ]

Please help me build a small boat 
One that'll ride on the flow 
Where the river runs deep and the larger fish creep 
I'm glad of what keeps me afloat 


Inline-Notation für Akkorde
---------------------------

Kehrreim:

1:
The wa[C]ter sustai[G]ns me withou[G]t even try[G]ing 
The wa[C]ter can't dro[G]wn me,
                           I'm do[am]ne 
With my dy[F]ing[C]

Anonym

ref:
The wa[C]ter sustai[G]ns me withou[G]t even try[G]ing 
The wa[C]ter can't dro[G]wn me, I'm do[am]ne
With my dy[F]ing[C]


[C]:
   lkjaöldjasdf

![Kehrreim]

// 
/* asdf */




