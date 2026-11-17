import {Component} from 'react';
export default class AppErrorBoundary extends Component{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 componentDidCatch(error){console.error('Portfolio could not render:',error);}
 render(){return this.state.failed?<main className="portfolio-container portfolio-page"><h1>That view could not load.</h1><p>Your projects and product links are still available after restarting this view.</p><button className="portfolio-button" onClick={()=>window.location.reload()}>Reload portfolio</button></main>:this.props.children;}
}
