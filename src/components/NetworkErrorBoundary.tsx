import { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Warning, ArrowClockwise } from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Network Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message.includes('fetch') ||
                           this.state.error?.message.includes('Network') ||
                           this.state.error?.message.includes('connection');

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 text-center">
            <Warning className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isNetworkError ? 'Connection Error' : 'Something went wrong'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isNetworkError 
                ? 'Unable to connect to the movie database. Please check your internet connection and try again.'
                : 'An unexpected error occurred. Please refresh the page and try again.'
              }
            </p>
            <Button onClick={this.handleRetry}>
              <ArrowClockwise className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-muted-foreground mt-2 overflow-auto bg-muted/50 p-2 rounded">
                  {this.state.error?.message}
                  {this.state.errorInfo && `\n${this.state.errorInfo}`}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}