# 🎨 HealthHub Frontend - React Application

A modern, responsive React application for the HealthHub healthcare management platform, built with Vite, Tailwind CSS, and deployed on AWS CloudFront.

## 🚀 Live Application

- **Production URL**: https://d1l7hv4cljacb9.cloudfront.net
- **API Backend**: https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com

## 📁 Project Structure

```
health-hub-frontend/
├── 📂 src/
│   ├── 📂 components/         # Reusable UI components
│   │   ├── 📂 common/        # Shared components (Header, Footer, etc.)
│   │   ├── 📂 forms/         # Form components
│   │   ├── 📂 charts/        # Data visualization components
│   │   └── 📂 modals/        # Modal dialogs
│   ├── 📂 pages/             # Page components
│   │   ├── 📂 auth/          # Authentication pages
│   │   ├── 📂 dashboard/     # Dashboard pages
│   │   ├── 📂 patients/      # Patient management
│   │   ├── 📂 doctors/       # Doctor management
│   │   └── 📂 appointments/  # Appointment scheduling
│   ├── 📂 services/          # API service layer
│   ├── 📂 hooks/             # Custom React hooks
│   ├── 📂 utils/             # Utility functions
│   ├── 📂 styles/            # Global styles and Tailwind config
│   └── 📂 assets/            # Static assets (images, icons)
├── 📂 public/                # Public assets
├── 📄 package.json           # Dependencies and scripts
├── 📄 vite.config.js         # Vite configuration
└── 📄 tailwind.config.js     # Tailwind CSS configuration
```

## 🛠️ Technology Stack

### Core Technologies
- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework

### UI & UX Libraries
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons**: Beautiful hand-crafted SVG icons
- **React Router DOM**: Client-side routing
- **Framer Motion**: Smooth animations and transitions

### Data & State Management
- **Axios**: HTTP client with interceptors
- **React Query**: Server state management
- **Zustand**: Lightweight state management
- **React Hook Form**: Performant forms with validation

### Charts & Visualization
- **Recharts**: Composable charting library
- **D3.js**: Data-driven visualizations
- **Chart.js**: Simple yet flexible charting

### Development Tools
- **ESLint**: Code linting and quality
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates
- **Vitest**: Unit testing framework

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn package manager

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/healthhub.git
cd healthhub/health-hub-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## 🎨 Component Architecture

### Design System
The application follows a consistent design system with:
- **Color Palette**: Healthcare-focused color scheme
- **Typography**: Readable fonts optimized for medical content
- **Spacing**: Consistent spacing scale using Tailwind
- **Components**: Reusable, accessible components

### Component Hierarchy
```
App
├── Router
├── AuthProvider
├── ThemeProvider
└── Layout
    ├── Header
    │   ├── Navigation
    │   ├── UserMenu
    │   └── Notifications
    ├── Sidebar
    │   ├── MainNavigation
    │   └── QuickActions
    ├── Main Content
    │   └── Page Components
    └── Footer
```

## 📱 Key Features

### 🔐 Authentication & Authorization
- **Login/Register**: Secure user authentication
- **Role-Based Access**: Different interfaces for patients, doctors, admins
- **JWT Token Management**: Automatic token refresh
- **Protected Routes**: Route-level access control

### 📊 Dashboard & Analytics
- **Patient Dashboard**: Personal health overview
- **Doctor Dashboard**: Patient management and analytics
- **Admin Dashboard**: System-wide metrics and management
- **Real-time Updates**: Live data synchronization

### 👥 User Management
- **Profile Management**: User profile editing
- **Account Settings**: Preferences and security settings
- **Role Assignment**: Admin user role management
- **Activity Tracking**: User activity logs

### 🏥 Healthcare Features
- **Patient Records**: Comprehensive patient information
- **Appointment Scheduling**: Interactive calendar booking
- **Medical History**: Timeline view of medical records
- **Prescription Management**: Digital prescription handling

### 🤖 AI-Powered Features
- **Virtual Assistant**: Chat interface with AI assistant
- **Symptom Checker**: AI-powered symptom analysis
- **Medical Image Viewer**: Image analysis results display
- **Voice Transcription**: Audio transcription interface

## 🎯 Page Components

### Authentication Pages
```jsx
// Login page with form validation
<LoginPage>
  <LoginForm />
  <SocialLogin />
  <ForgotPassword />
</LoginPage>

// Registration with multi-step form
<RegisterPage>
  <StepIndicator />
  <PersonalInfo />
  <MedicalInfo />
  <Verification />
</RegisterPage>
```

### Dashboard Pages
```jsx
// Patient dashboard with health metrics
<PatientDashboard>
  <HealthMetrics />
  <UpcomingAppointments />
  <RecentActivity />
  <QuickActions />
</PatientDashboard>

// Doctor dashboard with patient overview
<DoctorDashboard>
  <PatientQueue />
  <TodaySchedule />
  <PerformanceMetrics />
  <RecentConsultations />
</DoctorDashboard>
```

