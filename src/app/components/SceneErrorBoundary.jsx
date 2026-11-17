import { Component } from 'react';
export default class SceneErrorBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError() {return {failed:true};}
  componentDidCatch(error) { this.props.onError?.(error); console.error('3D explorer unavailable:',error); }
  render() { return this.state.failed?this.props.fallback:this.props.children; }
}
