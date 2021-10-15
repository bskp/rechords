# Font Preprocessing

Each font should be subset and minified specifically for its purpose.

- Visit [Font Squirrel](https://www.fontsquirrel.com/tools/webfont-generator)
- Use the webfont generator to subset and convert the fonts

After downloading the font package, 
- Move the font files to ``app/public/fonts``
- Copy and adapt the required @font-face definitions to ``app/client/fonts.less``