### Management Pages
```jsx
// Patient management with search and filters
<PatientManagement>
  <SearchFilters />
  <PatientList />
  <PatientDetails />
  <MedicalHistory />
</PatientManagement>

// Appointment scheduling with calendar
<AppointmentScheduling>
  <CalendarView />
  <TimeSlots />
  <BookingForm />
  <ConfirmationModal />
</AppointmentScheduling>
```

## 🔧 Service Layer

### API Services
```javascript
// User authentication service
export const authService = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  refreshToken: () => api.post('/refresh-token'),
  logout: () => api.post('/logout')
};

// Patient management service
export const patientService = {
  getPatients: (params) => api.get('/patients', { params }),
  getPatient: (id) => api.get(`/patients/${id}`),
  createPatient: (data) => api.post('/patients', data),
  updatePatient: (id, data) => api.put(`/patients/${id}`, data),
  deletePatient: (id) => api.delete(`/patients/${id}`)
};

// Appointment service
export const appointmentService = {
  getAppointments: (params) => api.get('/appointments', { params }),
  bookAppointment: (data) => api.post('/appointments', data),
  rescheduleAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  cancelAppointment: (id) => api.delete(`/appointments/${id}`)
};
```

### HTTP Client Configuration
```javascript
// Axios configuration with interceptors
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiry
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 🎨 Styling & Theming

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        },
        healthcare: {
          blue: '#0066cc',
          green: '#00a86b',
          red: '#dc2626'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};
```

### Component Styling
```jsx
// Example styled component
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
```

## 📱 Responsive Design

### Breakpoint Strategy
```css
/* Mobile First Approach */
.container {
  @apply px-4;                    /* Mobile: 16px padding */
}

@screen sm {                      /* 640px+ */
  .container {
    @apply px-6;                  /* Tablet: 24px padding */
  }
}

@screen lg {                      /* 1024px+ */
  .container {
    @apply px-8;                  /* Desktop: 32px padding */
  }
}

@screen xl {                      /* 1280px+ */
  .container {
    @apply px-12;                 /* Large Desktop: 48px padding */
  }
}
```

### Mobile Optimization
- **Touch-Friendly**: Minimum 44px touch targets
- **Performance**: Optimized images and lazy loading
- **Navigation**: Mobile-first navigation patterns
- **Forms**: Mobile-optimized form inputs

## 🧪 Testing Strategy

### Unit Testing
```javascript
// Component testing with Vitest and React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing
```javascript
// API integration testing
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { usePatients } from './usePatients';

describe('usePatients Hook', () => {
  it('fetches patients successfully', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => usePatients(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

## 🚀 Deployment

### Build Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

### Environment Configuration
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3001
VITE_ENVIRONMENT=development
VITE_ENABLE_DEVTOOLS=true

# .env.production
VITE_API_BASE_URL=https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com
VITE_ENVIRONMENT=production
VITE_ENABLE_DEVTOOLS=false
```

### AWS Deployment
```bash
# Build for production
npm run build

# Deploy to S3
aws s3 sync dist/ s3://healthhub-frontend-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E3266EAF87XUR6 --paths '/*'
```

## 📈 Performance Optimization

### Code Splitting
```javascript
// Lazy loading for route components
import { lazy, Suspense } from 'react';

const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/patient" element={<PatientDashboard />} />
    <Route path="/doctor" element={<DoctorDashboard />} />
  </Routes>
</Suspense>
```

### Image Optimization
```jsx
// Responsive images with lazy loading
const OptimizedImage = ({ src, alt, className }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
};
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Check bundle composition
npx vite-bundle-analyzer dist
```

## 🔒 Security Features

### Content Security Policy
```html
<!-- CSP headers configured in CloudFront -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://m8vbgbh2hl.execute-api.us-east-1.amazonaws.com;">
```

### Input Sanitization
```javascript
// XSS protection utility
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// Usage in components
const SafeContent = ({ content }) => {
  const cleanContent = sanitizeHTML(content);
  return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />;
};
```

## 🤝 Contributing

### Development Workflow
1. **Fork Repository**: Create personal fork
2. **Feature Branch**: Create feature branch from `develop`
3. **Development**: Implement feature with tests
4. **Code Review**: Submit pull request for review
5. **Merge**: Merge to `develop` after approval

### Code Standards
- **ESLint**: Follow configured linting rules
- **Prettier**: Use consistent code formatting
- **TypeScript**: Add type definitions for new code
- **Testing**: Include unit tests for new components

### Commit Convention
```bash
feat: add patient appointment booking component
fix: resolve calendar date selection bug
docs: update component documentation
style: format code with prettier
refactor: optimize patient data fetching
test: add unit tests for appointment service
chore: update dependencies
```

---

**Note**: This frontend application is designed to work seamlessly with the HealthHub serverless backend and provides a modern, accessible interface for healthcare management.
