const light = {
  canvas: '#f7f8fa', surface: '#ffffff', 'surface-raised': '#edf0f4', overlay: '#17212b99',
  text: '#17212b', 'text-muted': '#586575', 'text-subtle': '#586575', 'text-inverse': '#ffffff',
  border: '#dce2e8', 'border-strong': '#a9b6c7', accent: '#305fe6', 'accent-hover': '#2149be',
  'accent-weak': '#e9eefb', 'accent-contrast': '#ffffff', focus: '#b56600',
  success: '#15803d', warning: '#a04b05', danger: '#c62525',
  'scene-background': '#e4eaf3', 'scene-shadow': '#17212b',
};
/** @typedef {{id:string,label:string,colorScheme:'light'|'dark',colors:Record<keyof typeof light,string>}} ThemeDefinition */
/** @type {ThemeDefinition[]} Add new palettes here; the selector and CSS are generated. */
export const themes = [
  { id:'light', label:'Light', colorScheme:'light', colors:light },
  { id:'dark', label:'Dark', colorScheme:'dark', colors:{
    canvas:'#111720', surface:'#19222e', 'surface-raised':'#253247', overlay:'#000000b3',
    text:'#eef2f8', 'text-muted':'#abb8ca', 'text-subtle':'#abb8ca', 'text-inverse':'#102044',
    border:'#344154', 'border-strong':'#62728b', accent:'#93b4ff', 'accent-hover':'#b4cbff',
    'accent-weak':'#1b2a45', 'accent-contrast':'#102044', focus:'#ffc766',
    success:'#79e5a0', warning:'#ffc766', danger:'#ff9696',
    'scene-background':'#171e2c', 'scene-shadow':'#000000',
  } },
];
export const themeStorageKey='portfolio-theme';
export function isThemePreference(value) { return value==='system'||themes.some(theme=>theme.id===value); }
function declarations(theme) { return `color-scheme:${theme.colorScheme};${Object.entries(theme.colors).map(([key,value])=>`--color-${key}:${value}`).join(';')}`; }
export const themeCss=`:root{${declarations(themes[0])}}\n`
  +themes.map(theme=>`:root[data-theme="${theme.id}"]{${declarations(theme)}}`).join('\n')
  +`\n@media(prefers-color-scheme:dark){:root:not([data-theme]){${declarations(themes.find(theme=>theme.id==='dark'))}}}`;
export const themeInitScript=`(()=>{const r=document.documentElement;r.dataset.themePreference='system';r.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()`;
