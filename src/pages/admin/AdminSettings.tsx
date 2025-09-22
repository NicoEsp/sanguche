import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, Shield, Mail, Globe, Users } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Configura aspectos generales del sistema ProductPrepa
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configuración de Base de Datos
            </CardTitle>
            <CardDescription>
              Gestiona configuraciones de la base de datos y backups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad y Permisos
            </CardTitle>
            <CardDescription>
              Configuraciones de seguridad y gestión de roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notificaciones por Email
            </CardTitle>
            <CardDescription>
              Configura plantillas y envío de emails automáticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Configuraciones generales de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Suscripciones
            </CardTitle>
            <CardDescription>
              Configura planes y precios de suscripción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Mantenimiento
            </CardTitle>
            <CardDescription>
              Herramientas de mantenimiento y monitoreo del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}