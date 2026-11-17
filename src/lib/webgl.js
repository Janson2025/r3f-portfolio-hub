const supportedDocuments=new WeakSet();
/** WebGL2 is required. Reuse a successful capability check across route changes. */
export function supportsWebGL(documentRef = document) {
  try {
    if(supportedDocuments.has(documentRef))return true;
    const canvas=documentRef.createElement('canvas');
    const gl=canvas.getContext('webgl2');
    if(!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    supportedDocuments.add(documentRef);
    return true;
  } catch {return false;}
}
