/**
 * Inline, pre-paint script: applies the persisted theme before first render (no flash).
 * The /showcase film is always rendered in the reference's light theme.
 */
export const THEME_SCRIPT = `try{if(!location.pathname.startsWith("/showcase")){var t=localStorage.getItem("71codes:theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;}}catch(e){}`;
