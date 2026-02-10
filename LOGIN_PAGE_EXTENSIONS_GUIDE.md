# Login Page - Developer's Guide for Extensions

This guide helps developers extend and customize the login page functionality.

---

## 🔧 Adding Custom Validation Rules

### Example: Add Phone Number Validation

#### Step 1: Update Register.jsx Form
```jsx
// In the form, add phone field:
<div className="form-group">
  <label htmlFor="phone">Phone Number</label>
  <div className="input-wrapper">
    <input
      type="tel"
      id="phone"
      name="phone"
      value={formData.phone}
      onChange={handleChange}
      placeholder="+1 (555) 123-4567"
    />
  </div>
  {errors.phone && (
    <span className="error-message field-error">{errors.phone}</span>
  )}
</div>
```

#### Step 2: Update formData State
```jsx
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',  // Add this
});
```

#### Step 3: Add Validation
```jsx
const validateForm = () => {
  const newErrors = {};
  // ... existing validations ...
  
  // Phone validation
  if (!formData.phone.trim()) {
    newErrors.phone = 'Phone number is required';
  } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) {
    newErrors.phone = 'Please enter a valid phone number';
  }
  
  return newErrors;
};
```

#### Step 4: Update API Call
```jsx
const response = await authAPI.register({
  name: formData.name.trim(),
  email: formData.email.trim(),
  phone: formData.phone.trim(),  // Add this
  password: formData.password,
});
```

---

## 🎨 Customizing Styles

### Change Primary Color
Replace all occurrences of `#667eea` with your color:

```css
/* Login.css & Register.css */
/* Old */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* New */
background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
```

### Add Dark Mode
```css
@media (prefers-color-scheme: dark) {
  .login-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .login-card {
    background: #2d2d2d;
    color: #f5f5f5;
  }
  
  .form-group label {
    color: #e0e0e0;
  }
}
```

### Custom Button Style
```css
.login-btn {
  /* Add border */
  border: 2px solid transparent;
  
  /* Change gradient */
  background: linear-gradient(135deg, #your-color 0%, #other-color 100%);
  
  /* Add shadow */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
```

---

## 🔌 Integrating OAuth/Social Login

### Step 1: Install OAuth Library
```bash
npm install @react-oauth/google
```

### Step 2: Update App.jsx
```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <Router>
        {/* Routes */}
      </Router>
    </GoogleOAuthProvider>
  );
}
```

### Step 3: Add Google Login Button
```jsx
import { GoogleLogin } from '@react-oauth/google';

// In Login.jsx form:
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
/>

// Handler function:
const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const response = await authAPI.loginWithGoogle(credentialResponse.credential);
    // Handle response same as regular login
  } catch (error) {
    setErrors({ general: 'Google login failed' });
  }
};
```

---

## 🔐 Adding Two-Factor Authentication

### Step 1: Create 2FA Component
```jsx
// src/components/TwoFactorAuth.jsx
import React, { useState } from 'react';

const TwoFactorAuth = ({ onVerify, email }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onVerify(code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="twofa-container">
      <h3>Enter Authentication Code</h3>
      <p>A code has been sent to {email}</p>
      <form onSubmit={handleVerify}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          maxLength="6"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  );
};

export default TwoFactorAuth;
```

### Step 2: Update Login Flow
```jsx
const [needsTwoFA, setNeedsTwoFA] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await authAPI.login(formData);
    
    if (response.data.requiresTwoFA) {
      // Save temp token and show 2FA form
      setNeedsTwoFA(true);
    } else {
      // Direct login
      handleLoginSuccess(response.data);
    }
  } catch (error) {
    // Handle error
  }
};

// Render 2FA component if needed
if (needsTwoFA) {
  return <TwoFactorAuth onVerify={handleTwoFAVerify} email={formData.email} />;
}
```

---

## 📧 Adding Email Verification

### Step 1: Create Verification Component
```jsx
const EmailVerification = ({ email, onResend }) => {
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  return (
    <div className="email-verification">
      <h3>Verify Your Email</h3>
      <p>We sent a code to {email}</p>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter 6-digit code"
      />
      <button onClick={() => handleVerify(code)}>Verify</button>
      <button 
        onClick={onResend} 
        disabled={timer > 0}
      >
        Resend Code {timer > 0 && `(${timer}s)`}
      </button>
    </div>
  );
};
```

### Step 2: Update Register.jsx
```jsx
const [verificationStep, setVerificationStep] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await authAPI.register(formData);
    setVerificationStep(true);
  } catch (error) {
    setErrors({ general: error.response?.data?.message });
  }
};

if (verificationStep) {
  return <EmailVerification email={formData.email} onResend={handleResendCode} />;
}
```

---

## 🔄 Implementing Remember Me

