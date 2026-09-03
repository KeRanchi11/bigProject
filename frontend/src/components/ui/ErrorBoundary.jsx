import { Component } from 'react';

// Catches render crashes (like the PalettePicker one) and shows a message
// instead of a white page. Persian RTL.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error('UI crash:', error);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="wrap py-10">
          <div className="card p-6 text-center">
            <h2 className="font-black text-lg mb-2">مشکلی در نمایش صفحه پیش آمد</h2>
            <p className="mut text-sm leading-7 mb-4" dir="ltr">{String(this.state.error.message || this.state.error)}</p>
            <button className="btn-acc" onClick={() => window.location.reload()}>بارگذاری دوباره</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
