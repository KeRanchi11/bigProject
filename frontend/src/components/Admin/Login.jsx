import { useState } from 'react';
import { api } from '../../lib/api';

export default function Login({ onOk, notify }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.login(username.trim() || 'admin', password);
      onOk();
    } catch (err) {
      notify(err.code === 'rate_limited' ? 'تلاش زیاد — یک دقیقه صبر کنید' : 'رمز اشتباه است');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="wrap py-10 max-w-md">
      <form onSubmit={submit} className="card p-6 grid gap-3">
        <h2 className="font-black text-xl">ورود مدیر</h2>
        <p className="mut text-sm leading-6">نشست امن با کوکی httpOnly. پس از نصب، رمز پیش‌فرض را عوض کنید.</p>
        <label className="text-sm">نام کاربری<input className="inp mt-1" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></label>
        <label className="text-sm">رمز عبور<input className="inp mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        <button className="btn-acc" disabled={busy}>{busy ? '…' : 'ورود'}</button>
      </form>
    </section>
  );
}