### Step 1: Create Utility Function
```jsx
// src/utils/auth.js
export const setRememberMe = (email) => {
  localStorage.setItem('rememberMe', JSON.stringify({
    email,
    timestamp: Date.now()
  }));
};

export const getRememberedEmail = () => {
  const data = localStorage.getItem('rememberMe');
  if (data) {
    const { email, timestamp } = JSON.parse(data);
    // Check if within 30 days
    if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
      return email;
    }
  }
  return null;
};

export const clearRememberMe = () => {
  localStorage.removeItem('rememberMe');
};
```

### Step 2: Update Login Component
```jsx
useEffect(() => {
  // Load remembered email
  const remembered = getRememberedEmail();
  if (remembered) {
    setFormData(prev => ({ ...prev, email: remembered }));
  }
}, []);

const handleSubmit = async (e) => {
  // ... validation ...
  
  if (rememberMe) {
    setRememberMe(formData.email);
  } else {
    clearRememberMe();
  }
  
  // ... login ...
};
```

---

## 🌐 Multi-Language Support

### Step 1: Create Translation Files
```jsx
// src/utils/translations.js
export const translations = {
  en: {
    login: {
      title: 'Welcome Back',
      subtitle: 'Sign in to your account',
      email: 'Email Address',
      password: 'Password',
      signin: 'Sign In',
      signup: 'Create one here',
    },
    register: {
      title: 'Create Account',
      subtitle: 'Join our community',
      name: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      confirm: 'Confirm Password',
      create: 'Create Account',
    },
  },
  es: {
    login: {
      title: 'Bienvenido',
      subtitle: 'Inicia sesión en tu cuenta',
      // ... Spanish translations ...
    },
  },
};
```

### Step 2: Create useTranslation Hook
```jsx
const useTranslation = (lang = 'en') => {
  return {
    t: (key) => {
      const keys = key.split('.');
      let value = translations[lang];
      for (let k of keys) {
        value = value[k];
      }
      return value;
    }
  };
};
```

### Step 3: Use in Components
```jsx
const { t } = useTranslation('en');

<h2>{t('login.title')}</h2>
<label>{t('login.email')}</label>
```

---

## 🚀 Performance Optimizations

### Code Splitting
```jsx
// src/App.jsx
import { lazy, Suspense } from 'react';

const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Routes */}
        </Routes>
      </Suspense>
    </Router>
  );
}
```

### Memoization
```jsx
import { memo } from 'react';

const Login = memo(({ onSuccess }) => {
  // Component code
});

export default Login;
```

### Debouncing Validation
```jsx
import { useCallback } from 'react';

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const validateEmail = useCallback(
  debounce((email) => {
    // Validation logic
  }, 500),
  []
);
```

---

## 🧪 Adding Unit Tests

### Install Testing Libraries
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Example Test
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';

describe('Login Component', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('validates empty email', async () => {
    render(<Login />);
    const button = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(button);
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<Login />);
    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: /show password/i });
    
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
  });
});
```

---

## 📱 Mobile Optimization

### Add Touch Optimization
```css
/* Increase tap target size for mobile */
@media (max-width: 768px) {
  button {
    min-height: 44px; /* iOS recommendation */
    min-width: 44px;
  }

  input {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
```

### Add Mobile-Specific Features
```jsx
// Remove password visibility toggle on mobile (security)
{!isMobile && (
  <button className="toggle-password">
    {showPassword ? '👁️' : '👁️‍🗨️'}
  </button>
)}
```

---

## 🔍 Debugging Tips

### Enable Debug Logs
```jsx
// src/utils/debug.js
export const debugLog = (message, data = null) => {
  if (process.env.DEBUG_MODE === 'true') {
    console.log(`[LOGIN] ${message}`, data);
  }
};
```

### Monitor API Calls
```jsx
api.interceptors.response.use(
  (response) => {
    debugLog('API Response', response);
    return response;
  },
  (error) => {
    debugLog('API Error', error);
    return Promise.reject(error);
  }
);
```

---

## 📊 Analytics Integration

```jsx
// Track login attempts
const trackLoginAttempt = (email, success) => {
  if (window.analytics) {
    window.analytics.track('login_attempt', {
      email,
      success,
      timestamp: new Date(),
    });
  }
};

// In Login component:
const handleSubmit = async (e) => {
  trackLoginAttempt(formData.email, false);
  try {
    // Login logic
    trackLoginAttempt(formData.email, true);
  } catch (error) {
    // Error handling
  }
};
```

---

## 🎓 Resources for Learning

- [React Documentation](https://react.dev)
- [React Router Guide](https://reactrouter.com/)
- [Form Validation Patterns](https://developer.mozilla.org/docs/Learn/Forms)
- [Authentication Best Practices](https://owasp.org/www-community/attacks/Credential_stuffing)
- [Web Accessibility](https://www.w3.org/WAI/)

---

**Last Updated**: January 27, 2026
**Version**: 1.0.0
