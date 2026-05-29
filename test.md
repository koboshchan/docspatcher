# DocsPatcher Full Feature Test

## Headings

# Heading Level 1
## Heading Level 2
### Heading Level 3
#### Heading Level 4

## Inline Styles

Plain text line.

**Bold text**
*Italic text*
***Bold and italic text***
{u}Underlined text{/u}
{color:#0055aa}Colored text{/color}
{size:18}Large text{/size}

Mixed inline styles:
{color:#aa2200}**Bold + color**{/color}
{size:16}*Italic + size*{/size}
{u}{color:#008800}{size:14}Underline + color + size{/size}{/color}{/u}

## Escaped Literals

Use escaped markdown symbols literally:
\* not a list marker
\# not a heading marker
\{u\} not an underline tag \{/u\}
\[link-like\] \(text\)
Literal backslash: \\

## Unordered Lists

* Unordered level 0 with star
	* Unordered level 1 with star
		* Unordered level 2 with star
- Unordered level 0 with dash
	- Unordered level 1 with dash
		- Unordered level 2 with dash

## Ordered Lists

1. Ordered level 0
	1. Ordered level 1
		1. Ordered level 2
2. Ordered level 0 second item

## Mixed Lists

* Parent bullet
	1. Nested ordered under bullet
	2. Second nested ordered item
* Parent bullet second item
	* Nested bullet under bullet
		1. Deep mixed ordered item

## Styled List Items

* **Bold list item**
* *Italic list item*
* {u}Underlined list item{/u}
* {color:#663399}Colored list item{/color}
* {size:15}Sized list item{/size}

## Table

| Column A | Column B | Column C |
| :---- | :---- | :---- |
| Plain | **Bold** | *Italic* |
| {u}Underline{/u} | {color:#cc0000}Color{/color} | {size:16}Size{/size} |
| Escaped \| pipe | Text with \\ backslash | Final cell |

## Table Cell Backgrounds

| {cellbg:#ffd700}Gold | {cellbg:#00c8ff}Blue | {cellbg:#00e676}Green |
| :---- | :---- | :---- |
| {cellbg:#ff6b6b}Warning | Normal | {cellbg:#aa00ff}Purple |
| Multi-line<br>cell content | {cellbg:#ffe082}Yellow | Plain |

## Text Highlight

Plain text with {highlight:#ffff00}yellow highlight{/highlight} inline.

{highlight:#ff9999}A fully highlighted sentence.{/highlight}

Mixed: **Bold** and {highlight:#ccff90}**{highlight:#ccff90}bold highlighted{/highlight}** text.

Nested styles: {color:#0055aa}{highlight:#ffe0b2}Color and highlight together{/highlight}{/color}

## Merged Table Cells (Colspan)

| Header spans two cols | | Third col |
| :---- | :---- | :---- |
| {cellbg:#e3f2fd}Merged cell | | Side cell |
| A | B | C |

| Full-width header | | |
| :---- | :---- | :---- |
| One | Two | Three |

## Combined Block

#### Combined Formatting Demo

* {color:#0044cc}**Blue bold bullet**{/color}
	1. {size:13}Nested ordered size{/size}
	2. {u}Nested ordered underline{/u}
		* ***Deep mixed bold+italic***

## Highlight in Lists

* {highlight:#fff9c4}Highlighted list item{/highlight}
* Normal item with {highlight:#b2dfdb}mid-sentence highlight{/highlight} here
	1. {highlight:#ffccbc}Nested highlighted ordered item{/highlight}

## Table with Highlights and Backgrounds

| {cellbg:#263238}{color:#ffffff}Dark header{/color} | {cellbg:#263238}{color:#ffffff}Dark header 2{/color} |
| :---- | :---- |
| {highlight:#ffff8d}Highlighted cell text | Normal cell |
| {cellbg:#e8f5e9}Green bg | {cellbg:#fce4ec}Pink bg |

End of test file.
