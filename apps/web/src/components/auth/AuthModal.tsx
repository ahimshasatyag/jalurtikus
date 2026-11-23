import React, { useState } from 'react';
import { X, Lock, Mail, User, Bike, Car, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, isLoading, error } = useAuthStore();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (isRegisterMode) {
        if (!fullName.trim()) {
          setFormError('Nama lengkap harus diisi.');
          return;
        }
        await register({ email, password, full_name: fullName, vehicle_type: vehicleType });
      } else {
        await login({ email, password });
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Autentikasi gagal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-sm w-full p-6 text-left space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">
            {isRegisterMode ? 'Daftar Akun JalurTikus' : 'Masuk ke Akun'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(formError || error) && (
          <div className="p-2.5 rounded bg-traffic-heavy/20 border border-traffic-heavy/40 text-xs text-traffic-heavy">
            {formError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isRegisterMode && (
            <div>
              <label className="block font-medium text-text-secondary mb-1">Nama Lengkap</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  required
                  placeholder="Nama Anda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-text-secondary mb-1">Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-text-secondary" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-text-secondary mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-text-secondary" />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="block font-medium text-text-secondary mb-1">
                Preferensi Kendaraan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  className={`py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    vehicleType === 'motorcycle'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface-secondary border-border text-text-secondary'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" /> Motor
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  className={`py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    vehicleType === 'car'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface-secondary border-border text-text-secondary'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" /> Mobil
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-midnight-navy font-bold py-2.5 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>{isRegisterMode ? 'Daftar Sekarang' : 'Masuk'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setFormError(null);
            }}
            className="text-xs text-sky-blue hover:underline font-medium"
          >
            {isRegisterMode ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis'}
          </button>
        </div>
      </div>
    </div>
  );
};

