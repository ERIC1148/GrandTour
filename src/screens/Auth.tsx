import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Field } from '../components/ui';
import { useStore } from '../lib/store';

export function Auth() {
  const { signIn, signUp } = useStore();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim() || password.length < 6) {
      setError('请填写邮箱，密码至少 6 位。');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(email.trim(), password);
      } else {
        const msg = await signUp(email.trim(), password);
        if (msg) setNotice(msg);
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setError(
        /invalid login credentials/i.test(m)
          ? '邮箱或密码不对。'
          : /already registered/i.test(m)
            ? '这个邮箱已经注册过了，直接登录。'
            : m,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }}
        className="paper w-full max-w-[420px] overflow-hidden rounded-[30px] border border-[rgba(236,229,230,.08)] shadow-[0_24px_60px_rgba(0,0,0,.55)]"
      >
        <div className="px-8 pb-8 pt-10">
          <div className="font-display text-[42px] italic leading-none text-ink">
            Grand Tour
          </div>
          <div className="mt-3 text-[13px] leading-relaxed text-mute-2">
            住过的每一间房，都记在这本子里。
            <br />
            万豪 · 希尔顿 · 雅高 · 锦江
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <Field label="邮箱">
              <input
                className="field"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="密码">
              <input
                className="field"
                type="password"
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="至少 6 位"
              />
            </Field>
          </div>

          <AnimatePresence>
            {(error || notice) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="mt-4 rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed"
                  style={{
                    background: error ? 'rgba(190,90,90,.14)' : 'rgba(176,122,99,.16)',
                    color: error ? '#e6adad' : 'var(--color-brass-2)',
                  }}
                >
                  {error ?? notice}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button onClick={submit} disabled={busy} className="mt-6 w-full">
            {busy ? '…' : mode === 'in' ? '登录' : '注册'}
          </Button>

          <button
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in');
              setError(null);
              setNotice(null);
            }}
            className="mt-5 w-full text-center text-[12.5px] text-mute-3 transition-colors hover:text-brass-2"
          >
            {mode === 'in' ? '还没有账号？注册一个' : '已经有账号了，去登录'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
