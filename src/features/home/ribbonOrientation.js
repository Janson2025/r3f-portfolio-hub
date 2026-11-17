import { Quaternion,Vector3 } from 'three';
/** Generic placement frames; the renderer does not know individual model IDs. */
export function orientationQuaternion(transform,cameraQuaternion,tangent,target=new Quaternion()){
 if(transform.orientation==='camera')return target.copy(cameraQuaternion);
 if(transform.orientation==='path'){
  const forward=new Vector3().fromArray(transform.forwardAxis),direction=new Vector3().fromArray(tangent);
  if(forward.lengthSq()<.000001)forward.set(1,0,0);
  return direction.lengthSq()>.000001?target.setFromUnitVectors(forward.normalize(),direction.normalize()):target.identity();
 }
 return target.identity();
}
