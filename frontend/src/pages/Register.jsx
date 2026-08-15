import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', major: '', year: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div
            className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold mx-auto mb-3"
            aria-hidden="true"
          >
            SS
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1">
              Full name
            </label>
            <input
              id="reg-name"
              name="name"
              autoComplete="name"
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              aria-describedby="reg-password-hint"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p id="reg-password-hint" className="text-xs text-slate-500 mt-1">
              At least 6 characters.
            </p>
          </div>
          <div>
            <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 mb-1">
              I am a
            </label>
            <select
              id="reg-role"
              name="role"
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="advisor">Academic Advisor</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          {form.role === 'student' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-major" className="block text-sm font-medium text-slate-700 mb-1">
                  Major
                </label>
                <input
                  id="reg-major"
                  name="major"
                  className="input"
                  value={form.major}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="reg-year" className="block text-sm font-medium text-slate-700 mb-1">
                  Year
                </label>
                <select
                  id="reg-year"
                  name="year"
                  className="input"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                >
                  <option value="">Select</option>
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                  <option>Graduate</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading} aria-busy={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-sm text-center text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
