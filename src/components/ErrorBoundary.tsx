import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error logged to state for display
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle>Algo salió mal</CardTitle>
              <CardDescription>
                Ha ocurrido un error inesperado. Intenta recargar la página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {this.state.error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer mb-2">Detalles técnicos</summary>
                  <code className="block whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </code>
                </details>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" size="sm">
                  Reintentar
                </Button>
                <Button onClick={this.handleReload} size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recargar página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}